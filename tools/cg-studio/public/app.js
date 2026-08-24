/* CG Studio 前端 — 原生 JS，无构建 */

// ── 工具函数 ──

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function togglePanel(id) { $(id).classList.toggle('open'); }

async function api(path, method = 'GET', body = null) {
  const opt = { method, headers: {} };
  if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(path, opt);
  return r.json();
}

// ── 配置读写 ──

let tasks = [];          // { id, file, ref, prompt }
let preflightMap = new Map(); // id -> 预检状态

function collectConfigFromUI() {
  return {
    api: {
      baseUrl: $('api-baseUrl').value.trim(),
      key: $('api-key').value.trim(),  // 安全模式：不落盘，但运行时在后端内存中保留
      model: $('api-model').value.trim(),
      size: $('api-size').value.trim(),
      quality: $('api-quality').value,
      concurrency: Number($('api-concurrency').value) || 2,
      autoRetry: Number($('api-autoRetry').value) || 0,
      timeoutSec: Number($('api-timeoutSec').value) || 300,
      antiCache: $('api-antiCache').checked,
      textModel: $('api-textModel').value.trim() || 'gpt-5-6-mini',
    },
    globalPrefix: { enabled: $('prefix-enabled').checked, text: $('prefix-text').value },
    outputDir: currentOutputDir,
    tasks,
    quick: quickCards.map(c => ({ id: c.id, file: c.file, prompt: c.prompt, ref: c.ref, lastFile: c.lastFile || '' })),
    expand: {
      indoorDay: $('expand-indoor-day').value,
      indoorNight: $('expand-indoor-night').value,
      outdoor: {
        sunny:    { enabled: $('expand-ow-sunny-enabled').checked,    day: $('expand-ow-sunny-day').value,    night: $('expand-ow-sunny-night').value },
        overcast: { enabled: $('expand-ow-overcast-enabled').checked, day: $('expand-ow-overcast-day').value, night: $('expand-ow-overcast-night').value },
        snow:     { enabled: $('expand-ow-snow-enabled').checked,     day: $('expand-ow-snow-day').value,     night: $('expand-ow-snow-night').value },
      },
      locations: $('expand-locations').value,
    },
    postimg: collectPostimg(),
  };
}

async function saveConfig() {
  await api('/api/config', 'POST', collectConfigFromUI());
}

async function loadConfigToUI() {
  const c = await api('/api/config');
  $('api-baseUrl').value = c.api.baseUrl || '';
  // 安全模式：每次打开都要求重新填写 API 地址（不保留在磁盘上）
  if (!c.api.baseUrl) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:var(--accent);font-size:12px;margin-top:4px';
    hint.textContent = '🔑 安全模式：每次打开需重新填写 API 地址（不保存到磁盘，可放心分享）';
    const urlLabel = $('api-baseUrl').closest('label');
    if (urlLabel && !urlLabel.querySelector('.security-hint')) {
      hint.className = 'security-hint';
      urlLabel.appendChild(hint);
    }
  }
  $('api-key').value = c.api.key || '';
  // 安全模式：每次打开都要求重新填写 API Key（不保留在磁盘上）
  if (!c.api.key) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:var(--accent);font-size:12px;margin-top:4px';
    hint.textContent = '🔑 安全模式：每次打开需重新填写 API Key（不保存到磁盘，可放心分享）';
    const keyLabel = $('api-key').closest('label');
    if (keyLabel && !keyLabel.querySelector('.security-hint')) {
      hint.className = 'security-hint';
      keyLabel.appendChild(hint);
    }
  }
  $('api-model').value = c.api.model || 'gpt-image-2';
  $('api-size').value = c.api.size || '1536x1024';
  $('api-quality').value = c.api.quality || 'medium';
  syncSizeUI();
  syncQualityUI();
  $('api-concurrency').value = c.api.concurrency ?? 2;
  $('api-autoRetry').value = c.api.autoRetry ?? 1;
  $('api-timeoutSec').value = c.api.timeoutSec ?? 300;
  $('api-antiCache').checked = c.api.antiCache !== false;
  $('api-textModel').value = c.api.textModel || 'gpt-5-6-mini';
  $('prefix-enabled').checked = !!c.globalPrefix?.enabled;
  $('prefix-text').value = c.globalPrefix?.text || '';
  const ex = c.expand || {};
  $('expand-indoor-day').value = ex.indoorDay ?? '';
  $('expand-indoor-night').value = ex.indoorNight ?? '';
  for (const w of ['sunny', 'overcast', 'snow']) {
    $('expand-ow-' + w + '-enabled').checked = ex.outdoor?.[w]?.enabled ?? true;
    $('expand-ow-' + w + '-day').value = ex.outdoor?.[w]?.day ?? '';
    $('expand-ow-' + w + '-night').value = ex.outdoor?.[w]?.night ?? '';
  }
  $('expand-locations').value = ex.locations || '';
  quickCards = Array.isArray(c.quick) ? c.quick.map(c2 => ({ id: c2.id || newId(), file: c2.file || '', prompt: c2.prompt || '', ref: c2.ref || '', lastFile: c2.lastFile || '' })) : [];
  if (!quickCards.length) quickCards = [blankQuickCard(), blankQuickCard()];
  renderQuickCards();
  $('postimg-key').value = c.postimg?.key || '';
  // 安全模式：PostImages API Key 也不保存
  if (!c.postimg?.key) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:var(--accent);font-size:12px;margin-top:4px';
    hint.className = 'security-hint';
    hint.textContent = '🔑 安全模式：API Key 不保存到磁盘，每次需重新填写';
    const keyLabel = $('postimg-key').closest('label');
    if (keyLabel && !keyLabel.querySelector('.security-hint')) {
      keyLabel.appendChild(hint);
    }
  }
  currentOutputDir = c.outputDir || '';
  $('outputDir-show').textContent = currentOutputDir || '（未设置）';
  tasks = Array.isArray(c.tasks) ? c.tasks : [];
  renderTasks();
}

// ── 模式切换（通用生图 / 地点 CG） ──

const MODE_HINTS = {
  general: '通用模式：卡片式快速出图 —— 填提示词、可选导入参考图、点生成就出，人像 / 场景 / 道具都行。',
  location: '地点 CG 模式：地点清单 → 批量展开 昼/夜、晴/阴/雪 变体矩阵，锚点 + 派生保持场景一致。',
};

function setMode(mode) {
  const m = mode === 'location' ? 'location' : 'general';
  document.body.dataset.mode = m;
  try { localStorage.setItem('cg-mode', m); } catch { /* ignore */ }
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  $('mode-hint').textContent = MODE_HINTS[m];
}

function initMode() {
  let m = 'general';
  try { m = localStorage.getItem('cg-mode') === 'location' ? 'location' : 'general'; } catch { /* ignore */ }
  setMode(m);
}

// ── 尺寸比例芯片 ──

const SIZE_PRESETS = [
  { ratio: '16:9', w: 1920, h: 1080 },
  { ratio: '3:2',  w: 1536, h: 1024 },
  { ratio: '1:1',  w: 1024, h: 1024 },
  { ratio: '2:3',  w: 832,  h: 1216 },
];

