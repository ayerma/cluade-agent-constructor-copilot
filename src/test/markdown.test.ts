import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMarkdownFiles, slugifyFileName } from '../markdown';

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
  assert.match(files[0].content, /^---\ntype: agent\ntitle: Planner\norder: 1\n---/);
  assert.match(files[1].content, /# New Skill/);
  assert.match(files[1].content, /_Add details here\._/);
});
