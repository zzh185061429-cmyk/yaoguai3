/**
 * NAI Studio — NovelAI 角色立绘工作台（零依赖，Node 18+）
 *
 * 用法:  node server.mjs            （默认 http://127.0.0.1:17892）
 *        PORT=18000 node server.mjs
 *
 * 设计（与 cg-studio 同一骨架哲学）:
 *  - 所有配置（token/参数/角色卡/任务表）都是运行时数据，存 data/config.json
 *  - 任务表 = 唯一真相: 每行 = 一张图 = { 文件名, 参考图, 提示词, seed }
 *  - 参考图 = img2img 派生（保持角色一致性）；输出目录 manifest.json 断点续跑
 *  - NAI 令牌只存本机 data/config.json（已 gitignore），GET 接口脱敏回传
 *  - 仅绑定 127.0.0.1，仅服务输出目录内的图片文件
 *
 * API 依据: NekoAI-JS / NyaNovel 源码（V4.5 payload 结构）+ NovelAI 官方博客（V5）
 * 待真机验证项见 README「真机验证清单」。
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import net from 'node:net';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 17892);

// ── NAI 常量（来源: NekoAI-JS constants.ts，社区多源一致） ──

const NAI_HEADERS = (token) => ({
  'Content-Type': 'application/json',
  Accept: '*/*',
  Origin: 'https://novelai.net',
  Referer: 'https://novelai.net',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
  ...(token ? { Authorization: 'Bearer ' + token } : {}),
});

const SAMPLERS = ['k_euler', 'k_euler_ancestral', 'k_dpmpp_2s_ancestral', 'k_dpmpp_2m', 'k_dpmpp_sde', 'k_dpmpp_2m_sde', 'ddim_v3'];
const NOISE_SCHEDULES = ['native', 'karras', 'exponential', 'polyexponential'];

const RESOLUTIONS = {
  small_portrait: [512, 768], small_landscape: [768, 512], small_square: [640, 640],
  normal_portrait: [832, 1216], normal_landscape: [1216, 832], normal_square: [1024, 1024],
  large_portrait: [1024, 1536], large_landscape: [1536, 1024], large_square: [1472, 1472],
  wallpaper_portrait: [1088, 1920], wallpaper_landscape: [1920, 1088],
};

const V45_UC = {
  heavy: 'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, negative space, blank page',
  light: 'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, negative space, blank page',
  human: 'nsfw, lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, extra digits, fewer digits, wrong digits, negative space, blank page',
  none: '',
};
const V3_UC = {
  heavy: 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
  light: 'nsfw, lowres, text, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
  human: 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
  none: '',
};

/** 模型元数据: ucPreset 索引 0=重 1=轻 2=人物 3=无 */
const MODELS = {
  'nai-diffusion-4-5-full':            { label: 'V4.5 Full（Opus 免费·标准尺寸）', v4: true, quality: 'best quality, amazing quality, very aesthetic, absurdres', uc: [V45_UC.heavy, V45_UC.light, V45_UC.human, V45_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'karras', cfgRescale: 0 } },
  'nai-diffusion-4-5-curated':         { label: 'V4.5 Curated', v4: true, quality: 'best quality, amazing quality, very aesthetic, absurdres', uc: [V45_UC.heavy, V45_UC.light, V45_UC.human, V45_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'karras', cfgRescale: 0 } },
  'nai-diffusion-4-5-full-inpainting': { label: 'V4.5 Full Inpainting（局部重绘）', v4: true, quality: 'best quality, amazing quality, very aesthetic, absurdres', uc: [V45_UC.heavy, V45_UC.light, V45_UC.human, V45_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'karras', cfgRescale: 0 } },
  'nai-diffusion-5-full':              { label: 'V5 Full（⚠ 2026-08-21 新发布·Opus 用量池计费，待真机验证）', v4: true, quality: 'best quality, amazing quality, very aesthetic, absurdres', uc: [V45_UC.heavy, V45_UC.light, V45_UC.human, V45_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'karras', cfgRescale: 0 } },
  'nai-diffusion-5':                   { label: 'V5 Curated（⚠ 新发布·待真机验证）', v4: true, quality: 'best quality, amazing quality, very aesthetic, absurdres', uc: [V45_UC.heavy, V45_UC.light, V45_UC.human, V45_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'karras', cfgRescale: 0 } },
  'nai-diffusion-4-full':              { label: 'V4 Full（旧）', v4: true, quality: 'best quality, amazing quality, very aesthetic, absurdres', uc: [V45_UC.heavy, V45_UC.light, V45_UC.human, V45_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'karras', cfgRescale: 0 } },
  'nai-diffusion-3':                   { label: 'V3（旧·结构不同）', v4: false, quality: 'masterpiece, best quality', uc: [V3_UC.heavy, V3_UC.light, V3_UC.human, V3_UC.none], defaults: { steps: 28, scale: 5, sampler: 'k_euler_ancestral', noise: 'native', cfgRescale: 0 } },
};
const isV4Model = (m) => !!MODELS[m]?.v4 || /^nai-diffusion-(4|5)/.test(m || '');

const TIER_NAMES = { 0: 'Paperclip（免费）', 1: 'Tablet', 2: 'Scroll', 3: 'Opus' };

// ── 配置读写 ──

const DEFAULT_CONFIG = {
  nai: {
    token: '',
    imageHost: 'https://image.novelai.net',
    apiHost: 'https://api.novelai.net',
    textHost: 'https://text.novelai.net',
    model: 'nai-diffusion-4-5-full',
    width: 832, height: 1216,
    steps: 28, scale: 5,
    sampler: 'k_euler_ancestral', noiseSchedule: 'karras',
    cfgRescale: 0, autoSmea: true,
    ucPreset: 0, qualityToggle: true,
    negativePrompt: '',
    concurrency: 1, requestIntervalMs: 3000,
    autoRetry: 1, timeoutSec: 180,
    textModel: 'glm-4-6',
    img2imgStrength: 0.6,
    proxyUrl: '',            // 空 = 自动检测系统代理；或显式 http://127.0.0.1:7890
  },
  globalPrefix: { enabled: true, text: '' },   // 全局画师串/风格前缀
  globalNegative: { text: '' },                // 全局负面前缀（拼在 UC 预设后）
  outputDir: '',
  tasks: [],       // { id, file, ref, prompt, seed }
  roles: [],       // { id, name, folder, anchor, negative, variants:[{id,name,prompt,enabled}], count, seedMode, baseSeed, enabled }
  quick: [],       // { id, file, prompt, lastFile }
  artists: [],     // { id, name, text, note }
  budget: { enabled: false, anlasLimit: 500 },
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (!fss.existsSync(CONFIG_PATH)) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }
}