function parseSize(str) {
  const m = String(str || '').trim().match(/^(\d{2,5})x(\d{2,5})$/);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

function sizeRatioMatch(cur, p) {
  if (!cur) return false;
  const pr = p.w / p.h;
  return Math.abs(cur.w / cur.h - pr) / pr < 0.02;
}

let sizeCustomForced = false;   // 点「自定义」芯片后锁定自定义态，直到再点预设比例

function syncSizeUI() {
  const cur = parseSize($('api-size').value);
  const label = $('size-current-label');
  const customInput = $('size-custom');
  if (!cur) { label.textContent = $('api-size').value || '—'; return; }
  label.textContent = `${cur.w}×${cur.h}`;
  const hit = SIZE_PRESETS.find(p => sizeRatioMatch(cur, p));
  const isCustom = sizeCustomForced || !hit;
  document.querySelectorAll('#size-chips .chipopt').forEach(c => {
    c.classList.toggle('active', isCustom ? c.dataset.ratio === 'custom' : c.dataset.ratio === hit.ratio);
  });
  customInput.style.display = isCustom ? '' : 'none';
  if (isCustom) customInput.value = `${cur.w}x${cur.h}`;
}

document.querySelectorAll('#size-chips .chipopt').forEach(c => {
  c.addEventListener('click', () => {
    const p = SIZE_PRESETS.find(x => x.ratio === c.dataset.ratio);
    if (p) {
      sizeCustomForced = false;
      // 已是该比例时保留当前像素，只有换比例才重置为预设像素
      if (!sizeRatioMatch(parseSize($('api-size').value), p)) {
        $('api-size').value = `${p.w}x${p.h}`;
      }
    } else {
      sizeCustomForced = true;
      const cur = parseSize($('api-size').value);
      $('size-custom').value = cur ? `${cur.w}x${cur.h}` : '';
      $('size-custom').style.display = '';
      $('size-custom').focus();
    }
    syncSizeUI();
    scheduleSave();
  });
});
$('size-custom').addEventListener('input', () => {
  const v = $('size-custom').value.trim();
  const ok = parseSize(v);
  $('size-custom').classList.toggle('invalid', !!v && !ok);
  if (ok) {
    $('api-size').value = `${ok.w}x${ok.h}`;
    $('size-current-label').textContent = `${ok.w}×${ok.h}`;
    scheduleSave();
  }
});

// ── 质量档位芯片 ──

function syncQualityUI() {
  const v = $('api-quality').value || 'medium';
  document.querySelectorAll('#quality-chips .chipopt').forEach(c => {
    c.classList.toggle('active', c.dataset.v === v);
  });
}
document.querySelectorAll('#quality-chips .chipopt').forEach(c => {
  c.addEventListener('click', () => {
    $('api-quality').value = c.dataset.v;
    syncQualityUI();
    scheduleSave();
  });
});

// ── 模型组合框（输入 + 下拉列表 + 一键拉取） ──

let fetchedModels = [];
let fetchingModels = false;
const comboMenus = [];   // { menu, input }

let comboSuppressUntil = 0;   // 选中项后短暂抑制重新展开（屏蔽 focus/input 连锁导致的自动重开）

function comboCanShow() { return Date.now() >= comboSuppressUntil; }

function closeComboMenus() {
  comboSuppressUntil = Date.now() + 150;
  document.querySelectorAll('.combo-menu.show').forEach(m => m.classList.remove('show'));
}

document.addEventListener('mousedown', e => {
  if (!e.target.closest('.combo')) closeComboMenus();
});

function renderComboMenu(cm, useFilter = false) {
  const { menu, input } = cm;
  if (!fetchedModels.length) {
    menu.innerHTML = `<div class="cm-empty">尚无模型列表 <button type="button" class="small">⟳ 立即拉取</button></div>`;
    menu.querySelector('button').addEventListener('click', () => autoFetchModels());
    return;
  }
  // 只有正在键入时才按输入内容过滤；点 ▾ / 聚焦打开时显示全部
  const q = input.value.trim().toLowerCase();
  const list = (useFilter && q) ? fetchedModels.filter(m => m.toLowerCase().includes(q)) : fetchedModels;
  if (!list.length) {
    menu.innerHTML = `<div class="cm-empty">无匹配模型（共 ${fetchedModels.length} 个，清空输入可看全部）</div>`;
    return;
  }
  const cur = input.value.trim();
  menu.innerHTML = list.map((m, i) =>
    `<div class="cm-item${m === cur ? ' cur' : ''}" data-i="${i}">${esc(m)}</div>`).join('');
  menu.querySelectorAll('.cm-item').forEach(el => {
    el.addEventListener('click', () => {
      input.value = list[Number(el.dataset.i)];
      closeComboMenus();
      scheduleSave();
    });
  });
}

function renderComboMenus() {
  comboMenus.forEach(cm => { if (cm.menu.classList.contains('show')) renderComboMenu(cm); });
}

function setupModelCombo(comboId, inputId) {
  const combo = $(comboId);
  const input = $(inputId);
  const menu = document.createElement('div');
  menu.className = 'combo-menu';
  combo.appendChild(menu);
  comboMenus.push({ menu, input });
  input.addEventListener('focus', () => { if (!comboCanShow()) return; renderComboMenu({ menu, input }); menu.classList.add('show'); });
  input.addEventListener('input', () => { if (!comboCanShow()) return; renderComboMenu({ menu, input }, true); menu.classList.add('show'); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') closeComboMenus(); });
  combo.querySelector('.combo-btn').addEventListener('click', () => {
    const show = !menu.classList.contains('show');
    closeComboMenus();
    comboSuppressUntil = 0;   // 显式点 ▾ 时立即允许展开
    if (show) { renderComboMenu({ menu, input }); menu.classList.add('show'); }
  });
  combo.querySelector('.combo-refresh').addEventListener('click', () => autoFetchModels());
}

async function autoFetchModels(silent = false) {
  const baseUrl = $('api-baseUrl')?.value.trim();
  const key = $('api-key')?.value.trim();
  if (!baseUrl || !key) { if (!silent) toast('先填写 API 地址和 Key 再拉取模型', true); return; }
  if (fetchingModels) return;
  fetchingModels = true;
  document.querySelectorAll('.combo-refresh').forEach(b => b.classList.add('spin'));
  try {
    await saveConfig();
    const d = await api('/api/test-connection', 'POST');
    if (d.ok && d.models?.length) {
      fetchedModels = d.models;
      renderComboMenus();
      toast(`已拉取 ${d.models.length} 个可用模型`);
    } else if (!d.ok) {
      toast('模型列表拉取失败: ' + (d.error || '未知错误'), true);
    }
  } catch (e) {
    console.warn('[cg-studio] 模型列表拉取异常:', e);
  } finally {
    fetchingModels = false;
    document.querySelectorAll('.combo-refresh').forEach(b => b.classList.remove('spin'));
  }
}

// ── 任务表 ──

function newId() { return 't' + Math.random().toString(36).slice(2, 10); }

function renderTasks() {
  const tb = $('task-body');
  tb.innerHTML = '';
  const fileNames = tasks.map(t => (t.file || '').trim()).filter(Boolean);
  const hideDone = $('hide-done-tasks')?.checked;

  let shown = 0;
  tasks.forEach((t, i) => {
    const pf = preflightMap.get(t.id) || {};
    const rt = runtimeStatuses.get(t.id);
    const isDone = pf.done || pf.fileExists || rt?.status === 'done' || rt?.status === 'skipped';
    if (hideDone && isDone) return;
    shown++;
    const tr = document.createElement('tr');

    // 文件名
    const tdFile = document.createElement('td');
    tdFile.className = 'col-file';
    const inFile = document.createElement('input');
    inFile.type = 'text'; inFile.value = t.file || ''; inFile.placeholder = '前朝大殿/奉天殿-昼';
    inFile.oninput = () => { t.file = inFile.value; scheduleSave(); };
    tdFile.appendChild(inFile);

    // 参考图
    const tdRef = document.createElement('td');
    tdRef.className = 'col-ref';
    const refWrap = document.createElement('div');
    refWrap.style.cssText = 'display:flex;gap:4px';
    const inRef = document.createElement('input');
    inRef.type = 'text'; inRef.value = t.ref || ''; inRef.placeholder = '留空=文生图锚点';
    inRef.setAttribute('list', 'ref-suggestions');
    inRef.style.flex = '1';
    inRef.oninput = () => { t.ref = inRef.value; scheduleSave(); };
    refWrap.appendChild(inRef);
    // 上传参考图按钮
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'small';
    uploadBtn.textContent = '📁';
    uploadBtn.title = '上传本机图片作为参考图（保存到 _uploads/ 文件夹）';
    uploadBtn.style.cssText = 'flex-shrink:0;padding:3px 7px';
    uploadBtn.onclick = () => uploadRefImage(t, inRef);
    refWrap.appendChild(uploadBtn);
    tdRef.appendChild(refWrap);

    // 提示词
    const tdPrompt = document.createElement('td');
    const wrap = document.createElement('div');
    const ta = document.createElement('textarea');
    ta.value = t.prompt || ''; ta.placeholder = '这一张的提示词（变体指令 + 场景描述）';
    ta.oninput = () => { t.prompt = ta.value; scheduleSave(); };
    const pvBtn = document.createElement('button');
    pvBtn.className = 'small'; pvBtn.textContent = '预览提示词';
    pvBtn.style.marginTop = '4px';
    const pv = document.createElement('div');
    pv.className = 'prompt-preview';
    pvBtn.onclick = () => {
      // 行内提示词在展开时已烘进全局前缀，行内即最终发送内容，直接展示
      pv.textContent = t.prompt || '';
      pv.classList.toggle('show');
    };
    wrap.appendChild(ta); wrap.appendChild(pvBtn); wrap.appendChild(pv);
    tdPrompt.appendChild(wrap);

    // 状态
    const tdStatus = document.createElement('td');
    tdStatus.className = 'col-status';
    tdStatus.innerHTML = statusBadge(pf, runtimeStatuses.get(t.id));

    // 操作
    const tdAct = document.createElement('td');
    tdAct.className = 'col-act';
    const delBtn = document.createElement('button');
    delBtn.className = 'small danger'; delBtn.textContent = '删除';
    delBtn.onclick = () => { tasks.splice(i, 1); preflightMap.delete(t.id); renderTasks(); scheduleSave(); };
    tdAct.appendChild(delBtn);

    tr.append(tdFile, tdRef, tdPrompt, tdStatus, tdAct);
    tb.appendChild(tr);
  });

  // _uploads 中的参考图也加入参考图自动补全建议
  if (currentOutputDir) {
    api('/api/list-uploads').then(d => {
      if (d.files?.length) {
        const allFiles = fileNames.concat(d.files);
        dl.innerHTML = allFiles.map(f => `<option value="${esc(f)}">`).join('');
      }
    }).catch(() => {});
  }

  // 参考图自动补全建议
  let dl = $('ref-suggestions');
  if (!dl) {
    dl = document.createElement('datalist'); dl.id = 'ref-suggestions';
    document.body.appendChild(dl);
  }
  dl.innerHTML = fileNames.map(f => `<option value="${esc(f)}">`).join('');

  $('task-count').textContent = hideDone
    ? `显示 ${shown} 行（已隐藏 ${tasks.length - shown} 行完成/已存在，共 ${tasks.length} 行）`
    : `共 ${tasks.length} 行`;
}

function statusBadge(pf, rt) {
  if (rt?.status === 'running') return '<span class="badge running">生成中…</span>';
  if (rt?.status === 'done') return '<span class="badge done">已完成 ✓</span>';
  if (rt?.status === 'failed') return `<span class="badge failed" title="${esc(rt.error || '')}">失败 ✗</span>`;
  if (rt?.status === 'stopped') return '<span class="badge failed">已停止</span>';
  if (rt?.status === 'skipped') return '<span class="badge done">已跳过(存在)</span>';
  if (rt?.status === 'blocked') return `<span class="badge blocked" title="${esc(rt.error || '')}">参考缺失 ✗</span>`;
  if (pf.blocked) return `<span class="badge blocked" title="${esc(pf.refMsg || '')}">参考缺失 ✗</span>`;
  if (pf.done) return '<span class="badge done">已生成 ✓</span>';
  if (pf.fileExists) return '<span class="badge level">文件已存在</span>';
  if (pf.refKind === 'none') return '<span class="badge anchor">锚点·文生图</span>';
  if (pf.refKind === 'task') return `<span class="badge derived">派生·第${(pf.level ?? '?') + 1}批</span>`;
  if (pf.refKind === 'disk') return '<span class="badge derived">派生·参考已有图</span>';
  if (pf.refKind === 'external') return '<span class="badge derived">派生·外部参考</span>';
  return '<span class="badge">待预检</span>';
}

function addTaskRow() {
  tasks.push({ id: newId(), file: '', ref: '', prompt: '' });
  renderTasks(); scheduleSave();
}

function clearTasks() {
  if (!confirm('确定清空整个任务清单？（不影响已生成的图片）')) return;
  tasks = []; preflightMap = new Map();
  renderTasks(); scheduleSave();
}

function pasteImport() {
  const text = prompt('粘贴 Excel 区域（3列：文件名 | 参考图 | 提示词，参考图可留空，直接 Ctrl+V）：\n提示：先复制 Excel 单元格区域，再粘贴到此处输入框');
  if (!text) return;
  const lines = text.trim().split(/\r?\n/);
  let added = 0;
  for (const line of lines) {
    const cells = line.split(/\t/);
    if (cells.length < 3) {
      // 只有 1 列也接受：当作纯文件名，提示词留空
      if (cells.length === 1 && cells[0].trim()) {
        tasks.push({ id: newId(), file: cells[0].trim(), ref: '', prompt: '' });
        added++;
      }
      continue;
    }
    tasks.push({ id: newId(), file: cells[0].trim(), ref: cells[1].trim(), prompt: cells.slice(2).join('\n') });
    added++;
  }
  renderTasks(); scheduleSave();
  toast(`已导入 ${added} 行`);
}

function exportCsv() {
  const rows = [['文件名', '参考图', '提示词']];
  for (const t of tasks) rows.push([t.file || '', t.ref || '', (t.prompt || '').replace(/\r?\n/g, '\\n')]);
  const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cg-tasks.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── AI 提示词工坊 ──

async function aiWritePrompts() {
  const raw = $('ai-raw-input').value.trim();
  if (!raw) { toast('先粘贴几行地点描述（格式如：地点名：描述，或纯描述）', true); return; }
  await saveConfig();
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (!lines.length) { toast('没有有效行（以 # 开头的注释行已跳过）', true); return; }

  $('btn-ai-go').disabled = true;
  $('ai-result').innerHTML = '<p class="hint">✨ AI 转写中（' + lines.length + ' 个地点，模型 ' + $('api-textModel').value + '）… 走你的中转站 API Key，稍等片刻</p>';
  const d = await api('/api/ai/prompt', 'POST', { lines });
  $('btn-ai-go').disabled = false;

  if (!d.ok) {
    $('ai-result').innerHTML = '<p class="hint" style="color:var(--err)">✗ ' + esc(d.error || '失败') + '</p>';
    toast('AI 转写失败', true);
    return;
  }

  // 展示结果 + 写入批量展开的地点清单
  const expandLines = d.items.map(it => `${it.name}, ${it.type === 'indoor' ? '室内' : '室外'}, ${it.prompt}`);
  const cur = $('expand-locations').value.trim();
  $('expand-locations').value = (cur ? cur + '\n' : '') + expandLines.join('\n');
  scheduleSave();

  $('ai-result').innerHTML = `
    <p class="hint" style="color:var(--accent2)">✔ ${d.items.length} 个地点已转写并写入「批量展开」的地点清单（下方可手动微调）：</p>
    <pre class="log" style="max-height:200px">${esc(d.items.map(it => `${it.name} [${it.type === 'indoor' ? '室内' : '室外'}]\n  ${it.prompt}`).join('\n'))}</pre>`;
  $('panel-expand').classList.add('open');
  toast(`AI 转写完成: ${d.items.length} 个地点（模型 ${d.model}）`);
}

// ── 批量展开：结构化变体 + 地点清单 → 任务行 ──

/** 当前是否启用全局前缀及其文本 */
function currentPrefix() {
  return $('prefix-enabled').checked ? ($('prefix-text').value.trim() ? $('prefix-text').value.trim() + '\n\n' : '') : '';
}

/** 从 UI 收集结构化变体：室内 [昼(锚点), 夜]；室外 = 启用的天气 × 昼/夜（第一个启用的昼 = 锚点） */
function collectVariants() {
  const indoor = [
    { name: '昼', prompt: $('expand-indoor-day').value.trim() },
    { name: '夜', prompt: $('expand-indoor-night').value.trim() },
  ].filter(v => v.prompt);

  const weatherDefs = [
    { key: 'sunny', name: '晴' },
    { key: 'overcast', name: '阴' },
    { key: 'snow', name: '雪' },
  ];
  const outdoor = [];
  for (const w of weatherDefs) {
    if (!$('expand-ow-' + w.key + '-enabled').checked) continue;
    const day = $('expand-ow-' + w.key + '-day').value.trim();
    const night = $('expand-ow-' + w.key + '-night').value.trim();
    if (day) outdoor.push({ name: w.name + '昼', prompt: day });
    if (night) outdoor.push({ name: w.name + '夜', prompt: night });
  }
  return { indoor, outdoor };
}

/** 解析地点清单：每行「文件夹/地点名, 室内|室外, 描述」，只切前两刀，描述可含逗号 */
function parseLocations(text) {
  const out = [];
  const bad = [];
  for (const line of (text || '').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const cuts = [];
    for (let i = 0; i < t.length && cuts.length < 2; i++) {
      if (t[i] === ',' || t[i] === '，') cuts.push(i);
    }
    let namePart = '', typePart = '', desc = '';
    if (cuts.length === 0) { bad.push(t); continue; }
    namePart = t.slice(0, cuts[0]).trim();
    typePart = (cuts.length >= 2 ? t.slice(cuts[0] + 1, cuts[1]) : t.slice(cuts[0] + 1)).trim();
    desc = cuts.length >= 2 ? t.slice(cuts[1] + 1).trim() : '';
    const isIndoor = /室内|indoor/i.test(typePart);
    const isOutdoor = /室外|outdoor/i.test(typePart);
    if (!namePart || (!isIndoor && !isOutdoor)) { bad.push(t); continue; }
    out.push({ name: namePart, type: isIndoor ? 'indoor' : 'outdoor', desc });
  }
  return { list: out, bad };
}

/** 导入提示词设计文档：识别「全局风格」与 室内/室外×晴/阴/雪×昼/夜 布局指令段落，一键填入 */
function importDesign() {
  const raw = $('design-import').value.trim();
  if (!raw) { toast('先粘贴提示词设计文档', true); return; }

  const targets = [
    { re: /室外.*晴.*昼|晴天组.*昼/, id: 'ow.sunny.day' },
    { re: /室外.*晴.*夜|晴天组.*夜/, id: 'ow.sunny.night' },
    { re: /室外.*阴.*昼|阴天组.*昼/, id: 'ow.overcast.day' },
    { re: /室外.*阴.*夜|阴天组.*夜/, id: 'ow.overcast.night' },
    { re: /室外.*雪.*昼|雪天组.*昼/, id: 'ow.snow.day' },
    { re: /室外.*雪.*夜|雪天组.*夜/, id: 'ow.snow.night' },
    { re: /室内.*昼/, id: 'in.day' },
    { re: /室内.*夜/, id: 'in.night' },
  ];
  const boxId = { 'in.day': 'expand-indoor-day', 'in.night': 'expand-indoor-night' };
  const isHan = s => /[\u4e00-\u9fff]/.test(s);
  const isEnglishLine = s => /[a-zA-Z]/.test(s) && s.replace(/[^a-zA-Z]/g, '').length >= 10;

  // 全局风格按空行分段，段落间用空行连接；纯中文说明行与引用符忽略
  let section = null;
  const globalBlocks = [];
  let curBlock = [];
  const flushBlock = () => { if (curBlock.length) { globalBlocks.push(curBlock.join('\n')); curBlock = []; } };
  const variantMap = new Map();

  for (const rawLine of raw.split(/\r?\n/)) {
    const l = rawLine.trim().replace(/^[\s*>]+/, '').replace(/\*+$/, '').trim();
    if (!l) { if (section === 'global') flushBlock(); continue; }
    if (/^全局风格/.test(l)) { flushBlock(); section = 'global'; continue; }
    if (/^室外版?布局指令|^室内版?布局指令/.test(l)) {
      flushBlock();
      const t = targets.find(t => t.re.test(l.replace(/\s/g, '')));
      section = t ? t.id : 'skip';
      continue;
    }
    if (section === 'global') {
      if (isEnglishLine(l)) curBlock.push(l);   // 纯中文说明行丢弃
    } else if (section && section !== 'skip') {
      if (isEnglishLine(l)) {
        if (!variantMap.has(section)) variantMap.set(section, []);
        variantMap.get(section).push(l);
      }
    }
  }
  flushBlock();

  const applied = [];
  if (globalBlocks.length) {
    $('prefix-text').value = globalBlocks.join('\n\n');
    $('prefix-enabled').checked = true;
    applied.push('全局风格');
  }
  let varCount = 0;
  const trySet = (id, val) => {
    if (!val?.length) return;
    const boxEl = $(boxId[id] || ('expand-ow-' + id.split('.')[1] + '-' + id.split('.')[2]));
    if (boxEl) { boxEl.value = val.join('\n'); varCount++; }
  };
  trySet('in.day', variantMap.get('in.day'));
  trySet('in.night', variantMap.get('in.night'));
  trySet('ow.sunny.day', variantMap.get('ow.sunny.day'));
  trySet('ow.sunny.night', variantMap.get('ow.sunny.night'));
  trySet('ow.overcast.day', variantMap.get('ow.overcast.day'));
  trySet('ow.overcast.night', variantMap.get('ow.overcast.night'));
  trySet('ow.snow.day', variantMap.get('ow.snow.day'));
  trySet('ow.snow.night', variantMap.get('ow.snow.night'));
  // 有内容的天气组自动勾选启用
  for (const w of ['sunny', 'overcast', 'snow']) {
    if (variantMap.has('ow.' + w + '.day') || variantMap.has('ow.' + w + '.night')) {
      $('expand-ow-' + w + '-enabled').checked = true;
    }
  }
  if (varCount) applied.push(`${varCount} 条布局指令`);
  if (!applied.length) {
    toast('没识别到「全局风格」或「布局指令」段落——检查段落标题是否以 全局风格 / 室内版布局指令 / 室外版布局指令 开头', true);
    return;
  }
  scheduleSave();
  toast('已导入：' + applied.join(' + '));
}

async function expandToTasks() {
  const { indoor, outdoor } = collectVariants();
  const { list: locations, bad } = parseLocations($('expand-locations').value);
  if (!indoor.length) { toast('室内变体至少要填「昼」的提示词（昼 = 锚点）', true); return; }
  if (!outdoor.length) { toast('室外变体至少要启用一种天气并填「昼」的提示词', true); return; }
  if (!locations.length) { toast('地点清单为空，或没有可识别的行', true); return; }

  // 展开时把全局前缀直接烘进每行提示词：行内即最终发送内容（中文描述原样发送）
  const gp = currentPrefix();
  let added = 0, updated = 0, skipped = 0;
  const normFile = s => (s || '').trim().replace(/\\/g, '/');
  for (const loc of locations) {
    // 名称部分可含「文件夹/」前缀
    const slash = loc.name.lastIndexOf('/');
    const folder = slash >= 0 ? loc.name.slice(0, slash).trim() : '';
    const name = slash >= 0 ? loc.name.slice(slash + 1).trim() : loc.name;
    if (!name) { bad.push(loc.name); continue; }
    const variants = loc.type === 'indoor' ? indoor : outdoor;
    const prefix = folder ? folder + '/' : '';
    const anchorFile = `${prefix}${name}-${variants[0].name}.png`;
    // 主体行：地点名必须进提示词（模型只看提示词，不看文件名），描述中英均可
    const subject = name + (loc.desc ? ': ' + loc.desc : '');
    for (const v of variants) {
      const file = `${prefix}${name}-${v.name}.png`;
      // 行内提示词 = 全局前缀 + 主体行 + 布局指令（昼/夜、天气），就是最终发给模型的内容
      const prompt = gp + subject + '\n' + v.prompt;
      const ref = v === variants[0] ? '' : anchorFile;
      const hit = tasks.find(t => normFile(t.file) === file);
      if (hit) {
        // 同名行已存在：提示词有变化则原位更新（保留行 id），无变化跳过
        if (hit.prompt !== prompt || hit.ref !== ref) { hit.prompt = prompt; hit.ref = ref; updated++; }
        else skipped++;
        continue;
      }
      tasks.push({ id: newId(), file, ref, prompt });
      added++;
    }
  }
  renderTasks();
  scheduleSave();
  let msg = `已展开 ${added} 行（${locations.length} 个地点）`;
  if (updated) msg += `，更新 ${updated} 行同名任务`;
  if (skipped) msg += `，${skipped} 行无变化跳过`;
  if (bad.length) msg += `，${bad.length} 行无法识别被忽略`;
  toast(msg, bad.length > 0);
}

// ── 上传参考图 ──

/** 上传本机图片作为参考图，上传后自动填入参考图列 */
async function uploadRefImage(task, inRefInput) {
  if (!currentOutputDir) { toast('请先设置输出目录', true); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    toast('上传参考图中: ' + file.name);
    try {
      const resp = await fetch('/api/upload-ref?name=' + encodeURIComponent(file.name), {
        method: 'POST',
        body: file,
      });
      const d = await resp.json();
      if (!d.ok) { toast(d.error || '上传失败', true); return; }
      // 自动填入参考图列
      task.ref = d.file;
      if (inRefInput) inRefInput.value = d.file;
      scheduleSave();
      toast(`已上传参考图 → ${d.file} (${(d.size / 1024).toFixed(0)} KB)`);
    } catch (e) {
      toast('上传失败: ' + e.message, true);
    }
  };
  input.click();
}

// ── 快速生成卡片（通用模式） ──

let quickCards = [];        // [{ id, file, prompt, ref, lastFile }]
const quickBusy = new Set();

function blankQuickCard() { return { id: newId(), file: '', prompt: '', ref: '', lastFile: '' }; }

function renderQuickCards() {
  const grid = $('quick-grid');
  if (!grid) return;
  grid.innerHTML = '';
  quickCards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'qcard';

    const head = document.createElement('div');
    head.className = 'qhead';
    const title = document.createElement('span');
    title.textContent = `卡片 ${i + 1}`;
    head.appendChild(title);
    const del = document.createElement('button');
    del.className = 'small danger';
    del.textContent = '✕ 删除';
    del.onclick = () => { quickCards.splice(i, 1); renderQuickCards(); scheduleSave(); };
    head.appendChild(del);
    el.appendChild(head);

    const inFile = document.createElement('input');
    inFile.type = 'text';
    inFile.placeholder = `文件名（可选，如 人像-女主；留空自动命名）`;
    inFile.value = card.file || '';
    inFile.oninput = () => { card.file = inFile.value; scheduleSave(); };
    el.appendChild(inFile);

    const ta = document.createElement('textarea');
    ta.rows = 3;
    ta.placeholder = '这一张的提示词（人像 / 场景 / 道具均可）';
    ta.value = card.prompt || '';
    ta.oninput = () => { card.prompt = ta.value; scheduleSave(); };
    el.appendChild(ta);

    const refRow = document.createElement('div');
    refRow.className = 'qref';
    const upBtn = document.createElement('button');
    upBtn.className = 'small';
    upBtn.textContent = '📁 参考图';
    upBtn.title = '上传本机图片作为参考图（存到输出目录 _uploads/）';
    upBtn.onclick = () => uploadQuickRef(i);
    refRow.appendChild(upBtn);
    if (card.ref) {
      const name = document.createElement('span');
      name.className = 'refname';
      name.textContent = card.ref;
      refRow.appendChild(name);
      const clear = document.createElement('button');
      clear.className = 'small';
      clear.textContent = '✕';
      clear.title = '清除参考图';
      clear.onclick = () => { card.ref = ''; renderQuickCards(); scheduleSave(); };
      refRow.appendChild(clear);
    }
    el.appendChild(refRow);

    const genBtn = document.createElement('button');
    genBtn.className = 'primary';
    genBtn.textContent = quickBusy.has(card.id) ? '生成中…' : (card.lastFile ? '再次生成' : '生成 ▶');
    genBtn.disabled = quickBusy.has(card.id);
    genBtn.onclick = () => genQuickCard(i);
    el.appendChild(genBtn);

    if (card.lastFile) {
      const img = document.createElement('img');
      img.className = 'qresult';
      img.src = '/files/' + encodeURIComponent(card.lastFile) + '?v=' + Date.now();
      img.alt = card.lastFile;
      img.onclick = () => showBig(card.lastFile);
      el.appendChild(img);
    }
    grid.appendChild(el);
  });
}

async function genQuickCard(i) {
  const card = quickCards[i];
  if (!card) return;
  if (!card.prompt.trim()) { toast('先填写提示词', true); return; }
  if (!currentOutputDir) { toast('请先在设置区选择输出目录', true); return; }
  if (quickBusy.has(card.id)) return;
  quickBusy.add(card.id);
  renderQuickCards();
  try {
    await saveConfig();
    // 快速卡片：全局前缀在发送前拼上（行内不需要预烘焙）
    const prompt = currentPrefix() + card.prompt.trim();
    const d = await api('/api/quick', 'POST', { prompt, ref: card.ref || '', file: card.file || '' });
    if (!d.ok) { toast(d.error || '生成失败', true); return; }
    card.lastFile = d.file;
    toast('已生成 → ' + d.file);
    scheduleSave();
  } catch (e) {
    toast('生成失败: ' + e.message, true);
  } finally {
    quickBusy.delete(card.id);
    renderQuickCards();
  }
}

function addQuickCard() {
  quickCards.push(blankQuickCard());
  renderQuickCards();
  scheduleSave();
}

function uploadQuickRef(i) {
  if (!currentOutputDir) { toast('请先在设置区选择输出目录', true); return; }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp';
  input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    toast('上传参考图中: ' + f.name);
    try {
      const resp = await fetch('/api/upload-ref?name=' + encodeURIComponent(f.name), { method: 'POST', body: f });
      const d = await resp.json();
      if (!d.ok) { toast(d.error || '上传失败', true); return; }
      quickCards[i].ref = d.file;
      renderQuickCards();
      scheduleSave();
      toast(`参考图已导入 → ${d.file}`);
    } catch (e) {
      toast('上传失败: ' + e.message, true);
    }
  };
  input.click();
}

// ── 目录浏览器 ──

let currentOutputDir = '';

async function browseOutputDir() {
  const box = document.createElement('div');
  box.className = 'overlay';
  box.innerHTML = `<div class="box dirbrowser">
    <div class="path" id="db-path">…</div>
    <ul id="db-list"></ul>
    <div class="row-actions">
      <button class="primary" id="db-pick">选这里</button>
      <button onclick="this.closest('.overlay').remove()">取消</button>
      <input type="text" id="db-manual" placeholder="或手动输入完整路径" style="flex:1">
    </div>
  </div>`;
  document.body.appendChild(box);
  let cur = currentOutputDir || '';

  async function load(p) {
    $('db-path').textContent = p || '（选择盘符或输入路径）';
    const d = await api('/api/browse', 'POST', { path: p });
    const ul = $('db-list');
    ul.innerHTML = '';
    if (d.error) { $('db-path').textContent = d.error; return; }
    cur = d.path || p;
    $('db-path').textContent = cur || '我的电脑';
    if (d.parent !== undefined && d.parent) {
      const li = document.createElement('li');
      li.className = 'up'; li.textContent = '⬑ 上级目录';
      li.onclick = () => load(d.parent);
      ul.appendChild(li);
    }
    for (const dir of d.dirs || []) {
      const li = document.createElement('li');
      li.textContent = '📁 ' + dir;
      // 根列表的盘符条目（如 D:\）本身就是完整路径，不能再往前拼分隔符
      li.onclick = () => load(/^[a-zA-Z]:\\?$/.test(dir) ? dir : cur + (cur.endsWith('\\') ? '' : '\\') + dir);
      ul.appendChild(li);
    }
  }
  await load(currentOutputDir || '');

  $('db-pick').onclick = async () => {
    let target = $('db-manual').value.trim() || cur;
    if (!target || target === '我的电脑') { toast('请先进入一个具体目录', true); return; }
    const check = await api('/api/browse', 'POST', { path: target });
    if (check.error) { toast('路径不可用: ' + check.error, true); return; }
    currentOutputDir = check.path;
    $('outputDir-show').textContent = currentOutputDir;
    await saveConfig();
    toast('输出目录已设置: ' + currentOutputDir);
    box.remove();
  };
}

// ── 连接测试 / 预检 / 执行 ──

async function testConnection() {
  await saveConfig();
  $('conn-result').textContent = '测试中…';
  const d = await api('/api/test-connection', 'POST');
  if (d.ok) {
    $('conn-result').textContent = `✓ 连接成功，可用模型 ${(d.models || []).length} 个`;
    if (d.models?.length) { fetchedModels = d.models; renderComboMenus(); }
    toast('连接成功');
  } else {
    $('conn-result').textContent = '✗ 连接失败: ' + (d.error || '未知错误');
    toast('连接失败', true);
  }
}

async function doPreflight() {
  await saveConfig();
  const d = await api('/api/preflight', 'POST');
  preflightMap = new Map();
  for (const t of d.tasks || []) {
    preflightMap.set(t.id, { refKind: t.refKind, refMsg: t.refMsg, done: t.done, fileExists: t.fileExists, blocked: t.refKind === 'blocked', level: t.level });
  }
  renderTasks();

  const s = d.summary || {};
  $('run-summary').innerHTML = `
    <span class="chip"><b>${s.total ?? 0}</b>总任务</span>
    <span class="chip ok"><b>${s.anchors ?? 0}</b>锚点(文生图)</span>
    <span class="chip ok"><b>${s.derived ?? 0}</b>派生(参考图)</span>
    <span class="chip"><b>${s.done ?? 0}</b>已生成</span>
    <span class="chip ${s.blocked ? 'err' : ''}"><b>${s.blocked ?? 0}</b>参考缺失</span>
    <span class="chip warn"><b>${(d.levels || []).length}</b>执行批次</span>`;

  const errs = (d.problems || []).filter(p => p.level === 'error');
  if (errs.length) toast(`预检发现 ${errs.length} 个问题，看任务表红色标记`, true);
  else toast('预检通过 ✓');
}

let runtimeStatuses = new Map();
let pollTimer = null;

async function startBatch() {
  if (!currentOutputDir) { toast('请先选择输出目录', true); return; }
  await saveConfig();
  await doPreflight();
  const d = await api('/api/start', 'POST');
  if (!d.ok) { toast(d.error || '启动失败', true); return; }
  toast(`已启动: 计划 ${d.planned} 张，分 ${d.levels} 批`);
  $('btn-start').disabled = true;
  $('btn-stop').disabled = false;
  startPolling();
}

async function stopBatch() {
  await api('/api/stop', 'POST');
  toast('停止请求已发送，完成在途任务后停止');
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollStatus, 1200);
  pollStatus();
}

