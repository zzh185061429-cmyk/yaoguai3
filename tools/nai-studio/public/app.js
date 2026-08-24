/* NAI Studio 前端 — 原生 JS，无构建 */

// ── 工具函数 ──

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(36).slice(2));

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

// ── 全局状态 ──

let tasks = [];            // { id, file, ref, prompt, seed }
let roles = [];            // 角色卡
let quickCards = [];       // 快速生图卡片
let artists = [];          // 画师串收藏
let preflightMap = new Map();
let metaInfo = null;       // /api/meta 结果
let currentOutputDir = '';

// ── 配置读写 ──

function collectConfigFromUI() {
  return {
    nai: {
      token: $('nai-token').value.trim(),
      model: $('nai-model').value,
      width: Number($('nai-width').value) || 832,
      height: Number($('nai-height').value) || 1216,
      steps: Number($('nai-steps').value) || 28,
      scale: Number($('nai-scale').value) || 5,
      sampler: $('nai-sampler').value,
      noiseSchedule: $('nai-noiseSchedule').value,
      cfgRescale: Number($('nai-cfgRescale').value) || 0,
      ucPreset: Number($('nai-ucPreset').value) || 0,
      qualityToggle: $('nai-qualityToggle').checked,
      img2imgStrength: Number($('nai-img2imgStrength').value) || 0.6,
      concurrency: Number($('nai-concurrency').value) || 1,
      requestIntervalMs: Number($('nai-requestIntervalMs').value) || 3000,
      autoRetry: Number($('nai-autoRetry').value) || 0,
      timeoutSec: Number($('nai-timeoutSec').value) || 180,
      proxyUrl: $('nai-proxyUrl').value.trim(),
    },
    globalPrefix: { enabled: $('prefix-enabled').checked, text: $('prefix-text').value },
    globalNegative: { text: $('globalNegative-text').value },
    outputDir: currentOutputDir,
    tasks, roles, quick: quickCards.map(c => ({ id: c.id, file: c.file, prompt: c.prompt, ref: c.ref || '', lastFile: c.lastFile || '' })),
    artists,
    budget: { enabled: $('budget-enabled').checked, anlasLimit: Number($('budget-anlasLimit').value) || 500 },
  };
}

let saveTimer = null;
function saveConfigSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => api('/api/config', 'POST', collectConfigFromUI()), 800);
}

async function loadConfigToUI() {
  const c = await api('/api/config');
  metaInfo = await api('/api/meta');
  // 模型下拉
  $('nai-model').innerHTML = Object.entries(metaInfo.models).map(([k, v]) =>
    `<option value="${esc(k)}">${esc(v.label)}</option>`).join('');
  $('nai-sampler').innerHTML = metaInfo.samplers.map(s => `<option value="${s}">${s}</option>`).join('');
  $('nai-noiseSchedule').innerHTML = metaInfo.noiseSchedules.map(s => `<option value="${s}">${s}</option>`).join('');
  $('nai-resolution').innerHTML = Object.entries(metaInfo.resolutions).map(([k, [w, h]]) =>
    `<option value="${k}">${w}×${h}</option>`).join('');

  const n = c.nai || {};
  $('nai-token').value = '';           // 脱敏值不回填输入框；已有 token 显示在占位提示
  if (c.hasToken) $('nai-token').placeholder = '已保存（' + (n.token || 'pst-…') + '）— 留空保持不变';
  $('nai-model').value = n.model || 'nai-diffusion-4-5-full';
  $('nai-width').value = n.width || 832; $('nai-height').value = n.height || 1216;
  $('nai-steps').value = n.steps ?? 28; $('nai-scale').value = n.scale ?? 5;
  $('nai-sampler').value = n.sampler || 'k_euler_ancestral';
  $('nai-noiseSchedule').value = n.noiseSchedule || 'karras';
  $('nai-cfgRescale').value = n.cfgRescale ?? 0;
  $('nai-ucPreset').value = String(n.ucPreset ?? 0);
  $('nai-qualityToggle').checked = n.qualityToggle !== false;
  $('nai-img2imgStrength').value = n.img2imgStrength ?? 0.6;
  $('nai-concurrency').value = n.concurrency ?? 1;
  $('nai-requestIntervalMs').value = n.requestIntervalMs ?? 3000;
  $('nai-autoRetry').value = n.autoRetry ?? 1;
  $('nai-timeoutSec').value = n.timeoutSec ?? 180;
  $('nai-proxyUrl').value = n.proxyUrl || '';
  $('prefix-enabled').checked = !!c.globalPrefix?.enabled;
  $('prefix-text').value = c.globalPrefix?.text || '';
  $('globalNegative-text').value = c.globalNegative?.text || '';
  $('budget-enabled').checked = !!c.budget?.enabled;
  $('budget-anlasLimit').value = c.budget?.anlasLimit ?? 500;
  currentOutputDir = c.outputDir || '';
  $('outputDir-show').textContent = currentOutputDir || '（未设置）';
  tasks = Array.isArray(c.tasks) ? c.tasks : [];
  roles = Array.isArray(c.roles) ? c.roles : [];
  artists = Array.isArray(c.artists) ? c.artists : [];
  quickCards = Array.isArray(c.quick) ? c.quick.map(q => ({ id: q.id || newId(), file: q.file || '', prompt: q.prompt || '', ref: q.ref || '', lastFile: q.lastFile || '' })) : [];
  if (!quickCards.length) quickCards = [{ id: newId(), file: '', prompt: '', ref: '', lastFile: '' }];
  syncSizeLabel();
  syncGlobals();
  renderRoles(); renderTasks(); renderQuickCards(); renderArtists();
  refreshSubscription(false);
  detectProxy();
}

