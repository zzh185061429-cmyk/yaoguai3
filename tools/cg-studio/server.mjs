/**
 * CG Studio — 可复用批量生图工作台（零依赖，Node 18+）
 *
 * 用法:  node server.mjs            （默认 http://127.0.0.1:17891）
 *        PORT=18000 node server.mjs
 *
 * 设计:
 *  - 所有配置（API/提示词/任务清单/输出目录）都是运行时数据，存 data/config.json
 *  - 任务表 = 唯一真相: 每行 = 一张图 = { 文件名, 参考图, 提示词 }
 *  - 参考图三类: 输出目录中已有文件 / 任务表中更早生成的文件(拓扑排序) / 外部路径
 *  - 输出目录的 manifest.json 记录每张图的来源，支持断点续跑
 *  - 仅绑定 127.0.0.1，仅服务输出目录内的图片文件
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 17891);

// ── 配置读写 ──

const DEFAULT_CONFIG = {
  api: {
    baseUrl: 'http://127.0.0.1:18999/v1',
    key: '',
    model: 'gpt-image-2',
    size: '1536x1024',
    quality: 'medium',       // low / medium / high / auto
    concurrency: 2,
    autoRetry: 1,            // 失败自动重试次数
    timeoutSec: 300,
    antiCache: true,         // 防缓存：每次请求附加随机变体标记，绕过中转站对相同请求的结果缓存
    textModel: 'gpt-5-6-mini', // AI 提示词工坊用的文字模型
  },
  globalPrefix: { enabled: true, text: '' },
  outputDir: '',
  tasks: [],                 // { id, file, ref, prompt }
  quick: [],                 // 通用模式快速生成卡片 [{ id, file, prompt, ref, lastFile }]
  expand: {
    // 批量展开变体（地点 CG 模式）：室内 = 昼/夜；室外 = 晴/阴/雪 × 昼/夜（可勾选启停），每组第一个启用的昼 = 锚点
    indoorDay: 'Daytime interior, warm natural light filtering through closed latticed windows. No doors open to exterior. No windows showing outdoor scenery. Closed latticed windows only. Interior lighting only. Same room layout. No candles, no lamps, no artificial light sources.',
    indoorNight: 'Nighttime interior, warm candlelight and oil lamp illumination. No doors open to exterior. No windows showing outdoor scenery. Closed latticed windows only. Interior lighting only. Same room layout.',
    outdoor: {
      sunny:    { enabled: true, day: 'Sunny daytime, clear sky. Same location, consistent architecture. Bright natural sunlight. No candles, no lamps, no artificial light sources.', night: 'Sunny nighttime, moonlit sky with stars. Same location, consistent architecture. Warm moonlight.' },
      overcast: { enabled: true, day: 'Overcast daytime, grey sky, flat diffused lighting. Same location, consistent architecture. Muted grey daylight. No candles, no lamps, no artificial light sources.', night: 'Overcast nighttime, dark grey sky, dim cold atmosphere. Same location, consistent architecture. Dim cold moonlight filtered through clouds.' },
      snow:     { enabled: true, day: 'Snowy daytime, white snow covering ground and roofs, overcast or pale sky, soft diffused lighting. Same location, consistent architecture. Bright, cold, and reflective snow surfaces. No candles, no lamps, no artificial light sources.', night: 'Snowy nighttime, clear or dark sky, moonlight reflecting off white snow surfaces, cold blue tones. Same location, consistent architecture. Dim moonlight on snow, high contrast shadows.' },
    },
    locations: '',           // 每行: 文件夹/地点名, 室内|室外, 场景描述
  },
  postimg: {
    key: '',                  // PostImages API Key（登录后 https://postimages.org/login/api 生成）
    galleryMap: {},           // 文件夹 → 图库ID（可贴图库完整链接，自动提取尾部ID）
  },
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (!fss.existsSync(CONFIG_PATH)) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }
}

/** 展开配置归一化：补全结构化字段，并迁移旧版「名称: 提示词」自由文本格式 */
function normalizeExpand(ex) {
  const d = DEFAULT_CONFIG.expand;
  const out = {
    indoorDay: ex?.indoorDay ?? d.indoorDay,
    indoorNight: ex?.indoorNight ?? d.indoorNight,
    outdoor: {},
    locations: ex?.locations ?? '',
  };
  for (const w of ['sunny', 'overcast', 'snow']) {
    out.outdoor[w] = {
      enabled: ex?.outdoor?.[w]?.enabled ?? d.outdoor[w].enabled,
      day: ex?.outdoor?.[w]?.day ?? d.outdoor[w].day,
      night: ex?.outdoor?.[w]?.night ?? d.outdoor[w].night,
    };
  }
  const parseOld = txt => {
    const m = {};
    for (const line of String(txt || '').split(/\r?\n/)) {
      const mm = line.trim().match(/^(.+?)[:：]\s*(.+)$/);
      if (mm) m[mm[1].trim()] = mm[2].trim();
    }
    return m;
  };
  if (typeof ex?.indoorVariants === 'string') {
    const m = parseOld(ex.indoorVariants);
    if (m['昼']) out.indoorDay = m['昼'];
    if (m['夜']) out.indoorNight = m['夜'];
  }
  if (typeof ex?.outdoorVariants === 'string') {
    const m = parseOld(ex.outdoorVariants);
    const map = { '晴昼': ['sunny', 'day'], '晴夜': ['sunny', 'night'], '阴昼': ['overcast', 'day'], '阴夜': ['overcast', 'night'], '雪昼': ['snow', 'day'], '雪夜': ['snow', 'night'] };
    for (const [k, [w, f]] of Object.entries(map)) if (m[k]) out.outdoor[w][f] = m[k];
  }
  return out;
}

let config = null;
async function loadConfig() {
  ensureDataDir();
  if (config) return config;
  try {
    config = { ...DEFAULT_CONFIG, ...JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8')) };
    config.api = { ...DEFAULT_CONFIG.api, ...config.api };
    config.globalPrefix = { ...DEFAULT_CONFIG.globalPrefix, ...config.globalPrefix };
    config.expand = normalizeExpand(config.expand);
    config.quick = Array.isArray(config.quick) ? config.quick : [];
    config.postimg = { ...DEFAULT_CONFIG.postimg, ...config.postimg };
  } catch {
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  return config;
}

async function saveConfig() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // 安全模式：不把敏感信息（API 地址、API Key、图床 Key）写入磁盘，方便分享给他人
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.api) {
    safeConfig.api.baseUrl = '';
    safeConfig.api.key = '';
  }
  if (safeConfig.postimg) safeConfig.postimg.key = '';
  await fs.writeFile(CONFIG_PATH, JSON.stringify(safeConfig, null, 2), 'utf-8');
}

// ── manifest（输出目录）──

function manifestPath(outputDir) {
  return path.join(outputDir, 'manifest.json');
}

async function loadManifest(outputDir) {
  if (!outputDir) return { tasks: {} };
  try {
    return JSON.parse(await fs.readFile(manifestPath(outputDir), 'utf-8'));
  } catch {
    return { tasks: {} };
  }
}