async function pollStatus() {
  const d = await api('/api/status');
  runtimeStatuses = new Map(Object.entries(d.statuses || {}));
  const total = d.total || 0;
  const done = (d.done || 0) + (d.skip || 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('prog').style.width = pct + '%';
  $('prog-text').textContent = total ? `${done}/${total}（成功 ${d.done} · 失败 ${d.fail} · 跳过 ${d.skip}）${d.running ? '' : ' — 已结束'}` : '待开始';
  $('log').textContent = (d.log || []).join('\n');
  $('log').scrollTop = $('log').scrollHeight;
  $('useStats').textContent = d.usage && d.usage.images ? `本次已用: ${d.usage.images} 张图 / input ${d.usage.input} tok / output ${d.usage.output} tok` : '';

  // 刷新任务表徽章
  renderTasks();

  if (!d.running && pollTimer) {
    clearInterval(pollTimer); pollTimer = null;
    $('btn-start').disabled = false;
    $('btn-stop').disabled = true;
    loadGallery(true);
    doPreflight();
  }
}

// ── 画廊 ──

/** 已审隐藏集（localStorage，按输出目录区分；只影响显示，不动文件和记录） */
function galleryHidden() {
  try { return new Set(JSON.parse(localStorage.getItem('cg-gallery-hidden') || '[]')); }
  catch { return new Set(); }
}
function saveGalleryHidden(set) {
  try { localStorage.setItem('cg-gallery-hidden', JSON.stringify([...set])); } catch { /* ignore */ }
}

function hideAllGallery() {
  api('/api/gallery').then(d => {
    const hidden = galleryHidden();
    for (const it of d.items || []) hidden.add(it.file);
    saveGalleryHidden(hidden);
    loadGallery();
    toast(`已把 ${d.items?.length || 0} 张标记为已审并清空显示（文件与记录未动）`);
  });
}

function resetGalleryHidden() {
  saveGalleryHidden(new Set());
  loadGallery();
  toast('已恢复显示全部图片');
}

function hideOneGallery(file) {
  const hidden = galleryHidden();
  hidden.add(file);
  saveGalleryHidden(hidden);
  loadGallery();
}

async function loadGallery(autoOpen = false) {
  const d = await api('/api/gallery');
  const g = $('gallery');
  if (autoOpen) $('panel-gallery').classList.add('open');
  const hidden = galleryHidden();
  const visible = (d.items || []).filter(it => !hidden.has(it.file));
  const hiddenCount = (d.items || []).length - visible.length;
  $('gallery-hidden-count').textContent = hiddenCount > 0 ? `已隐藏 ${hiddenCount} 张已审图（显示全部可恢复）` : '';
  if (!visible.length) {
    g.innerHTML = `<p class="hint">${(d.items || []).length ? '（全部已标记为已审 — 点「显示全部」恢复）' : '（还没有已完成的图片）'}</p>`;
    return;
  }
  g.innerHTML = visible.map(it => `
    <div class="card">
      <img src="/files/${encodeURIComponent(it.file)}" onclick="showBig('${esc(it.file)}')" loading="lazy"
           alt="${esc(it.file)}">
      <div class="meta">
        <div class="name">${esc(it.file)}</div>
        <div class="sub">${it.ref ? '参考: ' + esc(it.ref) : '锚点·文生图'} · ${(it.bytes / 1024).toFixed(0)} KB</div>
      </div>
      <div class="ops">
        <button class="small" onclick="regenOne('${esc(it.file)}')">重生成</button>
        <button class="small danger" onclick="deleteImage('${esc(it.file)}')">删除</button>
        <button class="small" onclick="cutoutOne('${esc(it.file)}')">${it.cut ? '✂ 重抠' : '✂ 抠白底'}</button>
        <button class="small" onclick="hideOneGallery('${esc(it.file)}')" title="从列表隐藏（不删文件）">✔ 已审</button>
      </div>
      ${it.cut ? `<div class="sub" style="padding:0 9px 6px; color:var(--accent2)">已抠图: ${esc(it.cut)}</div>` : ''}
    </div>`).join('');
}

// ── 白底抠图（边缘泛洪填充：只删与边框连通的白色，保护被轮廓包住的白色） ──

/** 纯算法：输入像素数据，返回带透明度的像素数据（不依赖 canvas，可单测） */
function processCutoutData(src, tolerance, feather) {
  const W = src.width, H = src.height;
  const d = src.data;
  const out = new Uint8ClampedArray(d);
  const T = 255 - tolerance;                 // 通道下限（≥T 视为白）
  const isWhite = p => {
    const i = p * 4;
    return d[i] >= T && d[i + 1] >= T && d[i + 2] >= T;
  };
  // 1) 从四条边 BFS 泛洪，标记与边框连通的白色区域 = 背景
  const mask = new Uint8Array(W * H);        // 1 = 背景
  const queue = new Int32Array(W * H);
  let qh = 0, qt = 0;
  const seed = p => { if (!mask[p] && isWhite(p)) { mask[p] = 1; queue[qt++] = p; } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  const bgCount = qt;
  while (qh < qt) {
    const p = queue[qh++];
    const x = p % W, y = (p - x) / W;
    if (x > 0) seed(p - 1);
    if (x < W - 1) seed(p + 1);
    if (y > 0) seed(p - W);
    if (y < H - 1) seed(p + W);
  }
  if (bgCount >= W * H * 0.995) throw new Error('几乎整张都被判为背景——容差过大或这张图不适合抠白底');
  // 2) 背景 → 全透明
  for (let p = 0; p < W * H; p++) if (mask[p]) out[p * 4 + 3] = 0;
  // 3) 边缘羽化：向角色内扩 feather 圈，按“白度”给渐变 alpha，并做去白合成（消除白边）
  let ring = new Uint8Array(mask);
  for (let k = 1; k <= feather; k++) {
    const next = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      if (ring[p]) continue;
      if (ring[p - 1] || ring[p + 1] || ring[p - W] || ring[p + W]) next[p] = 1;
    }
    for (let p = 0; p < W * H; p++) {
      if (!next[p]) continue;
      const i = p * 4;
      const mn = Math.min(d[i], d[i + 1], d[i + 2]);
      const w = Math.max(0, Math.min(1, (mn - T) / (255 - T)));   // 白度 0~1
      if (w < 0.04) continue;                                      // 基本不白，不动
      const a = Math.round(255 * (1 - w));
      if (a < out[i + 3]) {
        out[i + 3] = a;
        const af = a / 255;                                        // 去白合成: obs = a*C + (1-a)*255
        if (af > 0.05) {
          out[i]     = Math.max(0, Math.min(255, (d[i]     - (1 - af) * 255) / af));
          out[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - (1 - af) * 255) / af));
          out[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - (1 - af) * 255) / af));
        }
      }
    }
    ring = next;
  }
  return { data: out, width: W, height: H };
}

