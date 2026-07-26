/**
 * 角色日程表数据 + 空闲地点池系统
 *
 * 三层位置系统：
 * 1. 核心日程 (ScheduleEntry[]) —— 精确时间段的固定活动（上课/打工/午餐等）
 * 2. 空闲地点池 (FreeSpot[]) —— 日程覆盖不到的时间段，从池中按权重随机选择
 * 3. 日期覆盖 (DateOverride[]) —— 节日/考试/假期等特殊日期覆盖前两层
 *
 * 查询优先级：正文覆盖 > 节日模式 > 核心日程 > 空闲地点池 > defaultLocation
 */

import { getWeather, isRainyWeather, isBadWeather, type Weather } from './weather';

export type ScheduleEntry = {
  startMin: number;    // 开始时间（分钟）
  endMin: number;      // 结束时间（分钟）
  weekdays: number[];  // 0=周日 1=周一 ... 6=周六
  location: string;    // 地点名（匹配地图内部位置名）
  activity: string;    // 活动描述
  isFree?: boolean;    // true=空闲（不显示在地图固定位置）
  overnight?: boolean; // true=跨天时段
  /** 父地点名，用于区分不同父地点下的同名子位置（如"主卧"、"客厅"） */
  parentLocation?: string;
};

/** 小时范围 [startHour, endHour]，如 [14, 19] = 14:00-19:00 */
export type HourRange = [number, number];

/** 空闲地点池条目 */
export type FreeSpot = {
  location: string;
  parentLocation?: string;
  activities: string[];      // 活动描述池，随机选一个
  weight: number;            // 权重（相对概率）
  hourRanges: HourRange[];   // 该地点可用的时间范围
};

/** 日期覆盖 */
export type DateOverride = {
  match: {
    month?: number;
    day?: number;
    /** [startMonth, startDay, endMonth, endDay] */
    range?: [number, number, number, number];
  };
  /** 节日模式：角色固定在特殊地点，不参与随机 */
  festivalSpot?: {
    location: string;
    parentLocation?: string;
    activity: string;
  };
  /** 额外临时地点 */
  extraSpots?: FreeSpot[];
  /** 对特定地点权重乘数（key=地点名） */
  weightMultipliers?: Record<string, number>;
};

export type CharacterSchedule = {
  character: string;
  entries: ScheduleEntry[];
  defaultLocation?: string; // 空闲时的默认位置（无则随机）
  /** defaultLocation 的父地点名，同样用于区分同名子位置 */
  defaultParentLocation?: string;
  /** 全年通用：为 true 时不受学期限制，假期也按日程表执行 */
  yearRound?: boolean;
  /** 空闲地点池 */
  freeSpots?: FreeSpot[];
  /** 日期覆盖（节日/考试/假期等） */
  dateOverrides?: DateOverride[];
  /** 天气覆盖（恶劣天气下特定角色的固定行为，优先于核心日程） */
  weatherOverrides?: WeatherOverride[];
};

// ============================================================
// 辅助：将 "HH:MM" 转为分钟数
// ============================================================
function t(h: number, m: number): number {
  return h * 60 + m;
}

// 常用星期组
const MON_FRI = [1, 2, 3, 4, 5];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

// ============================================================
// 学期框架
// ============================================================
export type SemesterType = 'autumn' | 'winterBreak' | 'spring' | 'summerBreak';

/**
 * 获取当前学期类型（精确版）
 * - 秋季学期：9月初至1月中旬
 * - 寒假：1月中旬至2月下旬
 * - 春季学期：2月下旬至6月底
 * - 暑假：7月初至8月底
 */
export function getSemesterType2(date: Date): SemesterType {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month >= 9) || (month === 1 && day <= 15)) return 'autumn';
  if ((month === 1 && day > 15) || (month === 2 && day <= 20)) return 'winterBreak';
  if ((month === 2 && day > 20) || (month >= 3 && month <= 6)) return 'spring';
  return 'summerBreak';
}

// ============================================================
// 种子随机（同一天同一小时内结果稳定，不同天不同）
// ============================================================

/** 字符串+日期哈希 → 种子 */
function hashSeed(str: string, date: Date): number {
  // 种子按 2 小时分桶（0-1点同种子，2-3点同种子……），减少空闲时段每整点跳变
  const dateStr = `${date.getMonth() + 1}-${date.getDate()}-${Math.floor(date.getHours() / 2) * 2}`;
  const fullStr = `${str}-${dateStr}`;
  let hash = 0;
  for (let i = 0; i < fullStr.length; i++) {
    hash = ((hash << 5) - hash) + fullStr.charCodeAt(i);
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
// 日期覆盖匹配
// ============================================================

/** 匹配当前日期的 DateOverride */
function matchDateOverride(overrides: DateOverride[] | undefined, date: Date): DateOverride | undefined {
  if (!overrides || overrides.length === 0) return undefined;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const override of overrides) {
    const m = override.match;
    // 精确日期匹配
    if (m.month === month && m.day === day) return override;
    // 范围匹配
    if (m.range) {
      const [sm, sd, em, ed] = m.range;
      // 不跨年：如 [10, 1, 10, 7]
      if (sm <= em &&
          (month > sm || (month === sm && day >= sd)) &&
          (month < em || (month === em && day <= ed))) {
        return override;
      }
      // 跨年：如 [12, 24, 1, 1]
      if (sm > em &&
          ((month > sm || (month === sm && day >= sd)) ||
            (month < em || (month === em && day <= ed)))) {
        return override;
      }
    }
  }
  return undefined;
}

// ============================================================
// 空闲地点池选择
// ============================================================

/** 判断是否为学校地点（用于假期降权） */
function isSchoolLocation(location: string): boolean {
  const schoolKeywords = ['图书馆', '食堂', '教室', '自习室', '操场', '银杏', '校门口', '宿舍', '人工湖', '环湖', '画室', '排练', '练功', '琴房', '艺术楼', '教学区', '宿管'];
  return schoolKeywords.some(k => location.includes(k));
}

/**
 * 室外地点集合（用于雨天降权、天气视觉叠层）
 *
 * 使用显式集合而非关键词匹配，避免"鬼屋""过山车区"等无共性关键词的地点被漏判。
 * 新增地点时请同步更新此集合。
 */
const OUTDOOR_LOCATIONS = new Set<string>([
  // 燕大校区 — 校园露天场所
  '宿舍楼大门',
  '400米跑道',
  '内圈足球场',
  '操场看台',
  '银杏树下步道',
  // 沈家别墅 — 露天院落
  '前院',
  '后院',
  // 南门小吃街 — 露天摊位
  '流动小吃摊位区',
  '步玲燕算命摊位',
  // 大学城公园 — 露天公园
  '人工湖岸',
  '环湖步道',
  // 云顶商场 — 楼顶露台
  '顶楼露台',
  // 星河乐园 — 游乐设施区域（露天）
  '过山车区',
  '鬼屋',
  '摩天轮区',
  '游客休息区',
  // 姜朝渔住所 — 落地窗外区域
  '落地窗前区域',
  // 裴今歌住所 — 阳台（半室外，暴露于天气）
  '二楼阳台',
  // 周念安母亲菜摊 — 露天菜摊
  '周念安母亲菜摊',
  // 许不倦公寓 — 小区入口（露天）
  '小区门禁入口',
]);

/** 判断是否为室外地点（用于雨天降权、天气视觉叠层） */
export function isOutdoorLocation(location: string): boolean {
  return OUTDOOR_LOCATIONS.has(location);
}

/**
 * 从空闲地点池中按权重随机选择一个地点
 * 使用日期+角色名+小时作为种子，保证同一小时内结果稳定
 */
function selectFreeSpot(
  character: string,
  schedule: CharacterSchedule,
  date: Date,
  dateOverride?: DateOverride,
  weather?: Weather,
): CharacterLocation | null {
  const spots = schedule.freeSpots;
  if (!spots || spots.length === 0) return null;

  const nowHour = date.getHours() + date.getMinutes() / 60;

  // 1. 筛选当前时间可用的地点
  let available = spots.filter(spot =>
    spot.hourRanges.some(([start, end]) => nowHour >= start && nowHour < end)
  );

  // 2. 添加日期覆盖的额外地点
  if (dateOverride?.extraSpots) {
    const extra = dateOverride.extraSpots.filter(spot =>
      spot.hourRanges.some(([start, end]) => nowHour >= start && nowHour < end)
    );
    available = [...available, ...extra];
  }

  if (available.length === 0) return null;

  // 3. 应用学期降权（假期学校地点权重降低）
  const semester = getSemesterType2(date);
  if (semester === 'winterBreak' || semester === 'summerBreak') {
    available = available.map(spot => ({
      ...spot,
      weight: isSchoolLocation(spot.location) ? spot.weight * 0.2 : spot.weight,
    }));
  }

  // 3.5 应用天气降权（恶劣天气室外地点权重降低）
  if (weather && weather.outdoorMultiplier < 1) {
    available = available.map(spot => ({
      ...spot,
      weight: isOutdoorLocation(spot.location)
        ? spot.weight * weather.outdoorMultiplier
        : spot.weight,
    }));
    console.info(`[Weather] ${character} 天气=${weather.type}，室外地点降权 ×${weather.outdoorMultiplier}`);
  }

  // 4. 应用日期覆盖的权重乘数
  if (dateOverride?.weightMultipliers) {
    available = available.map(spot => {
      const mult = dateOverride.weightMultipliers![spot.location]
        ?? dateOverride.weightMultipliers![spot.parentLocation ?? '']
        ?? 1;
      return { ...spot, weight: spot.weight * mult };
    });
  }

  // 5. 种子随机选择
  const seed = hashSeed(character, date);
  const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) return null;

  let random = seededRandom(seed) * totalWeight;
  let selected = available[available.length - 1];
  for (const spot of available) {
    random -= spot.weight;
    if (random <= 0) {
      selected = spot;
      break;
    }
  }

  // 6. 随机选择活动描述
  const activitySeed = hashSeed(`${character}-act`, date);
  const activityIdx = Math.floor(seededRandom(activitySeed) * selected.activities.length);
  const activity = selected.activities[Math.min(activityIdx, selected.activities.length - 1)];

  console.info(`[FreeSpot] ${character} → ${selected.location} · ${activity}（种子=${seed}）`);
  return {
    character,
    location: selected.location,
    parentLocation: selected.parentLocation,
    activity,
    isFree: false,
  };
}

// ============================================================
// 角色日程数据
// ============================================================
export const CHARACTER_SCHEDULES: Record<string, CharacterSchedule> = {
  // ── 沈千金（空闲地点池系统）──
  沈千金: {
    character: "沈千金",
    entries: [
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [1, 3, 5], location: "B102教室", activity: "金融学原理" },
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [2, 3], location: "A204教室", activity: "微观经济学" },
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: [2, 4], location: "图书馆三楼经管法学区", activity: "自习" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "一楼客厅", activity: "午餐" },
      // 深夜固定睡觉（核心日程，不参与随机）
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "二楼千金卧室", activity: "睡觉", parentLocation: "沈家别墅" },
    ],
    defaultLocation: "二楼千金卧室",
    freeSpots: [
      // ── S级（常去）──
      { location: "二楼千金卧室", parentLocation: "沈家别墅", activities: ["和胖达聊天", "浏览并夕夕", "研究赚钱方法", "刷搜索记录", "整理三类名单"], weight: 22, hourRanges: [[6, 8], [18, 24]] },
      { location: "图书馆三楼经管法学区", activities: ["研究商战案例", "查阅金融文献", "制定还债计划"], weight: 18, hourRanges: [[8, 11], [13, 17]] },
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶观察客人", "社交观察", "思考人脉布局"], weight: 16, hourRanges: [[14, 19]] },
      // ── A级（较常出现）──
      { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["看书", "规划还债策略", "发呆"], weight: 12, hourRanges: [[6, 22]] },
      { location: "一楼开放式厨房", parentLocation: "沈家别墅", activities: ["做简单料理", "做甜点解压"], weight: 10, hourRanges: [[6, 8], [11, 13], [17, 19]] },
      { location: "银杏树下步道", activities: ["散步思考", "独处"], weight: 10, hourRanges: [[6, 8], [14, 19]] },
      { location: "校门口便利店", activities: ["挑零食", "买精致小玩意"], weight: 10, hourRanges: [[8, 17]] },
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["精打细算觅食", "一个人吃饭"], weight: 10, hourRanges: [[17, 22]] },
      { location: "服装区", parentLocation: "云顶商场", activities: ["橱窗购物", "看二手高定解馋"], weight: 10, hourRanges: [[14, 19]] },
      { location: "三楼原书房", parentLocation: "沈家别墅", activities: ["查阅资料", "整理名单", "研究商战"], weight: 8, hourRanges: [[8, 20]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      { location: "图书馆二楼文史哲区", activities: ["看杂书解压"], weight: 6, hourRanges: [[8, 17]] },
      { location: "图书馆四楼自习区", activities: ["自习"], weight: 6, hourRanges: [[8, 17]] },
      { location: "食堂二楼", activities: ["吃饭"], weight: 6, hourRanges: [[11, 14]] },
      { location: "食堂三楼", activities: ["吃饭"], weight: 5, hourRanges: [[11, 14]] },
      { location: "食堂一楼", activities: ["吃饭"], weight: 5, hourRanges: [[11, 14]] },
      { location: "前院", parentLocation: "沈家别墅", activities: ["散步", "晒太阳"], weight: 5, hourRanges: [[6, 8], [17, 19]] },
      { location: "后院", parentLocation: "沈家别墅", activities: ["独处思考"], weight: 4, hourRanges: [[6, 8], [17, 22]] },
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡看书"], weight: 5, hourRanges: [[8, 17]] },
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["看风景透气"], weight: 4, hourRanges: [[14, 19]] },
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人喝小酒"], weight: 4, hourRanges: [[18, 22]] },
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看电影解压"], weight: 4, hourRanges: [[14, 20]] },
      { location: "操场看台", activities: ["观察人群"], weight: 4, hourRanges: [[14, 18]] },
      { location: "C204自习室", activities: ["自习"], weight: 4, hourRanges: [[8, 17]] },
      { location: "人工湖岸", activities: ["散步"], weight: 3, hourRanges: [[6, 8], [17, 19]] },
      { location: "环湖步道", activities: ["散步"], weight: 3, hourRanges: [[6, 8], [17, 19]] },
      { location: "二楼共用浴室", parentLocation: "沈家别墅", activities: ["泡澡放松"], weight: 3, hourRanges: [[21, 24]] },
      { location: "一楼玄关", parentLocation: "沈家别墅", activities: ["换鞋出门", "回家"], weight: 2, hourRanges: [[6, 22]] },
      { location: "三楼储物间", parentLocation: "沈家别墅", activities: ["整理旧物"], weight: 2, hourRanges: [[8, 17]] },
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["看桌游社交"], weight: 3, hourRanges: [[14, 19]] },
      { location: "溜冰场", parentLocation: "云顶商场", activities: ["看别人滑冰"], weight: 2, hourRanges: [[14, 19]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：制定接单排期
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "三楼原书房", parentLocation: "沈家别墅", activities: ["制定连休期接单排期", "规划还款计划"], weight: 25, hourRanges: [[8, 20]] },
      ]},
      // 双十一 11/11：收大量快递
      { match: { month: 11, day: 11 }, weightMultipliers: { "一楼玄关": 30, "服装区": 1.5 } },
      // 期中考试周 11月中旬
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "图书馆三楼经管法学区": 1.5, "C204自习室": 1, "图书馆四楼自习区": 1 } },
      // 运动会 10月下旬-11月初：担任啦啦队
      { match: { range: [10, 20, 11, 5] }, extraSpots: [
        { location: "操场看台", activities: ["啦啦队助威", "观察比赛"], weight: 25, hourRanges: [[8, 17]] },
      ]},
      // 平安夜/圣诞节 12/24-25：节日模式，在家等邀约
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "一楼客厅", parentLocation: "沈家别墅", activity: "在家过节" } },
      // 跨年夜 12/31：节日模式
      { match: { month: 12, day: 31 }, festivalSpot: { location: "一楼客厅", parentLocation: "沈家别墅", activity: "跨年守夜" } },
      // 元旦 1/1：放假1天，在家休息
      { match: { month: 1, day: 1 }, festivalSpot: { location: "一楼客厅", parentLocation: "沈家别墅", activity: "元旦休息" } },
      // 期末考试周 1月上旬
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "C204自习室": 2, "图书馆四楼自习区": 2 } },
            // 情人节 2/14：节日模式，在家等邀约（不会一个人外出）
      { match: { month: 2, day: 14 }, festivalSpot: { location: "二楼千金卧室", parentLocation: "沈家别墅", activity: "等待邀约" } },
