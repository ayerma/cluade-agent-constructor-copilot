import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownContent, generateMarkdownFiles, slugifyFileName } from '../markdown';

test('slugifyFileName creates safe kebab-case names', () => {
  assert.equal(slugifyFileName('  Skill: Review / Approve  '), 'skill-review-approve');
  assert.equal(slugifyFileName('***'), 'block');
});

test('generateMarkdownFiles creates ordered markdown output per block', () => {
  const files = generateMarkdownFiles([
    { id: '1', type: 'agent', title: 'Planner', content: 'Coordinates the flow.' },
    { id: '2', type: 'skill', title: '', content: '' },
  ]);

  assert.deepEqual(
    files.map((file) => file.fileName),
    ['001-agent-planner.md', '002-skill-new-skill.md'],
  );
  assert.match(files[0].content, /^---\nid: 1\ntype: agent\ntitle: Planner\norder: 1\n---/);
  assert.match(files[1].content, /# New Skill/);
  assert.match(files[1].content, /_Add details here\._/);
});

test('createMarkdownContent preserves constructor metadata for layer and overuse relations', () => {
  const content = createMarkdownContent(
    {
      id: '3',
      type: 'script',
      title: 'Executor',
      content: 'Run the workflow.',
      layer: 'runtime',
      color: '#00ff00',
      sourceFile: 'agents/executor.md',
      overuseOf: 'block-1',
      uses: ['block-4', 'block-5'],
    },
    2,
  );

  assert.match(content, /layer: runtime/);
  assert.match(content, /color: #00ff00/);
  assert.match(content, /source_file: agents\/executor\.md/);
  assert.match(content, /overuse_of: block-1/);
  assert.match(content, /uses: block-4,block-5/);
});