/** 加载一张输出目录图片并抠图，返回 PNG blob */
async function cutoutImageBlob(file, tolerance, feather) {
  const img = new Image();
  img.src = '/files/' + encodeURIComponent(file) + '?v=' + Date.now();
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, cv.width, cv.height);
  const result = processCutoutData(src, tolerance, feather);
  ctx.putImageData(new ImageData(result.data, result.width, result.height), 0, 0);
  return new Promise(resolve => cv.toBlob(resolve, 'image/png'));
}

async function saveCutout(file, blob) {
  const r = await fetch('/api/cutout?file=' + encodeURIComponent(file), { method: 'POST', body: blob });
  return r.json();
}

async function cutoutOne(file) {
  const tolerance = Number($('cut-tolerance').value) || 12;
  const feather = Number($('cut-feather').value) || 1;
  toast('抠图中: ' + file);
  try {
    const blob = await cutoutImageBlob(file, tolerance, feather);
    const r = await saveCutout(file, blob);
    if (!r.ok) { toast(r.error || '保存失败', true); return; }
    toast('已抠图 → ' + r.cutout);
    loadGallery();
  } catch (e) {
    toast('抠图失败: ' + e.message, true);
  }
}

async function batchCutout() {
  const d = await api('/api/gallery');
  const todo = (d.items || []).filter(it => !it.cut);
  if (!todo.length) { toast('没有待抠图的图片（全部已抠或无图）'); return; }
  const tolerance = Number($('cut-tolerance').value) || 12;
  const feather = Number($('cut-feather').value) || 1;
  let ok = 0, fail = 0;
  for (const it of todo) {
    try {
      const blob = await cutoutImageBlob(it.file, tolerance, feather);
      const r = await saveCutout(it.file, blob);
      if (r.ok) ok++; else fail++;
    } catch (e) {
      fail++;
      console.warn('[cutout]', it.file, e.message);
    }
  }
  toast(`批量抠图完成: 成功 ${ok} / 失败 ${fail}`, fail > 0);
  loadGallery();
}

