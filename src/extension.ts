import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  BlockType,
  ConstructorBlock,
  DEFAULT_TITLES,
  createMarkdownContent,
  inferMarkdownFileName,
} from './markdown';
import { getWebviewHtml } from './webviewContent';

interface ConstructorMessage {
  type?: 'sync' | 'export' | 'open-file';
  blocks?: ConstructorBlock[];
  filePath?: string;
}

const DEFAULT_COLORS: Record<BlockType, string> = {
  agent: '#ff8f3f',
  skill: '#4db6ff',
  script: '#b36dff',
};

export function activate(context: vscode.ExtensionContext): void {
  const openCanvasCommand = vscode.commands.registerCommand('agentConstructor.openCanvas', async () => {
    const panel = vscode.window.createWebviewPanel(
      'agentConstructorCanvas',
      'Agent Constructor Canvas',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      },
    );

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const initialBlocks = workspaceFolder ? await loadWorkspaceBlocks(workspaceFolder) : [];
    panel.webview.html = getWebviewHtml(getNonce(), initialBlocks);

    panel.webview.onDidReceiveMessage(
      async (message: ConstructorMessage) => {
        if (message.type === 'open-file' && message.filePath) {
          await openWorkspaceFile(message.filePath);
          return;
        }

        if (!Array.isArray(message.blocks) || (message.type !== 'sync' && message.type !== 'export')) {
          return;
        }

        if (!workspaceFolder) {
          const text = 'Open a workspace folder before syncing constructor markdown files.';
          vscode.window.showErrorMessage(text);
          panel.webview.postMessage({ type: 'sync-result', text });
          return;
        }

        const summary = await syncBlocksToWorkspace(workspaceFolder, message.blocks);
        if (message.type === 'export') {
          vscode.window.showInformationMessage(summary);
          panel.webview.postMessage({ type: 'export-result', text: summary });
        } else {
          panel.webview.postMessage({ type: 'sync-result', text: summary });
        }
      },
      undefined,
      context.subscriptions,
    );
  });

  context.subscriptions.push(openCanvasCommand);
}

export function deactivate(): void {}

async function loadWorkspaceBlocks(workspaceFolder: vscode.WorkspaceFolder): Promise<ConstructorBlock[]> {
  const uris = await vscode.workspace.findFiles(
    '**/*.md',
    '**/{node_modules,.git,out}/**',
    400,
  );

  const entries: Array<{ block: ConstructorBlock; order: number; sourceFile: string }> = [];

  for (const uri of uris) {
    if (uri.scheme !== 'file') {
      continue;
    }

    const sourceFile = normalizeRelativePath(path.relative(workspaceFolder.uri.fsPath, uri.fsPath));
    if (!sourceFile || sourceFile.startsWith('..')) {
      continue;
    }

    const raw = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
    const parsed = parseMarkdown(raw);
    const inferredType = inferBlockType(sourceFile, parsed.frontmatter.type);
    const order = Number(parsed.frontmatter.order) || Number.MAX_SAFE_INTEGER;
    const title = (parsed.frontmatter.title || parsed.heading || '').trim();

    entries.push({
      order,
      sourceFile,
      block: {
        id: parsed.frontmatter.id?.trim() || createBlockId(sourceFile),
        type: inferredType,
        title,
        content: parsed.body.trim(),
        layer: (parsed.frontmatter.layer || 'default').trim(),
        color: (parsed.frontmatter.color || DEFAULT_COLORS[inferredType]).trim(),
        sourceFile,
        overuseOf: parsed.frontmatter.overuse_of?.trim(),
        uses: parseCsv(parsed.frontmatter.uses),
      },
    });
  }

  return entries
    .sort((a, b) => (a.order - b.order) || a.sourceFile.localeCompare(b.sourceFile))
    .map((entry) => ({
      ...entry.block,
      title: entry.block.title || DEFAULT_TITLES[entry.block.type],
    }));
}