// ── 模式切换 ──

const MODE_HINTS = {
  general: '通用模式：卡片式快速出图 —— 人像/场景/道具，填提示词点生成就出，带标签联想。',
  role: '角色立绘工坊：角色卡（人设锚点串 + 变体池）→ 展开任务表 → 批量生成，自动归档。',
};
function setMode(mode) {
  const m = mode === 'role' ? 'role' : 'general';
  document.body.dataset.mode = m;
  try { localStorage.setItem('nai-mode', m); } catch { }
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  $('mode-hint').textContent = MODE_HINTS[m];
}

// ── 订阅信息条 ──

function fmtDate(unixSec) {
  if (!unixSec) return '—';
  const d = new Date(unixSec * 1000);
  const days = Math.floor((d - Date.now()) / 86400000);
  return d.toLocaleDateString('zh-CN') + (days >= 0 ? `（剩 ${days} 天）` : '（已过期）');
}

async function refreshSubscription(manual) {
  try {
    const s = await api('/api/subscription');
    if (!s.ok) {
      $('sub-tier').textContent = '💎 ' + (s.error || '未连接');
      if (manual) toast('订阅获取失败: ' + s.error, true);
      return;
    }
    $('sub-tier').textContent = '💎 ' + (s.tierName || '未知档位');
    const anlas = Object.values(s.anlasCandidates || {})[0];
    $('sub-anlas').textContent = 'Anlas ' + (anlas != null ? anlas : '（字段待真机确认，见说明书）');
    $('sub-expire').textContent = '会员 ' + fmtDate(s.expiresAt);
    if (s.v5Pool) {
      $('sub-v5').style.display = '';
      $('sub-v5').textContent = 'V5 用量: ' + JSON.stringify(s.v5Pool.value).slice(0, 60);
    }
    $('sub-updated').textContent = '更新于 ' + new Date().toLocaleTimeString();
    if (manual) toast('订阅信息已刷新');
  } catch (e) {
    if (manual) toast('订阅获取失败: ' + e.message, true);
  }
}
setInterval(() => refreshSubscription(false), 5 * 60 * 1000); // 5 分钟兜底轮询

async function testConnection() {
  $('conn-result').textContent = '连接中…';
  saveConfigNow();
  const r = await api('/api/test-connection', 'POST');
  if (r.ok) {
    $('conn-result').textContent = `✔ 已连接（${r.tierName}${r.anlas != null ? '，Anlas ' + r.anlas : ''}）`;
    refreshSubscription(false);
  } else {
    $('conn-result').textContent = '✖ ' + (r.error || '失败');
  }
}
async function saveConfigNow() { clearTimeout(saveTimer); await api('/api/config', 'POST', collectConfigFromUI()); }

// ── 代理检测 ──

async function detectProxy() {
  $('proxy-status').textContent = '检测中…';
  await saveConfigNow();
  const r = await api('/api/proxy-status');
  if (!r.ok) { $('proxy-status').textContent = '检测失败'; return; }
  const bits = [];
  if (r.configured) bits.push(`已配置 ${r.configured}`);
  if (r.active) bits.push(`生效中 ${r.active}`);
  if (r.systemProxy) bits.push(`系统代理 ${r.systemProxy}`);
  const cand = (r.candidates || []).map(p => `http://127.0.0.1:${p}`);
  $('proxy-status').textContent = bits.length ? bits.join(' · ') : '未发现系统代理';
  $('proxy-status').dataset.candidates = JSON.stringify(cand);
  const btns = document.getElementById('proxy-apply-btns');
  if (btns) btns.remove();
  if (cand.length && !r.active) {
    const div = document.createElement('span');
    div.id = 'proxy-apply-btns';
    div.style.cssText = 'display:inline-flex; gap:6px; margin-left:8px';
    div.innerHTML = cand.map(u => `<button class="small" onclick="useProxy('${u}')">用 ${u.replace('http://', '')}</button>`).join('');
    $('proxy-status').appendChild(div);
  }
}

async function useProxy(url) {
  const r = await api('/api/proxy-use', 'POST', { url });
  if (r.ok) {
    $('nai-proxyUrl').value = url;
    await saveConfigNow();
    toast(r.needRestart === false ? '代理已应用' : '代理已保存——请重启服务（关掉窗口重新双击 bat）后生效');
    detectProxy();
  } else toast(r.error || '应用失败', true);
}

// ── 目录浏览 ──

async function browseOutputDir() {
  const box = document.createElement('div');
  box.className = 'overlay';
  box.innerHTML = `<div class="box dirbrowser"><div class="path"></div><ul></ul>
    <div class="row-actions" style="margin:10px 0 0"><button class="primary" id="db-ok">选这个目录</button><button onclick="this.closest('.overlay').remove()">取消</button></div></div>`;
  document.body.appendChild(box);
  let cur = currentOutputDir || '';
  const render = async (data) => {
    if (data.error) { toast(data.error, true); return; }
    cur = data.path || '';
    box.querySelector('.path').textContent = cur || '（选择磁盘）';
    const ul = box.querySelector('ul');
    ul.innerHTML = (data.parent ? `<li class="up" data-p="${esc(data.parent)}">📁 ..</li>` : '') +
      (data.dirs || []).map(d => `<li data-p="${esc((cur ? cur.replace(/[\\/]$/, '') + '\\' : '') + d)}">📁 ${esc(d)}</li>`).join('');
    ul.querySelectorAll('li').forEach(li => li.onclick = () => browse(li.dataset.p));
  };
  const browse = async (p) => render(await api('/api/browse', 'POST', { path: p }));
  box.querySelector('#db-ok').onclick = async () => {
    if (!cur) { toast('请先选择一个目录', true); return; }
    currentOutputDir = cur;
    $('outputDir-show').textContent = cur;
    box.remove();
    await saveConfigNow();
  };
  render(cur ? await api('/api/browse', 'POST', { path: cur }) : await api('/api/browse', 'POST', { path: '' }));
}