async function showBig(file) {
  const d = await api('/api/gallery');
  const it = (d.items || []).find(x => x.file === file);
  const box = document.createElement('div');
  box.className = 'overlay';
  box.onclick = e => { if (e.target === box) box.remove(); };
  box.innerHTML = `<div class="box">
    <img class="big" src="/files/${encodeURIComponent(file)}">
    <div class="caption"><b style="color:var(--text)">${esc(file)}</b>
参考: ${it?.ref ? esc(it.ref) : '无（文生图锚点）'}
${it?.composedPrompt && it.composedPrompt !== it?.prompt ? '行内提示词: ' + esc(it.prompt || '') + '\n合成提示词: ' + esc(it.composedPrompt) : '提示词: ' + esc(it?.prompt || '')}
${it?.revisedPrompt ? '模型改写后: ' + esc(it.revisedPrompt) : ''}</div>
  </div>`;
  document.body.appendChild(box);
}

async function regenOne(file) {
  const t = tasks.find(x => x.file === file);
  if (!t) { toast('任务表中找不到 ' + file + '（重生成需要清单里有这一行）', true); return; }
  const d = await api('/api/retry', 'POST', { ids: [t.id] });
  if (!d.ok) { toast(d.error || '失败', true); return; }
  toast('已加入重生成队列');
  $('btn-start').disabled = true;
  $('btn-stop').disabled = false;
  startPolling();
}

