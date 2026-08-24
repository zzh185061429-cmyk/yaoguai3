/**
 * 地点图片资源解析器 v2
 *
 * 改进：
 * - 按完整目录路径生成层级化数据（宫城/01外朝/东华门）
 * - 打散所有"池子"（宅邸池/村宅池/异态池/会馆池/限时池）
 *   - 有名字的固定地点 → 归入对应区域
 *   - 无名字的复用场景 → 提取到 templatePool
 * - 生成结构：{ residents: LocationEntry[], templates: LocationEntry[] }
 */

const fs = require('fs');
const path = require('path');

const BASE = 'D:\\BaiduNetdiskDownload\\妖怪\\地图\\燕京';

// ── 复用场景模板：从异态池和村宅池提取的无固定归属场景 ──
const TEMPLATE_NAMES = new Set([
  // 异态池 → 乡野公共场景
  '祠堂', '孤坟', '河湾渡口', '荒庙', '井台', '山神庙', '石桥', '水磨坊', '土地庙',
  // 村宅池 → 村宅模板
  '草户农家堂屋', '草户农家院', '粮仓庄园仓房', '粮仓庄园场院', '粮仓庄园正房',
  '石屋山户石屋', '石屋山户院', '瓦舍农家堂屋', '瓦舍农家院',
  '苇棚户柴门', '苇棚户棚屋', '砖屏农家堂屋', '砖屏农家院',
]);

// ── 宅邸池打散映射表：前缀 → [区域, 分区] ──
// 每个宅邸按前缀匹配后归入指定区域
const MANSION_MAPPING = {
  // 王府 → 北城/11诸王邸
  '荆王府':      ['内城', '北城', '11诸王邸'],
  '岷王府':      ['内城', '北城', '11诸王邸'],
  '襄王府':      ['内城', '北城', '11诸王邸'],
  '安定郡王府':  ['内城', '北城', '11诸王邸'],
  '乐安郡王府':  ['内城', '北城', '11诸王邸'],

  // 公爵府 → 西城/04勋贵
  '镇国公府':    ['内城', '西城', '04勋贵'],
  '辅国公府':    ['内城', '西城', '04勋贵'],

  // 侯爵府 → 西城/04勋贵
  '定远侯府':    ['内城', '西城', '04勋贵'],
  '泰宁侯府':    ['内城', '西城', '04勋贵'],
  '武安侯府':    ['内城', '西城', '04勋贵'],
  '长兴侯府':    ['内城', '西城', '04勋贵'],

  // 伯爵府 → 西城/04勋贵
  '平江伯府':    ['内城', '西城', '04勋贵'],
  '清平伯府':    ['内城', '西城', '04勋贵'],
  '忠勇伯府':    ['内城', '西城', '04勋贵'],

  // 高官府邸 → 中城/01署馆
  '大宗伯府':    ['内城', '中城', '01署馆'],
  '都宪府':      ['内城', '中城', '01署馆'],
  '阁老府':      ['内城', '中城', '01署馆'],

  // 散阶官第 → 中城/01署馆
  '朝议第':      ['内城', '中城', '01署馆'],
  '奉政第':      ['内城', '中城', '01署馆'],
  '中宪第':      ['内城', '中城', '01署馆'],
  '迪功第':      ['内城', '中城', '01署馆'],
  '文林第':      ['内城', '中城', '01署馆'],
  '修职第':      ['内城', '中城', '01署馆'],

  // 宦官宅邸 → 皇城/01衙署
  '秉笔宅':      ['皇城', '01衙署'],
  '掌印宅':      ['皇城', '01衙署'],

  // 商铺宅邸 → 外城/02商栈
  '茶食铺宅':    ['外城', '02商栈'],
  '绸缎铺宅':    ['外城', '02商栈'],
  '绸缎巨宅':    ['外城', '02商栈'],
  '广源号宅':    ['外城', '02商栈'],
  '恒昌号宅':    ['外城', '02商栈'],
  '盐商巨宅':    ['外城', '02商栈'],

  // 民居 → 外城/05洼地
  '临街杂院':    ['外城', '05洼地'],
  '陋巷寒宅':    ['外城', '05洼地'],
  '青砖民院':    ['外城', '05洼地'],
};