// ── 尺寸联动 ──

function syncSizeLabel() {
  $('size-current-label').textContent = `${$('nai-width').value}×${$('nai-height').value}`;
}
$('nai-resolution').addEventListener('change', () => {
  const [w, h] = metaInfo.resolutions[$('nai-resolution').value] || [832, 1216];
  $('nai-width').value = w; $('nai-height').value = h;
  syncSizeLabel(); saveConfigSoon();
});
['nai-width', 'nai-height'].forEach(id => $(id).addEventListener('input', () => { syncSizeLabel(); saveConfigSoon(); }));

// ── 标签联想（所有 .suggest-ta 输入框） ──

const suggestState = { items: [], idx: -1, ta: null };

function fragmentAtCursor(ta) {
  const pos = ta.selectionStart ?? ta.value.length;
  const before = ta.value.slice(0, pos);
  const m = before.match(/([^,\n\r]*)$/);
  return { frag: (m ? m[1] : '').trim(), before, pos };
}

function insertSuggestion(tag) {
  const ta = suggestState.ta;
  if (!ta) return;
  const { frag, before, pos } = fragmentAtCursor(ta);
  const after = ta.value.slice(pos);
  const start = pos - frag.length;
  const needComma = before.trim() && !/[,]\s*$/.test(before.slice(0, Math.max(0, start)));
  const ins = (needComma ? ', ' : '') + tag + ', ';
  ta.value = ta.value.slice(0, start) + ins + after;
  const np = start + ins.length;
  ta.setSelectionRange(np, np);
  ta.focus();
  hideSuggest();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

function hideSuggest() {
  const layer = $('suggest-layer');
  layer.classList.remove('show');
  layer.innerHTML = '';
  suggestState.items = []; suggestState.idx = -1; suggestState.ta = null;
}

function renderSuggest(ta, tags, artistHits) {
  const layer = $('suggest-layer');
  const items = [
    ...artistHits.map(a => ({ kind: 'artist', label: '⭐ ' + a.name, tag: a.text })),
    ...tags.slice(0, 12).map(t => ({ kind: 'tag', label: t.tag + (t.count != null ? ` (${t.count})` : ''), tag: t.tag })),
  ];
  if (!items.length) { hideSuggest(); return; }
  suggestState.items = items; suggestState.idx = 0; suggestState.ta = ta;
  const rect = ta.getBoundingClientRect();
  layer.innerHTML = items.map((it, i) =>
    `<div class="sg-item${i === 0 ? ' cur' : ''}" data-i="${i}">${esc(it.label)}</div>`).join('');
  layer.style.left = Math.min(rect.left, window.innerWidth - 360) + 'px';
  layer.style.top = Math.min(rect.bottom + 4, window.innerHeight - 240) + 'px';
  layer.classList.add('show');
  layer.querySelectorAll('.sg-item').forEach(el => el.onmousedown = ev => {
    ev.preventDefault();
    insertSuggestion(suggestState.items[Number(el.dataset.i)].tag);
  });
}

let suggestTimer = null;
document.addEventListener('input', ev => {
  const ta = ev.target;
  if (!(ta instanceof HTMLTextAreaElement) || !ta.classList.contains('suggest-ta')) return;
  clearTimeout(suggestTimer);
  const { frag } = fragmentAtCursor(ta);
  if (frag.length < 2) { hideSuggest(); return; }
  suggestTimer = setTimeout(async () => {
    const lower = frag.toLowerCase();
    const artistHits = artists.filter(a => (a.name || '').toLowerCase().includes(lower) || (a.text || '').toLowerCase().includes(lower)).slice(0, 3);
    try {
      const r = await api(`/api/suggest?prompt=${encodeURIComponent(frag)}&model=${encodeURIComponent($('nai-model').value)}`);
      renderSuggest(ta, r.ok ? r.tags : [], artistHits);
    } catch { renderSuggest(ta, [], artistHits); }
  }, 280);
});
document.addEventListener('keydown', ev => {
  const layer = $('suggest-layer');
  if (!layer.classList.contains('show')) return;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    ev.preventDefault();
    const n = suggestState.items.length;
    suggestState.idx = (suggestState.idx + (ev.key === 'ArrowDown' ? 1 : -1) + n) % n;
    layer.querySelectorAll('.sg-item').forEach((el, i) => el.classList.toggle('cur', i === suggestState.idx));
  } else if (ev.key === 'Enter' || ev.key === 'Tab') {
    ev.preventDefault();
    if (suggestState.idx >= 0) insertSuggestion(suggestState.items[suggestState.idx].tag);
  } else if (ev.key === 'Escape') hideSuggest();
});
document.addEventListener('mousedown', ev => {
  if (!$('suggest-layer').contains(ev.target)) hideSuggest();
});

