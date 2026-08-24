/**
 * 成就定义 — 债务成就系统
 *
 * 成就系统是纯前端元层，通过监听 GameContext 状态变化或解析 AI 输出的
 * <achievement>标签 来触发解锁，不修改 MVU schema。
 *
 * 存储方式与 nsfwUnlocked 一致：聊天变量 {type:'chat'} 中
 *
 * 奖杯等级：铜杯 < 银杯 < 金杯 < 白金杯
 *
 * 触发方式：
 * - mvu_check：前端自动检测
 * - ai_tag：AI 输出 <achievement>编号</achievement> 标签触发，编号对应成就的 no 字段
 */

// ── 成就类别 ──
export type AchievementCategory = '还款' | '遭遇';

// ── 奖杯等级 ──
export type AchievementTier = '铜杯' | '银杯' | '金杯' | '白金杯';

// ── 触发方式 ──
export type AchievementTrigger =
  | 'mvu_check'    // 前端检测 GameContext 状态
  | 'ai_tag';      // AI 输出 <achievement>编号</achievement> 标签

// ── 成就定义 ──
export interface AchievementDef {
  /** 成就编号（用于 AI 触发：<achievement>编号</achievement>） */
  no: number;
  /** 唯一 ID */
  id: string;
  /** 成就名称 */
  name: string;
  /** 幽默描述 */
  description: string;
  /** 触发条件（玩家可见的解锁条件说明） */
  condition: string;
  /** 类别 */
  category: AchievementCategory;
  /** 奖杯等级（仅用于卡片配色） */
  tier: AchievementTier;
  /** 触发方式 */
  trigger: AchievementTrigger;
  /**
   * 前端检测函数（trigger='mvu_check' 时有效）
   * 接收从 GameContext 构建的快照数据，返回 true = 满足解锁条件
   */
  check?: (snapshot: AchievementSnapshot) => boolean;
}

// ── 游戏状态快照（检测时传入） ──
export interface AchievementSnapshot {
  /** 经济.累计收入 */
  totalIncome: number;
  /** 经济.剩余债务 */
  remainingDebt: number;
  /** 经济.总债务 */
  totalDebt: number;
  /** 当前订单价格（无订单时为 0） */
  currentOrderPrice: number;
  /** 当前订单客户名（无订单时为空） */
  currentOrderCustomer: string;
  /** 状态.当前地点 */
  currentLocation: string;
  /** 角色数据：角色名 → 服务状态 */
  characterStates: Record<string, {
    服务状态: '无服务' | '未开始' | '进行中';
    剩余服务小时: number;
    剩余服务分钟: number;
  }>;
  /** 游戏时间 */
  gameTime: Date | null;
}