// ── 限时池打散映射表 ──
const TIMED_POOL_MAPPING = {
  // 宝月宫/澄心宫/青芜宫 → 宫城/04六宫
  '宝月宫':      ['宫城', '04六宫'],
  '澄心宫':      ['宫城', '04六宫'],
  '青芜宫':      ['宫城', '04六宫'],
};

// ── 会馆池打散映射表 ──
const GUILD_POOL_MAPPING = {
  '沅溪会馆':    ['外城', '03会馆'],
  '云间会馆':    ['外城', '03会馆'],
};

// ── 图床链接文件列表 ──
// 每个文件对应一个"区域路径"（目录层级），section header 对应"分区"
const LINK_FILES = [
  { file: '宫城\\图床链接.txt',         areaPath: ['宫城'] },
  { file: '皇城\\图床链接.txt',         areaPath: ['皇城'] },
  { file: '内城\\东城\\图床链接.txt',    areaPath: ['内城', '东城'] },
  { file: '内城\\中城\\图床链接.txt',    areaPath: ['内城', '中城'] },
  { file: '内城\\北城\\图床链接.txt',    areaPath: ['内城', '北城'] },
  { file: '内城\\南城\\图床链接.txt',    areaPath: ['内城', '南城'] },
  { file: '内城\\西城\\图床链接.txt',    areaPath: ['内城', '西城'] },
  { file: '外城\\图床链接.txt',         areaPath: ['外城'] },
  { file: '关厢村野\\图床链接.txt',     areaPath: ['关厢村野'] },
  { file: '远征\\图床链接.txt',         areaPath: ['远征'] },
  { file: '宅邸池\\图床链接.txt',       areaPath: null },  // 特殊处理：按前缀映射
];

// ── 解析后缀 ──
function parseSuffix(filename) {
  const match = filename.match(/^(.+?)-(晴昼|晴夜|阴昼|阴夜|雪昼|雪夜|昼|夜)\.png$/);
  if (!match) return null;
  const name = match[1];
  const suffix = match[2];
  let type, time, weather;
  if (suffix === '昼' || suffix === '夜') {
    type = 'indoor';
    time = suffix;
    weather = '';
  } else {
    type = 'outdoor';
    weather = suffix[0];
    time = suffix[1];
  }
  return { name, suffix, type, time, weather };
}

// ── 从地点名提取府邸前缀（用于宅邸池打散）──
function extractMansionPrefix(locationName) {
  // 尝试匹配最长前缀
  const sortedKeys = Object.keys(MANSION_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (locationName.startsWith(key)) {
      const sceneName = locationName.slice(key.length) || key;
      return { prefix: key, sceneName: sceneName || key };
    }
  }
  return null;
}

// ── 从地点名提取限时池前缀 ──
function extractTimedPrefix(locationName) {
  const sortedKeys = Object.keys(TIMED_POOL_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (locationName.startsWith(key)) {
      const sceneName = locationName.slice(key.length) || key;
      return { prefix: key, sceneName: sceneName || key };
    }
  }
  return null;
}

// ── 从地点名提取会馆池前缀 ──
function extractGuildPrefix(locationName) {
  const sortedKeys = Object.keys(GUILD_POOL_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (locationName.startsWith(key)) {
      const sceneName = locationName.slice(key.length) || key;
      return { prefix: key, sceneName: sceneName || key };
    }
  }
  return null;
}

