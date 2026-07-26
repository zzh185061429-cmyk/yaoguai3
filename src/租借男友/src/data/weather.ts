/**
 * 天气系统
 *
 * 和日程系统同构：前端用种子算出确定结果 → 注入 AI 提示词 + 供 UI 读取。
 * 全程不写入 MVU，与角色位置表的数据流完全一致。
 *
 * 种子粒度：按"天"一变（一天一个天气），比日程的 2 小时桶更稳。
 */

// 学期类型与判断内联于此，避免与 scheduleData 形成循环依赖
type SemesterType = 'autumn' | 'winterBreak' | 'spring' | 'summerBreak';

function getSemesterTypeLocal(date: Date): SemesterType {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month >= 9 || (month === 1 && day <= 15)) return 'autumn';
  if ((month === 1 && day > 15) || (month === 2 && day <= 20)) return 'winterBreak';
  if ((month === 2 && day > 20) || (month >= 3 && month <= 6)) return 'spring';
  return 'summerBreak';
}


// ============================================================
// 天气类型定义
// ============================================================

export type WeatherType =
  | '晴'
  | '多云'
  | '阴'
  | '小雨'
  | '大雨'
  | '雪'
  | '雾'
  | '雷暴';

export type Weather = {
  type: WeatherType;
  /** 给 AI 提示词用的自然语言描述 */
  description: string;
  /** 室外地点权重乘数（1=无影响，<1=降权） */
  outdoorMultiplier: number;
};

// ============================================================
// 种子随机（复用日程系统的确定性思路，但按天分桶）
// ============================================================

/** 日期字符串 → 稳定哈希种子（按天，同一天结果稳定） */
function weatherHashSeed(date: Date): number {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 基于种子的伪随机数 [0, 1) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ============================================================
// 季节天气概率表
// ============================================================

type ProbabilityTable = Record<WeatherType, number>;

/** 秋季学期（9月-1月中）：秋高气爽，偶有秋雨 */
const AUTUMN_TABLE: ProbabilityTable = {
  '晴': 35, '多云': 25, '阴': 15, '小雨': 12, '大雨': 4, '雪': 0, '雾': 7, '雷暴': 2,
};

/** 寒假（1月中-2月下）：干冷，偶有雪/雾 */
const WINTER_BREAK_TABLE: ProbabilityTable = {
  '晴': 30, '多云': 22, '阴': 18, '小雨': 5, '大雨': 2, '雪': 15, '雾': 8, '雷暴': 0,
};

/** 春季学期（2月下-6月）：春暖，多雨多雾 */
const SPRING_TABLE: ProbabilityTable = {
  '晴': 25, '多云': 22, '阴': 18, '小雨': 18, '大雨': 6, '雪': 0, '雾': 8, '雷暴': 3,
};

/** 暑假（7-8月）：盛夏，多雷雨 */
const SUMMER_BREAK_TABLE: ProbabilityTable = {
  '晴': 35, '多云': 20, '阴': 12, '小雨': 12, '大雨': 8, '雪': 0, '雾': 3, '雷暴': 10,
};

function getProbabilityTable(semester: SemesterType): ProbabilityTable {
  switch (semester) {
    case 'autumn': return AUTUMN_TABLE;
    case 'winterBreak': return WINTER_BREAK_TABLE;
    case 'spring': return SPRING_TABLE;
    case 'summerBreak': return SUMMER_BREAK_TABLE;
  }
}

// ============================================================
// 天气 → 影响参数
// ============================================================

const WEATHER_EFFECT: Record<WeatherType, { description: string; outdoorMultiplier: number }> = {
  '晴':   { description: '晴朗，阳光充足',          outdoorMultiplier: 1.0 },
  '多云': { description: '多云，天气温和',          outdoorMultiplier: 1.0 },
  '阴':   { description: '阴天，光线偏暗',          outdoorMultiplier: 0.9 },
  '小雨': { description: '小雨，地面湿滑',          outdoorMultiplier: 0.35 },
  '大雨': { description: '大雨，不宜外出',          outdoorMultiplier: 0.15 },
  '雪':   { description: '下雪，天寒地冻',          outdoorMultiplier: 0.2 },
  '雾':   { description: '雾天，能见度低',          outdoorMultiplier: 0.6 },
  '雷暴': { description: '雷暴天气，危险不宜外出',  outdoorMultiplier: 0.1 },
};

// ============================================================
// 主函数：获取某天的天气
// ============================================================

/**
 * 获取指定日期的天气。
 *
 * 种子按天分桶 → 同一天天气稳定；季节调概率表。
 * 确定性函数，无副作用，UI 和提示词注入共用同一个结果。
 */
export function getWeather(date: Date): Weather {
  const semester = getSemesterTypeLocal(date);
  const table = getProbabilityTable(semester);

  const seed = weatherHashSeed(date);
  const total = Object.values(table).reduce((sum, w) => sum + w, 0);

  let rand = seededRandom(seed) * total;
  let chosen: WeatherType = '晴';
  for (const [type, weight] of Object.entries(table) as [WeatherType, number][]) {
    rand -= weight;
    if (rand <= 0) {
      chosen = type;
      break;
    }
  }

  const effect = WEATHER_EFFECT[chosen];
  return {
    type: chosen,
    description: effect.description,
    outdoorMultiplier: effect.outdoorMultiplier,
  };
}

/** 是否为"恶劣天气"（雨天/雪天/雷暴）——角色特化覆盖用 */
export function isBadWeather(weather: Weather): boolean {
  return ['小雨', '大雨', '雪', '雷暴'].includes(weather.type);
}

/** 是否为雨天（小雨/大雨） */
export function isRainyWeather(weather: Weather): boolean {
  return weather.type === '小雨' || weather.type === '大雨';
}