async function syncBlocksToWorkspace(
  workspaceFolder: vscode.WorkspaceFolder,
  blocks: ConstructorBlock[],
): Promise<string> {
  const outputFolder = vscode.Uri.joinPath(workspaceFolder.uri, 'agent-constructor-output');
  await vscode.workspace.fs.createDirectory(outputFolder);

  const writes: Array<Thenable<void>> = [];
  const touchedPaths = new Set<string>();

  blocks.forEach((block, index) => {
    const relativePath = resolveOutputPath(block, index);
    if (!relativePath || touchedPaths.has(relativePath)) {
      return;
    }

    const uri = toWorkspaceUri(workspaceFolder, relativePath);
    if (!uri) {
      return;
    }

    touchedPaths.add(relativePath);

    const directory = vscode.Uri.file(path.dirname(uri.fsPath));
    const content = createMarkdownContent({
      ...block,
      title: block.title || DEFAULT_TITLES[block.type],
      sourceFile: relativePath,
    }, index);

    writes.push(
      vscode.workspace.fs.createDirectory(directory).then(() => vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'))),
    );
  });

  await Promise.all(writes);

  return touchedPaths.size
    ? `Synchronized ${touchedPaths.size} markdown file(s) from the constructor flow.`
    : 'Nothing to synchronize. Add blocks to create markdown files.';
}

function resolveOutputPath(block: ConstructorBlock, index: number): string {
  const cleanSource = normalizeRelativePath(block.sourceFile ?? '');
  if (cleanSource && !cleanSource.startsWith('..')) {
    return cleanSource;
  }

  return `agent-constructor-output/${inferMarkdownFileName(block, index)}`;
}

async function openWorkspaceFile(relativePath: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('Open a workspace folder before opening files from the constructor.');
    return;
  }

  const cleanPath = normalizeRelativePath(relativePath);
  if (!cleanPath) {
    vscode.window.showErrorMessage('Cannot open files outside of the current workspace.');
    return;
  }

  const fileUri = toWorkspaceUri(workspaceFolder, cleanPath);
  if (!fileUri) {
    vscode.window.showErrorMessage('Cannot open files outside of the current workspace.');
    return;
  }

  try {
    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);
  } catch {
    vscode.window.showErrorMessage(`File not found in workspace: ${cleanPath}`);
  }
}

function normalizeRelativePath(value: string): string {
  const normalized = path.posix
    .normalize(value.replace(/\\/g, '/').trim())
    .replace(/^\/+/, '');

  if (!normalized || normalized === '.' || normalized === '..') {
    return '';
  }

  if (normalized.startsWith('../') || normalized.includes('/../')) {
    return '';
  }

  return normalized;
}

function inferBlockType(filePath: string, explicitType?: string): BlockType {
  if (explicitType === 'agent' || explicitType === 'skill' || explicitType === 'script') {
    return explicitType;
  }

  const lower = filePath.toLowerCase();
  if (lower.includes('agent')) {
    return 'agent';
  }
  if (lower.includes('skill')) {
    return 'skill';
  }
  return 'script';
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMarkdown(raw: string): {
  frontmatter: Record<string, string>;
  body: string;
  heading: string;
} {
  const frontmatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const frontmatter: Record<string, string> = {};

  let body = raw;
  if (frontmatterMatch) {
    body = raw.slice(frontmatterMatch[0].length);
    frontmatterMatch[1].split('\n').forEach((line) => {
      const separator = line.indexOf(':');
      if (separator < 0) {
        return;
      }

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (key) {
        frontmatter[key] = value;
      }
    });
  }

  const headingMatch = body.match(/^#\s+(.+)$/m);
  return {
    frontmatter,
    body,
    heading: headingMatch?.[1]?.trim() ?? '',
  };
}

function createBlockId(sourceFile: string): string {
  return `block-${sourceFile.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function toWorkspaceUri(workspaceFolder: vscode.WorkspaceFolder, relativePath: string): vscode.Uri | undefined {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) {
    return undefined;
  }

  const workspaceRoot = path.resolve(workspaceFolder.uri.fsPath);
  const resolvedPath = path.resolve(workspaceRoot, normalized);
  const relative = path.relative(workspaceRoot, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return undefined;
  }

  return vscode.Uri.file(resolvedPath);
}

function getNonce(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 16 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}
