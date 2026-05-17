import { ConstructorBlock } from './markdown';

const DEFAULT_COLORS = {
  agent: '#ff8f3f',
  skill: '#4db6ff',
  script: '#b36dff',
} as const;

export function getWebviewHtml(nonce: string, initialBlocks: ConstructorBlock[] = []): string {
  const initialData = JSON.stringify(initialBlocks).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agent Constructor</title>
  <style>
    :root { color-scheme: dark; --text: #f2f5ff; --muted: #afb9dd; --outline: rgba(255,255,255,0.14); }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: linear-gradient(180deg,#141826 0%,#20253a 100%); color: var(--text); font-family: var(--vscode-font-family, "Segoe UI", sans-serif); }
    h1,h2,h3,p { margin: 0; }
    .layout { display: grid; grid-template-columns: 250px minmax(320px,1fr) 340px; gap: 16px; min-height: 100vh; padding: 18px; }
    .panel { background: rgba(10,12,20,0.5); border: 1px solid var(--outline); border-radius: 16px; padding: 14px; }
    .subtle { color: var(--muted); font-size: 0.88rem; }
    .palette { display: grid; gap: 10px; margin-top: 12px; }
    .scratch-block { border: none; color: white; text-align: left; border-radius: 12px; padding: 12px; cursor: grab; font-weight: 700; }
    .scratch-block small { display: block; font-weight: 500; opacity: 0.9; }
    .agent { background: ${DEFAULT_COLORS.agent}; }
    .skill { background: ${DEFAULT_COLORS.skill}; }
    .script { background: ${DEFAULT_COLORS.script}; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .toolbar button { border-radius: 8px; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: var(--text); cursor: pointer; }
    .toolbar .primary { background: #7b91ff; color: #10152c; border: none; font-weight: 700; }
    .filters { border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px; margin-bottom: 10px; display: grid; gap: 8px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .pill { border: 1px solid rgba(255,255,255,0.25); border-radius: 999px; padding: 3px 8px; display: inline-flex; gap: 6px; font-size: 0.78rem; }
    .canvas-dropzone { min-height: 400px; border: 2px dashed rgba(255,255,255,0.18); border-radius: 16px; padding: 10px; display: grid; gap: 8px; }
    .workspace-block { border-radius: 12px; padding: 10px; cursor: pointer; border: 2px solid transparent; }
    .workspace-block.selected { border-color: #fff; }
    .workspace-block.related { box-shadow: 0 0 0 2px rgba(255,255,255,0.55); }
    .workspace-title { display: flex; justify-content: space-between; gap: 8px; }
    .meta { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
    .badge { border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; padding: 2px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.65); display: inline-block; }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .actions button { border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; padding: 5px 8px; background: rgba(0,0,0,0.2); color: var(--text); cursor: pointer; font-size: 0.78rem; }
    .inspector { display: grid; gap: 10px; }
    .card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px; display: grid; gap: 8px; }
    label { display: grid; gap: 4px; font-size: 0.82rem; }
    input, textarea { width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.2); color: white; padding: 8px 10px; font: inherit; }
    textarea { min-height: 140px; resize: vertical; }
    .status { min-height: 20px; color: var(--muted); font-size: 0.88rem; margin-top: 8px; }
    @media (max-width: 1180px) { .layout { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="layout">
    <aside class="panel">
      <h2>Elements</h2>
      <p class="subtle">Drag and drop blocks to build the flow.</p>
      <section class="palette">
        <button class="scratch-block agent" draggable="true" data-type="agent">Agent<small>High-level role</small></button>
        <button class="scratch-block skill" draggable="true" data-type="skill">Skill<small>Reusable capability</small></button>
        <button class="scratch-block script" draggable="true" data-type="script">Script<small>Procedure steps</small></button>
      </section>
    </aside>

    <section class="panel">
      <h1>Agent Constructor Canvas</h1>
      <p class="subtle">Layer and element filters are available above the working area.</p>
      <div class="toolbar">
        <button id="clear-all">Clear</button>
        <button id="export" class="primary">Apply to Filesystem</button>
      </div>
      <div id="filters" class="filters"></div>
      <div id="canvas-dropzone" class="canvas-dropzone"></div>
      <div id="status" class="status"></div>
    </section>

    <aside id="inspector" class="panel inspector"></aside>
  </main>

  <script nonce="${nonce}">
    const vscode = typeof acquireVsCodeApi === 'function'
      ? acquireVsCodeApi()
      : { postMessage: () => undefined, setState: () => undefined, getState: () => ({ blocks: ${initialData} }) };

    const defaultTitles = { agent: 'New Agent', skill: 'New Skill', script: 'New Script' };
    const defaultColors = { agent: '${DEFAULT_COLORS.agent}', skill: '${DEFAULT_COLORS.skill}', script: '${DEFAULT_COLORS.script}' };

    const dropzone = document.getElementById('canvas-dropzone');
    const inspector = document.getElementById('inspector');
    const filters = document.getElementById('filters');
    const status = document.getElementById('status');
    const exportButton = document.getElementById('export');
    const clearAllButton = document.getElementById('clear-all');
    const paletteButtons = Array.from(document.querySelectorAll('.scratch-block'));

    const existingState = vscode.getState();
    const state = {
      blocks: normalizeBlocks(Array.isArray(existingState && existingState.blocks) ? existingState.blocks : ${initialData}),
      selectedId: null,
      layerFilter: [],
      typeFilter: ['agent', 'skill', 'script'],
      usageIndex: 0
    };

    function normalizeBlocks(blocks) {
      return blocks.map(function (block) {
        const type = block.type === 'agent' || block.type === 'skill' || block.type === 'script' ? block.type : 'script';
        return {
          id: block.id || createId(type),
          type: type,
          title: typeof block.title === 'string' ? block.title : '',
          content: typeof block.content === 'string' ? block.content : '',
          layer: (block.layer || 'default').trim(),
          color: (block.color || defaultColors[type]).trim(),
          sourceFile: typeof block.sourceFile === 'string' ? block.sourceFile : '',
          overuseOf: typeof block.overuseOf === 'string' ? block.overuseOf : '',
          uses: Array.isArray(block.uses) ? block.uses.filter(Boolean) : []
        };
      });
    }

    let fallbackCounter = 0;
    function createId(prefix) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return prefix + '-' + crypto.randomUUID();
      }
      fallbackCounter += 1;
      return prefix + '-' + Date.now().toString(36) + '-' + fallbackCounter.toString(36);
    }
    function slugify(value) {
      return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-') || 'block';
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function getLayers() {
      return Array.from(new Set(state.blocks.map(function (block) { return block.layer || 'default'; }))).sort();
    }

    function getBlockById(id) {
      return state.blocks.find(function (block) { return block.id === id; });
    }

    function getRelatedIds(block) {
      if (!block) {
        return [];
      }

      const related = new Set();
      if (block.overuseOf) {
        related.add(block.overuseOf);
      }
      (block.uses || []).forEach(function (id) { related.add(id); });
      state.blocks.forEach(function (candidate) {
        if (candidate.overuseOf === block.id || (candidate.uses || []).includes(block.id)) {
          related.add(candidate.id);
        }
      });
      related.delete(block.id);
      return Array.from(related);
    }

    function getUsageTargets(block) {
      const ids = block && block.overuseOf ? [block.overuseOf] : getRelatedIds(block);
      return ids.map(getBlockById).filter(Boolean);
    }

    function visibleBlocks() {
      const layerSet = new Set(state.layerFilter);
      const typeSet = new Set(state.typeFilter);
      return state.blocks.filter(function (block) {
        const layerOk = !layerSet.size || layerSet.has(block.layer || 'default');
        return layerOk && typeSet.has(block.type);
      });
    }

    function renderFilters() {
      const layers = getLayers();
      let layerHtml = '';
      layers.forEach(function (layer) {
        const checked = state.layerFilter.includes(layer) ? ' checked' : '';
        layerHtml += '<label class="pill"><input type="checkbox" data-filter="layer" value="' + escapeHtml(layer) + '"' + checked + ' />' + escapeHtml(layer) + '</label>';
      });

      let typeHtml = '';
      ['agent', 'skill', 'script'].forEach(function (type) {
        const checked = state.typeFilter.includes(type) ? ' checked' : '';
        typeHtml += '<label class="pill"><input type="checkbox" data-filter="type" value="' + type + '"' + checked + ' />' + type + '</label>';
      });

      filters.innerHTML = '<div><strong>Visible layers</strong><div class="filter-row">' + (layerHtml || '<span class="subtle">No layers</span>') + '</div></div>' +
        '<div><strong>Visible element types</strong><div class="filter-row">' + typeHtml + '</div></div>';
    }

    function renderCanvas() {
      const selected = getBlockById(state.selectedId);
      const relatedIds = new Set(getRelatedIds(selected));
      const blocks = visibleBlocks();

      if (!blocks.length) {
        dropzone.innerHTML = '<div class="subtle">No visible blocks. Adjust filters or add elements.</div>';
        return;
      }

      let html = '';
      blocks.forEach(function (block, index) {
        const title = escapeHtml(block.title || defaultTitles[block.type]);
        const fileLabel = block.sourceFile || (String(index + 1).padStart(3, '0') + '-' + block.type + '-' + slugify(block.title || defaultTitles[block.type]) + '.md');
        const selectedClass = block.id === state.selectedId ? ' selected' : '';
        const relatedClass = relatedIds.has(block.id) ? ' related' : '';
        const overuseBadge = block.overuseOf ? '<span class="badge">overuse</span>' : '';
        const usesBadge = (block.uses || []).length ? '<span class="badge">used by ' + (block.uses || []).length + '</span>' : '';

        html += '<article class="workspace-block ' + block.type + selectedClass + relatedClass + '" draggable="true" data-id="' + block.id + '">' +
          '<div class="workspace-title"><strong>' + title + '</strong><span class="badge"><span class="dot" style="background:' + escapeHtml(block.color || defaultColors[block.type]) + '"></span>' + escapeHtml(block.layer || 'default') + '</span></div>' +
          '<div class="meta"><span class="badge">' + escapeHtml(fileLabel) + '</span>' + overuseBadge + usesBadge + '</div>' +
          '<div class="actions">' +
            '<button data-action="select" data-id="' + block.id + '">Open</button>' +
            '<button data-action="edit" data-id="' + block.id + '">Edit</button>' +
            '<button data-action="copy" data-id="' + block.id + '">Copy</button>' +
            '<button data-action="overuse" data-id="' + block.id + '">Overuse</button>' +
            '<button data-action="remove" data-id="' + block.id + '">Remove</button>' +
          '</div>' +
          '</article>';
      });

      dropzone.innerHTML = html;
      addDragHandlers();
    }

    function renderInspector() {
      const selected = getBlockById(state.selectedId);
      if (!selected) {
        inspector.innerHTML = '<div class="card"><h2>Block details</h2><p class="subtle">Click any block to open its popup details panel.</p></div>';
        return;
      }

      const usageTargets = getUsageTargets(selected);
      const usageCount = usageTargets.length;
      const usageLabel = usageCount
        ? ('Target ' + (state.usageIndex + 1) + ' of ' + usageCount + ': ' + escapeHtml(usageTargets[state.usageIndex].title || defaultTitles[usageTargets[state.usageIndex].type]))
        : 'No usage links yet.';
      const readOnly = selected.overuseOf ? ' readonly' : '';
      const fileLabel = selected.sourceFile ? escapeHtml(selected.sourceFile) : 'Will be created in agent-constructor-output';

      inspector.innerHTML =
        '<div class="card">' +
          '<div style="display:flex;align-items:center;gap:8px;"><span class="dot" style="background:' + escapeHtml(selected.color || defaultColors[selected.type]) + '"></span><h2>' + escapeHtml(selected.title || defaultTitles[selected.type]) + '</h2></div>' +
          '<label>Title<input data-field="title" data-id="' + selected.id + '" value="' + escapeHtml(selected.title) + '"' + readOnly + ' /></label>' +
          '<label>Layer<input data-field="layer" data-id="' + selected.id + '" value="' + escapeHtml(selected.layer || 'default') + '" /></label>' +
          '<label>Color<input data-field="color" data-id="' + selected.id + '" type="color" value="' + escapeHtml(selected.color || defaultColors[selected.type]) + '" /></label>' +
          '<label>Details<textarea data-field="content" data-id="' + selected.id + '"' + readOnly + '>' + escapeHtml(selected.content) + '</textarea></label>' +
          '<div><strong>Filesystem link</strong><p class="subtle">' + fileLabel + '</p><button data-action="edit" data-id="' + selected.id + '">Open file in VS Code</button></div>' +
        '</div>' +
        '<div class="card">' +
          '<h3>Usage navigation</h3>' +
          '<p class="subtle">Arrow buttons move across highlighted usages.</p>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
            '<button data-action="usage-prev" data-id="' + selected.id + '">←</button>' +
            '<button data-action="usage-next" data-id="' + selected.id + '">→</button>' +
            '<span class="subtle">' + usageLabel + '</span>' +
          '</div>' +
        '</div>';
    }

    function render() {
      if (state.selectedId && !getBlockById(state.selectedId)) {
        state.selectedId = null;
      }
      vscode.setState({ blocks: state.blocks });
      renderFilters();
      renderCanvas();
      renderInspector();
    }

    function syncStatus(text) {
      status.textContent = text;
      vscode.postMessage({ type: 'sync', blocks: state.blocks });
    }

    function selectBlock(id, preserveUsageIndex) {
      state.selectedId = id;
      if (!preserveUsageIndex) {
        state.usageIndex = 0;
      }
      render();
    }

    function updateBlock(id, field, value) {
      const block = getBlockById(id);
      if (!block) {
        return;
      }
      block[field] = value;
      render();
      syncStatus('Block updated.');
    }

    function addBlock(type) {
      state.blocks.push({ id: createId(type), type: type, title: '', content: '', layer: 'default', color: defaultColors[type], sourceFile: '', overuseOf: '', uses: [] });
      render();
      syncStatus(type + ' block added.');
    }

    function removeBlock(id) {
      state.blocks = state.blocks.filter(function (item) { return item.id !== id; });
      state.blocks.forEach(function (block) {
        block.uses = (block.uses || []).filter(function (usageId) { return usageId !== id; });
        if (block.overuseOf === id) {
          block.overuseOf = '';
        }
      });
      render();
      syncStatus('Block removed.');
    }

    function copyPath(value, title) {
      if (!value) {
        return '';
      }
      const slashIndex = value.lastIndexOf('/');
      const directory = slashIndex >= 0 ? value.slice(0, slashIndex + 1) : '';
      const base = value.slice(slashIndex + 1).replace(/\.md$/i, '');
      return directory + base + '-copy-' + slugify(title || 'block') + '.md';
    }

    function copyBlock(id) {
      const block = getBlockById(id);
      if (!block) {
        return;
      }
      const title = (block.title || defaultTitles[block.type]) + ' Copy';
      const clone = {
        id: createId(block.type),
        type: block.type,
        title: title,
        content: block.content,
        layer: block.layer,
        color: block.color,
        sourceFile: copyPath(block.sourceFile, title),
        overuseOf: '',
        uses: [],
      };
      state.blocks.push(clone);
      selectBlock(clone.id);
      syncStatus('Block copied to a new file.');
    }

    function overuseBlock(id) {
      const block = getBlockById(id);
      if (!block) {
        return;
      }
      const reference = {
        id: createId(block.type),
        type: block.type,
        title: block.title,
        content: block.content,
        layer: block.layer,
        color: block.color,
        sourceFile: block.sourceFile,
        overuseOf: block.id,
        uses: [],
      };
      block.uses = Array.from(new Set([...(block.uses || []), reference.id]));
      state.blocks.push(reference);
      selectBlock(reference.id);
      syncStatus('Overuse link created.');
    }

    function openFile(block) {
      if (!block || !block.sourceFile) {
        status.textContent = 'This block has not been saved to a file yet. Click "Apply to Filesystem" first.';
        return;
      }
      vscode.postMessage({ type: 'open-file', filePath: block.sourceFile });
    }

    let draggedId = null;
    function addDragHandlers() {
      const items = Array.from(document.querySelectorAll('.workspace-block'));
      items.forEach(function (item) {
        item.addEventListener('dragstart', function () { draggedId = item.dataset.id; });
        item.addEventListener('dragover', function (event) { event.preventDefault(); });
        item.addEventListener('drop', function (event) {
          event.preventDefault();
          const targetId = item.dataset.id;
          if (!draggedId || !targetId || draggedId === targetId) {
            return;
          }
          const from = state.blocks.findIndex(function (entry) { return entry.id === draggedId; });
          const to = state.blocks.findIndex(function (entry) { return entry.id === targetId; });
          if (from < 0 || to < 0) {
            return;
          }
          const moved = state.blocks.splice(from, 1)[0];
          state.blocks.splice(to, 0, moved);
          render();
          syncStatus('Flow order updated.');
        });
      });
    }

    paletteButtons.forEach(function (button) {
      button.addEventListener('dragstart', function (event) { event.dataTransfer && event.dataTransfer.setData('application/x-block-type', button.dataset.type || ''); });
      button.addEventListener('click', function () { addBlock(button.dataset.type); });
    });

    dropzone.addEventListener('dragover', function (event) { event.preventDefault(); });
    dropzone.addEventListener('drop', function (event) {
      event.preventDefault();
      const type = event.dataTransfer && event.dataTransfer.getData('application/x-block-type');
      if (type === 'agent' || type === 'skill' || type === 'script') {
        addBlock(type);
      }
    });

    document.addEventListener('change', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.dataset.filter === 'layer') {
        if (target.checked) {
          state.layerFilter = Array.from(new Set(state.layerFilter.concat([target.value])));
        } else {
          state.layerFilter = state.layerFilter.filter(function (value) { return value !== target.value; });
        }
        render();
        return;
      }

      if (target.dataset.filter === 'type') {
        if (target.checked) {
          state.typeFilter = Array.from(new Set(state.typeFilter.concat([target.value])));
        } else {
          state.typeFilter = state.typeFilter.filter(function (value) { return value !== target.value; });
        }
        render();
      }
    });

    document.addEventListener('input', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      const id = target.dataset.id;
      const field = target.dataset.field;
      if (!id || !field || !['title', 'content', 'layer', 'color'].includes(field)) {
        return;
      }
      updateBlock(id, field, target.value);
    });

    document.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const id = target.dataset.id;
      const block = id ? getBlockById(id) : null;
      const action = target.dataset.action;

      if (action === 'select' && id) {
        selectBlock(id);
      } else if (action === 'remove' && id) {
        removeBlock(id);
      } else if (action === 'copy' && id) {
        copyBlock(id);
      } else if (action === 'overuse' && id) {
        overuseBlock(id);
      } else if (action === 'edit') {
        openFile(block);
      } else if ((action === 'usage-prev' || action === 'usage-next') && block) {
        const targets = getUsageTargets(block);
        if (!targets.length) {
          return;
        }
        if (action === 'usage-prev') {
          state.usageIndex = (state.usageIndex + targets.length - 1) % targets.length;
        } else {
          state.usageIndex = (state.usageIndex + 1) % targets.length;
        }
        selectBlock(targets[state.usageIndex].id, true);
      }
    });

    exportButton.addEventListener('click', function () {
      vscode.postMessage({ type: 'export', blocks: state.blocks });
      status.textContent = 'Applying constructor changes to markdown files...';
    });

    clearAllButton.addEventListener('click', function () {
      state.blocks = [];
      state.selectedId = null;
      render();
      syncStatus('All blocks cleared.');
    });

    window.addEventListener('message', function (event) {
      const message = event.data;
      if (message && (message.type === 'sync-result' || message.type === 'export-result')) {
        status.textContent = message.text;
      }
    });

    if (state.blocks.length) {
      state.selectedId = state.blocks[0].id;
    }
    render();
  </script>
</body>
</html>`;
}