// ── 奖杯等级 → 波普配色映射 ──
export const TIER_COLORS: Record<AchievementTier, { bg: string; text: string; border: string }> = {
  '铜杯': { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-900' },
  '银杯': { bg: 'bg-gray-300', text: 'text-pop-black', border: 'border-gray-500' },
  '金杯': { bg: 'bg-pop-yellow', text: 'text-pop-black', border: 'border-pop-black' },
  '白金杯': { bg: 'bg-purple-200', text: 'text-pop-black', border: 'border-purple-400' },
};

// ── 成就列表 ──
export const ACHIEVEMENTS: AchievementDef[] = [
  // ════════ 基础还款成就 ════════

  {
    no: 1,
    id: 'first_bucket',
    name: '第一桶金',
    description: '区区几千块，也就够吃顿好的……等等，把这钱填进三亿的窟窿里，连个水花都看不见啊！',
    condition: '累计收入大于0',
    category: '还款',
    tier: '铜杯',
    trigger: 'mvu_check',
    check: (s) => s.totalIncome > 0,
  },

  {
    no: 2,
    id: 'cyber_worker',
    name: '赛博包身工',
    description: '资本家看了落泪，生产队的驴看了直呼内行。为了还债，你已经是个成熟的打灰机器了。',
    condition: '累计服务时长达到100小时',
    category: '还款',
    tier: '铜杯',
    trigger: 'ai_tag',
  },

  {
    no: 3,
    id: 'small_goal',
    name: '小目标达成',
    description: '王首富诚不欺我，原来一个小目标真的这么容易……个鬼啊！这可是卖笑卖出来的血汗钱！',
    condition: '累计收入达到1亿',
    category: '还款',
    tier: '银杯',
    trigger: 'mvu_check',
    check: (s) => s.totalIncome >= 100_000_000,
  },

  {
    no: 4,
    id: 'sister_smile',
    name: '千金的笑容',
    description: '妹妹看你的眼神终于从"看垃圾"变成了"看能赚钱的垃圾"。可喜可贺，可喜可贺。',
    condition: '累计收入达到1.5亿',
    category: '还款',
    tier: '金杯',
    trigger: 'mvu_check',
    check: (s) => s.totalIncome >= 150_000_000,
  },

  {
    no: 5,
    id: 'debt_free',
    name: '三亿大负翁的逆袭',
    description: '恭喜你！经过不懈的努力，你终于从一个欠债三个亿的穷光蛋，变成了一个身无分文的普通穷光蛋！',
    condition: '剩余债务归零',
    category: '还款',
    tier: '白金杯',
    trigger: 'mvu_check',
    check: (s) => s.remainingDebt <= 0,
  },

  // ════════ 特殊遭遇成就 ════════

  {
    no: 6,
    id: 'charity_or_sucker',
    name: '慈善家还是大冤种？',
    description: '到底是你去提供服务，还是你去精准扶贫？两百块钱连妹妹的内增高都买不起！',
    condition: '接到价格低于500的订单',
    category: '遭遇',
    tier: '铜杯',
    trigger: 'mvu_check',
    check: (s) => s.currentOrderPrice > 0 && s.currentOrderPrice < 500,
  },

  {
    no: 7,
    id: 'sugar_mommy',
    name: '富婆，饿饿，饭饭',
    description: '医生说你胃不好，这碗软饭不仅得吃，还得吃得优雅，吃得理直气壮。',
    condition: '接到价格50万以上的订单',
    category: '遭遇',
    tier: '银杯',
    trigger: 'mvu_check',
    check: (s) => s.currentOrderPrice >= 500_000,
  },

  {
    no: 8,
    id: 'hot_money',
    name: '这钱烫手啊！',
    description: '赚钱嘛，不寒碜。但为了赚钱把命搭进去，是不是有点太拼了？',
    condition: '服务期间发生修罗场',
    category: '遭遇',
    tier: '银杯',
    trigger: 'ai_tag',
  },

  {
    no: 9,
    id: 'no_more',
    name: '我真的一滴也没有了',
    description: '铁打的肾也扛不住这么连轴转。建议用赚来的钱先给自己挂个男科专家号。',
    condition: '连续接单一周无休',
    category: '遭遇',
    tier: '金杯',
    trigger: 'ai_tag',
  },

  {
    no: 10,
    id: 'welcome_to_real_world',
    name: '欢迎来到真实世界',
    description: '大富翁变大负翁只需一秒钟。你的超大液晶电视和妹妹的内增高鞋，现在都在二手市场里流泪。',
    condition: '首次阅读跑路字条',
    category: '遭遇',
    tier: '铜杯',
    trigger: 'ai_tag',
  },
];

// ── 工具函数 ──

/** 按 ID 获取成就定义 */
export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

/** 按编号获取成就定义 */
export function getAchievementByNo(no: number): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.no === no);
}

/**
 * 解析成就触发标识：支持编号（如 "1"）和 ID（如 "first_bucket"）两种格式
 * @returns 匹配到的成就定义，未匹配返回 undefined
 */
export function resolveAchievementTrigger(raw: string): AchievementDef | undefined {
  const trimmed = raw.trim();
  // 先尝试按编号匹配（纯数字）
  const num = parseInt(trimmed, 10);
  if (!isNaN(num)) {
    const def = getAchievementByNo(num);
    if (def) return def;
  }
  // 再按 ID 匹配
  return getAchievementById(trimmed);
}

/**
 * 生成成就触发列表文本，供 AI 参考使用
 * 格式：编号. 成就名 — 描述
 */
export function getAchievementTriggerList(): string {
  return ACHIEVEMENTS.map(a => `${a.no}. ${a.name}（${a.tier}）— ${a.description}`).join('\n');
}

/** 获取已解锁成就列表 */
export function getUnlockedDefs(unlockedIds: string[]): AchievementDef[] {
  return ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
}

/** 获取未解锁成就列表 */
export function getLockedDefs(unlockedIds: string[]): AchievementDef[] {
  return ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));
}

/** 按类别分组 */
export function getAchievementsByCategory(unlockedIds: string[]): Record<AchievementCategory, AchievementDef[]> {
  const result = {} as Record<AchievementCategory, AchievementDef[]>;
  for (const cat of ['还款', '遭遇'] as AchievementCategory[]) {
    result[cat] = ACHIEVEMENTS.filter(a => a.category === cat);
  }
  return result;
}
