/**
 * 天气系统
 *
 * v3: 时段天气 + 天气突变
 * - 每天分为 4 个时段（上午/下午/傍晚/夜间），各时段天气独立
 * - 马尔可夫链在时段间传递，保证天气趋势连续
 * - 每小时有概率发生天气突变（确定性种子），模拟突发天气
 * - 预报存入聊天变量，换聊天自动重置
 * - getWeather() 优先查预报缓存，fallback 到哈希
 * - ensureForecast() 由 GameContext 在游戏日期变更时调用
 * - getForecastSummary() 供 AI 提示词注入未来天气
 * - getTodayWeatherDetail() 供 AI 提示词注入今日各时段天气
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
// 天气覆盖（场景扰动用）
// ============================================================

/**
 * 直接修改当前时段的预报天气。
 * 由场景扰动系统在"天不对"时调用，使天气变化持久写入预报系统，
 * 特效和滤镜自然同步，后续消息也保持一致，无需手动清除。
 */
export function setCurrentPeriodWeather(date: Date, type: WeatherType): void {
  const key = dateToKey(date);
  if (!forecastCache) {
    forecastCache = loadForecastFromVars();
  }
  if (!forecastCache) return;

  const entry = forecastCache.find((f) => f.dateStr === key);
  if (!entry) return;

  const period = getTimePeriod(date);
  if (!entry.periods) {
    entry.periods = { morning: entry.type, afternoon: entry.type, evening: entry.type, night: entry.type };
  }

  const oldType = entry.periods[period];
  entry.periods[period] = type;

  // 主导天气 = 下午时段，如果改的是下午也同步更新主导天气
  if (period === 'afternoon') {
    entry.type = type;
    const effect = WEATHER_EFFECT[type];
    entry.description = effect.description;
    entry.outdoorMultiplier = effect.outdoorMultiplier;
  }

  saveForecastToVars(forecastCache);
  console.info(`[Weather] 已修改${key}的${PERIOD_LABELS[period]}时段天气：${oldType} → ${type}`);
}

// ============================================================
// 时段定义
// ============================================================

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

/** 时段顺序（用于马尔可夫链传递） */
const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];

/** 时段中文名称 */
const PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜间',
};

/** 时段对应的时间范围（供界面展示用） */
const PERIOD_TIME_RANGES: Record<TimePeriod, string> = {
  morning: '06:00-12:00',
  afternoon: '12:00-18:00',
  evening: '18:00-24:00',
  night: '00:00-06:00',
};

/** 根据日期的小时数获取所属时段 */
export function getTimePeriod(date: Date): TimePeriod {
  const h = date.getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18) return 'evening';
  return 'night';
}

// ============================================================
// 种子随机（哈希方案，作为预报的 fallback）
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
// 哈希方案（fallback：无预报数据时使用）
// ============================================================

/** 哈希选天气（确定性，同一天结果稳定） */
function hashPickWeather(date: Date, table: ProbabilityTable): WeatherType {
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
  return chosen;
}

/** 哈希方案获取天气（fallback） */
function hashGetWeather(date: Date): Weather {
  const semester = getSemesterTypeLocal(date);
  const table = getProbabilityTable(semester);
  const chosen = hashPickWeather(date, table);
  const effect = WEATHER_EFFECT[chosen];
  return {
    type: chosen,
    description: effect.description,
    outdoorMultiplier: effect.outdoorMultiplier,
  };
}

// ============================================================
// 马尔可夫链：天气趋势
// ============================================================

/** 天气相似性分组（相似天气在马尔可夫链中获得加权） */
const WEATHER_SIMILARITY: Record<WeatherType, WeatherType[]> = {
  '晴': ['多云'],
  '多云': ['晴', '阴'],
  '阴': ['多云', '小雨', '雾'],
  '小雨': ['阴', '大雨', '雾'],
  '大雨': ['小雨', '雷暴'],
  '雪': ['阴', '小雨'],
  '雾': ['阴', '多云'],
  '雷暴': ['大雨', '小雨'],
};

/** 天气持续性因子（同一天气延续到明天的权重倍数） */
const PERSISTENCE_FACTOR: Record<WeatherType, number> = {
  '晴': 2.5,    // 晴天容易持续
  '多云': 1.8,
  '阴': 2.0,    // 阴天容易持续
  '小雨': 1.8,  // 雨天可以持续几天
  '大雨': 0.7,  // 大雨通常不持久
  '雪': 1.8,    // 雪天可以持续
  '雾': 0.8,    // 雾通常散得快
  '雷暴': 0.3,  // 雷暴很短
};