async function deleteImage(file) {
  if (!confirm('删除 ' + file + '？（同时删除 manifest 记录）')) return;
  await api('/api/delete-image', 'POST', { file });
  loadGallery();
  doPreflight();
}

// ── PostImages 图床上传 ──

let uploadGroups = [];        // [{ folder, galleryRef, files }]
let uploadPollTimer = null;

function renderUploadGroups() {
  const box = $('upload-groups');
  if (!uploadGroups.length) { box.innerHTML = '<p class="hint">（先扫描输出目录，或输出目录里还没有图片）</p>'; return; }
  box.innerHTML = uploadGroups.map((g, i) => `
    <div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
      <div style="width:160px;font-size:13px;color:var(--text)">📁 ${esc(g.folder || '（根目录）')}</div>
      <input type="text" style="flex:1" placeholder="图库链接或ID（留空=不进图库）" value="${esc(g.galleryRef || '')}"
             oninput="updateGalleryMap(${i}, this.value)">
      <span class="hint">${g.files.length} 张 · 已传 ${g.files.filter(f => f.uploaded).length}</span>
    </div>`).join('');
}

function updateGalleryMap(i, value) {
  uploadGroups[i].galleryRef = value;
  scheduleSave();
}

/** 从当前 UI 状态（含图库映射表）收集 postimg 配置 */
function collectPostimg() {
  const map = {};
  for (const g of uploadGroups) if (g.galleryRef) map[g.folder] = g.galleryRef;
  return { key: $('postimg-key').value.trim(), galleryMap: map };
}