let config = null;
async function loadConfig() {
  ensureDataDir();
  if (config) return config;
  try {
    const raw = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    config.nai = { ...DEFAULT_CONFIG.nai, ...raw.nai };
    config.globalPrefix = { ...DEFAULT_CONFIG.globalPrefix, ...raw.globalPrefix };
    config.globalNegative = { ...DEFAULT_CONFIG.globalNegative, ...raw.globalNegative };
    for (const k of ['tasks', 'roles', 'quick', 'artists']) config[k] = Array.isArray(raw[k]) ? raw[k] : [];
    config.budget = { ...DEFAULT_CONFIG.budget, ...raw.budget };
    config.outputDir = (raw.outputDir || '').trim();
  } catch {
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  return config;
}

/** token 落盘本机（data/ 已 gitignore）；其余原样保存 */
async function saveConfig() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function maskedToken() {
  const t = config?.nai?.token || '';
  if (!t) return '';
  return t.length <= 12 ? t.slice(0, 3) + '***' : t.slice(0, 6) + '…' + t.slice(-4);
}

// ── manifest（输出目录，断点续跑） ──

function manifestPath(outputDir) { return path.join(outputDir, 'manifest.json'); }
async function loadManifest(outputDir) {
  if (!outputDir) return { tasks: {}, cutouts: {} };
  try { return JSON.parse(await fs.readFile(manifestPath(outputDir), 'utf-8')); }
  catch { return { tasks: {}, cutouts: {} }; }
}
async function saveManifest(outputDir, manifest) {
  await fs.writeFile(manifestPath(outputDir), JSON.stringify(manifest, null, 2), 'utf-8');
}

// ── 文件名规范化: 支持「文件夹/文件名」子路径，统一 .png ──

function normalizeFile(name) {
  const raw = (name || '').trim().replace(/\\/g, '/');
  if (!raw) return '';
  const segments = raw.split('/').map(seg => {
    let s = seg.trim().replace(/[:*?"<>|]/g, '_');
    if (s === '.' || s === '..') s = '_';
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

// ── 最小 zip 解包（零依赖）: 解出第一个 entry ──

function unzipFirstEntry(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  // 1) 从尾部找 EOCD (0x06054b50)
  const minEocd = 22;
  if (u8.length < minEocd + 30) throw new Error('zip 数据过短');
  let eocd = -1;
  const scanStart = Math.max(0, u8.length - 65557);
  for (let i = u8.length - minEocd; i >= scanStart; i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip 中找不到 EOCD');
  const cdOffset = u8[eocd + 16] | (u8[eocd + 17] << 8) | (u8[eocd + 18] << 16) | (u8[eocd + 19] << 24);
  // 2) 第一个 central directory header (0x02014b50)
  if (cdOffset < 0 || cdOffset + 46 > u8.length) throw new Error('zip 中央目录偏移非法');
  const c = cdOffset;
  if (!(u8[c] === 0x50 && u8[c + 1] === 0x4b && u8[c + 2] === 0x01 && u8[c + 3] === 0x02)) throw new Error('zip 中央目录签名非法');
  const method = u8[c + 10] | (u8[c + 11] << 8);
  const csize = u8[c + 20] | (u8[c + 21] << 8) | (u8[c + 22] << 16) | (u8[c + 23] << 24);
  const nameLen = u8[c + 28] | (u8[c + 29] << 8);
  const extraLen = u8[c + 30] | (u8[c + 31] << 8);
  const commentLen = u8[c + 32] | (u8[c + 33] << 8);
  const lho = u8[c + 42] | (u8[c + 43] << 8) | (u8[c + 44] << 16) | (u8[c + 45] << 24);
  const nameBytes = u8.slice(c + 46, c + 46 + nameLen);
  const name = Buffer.from(nameBytes).toString('utf-8');
  // 3) local file header (0x04034b50)
  if (lho < 0 || lho + 30 > u8.length) throw new Error('zip 本地头偏移非法');
  if (!(u8[lho] === 0x50 && u8[lho + 1] === 0x4b && u8[lho + 2] === 0x03 && u8[lho + 3] === 0x04)) throw new Error('zip 本地头签名非法');
  const lNameLen = u8[lho + 26] | (u8[lho + 27] << 8);
  const lExtraLen = u8[lho + 28] | (u8[lho + 29] << 8);
  const dataStart = lho + 30 + lNameLen + lExtraLen;
  const csizeEff = csize === 0 ? u8.length - dataStart : csize; // 某些 writer 不写 csize
  const comp = Buffer.from(u8.slice(dataStart, dataStart + csizeEff));
  // 4) method 0=stored 8=deflate
  if (method === 0) return { name, data: comp };
  if (method === 8) return { name, data: zlib.inflateRawSync(comp) };
  throw new Error('zip 使用了不支持的压缩方式: ' + method);
}

// ── NAI payload 构造（对齐 NekoAI-JS prepareMetadataForApi 语义） ──

/**
 * 组装生图 payload。opts:
 *  { prompt, negative, model, action('generate'|'img2img'|'infill'), width, height,
 *    steps, scale, sampler, noiseSchedule, cfgRescale, autoSmea, ucPreset, qualityToggle,
 *    seed, img2imgStrength, imageB64, maskB64, characters:[{prompt, uc, cx, cy}] }
 */
function buildImagePayload(opts) {
  const nai = config.nai;
  const model = opts.model || nai.model;
  const meta = MODELS[model] || MODELS['nai-diffusion-4-5-full'];
  const v4 = isV4Model(model);
  const width = Math.max(64, Math.floor((opts.width || nai.width) / 64) * 64);
  const height = Math.max(64, Math.floor((opts.height || nai.height) / 64) * 64);
  if (width * height > 3047424) throw new Error(`分辨率超上限: ${width}x${height}（最大 3047424 像素）`);

  const qualityTags = (opts.qualityToggle ?? nai.qualityToggle) && meta.quality ? meta.quality : '';
  const composedPrompt = composePrompt(opts.prompt || '');
  const basePrompt = [composedPrompt, qualityTags].filter(s => s && s.trim()).join(', ');
  const ucPresetText = meta.uc[opts.ucPreset ?? nai.ucPreset] ?? '';
  const negParts = [ucPresetText, config.globalNegative?.text || '', opts.negative || ''].filter(s => s && s.trim());
  const negative = negParts.join(', ');

  const seed = Number.isInteger(opts.seed) && opts.seed >= 0 ? opts.seed : crypto.randomInt(0, 4294967296);
  const action = opts.action || 'generate';
  const chars = (opts.characters || []).filter(c => (c.prompt || '').trim());

  const params = {
    params_version: v4 ? 3 : 1,
    width, height,
    scale: opts.scale ?? nai.scale,
    seed,
    steps: opts.steps ?? nai.steps,
    n_samples: 1,
    ucPreset: opts.ucPreset ?? nai.ucPreset,
    qualityToggle: opts.qualityToggle ?? nai.qualityToggle,
    negative_prompt: negative,
    sampler: opts.sampler || nai.sampler,
    noise_schedule: opts.noiseSchedule || nai.noiseSchedule,
    cfg_rescale: Number(opts.cfgRescale ?? nai.cfgRescale) || 0,
    skip_cfg_above_sigma: null,
    legacy: false,
    legacy_v3_extend: false,
  };
  if (v4) {
    params.autoSmea = opts.autoSmea ?? nai.autoSmea;
    params.v4_prompt = {
      caption: {
        base_caption: basePrompt,
        char_captions: chars.map(c => ({ char_caption: [c.prompt, qualityTags].filter(Boolean).join(', '), centers: [{ x: c.cx ?? 0.5, y: c.cy ?? 0.5 }] })),
      },
      use_coords: chars.length > 0 && chars.some(c => typeof c.cx === 'number'),
      use_order: true,
    };
    params.v4_negative_prompt = {
      caption: {
        base_caption: negative,
        char_captions: chars.map(c => ({ char_caption: [c.uc || ''].filter(s => s && s.trim()).join(', ') || 'nsfw, lowres', centers: [{ x: c.cx ?? 0.5, y: c.cy ?? 0.5 }] })),
      },
      legacy_uc: false,
    };
  } else {
    params.sm = false; params.sm_dyn = false;
    params.prompt = basePrompt; // V3 走顶层 input 即可，此处冗余无害
  }
  if (action === 'img2img' || action === 'infill') {
    if (!opts.imageB64) throw new Error(action + ' 需要参考图');
    params.image = opts.imageB64;
    if (action === 'img2img') {
      params.strength = Number(opts.img2imgStrength ?? nai.img2imgStrength) || 0.6;
      params.noise = 0.0;
      params.extra_noise_seed = crypto.randomInt(0, 4294967296);
    }
    if (action === 'infill') {
      if (!opts.maskB64) throw new Error('infill 需要 mask');
      params.mask = opts.maskB64;
      params.add_original_image = true;
    }
  }
  return { input: basePrompt, model, action, parameters: params, seedUsed: seed };
}

// ── Anlas 成本（基础公式移植自 novelai-sdk 文档 + 模型倍率锚点校准） ──
// 锚点（2026-08-23 用户提供，非 Opus 标准档实测）: V4.5 ≈ 17 / V5 ≈ 26
// 基础公式在 832×1216·28步 下算出 ~20，故 V4.5 倍率 0.85、V5 倍率 1.3（拟合值，以网页显示为准）

function modelAnlasFactor(model) {
  if (/nai-diffusion-5/.test(model || '')) return 1.3;
  if (/nai-diffusion-4/.test(model || '')) return 0.85;
  return 1.0; // V3 及未知模型
}

function calculateAnlasCost(p, isOpus) {
  const steps = p.steps || 28;
  const width = p.width || 1024, height = p.height || 1024;
  const hasStrength = p.action === 'img2img' && p.strength != null;
  const strength = hasStrength ? p.strength : 1.0;
  let smeaFactor = 1.0;
  if (!isV4Model(p.model)) { if (p.sm_dyn) smeaFactor = 1.4; else if (p.sm) smeaFactor = 1.2; }
  const resolution = Math.max(width * height, 64 * 64);
  let adjusted = resolution;
  if (resolution > 832 * 1216 && resolution <= 1024 * 1024) adjusted = 832 * 1216;
  const base = 2951823174884865e-21 * adjusted + 5.753298233447344e-7 * adjusted * steps;
  let perSample = Math.max(Math.ceil(base * strength), 2) * smeaFactor;
  perSample = Math.ceil(perSample * modelAnlasFactor(p.model));
  const free = isOpus && steps <= 28 && resolution <= 1024 * 1024 && !hasStrength;
  return free ? 0 : perSample;
}

// ── 代理支持（Node fetch 不走系统代理，梯子只代理浏览器 → 必须显式注入） ──

const runtime2 = { proxyEnsured: false, proxyActive: '' };

/** 读注册表一个值 */
function regQuery(key, value) {
  return new Promise(resolve => {
    execFile('reg', ['query', key, '/v', value], { windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null);
      const m = stdout.match(new RegExp(value + '\\s+REG_(?:SZ|DWORD|EXPAND_SZ)\\s+(.+)', 'i'));
      resolve(m ? m[1].trim() : null);
    });
  });
}

/** Windows 系统代理（「设置→网络→代理」手动配置的）：ProxyEnable=1 且有 ProxyServer */
async function detectSystemProxy() {
  try {
    const [enable, server] = await Promise.all([
      regQuery('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings', 'ProxyEnable'),
      regQuery('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings', 'ProxyServer'),
    ]);
    if (!enable || !/^0x1$|^1$/i.test(enable) || !server) return '';
    // 格式: "127.0.0.1:7890" 或 "http=...;https=...;ftp=..."
    const parts = server.split(';').map(s => s.trim()).filter(Boolean);
    const httpsPart = parts.find(p => /^https?=/i.test(p));
    let chosen = httpsPart ? httpsPart.replace(/^\w+=/i, '') : (parts.some(p => p.includes('=')) ? parts[0].replace(/^\w+=/i, '') : parts[0]);
    if (!chosen) return '';
    return chosen.startsWith('http') ? chosen : 'http://' + chosen;
  } catch { return ''; }
}

/** 探测常见本地代理端口（Clash/v2rayN 等），用于给用户建议 */
function probePort(port, host = '127.0.0.1', timeout = 400) {
  return new Promise(resolve => {
    const s = net.connect({ host, port });
    const t = setTimeout(() => { s.destroy(); resolve(false); }, timeout);
    s.on('connect', () => { clearTimeout(t); s.destroy(); resolve(true); });
    s.on('error', () => { clearTimeout(t); resolve(false); });
  });
}

/** 设置 Node 24+ 全局 fetch 的代理环境（NODE_USE_ENV_PROXY，需在任何外部 fetch 前生效；首次注入后改地址需重启） */
function activateProxyEnv(url) {
  if (!url) return false;
  if (!process.env.HTTP_PROXY) process.env.HTTP_PROXY = url;
  process.env.HTTPS_PROXY = url;
  process.env.NODE_USE_ENV_PROXY = '1';
  runtime2.proxyActive = url;
  return true;
}

/** 惰性确保代理已注入：显式配置 > 环境变量 > Windows 系统代理 */
async function ensureProxy() {
  if (runtime2.proxyEnsured) return;
  runtime2.proxyEnsured = true;
  const cfgUrl = (config?.nai?.proxyUrl || '').trim();
  if (cfgUrl) { activateProxyEnv(cfgUrl); return; }
  if (process.env.HTTPS_PROXY) { process.env.NODE_USE_ENV_PROXY = '1'; runtime2.proxyActive = process.env.HTTPS_PROXY + '（环境变量）'; return; }
  const sys = await detectSystemProxy();
  if (sys) activateProxyEnv(sys);
}

const PROXY_PORTS = [7890, 7897, 7899, 10808, 10809, 1080];

// ── NAI 网络层 ──

async function naiFetch(url, { method = 'GET', body, token, timeoutSec = 60 } = {}) {
  await ensureProxy();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSec * 1000);
  try {
    return await fetch(url, { method, headers: NAI_HEADERS(token), body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
  } finally { clearTimeout(timer); }
}

/** GET /user/subscription: token 探针 + 订阅数据。Anlas/V5 用量字段名待真机确认，未识别字段整体透传 */
async function fetchSubscription() {
  const nai = config.nai;
  if (!nai.token) return { ok: false, error: '未设置 NAI 令牌' };
  const r = await naiFetch(nai.apiHost.replace(/\/$/, '') + '/user/subscription', { token: nai.token, timeoutSec: 30 });
  if (r.status === 401 || r.status === 403) return { ok: false, error: '令牌无效或已过期（HTTP ' + r.status + '）' };
  if (!r.ok) return { ok: false, error: 'HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200) };
  const d = await r.json();
  const sub = d.subscription || d; // 兼容裸响应或 { subscription: {... }} 包装
  const out = {
    ok: true,
    tier: sub.tier ?? sub.activeTier ?? null,
    tierName: TIER_NAMES[sub.tier ?? sub.activeTier] || (sub.tier != null ? 'tier ' + sub.tier : '未知'),
    isOpus: sub.tier === 3 || sub.activeTier === 3,
    expiresAt: sub.expiresAt ?? sub.activeUntil ?? sub.until ?? null,
    trainingStepsLeft: sub.trainingStepsLeft ?? null,
    // Anlas 余额候选字段（真机验证后收敛为一个）
    anlasCandidates: {},
    v5Pool: null,
    raw: sub,
  };
  for (const k of ['anlas', 'anlasBalance', 'anlasBalanceSnapshot', 'anlas_cached', 'purchasedAnlas', 'subscriptionAnlas']) {
    if (typeof sub[k] === 'number') out.anlasCandidates[k] = sub[k];
  }
  // V5 用量池候选（电池机制，字段名未知——真机抓包后填 mapping）
  for (const k of Object.keys(sub)) {
    if (/usage|generation|pool|battery|v5/i.test(k)) out.v5Pool = out.v5Pool || { key: k, value: sub[k] };
  }
  return out;
}

/** 生图: POST /ai/generate-image（zip 端点，V4+ 通用） */
async function callGenerateImage(payload) {
  const nai = config.nai;
  if (!nai.token) throw new Error('未设置 NAI 令牌');
  const r = await naiFetch(nai.imageHost.replace(/\/$/, '') + '/ai/generate-image', {
    method: 'POST', body: payload, token: nai.token, timeoutSec: nai.timeoutSec,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`NAI HTTP ${r.status}: ${text.slice(0, 300)}`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('NAI 响应不是 JSON: ' + text.slice(0, 200)); }
  if (!data.zip) throw new Error('NAI 响应缺少 zip 字段');
  const { name, data: png } = unzipFirstEntry(Buffer.from(data.zip, 'base64'));
  if (png[0] !== 0x89 || png.subarray(1, 4).toString() !== 'PNG') throw new Error('解包结果不是 PNG: ' + name);
  return { buf: png, zipEntryName: name, seed: payload.seedUsed };
}

/** 标签联想: GET /ai/generate-image/suggest-tags（无需鉴权亦可，带 token 更稳） */
async function suggestTags(prompt, model, lang = 'en') {
  const nai = config.nai;
  const q = new URLSearchParams({ model: model || nai.model, prompt: prompt || '', lang });
  const r = await naiFetch(nai.imageHost.replace(/\/$/, '') + '/ai/generate-image/suggest-tags?' + q, { token: nai.token || undefined, timeoutSec: 20 });
  if (!r.ok) return { ok: false, error: 'HTTP ' + r.status };
  return { ok: true, tags: (await r.json()).tags || [] };
}

/** NAI 文字模型（OpenAI 兼容，SSE 聚合）——AI 提示词工坊用 */
async function textChat(messages, maxTokens = 700) {
  const nai = config.nai;
  if (!nai.token) throw new Error('未设置 NAI 令牌');
  const r = await naiFetch(nai.textHost.replace(/\/$/, '') + '/oa/v1/chat/completions', {
    method: 'POST', token: nai.token, timeoutSec: 120,
    body: { model: nai.textModel || 'glm-4-6', messages, max_tokens: maxTokens, temperature: 0.7, stream: true },
  });
  if (!r.ok) throw new Error(`文字模型 HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  // SSE 流聚合
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '', out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const payloadStr = s.slice(5).trim();
      if (payloadStr === '[DONE]') continue;
      try { const j = JSON.parse(payloadStr); out += j.choices?.[0]?.delta?.content || ''; } catch { /* skip */ }
    }
  }
  return out.trim();
}

// ── 预检: 参考图状态 + 拓扑排序 + 环检测 + Anlas 预估 ──

async function preflight() {
  const tasks = config.tasks.map(t => ({
    id: t.id, file: normalizeFile(t.file), rawFile: (t.file || '').trim(),
    ref: (t.ref || '').trim(), prompt: (t.prompt || '').trim(),
    seed: Number.isInteger(t.seed) ? t.seed : -1,
  }));
  const problems = [];
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

  const refState = new Map();
  for (const t of tasks) {
    if (!t.ref) { refState.set(t.id, { kind: 'none' }); continue; }
    const refNorm = normalizeFile(t.ref);
    if (outputExists && fss.existsSync(path.join(outputDir, refNorm))) { refState.set(t.id, { kind: 'disk', target: refNorm }); continue; }
    const depId = fileSet.get(refNorm);
    if (depId && depId !== t.id) { refState.set(t.id, { kind: 'task', target: refNorm, depId }); continue; }
    const ext = t.ref.replace(/[/\\]/g, path.sep);
    const abs = path.isAbsolute(ext) ? ext : (outputDir ? path.join(outputDir, ext) : null);
    if (abs && fss.existsSync(abs)) { refState.set(t.id, { kind: 'external', target: abs }); continue; }
    refState.set(t.id, { kind: 'blocked', msg: `参考图 "${t.ref}" 不存在` });
  }

  const manifest = await loadManifest(outputDir);
  for (const t of tasks) {
    const m = manifest.tasks[t.file];
    const onDisk = outputExists && fss.existsSync(path.join(outputDir, t.file));
    if (m && m.status === 'done' && onDisk) t.done = true;
    else if (onDisk) t.fileExists = true;
  }

  // 拓扑排序 (Kahn)
  const deps = new Map(tasks.map(t => [t.id, new Set()]));
  const revDeps = new Map(tasks.map(t => [t.id, new Set()]));
  for (const t of tasks) {
    const rs = refState.get(t.id);
    if (rs?.kind === 'task') { deps.get(t.id).add(rs.depId); revDeps.get(rs.depId).add(t.id); }
  }
  const levels = [];
  const remaining = new Set(tasks.filter(t => !problems.some(p => p.id === t.id && p.level === 'error')).map(t => t.id));
  const inDeg = new Map();
  for (const id of remaining) inDeg.set(id, [...deps.get(id)].filter(d => remaining.has(d)).length);
  while (remaining.size > 0) {
    const level = [...remaining].filter(id => inDeg.get(id) === 0);
    if (level.length === 0) {
      for (const id of remaining) problems.push({ id, level: 'error', msg: '参考关系成环（循环依赖）' });
      break;
    }
    levels.push(level);
    for (const id of level) {
      remaining.delete(id);
      for (const nxt of revDeps.get(id) || []) if (remaining.has(nxt)) inDeg.set(nxt, inDeg.get(nxt) - 1);
    }
  }

  // Anlas 预估
  const nai = config.nai;
  let anlasTotal = 0, freeCount = 0;
  const pending = tasks.filter(t => !t.done && !t.fileExists);
  for (const t of pending) {
    const rs = refState.get(t.id);
    const cost = calculateAnlasCost({
      model: nai.model, steps: nai.steps, width: nai.width, height: nai.height,
      autoSmea: nai.autoSmea, action: rs && rs.kind !== 'none' && rs.kind !== 'blocked' ? 'img2img' : 'generate',
      strength: nai.img2imgStrength,
    }, true); // isOpus 先按 true 估（订阅未拉到时的乐观估计；批量启动时会用真实 tier 重算）
    if (cost === 0) freeCount++; else anlasTotal += cost;
  }
  return { tasks, refState, problems, levels, manifest, outputDir, estimate: { anlasTotal, freeCount } };
}

// ── 执行器 ──

const runtime = {
  running: false, stopRequested: false, abort: null,
  plan: [], levels: [],
  status: new Map(), log: [],
  startedAt: null, anlasSpentEst: 0,
  doneCount: 0, failCount: 0, skipCount: 0, totalCount: 0,
  current: [],
};
const quickRuntime = { running: false };

function rtLog(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  runtime.log.push(line);
  if (runtime.log.length > 300) runtime.log.splice(0, runtime.log.length - 300);
  console.log('[nai-studio]', msg);
}

function composePrompt(taskPrompt) {
  const gp = config.globalPrefix;
  if (gp?.enabled && gp.text?.trim()) return gp.text.trim() + ', ' + taskPrompt;
  return taskPrompt;
}

async function runTask(task, refAbsPath) {
  const st = runtime.status.get(task.id) || {};
  runtime.status.set(task.id, { ...st, status: 'running' });
  runtime.current = runtime.current.filter(c => c.id !== task.id);
  runtime.current.push({ id: task.id, file: task.file, kind: refAbsPath ? '派生(img2img)' : '锚点(文生图)' });
  const clearCurrent = () => { runtime.current = runtime.current.filter(c => c.id !== task.id); };

  let payload;
  try {
    let imageB64 = null;
    if (refAbsPath) {
      const buf = await fs.readFile(refAbsPath);
      imageB64 = buf.toString('base64');
    }
    payload = buildImagePayload({
      prompt: task.prompt,
      action: refAbsPath ? 'img2img' : 'generate',
      seed: task.seed && task.seed >= 0 ? task.seed : undefined,
      imageB64,
    });
  } catch (e) {
    runtime.failCount += 1;
    runtime.status.set(task.id, { status: 'failed', file: task.file, error: e.message });
    clearCurrent();
    return false;
  }

  let lastErr = null;
  const maxAttempts = 1 + Math.max(0, Number(config.nai.autoRetry) || 0);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (runtime.stopRequested) break;
    try {
      // Anlas 预算硬闸
      const cost = calculateAnlasCost(payload.parameters, runtime.isOpus ?? true);
      if (config.budget?.enabled && runtime.anlasSpentEst + cost > config.budget.anlasLimit) {
        rtLog(`⛔ 预算保护: 已估 ${runtime.anlasSpentEst} + 本张 ${cost} Anlas 将超过上限 ${config.budget.anlasLimit}，停止批次`);
        runtime.stopRequested = true;
        break;
      }
      rtLog(`▶ ${task.file} 第 ${attempt} 次尝试 ${refAbsPath ? `（img2img 参考: ${task.ref}，seed ${payload.seedUsed}）` : `（文生图，seed ${payload.seedUsed}）`}`);
      const result = await callGenerateImage(payload);
      const outPath = path.join(config.outputDir, task.file);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, result.buf);
      const manifest = await loadManifest(config.outputDir);
      manifest.tasks[task.file] = {
        status: 'done', prompt: task.prompt, composedPrompt: composePrompt(task.prompt),
        ref: task.ref || '', model: config.nai.model, seed: result.seedUsed,
        steps: config.nai.steps, size: `${config.nai.width}x${config.nai.height}`,
        bytes: result.buf.length, finishedAt: Date.now(),
      };
      await saveManifest(config.outputDir, manifest);
      runtime.anlasSpentEst += cost;
      runtime.doneCount += 1;
      runtime.status.set(task.id, { status: 'done', file: task.file, seed: result.seedUsed, anlas: cost });
      clearCurrent();
      rtLog(`✔ ${task.file} 完成 (${(result.buf.length / 1024).toFixed(0)} KB${cost > 0 ? `，约 ${cost} Anlas` : '，Opus 免费'})`);
      return true;
    } catch (e) {
      lastErr = e;
      if (String(e?.name) === 'AbortError' && runtime.stopRequested) break;
      rtLog(`✖ ${task.file} 失败: ${e.message}${attempt < maxAttempts ? `，${attempt * 2} 秒后重试` : ''}`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  runtime.failCount += 1;
  runtime.status.set(task.id, { status: runtime.stopRequested ? 'stopped' : 'failed', file: task.file, error: lastErr?.message || '已停止' });
  clearCurrent();
  return false;
}

async function execute(plan) {
  runtime.running = true;
  runtime.log = [];
  runtime.doneCount = 0; runtime.failCount = 0; runtime.skipCount = 0;
  runtime.totalCount = plan.length;
  runtime.anlasSpentEst = 0;
  try {
    const conc = Math.max(1, Math.min(4, Number(config.nai.concurrency) || 1));
    const interval = Math.max(0, Number(config.nai.requestIntervalMs) || 0);
    let lastStart = 0;
    for (const level of runtime.levels) {
      if (runtime.stopRequested) break;
      const pending = level.map(id => plan.find(p => p.id === id)).filter(p => p && !p.skip);
      for (const p of pending) {
        let refAbsPath = p.refAbsPath;
        if (!refAbsPath && p.task.ref) {
          const refNorm = normalizeFile(p.task.ref);
          const abs = path.join(config.outputDir, refNorm);
          if (fss.existsSync(abs)) refAbsPath = abs;
          else {
            runtime.failCount += 1;
            runtime.status.set(p.id, { status: 'failed', file: p.task.file, error: `参考图 ${refNorm} 不存在（依赖任务失败），连锁跳过` });
            rtLog(`⛓ ${p.task.file} 因参考缺失连锁跳过`);
            continue;
          }
        }
        // 请求间隔节流（保护账号）
        const wait = interval - (Date.now() - lastStart);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        lastStart = Date.now();
        await runTask(p.task, refAbsPath);
        if (runtime.stopRequested) break;
        if (conc > 1) { /* 并发>1 时退化为小批量并行；默认 1 串行最稳 */ }
      }
      if (runtime.stopRequested) break;
    }
  } finally {
    runtime.running = false;
    runtime.current = [];
    rtLog(`=== 批次结束: 成功 ${runtime.doneCount} / 失败 ${runtime.failCount} / 跳过 ${runtime.skipCount}，估算消耗 ${runtime.anlasSpentEst} Anlas ===`);
    // 批后拉一次订阅，对比真实 Anlas 变化（尽力而为）
    try {
      const before = runtime.anlasBefore;
      const sub = await fetchSubscription();
      const after = sub.ok ? (Object.values(sub.anlasCandidates)[0] ?? null) : null;
      if (before != null && after != null) rtLog(`💎 Anlas 实际变化: ${before} → ${after}（${Number(after) - Number(before) >= 0 ? '+' : ''}${Number(after) - Number(before)}）`);
    } catch { /* 忽略 */ }
  }
}

async function startBatch(forceIds = null) {
  if (runtime.running) return { ok: false, error: '已有批次在运行' };
  const pf = await preflight();
  const fatal = pf.problems.filter(p => p.level === 'error');
  if (fatal.length > 0) return { ok: false, error: `预检发现 ${fatal.length} 个错误，请先修复（首个: ${fatal[0].msg}）` };
  if (!config.outputDir) return { ok: false, error: '未设置输出目录' };
  if (!config.nai.token) return { ok: false, error: '未设置 NAI 令牌' };

  // 真实订阅 → Opus 判定 → Anlas 预估复核
  const sub = await fetchSubscription();
  if (!sub.ok) return { ok: false, error: '令牌验证失败: ' + sub.error };
  runtime.isOpus = sub.isOpus;
  const anlasBalance = Object.values(sub.anlasCandidates)[0] ?? null;
  if (sub.isOpus) rtLog(`💎 Opus 已确认，标准参数文生图免费（28步内·≤1024²·单张）`);
  else rtLog(`⚠ 非 Opus，所有生成均消耗 Anlas`);

  const plan = [];
  for (const t of pf.tasks) {
    const rs = pf.refState.get(t.id) || { kind: 'none' };
    let refAbsPath = null;
    if (rs.kind === 'disk') refAbsPath = path.join(config.outputDir, rs.target);
    else if (rs.kind === 'external') refAbsPath = rs.target;
    else if (rs.kind === 'blocked') { runtime.status.set(t.id, { status: 'blocked', error: rs.msg }); continue; }
    const skip = (t.done || t.fileExists) && !(forceIds?.includes(t.id));
    if (skip) {
      runtime.skipCount += 1;
      runtime.status.set(t.id, { status: 'skipped', file: t.file, reason: t.done ? '已生成' : '文件已存在' });
      continue;
    }
    plan.push({ id: t.id, task: t, refAbsPath, depId: rs.depId || null });
  }
  if (plan.length === 0) return { ok: false, error: '没有可执行的任务（全部完成/跳过或被阻塞）' };

  // 用真实 tier 重算预估 + 预算闸
  let est = 0;
  for (const p of plan) {
    est += calculateAnlasCost({
      model: config.nai.model, steps: config.nai.steps, width: config.nai.width, height: config.nai.height,
      autoSmea: config.nai.autoSmea, action: p.refAbsPath || p.depId ? 'img2img' : 'generate', strength: config.nai.img2imgStrength,
    }, sub.isOpus);
  }
  const v5 = /nai-diffusion-5/.test(config.nai.model);
  if (v5) rtLog(`⚠ V5 模型走 Opus 用量池计费（像素+步数消耗，连续恢复），下列 Anlas 估算仅按旧公式参考`);
  if (config.budget?.enabled && est > config.budget.anlasLimit) {
    return { ok: false, error: `预算保护: 预估 ${est} Anlas 超过上限 ${config.budget.anlasLimit}（可在设置中调整）` };
  }
  rtLog(`启动批次: ${plan.length} 张，预估 ${est} Anlas${anlasBalance != null ? `（余额约 ${anlasBalance}）` : ''}`);

  // 重建层级
  const planIds = new Set(plan.map(p => p.id));
  const deps = new Map(plan.map(p => [p.id, p.depId && planIds.has(p.depId) ? new Set([p.depId]) : new Set()]));
  const levels = [];
  const remaining = new Set(planIds);
  const inDeg = new Map([...planIds].map(id => [id, deps.get(id).size]));
  while (remaining.size > 0) {
    const level = [...remaining].filter(id => inDeg.get(id) === 0);
    if (level.length === 0) break;
    levels.push(level);
    for (const id of level) {
      remaining.delete(id);
      for (const p of plan) if (p.depId === id && remaining.has(p.id)) inDeg.set(p.id, inDeg.get(p.id) - 1);
    }
  }
  runtime.levels = levels;
  runtime.anlasBefore = anlasBalance;
  execute(plan).catch(e => rtLog('执行器异常: ' + e.message));
  return { ok: true, planned: plan.length, levels: levels.length, estimate: est };
}

// ── 角色矩阵展开 ──

function expandRoles() {
  const added = [];
  let scanCounter = 0;
  const existing = new Set(config.tasks.map(t => normalizeFile(t.file)));
  for (const role of config.roles) {
    if (role.enabled === false) continue;
    const name = (role.name || '').trim();
    const anchor = (role.anchor || '').trim();
    if (!name || !anchor) continue;
    const folder = (role.folder || name).trim();
    const variants = (role.variants || []).filter(v => v.enabled !== false && (v.prompt || '').trim());
    const list = variants.length > 0 ? variants : [{ id: 'default', name: '默认', prompt: '' }];
    for (const v of list) {
      const count = Math.max(1, Math.min(50, Number(v.count ?? role.count) || 1));
      for (let i = 1; i <= count; i++) {
        const file = normalizeFile(`${folder}/${name}-${v.name || '默认'}-${String(i).padStart(2, '0')}`);
        if (!file || existing.has(file)) continue;
        existing.add(file);
        let seed = -1;
        const mode = role.seedMode || 'random';
        if (mode === 'fixed') seed = Number(role.baseSeed) || 0;
        else if (mode === 'scan') seed = (Number(role.baseSeed) || 0) + scanCounter;
        scanCounter++;
        const prompt = [anchor, v.prompt].filter(s => s && s.trim()).join(', ');
        const t = { id: crypto.randomUUID(), file, ref: '', prompt, seed };
        config.tasks.push(t);
        added.push(t);
      }
    }
  }
  return added;
}

// ── HTTP 基础 ──

async function listWindowsDrives() {
  const drives = [];
  for (let i = 67; i <= 90; i++) {
    const l = String.fromCharCode(i);
    try { if (fss.statSync(l + ':\\').isDirectory()) drives.push(l + ':\\'); } catch { /* not exists */ }
  }
  return drives;
}

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

// ── 路由 ──

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    await loadConfig();

    // 静态文件
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(await fs.readFile(path.join(PUBLIC_DIR, 'index.html')));
    }
    if (req.method === 'GET' && url.pathname === '/manual') {
      const md = await fs.readFile(path.join(__dirname, '使用说明书.md'), 'utf-8');
      const safe = md.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>NAI Studio 使用说明书</title>
<style>body{background:#0f1115;color:#d7dce5;font:14px/1.9 "Segoe UI","Microsoft YaHei",sans-serif;padding:24px;max-width:1000px;margin:0 auto}pre{white-space:pre-wrap;word-break:break-word}</style>
</head><body><pre>${safe}</pre></body></html>`);
    }
    if (req.method === 'GET' && (url.pathname === '/app.js' || url.pathname === '/style.css')) {
      const type = url.pathname.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      return res.end(await fs.readFile(path.join(PUBLIC_DIR, path.basename(url.pathname))));
    }
    // public/ 下其他静态资源（html/图标等，防路径穿越）
    if (req.method === 'GET' && /^\/[\w\-.]+\.(html|js|css|png|svg|ico|json)$/i.test(url.pathname)) {
      const rel = path.basename(url.pathname);
      const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', png: 'image/png', svg: 'image/svg+xml', ico: 'image/x-icon', json: 'application/json; charset=utf-8' };
      try {
        const buf = await fs.readFile(path.join(PUBLIC_DIR, rel));
        res.writeHead(200, { 'Content-Type': TYPES[url.pathname.split('.').pop().toLowerCase()], 'Cache-Control': 'no-store' });
        return res.end(buf);
      } catch { res.writeHead(404); return res.end(); }
    }

    // 输出目录图片服务（防路径穿越）
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

    // ── config ──
    if (url.pathname === '/api/config') {
      if (req.method === 'GET') {
        const safe = JSON.parse(JSON.stringify(config));
        safe.nai = { ...safe.nai, token: maskedToken(), hasToken: !!config.nai.token };
        return json(res, 200, safe);
      }
      if (req.method === 'POST') {
        const body = JSON.parse((await readBody(req)).toString('utf-8'));
        const incomingToken = (body.nai?.token || '').trim();
        config = {
          nai: { ...DEFAULT_CONFIG.nai, ...body.nai, token: incomingToken || config.nai.token },
          globalPrefix: { ...DEFAULT_CONFIG.globalPrefix, ...body.globalPrefix },
          globalNegative: { ...DEFAULT_CONFIG.globalNegative, ...body.globalNegative },
          outputDir: (body.outputDir || '').trim(),
          tasks: Array.isArray(body.tasks) ? body.tasks.map(t => ({
            id: t.id || crypto.randomUUID(), file: t.file || '', ref: t.ref || '',
            prompt: t.prompt || '', seed: Number.isInteger(t.seed) ? t.seed : -1,
          })) : [],
          roles: Array.isArray(body.roles) ? body.roles.map(r => ({
            id: r.id || crypto.randomUUID(), name: r.name || '', folder: r.folder || '',
            anchor: r.anchor || '', negative: r.negative || '', enabled: r.enabled !== false,
            count: Math.max(1, Number(r.count) || 1), seedMode: r.seedMode || 'random', baseSeed: Number(r.baseSeed) || 0,
            variants: Array.isArray(r.variants) ? r.variants.map(v => ({
              id: v.id || crypto.randomUUID(), name: v.name || '', prompt: v.prompt || '',
              enabled: v.enabled !== false, count: Math.max(1, Number(v.count) || 1),
            })) : [],
          })) : [],
          quick: Array.isArray(body.quick) ? body.quick.map(c => ({
            id: c.id || crypto.randomUUID(), file: c.file || '', prompt: c.prompt || '', ref: c.ref || '', lastFile: c.lastFile || '',
          })) : [],
          artists: Array.isArray(body.artists) ? body.artists.map(a => ({
            id: a.id || crypto.randomUUID(), name: a.name || '', text: a.text || '', note: a.note || '',
          })) : [],
          budget: { ...DEFAULT_CONFIG.budget, ...body.budget },
        };
        await saveConfig();
        return json(res, 200, { ok: true });
      }
    }

    // ── 代理诊断与应用 ──
    if (url.pathname === '/api/proxy-status' && req.method === 'GET') {
      const sys = await detectSystemProxy();
      const candidates = [];
      for (const p of PROXY_PORTS) if (await probePort(p)) candidates.push(p);
      return json(res, 200, {
        ok: true,
        configured: (config.nai.proxyUrl || '').trim(),
        systemProxy: sys,
        envProxy: process.env.HTTPS_PROXY || '',
        active: runtime2.proxyActive || '',
        candidates,
      });
    }
    if (url.pathname === '/api/proxy-use' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const u = (body.url || '').trim();
      if (!/^https?:\/\/.+/.test(u)) return json(res, 200, { ok: false, error: '代理地址格式应为 http://127.0.0.1:端口' });
      config.nai.proxyUrl = u;
      await saveConfig();
      const changed = activateProxyEnv(u);   // 若全局 dispatcher 已构造，新地址需重启服务生效
      return json(res, 200, { ok: true, active: runtime2.proxyActive, needRestart: runtime2.proxyEnsured && !changed ? false : !changed, note: '已保存并注入；若之前已发起过请求，重启服务后新地址才生效' });
    }

    // ── 连接测试 + 订阅 ──
    if (url.pathname === '/api/test-connection' && req.method === 'POST') {
      try {
        const sub = await fetchSubscription();
        return json(res, 200, sub.ok ? { ok: true, tierName: sub.tierName, expiresAt: sub.expiresAt, anlas: Object.values(sub.anlasCandidates)[0] ?? null, v5Pool: sub.v5Pool } : sub);
      } catch (e) {
        const net = /timeout|abort|ENETUNREACH|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EHOSTUNREACH|fetch failed/i.test(e.message || '');
        const sys = await detectSystemProxy();
        const cands = [];
        for (const p of PROXY_PORTS) if (await probePort(p)) cands.push(p);
        const hint = net
          ? `连不上 novelai.net（Node 不走浏览器代理）。${sys ? `已检测到系统代理 ${sys}，正在使用——若仍失败请检查梯子节点。` : cands.length ? `探测到本机端口 ${cands.join('/')} 有服务，可能是你的梯子——在设置里填 http://127.0.0.1:${cands[0]} 后重启服务。` : '未检测到系统代理。若用 Clash/v2rayN 请开启「系统代理」，或把 HTTP 端口填到设置里（重启生效）；TUN/全局模式则无需配置。'}`
          : (e.message + '（若超时: NAI 域名需代理，见 README 网络说明）');
        return json(res, 200, { ok: false, error: hint });
      }
    }
    if (url.pathname === '/api/subscription' && req.method === 'GET') {
      try { return json(res, 200, await fetchSubscription()); }
      catch (e) { return json(res, 200, { ok: false, error: e.message }); }
    }

    // ── 模型/枚举元数据（前端渲染用） ──
    if (url.pathname === '/api/meta' && req.method === 'GET') {
      return json(res, 200, {
        models: Object.fromEntries(Object.entries(MODELS).map(([k, v]) => [k, { label: v.label, defaults: v.defaults }])),
        samplers: SAMPLERS, noiseSchedules: NOISE_SCHEDULES, resolutions: RESOLUTIONS,
      });
    }

    // ── 标签联想 ──
    if (url.pathname === '/api/suggest' && req.method === 'GET') {
      try {
        const r = await suggestTags(url.searchParams.get('prompt') || '', url.searchParams.get('model') || '', url.searchParams.get('lang') || 'en');
        return json(res, 200, r);
      } catch (e) { return json(res, 200, { ok: false, error: e.message }); }
    }

    // ── 目录浏览 ──
    if (url.pathname === '/api/browse' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      let target = (body.path || '').trim();
      if (!target) return json(res, 200, { path: '', isRoot: true, dirs: await listWindowsDrives() });
      if (/^[a-zA-Z]:$/.test(target)) target += '\\';
      try {
        const entries = await fs.readdir(target, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name).sort((a, b) => a.localeCompare(b, 'zh'));
        return json(res, 200, { path: path.resolve(target), parent: path.dirname(path.resolve(target)) === path.resolve(target) ? null : path.dirname(path.resolve(target)), dirs });
      } catch (e) { return json(res, 200, { error: '无法读取: ' + e.message }); }
    }

    // ── 预检 / 批量 ──
    if (url.pathname === '/api/preflight' && req.method === 'POST') {
      const pf = await preflight();
      return json(res, 200, {
        problems: pf.problems, levels: pf.levels, estimate: pf.estimate,
        summary: {
          total: pf.tasks.length,
          done: pf.tasks.filter(t => t.done).length,
          fileExists: pf.tasks.filter(t => t.fileExists).length,
          anchors: [...pf.refState.values()].filter(r => r.kind === 'none').length,
          derived: [...pf.refState.values()].filter(r => ['disk', 'external', 'task'].includes(r.kind)).length,
          blocked: [...pf.refState.values()].filter(r => r.kind === 'blocked').length,
        },
        tasks: pf.tasks.map(t => ({
          id: t.id, file: t.file, ref: t.ref, seed: t.seed,
          refKind: pf.refState.get(t.id)?.kind, refMsg: pf.refState.get(t.id)?.msg,
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
      rtLog('⏹ 收到停止请求，完成在途任务后停止');
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/retry' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const ids = body.ids || [];
      if (runtime.running) return json(res, 200, { ok: false, error: '已有批次在运行' });
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
        running: runtime.running, stopRequested: runtime.stopRequested,
        done: runtime.doneCount, fail: runtime.failCount, skip: runtime.skipCount, total: runtime.totalCount,
        anlasSpentEst: runtime.anlasSpentEst,
        current: runtime.current, log: runtime.log.slice(-80),
        statuses: Object.fromEntries(runtime.status),
      });
    }

    // ── 快速生成 ──
    if (url.pathname === '/api/quick' && req.method === 'POST') {
      if (quickRuntime.running) return json(res, 200, { ok: false, error: '已有快速生成在进行' });
      if (runtime.running) return json(res, 200, { ok: false, error: '批量任务运行中' });
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const prompt = (body.prompt || '').trim();
      if (!prompt) return json(res, 200, { ok: false, error: '提示词为空' });
      if (!config.outputDir) return json(res, 200, { ok: false, error: '未设置输出目录' });
      if (!config.nai.token) return json(res, 200, { ok: false, error: '未设置 NAI 令牌' });
      const file = normalizeFile(body.file || '') || normalizeFile(`快速生成/图-${Date.now()}`);
      quickRuntime.running = true;
      try {
        let imageB64 = null;
        const refRel = (body.ref || '').trim().replace(/\\/g, '/');
        if (refRel) {
          const abs = path.resolve(config.outputDir, refRel);
          const relCheck = path.relative(path.resolve(config.outputDir), abs);
          if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) return json(res, 200, { ok: false, error: '参考图路径越界' });
          if (!fss.existsSync(abs)) return json(res, 200, { ok: false, error: `参考图不存在: ${refRel}` });
          imageB64 = (await fs.readFile(abs)).toString('base64');
        }
        const payload = buildImagePayload({ prompt: prompt, action: imageB64 ? 'img2img' : 'generate', imageB64 });
        rtLog(`⚡ 快速生成 ${file}（seed ${payload.seedUsed}）`);
        const result = await callGenerateImage(payload);
        const outPath = path.join(config.outputDir, file);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, result.buf);
        const m = await loadManifest(config.outputDir);
        m.tasks[file] = { status: 'done', prompt, composedPrompt: composePrompt(prompt), ref: refRel, model: config.nai.model, seed: result.seedUsed, bytes: result.buf.length, finishedAt: Date.now(), quick: true };
        await saveManifest(config.outputDir, m);
        rtLog(`✔ 快速生成完成 ${file} (${(result.buf.length / 1024).toFixed(0)} KB)`);
        return json(res, 200, { ok: true, file, seed: result.seedUsed });
      } catch (e) {
        rtLog(`✖ 快速生成失败: ${e.message}`);
        return json(res, 200, { ok: false, error: e.message });
      } finally { quickRuntime.running = false; }
    }

    // ── 角色展开 ──
    if (url.pathname === '/api/expand-roles' && req.method === 'POST') {
      const added = expandRoles();
      await saveConfig();
      return json(res, 200, { ok: true, added: added.length, tasks: config.tasks.length });
    }

    // ── 画廊 ──
    if (url.pathname === '/api/gallery' && req.method === 'GET') {
      const m = await loadManifest(config.outputDir);
      const items = [];
      for (const [file, rec] of Object.entries(m.tasks)) {
        const abs = path.join(config.outputDir, file);
        const exists = fss.existsSync(abs);
        items.push({
          file, status: rec.status, prompt: rec.prompt, seed: rec.seed, model: rec.model,
          size: rec.size, bytes: rec.bytes, finishedAt: rec.finishedAt, quick: !!rec.quick,
          exists, cut: m.cutouts?.[file] || null,
        });
      }
      items.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
      return json(res, 200, { items });
    }

    // ── 去白边结果落盘（算法在前端 canvas） ──
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
      rtLog(`✂ 去白边完成 ${file} → ${cutName}`);
      return json(res, 200, { ok: true, cutout: cutName });
    }

    if (url.pathname === '/api/delete-image' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const file = normalizeFile(body.file || '');
      if (!file || !config.outputDir) return json(res, 200, { ok: false, error: '参数错误' });
      try { await fs.unlink(path.join(config.outputDir, file)); } catch { /* ignore */ }
      const m = await loadManifest(config.outputDir);
      if (m.cutouts?.[file]) { try { await fs.unlink(path.join(config.outputDir, m.cutouts[file])); } catch { } delete m.cutouts[file]; }
      delete m.tasks[file];
      await saveManifest(config.outputDir, m);
      return json(res, 200, { ok: true });
    }

    // ── 参考图上传（前端选择文件 → 存入输出目录 参考图/ → 返回相对路径填入 ref 字段） ──
    if (url.pathname === '/api/upload-ref' && req.method === 'POST') {
      try {
        if (!config.outputDir) return json(res, 200, { ok: false, error: '未设置输出目录' });
        const rawName = decodeURIComponent(url.searchParams.get('name') || '参考图.png');
        const buf = await readBody(req);
        if (buf.length < 100) return json(res, 200, { ok: false, error: '文件内容过小' });
        const isPng = buf[0] === 0x89 && buf.subarray(1, 4).toString() === 'PNG';
        const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
        const isWebp = buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
        if (!isPng && !isJpg && !isWebp) return json(res, 200, { ok: false, error: '仅支持 PNG/JPG/WebP' });
        const ext = isPng ? '.png' : isJpg ? '.jpg' : '.webp';
        const base = path.basename(rawName).replace(/\.(png|jpe?g|webp)$/i, '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60) || '参考图';
        const rel = normalizeFile(`参考图/${base}-${Date.now()}${ext}`);
        if (!rel) return json(res, 200, { ok: false, error: '文件名非法' });
        const abs = path.join(config.outputDir, rel);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, buf);
        rtLog(`📥 参考图上传: ${rel} (${(buf.length / 1024).toFixed(0)} KB)`);
        return json(res, 200, { ok: true, ref: rel });
      } catch (e) { return json(res, 200, { ok: false, error: e.message }); }
    }

    // ── AI 提示词工坊（NAI 文字模型：中译英 / 扩写 / 瘦身 / 换风格） ──
    const AI_MODES = {
      translate: '把用户的中文描述转写成英文 danbooru 标签提示词（逗号分隔，小写下划线连词）。只输出提示词本身，不要解释。保持角色特征（发色瞳色服装道具）完整，合适的构图/姿势标签放最后。',
      expand: '你是 NovelAI 提示词工程师。在不改变输入提示词任何既有角色特征与构图的前提下，补充细节标签（服装材质、光影、氛围、画质），使画面更丰富。保留原标签顺序在前、新标签在后。只输出补充后的完整英文提示词，逗号分隔，不要解释。',
      slim: '你是 NovelAI 提示词工程师。对输入的英文提示词去冗余：删除互相矛盾、重复语义、对画面无贡献的标签，保留核心人设与构图，输出精简后的完整提示词（尽量不超过 25 个标签）。只输出提示词本身。',
      restyle: '你是 NovelAI 提示词工程师。按用户指定的风格方向改写输入的英文提示词：调整画师/风格/光影/质感类标签，严格保持人物特征（性别、发色、瞳色、服装、道具）不变。只输出改写后的完整提示词。',
    };
    if (url.pathname === '/api/ai/prompt' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf-8'));
      const input = (body.input || '').trim();
      if (!input) return json(res, 200, { ok: false, error: '输入为空' });
      if (!config.nai.token) return json(res, 200, { ok: false, error: '未设置 NAI 令牌' });
      const mode = AI_MODES[body.mode] ? body.mode : 'translate';
      try {
        const sysPrompt = AI_MODES[mode] + (mode === 'restyle' ? `\n风格方向：${body.style || '更精美的动画电影风格'}。` : '');
        const out = await textChat([
          { role: 'system', content: sysPrompt },
          { role: 'user', content: input },
        ], 600);
        return json(res, 200, { ok: true, output: out, mode });
      } catch (e) { return json(res, 200, { ok: false, error: e.message }); }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  } catch (e) {
    console.error('[nai-studio] 路由异常:', e);
    try { json(res, 500, { ok: false, error: e.message }); } catch { /* ignore */ }
  }
});

// 主模块守卫: 被 import（测试）时不启动监听
import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;

if (isMain) server.listen(PORT, '127.0.0.1', async () => {
  await loadConfig();
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║  NAI Studio · NovelAI 角色立绘工作台              ║');
  console.log(`  ║  http://127.0.0.1:${PORT}                          ║`);
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
  if (!config.nai.token) console.log('  ⚠ 尚未配置 NAI 令牌 — 打开网页后在「连接」面板填入 pst- 令牌');
  console.log('  ⚠ 本机需能访问 novelai.net（如走代理请阅读 README「网络与代理」）');
  console.log('');
});

process.on('uncaughtException', e => console.error('[nai-studio] 未捕获异常:', e));

// ── 测试导出（_probe/ 自动验证用；不影响运行时行为） ──
export { unzipFirstEntry, buildImagePayload, calculateAnlasCost, normalizeFile, MODELS, SAMPLERS, NOISE_SCHEDULES, RESOLUTIONS, isV4Model, expandRoles, loadConfig, setConfigForTest };

/** 测试注入: 直接替换内存配置（不落盘） */
function setConfigForTest(c) { config = c; }