/**
 * 基于前一天气 + 季节概率表，用马尔可夫链选下一个天气。
 * 持续性加权 + 相似性加权 → 天气有趋势，不会乱跳。
 */
function markovNext(prev: WeatherType, baseTable: ProbabilityTable): WeatherType {
  const weights = { ...baseTable };

  // 持续性：同一天气获得加权
  if (weights[prev] > 0) {
    weights[prev] *= PERSISTENCE_FACTOR[prev];
  }

  // 相似性：相邻天气类型获得加权
  for (const s of WEATHER_SIMILARITY[prev]) {
    if (weights[s] > 0) {
      weights[s] *= 1.5;
    }
  }

  // 加权随机选择（使用 Math.random，因为预报只生成一次并存入变量）
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const rand = Math.random() * total;
  let acc = rand;
  let chosen: WeatherType = '晴';
  for (const [type, weight] of Object.entries(weights) as [WeatherType, number][]) {
    acc -= weight;
    if (acc <= 0) {
      chosen = type;
      break;
    }
  }
  return chosen;
}

// ============================================================
// 天气突变（确定性，基于日期+小时种子）
// ============================================================

/** 突变概率（每小时检查一次） */
const SUDDEN_CHANGE_PROBABILITY = 0.10;

/**
 * 检查并应用天气突变。
 *
 * 使用「日期哈希 + 小时」作为种子，确保同一时刻结果稳定（确定性）。
 * - 80% 的突变：选取与当前天气相似的其他天气类型（温和变化，如晴→多云）
 * - 20% 的突变：从季节概率表随机选取（可能产生剧烈变化，如晴→雷暴）
 *
 * 这使得一天内天气不再固定不变：
 * - 上午可能晴朗，下午突然转阴
 * - 傍晚可能突发阵雨，夜间又转晴
 */
function applySuddenChange(date: Date, baseWeather: WeatherType): WeatherType {
  // 种子：日期哈希 + 小时，确保同一时刻结果稳定
  const seed = weatherHashSeed(date) * 31 + date.getHours() * 7919;
  const rand = seededRandom(seed);

  // 未触发突变
  if (rand >= SUDDEN_CHANGE_PROBABILITY) return baseWeather;

  // 决定突变类型
  const typeSeed = seededRandom(seed + 1000);
  if (typeSeed < 0.8) {
    // 80%：温和突变（相似天气）
    const related = WEATHER_SIMILARITY[baseWeather];
    if (related.length === 0) return baseWeather;
    const idxSeed = seededRandom(seed + 2000);
    const picked = related[Math.floor(idxSeed * related.length)];
    // 如果选中的天气与基础天气相同，不算突变
    if (picked === baseWeather) return baseWeather;
    return picked;
  } else {
    // 20%：剧烈突变（从季节概率表随机选取）
    const semester = getSemesterTypeLocal(date);
    const table = getProbabilityTable(semester);
    const total = Object.values(table).reduce((sum, w) => sum + w, 0);
    const pickSeed = seededRandom(seed + 3000);
    let acc = pickSeed * total;
    for (const [type, weight] of Object.entries(table) as [WeatherType, number][]) {
      acc -= weight;
      if (acc <= 0) {
        if (type === baseWeather) return baseWeather; // 相同则不算突变
        return type;
      }
    }
    return baseWeather;
  }
}

// ============================================================
// 七日预报：数据结构与持久化
// ============================================================

export type ForecastEntry = {
  dateStr: string;
  /** 主导天气（下午时段的天气，用于预报展示） */
  type: WeatherType;
  description: string;
  outdoorMultiplier: number;
  /** 各时段天气（v3 新增，旧数据可能没有） */
  periods?: Record<TimePeriod, WeatherType>;
  /** 各时段是否已应用天气突变（防止重复应用，持久化到聊天变量） */
  suddenChangeApplied?: Partial<Record<TimePeriod, boolean>>;
};

/** 内存缓存，避免每次 getWeather 都读聊天变量 */
let forecastCache: ForecastEntry[] | null = null;