// ── 解析一个图床链接txt文件 ──
function parseLinkFile(filePath, areaPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const residents = []; // 常驻地点
  const templates = [];  // 复用场景模板
  let currentSection = '';
  let skipSection = false; // 跳过"限时池"/"会馆池"等由 parsePoolEntries 处理的 section

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Section header like 【01外朝】
    if (line.startsWith('【') && line.endsWith('】')) {
      const sectionName = line.slice(1, -1);
      // 跳过"限时池"和"会馆池"——由 parsePoolEntries 单独处理
      if (sectionName === '限时池' || sectionName === '会馆池') {
        skipSection = true;
        currentSection = '';
        continue;
      }
      skipSection = false;
      currentSection = sectionName;
      continue;
    }

    // 跳过池子 section 中的所有数据行
    if (skipSection) continue;

    // Skip metadata lines
    if (line.startsWith('===') || line.startsWith('图床') || line.startsWith('更新') || line.startsWith('共 ')) continue;

    // Filename line (ends with .png)
    if (line.endsWith('.png')) {
      const nextLine = (lines[i + 1] || '').trim();
      if (nextLine.startsWith('http')) {
        const parsed = parseSuffix(line);
        if (!parsed) continue;

        const locationName = parsed.name;
        const variant = parsed.suffix;
        const url = nextLine;

        // 判断是否是复用场景模板
        if (TEMPLATE_NAMES.has(locationName)) {
          templates.push({
            name: locationName,
            type: parsed.type,
            variant,
            url,
          });
          continue;
        }

        // 常驻地点：确定层级路径
        let fullPath;
        let sceneName = locationName;

        if (areaPath) {
          // 正常文件：areaPath + section + locationName
          if (currentSection === '（根目录）' || currentSection === '') {
            fullPath = [...areaPath];
          } else {
            // section 可能包含子路径，如 "村野/01关厢"
            fullPath = [...areaPath, ...currentSection.split('/')];
          }
        } else {
          // 宅邸池：按前缀映射
          const mansion = extractMansionPrefix(locationName);
          if (mansion) {
            const target = MANSION_MAPPING[mansion.prefix];
            fullPath = [...target];
            // sceneName 保留完整名（如 "安定郡王府大门前庭"），不截断
            sceneName = locationName;
          } else {
            console.warn(`  [WARN] 宅邸池中未匹配的地点: ${locationName}`);
            continue;
          }
        }

        residents.push({
          fullPath: fullPath.join('/'),
          sceneName,
          type: parsed.type,
          variant,
          url,
        });
      }
    }
  }

  return { residents, templates };
}

// ── 处理限时池和会馆池（从对应区域的 txt 文件中解析）──
function parsePoolEntries(filePath, poolMapping, extractPrefix) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const residents = [];
  let inPoolSection = false;
  let currentPoolName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('【') && line.endsWith('】')) {
      const sectionName = line.slice(1, -1);
      // 判断是否是池子 section
      if (sectionName.includes('限时池') || sectionName.includes('会馆池')) {
        inPoolSection = true;
        currentPoolName = sectionName;
      } else if (sectionName.includes('异态池')) {
        // 异态池中的内容已在主循环中处理为模板
        inPoolSection = false;
      } else {
        inPoolSection = false;
      }
      continue;
    }

    if (line.startsWith('===') || line.startsWith('图床') || line.startsWith('更新') || line.startsWith('共 ')) continue;

    if (!inPoolSection) continue;
    if (!line.endsWith('.png')) continue;

    const nextLine = (lines[i + 1] || '').trim();
    if (!nextLine.startsWith('http')) continue;

    const parsed = parseSuffix(line);
    if (!parsed) continue;

    const prefixInfo = extractPrefix(parsed.name);
    if (!prefixInfo) {
      console.warn(`  [WARN] ${currentPoolName}中未匹配的地点: ${parsed.name}`);
      continue;
    }

    const target = poolMapping[prefixInfo.prefix];
    residents.push({
      fullPath: target.join('/'),
      sceneName: parsed.name,
      type: parsed.type,
      variant: parsed.suffix,
      url: nextLine,
    });
  }

  return residents;
}