// 春节：节日模式，与<user>共度
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "一楼客厅", parentLocation: "沈家别墅", activity: "与哥哥共度春节" } },
      // 寒假 1月中旬-2月下旬：在家研究还债计划、接单
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "三楼原书房", parentLocation: "沈家别墅", activities: ["寒假接单", "制定还债计划", "研究商战案例", "整理三类名单"], weight: 25, hourRanges: [[8, 20]] },
      ]},
      // 白色情人节 3/14：节日模式，在家等邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "二楼千金卧室", parentLocation: "沈家别墅", activity: "等待邀约" } },
      // 清明假期 4/4-4/6：放假3天，在家休息
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "三楼原书房": 1.5, "一楼客厅": 1.5 } },
      // 劳动节 5/1-5/5：商圈人流量峰值
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "服装区": 2, "流动小吃摊位区": 1.5, "顶楼露台": 1.5 } },
      // 母亲节 5月第二周：给妈妈打电话（家道中落，母亲不在身边）
      { match: { range: [5, 8, 5, 14] }, weightMultipliers: { "二楼千金卧室": 1.5 } },
      // 期中考试周 5月中旬
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "图书馆三楼经管法学区": 1.5, "C204自习室": 1.5, "图书馆四楼自习区": 1.5 } },
      // 期末考试周 6月中下旬
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "C204自习室": 2, "图书馆四楼自习区": 2 } },
      // 七夕：节日模式，在家等邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "二楼千金卧室", parentLocation: "沈家别墅", activity: "等待邀约" } },
      // 暑假 7月-8月：在家接单还债
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "三楼原书房", parentLocation: "沈家别墅", activities: ["暑假接单", "制定还债计划", "研究商战案例", "整理三类名单"], weight: 25, hourRanges: [[8, 20]] },
      ]},
    ],
  },

  // ── 周念安（空闲地点池系统）──
  // 前女友，法学院大三，贫困家庭出身，在回头草咖啡打工，节俭自强，攒钱"包养"<user>
  // 特殊条件覆盖：雨天 → 休息日（当前日程系统不支持天气判断，需由正文 overrides 覆盖）
  周念安: {
    character: "周念安",
    entries: [
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [1], location: "A101阶梯教室", activity: "上课" },
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [3], location: "A101阶梯教室", activity: "上课" },
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: [2, 4, 5], location: "咖啡吧台", activity: "打工", parentLocation: "回头草咖啡" },
      { startMin: t(16, 30), endMin: t(18, 5), weekdays: [2, 4, 5], location: "咖啡吧台", activity: "打工", parentLocation: "回头草咖啡" },
      { startMin: t(9, 0), endMin: t(18, 5), weekdays: [6], location: "咖啡吧台", activity: "打工", parentLocation: "回头草咖啡" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "食堂二楼", activity: "午餐" },
      // 深夜固定睡觉
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "周念安宿舍", activity: "睡觉" },
    ],
    defaultLocation: "周念安宿舍",
    // 雨天：陆时予给带薪休假，不去咖啡店打工
    weatherOverrides: [
      { condition: 'rainy', spot: { location: '周念安宿舍', activity: '带薪休假（陆时予批的假）' } },
    ],
    freeSpots: [
      // ── S级（常去，体现核心生活轨迹）──
      // 宿舍：学习、做菜、给妈妈打电话、算账攒钱、虚报工资、往嫁妆账户存钱
      { location: "周念安宿舍", activities: ["看法律书", "写论文", "做菜", "给妈妈打电话", "算账攒钱", "记配方表", "虚报工资给妈妈", "往嫁妆账户存钱", "看书", "休息"], weight: 25, hourRanges: [[6, 8], [18, 24]] },
      // 图书馆三楼法学区：法学生核心学习区
      { location: "图书馆三楼经管法学区", activities: ["自习", "查阅法律文献", "写论文", "看法条", "整理笔记", "查阅案例"], weight: 22, hourRanges: [[8, 11], [13, 17]] },
      // 回头草咖啡：打工间隙休息、和陆时予相处
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["休息", "看书", "和陆时予闲聊", "非打工时间喝咖啡", "复习法条"], weight: 18, hourRanges: [[8, 14], [18, 20]] },
      // ── A级（较常出现，体现性格特点）──
      // 图书馆四楼自习区
      { location: "图书馆四楼自习区", activities: ["自习", "写论文", "复习", "整理笔记"], weight: 12, hourRanges: [[8, 17]] },
      // 食堂
      { location: "食堂二楼", activities: ["吃饭", "一个人吃饭", "看书吃饭"], weight: 12, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂一楼", activities: ["吃饭", "觅食"], weight: 10, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂三楼", activities: ["吃饭"], weight: 8, hourRanges: [[11, 14], [17, 19]] },
      // 校门口便利店：买物美价廉的小玩意
      { location: "校门口便利店", activities: ["买物美价廉的小玩意", "买日用品", "买零食", "挑便宜实用的东西"], weight: 12, hourRanges: [[8, 17]] },
      // 银杏步道：散步、独处
      { location: "银杏树下步道", activities: ["散步", "独处", "想事情", "吹风"], weight: 10, hourRanges: [[6, 8], [17, 19]] },
      // 人工湖岸：散步
      { location: "人工湖岸", activities: ["散步", "吹风", "看水面发呆", "独处"], weight: 10, hourRanges: [[6, 8], [17, 21]] },
      // 南门小吃街：觅食，挑便宜的吃
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["觅食", "一个人吃夜宵", "挑便宜的吃"], weight: 8, hourRanges: [[17, 22]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      // 图书馆二楼文史哲区：阅读癖，看杂书、记各种条文和配方表
      { location: "图书馆二楼文史哲区", activities: ["看杂书", "阅读癖发作", "记各种配方表和条文", "翻非法律类的书"], weight: 6, hourRanges: [[8, 17]] },
      // 图书馆一楼借还台
      { location: "图书馆一楼借还台", activities: ["借书还书"], weight: 3, hourRanges: [[8, 17]] },
      // 环湖步道
      { location: "环湖步道", activities: ["散步", "慢走", "独处"], weight: 6, hourRanges: [[6, 8], [17, 21]] },
      // 操场看台
      { location: "操场看台", activities: ["独处", "看星星", "吹风", "想事情"], weight: 4, hourRanges: [[21, 24]] },
      // 咖啡吧台：非打工时间偶尔在
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["帮陆时予整理", "提前到打工地点", "和陆时予闲聊"], weight: 5, hourRanges: [[8, 14], [18, 20]] },
      // 员工换装区
      { location: "员工换装区", parentLocation: "回头草咖啡", activities: ["换工作服", "整理仪容", "休息"], weight: 4, hourRanges: [[8, 14], [18, 20]] },
      // A101阶梯教室：非上课时间偶尔自习
      { location: "A101阶梯教室", activities: ["自习", "复习", "整理笔记"], weight: 3, hourRanges: [[13, 17]] },
      // 鹿角奶茶店：偶尔
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "安静坐着", "看书"], weight: 3, hourRanges: [[14, 19]] },
      // 二十四帧电影院：偶尔看个电影
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看电影", "一个人看电影"], weight: 3, hourRanges: [[14, 20]] },
      // 宿舍楼大门
      { location: "宿舍楼大门", activities: ["经过", "进出门", "等人"], weight: 2, hourRanges: [[6, 23]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：全天在回头草咖啡加班
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["国庆加班", "全天营业", "忙碌", "攒加班费"], weight: 30, hourRanges: [[9, 18]] },
      ]},
      // 双十一 11/11：囤便宜日用品（节俭），给妈妈也买一份
      { match: { month: 11, day: 11 }, weightMultipliers: { "周念安宿舍": 2, "校门口便利店": 1.5 } },
      // 周念安生日 11/18：节日模式
      { match: { month: 11, day: 18 }, festivalSpot: { location: "周念安宿舍", activity: "生日" } },
      // 期中考试周 11月中旬：无考试压力（论文制），在图书馆写论文
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 1.5, "周念安宿舍": 1.5 } },
      // 父亲忌日 4/3：节日模式，独处
      { match: { month: 4, day: 3 }, festivalSpot: { location: "周念安宿舍", activity: "父亲忌日" } },
      // 清明假期 4/4-4/6：回老家给父亲扫墓
      { match: { range: [4, 4, 4, 6] }, extraSpots: [
        { location: "周念安母亲菜摊", parentLocation: "周念安母亲菜摊", activities: ["回老家", "陪妈妈去扫墓", "帮妈妈看摊子", "给父亲上坟"], weight: 25, hourRanges: [[6, 18]] },
      ]},
      // 分手日 5/4：节日模式，独处
      { match: { month: 5, day: 4 }, festivalSpot: { location: "周念安宿舍", activity: "独处" } },
      // 交往纪念日 9/26：节日模式
      { match: { month: 9, day: 26 }, festivalSpot: { location: "周念安宿舍", activity: "纪念日" } },
      // 平安夜/圣诞节 12/24-25：在咖啡店打工
      { match: { range: [12, 24, 12, 25] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["圣诞营业", "做节日特调", "忙碌"], weight: 25, hourRanges: [[9, 18]] },
      ]},
      // 跨年夜 12/31：打工
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["跨年营业", "做节日特调", "忙碌"], weight: 25, hourRanges: [[9, 18]] },
      ]},
      // 元旦 1/1：放假1天，休息
      { match: { month: 1, day: 1 }, festivalSpot: { location: "周念安宿舍", activity: "元旦休息" } },
      // 期末考试周 1月上旬：提交论文阶段稿
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 2, "周念安宿舍": 1.5 } },
            // 情人节 2/14：节日模式，等待邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "周念安宿舍", activity: "等待邀约" } },
// 春节 2/8-2/14：回老家和妈妈过年（寒假范围内但特别标注）
      { match: { range: [2, 8, 2, 14] }, extraSpots: [
        { location: "周念安母亲菜摊", parentLocation: "周念安母亲菜摊", activities: ["陪妈妈过年", "贴春联", "吃年夜饭", "给妈妈帮忙", "看春晚"], weight: 30, hourRanges: [[6, 24]] },
      ]},
      // 寒假 1月中旬-2月下旬：离校，回母亲菜摊帮忙
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "周念安母亲菜摊", parentLocation: "周念安母亲菜摊", activities: ["帮妈妈看摊子", "卖菜", "和砍价的大爷大妈锻炼口才", "陪妈妈", "写作业"], weight: 25, hourRanges: [[6, 18]] },
      ]},
      // 白色情人节 3/14：节日模式，等待邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "周念安宿舍", activity: "等待邀约" } },
      // 劳动节 5/1-5/5：打工
      { match: { range: [5, 1, 5, 5] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["劳动节加班", "全天营业", "攒加班费"], weight: 25, hourRanges: [[9, 18]] },
      ]},
      // 母亲节 5月第二周：给妈妈打长途电话，买便宜但用心的礼物寄回去
      { match: { range: [5, 8, 5, 14] }, extraSpots: [
        { location: "周念安宿舍", activities: ["给妈妈打母亲节电话", "挑便宜但用心的礼物", "给妈妈寄包裹", "虚报工资让妈妈放心", "写贺卡"], weight: 25, hourRanges: [[6, 9], [18, 24]] },
        { location: "校门口便利店", activities: ["给妈妈挑母亲节礼物", "买便宜实用的东西", "买贺卡"], weight: 15, hourRanges: [[8, 17]] },
      ]},
      // 陆时予生日 5/18：赠送小礼物
      { match: { month: 5, day: 18 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["给陆时予送生日礼物", "帮忙准备生日"], weight: 20, hourRanges: [[9, 18]] },
      ]},
      // 期中考试周 5月中旬
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 1.5 } },
      // 期末考试周 6月中下旬
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 2, "周念安宿舍": 1.5 } },
      // 回头草开业日 8/8：全场饮品八折，忙碌
      { match: { month: 8, day: 8 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["开业日八折促销", "忙碌", "全天营业"], weight: 30, hourRanges: [[9, 18]] },
      ]},
      // 七夕：节日模式，等待邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "周念安宿舍", activity: "等待邀约" } },
      // 暑假 7月-8月：留校打工
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["暑假打工", "全天营业", "攒钱", "攒加班费"], weight: 25, hourRanges: [[9, 18]] },
        { location: "周念安宿舍", activities: ["给妈妈打电话", "算账攒钱", "往嫁妆账户存钱", "看法律书", "做菜", "写论文"], weight: 20, hourRanges: [[6, 9], [18, 24]] },
      ]},
    ],
  },

  // ── 温知晚（空闲地点池系统）──
  温知晚: {
    character: "温知晚",
    entries: [
      { startMin: t(6, 30), endMin: t(8, 30), weekdays: EVERY_DAY, location: "艺术楼练功房", activity: "晨功" },
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [2, 4], location: "艺术楼四楼理论教室", activity: "舞蹈理论" },
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [1, 3], location: "艺术楼四楼理论教室", activity: "舞蹈理论" },
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: [1, 3], location: "艺术楼二楼排练厅", activity: "排练" },
      { startMin: t(16, 30), endMin: t(18, 5), weekdays: EVERY_DAY, location: "艺术楼练功房", activity: "练功" },
      { startMin: t(19, 30), endMin: t(21, 30), weekdays: EVERY_DAY, location: "艺术楼练功房", activity: "晚功" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "食堂三楼", activity: "午餐" },
      // 深夜固定睡觉
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "温知晚宿舍", activity: "睡觉" },
    ],
    defaultLocation: "温知晚宿舍",
    freeSpots: [
      // ── S级（常去）──
      { location: "温知晚宿舍", activities: ["看宋词选读", "休息", "洗头护理长发", "发呆", "刷手机"], weight: 20, hourRanges: [[6, 8], [22, 24]] },
      { location: "艺术楼练功房", activities: ["加练水袖", "独自练习", "拉伸", "复习动作"], weight: 18, hourRanges: [[8, 11], [13, 17], [18, 22]] },
      { location: "银杏树下步道", activities: ["深夜散步", "享受路灯", "独处安心"], weight: 16, hourRanges: [[0, 2], [21, 24]] },
      // ── A级（较常出现）──
      { location: "食堂三楼", activities: ["吃饭", "喝茶"], weight: 12, hourRanges: [[11, 14], [17, 19]] },
      { location: "艺术楼二楼排练厅", activities: ["自主排练", "练习水袖", "对着镜子练表情"], weight: 10, hourRanges: [[13, 17]] },
      { location: "人工湖岸", activities: ["散步", "看水面发呆", "吹风"], weight: 10, hourRanges: [[5, 8], [18, 21]] },
      { location: "图书馆二楼文史哲区", activities: ["看书", "翻宋词集", "偷偷看小说"], weight: 8, hourRanges: [[8, 17]] },
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡看书", "安静坐着", "给路人泡茶"], weight: 8, hourRanges: [[8, 17]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      { location: "环湖步道", activities: ["散步", "慢走"], weight: 6, hourRanges: [[5, 8], [18, 21]] },
      { location: "艺术楼琴房", activities: ["听琴声放松", "坐在旁边休息"], weight: 5, hourRanges: [[13, 17]] },
      { location: "校门口便利店", activities: ["买零食", "买发绳"], weight: 5, hourRanges: [[8, 17]] },
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶看书", "安静坐着"], weight: 5, hourRanges: [[14, 19]] },
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看老电影", "看文艺片"], weight: 4, hourRanges: [[14, 20]] },
      { location: "食堂二楼", activities: ["吃饭"], weight: 5, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂一楼", activities: ["吃饭"], weight: 4, hourRanges: [[11, 14], [17, 19]] },
      { location: "艺术楼一楼大厅", activities: ["坐着休息", "等上课", "发呆"], weight: 4, hourRanges: [[8, 21]] },
      { location: "操场看台", activities: ["看星星", "吹风", "发呆"], weight: 3, hourRanges: [[21, 24]] },
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["吃东西", "买夜宵"], weight: 4, hourRanges: [[17, 22]] },
      { location: "图书馆四楼自习区", activities: ["自习", "看书"], weight: 3, hourRanges: [[8, 17]] },
      { location: "宿舍楼大门", activities: ["经过", "等人"], weight: 2, hourRanges: [[6, 23]] },
      { location: "艺术楼四楼理论教室", activities: ["自习", "复习理论"], weight: 3, hourRanges: [[13, 17]] },
      { location: "图书馆一楼借还台", activities: ["借书还书"], weight: 2, hourRanges: [[8, 17]] },
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇旁观", "看看热闹"], weight: 2, hourRanges: [[14, 19]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：回家或留校集训
      { match: { range: [10, 1, 10, 7] }, weightMultipliers: { "艺术楼练功房": 1.5, "艺术楼二楼排练厅": 1.5, "温知晚宿舍": 1.5 } },
      // 运动会 10月下旬-11月初：参与舞蹈表演
      { match: { range: [10, 20, 11, 5] }, extraSpots: [
        { location: "操场看台", activities: ["准备舞蹈表演", "候场", "热身"], weight: 20, hourRanges: [[8, 17]] },
      ]},
      // 双十一 11/11：网购练功服、宋词集
      { match: { month: 11, day: 11 }, weightMultipliers: { "温知晚宿舍": 1.5 } },
      // 期中考试周 11月中旬：舞蹈系考试以汇演形式
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "艺术楼练功房": 2, "艺术楼二楼排练厅": 2 } },
      // 平安夜/圣诞节 12/24-25：节日模式
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "温知晚宿舍", activity: "在家过节" } },
      // 跨年夜 12/31：深夜在银杏步道
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "银杏树下步道", activities: ["跨年散步", "看路灯", "许愿"], weight: 20, hourRanges: [[20, 24]] },
      ]},
      // 校园文艺汇演 12月：艺术楼使用率增加
      { match: { range: [12, 1, 12, 31] }, weightMultipliers: { "艺术楼练功房": 1.5, "艺术楼二楼排练厅": 1.5 } },
      // 元旦 1/1：放假1天，休息
      { match: { month: 1, day: 1 }, festivalSpot: { location: "温知晚宿舍", activity: "元旦休息" } },
      // 期末考试周 1月上旬：期末汇演
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "艺术楼练功房": 2, "艺术楼二楼排练厅": 2, "温知晚宿舍": 1.5 } },
            // 情人节 2/14：节日模式，在宿舍等邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "温知晚宿舍", activity: "等待邀约" } },