function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 从聊天变量加载预报 */
function loadForecastFromVars(): ForecastEntry[] | null {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars) return null;
    const raw = (vars as any).weatherForecast;
    if (!Array.isArray(raw)) return null;

    const valid: ForecastEntry[] = [];
    for (const entry of raw) {
      if (entry
        && typeof entry.dateStr === 'string'
        && typeof entry.type === 'string'
        && entry.type in WEATHER_EFFECT
        && typeof entry.description === 'string'
        && typeof entry.outdoorMultiplier === 'number') {

        // 加载时段数据（v3 新增，旧数据没有则 periods 为 undefined）
        let periods: Record<TimePeriod, WeatherType> | undefined;
        if (entry.periods && typeof entry.periods === 'object') {
          const p = entry.periods;
          if (typeof p.morning === 'string' && p.morning in WEATHER_EFFECT
            && typeof p.afternoon === 'string' && p.afternoon in WEATHER_EFFECT
            && typeof p.evening === 'string' && p.evening in WEATHER_EFFECT
            && typeof p.night === 'string' && p.night in WEATHER_EFFECT) {
            periods = {
              morning: p.morning as WeatherType,
              afternoon: p.afternoon as WeatherType,
              evening: p.evening as WeatherType,
              night: p.night as WeatherType,
            };
          }
        }

        // 加载突变标记（防止重复应用）
        let suddenChangeApplied: Partial<Record<TimePeriod, boolean>> | undefined;
        if (entry.suddenChangeApplied && typeof entry.suddenChangeApplied === 'object') {
          const s = entry.suddenChangeApplied as Record<string, unknown>;
          suddenChangeApplied = {};
          for (const p of PERIOD_ORDER) {
            if (s[p] === true) {
              suddenChangeApplied[p] = true;
            }
          }
        }

        valid.push({
          dateStr: entry.dateStr,
          type: entry.type as WeatherType,
          description: entry.description,
          outdoorMultiplier: entry.outdoorMultiplier,
          periods,
          suddenChangeApplied,
        });
      }
    }
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

/** 保存预报到聊天变量 */
function saveForecastToVars(forecast: ForecastEntry[]) {
  try {
    updateVariablesWith(vars => ({ ...vars, weatherForecast: forecast }), { type: 'chat' });
  } catch (e) {
    console.warn('[Weather] 无法持久化天气预报:', e);
  }
}

// ============================================================
// 七日预报：生成与滚动窗口
// ============================================================

const FORECAST_DAYS = 7;

/**
 * 从指定日期起生成 N 天预报。
 *
 * 每天包含 4 个时段（上午/下午/傍晚/夜间），
 * 用马尔可夫链在时段间传递，保证天气趋势连续。
 * 主导天气 = 下午时段天气（用于预报展示）。
 *
 * @param startDate 起始日期
 * @param days 生成天数
 * @param prevWeather 前一天最后一个时段的天气（用于马尔可夫链起始）
 */
function generateForecast(startDate: Date, days: number, prevWeather?: WeatherType): ForecastEntry[] {
  const forecast: ForecastEntry[] = [];
  let prevType = prevWeather;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const semester = getSemesterTypeLocal(d);
    const table = getProbabilityTable(semester);

    // 生成 4 个时段天气，马尔可夫链在时段间传递
    const periods: Record<TimePeriod, WeatherType> = {
      morning: '晴',
      afternoon: '晴',
      evening: '晴',
      night: '晴',
    };

    for (const period of PERIOD_ORDER) {
      if (prevType) {
        periods[period] = markovNext(prevType, table);
      } else {
        // 第一天第一个时段：用哈希确定（向后兼容）
        periods[period] = hashPickWeather(d, table);
      }
      prevType = periods[period];
    }

    // 主导天气 = 下午时段（最活跃的时间段，用于预报展示）
    const dominantType = periods.afternoon;
    const effect = WEATHER_EFFECT[dominantType];
    forecast.push({
      dateStr: dateToKey(d),
      type: dominantType,
      description: effect.description,
      outdoorMultiplier: effect.outdoorMultiplier,
      periods,
    });
  }

  return forecast;
}

/**
 * 确保预报覆盖当前日期，维护滚动窗口。
 * 由 GameContext 在游戏日期变更时调用。
 *
 * - 无预报 → 生成 7 天
 * - 旧版数据（无 periods）→ 重新生成
 * - 今天在预报内 → 裁剪过期天数，不足 7 天则补充
 * - 今天不在预报内 → 重新生成
 */