// ── 参考图上传（本地文件 → 输出目录/参考图/ → 回填 ref 字段） ──

async function uploadRefFile(file, onDone) {
  if (!file) return;
  if (!/image\/(png|jpe?g|webp)/.test(file.type)) { toast('仅支持 PNG/JPG/WebP', true); return; }
  const buf = await file.arrayBuffer();
  const r = await fetch('/api/upload-ref?name=' + encodeURIComponent(file.name), { method: 'POST', body: buf });
  const j = await r.json();
  if (j.ok) { toast('参考图已上传: ' + j.ref); onDone(j.ref); saveConfigSoon(); }
  else toast('上传失败: ' + j.error, true);
}

function triggerRefUpload(cb) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/png,image/jpeg,image/webp';
  inp.onchange = () => uploadRefFile(inp.files?.[0], cb);
  inp.click();
}

// ── 快速生图卡片 ──

function renderQuickCards() {
  const g = $('quick-grid');
  g.innerHTML = quickCards.map((c, i) => `
    <div class="qcard" data-qi="${i}">
      <div class="qhead"><span>卡片 ${i + 1}</span><button class="small danger" onclick="delQuickCard(${i})">✕</button></div>
      <textarea class="suggest-ta" rows="4" placeholder="danbooru 标签提示词，输入有联想…&#10;例: 1girl, fox_ears, white_kimono, holding_fan, full_body" oninput="quickCards[${i}].prompt=this.value; saveConfigSoon()">${esc(c.prompt)}</textarea>
      <label class="f"><span>文件名（留空自动命名）</span>
        <input type="text" value="${esc(c.file)}" oninput="quickCards[${i}].file=this.value; saveConfigSoon()"></label>
      <label class="f"><span>参考图（📁 选择本地文件上传，或填输出目录内文件名 → img2img）</span>
        <div class="ref-row">
          <button class="small" type="button" onclick="triggerRefUpload(ref=>{quickCards[${i}].ref=ref; renderQuickCards()})">📁 选图</button>
          <input type="text" value="${esc(c.ref || '')}" placeholder="如 角色A/角色A-站立-01.png" oninput="quickCards[${i}].ref=this.value; saveConfigSoon()">
          ${c.ref ? `<button class="small danger" type="button" onclick="quickCards[${i}].ref=''; renderQuickCards()">清除</button>` : ''}
        </div></label>
      ${c.ref ? `<img class="refthumb" src="/files/${encodeURIComponent(c.ref)}" onclick="zoomImage('${esc(c.ref)}')" title="点击放大">` : ''}
      ${c.lastFile ? `<img class="qresult" src="/files/${encodeURIComponent(c.lastFile)}?t=${Date.now()}" onclick="zoomImage('${esc(c.lastFile)}')">` : ''}
      <div class="row-actions" style="margin:0">
        <button class="primary" onclick="quickGen(${i})">生成 ⚡</button>
        <span class="hint" style="margin:0" id="qstat-${i}"></span>
      </div>
    </div>`).join('');
}

function delQuickCard(i) {
  quickCards.splice(i, 1);
  if (!quickCards.length) quickCards = [{ id: newId(), file: '', prompt: '', lastFile: '' }];
  renderQuickCards(); saveConfigSoon();
}
function addQuickCard() { quickCards.push({ id: newId(), file: '', prompt: '', lastFile: '' }); renderQuickCards(); saveConfigSoon(); }

async function quickGen(i) {
  const c = quickCards[i];
  if (!c.prompt.trim()) { toast('提示词为空', true); return; }
  await saveConfigNow();
  $('qstat-' + i).textContent = '生成中…';
  const r = await api('/api/quick', 'POST', { prompt: c.prompt, file: c.file, ref: c.ref || '' });
  if (r.ok) {
    c.lastFile = r.file;
    if (!c.file) c.file = '';
    $('qstat-' + i).textContent = `✔ seed ${r.seed}`;
    renderQuickCards();
    refreshSubscription(false);
    loadGallery(false);
  } else {
    $('qstat-' + i).textContent = '✖ ' + (r.error || '失败');
    toast('生成失败: ' + r.error, true);
  }
}

// ── 提示词工坊（源文本 ↔ 标签芯片 双向编辑 + AI 多模式协作） ──

let pwTags = [];   // [{ text: '1girl', wraps: 0 }]  wraps>0 = {}×n 增强, <0 = []×n 减弱

function pwImport() {
  const v = $('pw-import-src').value;
  if (!v) return;
  if (v === 'last') {
    api('/api/gallery').then(r => {
      const it = (r.items || []).find(x => x.prompt);
      if (it) { $('ai-raw-input').value = it.prompt; toast('已导入: ' + it.file); }
      else toast('还没有生成记录', true);
    });
  } else if (v === 'prefix') {
    $('ai-raw-input').value = $('prefix-text').value;
    toast('已导入全局前缀');
  }
  $('pw-import-src').value = '';
}

async function pwImportTask() {
  const id = $('pw-import-task').value;
  if (!id) return;
  const t = tasks.find(x => x.id === id);
  if (t) { $('ai-raw-input').value = t.prompt; toast('已导入任务行: ' + (t.file || '')); }
  $('pw-import-task').value = '';
}