// 春节 2/8-2/14：在家过年（寒假范围内但特别标注）
      { match: { range: [2, 8, 2, 14] }, extraSpots: [
        { location: "传统茶室", parentLocation: "温知晚家", activities: ["陪父母过年", "吃年夜饭", "看春晚", "帮母亲做事", "泡茶待客"], weight: 25, hourRanges: [[8, 24]] },
      ]},
      // 寒假 1/16-2/20：回家（省外地点池）
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "传统茶室", parentLocation: "温知晚家", activities: ["泡茶", "看书", "帮母亲做事", "陪父亲练字"], weight: 20, hourRanges: [[8, 20]] },
        { location: "温知晚卧室", parentLocation: "温知晚家", activities: ["看宋词选读", "休息", "想事情", "想念<user>"], weight: 18, hourRanges: [[0, 8], [18, 24]] },
      ]},
      // 白色情人节 3/14：节日模式，等待邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "温知晚宿舍", activity: "等待邀约" } },
      // 温知晚生日 3/12：节日模式
      { match: { month: 3, day: 12 }, festivalSpot: { location: "温知晚宿舍", activity: "生日" } },
      // 清明假期 4/4-4/6：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "温知晚宿舍": 1.5, "银杏树下步道": 1.5 } },
      // 劳动节 5/1-5/5：放假
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "人工湖岸": 1.5, "银杏树下步道": 1.5, "温知晚宿舍": 1.5 } },
      // 母亲节 5月第二周：在宿舍给妈妈打电话
      { match: { range: [5, 8, 5, 14] }, weightMultipliers: { "温知晚宿舍": 1.5 } },
      // 期中考试周 5月中旬
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "艺术楼练功房": 2, "艺术楼二楼排练厅": 2 } },
      // 校园文艺汇演 5月
      { match: { range: [5, 1, 5, 31] }, weightMultipliers: { "艺术楼练功房": 1.5, "艺术楼二楼排练厅": 1.5 } },
      // 期末考试周 6月中下旬：期末汇演
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "艺术楼练功房": 2, "艺术楼二楼排练厅": 2, "温知晚宿舍": 1.5 } },
      // 七夕：节日模式，等待邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "温知晚宿舍", activity: "等待邀约" } },
      // 暑假 7-8月：留校集训
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "艺术楼练功房", activities: ["暑期集训", "加练", "独占练功房"], weight: 20, hourRanges: [[6, 8], [14, 18], [19, 22]] },
      ]},
    ],
  },

  // ── 罗兰（空闲地点池系统）──
  // 法国交换生，HEMA兵击选手，霍千黎名义未婚夫，<user>青梅竹马
  // 特殊条件覆盖：雨天 → 旧伤隐痛，减少室外活动（当前日程系统不支持天气判断，需由正文 overrides 覆盖）
  罗兰: {
    character: "罗兰",
    entries: [
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [1, 4], location: "A204教室", activity: "上课" },
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [3, 5], location: "A302教室", activity: "上课" },
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: [2, 4], location: "防滑垫训练区", activity: "训练", parentLocation: "铁砧兵击俱乐部" },
      { startMin: t(16, 30), endMin: t(18, 5), weekdays: [2, 4], location: "防滑垫训练区", activity: "训练", parentLocation: "铁砧兵击俱乐部" },
      { startMin: t(9, 0), endMin: t(18, 5), weekdays: [6], location: "防滑垫训练区", activity: "训练", parentLocation: "铁砧兵击俱乐部" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "食堂一楼", activity: "午餐" },
      // 深夜固定睡觉
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "罗兰卧室", activity: "睡觉", parentLocation: "霍罗同居公寓" },
    ],
    defaultLocation: "罗兰卧室",
    defaultParentLocation: "霍罗同居公寓",
    // 恶劣天气：旧伤隐痛，减少室外活动
    weatherOverrides: [
      { condition: 'badWeather', spot: { location: '罗兰卧室', parentLocation: '霍罗同居公寓', activity: '旧伤隐痛，卧床休息' } },
    ],
    freeSpots: [
      // ── S级（常去，体现核心生活轨迹）──
      // 铁砧兵击俱乐部：HEMA核心训练场，擦拭杜兰达尔三世、擦拭奖牌
      { location: "防滑垫训练区", parentLocation: "铁砧兵击俱乐部", activities: ["自主训练", "练习步法", "对着沙袋练", "擦拭杜兰达尔三世", "练习盾击"], weight: 25, hourRanges: [[9, 18], [19, 22]] },
      // 罗兰卧室：擦奖牌、看《堂吉诃德》、闻旧皮革味道、打呼噜说梦话
      { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activities: ["擦拭奖牌奖杯", "看《堂吉诃德》", "闻旧皮革味道", "保养杜兰达尔三世", "练习普通话", "打呼噜说梦话", "休息", "刷手机"], weight: 22, hourRanges: [[6, 9], [18, 24]] },
      // 沈家别墅·一楼客厅：经常来沈家玩，和千金千黎相处
      { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["串门玩", "和千金聊天", "和千黎玩", "看电视", "蹭饭", "回忆小时候"], weight: 20, hourRanges: [[10, 22]] },
      // ── A级（较常出现，体现性格特点）──
      // 霍罗同居公寓·客厅：和千黎相处、吃东西
      { location: "客厅", parentLocation: "霍罗同居公寓", activities: ["和千黎聊天", "看电视", "吃东西", "休息", "用法语碎碎念"], weight: 15, hourRanges: [[6, 9], [18, 24]] },
      // 霍罗同居公寓·开放式厨房：做高热量料理、法式料理
      { location: "开放式厨房", parentLocation: "霍罗同居公寓", activities: ["做法式料理", "做高热量料理", "煎牛排", "研究中国菜谱", "和千黎一起做饭"], weight: 12, hourRanges: [[7, 9], [17, 20]] },
      // 食堂：高热量食物
      { location: "食堂一楼", activities: ["吃饭", "吃高热量食物", "和同学聊天", "大口吃肉"], weight: 12, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂二楼", activities: ["吃饭", "觅食"], weight: 10, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂三楼", activities: ["吃饭"], weight: 8, hourRanges: [[11, 14], [17, 19]] },
      // 南门小吃街：看别人摊煎饼！高热量食物
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["看别人摊煎饼", "吃高热量小吃", "买煎饼果子", "看修驴蹄一样的解压感", "觅食"], weight: 15, hourRanges: [[17, 22]] },
      // 铁砧兵击俱乐部·器材室
      { location: "器材室", parentLocation: "铁砧兵击俱乐部", activities: ["整理器材", "保养装备", "挑选训练用具", "闻旧皮革味道"], weight: 10, hourRanges: [[9, 22]] },
      // 铁砧兵击俱乐部·休息区
      { location: "休息区", parentLocation: "铁砧兵击俱乐部", activities: ["休息", "喝水", "和俱乐部的人聊天", "看训练视频"], weight: 8, hourRanges: [[9, 22]] },
      // 银杏步道：喜欢暖风吹着的晴天
      { location: "银杏树下步道", activities: ["散步", "享受晴天", "吹风", "想事情", "哼法文歌"], weight: 10, hourRanges: [[6, 8], [17, 19]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      // 人工湖岸、环湖步道：散步
      { location: "人工湖岸", activities: ["散步", "吹风", "看水面发呆"], weight: 6, hourRanges: [[6, 8], [17, 21]] },
      { location: "环湖步道", activities: ["散步", "慢跑", "吹风"], weight: 6, hourRanges: [[6, 8], [17, 21]] },
      // 云顶商场·美食广场：高热量食物
      { location: "美食广场", parentLocation: "云顶商场", activities: ["吃高热量食物", "觅食", "吃烤肉"], weight: 6, hourRanges: [[11, 14], [17, 20]] },
      // 沈家别墅其他位置
      { location: "前院", parentLocation: "沈家别墅", activities: ["散步", "晒太阳", "和千金玩"], weight: 6, hourRanges: [[6, 8], [17, 19]] },
      { location: "后院", parentLocation: "沈家别墅", activities: ["独处", "吹风", "想事情"], weight: 4, hourRanges: [[6, 8], [17, 22]] },
      { location: "二楼千金卧室", parentLocation: "沈家别墅", activities: ["找千金聊天", "串门", "和千金玩"], weight: 5, hourRanges: [[10, 22]] },
      // 二十四帧电影院：偶尔看电影
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看电影", "看动作片", "看历史片"], weight: 4, hourRanges: [[14, 20]] },
      // 回头草咖啡：偶尔去喝咖啡
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡", "看书", "休息"], weight: 4, hourRanges: [[8, 17]] },
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["点咖啡", "和周念安闲聊", "站着喝"], weight: 3, hourRanges: [[10, 20]] },
      // 操场
      { location: "操场看台", activities: ["吹风", "看星星", "想事情"], weight: 3, hourRanges: [[21, 24]] },
      { location: "400米跑道", activities: ["跑步", "热身", "训练体能"], weight: 4, hourRanges: [[6, 8], [17, 19]] },
      // 图书馆
      { location: "图书馆二楼文史哲区", activities: ["看《堂吉诃德》", "看历史书", "看杂书"], weight: 4, hourRanges: [[8, 17]] },
      // 霍千黎卧室：偶尔去找千黎
      { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activities: ["找千黎聊天", "被千黎赶出来", "和千黎玩"], weight: 4, hourRanges: [[18, 24]] },
      // 落日居酒屋：偶尔吃东西
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["吃东西", "喝小酒", "发呆"], weight: 3, hourRanges: [[18, 22]] },
      // 桌游店：偶尔好奇
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇看看", "看别人玩桌游"], weight: 2, hourRanges: [[14, 19]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：全天在兵击俱乐部训练
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "防滑垫训练区", parentLocation: "铁砧兵击俱乐部", activities: ["国庆集训", "全天训练", "加练"], weight: 30, hourRanges: [[9, 18]] },
      ]},
      // 双十一 11/11：网购高热量零食
      { match: { month: 11, day: 11 }, weightMultipliers: { "罗兰卧室": 1.5, "霍罗同居公寓": 1.5 } },
      // 期中考试周 11月中旬
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "防滑垫训练区": 0.5, "图书馆二楼文史哲区": 2, "罗兰卧室": 1.5 } },
      // 平安夜/圣诞节 12/24-25：与霍千黎在公寓准备法式大餐
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "开放式厨房", parentLocation: "霍罗同居公寓", activity: "和千黎准备法式大餐" } },
      // 跨年夜 12/31
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["和千金千黎跨年", "看电视", "热闹"], weight: 25, hourRanges: [[18, 24]] },
      ]},
      // 元旦 1/1：放假1天
      { match: { month: 1, day: 1 }, weightMultipliers: { "防滑垫训练区": 1.5, "罗兰卧室": 1.5 } },
      // 期末考试周 1月上旬
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "防滑垫训练区": 0.5, "图书馆二楼文史哲区": 2, "罗兰卧室": 1.5 } },
            // 情人节 2/14：节日模式，在宿舍等邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activity: "等待邀约" } },
// 春节 2/8-2/14：好奇中国春节习俗
      { match: { range: [2, 8, 2, 14] }, extraSpots: [
        { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["好奇中国春节习俗", "看春节晚会", "和千金千黎过年", "吃年夜饭", "收红包"], weight: 25, hourRanges: [[10, 24]] },
        { location: "开放式厨房", parentLocation: "霍罗同居公寓", activities: ["试着做中国菜", "研究春节食物", "和千黎做饭"], weight: 15, hourRanges: [[7, 9], [17, 20]] },
      ]},
      // 寒假 1月中旬-2月下旬：留守
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "防滑垫训练区", parentLocation: "铁砧兵击俱乐部", activities: ["寒假集训", "全天训练", "加练", "独占训练区"], weight: 25, hourRanges: [[9, 18]] },
        { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activities: ["擦拭奖牌奖杯", "看《堂吉诃德》", "保养杜兰达尔三世", "练习普通话", "和千黎窝着"], weight: 20, hourRanges: [[6, 9], [18, 24]] },
      ]},
      // 白色情人节 3/14：节日模式，等待邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activity: "等待邀约" } },
      // 清明假期 4/4-4/6：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "防滑垫训练区": 1.5, "罗兰卧室": 1.5 } },
      // 罗兰生日 4/15：节日模式
      { match: { month: 4, day: 15 }, festivalSpot: { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activity: "生日" } },
      // 杜兰达尔三世命名日 8/20：节日模式，擦拭保养宝剑
      { match: { month: 8, day: 20 }, festivalSpot: { location: "防滑垫训练区", parentLocation: "铁砧兵击俱乐部", activity: "杜兰达尔三世命名日，保养宝剑" } },
      // 全法优胜日 6/8：节日模式，擦拭奖牌回忆
      { match: { month: 6, day: 8 }, festivalSpot: { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activity: "全法优胜日，擦拭奖牌" } },
      // 回国日 9/1：节日模式
      { match: { month: 9, day: 1 }, festivalSpot: { location: "防滑垫训练区", parentLocation: "铁砧兵击俱乐部", activity: "回到燕大纪念日" } },
      // 劳动节 5/1-5/5
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "防滑垫训练区": 1.5, "流动小吃摊位区": 1.5 } },
      // 期中考试周 5月中旬
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "防滑垫训练区": 0.5, "图书馆二楼文史哲区": 2, "罗兰卧室": 1.5 } },
      // 期末考试周 6月中下旬
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "防滑垫训练区": 0.5, "图书馆二楼文史哲区": 2, "罗兰卧室": 1.5 } },
      // 七夕：节日模式，等待邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activity: "等待邀约" } },
      // 暑假 7月-8月：留城训练
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "防滑垫训练区", parentLocation: "铁砧兵击俱乐部", activities: ["暑假集训", "全天训练", "加练", "备战比赛"], weight: 30, hourRanges: [[9, 18]] },
        { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activities: ["擦拭奖牌奖杯", "看《堂吉诃德》", "保养杜兰达尔三世", "练习普通话", "和千黎窝着"], weight: 20, hourRanges: [[6, 9], [18, 24]] },
        { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["看别人摊煎饼", "吃高热量小吃", "买煎饼果子"], weight: 15, hourRanges: [[17, 22]] },
      ]},
    ],
  },

  // ── 霍千黎（空闲地点池系统）──
  // 金融大三，富家千金，罗兰名义未婚妻，<user>小学同学
  // 恶役千金外表下藏着纯情与笨拙，昼伏夜出型但逐步适应正常作息
  // 喜欢桌游（万智牌/昆特牌/游戏王/三国杀）、拍照、红茶、深夜广播；怕虫子；运气很差
  霍千黎: {
    character: "霍千黎",
    entries: [
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [2, 5], location: "B206教室", activity: "上课" },
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [4], location: "B305教室", activity: "上课" },
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: [1, 3], location: "B206教室", activity: "上课" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "食堂一楼", activity: "午餐" },
      // 深夜固定睡觉（昼伏夜出型但因罗兰早起而被迫适应，睡眠浅）
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "霍千黎卧室", activity: "睡觉", parentLocation: "霍罗同居公寓" },
    ],
    defaultLocation: "霍千黎卧室",
    defaultParentLocation: "霍罗同居公寓",
    freeSpots: [
      // ── S级（常去，体现核心生活轨迹）──
      // 霍千黎卧室：深夜听广播、翻看<user>糗照、研究转运珠、赖床（不喜欢早起）
      { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activities: ["听深夜广播", "翻看<user>的糗照", "研究转运珠和魔法水晶", "赖床", "刷手机", "整理卡组", "喝红茶发呆", "翻看相册"], weight: 25, hourRanges: [[6, 9], [18, 24]] },
      // 龙与骰子桌游卡牌店·对战桌区：桌游核心场所，打店赛、研究卡组
      { location: "地下二层对战桌区", parentLocation: "龙与骰子桌游卡牌店", activities: ["打万智牌", "打昆特牌", "打游戏王", "打三国杀", "参加店赛", "和别人对战", "研究卡组", "拿店赛冠军"], weight: 22, hourRanges: [[14, 22]] },
      // 龙与骰子桌游卡牌店·展示区：买别人开出来的卡、在集换社收卡（讨厌自己开包出平卡）
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["买别人开出来的卡", "在集换社收卡", "看新卡包", "和店员闲聊", "观摩别人开包", "淘二手卡"], weight: 18, hourRanges: [[14, 22]] },
      // 沈家别墅·一楼客厅：和千金串门玩、拍照
      { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["和千金聊天", "串门玩", "看电视", "蹭饭", "回忆小时候", "给千金拍照", "翻千金糗照"], weight: 20, hourRanges: [[10, 22]] },
      // ── A级（较常出现，体现性格特点）──
      // 霍罗同居公寓·客厅：和罗兰相处、喝茶
      { location: "客厅", parentLocation: "霍罗同居公寓", activities: ["和罗兰聊天", "看电视", "喝红茶", "休息", "翻看相册", "用小型相机抓拍罗兰"], weight: 15, hourRanges: [[6, 9], [18, 24]] },
      // 霍罗同居公寓·开放式厨房：烘焙法式甜点（擅长但不轻易示人）
      { location: "开放式厨房", parentLocation: "霍罗同居公寓", activities: ["烘焙法式甜点", "做小蛋糕", "煮红茶", "研究甜点配方", "和罗兰一起做饭", "试做法式料理"], weight: 12, hourRanges: [[7, 9], [14, 17], [19, 21]] },
      // 回头草咖啡：喝红茶、拍照、观察别人出糗
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝红茶", "喝咖啡", "拍照", "观察别人", "看书", "安静坐着", "记录别人出糗瞬间"], weight: 12, hourRanges: [[10, 17]] },
      // 图书馆三楼经管法学区：金融学生核心学习区
      { location: "图书馆三楼经管法学区", activities: ["自习", "查阅金融文献", "看金融案例", "整理笔记", "复习"], weight: 10, hourRanges: [[8, 11], [13, 17]] },
      // 食堂：吃饭
      { location: "食堂一楼", activities: ["吃饭", "一个人吃饭", "喝茶"], weight: 10, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂二楼", activities: ["吃饭", "觅食"], weight: 8, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂三楼", activities: ["吃饭"], weight: 6, hourRanges: [[11, 14], [17, 19]] },
      // 银杏步道：散步、拍照
      { location: "银杏树下步道", activities: ["散步", "拍照", "独处", "吹风", "抓拍路人"], weight: 10, hourRanges: [[6, 8], [17, 21]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      // 人工湖岸、环湖步道：散步拍照
      { location: "人工湖岸", activities: ["散步", "拍照", "吹风", "看水面发呆"], weight: 6, hourRanges: [[6, 8], [17, 21]] },
      { location: "环湖步道", activities: ["散步", "拍照", "慢走"], weight: 6, hourRanges: [[6, 8], [17, 21]] },
      // 云顶商场·服装区：买衣服、挑配饰（富家千金审美）
      { location: "服装区", parentLocation: "云顶商场", activities: ["买衣服", "挑配饰", "逛街", "橱窗购物", "拍照"], weight: 8, hourRanges: [[14, 19]] },
      // 云顶商场·顶楼露台：拍照、看风景
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["看风景", "拍照", "透气", "吹风", "抓拍路人"], weight: 6, hourRanges: [[14, 19]] },
      // 二十四帧电影院：偶尔看电影、拍照
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看电影", "一个人看电影", "拍照", "观察情侣"], weight: 5, hourRanges: [[14, 20]] },
      // 鹿角奶茶店：偶尔喝奶茶
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "安静坐着", "看书", "拍照", "观察客人"], weight: 5, hourRanges: [[14, 19]] },
      // 操场看台：拍照、看星星
      { location: "操场看台", activities: ["看星星", "吹风", "拍照", "发呆", "观察人群"], weight: 4, hourRanges: [[21, 24]] },
      // 图书馆二楼文史哲区：看杂书、翻言情小说
      { location: "图书馆二楼文史哲区", activities: ["看杂书", "翻小说", "阅读癖发作", "看言情小说"], weight: 5, hourRanges: [[8, 17]] },
      // 图书馆四楼自习区
      { location: "图书馆四楼自习区", activities: ["自习", "复习", "整理笔记"], weight: 4, hourRanges: [[8, 17]] },
      // 沈家别墅其他位置
      { location: "二楼千金卧室", parentLocation: "沈家别墅", activities: ["找千金聊天", "串门", "和千金玩", "翻千金糗照"], weight: 8, hourRanges: [[10, 22]] },
      { location: "前院", parentLocation: "沈家别墅", activities: ["散步", "拍照", "晒太阳"], weight: 4, hourRanges: [[6, 8], [17, 19]] },
      { location: "后院", parentLocation: "沈家别墅", activities: ["独处", "吹风", "拍照"], weight: 3, hourRanges: [[6, 8], [17, 22]] },
      // 校门口便利店：买零食、买杀虫剂（怕虫子，包里常备）
      { location: "校门口便利店", activities: ["买零食", "买杀虫剂", "买日用品", "闲逛", "买相机胶卷"], weight: 4, hourRanges: [[8, 17]] },
      // 南门小吃街：觅食、拍照
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["觅食", "一个人吃夜宵", "拍照", "抓拍路人"], weight: 4, hourRanges: [[17, 22]] },
      // 落日居酒屋：偶尔喝小酒
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人喝小酒", "吃东西", "拍照", "发呆"], weight: 3, hourRanges: [[18, 22]] },
      // 咖啡吧台
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["点红茶", "和陆时予闲聊", "站着喝"], weight: 3, hourRanges: [[10, 17]] },
      // 罗兰卧室：偶尔去找罗兰
      { location: "罗兰卧室", parentLocation: "霍罗同居公寓", activities: ["找罗兰聊天", "被罗兰的呼噜吵醒", "看罗兰睡觉", "抓拍罗兰"], weight: 3, hourRanges: [[18, 24]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：参加卡牌店多场店赛
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "地下二层对战桌区", parentLocation: "龙与骰子桌游卡牌店", activities: ["参加国庆店赛", "打万智牌", "打昆特牌", "和别人对战", "拿店赛冠军", "连打多场店赛"], weight: 30, hourRanges: [[10, 22]] },
        { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["收卡", "买别人开出来的卡", "看新卡包", "淘二手卡"], weight: 20, hourRanges: [[10, 22]] },
      ]},
      // 万圣节 10/31：旁观活动并拍照
      { match: { month: 10, day: 31 }, extraSpots: [
        { location: "银杏树下步道", activities: ["旁观万圣节活动", "拍照", "记录别人的出糗瞬间", "看学生社团表演"], weight: 20, hourRanges: [[18, 24]] },
      ]},
      // 双十一 11/11：网购卡牌（讨厌自己开包出平卡，所以网购别人开好的）
      { match: { month: 11, day: 11 }, weightMultipliers: { "霍千黎卧室": 1.5, "地下二层展示区": 1.5 } },
      // 期中考试周 11月中旬
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 1.5, "霍千黎卧室": 1.5 } },
      // 平安夜/圣诞节 12/24-25：与罗兰在公寓准备法式大餐
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "开放式厨房", parentLocation: "霍罗同居公寓", activity: "和罗兰准备法式大餐" } },
      // 跨年夜 12/31：晚间外出活动
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["和千金跨年", "看电视", "拍照", "热闹", "抓拍千金"], weight: 25, hourRanges: [[18, 24]] },
      ]},
      // 元旦 1/1：放假1天
      { match: { month: 1, day: 1 }, weightMultipliers: { "霍千黎卧室": 1.5, "客厅": 1.5 } },
      // 期末考试周 1月上旬
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 2, "霍千黎卧室": 1.5 } },
            // 情人节 2/14：节日模式，在卧室等邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activity: "等待邀约" } },