export function ensureForecast(currentDate: Date): void {
  const currentKey = dateToKey(currentDate);

  if (!forecastCache) {
    forecastCache = loadForecastFromVars();
  }

  if (forecastCache && forecastCache.length > 0) {
    // 检测旧版数据（无 periods 字段）→ 重新生成
    const hasOldEntries = forecastCache.some(f => !f.periods);
    if (hasOldEntries) {
      const todayWeather = hashPickWeather(currentDate, getProbabilityTable(getSemesterTypeLocal(currentDate)));
      forecastCache = generateForecast(currentDate, FORECAST_DAYS, todayWeather);
      saveForecastToVars(forecastCache);
      console.info('[Weather] 检测到旧版预报数据（无时段信息），重新生成');
      return;
    }

    const todayIdx = forecastCache.findIndex(f => f.dateStr === currentKey);

    if (todayIdx >= 0) {
      // 今天在预报范围内
      let changed = false;

      // 裁剪过期天数
      if (todayIdx > 0) {
        forecastCache = forecastCache.slice(todayIdx);
        changed = true;
        console.info('[Weather] 裁剪过期天气预报');
      }

      // 补充未来天数
      if (forecastCache.length < FORECAST_DAYS) {
        const lastEntry = forecastCache[forecastCache.length - 1];
        const lastDate = parseDateKey(lastEntry.dateStr);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const daysToAdd = FORECAST_DAYS - forecastCache.length;
        // 从最后一天的夜间天气开始马尔可夫链
        const newEntries = generateForecast(nextDate, daysToAdd, lastEntry.periods?.night);
        forecastCache = [...forecastCache, ...newEntries];
        changed = true;
        console.info(`[Weather] 补充 ${daysToAdd} 天天气预报`);
      }

      if (changed) saveForecastToVars(forecastCache);
      return;
    }

    // 今天不在预报范围内 → 重新生成
    const todayWeather = hashPickWeather(currentDate, getProbabilityTable(getSemesterTypeLocal(currentDate)));
    forecastCache = generateForecast(currentDate, FORECAST_DAYS, todayWeather);
    saveForecastToVars(forecastCache);
    console.info('[Weather] 日期超出预报范围，重新生成天气预报');
    return;
  }

  // 无预报数据 → 生成新的
  const todayWeather = hashPickWeather(currentDate, getProbabilityTable(getSemesterTypeLocal(currentDate)));
  forecastCache = generateForecast(currentDate, FORECAST_DAYS, todayWeather);
  saveForecastToVars(forecastCache);
  console.info('[Weather] 生成初始天气预报（7天，含时段）');
}

// ============================================================
// 主函数：获取某时刻的天气
// ============================================================

/** 从缓存中查找指定日期的预报条目 */
function findForecastEntry(key: string): ForecastEntry | null {
  if (forecastCache) {
    return forecastCache.find(f => f.dateStr === key) || null;
  }
  // 懒加载：首次调用时从聊天变量加载
  forecastCache = loadForecastFromVars();
  if (forecastCache) {
    return forecastCache.find(f => f.dateStr === key) || null;
  }
  return null;
}

/**
 * 获取指定时刻的天气。
 *
 * 1. 从预报缓存查找当天的预报条目
 * 2. 根据当前小时确定时段，取该时段的天气
 * 3. 检查天气突变（确定性种子，~10% 概率）
 * 4. 无预报数据时 fallback 到哈希方案
 *
 * 所有调用方（WeatherOverlay、PhoneContext、GameContext 提示词注入等）
 * 无需改动，透明升级。
 */
export function getWeather(date: Date): Weather {
  const key = dateToKey(date);
  const entry = findForecastEntry(key);

  if (entry) {
    // 确定当前时段天气
    let weatherType: WeatherType = entry.type;
    if (entry.periods) {
      const period = getTimePeriod(date);
      weatherType = entry.periods[period];

      // 检查并应用天气突变（持久化到预报系统，防止重复应用）
      if (!entry.suddenChangeApplied?.[period]) {
        const changed = applySuddenChange(date, weatherType);

        // 标记该时段已检查突变（无论是否实际变化）
        if (!entry.suddenChangeApplied) entry.suddenChangeApplied = {};
        entry.suddenChangeApplied[period] = true;

        if (changed !== weatherType) {
          // 突变发生，写入预报缓存
          const original = weatherType;
          entry.periods[period] = changed;
          if (period === 'afternoon') {
            entry.type = changed;
            const effect = WEATHER_EFFECT[changed];
            entry.description = effect.description;
            entry.outdoorMultiplier = effect.outdoorMultiplier;
          }
          weatherType = changed;
          console.info(`[Weather] ${PERIOD_LABELS[period]}时段天气突变：${original} → ${changed}（已持久化到预报）`);
        }

        // 持久化突变标记和天气变化
        if (forecastCache) saveForecastToVars(forecastCache);
      }
    }

    const effect = WEATHER_EFFECT[weatherType];
    return {
      type: weatherType,
      description: effect.description,
      outdoorMultiplier: effect.outdoorMultiplier,
    };
  }

  // Fallback 到哈希方案
  return hashGetWeather(date);
}

