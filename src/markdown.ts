export type BlockType = 'agent' | 'skill' | 'script';

export interface ConstructorBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string;
  layer?: string;
  color?: string;
  sourceFile?: string;
  overuseOf?: string;
  uses?: string[];
}

export interface MarkdownFile {
  fileName: string;
  content: string;
}

export const DEFAULT_TITLES: Record<BlockType, string> = {
  agent: 'New Agent',
  skill: 'New Skill',
  script: 'New Script',
};

export function sanitizeTitle(block: ConstructorBlock): string {
  return block.title.trim() || DEFAULT_TITLES[block.type];
}

export function slugifyFileName(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'block';
}

export function createMarkdownContent(block: ConstructorBlock, index: number): string {
  const title = sanitizeTitle(block);
  const frontmatter: string[] = [
    '---',
    `type: ${block.type}`,
    `title: ${title}`,
    `order: ${index + 1}`,
  ];

  if (block.layer?.trim()) {
    frontmatter.push(`layer: ${block.layer.trim()}`);
  }

  if (block.color?.trim()) {
    frontmatter.push(`color: ${block.color.trim()}`);
  }

  if (block.sourceFile?.trim()) {
    frontmatter.push(`source_file: ${block.sourceFile.trim()}`);
  }

  if (block.overuseOf?.trim()) {
    frontmatter.push(`overuse_of: ${block.overuseOf.trim()}`);
  }

  if (block.uses?.length) {
    frontmatter.push(`uses: ${block.uses.join(',')}`);
  }

  return [
    ...frontmatter,
    '---',
    '',
    `# ${title}`,
    '',
    block.content.trim() || '_Add details here._',
    '',
  ].join('\n');
}

export function inferMarkdownFileName(block: ConstructorBlock, index: number): string {
  const title = sanitizeTitle(block);
  const order = String(index + 1).padStart(3, '0');
  return `${order}-${block.type}-${slugifyFileName(title)}.md`;
}

export function generateMarkdownFiles(blocks: ConstructorBlock[]): MarkdownFile[] {
  return blocks.map((block, index) => ({
    fileName: inferMarkdownFileName(block, index),
    content: createMarkdownContent(block, index),
  }));
}