// 春节 2/8-2/14：好奇中国春节习俗（和罗兰一起）
      { match: { range: [2, 8, 2, 14] }, extraSpots: [
        { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["和千金过年", "看春节晚会", "吃年夜饭", "拍照", "收红包", "抓拍千金"], weight: 25, hourRanges: [[10, 24]] },
        { location: "开放式厨房", parentLocation: "霍罗同居公寓", activities: ["试着做春节甜点", "和罗兰做饭", "研究中国菜", "烘焙法式甜点"], weight: 15, hourRanges: [[7, 9], [17, 20]] },
      ]},
      // 寒假 1月中旬-2月下旬：留守
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "地下二层对战桌区", parentLocation: "龙与骰子桌游卡牌店", activities: ["寒假店赛", "打桌游", "和别人对战", "研究卡组", "拿店赛冠军"], weight: 20, hourRanges: [[14, 22]] },
        { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activities: ["听深夜广播", "翻看<user>的糗照", "研究转运珠和魔法水晶", "整理卡组", "和罗兰窝着", "烘焙法式甜点"], weight: 20, hourRanges: [[6, 9], [18, 24]] },
      ]},
      // 白色情人节 3/14：节日模式，等待邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activity: "等待邀约" } },
      // 清明假期 4/4-4/6：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "霍千黎卧室": 1.5, "地下二层对战桌区": 1.5 } },
      // 劳动节 5/1-5/5：商圈人流量峰值
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "服装区": 2, "顶楼露台": 1.5, "地下二层对战桌区": 1.5 } },
      // 母亲节 5月第二周：与母亲通话
      { match: { range: [5, 8, 5, 14] }, weightMultipliers: { "霍千黎卧室": 1.5 } },
      // 期中考试周 5月中旬
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 1.5, "霍千黎卧室": 1.5 } },
      // 期末考试周 6月中下旬
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "图书馆三楼经管法学区": 2, "图书馆四楼自习区": 2, "霍千黎卧室": 1.5 } },
      // 七夕：节日模式，等待邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activity: "等待邀约" } },
      // 暑假 7月-8月：留城
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "地下二层对战桌区", parentLocation: "龙与骰子桌游卡牌店", activities: ["暑假店赛", "打桌游", "和别人对战", "研究卡组", "拿店赛冠军"], weight: 25, hourRanges: [[14, 22]] },
        { location: "霍千黎卧室", parentLocation: "霍罗同居公寓", activities: ["听深夜广播", "翻看<user>的糗照", "研究转运珠和魔法水晶", "整理卡组", "和罗兰窝着", "烘焙法式甜点"], weight: 20, hourRanges: [[6, 9], [18, 24]] },
      ]},
    ],
  },

  // ── 季明舒（空闲地点池系统）──
  // 广播电视编导大二，季氏地产掌上明珠，霸总文学研究者
  // 自信闪耀、追求浪漫；深夜写小说/想土味情话到掉头发；房间乱需保姆整理；有鹦鹉"季明舒的鹦武者"
  // 每周六风雨无阻去福利院做全天志愿者；不看恐怖片和文艺片
  季明舒: {
    character: "季明舒",
    entries: [
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [1, 3], location: "B305教室", activity: "编导理论与视听语言" },
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [2, 5], location: "B206教室", activity: "剧本写作与影视分析" },
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: [4], location: "C301多媒体教室", activity: "实践拍摄" },
      { startMin: t(23, 0), endMin: t(2, 0), weekdays: EVERY_DAY, location: "主卧", activity: "深夜写作", overnight: true, parentLocation: "季明舒公寓" },
      { startMin: t(9, 0), endMin: t(17, 0), weekdays: [6], location: "市立福利院", activity: "志愿活动" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: MON_FRI, location: "客厅", activity: "午餐", parentLocation: "季明舒公寓" },
      // 深夜写作后补觉（熬夜想土味情话/写小说到凌晨2点，睡到8点）
      { startMin: t(2, 0), endMin: t(8, 0), weekdays: EVERY_DAY, location: "主卧", activity: "睡觉", parentLocation: "季明舒公寓" },
    ],
    defaultLocation: "主卧",
    defaultParentLocation: "季明舒公寓",
    freeSpots: [
      // ── S级（常去，体现核心生活轨迹）──
      // 主卧：杂乱的创作空间，写小说、想土味情话、和鹦鹉说话、保养头发
      { location: "主卧", parentLocation: "季明舒公寓", activities: ["写连载小说", "熬夜想土味情话", "和鹦鹉说话", "翻看言情小说", "保养头发", "整理阅读笔记", "对着镜子练习霸总台词", "构思新剧本", "翻看<user>的资料想台词", "记霸总文学心得"], weight: 25, hourRanges: [[8, 11], [16, 23]] },
      // 次卧：言情小说恒温恒湿收藏室
      { location: "次卧", parentLocation: "季明舒公寓", activities: ["整理言情小说收藏", "翻看收藏的言情系列", "按分类整理书籍", "研究言情小说技巧", "在恒温柜前发呆", "给新书分类归档"], weight: 18, hourRanges: [[8, 23]] },
      // 回头草咖啡：与<user>初遇之地，写作、被注视
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["写作", "喝咖啡", "被众人注视", "构思剧本", "翻看言情小说", "享受被关注的感觉", "回忆与<user>的初遇"], weight: 18, hourRanges: [[10, 17]] },
      // 市立福利院：非周六也偶尔去
      { location: "儿童活动室", parentLocation: "市立福利院", activities: ["陪孩子们玩", "讲故事", "做手工", "教孩子们画画", "志愿活动"], weight: 15, hourRanges: [[9, 17]] },
      // ── A级（较常出现，体现性格特点）──
      // 季明舒公寓·客厅：放松、吃饭、闪闪发光
      { location: "客厅", parentLocation: "季明舒公寓", activities: ["放松", "吃外卖", "看商业片", "练习台词", "对着落地窗发呆", "享受独处时光", "等保姆来整理房间"], weight: 12, hourRanges: [[8, 23]] },
      // B305教室：非上课时间自习、剧本创作
      { location: "B305教室", activities: ["剧本创作", "自习", "构思台词", "研究影视案例"], weight: 10, hourRanges: [[13, 17]] },
      // 图书馆二楼文史哲区：翻言情小说、找素材
      { location: "图书馆二楼文史哲区", activities: ["翻言情小说", "找创作素材", "看杂书", "整理阅读笔记", "研究恋爱技巧"], weight: 10, hourRanges: [[8, 17]] },
      // 二十四帧电影院：看商业片/爱情片（不看恐怖片和文艺片）
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看爱情片", "看商业片", "看电影找灵感", "被众人注视", "享受电影时光"], weight: 10, hourRanges: [[14, 20]] },
      // 食堂：吃饭、被注视
      { location: "食堂二楼", activities: ["吃饭", "被众人注视", "享受关注"], weight: 8, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂一楼", activities: ["吃饭", "被注视"], weight: 6, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂三楼", activities: ["吃饭"], weight: 5, hourRanges: [[11, 14], [17, 19]] },
      // 银杏步道：散步、给自己配旁白
      { location: "银杏树下步道", activities: ["散步", "给自己配旁白", "被路人注视", "享受晴天", "构思浪漫场景"], weight: 8, hourRanges: [[6, 8], [17, 21]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      // 云顶商场·服装区：买衣服、闪耀
      { location: "服装区", parentLocation: "云顶商场", activities: ["买衣服", "挑配饰", "逛街", "被店员注视", "橱窗购物"], weight: 6, hourRanges: [[14, 19]] },
      // 云顶商场·顶楼露台：看风景、配旁白
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["看风景", "给自己配旁白", "吹风", "构思剧本"], weight: 5, hourRanges: [[14, 19]] },
      // 图书馆三楼经管法学区：偶尔翻杂书
      { location: "图书馆三楼经管法学区", activities: ["翻杂书", "找素材", "看书"], weight: 4, hourRanges: [[8, 17]] },
      // 图书馆四楼自习区
      { location: "图书馆四楼自习区", activities: ["自习", "写剧本", "整理笔记"], weight: 4, hourRanges: [[8, 17]] },
      // 人工湖岸、环湖步道：散步
      { location: "人工湖岸", activities: ["散步", "吹风", "给自己配旁白", "构思浪漫场景"], weight: 5, hourRanges: [[6, 8], [17, 21]] },
      { location: "环湖步道", activities: ["散步", "慢走", "给自己配旁白"], weight: 5, hourRanges: [[6, 8], [17, 21]] },
      // 操场看台：看星星、配旁白
      { location: "操场看台", activities: ["看星星", "吹风", "给自己配旁白", "构思剧本"], weight: 3, hourRanges: [[21, 24]] },
      // B206教室：非上课时间偶尔自习
      { location: "B206教室", activities: ["自习", "剧本创作", "研究影视案例"], weight: 4, hourRanges: [[13, 17]] },
      // C301多媒体教室：非上课时间偶尔实践
      { location: "C301多媒体教室", activities: ["练习拍摄", "剪辑素材", "研究设备"], weight: 4, hourRanges: [[13, 17]] },
      // 鹿角奶茶店：偶尔喝奶茶
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "写作", "被注视", "构思剧本"], weight: 4, hourRanges: [[14, 19]] },
      // 沈家别墅·一楼客厅：偶尔串门
      { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["串门", "和千金聊天", "蹭饭", "观察别人"], weight: 3, hourRanges: [[10, 22]] },
      // 南门小吃街：偶尔觅食
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["觅食", "吃小吃", "观察路人"], weight: 3, hourRanges: [[17, 22]] },
      // 市立音乐厅：偶尔听音乐找灵感
      { location: "音乐厅一楼观众席", parentLocation: "市立音乐厅", activities: ["听音乐找灵感", "看演出", "享受氛围"], weight: 3, hourRanges: [[10, 22]] },
      // 咖啡吧台
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["点咖啡", "和陆时予闲聊", "站着喝"], weight: 3, hourRanges: [[10, 17]] },
      // 福利院食堂：周六午餐
      { location: "福利院食堂", parentLocation: "市立福利院", activities: ["和孩子们吃饭", "喂孩子吃饭", "志愿午餐"], weight: 5, hourRanges: [[11, 13]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：连续7天福利院志愿+深夜写作
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "儿童活动室", parentLocation: "市立福利院", activities: ["国庆志愿", "连续7天陪孩子", "讲故事", "做手工", "教画画"], weight: 25, hourRanges: [[9, 17]] },
        { location: "主卧", parentLocation: "季明舒公寓", activities: ["深夜写作", "熬夜想土味情话", "写连载小说", "翻看言情小说"], weight: 20, hourRanges: [[8, 11], [18, 23]] },
      ]},
      // 万圣节 10/31：策划编导系万圣节短片
      { match: { month: 10, day: 31 }, extraSpots: [
        { location: "C301多媒体教室", activities: ["策划万圣节短片", "编导实践", "构思剧本", "和同学讨论"], weight: 20, hourRanges: [[14, 20]] },
      ]},
      // 双十一 11/11：囤言情小说
      { match: { month: 11, day: 11 }, weightMultipliers: { "次卧": 2, "主卧": 1.5 } },
      // 期中考试周 11月中旬：提交编导中期作业
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "B305教室": 1.5, "B206教室": 1.5, "C301多媒体教室": 1.5, "主卧": 1.5 } },
      // 平安夜/圣诞节 12/24-25：策划圣诞主题短片
      { match: { range: [12, 24, 12, 25] }, extraSpots: [
        { location: "C301多媒体教室", activities: ["策划圣诞短片", "编导实践", "构思节日剧本"], weight: 20, hourRanges: [[14, 20]] },
      ]},
      // 跨年夜 12/31：晚间外出活动量增加
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "银杏树下步道", activities: ["跨年散步", "给自己配旁白", "享受跨年氛围", "构思浪漫场景"], weight: 20, hourRanges: [[18, 24]] },
      ]},
      // 校园文艺汇演 12月：参与编导实践，艺术楼使用率增加
      { match: { range: [12, 1, 12, 31] }, weightMultipliers: { "C301多媒体教室": 1.5, "B305教室": 1.5, "主卧": 1.5 } },
      // 元旦 1/1：放假1天
      { match: { month: 1, day: 1 }, festivalSpot: { location: "主卧", parentLocation: "季明舒公寓", activity: "元旦休息" } },
      // 期末考试周 1月上旬：提交学期短片作品
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "C301多媒体教室": 2, "B305教室": 1.5, "B206教室": 1.5, "主卧": 1.5 } },
            // 情人节 2/14：仅留城角色可触发接触
      { match: { month: 2, day: 14 }, festivalSpot: { location: "主卧", parentLocation: "季明舒公寓", activity: "等待邀约" } },
// 春节 2/8-2/14：在公寓独自度过或参加家宴
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "主卧", parentLocation: "季明舒公寓", activity: "春节独自度过或参加家宴" } },
      // 寒假 1月中旬-2月下旬：留守
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "主卧", parentLocation: "季明舒公寓", activities: ["寒假写小说", "熬夜想土味情话", "翻看言情小说", "整理阅读笔记", "和鹦鹉说话", "保养头发"], weight: 25, hourRanges: [[8, 11], [16, 23]] },
        { location: "儿童活动室", parentLocation: "市立福利院", activities: ["寒假志愿", "陪孩子们玩", "讲故事"], weight: 15, hourRanges: [[9, 17]] },
      ]},
      // 白色情人节 3/14
      { match: { month: 3, day: 14 }, festivalSpot: { location: "主卧", parentLocation: "季明舒公寓", activity: "等待邀约" } },
      // 清明假期 4月上旬：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "儿童活动室": 1.5, "主卧": 1.5 } },
      // 劳动节 5/1-5/5：商圈人流量峰值
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "服装区": 2, "顶楼露台": 1.5, "影院售票大厅": 1.5 } },
      // 期中考试周 5月中旬：提交编导中期作业
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "C301多媒体教室": 2, "B305教室": 1.5, "B206教室": 1.5, "主卧": 1.5 } },
      // 校园文艺汇演 5月：参与编导实践
      { match: { range: [5, 1, 5, 31] }, weightMultipliers: { "C301多媒体教室": 1.5, "B305教室": 1.5, "主卧": 1.5 } },
      // 期末考试周 6月中下旬：提交期末短片作品
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "C301多媒体教室": 2, "B305教室": 1.5, "B206教室": 1.5, "主卧": 1.5 } },
      // 季明舒生日 7/22：暑假期间，自行策划生日派对
      { match: { month: 7, day: 22 }, festivalSpot: { location: "客厅", parentLocation: "季明舒公寓", activity: "自行策划生日派对" } },
      // 七夕：仅留城角色可触发接触
      { match: { month: 8, day: 22 }, festivalSpot: { location: "主卧", parentLocation: "季明舒公寓", activity: "等待邀约" } },
      // 暑假 7月-8月：留城
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "主卧", parentLocation: "季明舒公寓", activities: ["暑假写小说", "熬夜想土味情话", "翻看言情小说", "和鹦鹉说话", "保养头发", "构思新剧本"], weight: 25, hourRanges: [[8, 11], [16, 23]] },
        { location: "儿童活动室", parentLocation: "市立福利院", activities: ["暑假志愿", "连续陪孩子", "讲故事", "做手工"], weight: 20, hourRanges: [[9, 17]] },
      ]},
    ],
  },

  // ── 椎名律 ──
  // 燕大音乐学院大一，小提琴专攻，18岁
  // 天才小提琴手，叛逆不羁，因违反指定曲目用自创技法演奏帕格尼尼24号被禁赛
  // 从日本来中国留学（怕欧美有枪+中国料理太棒），来中国胖了三斤很在意但控制不住嘴
  // 喜欢恶作剧、麻辣烫（一周三次但担心爆痘）、夜晚便利店吃布丁
  // 讨厌正经场合、被说"可惜"、闹钟（像节拍器喊你起床）、密码日记本
  // 左耳打耳洞后疼哭了宣布绝不再打；手机壁纸是禁赛那天评委们的脸
  // 表面咋咋呼呼的天才辣妹气质，实则能一个人在琴房沉浸几小时
  椎名律: {
    character: "椎名律",
    entries: [
      // 8:30-10:05 周一、周三: 乐理课（在谱本边缘画评委丑脸）
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [1, 3], location: "艺术楼四楼理论教室", activity: "乐理课（在谱本边缘画评委们的丑脸）" },
      // 10:30-11:00 周二、周五: 乐理课（和老师争论演绎方式）
      { startMin: t(10, 30), endMin: t(11, 0), weekdays: [2, 5], location: "艺术楼四楼理论教室", activity: "乐理课（和老师争论'这段应该重一点'）" },
      // 11:30-12:30 每天: 食堂二楼午餐（纠结体重但还是多打了一个菜）
      { startMin: t(11, 30), endMin: t(12, 30), weekdays: EVERY_DAY, location: "食堂二楼", activity: "午餐（纠结体重但还是多打了一个菜）" },
      // 12:30-14:00 每天: 琴房练习（沉浸模式）
      { startMin: t(12, 30), endMin: t(14, 0), weekdays: EVERY_DAY, location: "艺术楼琴房", activity: "练琴，沉浸在自己的世界里" },
      // 14:00-16:05 每天: 琴房练习（用自创技法拉帕格尼尼）
      { startMin: t(14, 0), endMin: t(16, 5), weekdays: EVERY_DAY, location: "艺术楼琴房", activity: "练琴，用自创技法拉帕格尼尼（谁说不能这样拉？）" },
      // 16:30-17:00 每天: 琴房收尾练习（试着把莫扎特拉重一点）
      { startMin: t(16, 30), endMin: t(17, 0), weekdays: EVERY_DAY, location: "艺术楼琴房", activity: "收尾练习，试着把莫扎特拉重一点" },
    ],
    defaultLocation: "椎名律宿舍",
    freeSpots: [
      // ── S级（常去）──
      // 椎名律宿舍：赖床（讨厌闹钟）、刷手机看评委壁纸偷笑
      { location: "椎名律宿舍", activities: ["赖床（闹钟响了装没听见）", "刷手机看评委壁纸偷笑", "称体重然后叹气", "给日本的辣妹同学发消息", "对着镜子练'律酱很可爱对吧'的表情"], weight: 22, hourRanges: [[0, 8], [22, 24]] },
      // 艺术楼琴房：非课程时间的额外练习
      { location: "艺术楼琴房", activities: ["加练，用自创技法拉帕格尼尼24号", "沉浸式练琴几小时", "试着把巴赫拉出棺材板风格", "对着镜子练台风", "调琴，故意把弦调得'不对'"], weight: 20, hourRanges: [[17, 22]] },
      // 辣当家麻辣烫室内用餐区：一周三次，担心爆痘但控制不住
      { location: "室内用餐区", parentLocation: "辣当家麻辣烫", activities: ["吃麻辣烫（这周第三次了）", "一边吃一边担心爆痘", "在选菜冷柜前纠结加什么", "和老板说'再辣一点'"], weight: 18, hourRanges: [[17, 21]] },
      // ── A级（较常出现）──
      // 校门口便利店：夜晚买布丁坐在椅子上慢慢吃
      { location: "校门口便利店", activities: ["买布丁坐在店外椅子上慢慢吃", "看冰柜嗡嗡响发呆", "买零食", "站在便利店刺眼的灯光下吃布丁", "买饮料", "翻日本零食区"], weight: 14, hourRanges: [[20, 24]] },
      // 食堂二楼：晚餐（继续纠结体重）
      { location: "食堂二楼", activities: ["晚餐（纠结体重但还是打了肉）", "吃饭，观察食堂里的人", "一边吃一边刷手机", "偷偷多打一个菜"], weight: 12, hourRanges: [[17, 19]] },
      // 艺术楼二楼排练厅：偶尔在排练厅练琴（空间大回音好）
      { location: "艺术楼二楼排练厅", activities: ["在排练厅练琴（空间更大回音更好）", "一个人占整个排练厅拉琴", "试着拉给空座位听", "在排练厅练台风"], weight: 10, hourRanges: [[17, 21]] },
      // 银杏树下步道：散步透气
      { location: "银杏树下步道", activities: ["散步透气", "边走边哼曲子", "看路灯发呆", "吹风", "踩落叶"], weight: 8, hourRanges: [[17, 21]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      // 人工湖岸：夜晚散步
      { location: "人工湖岸", activities: ["夜晚散步", "坐在岸边拉琴给湖水听", "吹风发呆", "看水面反光"], weight: 6, hourRanges: [[20, 23]] },
      // 环湖步道：慢走
      { location: "环湖步道", activities: ["散步", "慢走", "边走边哼曲子", "吹风"], weight: 5, hourRanges: [[17, 21]] },
      // 市立音乐厅一楼观众席：偶尔看演出（心里挑刺'这段我拉得更好'）
      { location: "音乐厅一楼观众席", parentLocation: "市立音乐厅", activities: ["看演出（心里挑刺'这段我拉得更好'）", "听音乐会找灵感", "看别人演奏然后不服气", "在座位上偷偷打拍子"], weight: 6, hourRanges: [[14, 22]] },
      // 市立音乐厅二楼观众席：偶尔坐高处
      { location: "音乐厅二楼观众席", parentLocation: "市立音乐厅", activities: ["坐高处看演出", "一个人听音乐会", "从高处挑刺"], weight: 4, hourRanges: [[14, 22]] },
      // 操场看台：夜晚独处
      { location: "操场看台", activities: ["坐高处看星星", "一个人吹风", "发呆", "哼曲子给夜空听"], weight: 4, hourRanges: [[21, 24]] },
      // 南门小吃街流动摊位区：觅食
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["觅食", "吃夜宵", "和摊主聊天", "试各种中国小吃", "拍照发日本同学"], weight: 5, hourRanges: [[18, 22]] },
      // 鹿角奶茶店：偶尔喝奶茶
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "坐着发呆", "看窗外", "给日本同学发消息"], weight: 4, hourRanges: [[14, 19]] },
      // 云顶商场·美食广场：逛街觅食
      { location: "美食广场", parentLocation: "云顶商场", activities: ["觅食", "逛街", "吃好吃的", "看中国奶茶种类"], weight: 4, hourRanges: [[11, 14], [17, 20]] },
      // 二十四帧电影院：偶尔一个人看动画片
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["一个人看动画片", "看电影", "买爆米花", "看日本动画电影"], weight: 3, hourRanges: [[14, 20]] },
      // 艺术楼一楼大厅：闲逛、恶作剧
      { location: "艺术楼一楼大厅", activities: ["闲逛", "在大厅拉琴听回音", "恶作剧吓学弟妹", "看学生作品展"], weight: 5, hourRanges: [[8, 17]] },
      // ── C级（偶遇惊喜）──
      // 食堂一楼：偶尔换口味
      { location: "食堂一楼", activities: ["换口味吃饭", "一个人吃饭", "观察食堂里的人"], weight: 4, hourRanges: [[11, 14], [17, 19]] },
      // 食堂三楼：偶尔
      { location: "食堂三楼", activities: ["吃饭", "一个人安静吃", "看窗外"], weight: 3, hourRanges: [[11, 14], [17, 19]] },
      // 靠窗座位区：偶尔喝咖啡
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡", "坐着发呆", "看窗外", "给日本同学发消息"], weight: 3, hourRanges: [[14, 19]] },
      // 艺术楼四楼理论教室：非上课时间
      { location: "艺术楼四楼理论教室", activities: ["自习乐理", "翻乐谱", "在谱本边缘画评委丑脸", "研究自创技法"], weight: 3, hourRanges: [[13, 17]] },
      // 服装区：逛街买衣服
      { location: "服装区", parentLocation: "云顶商场", activities: ["买衣服", "逛街", "看中国潮牌", "试穿拍照发日本"], weight: 3, hourRanges: [[14, 19]] },
      // 一号放映厅：看动画电影
      { location: "一号放映厅", parentLocation: "二十四帧电影院", activities: ["看日本动画电影", "一个人看电影", "吃爆米花"], weight: 2, hourRanges: [[14, 20]] },
      // 居酒屋：偶尔吃日料解乡愁
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["吃日料解乡愁", "一个人吃东西", "给日本同学发'想念日本料理'的消息"], weight: 3, hourRanges: [[18, 22]] },
    ],
    dateOverrides: [
      // 椎名律生日 7/14：给自己拉一曲帕格尼尼庆祝
      { match: { month: 7, day: 14 }, festivalSpot: { location: "艺术楼琴房", activity: "生日，给自己拉一曲帕格尼尼24号庆祝（反正评委不让我拉）" } },
      // 禁赛日 11/22：在琴房拉当年那首被禁的曲子，看手机壁纸偷笑
      { match: { month: 11, day: 22 }, festivalSpot: { location: "艺术楼琴房", activity: "禁赛纪念日，用自创技法拉帕格尼尼24号，看手机壁纸评委们的脸偷笑" } },
      // 第一碗麻辣烫 9/7：到辣当家吃麻辣烫庆祝
      { match: { month: 9, day: 7 }, extraSpots: [
        { location: "室内用餐区", parentLocation: "辣当家麻辣烫", activities: ["第一碗麻辣烫纪念日", "点最辣的", "拍照发日本同学", "担心爆痘但吃得开心"], weight: 30, hourRanges: [[11, 21]] },
      ]},
      // 国庆假期 10/1-10/7：留校练琴+到处觅食
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "艺术楼琴房", activities: ["假期加练", "一个人占整个琴房", "沉浸式练琴一整天"], weight: 25, hourRanges: [[8, 22]] },
        { location: "室内用餐区", parentLocation: "辣当家麻辣烫", activities: ["假期觅食", "吃麻辣烫", "担心爆痘"], weight: 15, hourRanges: [[11, 21]] },
      ]},
      // 万圣节 10/31：恶作剧的好日子
      { match: { month: 10, day: 31 }, extraSpots: [
        { location: "银杏树下步道", activities: ["万圣节恶作剧", "看学生社团表演", "拍照记录别人的出糗瞬间"], weight: 20, hourRanges: [[18, 24]] },
      ]},
      // 双十一 11/11：网购琴弦和零食
      { match: { month: 11, day: 11 }, weightMultipliers: { "椎名律宿舍": 1.5 } },
      // 期中考试周 11月中旬：小提琴系考试以汇演形式
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "艺术楼琴房": 2, "艺术楼四楼理论教室": 1.5 } },
      // 平安夜/圣诞节 12/24-25：在宿舍过节，给日本发消息
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "椎名律宿舍", activity: "在宿舍过圣诞，给日本的辣妹同学发消息" } },
      // 跨年夜 12/31：便利店吃布丁跨年
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "校门口便利店", activities: ["在便利店吃布丁跨年", "看冰柜嗡嗡响", "给手机壁纸评委们说'新年快乐'"], weight: 25, hourRanges: [[20, 24]] },
      ]},
      // 元旦 1/1：睡到自然醒（没有闹钟的一天）
      { match: { month: 1, day: 1 }, festivalSpot: { location: "椎名律宿舍", activity: "元旦，没有闹钟睡到自然醒" } },
      // 期末考试周 1月上旬：期末汇演
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "艺术楼琴房": 2, "椎名律宿舍": 1.5 } },
            // 情人节 2/14：嘴上说'重女联盟好可怕'但偷偷等邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "椎名律宿舍", activity: "情人节，嘴上说'重女联盟好可怕'但偷偷等邀约" } },