async function scanUploads() {
  const d = await api('/api/postimg/scan', 'POST');
  if (d.error) { toast(d.error, true); return; }
  uploadGroups = d.groups || [];
  renderUploadGroups();
  const total = uploadGroups.reduce((n, g) => n + g.files.length, 0);
  const done = uploadGroups.reduce((n, g) => n + g.files.filter(f => f.uploaded).length, 0);
  toast(`扫描完成: ${total} 张图，${uploadGroups.length} 个分组，已上传 ${done} 张`);
}

async function startUploads() {
  await saveConfig();
  const d = await api('/api/postimg/start', 'POST');
  if (!d.ok) { toast(d.error || '启动失败', true); return; }
  $('btn-up-start').disabled = true;
  $('btn-up-stop').disabled = false;
  startUploadPolling();
}

async function stopUploads() {
  await api('/api/postimg/stop', 'POST');
}

function startUploadPolling() {
  if (uploadPollTimer) clearInterval(uploadPollTimer);
  uploadPollTimer = setInterval(pollUploadStatus, 1200);
  pollUploadStatus();
}

async function pollUploadStatus() {
  const d = await api('/api/postimg/status');
  const total = d.total || 0;
  const done = (d.done || 0) + (d.skip || 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('up-prog').style.width = pct + '%';
  $('up-prog-text').textContent = total
    ? `${done}/${total}（成功 ${d.done} · 失败 ${d.fail} · 跳过 ${d.skip}）${d.running ? (d.current ? ' · 正在: ' + d.current : '') : ' — 已结束'}`
    : '待上传';
  $('up-log').textContent = (d.log || []).join('\n');
  $('up-log').scrollTop = $('up-log').scrollHeight;
  if (!d.running && uploadPollTimer) {
    clearInterval(uploadPollTimer); uploadPollTimer = null;
    $('btn-up-start').disabled = false;
    $('btn-up-stop').disabled = true;
    if (d.fail > 0) toast(`上传完成，${d.fail} 张失败（看日志）`, true);
    else if (d.done > 0) toast('上传完成，文档已写入输出目录');
    scanUploads();
  }
}

// ── 自动保存（防抖）──

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveConfig, 800);
}

// ── AI 对话式聊天 ──

let chatHistory = [];   // [{ role: 'user'|'assistant', content }]
let chatAbort = null;

function renderChatMessages() {
  const box = $('chat-messages');
  box.innerHTML = '';
  for (const msg of chatHistory) {
    const div = document.createElement('div');
    div.className = 'chat-bubble ' + msg.role;
    const tag = document.createElement('div');
    tag.className = 'role-tag';
    tag.textContent = msg.role === 'user' ? '你' : 'AI';
    div.appendChild(tag);
    const content = document.createElement('div');
    // 简单 markdown 代码块高亮：把 ``` 包围的部分渲染为 prompt-block
    const html = esc(msg.content).replace(/```([\s\S]*?)```/g, (m, p1) => {
      const code = p1.replace(/^\w*\n/, '').replace(/\n$/, '').trim();
      return `<div class="prompt-block">${esc(code)}</div>`;
    });
    content.innerHTML = html;
    div.appendChild(content);
    box.appendChild(div);
  }
  box.scrollTop = box.scrollHeight;
}