/** 把源文本拆成标签芯片（保留 NAI 权重括号） */
function pwParse() {
  const raw = $('ai-raw-input').value;
  pwTags = raw.split(/,\s*/).map(s => s.trim()).filter(Boolean).map(tag => {
    const plus = (tag.match(/^\{+/) || [''])[0].length;
    const minus = (tag.match(/^\[+/) || [''])[0].length;
    const core = tag.replace(/^[{\[]+/, '').replace(/[}\]]+$/, '');
    return { text: core, wraps: plus ? plus : (minus ? -minus : 0) };
  });
  $('pw-chips').style.display = '';
  pwRenderChips();
}

function pwWrapStr(t) {
  const w = t.wraps;
  return w > 0 ? '{'.repeat(w) + t.text + '}'.repeat(w) : w < 0 ? '['.repeat(-w) + t.text + ']'.repeat(-w) : t.text;
}

function pwSyncFromChips() {
  $('ai-raw-input').value = pwTags.map(pwWrapStr).join(', ');
  pwRenderChips();
}

function pwRenderChips() {
  $('pw-chip-list').innerHTML = pwTags.map((t, i) => `
    <span class="pw-chip">
      ${t.wraps !== 0 ? `<b class="w">${t.wraps > 0 ? '+' + t.wraps : t.wraps}</b>` : ''}
      ${esc(t.text)}
      <button class="mini" title="增强 {}" onclick="pwWeight(${i}, 1)">+</button>
      <button class="mini" title="减弱 []" onclick="pwWeight(${i}, -1)">−</button>
      <button class="mini del" title="删除" onclick="pwTags.splice(${i},1); pwSyncFromChips()">✕</button>
    </span>`).join('') || '<span class="hint">（空）</span>';
}

function pwWeight(i, dir) {
  pwTags[i].wraps = Math.max(-3, Math.min(3, pwTags[i].wraps + dir));
  pwSyncFromChips();
}

function pwAddTag(tag) {
  tag = (tag || '').trim().replace(/,+$/, '');
  if (!tag) return;
  pwTags.push({ text: tag, wraps: 0 });
  pwSyncFromChips();
}

/** AI 协作：translate / expand / slim / restyle */
async function aiRun(mode) {
  const input = $('ai-raw-input').value.trim();
  if (!input) { toast('源提示词为空', true); return; }
  await saveConfigNow();
  $('ai-status').textContent = 'AI 处理中…';
  const style = mode === 'restyle' ? ($('pw-style').value) : undefined;
  const r = await api('/api/ai/prompt', 'POST', { input, mode, style });
  if (!r.ok) { $('ai-status').textContent = '✖ ' + r.error; toast('AI 失败: ' + r.error, true); return; }
  $('ai-status').textContent = '✔ 完成';
  $('ai-result').style.display = '';
  $('ai-result').value = r.output;
  $('ai-actions').style.display = '';
}

function pwResultText() { return $('ai-result').value.trim(); }

function pwSend(target) {
  const txt = pwResultText();
  if (!txt) { toast('结果为空', true); return; }
  if (target === 'quick') {
    quickCards.push({ id: newId(), file: '', prompt: txt, lastFile: '' });
    renderQuickCards(); syncGlobals();
    toast('已加入快速生图卡片');
  } else if (target === 'anchor') {
    const role = roles.find(r => r.enabled !== false);
    if (!role) { toast('没有启用的角色卡', true); return; }
    role.anchor = role.anchor ? role.anchor + ', ' + txt : txt;
    renderRoles(); syncGlobals();
    toast('已追加到角色「' + (role.name || '未命名') + '」锚点串');
  } else if (target === 'prefix') {
    $('prefix-text').value = ($('prefix-text').value.trim() ? $('prefix-text').value.trim() + ', ' : '') + txt;
    $('prefix-enabled').checked = true;
    toast('已追加到全局前缀');
  } else if (target === 'artist') {
    const name = prompt('收藏名称：', '收藏-' + (artists.length + 1));
    if (name == null) return;
    artists.push({ id: newId(), name: name || '未命名', text: txt, note: '' });
    renderArtists(); syncGlobals();
    toast('已存入画师串收藏');
  }
  saveConfigSoon();
}

function pwUseAsSource() {
  const txt = pwResultText();
  if (!txt) return;
  $('ai-raw-input').value = txt;
  $('ai-result').value = '';
  toast('结果已成为新源，可继续拆解编辑或再跑 AI');
  if ($('pw-chips').style.display !== 'none') pwParse();
}

function aiCopy() { navigator.clipboard.writeText($('ai-result').value).then(() => toast('已复制')); }

// ── 画师串收藏库 ──

function renderArtists() {
  $('artist-list').innerHTML = artists.map((a, i) => `
    <div class="artist-row">
      <input type="text" class="a-name" value="${esc(a.name)}" placeholder="名称" oninput="artists[${i}].name=this.value; saveConfigSoon()">
      <textarea class="suggest-ta a-text" rows="1" placeholder="提示词串" oninput="artists[${i}].text=this.value; saveConfigSoon()">${esc(a.text)}</textarea>
      <button class="small" onclick="insertToPrefix(${i})">插入全局前缀</button>
      <button class="small danger" onclick="artists.splice(${i},1); renderArtists(); saveConfigSoon()">✕</button>
    </div>`).join('') || '<p class="hint">还没有收藏。把好用的人设串/画师串存进来，提示词输入时会出现在联想列表顶部（⭐）。</p>';
}
function addArtist() { artists.push({ id: newId(), name: '', text: '', note: '' }); renderArtists(); saveConfigSoon(); }
function insertToPrefix(i) {
  const t = artists[i].text.trim();
  if (!t) return;
  $('prefix-text').value = ($('prefix-text').value.trim() ? $('prefix-text').value.trim() + ', ' : '') + t;
  $('prefix-enabled').checked = true;
  saveConfigSoon(); toast('已插入全局前缀');
}
function appendArtistsToPrefix() {
  for (let i = 0; i < artists.length; i++) if (artists[i].text.trim()) insertToPrefixQuiet(i);
  saveConfigSoon(); toast('全部插入全局前缀');
}
function insertToPrefixQuiet(i) {
  const t = artists[i].text.trim();
  if (!t) return;
  $('prefix-text').value = ($('prefix-text').value.trim() ? $('prefix-text').value.trim() + ', ' : '') + t;
}

// ── 角色工坊 ──

function renderRoles() {
  const el = $('role-list');
  el.innerHTML = roles.map((r, i) => `
    <div class="subcard role-card">
      <div class="role-head">
        <label class="checkline"><input type="checkbox" ${r.enabled !== false ? 'checked' : ''} onchange="roles[${i}].enabled=this.checked; saveConfigSoon()"> 启用</label>
        <input type="text" class="r-name" value="${esc(r.name)}" placeholder="角色名（如：中原士兵）" oninput="roles[${i}].name=this.value; saveConfigSoon()">
        <input type="text" class="r-folder" value="${esc(r.folder)}" placeholder="归档文件夹（默认=角色名）" oninput="roles[${i}].folder=this.value; saveConfigSoon()">
        <button class="small danger" onclick="roles.splice(${i},1); renderRoles(); saveConfigSoon()">删除角色</button>
      </div>
      <label class="f"><span>人设锚点串（不变特征：发色/瞳色/服装/种族…）</span>
        <textarea class="suggest-ta" rows="2" oninput="roles[${i}].anchor=this.value; saveConfigSoon()">${esc(r.anchor)}</textarea></label>
      <div class="vb-title" style="margin-top:8px">变体池（姿势 / 表情 / 服装 / 镜头）</div>
      ${(r.variants || []).map((v, j) => `
        <div class="variant-row">
          <input type="checkbox" ${v.enabled !== false ? 'checked' : ''} onchange="roles[${i}].variants[${j}].enabled=this.checked; saveConfigSoon()" title="启用">
          <input type="text" class="v-name" value="${esc(v.name)}" placeholder="变体名" oninput="roles[${i}].variants[${j}].name=this.value; saveConfigSoon()">
          <input type="text" class="suggest-ta v-prompt" value="${esc(v.prompt)}" placeholder="变体提示词（standing_at_attention, holding_spear…）" oninput="roles[${i}].variants[${j}].prompt=this.value; saveConfigSoon()">
          <input type="number" class="v-count" min="1" max="50" value="${v.count ?? 1}" title="数量" oninput="roles[${i}].variants[${j}].count=Number(this.value)||1; saveConfigSoon()">
          <button class="small danger" onclick="roles[${i}].variants.splice(${j},1); renderRoles(); saveConfigSoon()">✕</button>
        </div>`).join('')}
      <div class="row-actions" style="margin-top:6px">
        <button class="small" onclick="roles[${i}].variants.push({id:newId(),name:'',prompt:'',enabled:true,count:1}); renderRoles(); saveConfigSoon()">+ 加变体</button>
      </div>
      <div class="row-actions">
        <label class="f" style="max-width:200px"><span>默认每变体数量</span>
          <input type="number" min="1" max="50" value="${r.count ?? 1}" oninput="roles[${i}].count=Number(this.value)||1; saveConfigSoon()"></label>
        <label class="f" style="max-width:240px"><span>seed 策略</span>
          <select onchange="roles[${i}].seedMode=this.value; saveConfigSoon()">
            <option value="random" ${r.seedMode === 'random' ? 'selected' : ''}>随机（每张不同）</option>
            <option value="fixed" ${r.seedMode === 'fixed' ? 'selected' : ''}>固定（同脸）</option>
            <option value="scan" ${r.seedMode === 'scan' ? 'selected' : ''}>扫描（连续 seed）</option>
          </select></label>
        <label class="f" style="max-width:160px"><span>baseSeed</span>
          <input type="number" min="0" value="${r.baseSeed ?? 0}" oninput="roles[${i}].baseSeed=Number(this.value)||0; saveConfigSoon()"></label>
      </div>
    </div>`).join('') || '<p class="hint">还没有角色卡。点「+ 新建角色卡」，填人设锚点串（AI 工坊可以帮你从中文转写）和变体池。</p>';
}

function addRole() {
  roles.push({ id: newId(), name: '', folder: '', anchor: '', negative: '', enabled: true, count: 2, seedMode: 'random', baseSeed: 0, variants: [{ id: newId(), name: '正面', prompt: 'standing, front view, full_body', enabled: true, count: 1 }] });
  renderRoles(); saveConfigSoon();
}

async function expandRoles() {
  await saveConfigNow();
  const r = await api('/api/expand-roles', 'POST');
  if (r.ok) {
    $('expand-result').textContent = `✔ 新增 ${r.added} 行（任务表共 ${r.tasks} 行）`;
    const c = await api('/api/config');
    tasks = Array.isArray(c.tasks) ? c.tasks : [];
    syncGlobals();
    renderTasks();
    doPreflight();
  } else toast(r.error || '展开失败', true);
}

// ── 任务表 ──

function renderTasks() {
  const body = $('task-body');
  const hideDone = $('hide-done-tasks')?.checked;
  const rows = tasks.map((t, i) => {
    const pf = preflightMap.get(t.id) || {};
    if (hideDone && (pf.done || pf.fileExists)) return '';
    const badge = pf.done ? '<span class="badge done">已生成</span>'
      : pf.fileExists ? '<span class="badge done">文件已存在</span>'
        : pf.refKind === 'task' ? '<span class="badge derived">派生</span>'
          : pf.refKind === 'disk' || pf.refKind === 'external' ? '<span class="badge derived">参考</span>'
            : pf.refKind === 'blocked' ? '<span class="badge failed">✗ 参考缺失</span>'
              : '<span class="badge anchor">锚点</span>';
    const err = pf.refKind === 'blocked' ? `<div class="sub">${esc(pf.refMsg || '')}</div>` : '';
    return `<tr>
      <td class="col-file"><input type="text" value="${esc(t.file)}" oninput="tasks[${i}].file=this.value; saveConfigSoon()"></td>
      <td class="col-ref"><div class="ref-row">
          <button class="small" type="button" title="上传本地参考图" onclick="triggerRefUpload(ref=>{tasks[${i}].ref=ref; renderTasks()})">📁</button>
          <input type="text" value="${esc(t.ref || '')}" placeholder="留空=文生图" oninput="tasks[${i}].ref=this.value; saveConfigSoon()">
        </div></td>
      <td><textarea class="suggest-ta" rows="2" oninput="tasks[${i}].prompt=this.value; pwRefreshTaskOptions(); saveConfigSoon()">${esc(t.prompt)}</textarea></td>
      <td class="col-seed"><input type="number" value="${t.seed ?? -1}" min="-1" oninput="tasks[${i}].seed=Number(this.value); saveConfigSoon()"></td>
      <td class="col-status">${badge}${err}</td>
      <td class="col-act"><button class="small danger" onclick="tasks.splice(${i},1); preflightMap.clear(); renderTasks(); saveConfigSoon()">✕</button></td>
    </tr>`;
  });
  body.innerHTML = rows.join('');
  $('task-count').textContent = `共 ${tasks.length} 行`;
  pwRefreshTaskOptions();
}

/** 提示词工坊「从任务行导入」下拉同步 */
function pwRefreshTaskOptions() {
  const sel = $('pw-import-task');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">从任务行导入…</option>' +
    tasks.map(t => `<option value="${esc(t.id)}">${esc((t.file || '未命名').replace(/\.png$/, ''))}</option>`).join('');
  sel.value = cur;
}
function addTaskRow() { tasks.push({ id: newId(), file: '', ref: '', prompt: '', seed: -1 }); renderTasks(); saveConfigSoon(); }
function clearTasks() {
  if (!confirm('清空任务表？（不影响已生成的文件）')) return;
  tasks = []; preflightMap.clear(); syncGlobals(); renderTasks(); saveConfigSoon();
}

// ── 预检与批量 ──

async function doPreflight() {
  await saveConfigNow();
  const r = await api('/api/preflight', 'POST');
  preflightMap.clear();
  for (const t of r.tasks || []) preflightMap.set(t.id, t);
  renderTasks();
  const s = r.summary || {};
  $('run-summary').innerHTML = `
    <span class="chip">总 <b>${s.total ?? 0}</b></span>
    <span class="chip ok">已生成 <b>${s.done ?? 0}</b></span>
    <span class="chip">文件存在 <b>${s.fileExists ?? 0}</b></span>
    <span class="chip">锚点 <b>${s.anchors ?? 0}</b></span>
    <span class="chip">派生 <b>${s.derived ?? 0}</b></span>
    ${s.blocked ? `<span class="chip err">阻塞 <b>${s.blocked}</b></span>` : ''}
    <span class="chip warn">预估 <b>${r.estimate?.anlasTotal ?? '?'}</b> Anlas（${r.estimate?.freeCount ?? 0} 张免费）</span>`;
  const errs = (r.problems || []).filter(p => p.level === 'error');
  if (errs.length) toast(`预检发现 ${errs.length} 个错误（首个: ${errs[0].msg}）`, true);
  return r;
}

async function startBatch() {
  await doPreflight();
  const r = await api('/api/start', 'POST');
  if (!r.ok) { toast(r.error || '启动失败', true); return; }
  toast(`批次启动: ${r.planned} 张，预估 ${r.estimate} Anlas`);
  $('btn-start').disabled = true; $('btn-stop').disabled = false;
}
async function stopBatch() {
  const r = await api('/api/stop', 'POST');
  if (r.ok) toast('停止请求已发出');
}
let statusTimer = null;
async function pollStatus() {
  try {
    const s = await api('/api/status');
    const total = s.total || 1;
    const donePct = Math.round(((s.done + s.fail + s.skip) / total) * 100);
    $('prog').style.width = donePct + '%';
    $('prog-text').textContent = s.running ? `进行中 ${s.done + s.fail + s.skip}/${total}（成功 ${s.done} 失败 ${s.fail} 跳过 ${s.skip}）` : (s.total > 0 ? `结束: 成功 ${s.done} / 失败 ${s.fail} / 跳过 ${s.skip}` : '待开始');
    $('useStats').textContent = s.anlasSpentEst ? `估算已耗 ${s.anlasSpentEst} Anlas` : '';
    $('log').textContent = (s.log || []).join('\n') || '（日志）';
    if (!s.running && !$('btn-start').disabled) $('btn-stop').disabled = true;
    if (!s.running && s.total > 0 && !$('btn-start').dataset.doneOnce) {
      $('btn-start').dataset.doneOnce = '1';
      $('btn-start').disabled = false; $('btn-stop').disabled = true;
      loadGallery(false); refreshSubscription(false);
    }
    if (s.running) $('btn-start').dataset.doneOnce = '';
  } catch { /* server restarting */ }
}
setInterval(pollStatus, 2000);

// ── 画廊 ──

async function loadGallery(showToast) {
  const r = await api('/api/gallery');
  const g = $('gallery');
  const items = (r.items || []).filter(it => it.exists);
  $('gallery-count').textContent = `共 ${items.length} 张`;
  g.innerHTML = items.map(it => `
    <div class="card">
      <img src="/files/${encodeURIComponent(it.file)}?t=${it.finishedAt || 0}" loading="lazy" onclick="zoomImage('${esc(it.file)}')" alt="">
      <div class="meta">
        <div class="name">${esc(it.file)}</div>
        <div class="sub">seed ${it.seed ?? '—'} · ${it.size || ''}</div>
      </div>
      <div class="ops">
        <button class="small" onclick="regen('${esc(it.file)}')">重生成</button>
        <button class="small" onclick="cutoutOne('${esc(it.file)}')">✂ 去白边</button>
        <button class="small danger" onclick="delImage('${esc(it.file)}')">✕</button>
      </div>
      ${it.cut ? `<div class="sub" style="padding:0 9px 8px"><a href="/files/${encodeURIComponent(it.cut)}" target="_blank" style="color:var(--accent2)">已去边: ${esc(it.cut)}</a></div>` : ''}
    </div>`).join('') || '<p class="hint">（空）生成后图片会出现在这里。</p>';
  if (showToast) toast('画廊已刷新');
}

function zoomImage(file) {
  const box = document.createElement('div');
  box.className = 'overlay';
  box.innerHTML = `<div class="box"><img class="big" src="/files/${encodeURIComponent(file)}"><div class="caption">${esc(file)}</div></div>`;
  box.onclick = e => { if (e.target === box) box.remove(); };
  document.body.appendChild(box);
}

async function regen(file) {
  const t = tasks.find(x => x.file === file);
  if (!t) { toast('任务表中找不到该行（可能已删除），无法重生成', true); return; }
  const r = await api('/api/retry', 'POST', { ids: [t.id] });
  if (r.ok) { toast('重生成已启动'); } else toast(r.error || '失败', true);
}

async function delImage(file) {
  if (!confirm('删除 ' + file + '？（含去白边副本与记录）')) return;
  await api('/api/delete-image', 'POST', { file });
  loadGallery(false);
}

// ── ✂ 去白边（算法在 cutout.js，浏览器/Node 共享，便于单测；直接经 window 引用避免与全局函数声明重名） ──

async function cutoutImageBlob(file, opts) {
  const img = new Image();
  img.src = '/files/' + encodeURIComponent(file);
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, cv.width, cv.height);
  const result = window.processCutoutDataNAI(src, opts);
  ctx.putImageData(new ImageData(result.data, result.width, result.height), 0, 0);
  return new Promise(resolve => cv.toBlob(resolve, 'image/png'));
}

async function saveCutout(file, blob) {
  const r = await fetch('/api/cutout?file=' + encodeURIComponent(file), { method: 'POST', body: blob });
  return r.json();
}

async function cutoutOne(file) {
  const opts = cutoutOpts();
  toast('去白边中: ' + file);
  try {
    const blob = await cutoutImageBlob(file, opts);
    const r = await saveCutout(file, blob);
    if (r.ok) { toast('✔ ' + r.cutout); loadGallery(false); }
    else toast('抠图失败: ' + r.error, true);
  } catch (e) { toast('抠图失败: ' + e.message, true); }
}

async function batchCutout() {
  const r = await api('/api/gallery');
  const todo = (r.items || []).filter(it => it.exists && !it.cut && !/_cut\.png$/i.test(it.file));
  if (!todo.length) { toast('没有待处理的图（全部已去边）'); return; }
  const opts = cutoutOpts();
  let ok = 0, fail = 0;
  toast(`批量去白边: ${todo.length} 张`);
  for (const it of todo) {
    try {
      const blob = await cutoutImageBlob(it.file, opts);
      const res = await saveCutout(it.file, blob);
      if (res.ok) ok++; else fail++;
    } catch (e) { fail++; console.warn('[cutout]', it.file, e.message); }
  }
  toast(`批量去白边完成: 成功 ${ok} / 失败 ${fail}`, fail > 0);
  loadGallery(false);
}

function cutoutOpts() {
  return {
    shrink: Math.max(0, Math.min(3, Number($('cut-shrink').value) || 1)),
    threshold: Math.max(4, Math.min(96, Number($('cut-threshold').value) || 24)),
    defringe: $('cut-defringe').checked,
  };
}

// ── 初始化 ──

// 行内 oninput 通过 window.tasks[i] 等访问；数组被整体重赋值后必须重新绑定
function syncGlobals() { window.tasks = tasks; window.roles = roles; window.quickCards = quickCards; window.artists = artists; }
syncGlobals();

let modeInit = 'general';
try { modeInit = localStorage.getItem('nai-mode') || 'general'; } catch { }
setMode(modeInit === 'role' ? 'role' : 'general');
loadConfigToUI().then(() => { pollStatus(); loadGallery(false); });