// 春节 2/8-2/14：好奇中国春节，在宿舍看晚会
      { match: { range: [2, 8, 2, 14] }, extraSpots: [
        { location: "椎名律宿舍", activities: ["看春节晚会（觉得新奇）", "给日本同学直播中国春节", "试着包饺子失败", "收红包"], weight: 25, hourRanges: [[10, 24]] },
        { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["春节觅食", "吃各种中国小吃", "拍照发日本"], weight: 15, hourRanges: [[11, 20]] },
      ]},
      // 寒假 1/16-2/20：留校练琴（日本回不去也不想回去）
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "艺术楼琴房", activities: ["寒假留校练琴", "一个人在琴房待一整天", "试着拉各种被评委禁止的曲子"], weight: 20, hourRanges: [[9, 22]] },
        { location: "椎名律宿舍", activities: ["赖床", "给日本发视频通话", "刷手机看评委壁纸", "吃外卖"], weight: 18, hourRanges: [[0, 9], [22, 24]] },
      ]},
      // 白色情人节 3/14：'脸皮厚一点总能成功的吧？'
      { match: { month: 3, day: 14 }, festivalSpot: { location: "椎名律宿舍", activity: "白色情人节，'被拒绝就准备一周再次告白，脸皮厚一点总能成功'" } },
      // 清明假期 4/4-4/6：放假3天，练琴+吃麻辣烫
      { match: { range: [4, 4, 4, 6] }, extraSpots: [
        { location: "艺术楼琴房", activities: ["假期加练", "沉浸练琴"], weight: 20, hourRanges: [[9, 22]] },
        { location: "室内用餐区", parentLocation: "辣当家麻辣烫", activities: ["吃麻辣烫", "担心爆痘"], weight: 15, hourRanges: [[11, 21]] },
      ]},
      // 劳动节 5/1-5/5：放假，练琴+赖床
      { match: { range: [5, 1, 5, 5] }, extraSpots: [
        { location: "艺术楼琴房", activities: ["假期加练", "用自创技法拉琴"], weight: 20, hourRanges: [[9, 22]] },
        { location: "椎名律宿舍", activities: ["赖床", "称体重叹气", "刷手机"], weight: 15, hourRanges: [[0, 9], [22, 24]] },
      ]},
      // 期中考试周 5月中旬
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "艺术楼琴房": 2, "艺术楼四楼理论教室": 1.5 } },
      // 期末考试周 6月中下旬
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "艺术楼琴房": 2, "椎名律宿舍": 1.5 } },
      // 七夕：'喜欢就大大方方说出来好了'
      { match: { month: 8, day: 22 }, festivalSpot: { location: "椎名律宿舍", activity: "七夕，'喜欢就大大方方说出来好了'" } },
      // 暑假 7-8月：留校练琴（怕欧美有枪，中国料理太棒所以不走）
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "艺术楼琴房", activities: ["暑假留校练琴", "一个人占整个琴房", "试着拉所有被禁的曲子"], weight: 20, hourRanges: [[9, 22]] },
        { location: "室内用餐区", parentLocation: "辣当家麻辣烫", activities: ["暑假吃麻辣烫", "一周三次", "担心爆痘"], weight: 15, hourRanges: [[11, 21]] },
        { location: "校门口便利店", activities: ["夜晚买布丁", "坐在便利店外吃", "发呆"], weight: 12, hourRanges: [[20, 24]] },
      ]},
    ],
  },

  // ── 步玲燕（空闲地点池系统）──
  // 宗教学大四，江湖人称"燕半仙"，南门小吃街算命摊主
  // 古董店家庭出身，观察力敏锐，擅长话术包装；论文制无考试压力
  // 特殊条件覆盖：雨天 → 摆摊收入锐减或停摊，休息日（当前日程系统不支持天气判断，需由正文 overrides 覆盖）
  步玲燕: {
    character: "步玲燕",
    entries: [
      { startMin: t(10, 0), endMin: t(11, 30), weekdays: [2], location: "C204自习室", activity: "导师面谈" },
      { startMin: t(14, 0), endMin: t(15, 30), weekdays: [4], location: "B102教室", activity: "选修课" },
      { startMin: t(16, 0), endMin: t(21, 0), weekdays: [1, 2, 3, 4, 5, 6], location: "步玲燕算命摊位", activity: "摆摊", parentLocation: "南门小吃街" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "食堂一楼", activity: "午餐" },
      // 深夜固定睡觉（熬夜追剧看故事会，但白天要出摊所以不能太晚）
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "步玲燕宿舍", activity: "睡觉" },
    ],
    defaultLocation: "步玲燕宿舍",
    // 雨天：摆摊收入锐减，停抦休息
    weatherOverrides: [
      { condition: 'rainy', spot: { location: '步玲燕宿舍', activity: '雨天停抦，休息' } },
    ],
    freeSpots: [
      // ── S级（常去，体现核心生活轨迹）──
      // 步玲燕宿舍：打麻将、看故事会和知音、翻论文、刷手机、吃外卖
      { location: "步玲燕宿舍", activities: ["和室友打麻将", "看《故事会》", "看《知音》", "翻论文", "整理话术笔记", "刷手机追剧", "吃外卖", "数摊位赚的钱", "研究算命话术", "包里补云南白药"], weight: 25, hourRanges: [[6, 10], [21, 24]] },
      // 步玲燕算命摊位：非摆摊时段偶尔也在（提前出摊、收摊晚走）
      { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["提前出摊", "收摊整理", "观察路人", "琢磨话术", "翻《渊海子平》", "等客户上门", "记录案例"], weight: 20, hourRanges: [[10, 16], [21, 23]] },
      // 南门小吃街·流动小吃摊位区：上班前后解馋
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["吃炸串", "觅食", "买夜宵", "蹲着等客户时吃小吃", "和摊主闲聊", "蹭试吃"], weight: 22, hourRanges: [[10, 16], [17, 23]] },
      // ── A级（较常出现，体现性格特点）──
      // 图书馆二楼文史哲区：翻宗教类书籍、找论文素材
      { location: "图书馆二楼文史哲区", activities: ["翻宗教类书籍", "查论文资料", "看杂书", "找算命素材", "整理笔记"], weight: 12, hourRanges: [[8, 11], [13, 16]] },
      // C204自习室：非面谈时间偶尔自习、写论文
      { location: "C204自习室", activities: ["写论文", "自习", "整理田野调查笔记", "翻资料"], weight: 10, hourRanges: [[8, 11], [13, 16]] },
      // 食堂：吃饭（偏爱一楼便宜量大）
      { location: "食堂一楼", activities: ["吃饭", "一个人吃饭", "觅食", "蹭免费汤"], weight: 12, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂二楼", activities: ["吃饭", "觅食"], weight: 8, hourRanges: [[11, 14], [17, 19]] },
      { location: "食堂三楼", activities: ["吃饭"], weight: 6, hourRanges: [[11, 14], [17, 19]] },
      // 校门口便利店：买日用品、买零食、找免单商品
      { location: "校门口便利店", activities: ["买零食", "买日用品", "找免单商品", "薅羊毛", "买云南白药", "买饮料"], weight: 10, hourRanges: [[8, 17]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      // 图书馆三楼经管法学区：偶尔翻杂书
      { location: "图书馆三楼经管法学区", activities: ["翻杂书", "查资料", "看案例"], weight: 5, hourRanges: [[8, 17]] },
      // 图书馆四楼自习区
      { location: "图书馆四楼自习区", activities: ["自习", "写论文"], weight: 4, hourRanges: [[8, 17]] },
      // 图书馆一楼借还台
      { location: "图书馆一楼借还台", activities: ["借书还书", "借《故事会》"], weight: 3, hourRanges: [[8, 17]] },
      // 银杏步道：散步、观察路人（找素材）
      { location: "银杏树下步道", activities: ["散步", "观察路人", "找素材", "吹风", "想事情"], weight: 6, hourRanges: [[6, 8], [17, 19]] },
      // 人工湖岸、环湖步道：散步
      { location: "人工湖岸", activities: ["散步", "吹风", "看水面发呆", "观察路人"], weight: 5, hourRanges: [[6, 8], [17, 21]] },
      { location: "环湖步道", activities: ["散步", "慢走", "观察路人"], weight: 5, hourRanges: [[6, 8], [17, 21]] },
      // 操场看台：偶尔坐坐（体测噩梦回忆）
      { location: "操场看台", activities: ["坐着休息", "看星星", "吹风", "回忆体测噩梦", "观察人群"], weight: 3, hourRanges: [[21, 24]] },
      // 云顶商场·美食广场：偶尔觅食、找免单
      { location: "美食广场", parentLocation: "云顶商场", activities: ["觅食", "找免单", "蹭试吃", "逛街"], weight: 4, hourRanges: [[11, 14], [17, 20]] },
      // 二十四帧电影院：偶尔看个电影
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看电影", "一个人看电影", "找素材"], weight: 3, hourRanges: [[14, 20]] },
      // 鹿角奶茶店：偶尔
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "安静坐着", "观察客人", "找素材"], weight: 3, hourRanges: [[14, 19]] },
      // 回头草咖啡：偶尔喝咖啡
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡", "看书", "观察客人", "安静坐着"], weight: 3, hourRanges: [[8, 17]] },
      // 宿舍楼大门：经过
      { location: "宿舍楼大门", activities: ["经过", "进出门", "跑路躲城管"], weight: 2, hourRanges: [[6, 23]] },
      // 龙与骰子桌游卡牌店：偶尔好奇看看（和算命一样都是"骗术"）
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇看看", "看别人玩桌游", "观摩同行"], weight: 2, hourRanges: [[14, 19]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：摆摊收入高峰期，游客增多
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["国庆旺季摆摊", "游客爆满", "赚得盆满钵满", "忙不过来", "接待外地游客"], weight: 30, hourRanges: [[10, 22]] },
        { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["旺季觅食", "吃炸串", "蹭试吃", "和摊主闲聊旺季生意"], weight: 15, hourRanges: [[10, 22]] },
      ]},
      // 期中考试周 11月中旬：论文制无考试压力，继续摆摊
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "步玲燕算命摊位": 1.5, "C204自习室": 1.5, "图书馆二楼文史哲区": 1.5 } },
      // 平安夜/圣诞节 12/24-25：节日摆摊，算命旺季
      { match: { range: [12, 24, 12, 25] }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["圣诞摆摊", "给情侣算姻缘", "节日旺季", "忙不过来"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 跨年夜 12/31：摆摊
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["跨年摆摊", "给路人算新年运势", "旺季"], weight: 25, hourRanges: [[16, 23]] },
      ]},
      // 期末考试周 1月上旬：论文制无考试，交论文阶段稿
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "C204自习室": 1.5, "图书馆二楼文史哲区": 1.5, "步玲燕宿舍": 1.5 } },
      // 元旦 1/1：放假1天，休息
      { match: { month: 1, day: 1 }, festivalSpot: { location: "步玲燕宿舍", activity: "元旦休息" } },
      // 情人节 2/14：节日模式，摆摊算姻缘
      { match: { month: 2, day: 14 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["情人节摆摊", "给情侣算姻缘", "旺季", "忙不过来"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 开摊纪念日 3/15：大三下学期首次摆摊日，节日模式
      { match: { month: 3, day: 15 }, festivalSpot: { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activity: "开摊纪念日，隆重出摊" } },
      // 白色情人节 3/14：摆摊算姻缘
      { match: { month: 3, day: 14 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["白色情人节摆摊", "给情侣算姻缘", "旺季"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 冬季 12-2月：摆摊时间缩短（天冷，室外不宜久留）
      { match: { range: [12, 1, 2, 20] }, weightMultipliers: { "步玲燕算命摊位": 0.6, "步玲燕宿舍": 1.5, "流动小吃摊位区": 0.8 } },
      // 春节 2/8-2/14：回老家
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "步玲燕宿舍", activity: "回老家过年" } },
      // 情人节 2/14：节日模式，摆摊算姻缘
      { match: { month: 2, day: 14 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["情人节摆摊", "给情侣算姻缘", "旺季", "忙不过来"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 寒假 1月中旬-2月下旬：不确定是否离校
      { match: { range: [1, 16, 2, 20] }, weightMultipliers: { "步玲燕算命摊位": 0.5, "步玲燕宿舍": 1.5 } },
      // 白色情人节 3/14：摆摊算姻缘
      { match: { month: 3, day: 14 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["白色情人节摆摊", "给情侣算姻缘", "旺季"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 开摊纪念日 3/15：大三下学期首次摆摊日，节日模式
      { match: { month: 3, day: 15 }, festivalSpot: { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activity: "开摊纪念日，隆重出摊" } },
      // 步玲燕生日 4/1：愚人节当天，本人持无所谓态度
      { match: { month: 4, day: 1 }, festivalSpot: { location: "步玲燕宿舍", activity: "生日（愚人节）" } },
      // 清明假期 4月上旬：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "步玲燕算命摊位": 1.5, "流动小吃摊位区": 1.5 } },
      // 劳动节 5/1-5/5：摆摊旺季
      { match: { range: [5, 1, 5, 5] }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["劳动节旺季摆摊", "游客爆满", "赚得盆满钵满", "忙不过来", "接待外地游客"], weight: 30, hourRanges: [[10, 22]] },
        { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["旺季觅食", "吃炸串", "蹭试吃"], weight: 15, hourRanges: [[10, 22]] },
      ]},
      // 期中考试周 5月中旬：论文制无压力
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "步玲燕算命摊位": 1.2, "C204自习室": 1.5 } },
      // 毕业季 6月：论文答辩，摆摊是否继续取决于去向
      { match: { range: [6, 1, 6, 30] }, extraSpots: [
        { location: "步玲燕宿舍", activities: ["准备论文答辩", "整理毕业材料", "和室友打麻将", "翻论文", "纠结毕业去向", "犹豫是否继续摆摊"], weight: 20, hourRanges: [[6, 10], [21, 24]] },
        { location: "C204自习室", activities: ["论文答辩准备", "和导师沟通", "修改论文"], weight: 15, hourRanges: [[8, 16]] },
      ]},
      // 七夕：摆摊算姻缘
      { match: { month: 8, day: 22 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["七夕摆摊", "给情侣算姻缘", "旺季", "忙不过来"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 暑假 7-8月：不确定是否留校
      { match: { range: [7, 1, 8, 31] }, weightMultipliers: { "步玲燕算命摊位": 0.5, "步玲燕宿舍": 1.5, "流动小吃摊位区": 0.8 } },
    ],
  },

  // ── 傅霁（宅女画师，几乎不出门，偶尔取材/看爷爷）──
  // 夜猫子作息：熬夜画稿到凌晨，白天睡到中午；除上课外基本窝在家里画画
  傅霁: {
    character: "傅霁",
    entries: [
      { startMin: t(8, 30), endMin: t(11, 0), weekdays: MON_FRI, location: "卧室", activity: "睡觉", parentLocation: "傅霁公寓" },
      { startMin: t(14, 0), endMin: t(17, 0), weekdays: [1, 3, 5], location: "C405开放画室", activity: "上课" },
      { startMin: t(11, 30), endMin: t(13, 0), weekdays: EVERY_DAY, location: "客厅", activity: "午餐", parentLocation: "傅霁公寓" },
    ],
    defaultLocation: "卧室",
    defaultParentLocation: "傅霁公寓",
    freeSpots: [
      // ── S级（几乎都在家，夜猫子核心）──
      // 深夜画稿：夜猫子核心时段，窝在毛毯里对着数位板
      { location: "卧室", parentLocation: "傅霁公寓", activities: ["熬夜画稿", "窝在毛毯里画画", "看R18作品取材", "刷粉丝评论偷着开心", "对着数位板发呆", "画火柴人草稿", "构思新图", "查参考图", "刷P站找灵感"], weight: 45, hourRanges: [[0, 8]] },
      // 白天/晚上：补觉、赖床、继续画
      { location: "卧室", parentLocation: "傅霁公寓", activities: ["赖床", "补觉", "窝在被子里刷手机", "画稿", "对着屏幕发呆", "吃床头放的零食", "看动画片", "翻粉丝私信", "给白兔先生画同人"], weight: 35, hourRanges: [[11, 14], [17, 24]] },
      // 客厅：吃外卖、看动画片
      { location: "客厅", parentLocation: "傅霁公寓", activities: ["吃外卖", "看动画片", "窝在沙发上发呆", "等外卖到了", "拆快递", "看深夜动画档", "对着电视吃泡面", "瘫在沙发上看手机"], weight: 15, hourRanges: [[11, 14], [17, 24]] },
      // 独立卫浴：洗澡洗漱（对镜子有点怨念）
      { location: "独立卫浴", parentLocation: "傅霁公寓", activities: ["洗澡", "刷牙洗漱", "垫脚照镜子叹气", "冲澡洗掉颜料", "对着镜子比身高", "洗完澡裹浴巾看手机"], weight: 6, hourRanges: [[11, 14], [22, 24]] },
      // ── A级（学校附近，上课顺便或傍晚出行）──
      { location: "C405开放画室", activities: ["自己画画", "观察石膏像找灵感", "练习人体结构", "对着模特骨架写生", "在空画室偷偷画R18", "翻看学长学姐的旧作品"], weight: 8, hourRanges: [[13, 17]] },
      // 校门口便利店：夜间出来买零食（白天不出门）
      { location: "校门口便利店", activities: ["深夜买零食", "囤泡面", "买饮料", "买画材笔芯", "站在便利店灯光下发呆", "买冰激凌"], weight: 8, hourRanges: [[20, 24]] },
      // 影院售票大厅：夜间看电影取材
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["一个人看动画电影", "取材", "看烂片吐槽", "看深夜场次", "包场看动画"], weight: 7, hourRanges: [[18, 23]] },
      // 老公寓客厅：去爷爷家蹭饭（白天少有的外出）
      { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["看爷爷", "蹭爷爷做的饭", "被爷爷念叨作息", "听爷爷讲以前的事", "陪爷爷看电视"], weight: 5, hourRanges: [[10, 17]] },
      // 画室（爷爷家）：翻看旧画
      { location: "画室", parentLocation: "傅霁爷爷家", activities: ["翻看爷爷的旧画", "回忆小时候学画", "看石膏像", "坐在画架前发呆", "试着画爷爷年轻时的样子"], weight: 4, hourRanges: [[10, 17]] },
      // ── B级（偶尔夜间出门，偶遇惊喜）──
      // 深夜小吃街：偶尔觅食
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["深夜觅食", "买烤冷面", "买煎饼果子", "一个人吃夜宵", "边走边吃"], weight: 5, hourRanges: [[20, 24]] },
      // 操场看台：深夜看星星
      { location: "操场看台", activities: ["深夜看星星", "一个人吹风", "坐在高处发呆", "画速写夜景", "听虫鸣"], weight: 4, hourRanges: [[21, 24]] },
      // 银杏步道：夜间散步
      { location: "银杏树下步道", activities: ["夜间散步", "看路灯", "踩落叶", "吹夜风", "边走边听动画OP"], weight: 4, hourRanges: [[20, 23]] },
      // 人工湖岸：深夜发呆
      { location: "人工湖岸", activities: ["深夜散步", "坐在岸边发呆", "看水面反光", "吹风", "画速写湖面"], weight: 3, hourRanges: [[20, 23]] },
      // 环湖步道：夜跑（为了健康偶尔跑跑）
      { location: "环湖步道", activities: ["夜跑（跑了三分钟就累了）", "散步", "慢慢走", "吹风"], weight: 3, hourRanges: [[20, 23]] },
      // 回头草咖啡：傍晚偶尔喝咖啡
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["傍晚喝咖啡", "画速写", "看窗外发呆", "翻参考书"], weight: 4, hourRanges: [[18, 22]] },
      // 鹿角奶茶店：偶尔喝奶茶
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "安静坐着", "看窗外夜景", "画速写"], weight: 3, hourRanges: [[19, 22]] },
      // 落日居酒屋：夜间一个人吃东西
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人吃东西", "喝无酒精饮料", "发呆", "画速写别的客人"], weight: 3, hourRanges: [[19, 23]] },
      // 一号放映厅：深夜动画专场
      { location: "一号放映厅", parentLocation: "二十四帧电影院", activities: ["看深夜动画专场", "一个人包场", "取材"], weight: 3, hourRanges: [[20, 23]] },
      // 图书馆四楼自习区：白天少有的外出（查资料）
      { location: "图书馆四楼自习区", activities: ["查参考资料", "找构图灵感", "安静地画速写", "翻画册"], weight: 3, hourRanges: [[13, 17]] },
      // 云顶商场美食广场：傍晚觅食
      { location: "美食广场", parentLocation: "云顶商场", activities: ["傍晚觅食", "吃快餐", "顺便逛逛", "买奶茶"], weight: 3, hourRanges: [[18, 21]] },
      // 龙与骰子桌游卡牌店：偶尔好奇看看
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇看看", "看别人玩桌游", "翻翻有没有画师合作的卡牌"], weight: 2, hourRanges: [[18, 22]] },
      // 艺术楼一楼大厅：晚上在艺术楼闲逛
      { location: "艺术楼一楼大厅", activities: ["晚上闲逛", "在大厅看学生作品展", "画速写大厅雕塑", "听琴房传来的琴声"], weight: 3, hourRanges: [[18, 22]] },
      // 溜冰场：看别人滑冰
      { location: "溜冰场", parentLocation: "云顶商场", activities: ["看别人滑冰", "坐着发呆", "画速写滑冰的人"], weight: 2, hourRanges: [[18, 21]] },
      // 顶楼露台：看夜景
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["看夜景", "吹风", "画速写城市灯火", "发呆"], weight: 2, hourRanges: [[19, 22]] },
    ],
    dateOverrides: [
      // 傅霁生日 5/2：窝在家画生日主题图，给自己买蛋糕
      { match: { month: 5, day: 2 }, festivalSpot: { location: "卧室", parentLocation: "傅霁公寓", activity: "生日，窝在家画图吃蛋糕" } },
      // 白兔先生诞生日 10/23：发新图的日子，窝在家里画通宵
      { match: { month: 10, day: 23 }, festivalSpot: { location: "卧室", parentLocation: "傅霁公寓", activity: "白兔先生诞生日，赶新图" } },
      // 国庆假期 10/1-10/7：窝在家赶稿，偶尔去爷爷家蹭饭
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "卧室", parentLocation: "傅霁公寓", activities: ["国庆赶稿", "窝在家画画", "看动画片", "吃外卖", "刷粉丝评论"], weight: 35, hourRanges: [[0, 24]] },
        { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["去爷爷家蹭饭", "被爷爷念叨作息", "陪爷爷过节"], weight: 15, hourRanges: [[10, 17]] },
      ]},
      // 双十一 11/11：囤画材和零食
      { match: { month: 11, day: 11 }, weightMultipliers: { "卧室": 1.5, "校门口便利店": 2 } },
      // 期中考试周 11月中旬：交作业稿
      { match: { range: [11, 10, 11, 20] }, weightMultipliers: { "C405开放画室": 2, "卧室": 1.5 } },
      // 平安夜/圣诞节 12/24-25：窝在家画圣诞主题图，看动画片
      { match: { range: [12, 24, 12, 25] }, extraSpots: [
        { location: "卧室", parentLocation: "傅霁公寓", activities: ["画圣诞主题图", "看圣诞动画片", "窝在毛毯里", "吃外卖", "刷粉丝评论偷着开心"], weight: 35, hourRanges: [[0, 24]] },
      ]},
      // 跨年夜 12/31：熬夜画稿跨年
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "卧室", parentLocation: "傅霁公寓", activities: ["熬夜画稿跨年", "看动画片跨年", "刷社交媒体倒计时", "吃零食"], weight: 35, hourRanges: [[0, 24]] },
      ]},
      // 元旦 1/1：窝在家补觉，偶尔去爷爷家
      { match: { month: 1, day: 1 }, extraSpots: [
        { location: "卧室", parentLocation: "傅霁公寓", activities: ["元旦补觉", "赖床", "窝在被子里刷手机"], weight: 35, hourRanges: [[0, 24]] },
        { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["去爷爷家吃饭", "陪爷爷过元旦"], weight: 10, hourRanges: [[10, 17]] },
      ]},
      // 期末考试周 1月上旬：交期末作品
      { match: { range: [1, 1, 1, 10] }, weightMultipliers: { "C405开放画室": 2, "卧室": 1.5, "图书馆四楼自习区": 2 } },