async function chatSend() {
  const input = $('chat-input');
  const text = input.value.trim();
  if (!text) return;
  if (chatAbort) { toast('上一条还在发送中…', true); return; }
  if (!config_hasKey()) { toast('先在设置区填好 API 地址和 Key', true); return; }

  await saveConfig();

  const model = $('chat-model').value.trim() || $('api-textModel').value.trim() || 'gpt-5-6-mini';
  $('chat-model').value = model;

  // 添加用户消息
  chatHistory.push({ role: 'user', content: text });
  input.value = '';
  renderChatMessages();

  // 添加空的 AI 消息（流式填充）
  const aiMsg = { role: 'assistant', content: '' };
  chatHistory.push(aiMsg);
  renderChatMessages();
  // 找到刚渲染的气泡，加 streaming 类
  const bubbles = $('chat-messages').querySelectorAll('.chat-bubble.assistant');
  const lastBubble = bubbles[bubbles.length - 1];
  if (lastBubble) lastBubble.classList.add('streaming');

  $('btn-chat-send').disabled = true;
  $('chat-status').textContent = 'AI 思考中…';

  try {
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        model,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
    }

    // SSE 流式读取
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let gotError = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { gotError = parsed.error; continue; }
          if (parsed.content) {
            aiMsg.content += parsed.content;
            // 实时更新最后一条气泡的内容（不重渲染全部，只改文本）
            if (lastBubble) {
              const contentDiv = lastBubble.querySelector('div:last-child');
              if (contentDiv) {
                const html = esc(aiMsg.content).replace(/```([\s\S]*?)```/g, (m, p1) => {
                  const code = p1.replace(/^\w*\n/, '').replace(/\n$/, '').trim();
                  return `<div class="prompt-block">${esc(code)}</div>`;
                });
                contentDiv.innerHTML = html;
              }
              $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
            }
          }
        } catch { /* 跳过不完整行 */ }
      }
    }

    if (gotError) throw new Error(gotError);
    if (!aiMsg.content.trim()) aiMsg.content = '（AI 返回了空回复）';
    renderChatMessages(); // 最终完整渲染
    $('chat-status').textContent = '';
  } catch (e) {
    aiMsg.content = '✗ 错误: ' + e.message;
    renderChatMessages();
    $('chat-status').textContent = '发送失败';
    toast('聊天失败: ' + e.message, true);
  } finally {
    if (lastBubble) lastBubble.classList.remove('streaming');
    $('btn-chat-send').disabled = false;
    chatAbort = null;
  }
}

function chatClear() {
  if (chatHistory.length && !confirm('清空全部对话历史？')) return;
  chatHistory = [];
  renderChatMessages();
  $('chat-status').textContent = '';
}

/** 从 AI 最后一条回复中提取文本（去掉中文解释，保留英文提示词段落） */
function chatGetLastAIContent() {
  // 从后往前找最后一条 AI 消息
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === 'assistant' && chatHistory[i].content.trim()) {
      return chatHistory[i].content;
    }
  }
  return '';
}

/** 从文本中提取看起来像英文提示词的段落（代码块优先，否则整段英文行） */
function extractPrompts(text) {
  // 优先提取 ``` 代码块
  const blocks = [];
  const blockMatch = text.match(/```(?:\w*)?\s*([\s\S]*?)```/g);
  if (blockMatch) {
    for (const b of blockMatch) {
      const code = b.replace(/```(?:\w*)?\s*/, '').replace(/```$/, '').trim();
      if (code) blocks.push(code);
    }
  }
  if (blocks.length) return blocks;
  // 没有代码块，尝试提取连续的英文行
  const lines = text.split('\n');
  const engLines = lines.filter(l => /^[A-Za-z]/.test(l.trim()) && l.trim().length > 20);
  return engLines.length ? [engLines.join('\n')] : [text.trim()];
}

function chatExportToTasks() {
  const content = chatGetLastAIContent();
  if (!content) { toast('没有 AI 回复可导入', true); return; }
  const blocks = extractPrompts(content);
  let added = 0;
  for (const b of blocks) {
    // 按行尝试解析为 地点名: 提示词
    for (const line of b.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const m = t.match(/^(.+?)[:：]\s*(.+)$/);
      if (m) {
        tasks.push({ id: newId(), file: m[1].trim(), ref: '', prompt: m[2].trim() });
        added++;
      } else if (t.length > 10 && /[a-zA-Z]/.test(t)) {
        // 纯英文行也加进去，文件名留空让用户填
        tasks.push({ id: newId(), file: '', ref: '', prompt: t });
        added++;
      }
    }
  }
  if (added) {
    renderTasks(); scheduleSave();
    toast(`已导入 ${added} 行到任务表（请检查文件名）`);
    $('panel-tasks').classList.add('open');
  } else {
    toast('未能从回复中提取到提示词（AI 回复可能只有中文解释）', true);
  }
}

function chatExportToLocations() {
  const content = chatGetLastAIContent();
  if (!content) { toast('没有 AI 回复可导入', true); return; }
  const blocks = extractPrompts(content);
  const lines = [];
  for (const b of blocks) {
    for (const line of b.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      // 尝试解析 "地点名: 提示词" → 转为 "地点名, 室外, 提示词"（用户可手动改室内/室外）
      const m = t.match(/^(.+?)[:：]\s*(.+)$/);
      if (m) {
        lines.push(`${m[1].trim()}, 室外, ${m[2].trim()}`);
      } else if (t.length > 10 && /[a-zA-Z]/.test(t)) {
        lines.push(t);
      }
    }
  }
  if (lines.length) {
    setMode('location');
    const cur = $('expand-locations').value.trim();
    $('expand-locations').value = (cur ? cur + '\n' : '') + lines.join('\n');
    scheduleSave();
    $('panel-expand').classList.add('open');
    toast(`已导入 ${lines.length} 行到地点清单（请检查室内/室外标记）`);
  } else {
    toast('未能从回复中提取到可导入的行', true);
  }
}

function chatExportToPrefix() {
  const content = chatGetLastAIContent();
  if (!content) { toast('没有 AI 回复可导入', true); return; }
  const blocks = extractPrompts(content);
  const text = blocks.join('\n');
  if (!text) { toast('提取不到英文文本', true); return; }
  $('prefix-text').value = text;
  $('prefix-enabled').checked = true;
  scheduleSave();
  $('panel-api').classList.add('open');
  $('adv-settings').open = true;
  toast('已导入到全局风格前缀');
}

/** 检查是否已配置 API Key */
function config_hasKey() {
  const baseUrl = $('api-baseUrl').value.trim();
  const key = $('api-key').value.trim();
  return !!(baseUrl && key);
}

// ── 启动 ──

// 设置区输入自动保存（防抖落盘）
['api-baseUrl', 'api-key', 'api-model', 'api-concurrency', 'api-autoRetry', 'api-timeoutSec', 'api-textModel',
 'prefix-text', 'expand-indoor-day', 'expand-indoor-night',
 'expand-ow-sunny-day', 'expand-ow-sunny-night',
 'expand-ow-overcast-day', 'expand-ow-overcast-night',
 'expand-ow-snow-day', 'expand-ow-snow-night',
 'expand-locations', 'postimg-key', 'chat-model'].forEach(id => {
    $(id).addEventListener('input', scheduleSave);
  });
['expand-ow-sunny-enabled', 'expand-ow-overcast-enabled', 'expand-ow-snow-enabled', 'api-antiCache'].forEach(id => {
  $(id).addEventListener('change', scheduleSave);
});
$('prefix-enabled').addEventListener('change', scheduleSave);

// API 地址或 Key 变更后，延时自动拉取模型列表（防抖）
let modelFetchTimer = null;
function scheduleModelFetch() {
  clearTimeout(modelFetchTimer);
  modelFetchTimer = setTimeout(autoFetchModels, 1200);
}
['api-baseUrl', 'api-key'].forEach(id => { $(id).addEventListener('input', scheduleModelFetch); });

// Ctrl+Enter 发送聊天
$('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); chatSend(); }
});

// 同步 chat-model 默认值
function syncChatModel() {
  if (!$('chat-model').value.trim()) {
    $('chat-model').value = $('api-textModel').value.trim() || 'gpt-5-6-mini';
  }
}
$('api-textModel').addEventListener('input', () => {
  if (!$('chat-model').value.trim()) $('chat-model').value = $('api-textModel').value.trim();
});

initMode();
setupModelCombo('combo-api-model', 'api-model');
setupModelCombo('combo-api-textModel', 'api-textModel');
setupModelCombo('combo-chat-model', 'chat-model');
loadConfigToUI().then(() => {
  syncChatModel();
  api('/api/status').then(d => {
    runtimeStatuses = new Map(Object.entries(d.statuses || {}));
    if (d.running) { $('btn-start').disabled = true; $('btn-stop').disabled = false; startPolling(); }
    renderTasks();
    loadGallery();
  });
  doPreflight();
  renderChatMessages();
  autoFetchModels(true);  // 静默拉取模型列表，填充组合框下拉选项
});
