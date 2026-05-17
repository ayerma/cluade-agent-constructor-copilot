import { ConstructorBlock } from './markdown';

const initialBlocks: ConstructorBlock[] = [];

export function getWebviewHtml(nonce: string): string {
  const initialData = JSON.stringify(initialBlocks).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agent Constructor</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #1f2233;
      --panel: #2b3152;
      --panel-alt: #161a28;
      --text: #f2f5ff;
      --muted: #afb9dd;
      --agent: #ff8f3f;
      --skill: #4db6ff;
      --script: #b36dff;
      --outline: rgba(255, 255, 255, 0.14);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(180deg, #141826 0%, #20253a 100%);
      color: var(--text);
      font-family: var(--vscode-font-family, "Segoe UI", sans-serif);
    }

    .layout {
      display: grid;
      grid-template-columns: 260px minmax(320px, 1fr) 320px;
      gap: 16px;
      min-height: 100vh;
      padding: 18px;
    }

    .panel {
      background: rgba(10, 12, 20, 0.5);
      border: 1px solid var(--outline);
      border-radius: 18px;
      padding: 16px;
      backdrop-filter: blur(10px);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
    }

    h1, h2, h3, p { margin: 0; }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .subtle {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .palette {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .scratch-block {
      border: none;
      color: white;
      width: 100%;
      text-align: left;
      padding: 14px 16px;
      border-radius: 14px;
      cursor: grab;
      font-weight: 700;
      display: grid;
      gap: 6px;
      box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.18);
    }

    .scratch-block small {
      font-weight: 500;
      opacity: 0.9;
    }

    .agent { background: var(--agent); }
    .skill { background: var(--skill); }
    .script { background: var(--script); }

    .canvas {
      display: grid;
      grid-template-rows: auto 1fr;
      gap: 16px;
    }

    .canvas-dropzone {
      min-height: 420px;
      border: 2px dashed rgba(255, 255, 255, 0.16);
      border-radius: 20px;
      padding: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
      display: grid;
      align-content: start;
      gap: 12px;
    }

    .drop-hint {
      padding: 32px 20px;
      text-align: center;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.03);
      color: var(--muted);
      border: 1px dashed rgba(255, 255, 255, 0.08);
    }

    .workspace-block {
      border-radius: 16px;
      padding: 14px;
      display: grid;
      gap: 10px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    }

    .workspace-block header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .workspace-block strong {
      display: block;
      font-size: 1rem;
    }

    .workspace-block button {
      border: none;
      background: rgba(0, 0, 0, 0.2);
      color: white;
      border-radius: 10px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .workspace-block input,
    .workspace-block textarea {
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(0, 0, 0, 0.18);
      color: white;
      padding: 10px 12px;
      font: inherit;
    }

    .workspace-block textarea {
      min-height: 84px;
      resize: vertical;
    }

    .preview {
      display: grid;
      gap: 12px;
    }

    .preview-card {
      background: var(--panel-alt);
      border-radius: 16px;
      padding: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      white-space: pre-wrap;
      font-family: var(--vscode-editor-font-family, "Consolas", monospace);
      font-size: 0.88rem;
      line-height: 1.4;
      overflow: auto;
      max-height: 62vh;
    }

    .toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .primary-button {
      border: none;
      background: #7b91ff;
      color: #10152c;
      padding: 10px 14px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .secondary-button {
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: transparent;
      color: var(--text);
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
    }

    .status {
      min-height: 20px;
      color: var(--muted);
      font-size: 0.9rem;
    }

    @media (max-width: 1080px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="layout">
    <aside class="panel">
      <div class="panel-header">
        <h2>Palette</h2>
      </div>
      <p class="subtle">Drag blocks onto the landscape to visually compose agents, skills, and scripts like a lightweight Scratch workspace.</p>
      <section class="palette">
        <button class="scratch-block agent" draggable="true" data-type="agent">
          Agent
          <small>High-level role and responsibilities</small>
        </button>
        <button class="scratch-block skill" draggable="true" data-type="skill">
          Skill
          <small>Reusable capability or prompt pattern</small>
        </button>
        <button class="scratch-block script" draggable="true" data-type="script">
          Script
          <small>Procedure or automation steps</small>
        </button>
      </section>
    </aside>

    <section class="canvas">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h1>Agent Constructor Canvas</h1>
            <p class="subtle">Drop blocks, reorder them with drag and drop, and edit their content before exporting markdown files.</p>
          </div>
          <div class="toolbar">
            <button id="clear-all" class="secondary-button">Clear Canvas</button>
            <button id="export" class="primary-button">Export Markdown Files</button>
          </div>
        </div>
        <div id="canvas-dropzone" class="canvas-dropzone"></div>
      </div>
    </section>

    <aside class="panel preview">
      <div class="panel-header">
        <div>
          <h2>Markdown Preview</h2>
          <p class="subtle">Each block becomes its own .md file.</p>
        </div>
      </div>
      <div id="preview" class="preview-card"></div>
      <div id="status" class="status"></div>
    </aside>
  </main>

  <script nonce="${nonce}">
    const vscode = typeof acquireVsCodeApi === 'function'
      ? acquireVsCodeApi()
      : { postMessage: () => undefined, setState: () => undefined, getState: () => ({ blocks: ${initialData} }) };

    const defaultTitles = {
      agent: 'New Agent',
      skill: 'New Skill',
      script: 'New Script'
    };

    const paletteButtons = Array.from(document.querySelectorAll('.scratch-block'));
    const dropzone = document.getElementById('canvas-dropzone');
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');
    const exportButton = document.getElementById('export');
    const clearAllButton = document.getElementById('clear-all');

    const existingState = vscode.getState();
    const state = {
      blocks: Array.isArray(existingState?.blocks) ? existingState.blocks : ${initialData}
    };

    function escapeHtml(value) {
      return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function createId(prefix) {
      return prefix + '-' + Math.random().toString(16).slice(2, 8);
    }

    function slugify(value) {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'block';
    }

    function toMarkdown(block, index) {
      const title = block.title.trim() || defaultTitles[block.type];
      return [
        '---',
        'type: ' + block.type,
        'title: ' + title,
        'order: ' + (index + 1),
        '---',
        '',
        '# ' + title,
        '',
        block.content.trim() || '_Add details here._',
        ''
      ].join('\\n');
    }

    function render() {
      vscode.setState(state);

      if (!state.blocks.length) {
        dropzone.innerHTML = '<div class="drop-hint">Drop agent, skill, or script blocks here to begin your flow.</div>';
        preview.textContent = 'No blocks on the canvas yet.';
        return;
      }

      dropzone.innerHTML = state.blocks.map((block, index) => {
        const title = escapeHtml(block.title);
        const content = escapeHtml(block.content);
        const fileName = String(index + 1).padStart(3, '0') + '-' + block.type + '-' + slugify(block.title || defaultTitles[block.type]) + '.md';

        return \`
          <article class="workspace-block \${block.type}" draggable="true" data-id="\${block.id}">
            <header>
              <div>
                <strong>\${block.type.toUpperCase()}</strong>
                <span>\${fileName}</span>
              </div>
              <button data-action="remove" data-id="\${block.id}">Remove</button>
            </header>
            <label>
              <span>Title</span>
              <input data-field="title" data-id="\${block.id}" value="\${title}" placeholder="\${defaultTitles[block.type]}" />
            </label>
            <label>
              <span>Details</span>
              <textarea data-field="content" data-id="\${block.id}" placeholder="Describe this block">\${content}</textarea>
            </label>
          </article>
        \`;
      }).join('');

      preview.textContent = state.blocks.map((block, index) => {
        const fileName = String(index + 1).padStart(3, '0') + '-' + block.type + '-' + slugify(block.title || defaultTitles[block.type]) + '.md';
        return fileName + '\\n' + toMarkdown(block, index);
      }).join('\\n\\n');

      addWorkspaceHandlers();
    }

    function addBlock(type) {
      state.blocks.push({
        id: createId(type),
        type,
        title: '',
        content: ''
      });
      render();
    }

    function updateBlock(id, field, value) {
      const block = state.blocks.find((item) => item.id === id);
      if (!block) {
        return;
      }

      block[field] = value;
      render();
    }

    function removeBlock(id) {
      state.blocks = state.blocks.filter((item) => item.id !== id);
      render();
    }

    let draggedId = null;

    function addWorkspaceHandlers() {
      const blocks = Array.from(document.querySelectorAll('.workspace-block'));

      blocks.forEach((blockElement) => {
        blockElement.addEventListener('dragstart', () => {
          draggedId = blockElement.dataset.id;
        });

        blockElement.addEventListener('dragover', (event) => {
          event.preventDefault();
        });

        blockElement.addEventListener('drop', (event) => {
          event.preventDefault();
          const targetId = blockElement.dataset.id;
          if (!draggedId || !targetId || draggedId === targetId) {
            return;
          }

          const draggedIndex = state.blocks.findIndex((item) => item.id === draggedId);
          const targetIndex = state.blocks.findIndex((item) => item.id === targetId);
          if (draggedIndex < 0 || targetIndex < 0) {
            return;
          }

          const [moved] = state.blocks.splice(draggedIndex, 1);
          state.blocks.splice(targetIndex, 0, moved);
          draggedId = null;
          render();
        });
      });
    }

    paletteButtons.forEach((button) => {
      button.addEventListener('dragstart', (event) => {
        event.dataTransfer?.setData('application/x-block-type', button.dataset.type || '');
      });

      button.addEventListener('click', () => {
        addBlock(button.dataset.type);
      });
    });

    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      const type = event.dataTransfer?.getData('application/x-block-type');
      if (type === 'agent' || type === 'skill' || type === 'script') {
        addBlock(type);
      }
    });

    document.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }

      const id = target.dataset.id;
      const field = target.dataset.field;
      if (!id || (field !== 'title' && field !== 'content')) {
        return;
      }

      updateBlock(id, field, target.value);
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      if (target.dataset.action === 'remove' && target.dataset.id) {
        removeBlock(target.dataset.id);
      }
    });

    exportButton.addEventListener('click', () => {
      vscode.postMessage({ type: 'export', blocks: state.blocks });
      status.textContent = 'Exporting markdown files...';
    });

    clearAllButton.addEventListener('click', () => {
      state.blocks = [];
      status.textContent = 'Canvas cleared.';
      render();
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message?.type === 'export-result') {
        status.textContent = message.text;
      }
    });

    render();
  </script>
</body>
</html>`;
}