// 春节：回老家
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "步玲燕宿舍", activity: "回老家过年" } },
      // 情人节 2/14：节日模式，摆摊算姻缘
      { match: { month: 2, day: 14 }, extraSpots: [
        { location: "步玲燕算命摊位", parentLocation: "南门小吃街", activities: ["情人节摆摊", "给情侣算姻缘", "旺季", "忙不过来"], weight: 25, hourRanges: [[14, 22]] },
      ]},
      // 寒假 1月中旬-2月下旬：不确定是否离校
      { match: { range: [1, 16, 2, 20] }, weightMultipliers: { "步玲燕算命摊位": 0.5, "步玲燕宿舍": 1.5 } },
// 春节 2/8-2/14：去爷爷家过年
      { match: { range: [2, 8, 2, 14] }, extraSpots: [
        { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["陪爷爷过年", "吃年夜饭", "看春晚", "贴春联", "被爷爷念叨怎么还不找对象"], weight: 30, hourRanges: [[10, 24]] },
        { location: "画室", parentLocation: "傅霁爷爷家", activities: ["在爷爷画室画画", "翻看旧画"], weight: 10, hourRanges: [[10, 17]] },
      ]},
      // 寒假 1月中旬-2月下旬：窝在家画稿，偶尔去爷爷家
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "卧室", parentLocation: "傅霁公寓", activities: ["寒假赶稿", "窝在家画画", "看动画片", "刷粉丝评论", "吃零食", "熬夜画图"], weight: 40, hourRanges: [[0, 24]] },
        { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["去爷爷家蹭饭", "被爷爷念叨作息", "翻看爷爷旧画"], weight: 12, hourRanges: [[10, 17]] },
        { location: "画室", parentLocation: "傅霁爷爷家", activities: ["翻看爷爷的旧画", "回忆小时候学画", "在爷爷画室练习"], weight: 8, hourRanges: [[10, 17]] },
      ]},
      // 白色情人节 3/14：窝在家
      { match: { month: 3, day: 14 }, festivalSpot: { location: "卧室", parentLocation: "傅霁公寓", activity: "等待邀约" } },
      // 清明假期 4/4-4/6：去爷爷家，可能回老家扫墓
      { match: { range: [4, 4, 4, 6] }, extraSpots: [
        { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["陪爷爷过清明", "吃寒食", "听爷爷讲老家的事"], weight: 15, hourRanges: [[10, 17]] },
      ]},
      // 劳动节 5/1-5/5：窝在家赶稿
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "卧室": 1.5, "校门口便利店": 1.5 } },
      // 母亲节 5月第二周：傅霁没有母亲相关设定，略过（用 weightMultipliers 表示在宿舍独处）
      { match: { range: [5, 8, 5, 14] }, weightMultipliers: { "卧室": 1.5 } },
      // 期中考试周 5月中旬：交作业稿
      { match: { range: [5, 10, 5, 20] }, weightMultipliers: { "C405开放画室": 2, "卧室": 1.5 } },
      // 期末考试周 6月中下旬：交期末作品
      { match: { range: [6, 15, 6, 30] }, weightMultipliers: { "C405开放画室": 2, "卧室": 1.5, "图书馆四楼自习区": 2 } },
      // 七夕：窝在家，等邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "卧室", parentLocation: "傅霁公寓", activity: "等待邀约" } },
      // 暑假 7月-8月：窝在家画稿，偶尔去爷爷家
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "卧室", parentLocation: "傅霁公寓", activities: ["暑假赶稿", "窝在家画画", "看动画片", "刷粉丝评论", "熬夜画图", "囤零食"], weight: 40, hourRanges: [[0, 24]] },
        { location: "老公寓客厅", parentLocation: "傅霁爷爷家", activities: ["去爷爷家蹭饭", "被爷爷念叨作息", "翻看爷爷旧画"], weight: 12, hourRanges: [[10, 17]] },
      ]},
    ],
  },

  // ── 裴今歌（空闲地点池系统，全年通用）──
  // 裴今歌是"因为我想，所以去做"的自由人设，没有固定日程，全靠随机池
  // 唯一固定的是深夜睡觉，其余时间想去哪就去哪
  裴今歌: {
    character: "裴今歌",
    yearRound: true,
    entries: [
      // 深夜固定睡觉
      { startMin: t(0, 0), endMin: t(7, 0), weekdays: EVERY_DAY, location: "二楼卧室", activity: "睡觉", parentLocation: "裴今歌住所" },
    ],
    defaultLocation: "二楼卧室",
    defaultParentLocation: "裴今歌住所",
    freeSpots: [
      // ── S级（常去）──
      { location: "二楼卧室", parentLocation: "裴今歌住所", activities: ["和姜董对戏", "看剧本", "窝在被子里", "画火柴人日记", "刷手机"], weight: 22, hourRanges: [[7, 10], [22, 24]] },
      { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activities: ["看动画片", "看烂片", "窝在地毯上", "和姜董玩", "背台词"], weight: 20, hourRanges: [[18, 24]] },
      { location: "二楼阳台", parentLocation: "裴今歌住所", activities: ["看高处风景", "吹风", "发呆", "想事情", "看星星"], weight: 18, hourRanges: [[6, 24]] },
      // ── A级（较常出现）──
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["坐高处吹风", "看脚下的人", "透气", "发呆"], weight: 12, hourRanges: [[14, 19]] },
      { location: "二楼观众席", parentLocation: "市立音乐厅", activities: ["听音乐会", "看排练", "听音乐放松"], weight: 12, hourRanges: [[10, 22]] },
      { location: "服装区", parentLocation: "云顶商场", activities: ["买衣服", "挑配饰", "逛街"], weight: 10, hourRanges: [[14, 19]] },
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡", "安静坐着", "看剧本", "发呆"], weight: 8, hourRanges: [[8, 17]] },
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["看电影", "看烂片", "看动画片"], weight: 8, hourRanges: [[14, 20]] },
      { location: "客厅", parentLocation: "姜朝渔住所", activities: ["撸大猫", "和朝渔玩", "看动画片", "赖在沙发上"], weight: 8, hourRanges: [[14, 22]] },
      { location: "落地窗前区域", parentLocation: "姜朝渔住所", activities: ["和朝渔看夜景", "吹风", "聊天", "发呆"], weight: 8, hourRanges: [[18, 24]] },
      { location: "一楼客厅", parentLocation: "沈家别墅", activities: ["串门", "和千金玩", "看两个小家伙", "蹭饭"], weight: 8, hourRanges: [[10, 22]] },
      { location: "二楼千金卧室", parentLocation: "沈家别墅", activities: ["找千金聊天", "逗千金", "串门"], weight: 6, hourRanges: [[10, 22]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      { location: "三楼观众席", parentLocation: "市立音乐厅", activities: ["高处看演出", "听音乐"], weight: 6, hourRanges: [[10, 22]] },
      { location: "一楼观众席", parentLocation: "市立音乐厅", activities: ["听音乐", "看演出"], weight: 5, hourRanges: [[10, 22]] },
      { location: "美食广场", parentLocation: "云顶商场", activities: ["吃饭", "觅食", "吃外卖"], weight: 5, hourRanges: [[11, 14], [17, 20]] },
      { location: "前院", parentLocation: "沈家别墅", activities: ["散步", "晒太阳", "看千金种的树"], weight: 5, hourRanges: [[6, 8], [17, 19]] },
      { location: "三楼原书房", parentLocation: "沈家别墅", activities: ["翻旧书", "找<user>小时候的照片", "发呆"], weight: 4, hourRanges: [[10, 20]] },
      { location: "后院", parentLocation: "沈家别墅", activities: ["独处", "吹风"], weight: 3, hourRanges: [[6, 8], [17, 22]] },
      { location: "人工湖岸", activities: ["散步", "吹风", "看水面", "发呆"], weight: 4, hourRanges: [[5, 8], [18, 21]] },
      { location: "环湖步道", activities: ["散步", "慢跑", "吹风"], weight: 4, hourRanges: [[5, 8], [18, 21]] },
      { location: "银杏树下步道", activities: ["散步", "看落叶", "独处"], weight: 4, hourRanges: [[6, 8], [17, 21]] },
      { location: "操场看台", activities: ["坐高处看星星", "吹风", "发呆"], weight: 3, hourRanges: [[21, 24]] },
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["点咖啡", "和陆时予闲聊", "站着喝"], weight: 3, hourRanges: [[8, 17]] },
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "安静坐着", "发呆"], weight: 3, hourRanges: [[14, 19]] },
      { location: "溜冰场", parentLocation: "云顶商场", activities: ["看别人滑冰", "散步"], weight: 3, hourRanges: [[14, 19]] },
      { location: "摩天轮区", parentLocation: "星河乐园", activities: ["坐高处看风景", "吹风"], weight: 4, hourRanges: [[10, 20]] },
      { location: "过山车区", parentLocation: "星河乐园", activities: ["坐过山车", "玩", "看风景"], weight: 3, hourRanges: [[10, 20]] },
      { location: "鬼屋", parentLocation: "星河乐园", activities: ["好奇进去看看", "玩"], weight: 2, hourRanges: [[10, 20]] },
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人喝小酒", "吃东西", "发呆"], weight: 3, hourRanges: [[18, 22]] },
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇看看", "看别人玩桌游", "凑热闹"], weight: 3, hourRanges: [[14, 19]] },
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["觅食", "逛街吃小吃", "一个人吃夜宵"], weight: 3, hourRanges: [[17, 22]] },
      { location: "一号放映厅", parentLocation: "二十四帧电影院", activities: ["看电影", "看动画片"], weight: 3, hourRanges: [[14, 20]] },
      { location: "二楼卧室", parentLocation: "姜朝渔住所", activities: ["借宿", "和朝渔聊天到深夜", "赖床"], weight: 3, hourRanges: [[18, 24]] },
      { location: "一楼玄关", parentLocation: "沈家别墅", activities: ["换鞋进门", "准备出门", "路过"], weight: 2, hourRanges: [[8, 22]] },
      { location: "校门口便利店", activities: ["买零食", "买饮料", "闲逛"], weight: 2, hourRanges: [[8, 17]] },
      { location: "游客休息区", parentLocation: "星河乐园", activities: ["坐着休息", "吃冰淇淋", "看风景"], weight: 2, hourRanges: [[10, 20]] },
    ],
    dateOverrides: [
      // 国庆假期 10/1-10/7：在家休息
      { match: { range: [10, 1, 10, 7] }, weightMultipliers: { "二楼卧室": 1.5, "一楼地毯投影区": 1.5, "二楼阳台": 1.5 } },
      // 初遇姜朝渔 10/20：和朝渔共度
      { match: { month: 10, day: 20 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和朝渔共度纪念日" } },
      // 劳动节 5/1-5/5：商圈人流量峰值
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "服装区": 2, "顶楼露台": 1.5, "美食广场": 1.5 } },
      // 平安夜/圣诞节 12/24-25：和姜朝渔过
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和朝渔过圣诞" } },
      // 跨年夜 12/31：和朝渔跨年看烂片
      { match: { month: 12, day: 31 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和朝渔跨年看烂片" } },
      // 元旦 1/1：和朝渔在家看动画片
      { match: { month: 1, day: 1 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "元旦和朝渔看动画片" } },
      // 情人节 2/14：节日模式，在家等邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "二楼卧室", parentLocation: "裴今歌住所", activity: "等待邀约" } },
      // 春节 2/8-2/14：和朝渔在家过年
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和朝渔过春节" } },
      // 被找回日 2/26：节日模式，在家感恩
      { match: { month: 2, day: 26 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "被找回日纪念" } },
      // 白色情人节 3/14：节日模式，等邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "二楼卧室", parentLocation: "裴今歌住所", activity: "等待邀约" } },
      // 杀青日 4/9：节日模式，在家庆祝
      { match: { month: 4, day: 9 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "庆祝杀青" } },
      // 清明假期 4/4-4/6：和朝渔在家
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "二楼卧室": 1.5, "二楼阳台": 1.5 } },
      // 裴今歌生日 6/21：节日模式
      { match: { month: 6, day: 21 }, festivalSpot: { location: "二楼卧室", parentLocation: "裴今歌住所", activity: "生日" } },
      // 走失日 8/14：节日模式，在阳台独处追忆
      { match: { month: 8, day: 14 }, festivalSpot: { location: "二楼阳台", parentLocation: "裴今歌住所", activity: "独自追忆走失岁月" } },
      // 七夕：节日模式，等邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "二楼卧室", parentLocation: "裴今歌住所", activity: "等待邀约" } },
    ],
  },

  // ── 姜朝渔（空闲地点池系统，全年通用）──
  姜朝渔: {
    character: "姜朝渔",
    entries: [
      { startMin: t(9, 0), endMin: t(12, 0), weekdays: MON_FRI, location: "董事长办公室", activity: "办公", parentLocation: "姜氏集团总部" },
      { startMin: t(14, 0), endMin: t(17, 0), weekdays: MON_FRI, location: "大会议室", activity: "会议", parentLocation: "姜氏集团总部" },
      { startMin: t(19, 0), endMin: t(21, 0), weekdays: [6], location: "一楼观众席", activity: "听音乐会", parentLocation: "市立音乐厅" },
      { startMin: t(14, 0), endMin: t(17, 0), weekdays: [0], location: "服装区", activity: "购物", parentLocation: "云顶商场" },
      // 深夜固定睡觉
      { startMin: t(0, 0), endMin: t(6, 0), weekdays: EVERY_DAY, location: "主卧", activity: "睡觉", parentLocation: "姜朝渔住所" },
    ],
    defaultLocation: "主卧",
    defaultParentLocation: "姜朝渔住所",
    yearRound: true,
    freeSpots: [
      // ── S级（常去）──
      { location: "客厅", parentLocation: "姜朝渔住所", activities: ["陪股东散步", "看动画片", "休息", "和股东玩", "窝在沙发上", "给股东梳毛"], weight: 22, hourRanges: [[0, 9], [18, 24]] },
      { location: "书房", parentLocation: "姜朝渔住所", activities: ["处理文件", "看书", "想事情", "规划战略", "翻商业案例"], weight: 18, hourRanges: [[0, 9], [18, 24]] },
      { location: "单人练习场", parentLocation: "利刃击剑会所", activities: ["击剑训练", "脚步练习", "专注对决", "面罩下独处", "练习突刺"], weight: 16, hourRanges: [[19, 22]] },
      // ── A级（较常出现）──
      { location: "落地窗前区域", parentLocation: "姜朝渔住所", activities: ["看夜景", "发呆", "想妈妈", "想事情", "陪股东看窗外"], weight: 12, hourRanges: [[0, 9], [18, 24]] },
      { location: "主卧", parentLocation: "姜朝渔住所", activities: ["赖床", "睡姿不雅地翻身", "窝在被子里", "和股东赖床"], weight: 10, hourRanges: [[6, 9]] },
      { location: "对练场", parentLocation: "利刃击剑会所", activities: ["对练", "实战训练", "找教练对练"], weight: 10, hourRanges: [[19, 22]] },
      { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activities: ["和今歌看烂片", "一个人看动画片", "等今歌来", "窝在地毯上"], weight: 8, hourRanges: [[18, 24]] },
      { location: "大会议室", parentLocation: "姜氏集团总部", activities: ["独自处理文件", "思考战略", "翻看旧档案", "开视频会议"], weight: 8, hourRanges: [[9, 14], [17, 18]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡", "看书", "安静坐着", "带股东路过"], weight: 5, hourRanges: [[8, 17]] },
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["看风景", "透气", "吹风", "带股东散步"], weight: 5, hourRanges: [[14, 19]] },
      { location: "办公区", parentLocation: "姜氏集团总部", activities: ["视察", "走动", "看员工", "开会"], weight: 4, hourRanges: [[9, 18]] },
      { location: "更衣室", parentLocation: "利刃击剑会所", activities: ["换装", "休息", "擦汗", "整理装备"], weight: 3, hourRanges: [[19, 22]] },
      { location: "服装区", parentLocation: "云顶商场", activities: ["买衣服", "逛街", "挑配饰", "给今歌挑衣服"], weight: 4, hourRanges: [[14, 19]] },
      { location: "二楼阳台", parentLocation: "裴今歌住所", activities: ["和今歌聊天", "吹风", "等今歌", "看星星"], weight: 4, hourRanges: [[14, 22]] },
      { location: "美食广场", parentLocation: "云顶商场", activities: ["吃饭", "觅食", "带股东觅食"], weight: 4, hourRanges: [[11, 14], [17, 20]] },
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["一个人看动画片", "看电影", "和今歌看电影"], weight: 4, hourRanges: [[14, 20]] },
      { location: "二楼观众席", parentLocation: "市立音乐厅", activities: ["听音乐", "看演出", "一个人听音乐会"], weight: 3, hourRanges: [[14, 22]] },
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["点咖啡", "站着喝", "和陆时予闲聊"], weight: 3, hourRanges: [[8, 17]] },
      { location: "三楼观众席", parentLocation: "市立音乐厅", activities: ["听音乐", "高处看演出", "一个人安静听"], weight: 2, hourRanges: [[14, 22]] },
      { location: "溜冰场", parentLocation: "云顶商场", activities: ["看别人滑冰", "散步", "带股东看热闹"], weight: 2, hourRanges: [[14, 19]] },
      { location: "二楼卧室", parentLocation: "裴今歌住所", activities: ["借宿", "和今歌聊天到深夜", "赖床"], weight: 3, hourRanges: [[18, 24]] },
      { location: "人工湖岸", activities: ["遛股东", "散步", "吹风", "看水面"], weight: 3, hourRanges: [[5, 8], [18, 21]] },
      { location: "环湖步道", activities: ["遛股东", "散步", "慢跑", "吹风"], weight: 3, hourRanges: [[5, 8], [18, 21]] },
      // ── C级（偶遇惊喜）──
      { location: "银杏树下步道", activities: ["遛股东散步", "看落叶", "吹风", "独处"], weight: 3, hourRanges: [[5, 8], [18, 21]] },
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["觅食", "吃夜宵", "带股东逛夜市"], weight: 3, hourRanges: [[18, 22]] },
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人喝小酒", "吃东西", "发呆", "想事情"], weight: 2, hourRanges: [[19, 23]] },
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇看看", "看别人玩桌游", "观察人"], weight: 2, hourRanges: [[14, 19]] },
    ],
    dateOverrides: [
      // 姜朝渔生日 9/3：节日模式
      { match: { month: 9, day: 3 }, festivalSpot: { location: "客厅", parentLocation: "姜朝渔住所", activity: "生日" } },
      // 正式接任董事长 7/1
      { match: { month: 7, day: 1 }, festivalSpot: { location: "董事长办公室", parentLocation: "姜氏集团总部", activity: "接任纪念日" } },
      // 初遇裴今歌 10/20：和今歌共度
      { match: { month: 10, day: 20 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和今歌共度纪念日" } },
      // 国庆假期 10/1-10/7：放假
      { match: { range: [10, 1, 10, 7] }, weightMultipliers: { "客厅": 1.5, "书房": 1.5, "落地窗前区域": 1.5 } },
      // 母亲忌日 12/11：在书房独处
      { match: { month: 12, day: 11 }, festivalSpot: { location: "书房", parentLocation: "姜朝渔住所", activity: "母亲忌日独处" } },
      // 平安夜/圣诞节 12/24-25：和裴今歌过
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和今歌过圣诞" } },
      // 跨年夜 12/31：和今歌跨年看烂片
      { match: { month: 12, day: 31 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "和今歌跨年看烂片" } },
      // 元旦 1/1：和今歌在家看动画片
      { match: { month: 1, day: 1 }, festivalSpot: { location: "一楼地毯投影区", parentLocation: "裴今歌住所", activity: "元旦和今歌看动画片" } },
      // 情人节 2/14：节日模式，在家等邀约
      { match: { month: 2, day: 14 }, festivalSpot: { location: "客厅", parentLocation: "姜朝渔住所", activity: "等待邀约" } },
      // 春节 2/8-2/14：和今歌在家过年
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "客厅", parentLocation: "姜朝渔住所", activity: "和今歌过春节" } },
      // 白色情人节 3/14：节日模式，等邀约
      { match: { month: 3, day: 14 }, festivalSpot: { location: "客厅", parentLocation: "姜朝渔住所", activity: "等待邀约" } },
      // 清明假期 4/4-4/6：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "书房": 1.5, "落地窗前区域": 1.5 } },
      // 劳动节 5/1-5/5：放假
      { match: { range: [5, 1, 5, 5] }, weightMultipliers: { "客厅": 1.5, "单人练习场": 1.5, "服装区": 1.5 } },
      // 七夕：节日模式，等邀约
      { match: { month: 8, day: 22 }, festivalSpot: { location: "客厅", parentLocation: "姜朝渔住所", activity: "等待邀约" } },
    ],
  },

  // ── 陆时予（全年通用，不受学期限制）──
  // 回头草咖啡老板娘，23岁，小县城出身，父母开烧烤摊
  // 从小帮工养成的松弛感与倾听习惯；酒精过敏无法做调酒师转做咖啡师
  // SCA三张证书；高中贝斯手（演出时没通电）；骑本田CB400；严重拖延症；冷笑话爱好者
  // "等价交换"原则：客人讲一个故事，换一杯等价值的咖啡
  // 特殊条件覆盖：雨天营业时段 → 回头草咖啡吧台_研磨拼配新口味
  // （当前日程系统不支持天气判断，需由正文 overrides 覆盖）
  陆时予: {
    character: "陆时予",
    yearRound: true,
    entries: [
      // 8:30-10:30 周六、周日: 咖啡豆供应商处_进货确认（不喜欢早起进货）
      { startMin: t(8, 30), endMin: t(10, 30), weekdays: [0, 6], location: "咖啡豆供应商处", activity: "周末进货确认（不情愿地早起）" },
      // 8:30-10:30 周一至周五: 陆时予公寓卧室_赖床拖延
      { startMin: t(8, 30), endMin: t(10, 30), weekdays: [1, 2, 3, 4, 5], location: "卧室", activity: "赖床拖延", parentLocation: "陆时予公寓" },
      // 10:30-20:30 周一至周日: 回头草咖啡吧台_营业（等价交换，听故事换咖啡）
      { startMin: t(10, 30), endMin: t(20, 30), weekdays: EVERY_DAY, location: "咖啡吧台", activity: "营业，手作咖啡，听客人讲故事", parentLocation: "回头草咖啡" },
      // 20:30-22:00 周一至周日: 陆时予公寓客厅_弹奏贝斯
      { startMin: t(20, 30), endMin: t(22, 0), weekdays: EVERY_DAY, location: "客厅", activity: "弹贝斯（回想没通电的演出）", parentLocation: "陆时予公寓" },
    ],
    defaultLocation: "卧室",
    defaultParentLocation: "陆时予公寓",
    // 雨天：反而去咖啡吧台研磨拼配新口味（雨天是加权而非躲避）
    weatherOverrides: [
      { condition: 'rainy', spot: { location: '咖啡吧台', parentLocation: '回头草咖啡', activity: '雨天研磨拼配新口味' } },
    ],
    freeSpots: [
      // ── S级（常去）──
      { location: "卧室", parentLocation: "陆时予公寓", activities: ["赖床", "拖延症发作", "睡到自然醒", "刷手机", "看便签里的冷笑话", "想新的冷笑话", "翻咖啡豆产地资料"], weight: 30, hourRanges: [[0, 8], [22, 24]] },
      { location: "客厅", parentLocation: "陆时予公寓", activities: ["弹贝斯", "刷冷笑话段子", "保养贝斯", "翻手机便签", "拖延症发作", "对着窗外发呆", "试新冷笑话"], weight: 20, hourRanges: [[22, 24]] },
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["研磨拼配新口味", "整理吧台", "试新豆", "清洗器具", "给念安留咖啡", "研究拉花", "试做新品", "翻咖啡笔记"], weight: 18, hourRanges: [[8, 10], [20, 22]] },
      // ── A级（较常出现）──
      { location: "地下车库专属车位", parentLocation: "陆时予公寓", activities: ["擦机车", "检查CB400", "听引擎声", "保养摩托", "调链条", "坐在车上刷手机"], weight: 12, hourRanges: [[6, 8], [20, 22]] },
      { location: "开放式厨房", parentLocation: "陆时予公寓", activities: ["煮夜宵", "泡咖啡", "吃外卖", "热剩饭", "煮泡面", "试做新菜"], weight: 12, hourRanges: [[22, 24], [6, 8]] },
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["自己坐着喝咖啡", "整理冷笑话段子", "看窗外发呆", "等念安来上班", "翻咖啡杂志"], weight: 10, hourRanges: [[8, 10]] },
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["下班后觅食", "吃夜宵", "和摊主闲聊", "买煎饼果子", "听摊主讲故事", "试新小吃"], weight: 10, hourRanges: [[22, 24]] },
      { location: "人工湖岸", activities: ["骑机车兜风", "散步吹风", "坐在岸边发呆", "看水面反光", "喝外带咖啡"], weight: 8, hourRanges: [[5, 8], [20, 22]] },
      // ── B级（偶尔出现，偶遇惊喜）──
      { location: "环湖步道", activities: ["骑机车", "散步", "慢跑", "吹风"], weight: 6, hourRanges: [[5, 8], [20, 22]] },
      { location: "银杏树下步道", activities: ["骑机车经过", "散步", "看路灯", "夜间兜风"], weight: 5, hourRanges: [[20, 23]] },
      { location: "美食广场", parentLocation: "云顶商场", activities: ["吃饭", "觅食", "逛商场", "试不同口味"], weight: 5, hourRanges: [[11, 14], [17, 20]] },
      { location: "顶楼露台", parentLocation: "云顶商场", activities: ["看风景", "透气", "吹风", "想新冷笑话"], weight: 4, hourRanges: [[14, 19]] },
      { location: "员工换装区", parentLocation: "回头草咖啡", activities: ["整理围裙", "休息", "和念安闲聊", "听念安吐槽"], weight: 3, hourRanges: [[10, 20]] },
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人喝无酒精饮料", "吃东西", "听别人讲故事", "和老板闲聊"], weight: 3, hourRanges: [[20, 23]] },
      // ── C级（偶遇惊喜）──
      { location: "二楼观众席", parentLocation: "市立音乐厅", activities: ["听音乐放松", "看演出", "找编曲灵感", "打瞌睡"], weight: 4, hourRanges: [[14, 22]] },
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝奶茶", "坐着发呆", "看窗外", "和店员闲聊"], weight: 4, hourRanges: [[14, 19]] },
      { location: "影院售票大厅", parentLocation: "二十四帧电影院", activities: ["一个人看电影", "看商业片", "吃爆米花", "找冷笑话素材"], weight: 3, hourRanges: [[14, 20]] },
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["好奇看看", "看别人玩桌游", "和店员聊冷笑话"], weight: 2, hourRanges: [[18, 22]] },
      { location: "溜冰场", parentLocation: "云顶商场", activities: ["看别人滑冰", "坐着喝咖啡", "发呆"], weight: 2, hourRanges: [[14, 19]] },
      { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["非营业时间练拉花", "试做新品咖啡", "给念安留实验品", "翻咖啡豆产地资料"], weight: 4, hourRanges: [[20, 22]] },
      { location: "服装区", parentLocation: "云顶商场", activities: ["逛街", "看衣服", "买机车配件", "逛橱窗"], weight: 3, hourRanges: [[14, 19]] },
      { location: "一号放映厅", parentLocation: "二十四帧电影院", activities: ["一个人看电影", "看音乐纪录片", "找编曲灵感"], weight: 2, hourRanges: [[14, 20]] },
      { location: "三楼观众席", parentLocation: "市立音乐厅", activities: ["高处听音乐", "一个人安静听", "打瞌睡"], weight: 2, hourRanges: [[14, 22]] },
    ],
    dateOverrides: [
      // 陆时予生日 5/18：给自己放一天假，弹贝斯吃蛋糕
      { match: { month: 5, day: 18 }, festivalSpot: { location: "客厅", parentLocation: "陆时予公寓", activity: "生日，给自己放假弹贝斯吃蛋糕" } },
      // 回头草开业日 8/8：全场饮品八折，忙碌
      { match: { month: 8, day: 8 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["开业日八折促销", "忙碌", "全天营业", "做纪念特调"], weight: 30, hourRanges: [[10, 20]] },
      ]},
      // 国庆假期 10/1-10/7：咖啡店旺季
      { match: { range: [10, 1, 10, 7] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["国庆旺季营业", "忙碌", "全天营业", "做节日特调"], weight: 30, hourRanges: [[10, 20]] },
      ]},
      // 双十一 11/11：网购咖啡豆
      { match: { month: 11, day: 11 }, weightMultipliers: { "卧室": 1.5, "客厅": 1.5 } },
      // 平安夜/圣诞节 12/24-25：咖啡店旺季
      { match: { range: [12, 24, 12, 25] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["圣诞营业", "做节日特调", "忙碌", "全天营业"], weight: 30, hourRanges: [[10, 20]] },
      ]},
      // 跨年夜 12/31：咖啡店营业到很晚
      { match: { month: 12, day: 31 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["跨年营业", "做节日特调", "忙碌", "全天营业"], weight: 30, hourRanges: [[10, 22]] },
      ]},
      // 元旦 1/1：放假1天，弹贝斯休息
      { match: { month: 1, day: 1 }, festivalSpot: { location: "客厅", parentLocation: "陆时予公寓", activity: "元旦休息，弹贝斯" } },
      // 情人节 2/14：咖啡店旺季
      { match: { month: 2, day: 14 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["情人节旺季营业", "做情侣特调", "忙碌", "全天营业"], weight: 30, hourRanges: [[10, 20]] },
      ]},
      // 春节 2/8-2/14：回老家帮父母看烧烤摊
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "客厅", parentLocation: "陆时予公寓", activity: "回老家帮父母看烧烤摊" } },
      // 白色情人节 3/14：咖啡店旺季
      { match: { month: 3, day: 14 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["白色情人节营业", "做情侣特调", "忙碌"], weight: 25, hourRanges: [[10, 20]] },
      ]},
      // 清明假期 4/4-4/6：放假3天
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "卧室": 1.5, "客厅": 1.5, "咖啡吧台": 0.5 } },
      // 劳动节 5/1-5/5：咖啡店旺季
      { match: { range: [5, 1, 5, 5] }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["劳动节旺季营业", "忙碌", "全天营业", "做节日特调"], weight: 30, hourRanges: [[10, 20]] },
      ]},
      // 七夕：咖啡店旺季
      { match: { month: 8, day: 22 }, extraSpots: [
        { location: "咖啡吧台", parentLocation: "回头草咖啡", activities: ["七夕旺季营业", "做情侣特调", "忙碌", "全天营业"], weight: 30, hourRanges: [[10, 20]] },
      ]},
    ],
  },

  // ── 许不倦（空闲地点池系统）──
  // 燕大形势与政策任课教师，一心想安稳躺平到退休
  // 学期内有固定课程，假期全面宅家
  许不倦: {
    character: "许不倦",
    entries: [
      // ── 深夜固定睡觉 ──
      { startMin: t(0, 0), endMin: t(8, 30), weekdays: EVERY_DAY, location: "卧室", activity: "睡觉", parentLocation: "许不倦公寓" },
      // ── 上午 8:30-10:05 ──
      // 周一、三: 上大班课（念PPT与肝手游）
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [1, 3], location: "C301多媒体教室", activity: "上大班课（念PPT与肝手游）" },
      // 周二、四、五: 睡懒觉
      { startMin: t(8, 30), endMin: t(10, 5), weekdays: [2, 4, 5], location: "卧室", activity: "睡懒觉", parentLocation: "许不倦公寓" },
      // ── 上午 10:30-12:00 ──
      // 周一、三: 教研室工位摸鱼
      { startMin: t(10, 30), endMin: t(12, 0), weekdays: [1, 3], location: "燕大形势与政策教研室", activity: "工位摸鱼" },
      // 周二、四、五: 继续睡
      { startMin: t(10, 30), endMin: t(12, 0), weekdays: [2, 4, 5], location: "卧室", activity: "睡觉", parentLocation: "许不倦公寓" },
      // ── 下午 14:30-16:05 ──
      // 周二、四: 下午两点半的催眠课
      { startMin: t(14, 30), endMin: t(16, 5), weekdays: [2, 4], location: "A101阶梯教室", activity: "上大班课（下午两点半的催眠课）" },
      // ── 傍晚 16:30-18:05 周一至周五 ──
      { startMin: t(16, 30), endMin: t(18, 5), weekdays: MON_FRI, location: "客厅", activity: "肝手游与吃外卖", parentLocation: "许不倦公寓" },
      // ── 晚间 18:30-22:00 周一至周五 ──
      { startMin: t(18, 30), endMin: t(22, 0), weekdays: MON_FRI, location: "卧室", activity: "肝手游", parentLocation: "许不倦公寓" },
      // ── 周末：全天宅家 ──
      { startMin: t(10, 0), endMin: t(18, 0), weekdays: [0, 6], location: "客厅", activity: "清日常与应对父母催婚电话", parentLocation: "许不倦公寓" },
      { startMin: t(18, 30), endMin: t(22, 0), weekdays: [0, 6], location: "卧室", activity: "肝手游", parentLocation: "许不倦公寓" },
    ],
    defaultLocation: "卧室",
    defaultParentLocation: "许不倦公寓",
    freeSpots: [
      // ── S级（常去）──
      { location: "卧室", parentLocation: "许不倦公寓", activities: ["肝手游", "赖床", "刷手机", "补觉", "玩放置类手游", "抽SSR", "查老家天气"], weight: 30, hourRanges: [[0, 8], [22, 24]] },
      { location: "客厅", parentLocation: "许不倦公寓", activities: ["肝手游", "吃外卖", "看电视", "清日常", "瘫沙发", "躲领导电话"], weight: 22, hourRanges: [[14, 22]] },
      // ── A级（较常出现）──
      { location: "燕大形势与政策教研室", activities: ["工位摸鱼", "念PPT", "肝手游", "看学生请假条", "蹭空调", "给请假条打分", "和同事嗑瓜子"], weight: 18, hourRanges: [[10, 16]] },
      { location: "厨房", parentLocation: "许不倦公寓", activities: ["煮泡面", "热外卖", "找水果软糖", "泡茶", "煮速冻水饺"], weight: 12, hourRanges: [[7, 9], [17, 20]] },
      { location: "食堂二楼", activities: ["吃饭", "蹭空调", "看学生编请假理由", "和同事闲聊"], weight: 12, hourRanges: [[11, 14]] },
      { location: "C301多媒体教室", activities: ["念PPT", "肝手游", "备课（摸鱼式）", "在讲台上抽卡"], weight: 10, hourRanges: [[8, 10]] },
      // ── B级（偶尔出现）──
      { location: "小区门禁入口", parentLocation: "许不倦公寓", activities: ["取外卖", "拿快递", "下楼透气", "等外卖小哥"], weight: 8, hourRanges: [[11, 13], [17, 19]] },
      { location: "校门口便利店", activities: ["买零食", "买饮料", "买水果软糖", "闲逛"], weight: 8, hourRanges: [[8, 17]] },
      { location: "A101阶梯教室", activities: ["念PPT", "肝手游", "催眠讲课", "在讲台上肝手游"], weight: 8, hourRanges: [[14, 16]] },
      { location: "图书馆三楼经管法学区", activities: ["翻杂志", "蹭空调", "假装查资料", "打瞌睡"], weight: 7, hourRanges: [[10, 17]] },
      { location: "靠窗座位区", parentLocation: "回头草咖啡", activities: ["喝咖啡", "发呆", "看路人", "肝手游"], weight: 7, hourRanges: [[14, 18]] },
      { location: "二楼落地窗座位区", parentLocation: "鹿角奶茶店", activities: ["喝无糖奶茶", "肝手游", "看窗外发呆"], weight: 6, hourRanges: [[14, 19]] },
      // ── C级（偶遇惊喜）──
      { location: "食堂三楼", activities: ["换口味吃饭", "蹭空调", "一个人吃小火锅"], weight: 5, hourRanges: [[11, 14]] },
      { location: "食堂一楼", activities: ["随便吃点", "蹭空调"], weight: 4, hourRanges: [[11, 14]] },
      { location: "银杏树下步道", activities: ["散步消食", "看落叶", "踩银杏果"], weight: 5, hourRanges: [[16, 18]] },
      { location: "B206教室", activities: ["代同事点名", "念PPT", "看看有没有人请假"], weight: 4, hourRanges: [[8, 12]] },
      { location: "图书馆一楼借还台", activities: ["借杂志", "还书", "顺便蹭空调"], weight: 3, hourRanges: [[10, 17]] },
      { location: "操场看台", activities: ["看学生体测", "幸灾乐祸", "坐着肝手游"], weight: 3, hourRanges: [[14, 17]] },
      { location: "美食广场", parentLocation: "云顶商场", activities: ["觅食", "吃快餐", "顺便逛逛"], weight: 4, hourRanges: [[11, 14], [17, 20]] },
      { location: "流动小吃摊位区", parentLocation: "南门小吃街", activities: ["买煎饼果子", "吃烤冷面", "边走边吃"], weight: 4, hourRanges: [[17, 20]] },
      { location: "居酒屋吧台", parentLocation: "落日居酒屋", activities: ["一个人吃东西", "喝无酒精饮料", "发呆"], weight: 3, hourRanges: [[18, 21]] },
      { location: "宿管台", activities: ["和宿管闲聊", "打听学生八卦", "蹭空调"], weight: 3, hourRanges: [[10, 16]] },
      { location: "地下二层展示区", parentLocation: "龙与骰子桌游卡牌店", activities: ["看热闹", "好奇旁观", "问有没有放置类桌游"], weight: 2, hourRanges: [[14, 19]] },
      { location: "C204自习室", activities: ["假装巡视", "实际在肝手游", "看看谁在摸鱼"], weight: 2, hourRanges: [[10, 16]] },
      { location: "图书馆四楼自习区", activities: ["找角落补觉", "蹭空调", "假装看书"], weight: 2, hourRanges: [[12, 17]] },
    ],
    dateOverrides: [
      // 生日 11/20：照常上课后在教研室玩手游
      { match: { month: 11, day: 20 }, festivalSpot: { location: "燕大形势与政策教研室", activity: "生日，照常上课后在教研室玩放置类手游" } },
      // 扣薪日 5/25：被督导逮到扣五百块
      { match: { month: 5, day: 25 }, festivalSpot: { location: "燕大形势与政策教研室", activity: "扣薪日，一年前的今天被督导逮到扣了五百块" } },
      // 留校确认日 6/10：导师通知留校任教
      { match: { month: 6, day: 10 }, festivalSpot: { location: "燕大形势与政策教研室", activity: "留校确认日，导师通知获得青苗计划名额" } },
      // 国庆假期 10/1-10/7：宅家
      { match: { range: [10, 1, 10, 7] }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "国庆假期宅家肝手游" } },
      // 双十一 11/11：网购
      { match: { month: 11, day: 11 }, weightMultipliers: { "卧室": 2, "客厅": 2 } },
      // 平安夜/圣诞节 12/24-25：宅家
      { match: { range: [12, 24, 12, 25] }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "圣诞节宅家肝手游" } },
      // 跨年夜 12/31：宅家跨年
      { match: { month: 12, day: 31 }, festivalSpot: { location: "卧室", parentLocation: "许不倦公寓", activity: "跨年肝手游" } },
      // 元旦 1/1：放假
      { match: { month: 1, day: 1 }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "元旦放假宅家" } },
      // 情人节 2/14：宅家
      { match: { month: 2, day: 14 }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "情人节宅家清日常" } },
      // 春节 2/8-2/14：回老家应付催婚
      { match: { range: [2, 8, 2, 14] }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "春节回老家应付催婚" } },
      // 白色情人节 3/14：宅家
      { match: { month: 3, day: 14 }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "白色情人节宅家" } },
      // 清明假期 4/4-4/6：宅家
      { match: { range: [4, 4, 4, 6] }, weightMultipliers: { "卧室": 1.5, "客厅": 1.5 } },
      // 劳动节 5/1-5/5：宅家
      { match: { range: [5, 1, 5, 5] }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "劳动节宅家肝手游" } },
      // 七夕：宅家
      { match: { month: 8, day: 22 }, festivalSpot: { location: "客厅", parentLocation: "许不倦公寓", activity: "七夕宅家清日常" } },
      // 寒假 1/16-2/20：宅家
      { match: { range: [1, 16, 2, 20] }, extraSpots: [
        { location: "客厅", parentLocation: "许不倦公寓", activities: ["寒假宅家", "肝手游", "应付催婚", "清日常"], weight: 25, hourRanges: [[8, 22]] },
        { location: "卧室", parentLocation: "许不倦公寓", activities: ["肝手游", "赖床", "补觉", "刷手机"], weight: 20, hourRanges: [[0, 8], [22, 24]] },
      ]},
      // 暑假 7-8月：宅家
      { match: { range: [7, 1, 8, 31] }, extraSpots: [
        { location: "客厅", parentLocation: "许不倦公寓", activities: ["暑假宅家", "肝手游", "清日常", "看电视"], weight: 25, hourRanges: [[8, 22]] },
        { location: "卧室", parentLocation: "许不倦公寓", activities: ["肝手游", "赖床", "补觉", "刷手机"], weight: 20, hourRanges: [[0, 8], [22, 24]] },
      ]},
    ],
  },
};