// ── 合并条目：同一 fullPath + sceneName 的变体合并 ──
function mergeEntries(allEntries) {
  const map = new Map(); // key: "fullPath/sceneName" → { ..., variants: {} }

  for (const entry of allEntries) {
    const key = `${entry.fullPath}/${entry.sceneName}`;
    if (!map.has(key)) {
      map.set(key, {
        fullPath: entry.fullPath,
        sceneName: entry.sceneName,
        type: entry.type,
        variants: {},
      });
    }
    const loc = map.get(key);
    loc.variants[entry.variant] = entry.url;
    // 如果看到室外变体，升级为 outdoor
    if (entry.type === 'outdoor') {
      loc.type = 'outdoor';
    }
  }

  return Array.from(map.values());
}

function mergeTemplates(allTemplates) {
  const map = new Map(); // key: name → { name, type, variants: {} }

  for (const entry of allTemplates) {
    if (!map.has(entry.name)) {
      map.set(entry.name, {
        name: entry.name,
        type: entry.type,
        variants: {},
      });
    }
    const loc = map.get(entry.name);
    loc.variants[entry.variant] = entry.url;
    if (entry.type === 'outdoor') {
      loc.type = 'outdoor';
    }
  }

  return Array.from(map.values());
}

// ── 生成 JSON 输出 ──
function generateJSON(residents, templates) {
  return {
    residents,
    templates,
  };
}