async function saveManifest(outputDir, manifest) {
  await fs.writeFile(manifestPath(outputDir), JSON.stringify(manifest, null, 2), 'utf-8');
}

// ── 文件名规范化: 支持「文件夹/文件名」子路径，统一 .png 扩展 ──

function normalizeFile(name) {
  const raw = (name || '').trim().replace(/\\/g, '/');
  if (!raw) return '';
  const segments = raw.split('/').map(seg => {
    let s = seg.trim().replace(/[:*?"<>|]/g, '_');
    if (s === '.' || s === '..') s = '_';   // 防路径穿越
    return s;
  }).filter(s => s);
  if (segments.length === 0) return '';
  let last = segments[segments.length - 1];
  const ext = path.extname(last).toLowerCase();
  if (ext !== '.png') {
    last = ext ? last.slice(0, -ext.length) : last;
    last = last ? last + '.png' : '';
  }
  if (!last) return '';
  segments[segments.length - 1] = last;
  return segments.join('/');
}

// ── 预检: 参考图状态 + 拓扑排序 + 环检测 ──

async function preflight() {
  const tasks = config.tasks.map(t => ({
    id: t.id,
    file: normalizeFile(t.file),
    rawFile: (t.file || '').trim(),
    ref: (t.ref || '').trim(),
    prompt: (t.prompt || '').trim(),
  }));

  const problems = [];

  // 基础校验
  const fileSet = new Map();
  for (const t of tasks) {
    if (!t.file) problems.push({ id: t.id, level: 'error', msg: '文件名为空' });
    else if (fileSet.has(t.file)) problems.push({ id: t.id, level: 'error', msg: `文件名重复: ${t.file} 与 ${fileSet.get(t.file)}` });
    else fileSet.set(t.file, t.id);
    if (!t.prompt) problems.push({ id: t.id, level: 'error', msg: '提示词为空' });
    if (t.file && t.file.toLowerCase() === 'manifest.json') problems.push({ id: t.id, level: 'error', msg: 'manifest.json 是保留文件名' });
  }

  const outputDir = config.outputDir;
  const outputExists = outputDir && fss.existsSync(outputDir);

  // 参考图解析
  const refState = new Map(); // id -> { kind: 'none'|'disk'|'external'|'task'|'blocked', target, msg }
  for (const t of tasks) {
    if (!t.ref) { refState.set(t.id, { kind: 'none' }); continue; }
    const refNorm = normalizeFile(t.ref);
    // a) 输出目录已存在的同名文件（用户导入或已生成）
    if (outputExists && fss.existsSync(path.join(outputDir, refNorm))) {
      refState.set(t.id, { kind: 'disk', target: refNorm });
      continue;
    }
    // b) 任务表中有同名输出任务 → 依赖
    const depId = fileSet.get(refNorm);
    if (depId && depId !== t.id) { refState.set(t.id, { kind: 'task', target: refNorm, depId }); continue; }
    // c) 外部路径（绝对路径，或相对输出目录）
    const ext = t.ref.replace(/[/\\]/g, path.sep);
    const abs = path.isAbsolute(ext) ? ext : (outputDir ? path.join(outputDir, ext) : null);
    if (abs && fss.existsSync(abs)) { refState.set(t.id, { kind: 'external', target: abs }); continue; }
    // d) 都不是 → 阻塞
    refState.set(t.id, { kind: 'blocked', msg: `参考图 "${t.ref}" 不存在（不在输出目录、不在任务清单、不是有效路径）` });
  }

  // 完成态检测（续跑）
  const manifest = await loadManifest(outputDir);
  for (const t of tasks) {
    const m = manifest.tasks[t.file];
    const onDisk = outputExists && fss.existsSync(path.join(outputDir, t.file));
    if (m && m.status === 'done' && onDisk) t.done = true;
    else if (onDisk) t.fileExists = true; // 文件在但无完成记录
  }

  // 拓扑排序 (Kahn)，依赖: depId -> t.id
  const deps = new Map(tasks.map(t => [t.id, new Set()]));
  const revDeps = new Map(tasks.map(t => [t.id, new Set()]));
  for (const t of tasks) {
    const rs = refState.get(t.id);
    if (rs?.kind === 'task') {
      deps.get(t.id).add(rs.depId);
      revDeps.get(rs.depId).add(t.id);
    }
  }
  const levels = [];
  const remaining = new Set(tasks.filter(t => !problems.some(p => p.id === t.id && p.level === 'error')).map(t => t.id));
  const inDeg = new Map();
  for (const id of remaining) inDeg.set(id, (deps.get(id) ? [...deps.get(id)].filter(d => remaining.has(d)).length : 0));
  while (remaining.size > 0) {
    const level = [...remaining].filter(id => inDeg.get(id) === 0);
    if (level.length === 0) {
      // 环
      const cycleIds = [...remaining];
      for (const id of cycleIds) problems.push({ id, level: 'error', msg: '参考关系成环（循环依赖）' });
      break;
    }
    levels.push(level);
    for (const id of level) {
      remaining.delete(id);
      for (const nxt of revDeps.get(id) || []) {
        if (remaining.has(nxt)) inDeg.set(nxt, inDeg.get(nxt) - 1);
      }
    }
  }

  return { tasks, refState, problems, levels, manifest, outputDir };
}

// ── 执行器 ──

const runtime = {
  running: false,
  stopRequested: false,
  abort: null,               // AbortController
  plan: [],                  // 展开后的执行队列（含层级）
  status: new Map(),         // id -> { status, error?, usage?, revisedPrompt? }
  log: [],
  startedAt: null,
  totalUsage: { input: 0, output: 0, images: 0 },
  doneCount: 0, failCount: 0, skipCount: 0, totalCount: 0,
  current: [],               // 正在跑的任务描述
};

const quickRuntime = { running: false };   // 通用模式快速生成的互斥锁

function rtLog(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  runtime.log.push(line);
  if (runtime.log.length > 300) runtime.log.splice(0, runtime.log.length - 300);
  console.log('[cg-studio]', msg);
}

// 提示词在行内即为最终合成形态（全局前缀 + 布局指令 + 描述），服务端不再二次拼接

/** 调用生图接口（gpt-image，OpenAI 兼容） */
async function callImageAPI({ prompt, refAbsPath }) {
  const { baseUrl, key, model, size, quality, timeoutSec } = config.api;
  // 防缓存：完全相同的请求可能命中中转站缓存返回同一张图，附加随机变体标记改变请求指纹
  const variation = config.api.antiCache === false ? null : `variation-${crypto.randomBytes(3).toString('hex')}`;
  const finalPrompt = variation ? `${prompt}\n(${variation})` : prompt;
  const controller = new AbortController();
  runtime.abort = controller;
  const timer = setTimeout(() => controller.abort(), (timeoutSec || 300) * 1000);
  try {
    let resp;
    if (refAbsPath) {
      const buf = await fs.readFile(refAbsPath);
      const fd = new FormData();
      fd.append('model', model);
      fd.append('prompt', finalPrompt);
      fd.append('n', '1');
      fd.append('size', size);
      if (quality && quality !== 'auto') fd.append('quality', quality);
      fd.append('image', new Blob([buf], { type: 'image/png' }), 'reference.png');
      resp = await fetch(baseUrl.replace(/\/$/, '') + '/images/edits', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key },
        body: fd,
        signal: controller.signal,
      });
    } else {
      resp = await fetch(baseUrl.replace(/\/$/, '') + '/images/generations', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: finalPrompt, n: 1, size, ...(quality && quality !== 'auto' ? { quality } : {}) }),
        signal: controller.signal,
      });
    }
    const text = await resp.text();
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.slice(0, 300)}`);
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('响应不是 JSON: ' + text.slice(0, 200)); }
    const item = data?.data?.[0];
    if (!item) throw new Error('响应缺少 data[0]: ' + text.slice(0, 200));
    let buf = null;
    if (item.b64_json) buf = Buffer.from(item.b64_json, 'base64');
    else if (item.url) {
      const dl = await fetch(item.url, { signal: controller.signal });
      if (!dl.ok) throw new Error(`下载结果图失败 HTTP ${dl.status}`);
      buf = Buffer.from(await dl.arrayBuffer());
    } else throw new Error('响应既无 b64_json 也无 url');
    return { buf, usage: data.usage || null, revisedPrompt: item.revised_prompt || null, variation };
  } finally {
    clearTimeout(timer);
    runtime.abort = null;
  }
}

/** 保存结果图: 按清单文件名落盘（自动创建子文件夹），写 manifest */
async function saveResult(task, result) {
  const outDir = config.outputDir;
  const outPath = path.join(outDir, task.file);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, result.buf);
  const manifest = await loadManifest(outDir);
  manifest.tasks[task.file] = {
    status: 'done',
    prompt: task.prompt,
    ref: task.ref || '',
    usage: result.usage,
    revisedPrompt: result.revisedPrompt,
    variation: result.variation || null,
    bytes: result.buf.length,
    finishedAt: Date.now(),
  };
  await saveManifest(outDir, manifest);
  return outPath;
}

async function runTask(task, refAbsPath, planInfo) {
  const st = runtime.status.get(task.id) || {};
  runtime.status.set(task.id, { ...st, status: 'running' });
  runtime.current = runtime.current.filter(c => c.id !== task.id);
  runtime.current.push({ id: task.id, file: task.file, kind: refAbsPath ? '派生(参考图)' : '锚点(文生图)' });
  const clearCurrent = () => { runtime.current = runtime.current.filter(c => c.id !== task.id); };

  const prompt = task.prompt;
  let lastErr = null;
  const maxAttempts = 1 + Math.max(0, Number(config.api.autoRetry) || 0);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (runtime.stopRequested) break;
    try {
      rtLog(`▶ ${task.file} 第 ${attempt} 次尝试 ${refAbsPath ? `（参考: ${task.ref}）` : '（文生图）'}`);
      const result = await callImageAPI({ prompt, refAbsPath });
      await saveResult(task, result);
      if (result.usage) {
        runtime.totalUsage.input += result.usage.input_tokens || 0;
        runtime.totalUsage.output += result.usage.output_tokens || 0;
      }
      runtime.totalUsage.images += 1;
      runtime.doneCount += 1;
      runtime.status.set(task.id, { status: 'done', file: task.file, usage: result.usage, revisedPrompt: result.revisedPrompt });
      clearCurrent();
      rtLog(`✔ ${task.file} 完成 (${(result.buf.length / 1024).toFixed(0)} KB)`);
      return true;
    } catch (e) {
      lastErr = e;
      if (String(e?.name) === 'AbortError' && runtime.stopRequested) break;
      rtLog(`✖ ${task.file} 失败: ${e.message}${attempt < maxAttempts ? `，${attempt} 秒后重试` : ''}`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
  runtime.failCount += 1;
  runtime.status.set(task.id, { status: runtime.stopRequested ? 'stopped' : 'failed', file: task.file, error: lastErr?.message || '已停止' });
  clearCurrent();
  return false;
}

/** 主执行循环: 按拓扑层级逐层执行，层内并发 */
async function execute(plan) {
  runtime.running = true;
  runtime.stopRequested = false;
  runtime.startedAt = Date.now();
  runtime.log = [];
  runtime.totalUsage = { input: 0, output: 0, images: 0 };
  runtime.doneCount = 0; runtime.failCount = 0; runtime.skipCount = 0;
  runtime.totalCount = plan.length;

  /** 执行时解析参考路径；依赖任务的产出此刻应已在盘上，不在则连锁失败 */
  const resolveRef = (p) => {
    if (p.refAbsPath) return p.refAbsPath;
    if (!p.task.ref) return null; // 锚点，文生图
    const refNorm = normalizeFile(p.task.ref);
    const abs = path.join(config.outputDir, refNorm);
    if (fss.existsSync(abs)) return abs;
    return { missing: abs, refNorm };
  };

  try {
    for (const level of runtime.levels) {
      if (runtime.stopRequested) break;
      const pending = level.map(id => plan.find(p => p.id === id)).filter(p => p && !p.skip);
      // 先解析本层所有参考，缺依赖的连锁标记失败
      const runnable = [];
      for (const p of pending) {
        const ref = resolveRef(p);
        if (ref && ref.missing) {
          runtime.failCount += 1;
          runtime.status.set(p.id, { status: 'failed', file: p.task.file, error: `参考图 ${ref.refNorm} 不存在（依赖任务失败或未生成），已连锁跳过` });
          rtLog(`⛓ ${p.task.file} 因参考缺失连锁跳过`);
        } else {
          runnable.push({ p, refAbsPath: ref });
        }
      }
      // 层内分批并发
      const conc = Math.max(1, Math.min(8, Number(config.api.concurrency) || 2));
      for (let i = 0; i < runnable.length; i += conc) {
        if (runtime.stopRequested) break;
        const batch = runnable.slice(i, i + conc);
        await Promise.all(batch.map(({ p, refAbsPath }) => runTask(p.task, refAbsPath, p)));
      }
    }
  } finally {
    runtime.running = false;
    runtime.current = [];
    rtLog(`=== 批次结束: 成功 ${runtime.doneCount} / 失败 ${runtime.failCount} / 跳过 ${runtime.skipCount} / 图片 ${runtime.totalUsage.images} 张 (input ${runtime.totalUsage.input} tok, output ${runtime.totalUsage.output} tok) ===`);
  }
}

/** 组装执行计划并启动 */
async function startBatch(forceIds = null) {
  if (runtime.running) return { ok: false, error: '已有批次在运行' };
  const pf = await preflight();
  const fatal = pf.problems.filter(p => p.level === 'error');
  if (!config.outputDir) return { ok: false, error: '未设置输出目录' };
  if (!config.api.key) return { ok: false, error: '未设置 API Key' };
  if (!/^\d{2,5}x\d{2,5}$/.test(config.api.size || '')) return { ok: false, error: `尺寸格式不合法: ${config.api.size}（应为 宽x高，如 1920x1080）` };

  // 展开执行计划（跳过已完成）
  const plan = [];
  for (const t of pf.tasks) {
    const rs = pf.refState.get(t.id) || { kind: 'none' };
    let refAbsPath = null;
    if (rs.kind === 'disk') refAbsPath = path.join(config.outputDir, rs.target);
    else if (rs.kind === 'external') refAbsPath = rs.target;
    else if (rs.kind === 'blocked') { runtime.status.set(t.id, { status: 'blocked', error: rs.msg }); continue; }
    else if (rs.kind === 'task') refAbsPath = null; // 由层级保证先完成，执行时现查

    // 默认跳过「已生成」和「文件已存在」的任务，保护用户手动放置的同名文件；
    // 需要重跑时走画廊「重生成」（显式删除文件与记录后强制执行）
    const skip = (t.done || t.fileExists) && !(forceIds?.includes(t.id));
    if (skip) {
      runtime.skipCount += 1;
      runtime.status.set(t.id, { status: 'skipped', file: t.file, reason: t.done ? '已生成' : '文件已存在' });
      continue;
    }
    plan.push({ id: t.id, task: t, refAbsPath, refKind: rs.kind, depId: rs.depId || null });
  }
  if (plan.length === 0) return { ok: false, error: '没有可执行的任务（全部完成/跳过或被阻塞）' };

  // 重建层级（只含计划内任务）
  const planIds = new Set(plan.map(p => p.id));
  const deps = new Map(plan.map(p => [p.id, p.depId && planIds.has(p.depId) ? new Set([p.depId]) : new Set()]));
  const levels = [];
  const remaining = new Set(planIds);
  const inDeg = new Map([...planIds].map(id => [id, deps.get(id).size]));
  while (remaining.size > 0) {
    const level = [...remaining].filter(id => inDeg.get(id) === 0);
    if (level.length === 0) break; // 环（预检已报）
    levels.push(level);
    for (const id of level) {
      remaining.delete(id);
      for (const p of plan) {
        if (p.depId === id && remaining.has(p.id)) inDeg.set(p.id, inDeg.get(p.id) - 1);
      }
    }
  }
  runtime.levels = levels;

  // 执行派生任务时动态解析参考路径（上一层级文件此刻应已在盘上）
  execute(plan).catch(e => rtLog('执行器异常: ' + e.message));
  return { ok: true, planned: plan.length, levels: levels.length };
}

// ── PostImages 图床上传 ──

const POSTIMG_UPLOAD_URL = 'https://api.postimage.org/1/upload';
const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

/** 图库引用解析：贴完整链接自动提取尾部 ID，纯字符串原样使用 */
function parseGalleryRef(input) {
  const s = (input || '').trim();
  if (!s) return '';
  const m = s.match(/postimg(?:\.cc|age\.org)?\/gallery\/([A-Za-z0-9]+)/i);
  return m ? m[1] : s;
}

/** 上传单张：POST 上传 → 解析 <page> → 抓页面提取 i.postimg.cc 直链 */
async function postimgUploadOne(absPath, key, gallery) {
  const buf = await fs.readFile(absPath);
  const base = path.basename(absPath);
  const dot = base.lastIndexOf('.');
  const name = dot > 0 ? base.slice(0, dot) : base;
  const type = dot > 0 ? base.slice(dot + 1).toLowerCase() : 'png';

  const form = new URLSearchParams({
    key,
    gallery,
    o: '2b819584285c102318568238c7d4a4c7',
    m: '59c2ad4b46b0c1e12d5703302bff0120',
    version: '1.0.1',
    portable: '1',
    name,
    type,
    image: buf.toString('base64'),
  });
  const resp = await fetch(POSTIMG_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: form.toString(),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`上传 HTTP ${resp.status}: ${text.slice(0, 200)}`);

  // 响应为 XML 风格文本，取 <page> 链接
  const pageM = text.match(/<page>(https:\/\/postimg\.cc\/\w+)<\/page>/);
  if (!pageM) throw new Error('响应未含 <page> 链接: ' + text.slice(0, 200));
  const page = pageM[1];

  // 抓页面提取直链（i.postimg.cc/xxxxxxxx/文件名）
  let direct = page;
  try {
    const pageResp = await fetch(page, { headers: { 'User-Agent': 'PostmanRuntime/7.29.0' } });
    const html = await pageResp.text();
    const urlM = html.match(/(https:\/\/i\.postimg\.cc\/[A-Za-z0-9]{8}\/[^\s"'?<>]+)/);
    if (urlM) direct = urlM[1];
  } catch { /* 解析失败退回页面链接 */ }

  return { page, url: direct };
}

/** 把 manifest.uploads 写成 图床链接.txt（按文件夹结构分组，纯文本可读） */
async function writeUploadDoc() {
  const outDir = config.outputDir;
  if (!outDir) return;
  const m = await loadManifest(outDir);
  const entries = Object.entries(m.uploads || {});

  // 按文件的直接父目录分组（深层嵌套按完整父路径分组，忠实还原目录结构）
  const groups = {};
  for (const [file, rec] of entries) {
    const slash = file.lastIndexOf('/');
    const folder = slash >= 0 ? file.slice(0, slash) : '';
    const name = slash >= 0 ? file.slice(slash + 1) : file;
    (groups[folder] = groups[folder] || []).push([name, rec]);
  }

  const SEP = '='.repeat(46);
  let txt = `${SEP}\n图床链接表\n更新时间: ${new Date().toLocaleString()}\n共 ${entries.length} 张\n${SEP}\n`;
  const folders = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'zh'));
  for (const folder of folders) {
    txt += `\n【${folder || '（根目录）'}】\n`;
    for (const [name, rec] of groups[folder].sort((a, b) => a[0].localeCompare(b[0], 'zh'))) {
      txt += `  ${name}\n  ${rec.url}\n`;
    }
  }
  await fs.writeFile(path.join(outDir, '图床链接.txt'), txt, 'utf-8');
}

const uploadRuntime = {
  running: false,
  stopRequested: false,
  log: [],
  done: 0, fail: 0, skip: 0, total: 0,
  current: null,
  results: [],   // { file, ok, url?, error? }
};

function upLog(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  uploadRuntime.log.push(line);
  if (uploadRuntime.log.length > 300) uploadRuntime.log.splice(0, uploadRuntime.log.length - 300);
  console.log('[cg-studio][upload]', msg);
}

/** 扫描输出目录：按顶层文件夹分组，标注已上传状态 */
async function scanUploadable() {
  if (!config.outputDir) return { error: '未设置输出目录' };
  const m = await loadManifest(config.outputDir);
  const uploads = m.uploads || {};
  const groups = {};
  const walk = async (rel, abs) => {
    let entries;
    try { entries = await fs.readdir(abs, { withFileTypes: true }); }
    catch { return; /* 无权限/不可读的目录直接跳过（如 $Recycle.Bin） */ }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(relPath, path.join(abs, entry.name));
        continue;
      }
      if (!IMAGE_RE.test(entry.name)) continue;
      const slash = relPath.indexOf('/');
      const folder = slash >= 0 ? relPath.slice(0, slash) : '';
      (groups[folder] = groups[folder] || []).push({
        file: relPath,
        uploaded: !!uploads[relPath],
        url: uploads[relPath]?.url || '',
      });
    }
  };
  if (!fss.existsSync(config.outputDir)) return { error: '输出目录不存在' };
  await walk('', config.outputDir);
  return {
    groups: Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], 'zh')).map(([folder, files]) => ({
      folder,
      galleryRef: config.postimg.galleryMap?.[folder] || '',
      files,
    })),
    galleryMap: config.postimg.galleryMap || {},
  };
}

/** 上传主循环：顺序上传未上传的图片，每张成功后即写文档 */
async function runUploadBatch() {
  uploadRuntime.running = true;
  uploadRuntime.stopRequested = false;
  uploadRuntime.log = [];
  uploadRuntime.done = 0; uploadRuntime.fail = 0; uploadRuntime.skip = 0;
  uploadRuntime.results = [];

  try {
    const scan = await scanUploadable();
    if (scan.error) { upLog(scan.error); return; }
    const queue = [];
    for (const g of scan.groups) {
      for (const f of g.files) {
        if (f.uploaded) { uploadRuntime.skip++; continue; }
        queue.push({ file: f.file, folder: g.folder, galleryRef: g.galleryRef });
      }
    }
    uploadRuntime.total = queue.length;
    if (queue.length === 0) { upLog('没有待上传的图片（全部已上传）'); return; }
    upLog(`开始上传 ${queue.length} 张（已上传跳过 ${uploadRuntime.skip} 张）`);

    for (const item of queue) {
      if (uploadRuntime.stopRequested) break;
      uploadRuntime.current = item.file;
      const abs = path.join(config.outputDir, item.file);
      const gallery = parseGalleryRef(item.galleryRef);
      let lastErr = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (uploadRuntime.stopRequested) break;
        try {
          upLog(`↑ ${item.file}${gallery ? ` → 图库 ${gallery}` : ''}${attempt > 1 ? `（第 ${attempt} 次）` : ''}`);
          const rec = await postimgUploadOne(abs, config.postimg.key, gallery);
          const m = await loadManifest(config.outputDir);
          m.uploads = m.uploads || {};
          m.uploads[item.file] = { page: rec.page, url: rec.url, gallery: gallery || '', uploadedAt: Date.now() };
          await saveManifest(config.outputDir, m);
          await writeUploadDoc();
          uploadRuntime.done++;
          uploadRuntime.results.push({ file: item.file, ok: true, url: rec.url });
          upLog(`✔ ${item.file} → ${rec.url}`);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          upLog(`✖ ${item.file} 失败: ${e.message}${attempt < 2 ? '，重试中' : ''}`);
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      if (lastErr) {
        uploadRuntime.fail++;
        uploadRuntime.results.push({ file: item.file, ok: false, error: lastErr.message });
      }
      // 温和限速，避免触发图床防护
      if (!uploadRuntime.stopRequested) await new Promise(r => setTimeout(r, 800));
    }
  } finally {
    uploadRuntime.running = false;
    uploadRuntime.current = null;
    upLog(`=== 上传结束: 成功 ${uploadRuntime.done} / 失败 ${uploadRuntime.fail} / 跳过 ${uploadRuntime.skip} ===`);
    try { await writeUploadDoc(); } catch { /* ignore */ }
  }
}


// ── 目录浏览（选择输出目录用）──

async function listWindowsDrives() {
  const drives = [];
  for (let i = 67; i <= 90; i++) { // C..Z
    const d = String.fromCharCode(i) + ':\\';
    try { await fs.access(d); drives.push(d); } catch { /* 不存在 */ }
  }
  return drives;
}

// ── HTTP 服务 ──

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  const buf = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(buf);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    // ── 静态文件 ──
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(await fs.readFile(path.join(PUBLIC_DIR, 'index.html')));
    }
    if (req.method === 'GET' && url.pathname === '/manual') {
      const md = await fs.readFile(path.join(__dirname, '使用说明书.md'), 'utf-8');
      const safe = md.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CG Studio 使用说明书</title>
<style>body{background:#0f1115;color:#d7dce5;font:14px/1.9 "Segoe UI","Microsoft YaHei",sans-serif;padding:24px;max-width:1000px;margin:0 auto}pre{white-space:pre-wrap;word-break:break-word}</style>
</head><body><pre>${safe}</pre></body></html>`);
    }
    if (req.method === 'GET' && (url.pathname === '/app.js' || url.pathname === '/style.css')) {
      const type = url.pathname.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      return res.end(await fs.readFile(path.join(PUBLIC_DIR, path.basename(url.pathname))));
    }

    // ── 输出目录图片服务（支持子文件夹，防路径穿越，仅 .png/.jpg/.webp）──
    if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
      const rel = decodeURIComponent(url.pathname.slice('/files/'.length));
      if (!config.outputDir || /\\|\.\./.test(rel)) { res.writeHead(403); return res.end(); }
      const outRoot = path.resolve(config.outputDir);
      const abs = path.resolve(config.outputDir, rel);
      const relCheck = path.relative(outRoot, abs);
      if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) { res.writeHead(403); return res.end(); }
      if (!/\.(png|jpe?g|webp)$/i.test(rel)) { res.writeHead(403); return res.end(); }
      try {
        const buf = await fs.readFile(abs);
        const ct = /\.png$/i.test(rel) ? 'image/png' : /\.webp$/i.test(rel) ? 'image/webp' : 'image/jpeg';
        res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-store' });
        return res.end(buf);
      } catch { res.writeHead(404); return res.end(); }
    }

    // ── API ──
    if (url.pathname === '/api/config') {
      if (req.method === 'GET') {
        await loadConfig();
        // 返回时也剔除敏感字段，确保前端加载时始终为空
        const safeConfig = JSON.parse(JSON.stringify(config));
        if (safeConfig.api) {
          safeConfig.api.baseUrl = '';
          safeConfig.api.key = '';
        }
        if (safeConfig.postimg) safeConfig.postimg.key = '';
        return json(res, 200, safeConfig);
      }
      if (req.method === 'POST') {
        const body = JSON.parse((await readBody(req)).toString('utf-8'));
        // 安全模式：前端发来的 key 为空时，保留内存中已有的值
        // （因为 GET 返回时剔除了敏感字段，前端自动保存会发空值回来）
        const incomingBaseUrl = (body.api?.baseUrl || '').trim();
        const incomingKey = (body.api?.key || '').trim();
        const incomingPostimgKey = (body.postimg?.key || '').trim();
        const prevBaseUrl = config?.api?.baseUrl || '';
        const prevKey = config?.api?.key || '';
        const prevPostimgKey = config?.postimg?.key || '';
        // 只更新已知字段，运行中的任务表不热替换
        config = {
          api: {
            ...DEFAULT_CONFIG.api,
            ...body.api,
            baseUrl: incomingBaseUrl || prevBaseUrl,
            key: incomingKey || prevKey,
          },
          globalPrefix: { ...DEFAULT_CONFIG.globalPrefix, ...body.globalPrefix },
          outputDir: (body.outputDir || '').trim(),
          tasks: Array.isArray(body.tasks) ? body.tasks.map(t => ({
            id: t.id || crypto.randomUUID(),
            file: t.file || '',
            ref: t.ref || '',
            prompt: t.prompt || '',
          })) : [],
          expand: normalizeExpand(body.expand),
          quick: Array.isArray(body.quick) ? body.quick.map(c => ({
            id: c.id || crypto.randomUUID(),
            file: c.file || '',
            prompt: c.prompt || '',
            ref: c.ref || '',
            lastFile: c.lastFile || '',
          })) : [],
          postimg: {
            key: incomingPostimgKey || prevPostimgKey,
            galleryMap: (body.postimg?.galleryMap && typeof body.postimg.galleryMap === 'object') ? body.postimg.galleryMap : {},
          },
        };
        await saveConfig();
        return json(res, 200, { ok: true });
      }
    }

    if (url.pathname === '/api/test-connection' && req.method === 'POST') {
      const { baseUrl, key } = config.api;
      try {
        const r = await fetch(baseUrl.replace(/\/$/, '') + '/models', { headers: { Authorization: 'Bearer ' + key } });
        const d = await r.json();
        const ids = (d.data || []).map(m => m.id);
        return json(res, 200, { ok: r.ok, models: ids });
      } catch (e) {
        return json(res, 200, { ok: false, error: e.message });
      }
    }

    if (url.pathname === '/api/browse' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const p = (body.path || '').trim();
      let target = p;
      if (!target) {
        return json(res, 200, { path: '', isRoot: true, dirs: await listWindowsDrives() });
      }
      if (/^[a-zA-Z]:$/.test(target)) target += '\\';
      try {
        const entries = await fs.readdir(target, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort((a, b) => a.localeCompare(b, 'zh'));
        return json(res, 200, {
          path: path.resolve(target),
          parent: path.dirname(path.resolve(target)) === path.resolve(target) ? null : path.dirname(path.resolve(target)),
          dirs,
        });
      } catch (e) {
        return json(res, 200, { error: '无法读取: ' + e.message });
      }
    }

    if (url.pathname === '/api/preflight' && req.method === 'POST') {
      const pf = await preflight();
      return json(res, 200, {
        problems: pf.problems,
        levels: pf.levels,
        summary: {
          total: pf.tasks.length,
          done: pf.tasks.filter(t => t.done).length,
          fileExists: pf.tasks.filter(t => t.fileExists).length,
          anchors: [...pf.refState.values()].filter(r => r.kind === 'none').length,
          derived: [...pf.refState.values()].filter(r => r.kind === 'disk' || r.kind === 'external' || r.kind === 'task').length,
          blocked: [...pf.refState.values()].filter(r => r.kind === 'blocked').length,
          outputDir: config.outputDir,
        },
        tasks: pf.tasks.map(t => ({
          id: t.id, file: t.file, ref: t.ref,
          refKind: pf.refState.get(t.id)?.kind,
          refMsg: pf.refState.get(t.id)?.msg,
          done: !!t.done, fileExists: !!t.fileExists,
          level: pf.levels.findIndex(l => l.includes(t.id)),
        })),
      });
    }

    if (url.pathname === '/api/start' && req.method === 'POST') {
      const r = await startBatch();
      return json(res, 200, r);
    }
    if (url.pathname === '/api/stop' && req.method === 'POST') {
      if (!runtime.running) return json(res, 200, { ok: false, error: '没有运行中的批次' });
      runtime.stopRequested = true;
      try { runtime.abort?.abort(); } catch { /* ignore */ }
      rtLog('⏹ 收到停止请求，完成在途任务后停止');
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/retry' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const ids = body.ids || [];
      if (runtime.running) return json(res, 200, { ok: false, error: '已有批次在运行' });
      // 删除旧文件与 manifest 记录后按 id 重建小批次
      for (const id of ids) {
        const t = config.tasks.find(x => x.id === id);
        if (!t) continue;
        const f = normalizeFile(t.file);
        try { await fs.unlink(path.join(config.outputDir, f)); } catch { /* 无文件 */ }
        const m = await loadManifest(config.outputDir);
        delete m.tasks[f];
        await saveManifest(config.outputDir, m);
      }
      const r = await startBatch(ids.length ? ids : null);
      return json(res, 200, r);
    }

    if (url.pathname === '/api/status' && req.method === 'GET') {
      return json(res, 200, {
        running: runtime.running,
        stopRequested: runtime.stopRequested,
        done: runtime.doneCount, fail: runtime.failCount, skip: runtime.skipCount, total: runtime.totalCount,
        usage: runtime.totalUsage,
        current: runtime.current,
        log: runtime.log.slice(-80),
        statuses: Object.fromEntries(runtime.status),
      });
    }

    // ── 通用模式快速生成：单提示词 + 可选参考图 → 一张图 ──
    if (url.pathname === '/api/quick' && req.method === 'POST') {
      if (quickRuntime.running) return json(res, 200, { ok: false, error: '已有快速生成在进行，请稍候' });
      if (runtime.running) return json(res, 200, { ok: false, error: '批量任务运行中，请稍候' });
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const prompt = (body.prompt || '').trim();
      if (!prompt) return json(res, 200, { ok: false, error: '提示词为空' });
      if (!config.outputDir) return json(res, 200, { ok: false, error: '未设置输出目录' });
      if (!config.api.key) return json(res, 200, { ok: false, error: '未设置 API Key' });
      if (!/^\d{2,5}x\d{2,5}$/.test(config.api.size || '')) return json(res, 200, { ok: false, error: `尺寸格式不合法: ${config.api.size}` });

      let refAbsPath = null;
      const refRel = (body.ref || '').trim().replace(/\\/g, '/');
      if (refRel) {
        const abs = path.resolve(config.outputDir, refRel);
        const relCheck = path.relative(path.resolve(config.outputDir), abs);
        if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) return json(res, 200, { ok: false, error: '参考图路径越界' });
        if (!fss.existsSync(abs)) return json(res, 200, { ok: false, error: `参考图不存在: ${refRel}` });
        refAbsPath = abs;
      }
      const file = normalizeFile(body.file || '') || normalizeFile(`快速生成/图-${Date.now()}`);
      quickRuntime.running = true;
      try {
        rtLog(`⚡ 快速生成 ${file} ${refAbsPath ? `（参考: ${refRel}）` : '（文生图）'}`);
        const result = await callImageAPI({ prompt, refAbsPath });
        await saveResult({ id: 'quick', file, prompt, ref: refRel }, result);
        rtLog(`✔ 快速生成完成 ${file} (${(result.buf.length / 1024).toFixed(0)} KB)`);
        return json(res, 200, { ok: true, file, revisedPrompt: result.revisedPrompt || null });
      } catch (e) {
        rtLog(`✖ 快速生成失败: ${e.message}`);
        return json(res, 200, { ok: false, error: e.message });
      } finally {
        quickRuntime.running = false;
      }
    }

    if (url.pathname === '/api/gallery' && req.method === 'GET') {
      const m = await loadManifest(config.outputDir);
      const items = [];
      for (const [file, rec] of Object.entries(m.tasks)) {
        if (rec.status === 'done' && fss.existsSync(path.join(config.outputDir, file))) {
          items.push({ file, finishedAt: rec.finishedAt, bytes: rec.bytes, ref: rec.ref, revisedPrompt: rec.revisedPrompt, prompt: rec.prompt, composedPrompt: rec.composedPrompt || null, cut: m.cutouts?.[file] || null });
        }
      }
      items.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
      return json(res, 200, { items });
    }

    // 抠图结果保存: 原名_cut.png + manifest.cutouts 记录
    if (url.pathname === '/api/cutout' && req.method === 'POST') {
      const file = normalizeFile(decodeURIComponent(url.searchParams.get('file') || ''));
      if (!file || !config.outputDir) return json(res, 200, { ok: false, error: '参数错误' });
      const abs = path.join(config.outputDir, file);
      if (!fss.existsSync(abs)) return json(res, 200, { ok: false, error: '原图不存在: ' + file });
      const buf = await readBody(req);
      if (buf.length < 100 || buf.subarray(1, 4).toString() !== 'PNG') return json(res, 200, { ok: false, error: '请求体不是 PNG' });
      const cutName = file.replace(/\.png$/i, '') + '_cut.png';
      await fs.writeFile(path.join(config.outputDir, cutName), buf);
      const m = await loadManifest(config.outputDir);
      m.cutouts = m.cutouts || {};
      m.cutouts[file] = cutName;
      await saveManifest(config.outputDir, m);
      rtLog(`✂ 抠图完成 ${file} → ${cutName}`);
      return json(res, 200, { ok: true, cutout: cutName });
    }

    // ── AI 提示词工坊: 中文地点描述 → 英文提示词（走中转站文字模型） ──
    if (url.pathname === '/api/ai/prompt' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const lines = (body.lines || []).map(l => String(l).trim()).filter(l => l);
      if (!lines.length) return json(res, 200, { ok: false, error: '没有输入行' });
      if (!config.api.key || !config.api.baseUrl) return json(res, 200, { ok: false, error: '未设置中转站 API Key/地址（AI 写提示词走文字模型）' });

      const styleGuide = '输出风格：流畅的英文自然语言场景描述（一句话到两句话，具体、视觉化）。';

      const sys = [
        '你是视觉小说背景CG的图像提示词工程师。用户给出中文的地点描述，支持以下输入格式（自动识别）：',
        '  格式A: 地点名：描述          （如：奉天殿：朝会正殿，金柱礼器）',
        '  格式B: 地点名, 室内|室外, 描述  （如：奉天殿, 室内, 朝会正殿金柱礼器）',
        '  格式C: 文件夹/地点名：描述      （如：前朝大殿/奉天殿：朝会正殿）',
        '  格式D: 纯描述               （如：朝会正殿，金柱礼器，空旷庄严）',
        '任务：对每一行——',
        '  1) 提取地点名（若含"/"则保留完整父路径作为文件夹前缀；格式D无地点名时用描述的前几个字生成一个）',
        '  2) 根据描述判断 indoor（室内）还是 outdoor（室外）——关键词：殿/堂/阁/斋/房/院落室内 = indoor；门/墙/街/桥/庭/广场/苑 = outdoor',
        '  3) 把描述转写成高质量英文图像提示词，作为无人空镜背景图（不要出现人物）。',
        '     提示词必须以地点名开头：英文译名 + 括号中文原名，如 "Fengtian Hall (奉天殿), ..."；',
        '     若地点是真实著名建筑/地标，必须写出其可辨认的标志特征（形制、屋顶样式、层数、台基、色彩等），',
        '     模型只看提示词不看文件名——地点名不进提示词，模型就画不出这个地点；',
        '     描述需包含：建筑结构、陈设/装饰、材质质感等视觉元素，',
        '     英文提示词应具体、视觉化、适合图像生成模型理解',
        '  4) 只写空间本身：不要写时间、光照、天气（昼/夜/晴/阴/雪/蜡烛/灯光等由变体指令统一控制），不要写画面以外的内容',
        '  5) 不要添加描述中没有的设定（朝代、地名、样式等）——整体画风与朝代由生图阶段的全局前缀统一控制',
        styleGuide,
        '只输出 JSON，格式：{"items":[{"name":"地点名","type":"indoor或outdoor","prompt":"英文提示词"}]}，行数与输入一一对应。',
      ].join('\n');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);
      try {
        const resp = await fetch(config.api.baseUrl.replace(/\/$/, '') + '/chat/completions', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + config.api.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.api.textModel || 'gpt-5-6-mini',
            messages: [
              { role: 'system', content: sys },
              { role: 'user', content: lines.map((l, i) => `${i + 1}. ${l}`).join('\n') },
            ],
            temperature: 0.5,
          }),
          signal: controller.signal,
        });
        const text = await resp.text();
        if (!resp.ok) return json(res, 200, { ok: false, error: `文字模型 HTTP ${resp.status}: ${text.slice(0, 200)}` });
        let content = '';
        try { content = JSON.parse(text).choices?.[0]?.message?.content || ''; }
        catch { return json(res, 200, { ok: false, error: '响应不是 JSON: ' + text.slice(0, 200) }); }
        // 容错提取 JSON（剥掉 ```json 围栏）
        const cleaned = content.replace(/```(?:json)?/gi, '').trim();
        const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
        if (s < 0 || e <= s) return json(res, 200, { ok: false, error: '模型输出里找不到 JSON: ' + content.slice(0, 200) });
        let items;
        try { items = JSON.parse(cleaned.slice(s, e + 1)).items; }
        catch { return json(res, 200, { ok: false, error: 'JSON 解析失败: ' + cleaned.slice(0, 200) }); }
        if (!Array.isArray(items)) return json(res, 200, { ok: false, error: 'items 不是数组' });
        const result = items.map(it => ({
          name: String(it.name || '').trim(),
          type: /indoor|室内/i.test(String(it.type)) ? 'indoor' : 'outdoor',
          prompt: String(it.prompt || '').trim(),
        })).filter(it => it.name && it.prompt);
        return json(res, 200, { ok: true, items: result, model: config.api.textModel });
      } catch (e) {
        return json(res, 200, { ok: false, error: e.message });
      } finally {
        clearTimeout(timer);
      }
    }

    // ── AI 对话式聊天: 流式 SSE，多轮 messages 数组 ──
    if (url.pathname === '/api/ai/chat' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (!messages.length) return json(res, 200, { ok: false, error: '没有对话历史' });
      if (!config.api.key || !config.api.baseUrl) return json(res, 200, { ok: false, error: '未设置中转站 API Key/地址（聊天走文字模型）' });

      const sys = [
        '你是一个专业的视觉小说背景CG图像提示词工程师，正在和用户对话式协作写生图提示词。',
        '你可以：',
        '- 根据用户的中文地点描述，写出高质量英文图像提示词（无人空镜背景图，不出现人物）',
        '- 帮用户修改、润色已有的英文提示词',
        '- 讨论室内/室外判断、光线氛围、建筑材质等视觉元素',
        '- 批量生成多个地点的提示词',
        '回复时可以用中文解释你的思路，但最终提示词必须是英文。',
        '如果要给出多个地点的提示词，用「地点名: 提示词」格式每行一个，方便用户复制。',
      ].join('\n');

      const payload = {
        model: config.api.textModel || 'gpt-5-6-mini',
        messages: [{ role: 'system', content: sys }, ...messages],
        temperature: 0.6,
        stream: true,
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180000);
      try {
        const resp = await fetch(config.api.baseUrl.replace(/\/$/, '') + '/chat/completions', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + config.api.key, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (!resp.ok) {
          const text = await resp.text();
          return json(res, 200, { ok: false, error: `文字模型 HTTP ${resp.status}: ${text.slice(0, 200)}` });
        }
        // SSE 流式转发
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
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
            if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            } catch { /* 跳过不完整的 JSON 行 */ }
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (e) {
        if (String(e?.name) === 'AbortError') {
          res.write(`data: ${JSON.stringify({ error: '请求超时或被中断' })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        }
        try { res.end(); } catch { /* already ended */ }
      } finally {
        clearTimeout(timer);
      }
      return;
    }

    // ── PostImages 图床上传 ──
    if (url.pathname === '/api/postimg/scan' && req.method === 'POST') {
      const r = await scanUploadable();
      return json(res, 200, r);
    }

    if (url.pathname === '/api/postimg/start' && req.method === 'POST') {
      if (uploadRuntime.running) return json(res, 200, { ok: false, error: '已有上传批次在运行' });
      if (!config.outputDir) return json(res, 200, { ok: false, error: '未设置输出目录' });
      if (!config.postimg.key) return json(res, 200, { ok: false, error: '未设置 PostImages API Key' });
      runUploadBatch().catch(e => upLog('上传器异常: ' + e.message));
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/postimg/stop' && req.method === 'POST') {
      if (!uploadRuntime.running) return json(res, 200, { ok: false, error: '没有运行中的上传' });
      uploadRuntime.stopRequested = true;
      upLog('⏹ 收到停止请求');
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/postimg/status' && req.method === 'GET') {
      return json(res, 200, {
        running: uploadRuntime.running,
        done: uploadRuntime.done, fail: uploadRuntime.fail, skip: uploadRuntime.skip, total: uploadRuntime.total,
        current: uploadRuntime.current,
        log: uploadRuntime.log.slice(-60),
        results: uploadRuntime.results.slice(-50),
      });
    }

    if (url.pathname === '/api/postimg/forget' && req.method === 'POST') {
      // 清除某文件的上传记录（允许重新上传），不动图床上的图
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const f = (body.file || '').replace(/\\/g, '/').trim();
      const m = await loadManifest(config.outputDir);
      if (m.uploads && m.uploads[f]) {
        delete m.uploads[f];
        await saveManifest(config.outputDir, m);
        await writeUploadDoc();
        return json(res, 200, { ok: true });
      }
      return json(res, 200, { ok: false, error: '无该文件的上传记录' });
    }

    if (url.pathname === '/api/delete-image' && req.method === 'POST') {      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const f = normalizeFile(body.file || '');
      if (!f || !config.outputDir) return json(res, 200, { ok: false, error: '参数错误' });
      const abs = path.join(config.outputDir, f);
      try { await fs.unlink(abs); } catch { /* ignore */ }
      // 子文件夹空了就顺手删掉（输出根目录不动）
      if (path.dirname(abs) !== path.resolve(config.outputDir)) {
        try { await fs.rmdir(path.dirname(abs)); } catch { /* 非空或不存在，忽略 */ }
      }
      const m = await loadManifest(config.outputDir);
      delete m.tasks[f];
      await saveManifest(config.outputDir, m);
      rtLog(`🗑 已删除 ${f}`);
      return json(res, 200, { ok: true });
    }

    // ── 列出 _uploads/ 目录中的已上传参考图 ──
    if (url.pathname === '/api/list-uploads' && req.method === 'GET') {
      if (!config.outputDir) return json(res, 200, { files: [] });
      const uploadDir = path.join(config.outputDir, '_uploads');
      if (!fss.existsSync(uploadDir)) return json(res, 200, { files: [] });
      try {
        const entries = await fs.readdir(uploadDir);
        const files = entries.filter(f => IMAGE_RE.test(f)).map(f => `_uploads/${f}`).sort((a, b) => a.localeCompare(b, 'zh'));
        return json(res, 200, { files });
      } catch {
        return json(res, 200, { files: [] });
      }
    }

    // ── 上传参考图：把用户选择的本地图片保存到输出目录的 _uploads/ 子文件夹 ──
    // 上传后可在任务表的「参考图」列直接填文件名（如 _uploads/my_ref.png）来使用
    if (url.pathname === '/api/upload-ref' && req.method === 'POST') {
      if (!config.outputDir) return json(res, 200, { ok: false, error: '未设置输出目录' });
      const buf = await readBody(req);
      if (buf.length < 100) return json(res, 200, { ok: false, error: '请求体为空或太小' });
      // 校验是否为有效图片（PNG / JPEG / WebP）
      const isPng = buf.subarray(1, 4).toString() === 'PNG';
      const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
      const isWebp = buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
      if (!isPng && !isJpeg && !isWebp) return json(res, 200, { ok: false, error: '不是有效的 PNG/JPEG/WebP 图片' });
      const ext = isPng ? '.png' : isJpeg ? '.jpg' : '.webp';
      const uploadDir = path.join(config.outputDir, '_uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      // 文件名：用原始名（如有）或时间戳，防冲突加序号
      const rawName = decodeURIComponent(url.searchParams.get('name') || 'ref').replace(/[/\\:*?"<>|]/g, '_').slice(0, 60);
      let fileName = rawName + ext;
      let abs = path.join(uploadDir, fileName);
      let seq = 1;
      while (fss.existsSync(abs)) {
        fileName = `${rawName}_${seq}${ext}`;
        abs = path.join(uploadDir, fileName);
        seq++;
      }
      await fs.writeFile(abs, buf);
      const relPath = `_uploads/${fileName}`;
      rtLog(`📷 上传参考图: ${relPath} (${(buf.length / 1024).toFixed(0)} KB)`);
      return json(res, 200, { ok: true, file: relPath, size: buf.length });
    }

    res.writeHead(404);
    res.end('not found');
  } catch (e) {
    console.error('[cg-studio] 请求处理异常:', e);
    json(res, 500, { error: e.message });
  }
});

await loadConfig();

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n[cg-studio] 批量生图工作台已启动`);
  console.log(`[cg-studio] 打开浏览器访问: http://127.0.0.1:${PORT}`);
  console.log(`[cg-studio] 数据目录: ${DATA_DIR}（敏感信息不落盘，可安全分享）`);
  console.log(`[cg-studio] 输出目录: ${config.outputDir || '（未设置，请在界面中选择）'}\n`);
});