/**
 * 获取某天的主导天气（用于预报展示）。
 * 返回下午时段的天气，或无时段数据时返回基础天气。
 */
export function getDailyWeather(date: Date): Weather {
  const key = dateToKey(date);
  const entry = findForecastEntry(key);

  if (entry) {
    const effect = WEATHER_EFFECT[entry.type];
    return {
      type: entry.type,
      description: effect.description,
      outdoorMultiplier: effect.outdoorMultiplier,
    };
  }

  return hashGetWeather(date);
}

// ============================================================
// 预报摘要（供 AI 提示词注入用）
// ============================================================

const WEEKDAYS_FORECAST = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 获取今日各时段天气详情，供 AI 提示词注入使用。
 * 例："今日天气：上午晴，下午多云，傍晚阴，夜间小雨"
 * 无时段数据时返回当前天气摘要。
 */
export function getTodayWeatherDetail(date: Date): string {
  const key = dateToKey(date);
  const entry = findForecastEntry(key);

  if (entry && entry.periods) {
    const parts = PERIOD_ORDER.map(p => `${PERIOD_LABELS[p]}${entry.periods![p]}`);
    return `今日天气：${parts.join('，')}`;
  }

  // fallback
  const w = getWeather(date);
  return `今日天气：${w.type}（${w.description}）`;
}

/** 单个时段的天气信息（供界面展示用） */
export type PeriodWeather = {
  period: TimePeriod;
  label: string;
  timeRange: string;
  type: WeatherType;
  description: string;
};

/**
 * 获取指定日期的四个时段天气，供手机天气预报界面展示使用。
 * 返回上午/下午/傍晚/夜间各自的天气类型和描述。
 * 无预报数据时 fallback 到当前天气（四个时段相同）。
 */
export function getDailyPeriods(date: Date): PeriodWeather[] {
  const key = dateToKey(date);
  const entry = findForecastEntry(key);

  if (entry && entry.periods) {
    return PERIOD_ORDER.map(p => {
      const effect = WEATHER_EFFECT[entry.periods![p]];
      return {
        period: p,
        label: PERIOD_LABELS[p],
        timeRange: PERIOD_TIME_RANGES[p],
        type: entry.periods![p],
        description: effect.description,
      };
    });
  }

  // fallback：无时段数据时，四个时段都用当前天气
  const w = getWeather(date);
  return PERIOD_ORDER.map(p => ({
    period: p,
    label: PERIOD_LABELS[p],
    timeRange: PERIOD_TIME_RANGES[p],
    type: w.type,
    description: w.description,
  }));
}

/**
 * 获取未来几天的天气摘要文本，供 AI 提示词注入使用。
 * 每天包含四个时段天气，格式：
 * "【未来天气】明天：上午晴/下午多云/傍晚阴/夜间小雨，后天：..."
 * 无时段数据时 fallback 到主导天气。
 */
export function getForecastSummary(currentDate: Date): string {
  if (!forecastCache) {
    forecastCache = loadForecastFromVars();
  }
  if (!forecastCache || forecastCache.length === 0) return '';

  const currentKey = dateToKey(currentDate);
  const todayIdx = forecastCache.findIndex(f => f.dateStr === currentKey);
  if (todayIdx < 0) return '';

  const upcoming = forecastCache.slice(todayIdx + 1, todayIdx + 5); // 未来4天
  if (upcoming.length === 0) return '';

  const parts = upcoming.map((f, i) => {
    const d = parseDateKey(f.dateStr);
    const label = i === 0 ? '明天' : i === 1 ? '后天' : `周${WEEKDAYS_FORECAST[d.getDay()]}`;
    if (f.periods) {
      const periodStr = PERIOD_ORDER.map(p => `${PERIOD_LABELS[p]}${f.periods![p]}`).join('/');
      return `${label}：${periodStr}`;
    }
    return `${label}：${f.type}`;
  });

  return `【未来天气】${parts.join('，')}`;
}

// ============================================================
// 辅助函数
// ============================================================

/** 是否为"恶劣天气"（雨天/雪天/雷暴）——角色特化覆盖用 */
export function isBadWeather(weather: Weather): boolean {
  return ['小雨', '大雨', '雪', '雷暴'].includes(weather.type);
}

/** 是否为雨天（小雨/大雨） */
export function isRainyWeather(weather: Weather): boolean {
  return weather.type === '小雨' || weather.type === '大雨';
}
