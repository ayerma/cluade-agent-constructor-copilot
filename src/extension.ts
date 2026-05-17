import * as vscode from 'vscode';
import { ConstructorBlock, generateMarkdownFiles } from './markdown';
import { getWebviewHtml } from './webviewContent';

export function activate(context: vscode.ExtensionContext): void {
  const openCanvasCommand = vscode.commands.registerCommand('agentConstructor.openCanvas', () => {
    const panel = vscode.window.createWebviewPanel(
      'agentConstructorCanvas',
      'Agent Constructor Canvas',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      },
    );

    panel.webview.html = getWebviewHtml(getNonce());

    panel.webview.onDidReceiveMessage(
      async (message: { type?: string; blocks?: ConstructorBlock[] }) => {
        if (message.type !== 'export' || !Array.isArray(message.blocks)) {
          return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('Open a workspace folder before exporting markdown files.');
          panel.webview.postMessage({
            type: 'export-result',
            text: 'Open a workspace folder before exporting markdown files.',
          });
          return;
        }

        const outputFolder = vscode.Uri.joinPath(workspaceFolder.uri, 'agent-constructor-output');
        const markdownFiles = generateMarkdownFiles(message.blocks);

        await vscode.workspace.fs.createDirectory(outputFolder);
        await Promise.all(
          markdownFiles.map((file) =>
            vscode.workspace.fs.writeFile(
              vscode.Uri.joinPath(outputFolder, file.fileName),
              Buffer.from(file.content, 'utf8'),
            ),
          ),
        );

        const resultMessage = markdownFiles.length
          ? `Exported ${markdownFiles.length} markdown file(s) to ${outputFolder.fsPath}.`
          : `Created ${outputFolder.fsPath}. Add blocks to export markdown files.`;

        vscode.window.showInformationMessage(resultMessage);
        panel.webview.postMessage({ type: 'export-result', text: resultMessage });
      },
      undefined,
      context.subscriptions,
    );
  });

  context.subscriptions.push(openCanvasCommand);
}

export function deactivate(): void {}

function getNonce(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 16 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}
