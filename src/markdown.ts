export type BlockType = 'agent' | 'skill' | 'script';

export interface ConstructorBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string;
}

export interface MarkdownFile {
  fileName: string;
  content: string;
}

const DEFAULT_TITLES: Record<BlockType, string> = {
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

export function generateMarkdownFiles(blocks: ConstructorBlock[]): MarkdownFile[] {
  return blocks.map((block, index) => {
    const title = sanitizeTitle(block);
    const order = String(index + 1).padStart(3, '0');
    const fileName = `${order}-${block.type}-${slugifyFileName(title)}.md`;
    const content = [
      '---',
      `type: ${block.type}`,
      `title: ${title}`,
      `order: ${index + 1}`,
      '---',
      '',
      `# ${title}`,
      '',
      block.content.trim() || '_Add details here._',
      '',
    ].join('\n');

    return { fileName, content };
  });
}
