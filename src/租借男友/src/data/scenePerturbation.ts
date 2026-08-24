/**
 * 场景扰动逻辑（与天气系统挂钩）
 *
 * 不存储具体事件，只生成"哪个方向出了问题"的抽象参数。
 * AI 根据参数自行推导具体事件，因此同一参数在不同场景中产生不同结果。
 *
 * 天气影响：
 * - 恶劣天气（小雨/大雨/雪/雾/雷暴）："天不对""地不对""计划不对"权重翻倍
 *   ——本来就在下雨，更容易出环境问题和计划受阻
 * - 晴天："来人了"权重翻倍
 *   ——天气好，人都在外面活动，更容易偶遇
 * - "天不对"的提示词随天气变化：雨天说"雨势加剧"，晴天说"天气突变"
 */

import { type WeatherType } from './weather';

// ── 六个扰动方向 ──
const AXES = [
  '天不对', // 环境/天气相关
  '地不对', // 地点/场所相关
  '人不对', // 角色自身状态相关
  '来人了', // 有人出现/打扰
  '东西不对', // 物品/装备/时间相关
  '计划不对', // 原计划受阻/改变
] as const;

const DIRECTIONS = ['好', '坏'] as const;
const INTENSITIES = ['轻微', '中等', '严重'] as const;
const TIMINGS = ['场景前段', '场景中段', '场景后段'] as const;

type Axis = (typeof AXES)[number];
type Direction = (typeof DIRECTIONS)[number];
type Intensity = (typeof INTENSITIES)[number];
type Timing = (typeof TIMINGS)[number];

/** 恶劣天气集合——这些天气下环境类扰动权重翻倍 */
const BAD_WEATHER = new Set<WeatherType>(['小雨', '大雨', '雪', '雾', '雷暴']);

/** 每个方向的默认抽象提示 */
const AXIS_HINTS: Record<Axis, string> = {
  天不对: '环境或天气发生非预期变化',
  地不对: '所在地点或场所出现状况',
  人不对: '当前角色的身心状态出现波动',
  来人了: '有额外的人出现或介入',
  东西不对: '随身物品或时间资源出现状况',
  计划不对: '原本计划的活动受阻或发生偏移',
};

/** 根据天气返回方向提示——"天不对"的提示随天气变化 */
function getAxisHint(axis: Axis, weatherType?: WeatherType): string {
  if (axis === '天不对' && weatherType) {
    if (BAD_WEATHER.has(weatherType)) {
      return `当前天气（${weatherType}）进一步加剧或引发连锁环境问题`;
    }
    if (weatherType === '晴') {
      return '原本晴好的天气突然发生变化';
    }
  }
  return AXIS_HINTS[axis];
}

export type ScenePerturbation = {
  axis: Axis;
  direction: Direction;
  intensity: Intensity;
  timing: Timing;
};

/** 随机选一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 加权随机选一个元素 */
function pickWeighted<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

/**
 * 根据天气计算各方向权重
 * - 恶劣天气：天不对×3、地不对×2、计划不对×2
 * - 晴天：来人了×2
 * - 其他天气：全部等权
 */
function getAxisWeights(weatherType?: WeatherType): { value: Axis; weight: number }[] {
  const isBad = weatherType && BAD_WEATHER.has(weatherType);
  const isSunny = weatherType === '晴';

  return AXES.map((axis) => {
    let w = 1;
    if (isBad) {
      if (axis === '天不对') w = 3;
      if (axis === '地不对') w = 2;
      if (axis === '计划不对') w = 2;
    }
    if (isSunny && axis === '来人了') w = 2;
    return { value: axis, weight: w };
  });
}

/**
 * 摇骰子，生成 0~2 个扰动
 * 每次消息生成时独立摇骰，不在接单时预定：
 * - 85% 概率无扰动（大部分消息平淡推进）
 * - 12% 概率单个扰动
 * - 3% 概率双重叠加（如"天不对·坏·严重" + "来人了·好·轻微"）
 */
export function rollScenePerturbation(weatherType?: WeatherType): ScenePerturbation[] {
  const roll = Math.random();
  if (roll < 0.85) return []; // 85% 无扰动

  const count = roll >= 0.97 ? 2 : 1; // 3% 双重
  const weights = getAxisWeights(weatherType);
  const usedAxes = new Set<Axis>();
  const result: ScenePerturbation[] = [];

  for (let i = 0; i < count; i++) {
    const available = weights.filter((w) => !usedAxes.has(w.value));
    if (available.length === 0) break;

    const axis = pickWeighted(available);
    usedAxes.add(axis);

    result.push({
      axis,
      direction: pick(DIRECTIONS),
      intensity: pick(INTENSITIES),
      timing: pick(TIMINGS),
    });
  }

  return result;
}

/**
 * 天气阶梯（从最差到最好），用于"天不对"时计算天气变化方向
 * 坏方向 → 往数组前方（更差）走
 * 好方向 → 往数组后方（更好）走
 */
const WEATHER_LADDER: WeatherType[] = ['雷暴', '大雨', '雪', '雾', '小雨', '阴', '多云', '晴'];

const INTENSITY_STEPS: Record<Intensity, number> = { 轻微: 1, 中等: 2, 严重: 3 };

/**
 * 根据"天不对"扰动计算新天气。
 * 坏方向 = 天气变差（晴→阴→小雨...），好方向 = 天气变好（大雨→小雨→阴...）
 * 烈度决定变化步数。到达阶梯两端则不再继续。
 */
export function applyWeatherPerturbation(
  currentWeather: WeatherType,
  perturbation: ScenePerturbation,
): WeatherType {
  if (perturbation.axis !== '天不对') return currentWeather;

  const idx = WEATHER_LADDER.indexOf(currentWeather);
  if (idx === -1) return currentWeather;

  const steps = INTENSITY_STEPS[perturbation.intensity];
  const dir = perturbation.direction === '坏' ? -1 : 1;
  const newIdx = Math.max(0, Math.min(WEATHER_LADDER.length - 1, idx + dir * steps));

  return WEATHER_LADDER[newIdx];
}

/**
 * 将扰动参数格式化为注入提示词
 *
 * 关键设计：注入的是"哪个方向出了问题"，不是"具体发生了什么"。
 * AI 拿到方向后得自己根据当时的地点、天气、角色、时间推导出具体事件。
 * "天不对"的提示词会随当前天气变化，引导AI往天气方向推导。
 */
export function formatPerturbationPrompt(
  perturbations: ScenePerturbation[],
  weatherType?: WeatherType,
): string {
  if (perturbations.length === 0) return '';

  const parts = perturbations.map(
    (p) => `${p.axis}（${getAxisHint(p.axis, weatherType)}）· ${p.direction}向 · ${p.intensity} · ${p.timing}`,
  );

  return [
    '【场景扰动】',
    parts.join(' + '),
    '请根据当前地点、天气、角色状态，自然地推导出具体发生了什么突发事件，',
    '不要直接引用本提示中的方向词，而是写出具体的场景和角色的反应。',
  ].join('');
}