// ── 生成 TypeScript 输出 ──
function generateTS(residents, templates) {
  // 生成常驻地点
  let residentsStr = '';
  for (const loc of residents) {
    const key = `${loc.fullPath}/${loc.sceneName}`;
    const variantsStr = Object.entries(loc.variants)
      .map(([suffix, url]) => `      '${suffix}': '${url}'`)
      .join(',\n');
    residentsStr += `  '${key}': {
    name: '${loc.sceneName}',
    fullPath: '${loc.fullPath}',
    type: '${loc.type}',
    variants: {
${variantsStr}
    }
  },
`;
  }

  // 生成模板池
  let templatesStr = '';
  for (const loc of templates) {
    const variantsStr = Object.entries(loc.variants)
      .map(([suffix, url]) => `      '${suffix}': '${url}'`)
      .join(',\n');
    templatesStr += `  '${loc.name}': {
    name: '${loc.name}',
    type: '${loc.type}',
    variants: {
${variantsStr}
    }
  },
`;
  }

  return `/**
 * 燕京地点图片资源映射表 v2
 *
 * 结构：常驻地点树 + 复用场景模板池
 * - 常驻地点 key 格式: "区域/分区/.../场景名"，如 "内城/北城/07肃王府/肃王府大门前庭"
 * - 复用场景 key 格式: "场景名"，如 "荒庙"、"祠堂"
 *
 * 查找逻辑:
 *   1. 先按完整路径在 RESIDENT_LOCATIONS 中精确匹配
 *   2. 找不到则按最后一段名字在 TEMPLATE_LOCATIONS 中匹配
 *   3. 都找不到则返回 undefined
 *
 * 数据来源: D:\\BaiduNetdiskDownload\\妖怪\\地图\\燕京 下的图床链接.txt 文件
 * 由 tools/parse_map_links.js 自动生成
 */

/** 图片变体类型 */
export type ImageVariant = '昼' | '夜' | '晴昼' | '晴夜' | '阴昼' | '阴夜' | '雪昼' | '雪夜';

/** 图片变体及对应URL */
export interface LocationImageVariants {
  [variant: string]: string;
}

/** 常驻地点条目 */
export interface ResidentLocationEntry {
  /** 地点名称 */
  name: string;
  /** 完整路径，如 "内城/北城/07肃王府" */
  fullPath: string;
  /** indoor = 室内(仅昼夜), outdoor = 室外(晴阴雪×昼夜) */
  type: 'indoor' | 'outdoor';
  /** 图片变体及对应URL */
  variants: LocationImageVariants;
}

/** 复用场景模板条目 */
export interface TemplateLocationEntry {
  /** 场景名称 */
  name: string;
  /** indoor = 室内(仅昼夜), outdoor = 室外(晴阴雪×昼夜) */
  type: 'indoor' | 'outdoor';
  /** 图片变体及对应URL */
  variants: LocationImageVariants;
}

/** 常驻地点映射表
 *  key: "区域/分区/.../场景名" */
export const RESIDENT_LOCATIONS: Record<string, ResidentLocationEntry> = {
${residentsStr}};

/** 复用场景模板池
 *  key: 场景名（无路径前缀） */
export const TEMPLATE_LOCATIONS: Record<string, TemplateLocationEntry> = {
${templatesStr}};

/** 获取某个地点的图片 URL
 *  @param locationKey 地点路径，如 "内城/北城/07肃王府/肃王府大门前庭" 或 "荒庙"
 *  @param variant 图片变体类型
 */
export function getLocationImage(
  locationKey: string,
  variant: ImageVariant,
): string | undefined {
  // 1. 先在常驻地点中精确匹配
  const resident = RESIDENT_LOCATIONS[locationKey];
  if (resident) return resident.variants[variant];

  // 2. 按 / 分割，取最后一段作为场景名，在模板池中查找
  const parts = locationKey.split('/');
  const sceneName = parts[parts.length - 1];
  const template = TEMPLATE_LOCATIONS[sceneName];
  if (template) return template.variants[variant];

  // 3. 都找不到
  return undefined;
}

/** 模糊查找地点图片
 *  支持部分路径匹配，如 "肃王府/大门前庭" 也能匹配到 "内城/北城/07肃王府/肃王府大门前庭"
 *  @param locationKey 地点路径（完整或部分）
 *  @param variant 图片变体类型
 */
export function getLocationImageFuzzy(
  locationKey: string,
  variant: ImageVariant,
): string | undefined {
  // 精确匹配
  const exact = getLocationImage(locationKey, variant);
  if (exact) return exact;

  // 模糊匹配：在常驻地点中查找以 locationKey 结尾的 key
  for (const [key, entry] of Object.entries(RESIDENT_LOCATIONS)) {
    if (key.endsWith('/' + locationKey) || key === locationKey) {
      return entry.variants[variant];
    }
  }

  // 模板池模糊匹配
  const parts = locationKey.split('/');
  const sceneName = parts[parts.length - 1];
  const template = TEMPLATE_LOCATIONS[sceneName];
  if (template) return template.variants[variant];

  return undefined;
}

/** 获取某个路径前缀下所有常驻地点 */
export function getLocationsByPath(pathPrefix: string): ResidentLocationEntry[] {
  return Object.entries(RESIDENT_LOCATIONS)
    .filter(([key]) => key.startsWith(pathPrefix))
    .map(([, entry]) => entry);
}

/** 获取所有顶级区域 */
export function getTopLevelAreas(): string[] {
  return [...new Set(Object.values(RESIDENT_LOCATIONS).map(e => e.fullPath.split('/')[0]))];
}

/** 获取某个路径下直接的子节点（区域/分区/场景） */
export function getChildNodes(pathPrefix: string): { name: string; isLeaf: boolean }[] {
  const prefix = pathPrefix ? pathPrefix + '/' : '';
  const result = new Map<string, boolean>();

  for (const [key] of Object.entries(RESIDENT_LOCATIONS)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const parts = rest.split('/');
    if (parts.length === 1) {
      // 叶子节点
      result.set(parts[0], true);
    } else {
      // 中间节点
      result.set(parts[0], false);
    }
  }

  return Array.from(result.entries()).map(([name, isLeaf]) => ({ name, isLeaf }));
}

/** 获取所有复用场景模板名称 */
export function getTemplateNames(): string[] {
  return Object.keys(TEMPLATE_LOCATIONS);
}

/** 获取总地点数量 */
export function getTotalLocationCount(): number {
  return Object.keys(RESIDENT_LOCATIONS).length + Object.keys(TEMPLATE_LOCATIONS).length;
}
`;
}