// ============================================================
// 查询函数
// ============================================================

/**
 * 将 JS Date 的 getDay() (0=周日) 转为中文星期
 */
export function weekdayToChinese(day: number): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][day] || "";
}

/**
 * 检查当前是否在学期内
 * - 上学期：9月 - 次年1月
 * - 下学期：2月 - 6月
 * - 假期：7月 - 8月
 */
export function isDuringSemester(date: Date): boolean {
  const month = date.getMonth() + 1; // 1-12
  return (month >= 9 || month <= 1) || (month >= 2 && month <= 6);
}

/**
 * 获取当前学期类型
 */
export function getSemesterType(date: Date): "上学期" | "下学期" | "假期" {
  const month = date.getMonth() + 1;
  if (month >= 9 || month <= 1) return "上学期";
  if (month >= 2 && month <= 6) return "下学期";
  return "假期";
}

/** 角色特化天气覆盖：恶劣天气下特定角色的固定行为 */
type WeatherOverride = {
  /** 触发条件：恶劣天气 / 雨天 */
  condition: 'badWeather' | 'rainy';
  /** 覆盖后的固定地点（类似 festivalSpot） */
  spot: {
    location: string;
    parentLocation?: string;
    activity: string;
  };
};

export type CharacterLocation = {
  character: string;
  location: string;
  activity: string;
  isFree: boolean; // true=空闲/随机位置
  /** 父地点名（仅当位置由正文 overrides 提供时有值，用于区分同名子位置） */
  parentLocation?: string;
};