// ── Main ──
const allResidents = [];
const allTemplates = [];

for (const { file, areaPath } of LINK_FILES) {
  const fullPath = path.join(BASE, file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Not found: ${fullPath}`);
    continue;
  }
  console.log(`Parsing: ${fullPath}`);
  const { residents, templates } = parseLinkFile(fullPath, areaPath);
  allResidents.push(...residents);
  allTemplates.push(...templates);
  console.log(`  Residents: ${residents.length}, Templates: ${templates.length}`);
}

// 处理宫城限时池
console.log('Parsing timed pool from 宫城...');
const timedPoolResidents = parsePoolEntries(
  path.join(BASE, '宫城\\图床链接.txt'),
  TIMED_POOL_MAPPING,
  (name) => {
    const sortedKeys = Object.keys(TIMED_POOL_MAPPING).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (name.startsWith(key)) {
        return { prefix: key, sceneName: name.slice(key.length) || key };
      }
    }
    return null;
  }
);
allResidents.push(...timedPoolResidents);
console.log(`  Timed pool residents: ${timedPoolResidents.length}`);

// 处理外城会馆池
console.log('Parsing guild pool from 外城...');
const guildPoolResidents = parsePoolEntries(
  path.join(BASE, '外城\\图床链接.txt'),
  GUILD_POOL_MAPPING,
  (name) => {
    const sortedKeys = Object.keys(GUILD_POOL_MAPPING).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (name.startsWith(key)) {
        return { prefix: key, sceneName: name.slice(key.length) || key };
      }
    }
    return null;
  }
);
allResidents.push(...guildPoolResidents);
console.log(`  Guild pool residents: ${guildPoolResidents.length}`);

// 合并变体
const mergedResidents = mergeEntries(allResidents);
const mergedTemplates = mergeTemplates(allTemplates);

console.log(`\nTotal residents: ${mergedResidents.length}`);
console.log(`Total templates: ${mergedTemplates.length}`);

// 生成 JSON
const json = generateJSON(mergedResidents, mergedTemplates);
const jsonOutput = JSON.stringify(json, null, 2);
const jsonPath = 'D:\\BaiduNetdiskDownload\\tavern_helper_template-main\\src\\yaoguai\\幻璃镜\\src\\data\\locationData.json';
fs.writeFileSync(jsonPath, jsonOutput, 'utf-8');
console.log(`\nJSON written to: ${jsonPath}`);

// 生成 TS
const ts = generateTS(mergedResidents, mergedTemplates);
const tsOutputPath = 'D:\\BaiduNetdiskDownload\\tavern_helper_template-main\\src\\yaoguai\\幻璃镜\\src\\data\\locationImages.ts';
fs.writeFileSync(tsOutputPath, ts, 'utf-8');
console.log(`TS written to: ${tsOutputPath}`);

// 统计
const residentIndoor = mergedResidents.filter(l => l.type === 'indoor').length;
const residentOutdoor = mergedResidents.filter(l => l.type === 'outdoor').length;
const templateIndoor = mergedTemplates.filter(l => l.type === 'indoor').length;
const templateOutdoor = mergedTemplates.filter(l => l.type === 'outdoor').length;
console.log(`\n--- Statistics ---`);
console.log(`Residents: ${residentIndoor} indoor, ${residentOutdoor} outdoor`);
console.log(`Templates: ${templateIndoor} indoor, ${templateOutdoor} outdoor`);

// 按区域统计
const areaStats = {};
for (const r of mergedResidents) {
  const area = r.fullPath.split('/')[0];
  if (!areaStats[area]) areaStats[area] = 0;
  areaStats[area]++;
}
console.log(`\n--- By Area ---`);
for (const [area, count] of Object.entries(areaStats).sort()) {
  console.log(`  ${area}: ${count} locations`);
}