/**
 * 获取某个角色在指定时间的位置
 *
 * 查询优先级：正文覆盖 > 节日模式 > 核心日程 > 空闲地点池 > defaultLocation
 *
 * @param character 角色名
 * @param date 游戏时间
 * @param overrides 正文中解析出的角色位置覆盖（优先于日程表）
 * @returns 位置信息，如果角色没有日程则返回 null
 */
export function getCharacterLocation(
  character: string,
  date: Date,
  overrides?: Record<string, string>,
): CharacterLocation | null {
  // ── 1. 正文位置覆盖（最高优先级）──
  if (overrides && overrides[character]) {
    const overrideLoc = overrides[character];
    const slashIdx = overrideLoc.indexOf('/');
    if (slashIdx !== -1) {
      const parent = overrideLoc.substring(0, slashIdx);
      const spot = overrideLoc.substring(slashIdx + 1);
      return { character, location: spot, parentLocation: parent, activity: '剧情中', isFree: false };
    }
    return { character, location: overrideLoc, activity: '剧情中', isFree: false };
  }

  const schedule = CHARACTER_SCHEDULES[character];
  if (!schedule) return null;

  // ── 2. 节日模式（优先于日程和空闲池）──
  const dateOverride = matchDateOverride(schedule.dateOverrides, date);
  if (dateOverride?.festivalSpot) {
    return {
      character,
      location: dateOverride.festivalSpot.location,
      parentLocation: dateOverride.festivalSpot.parentLocation,
      activity: dateOverride.festivalSpot.activity,
      isFree: false,
    };
  }

  // ── 2.5 天气覆盖（恶劣天气下特定角色的固定行为，优先于核心日程）──
  const weather = getWeather(date);
  if (schedule.weatherOverrides) {
    for (const wo of schedule.weatherOverrides) {
      const matched = wo.condition === 'rainy' ? isRainyWeather(weather) : isBadWeather(weather);
      if (matched) {
        console.info(`[WeatherOverride] ${character} 天气=${weather.type} → ${wo.spot.location}`);
        return {
          character,
          location: wo.spot.location,
          parentLocation: wo.spot.parentLocation,
          activity: wo.spot.activity,
          isFree: false,
        };
      }
    }
  }

  // ── 3. 核心日程（学期内 或 yearRound）──
  if (isDuringSemester(date) || schedule.yearRound) {
    const weekday = date.getDay();
    const nowMin = date.getHours() * 60 + date.getMinutes();

    for (const entry of schedule.entries) {
      if (!entry.weekdays.includes(weekday)) continue;
      if (entry.isFree) continue;

      if (entry.overnight && (nowMin >= entry.startMin || nowMin < entry.endMin)) {
        return { character, location: entry.location, parentLocation: entry.parentLocation, activity: entry.activity, isFree: false };
      }
      if (!entry.overnight && nowMin >= entry.startMin && nowMin < entry.endMin) {
        return { character, location: entry.location, parentLocation: entry.parentLocation, activity: entry.activity, isFree: false };
      }
    }
  }

  // ── 4. 空闲地点池（按权重随机选择，受天气影响）──
  if (schedule.freeSpots && schedule.freeSpots.length > 0) {
    const freeResult = selectFreeSpot(character, schedule, date, dateOverride, weather);
    if (freeResult) return freeResult;
  }

  // ── 5. 回退：defaultLocation ──
  return {
    character,
    location: schedule.defaultLocation || "",
    parentLocation: schedule.defaultParentLocation,
    activity: "空闲",
    isFree: true,
  };
}

/**
 * 获取所有角色在指定时间的位置
 *
 * @param date 游戏时间
 * @param overrides 正文中解析出的角色位置覆盖（优先于日程表）
 * @returns 角色位置列表（不包含空闲/随机的角色，除非有 defaultLocation）
 */
export function getAllCharacterLocations(
  date: Date,
  overrides?: Record<string, string>,
): CharacterLocation[] {
  const results: CharacterLocation[] = [];
  for (const character of Object.keys(CHARACTER_SCHEDULES)) {
    const loc = getCharacterLocation(character, date, overrides);
    if (loc && !loc.isFree) {
      results.push(loc);
    } else if (loc && loc.isFree && loc.location) {
      // 有默认位置的空闲角色也加入
      results.push(loc);
    }
  }
  return results;
}

/**
 * 获取在指定地点的所有角色
 *
 * @param spotName 地点名（匹配 LOCATION_INTERIORS / AREA_SPOTS 中的 name）
 * @param date 游戏时间
 * @param overrides 正文中解析出的角色位置覆盖（优先于日程表）
 * @param parentLocation 父地点名，用于区分不同父地点下的同名子位置（如"主卧"）
 * @returns 在该地点的角色列表
 */
export function getCharactersAtSpot(
  spotName: string,
  date: Date,
  overrides?: Record<string, string>,
  parentLocation?: string,
): CharacterLocation[] {
  const all = getAllCharacterLocations(date, overrides);
  return all.filter(loc => {
    if (loc.location !== spotName) return false;
    // 如果角色有 parentLocation（来自正文 overrides）且传入了 parentLocation，需要精确匹配父层级
    if (loc.parentLocation && parentLocation) {
      return loc.parentLocation === parentLocation;
    }
    return true;
  });
}
