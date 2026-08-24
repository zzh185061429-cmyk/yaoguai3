import { CHARACTER_AVATARS, CHARACTER_COLORS, getCharacterSprite } from '../data/characterData';
import type { NsfwPhase } from '../data/characterData';

export type LineType = 'narrator' | 'dialog' | 'thought';

export interface ScriptLine {
  type: LineType;
  speaker?: string;
  emotion?: string;
  text: string;
  color?: string;
  avatar?: string;
  sprite?: string;
  /** 场景地点（由 [scene:父地点/子地点] 标签解析，后续句子继承） */
  location?: { parent: string; spot?: string };
  /** NSFW 阶段（由 [nsfw:角色名:阶段名] 或 [nsfw:阶段名] 标签解析，后续句子继承；undefined 表示非 NSFW） */
  nsfwPhase?: NsfwPhase;
  /** NSFW 对应角色名（由 [nsfw:角色名:阶段名] 标签解析；未指定时 undefined，回退到地点匹配） */
  nsfwCharacter?: string;
  /**
   * 成就触发标识列表（由 <achievement>编号或ID</achievement> 标签解析）
   * 当玩家点击推进到本行时触发解锁，不显示给玩家
   * 标签后方有可见行 → 附加到下一行；标签在末尾 → 附加到上一行
   */
  achievementTriggers?: string[];
}

/** 角色名[情绪]:"对话内容" */
const DIALOG_RE = /^(.+?)\[(.+?)\]:"(.+)"$/s;

/** <user>:"对话内容" — <user> 不需要情绪标签 */
const USER_DIALOG_RE = /^<user>:"(.+)"$/s;

/** 角色名[情绪]:*内心独白* */
const THOUGHT_RE = /^(.+?)\[(.+?)\]:\*(.+)\*$/s;

/** <user>:*内心独白* — <user> 不需要情绪标签 */
const USER_THOUGHT_RE = /^<user>:\*(.+)\*$/s;

/** [scene:父地点/子地点] 或 [scene:父地点] — 场景标签，不显示给玩家 */
const SCENE_RE = /^\[scene:([^/\]]+)(?:\/([^\]]+))?\]$/;

/** [nsfw:角色名:阶段名] 或 [nsfw:阶段名](向后兼容) — NSFW 阶段标签，不显示给玩家，用于自动切换 CG 背景 */
const NSFW_RE = /^\[nsfw:(?:(.+?):)?(开始|脱衣服|插入|高潮|事后)\]$/;

/** <achievement>编号或ID</achievement> — 成就触发标签，不显示给玩家，附加到相邻可见行 */
const ACHIEVEMENT_RE = /^<achievement>([^<]+?)<\/achievement>$/;

/**
 * 需要从解析前移除的思维/规划标签对及其内容
 * [开始标记, 结束标记]
 */
const STRIP_PAIRS: [string, string][] = [
  ['<Chain_of_Thought>', '</Chain_of_Thought>'],
  ['<draft>', '</draft>'],
  ['<think>', '</think>'],
  ['<thinking>', '</thinking>'],
  ['<simple_thinking>', '</simple_thinking>'],
  // <konatan_planning~> 由 cutAboveKonatanEnd 特殊处理，不走正则删除
];

/** 转义正则特殊字符 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 在提取正文之前清理原始文本：
 * 1. 切掉 </konatan_planning~> 及之前的所有内容
 * 2. 删除所有思维/规划标签对及其内容
 *
 * 这样即使思维链内部出现了 <content> 也不会干扰正文提取
 */
function stripThinkingZones(raw: string): string {
  let text = raw;

  // ── 切掉 </konatan_planning~>（含）之前的所有内容 ──
  const konatanEnd = text.indexOf('</konatan_planning~>');
  if (konatanEnd !== -1) {
    text = text.slice(konatanEnd + '</konatan_planning~>'.length);
  }

  // ── 删除所有思维标签对 ──
  for (const [open, close] of STRIP_PAIRS) {
    const re = new RegExp(escapeRegExp(open) + '[\\s\\S]*?' + escapeRegExp(close), 'gi');
    text = text.replace(re, '');
  }

  return text;
}

/**
 * 从 AI 消息文本中提取 <content> 标签内的剧本内容，解析为 ScriptLine[]
 * 按换行切段，一行 = 一次点击推进
 * 支持角色名[情绪]:"对话" 和 <user>:"对话" 两种格式
 * 支持 [scene:父地点/子地点] 场景标签（不显示给玩家，仅用于背景切换）
 *
 * @param rawText AI 消息原始文本
 * @param playerName 玩家自定义名字（可选）。用于识别 AI 输出中以玩家名作为说话人的行（如"张三[开心]:\"...\""）
 */
export function parseScriptContent(rawText: string, playerName?: string): ScriptLine[] {
  const cleaned = stripThinkingZones(rawText);
  const contentMatch = cleaned.match(/<content>([\s\S]*?)<\/content>/);
  if (!contentMatch) return [];

  const content = contentMatch[1].trim();
  const segments = content.split(/\n/).filter(s => s.trim());

  const result: ScriptLine[] = [];
  let currentLocation: { parent: string; spot?: string } | undefined;
  let currentNsfwPhase: NsfwPhase | undefined;
  let currentNsfwCharacter: string | undefined;
  // 待附加的成就触发标识：遇到 <achievement> 标签时暂存，附加到下一个可见行
  // 若标签在末尾无后续行，则附加到最后一个可见行
  let pendingAchievements: string[] = [];

  for (const segment of segments) {
    const trimmed = segment.trim();

    // 0. 场景标签：更新当前地点，不生成 ScriptLine
    //    AI 输出可能用玩家名代替 <user>（如 [scene:沈家别墅/二楼张三卧室]），
    //    地点查图时由 getLocationImage 的 <user>→玩家名 模糊匹配处理
    const sceneMatch = trimmed.match(SCENE_RE);
    if (sceneMatch) {
      currentLocation = {
        parent: sceneMatch[1].trim(),
        spot: sceneMatch[2]?.trim() || undefined,
      };
      // 场景切换时清除 NSFW 阶段和角色（离开 NSFW 场景）
      currentNsfwPhase = undefined;
      currentNsfwCharacter = undefined;
      continue;
    }

    // 0.5 NSFW 阶段标签：更新当前 NSFW 阶段和角色，不生成 ScriptLine
    //    格式 [nsfw:角色名:阶段名] 或 [nsfw:阶段名](向后兼容，角色由地点推断)
    const nsfwMatch = trimmed.match(NSFW_RE);
    if (nsfwMatch) {
      currentNsfwPhase = nsfwMatch[2] as NsfwPhase;
      currentNsfwCharacter = nsfwMatch[1]?.trim() || undefined;
      continue;
    }

    // 0.6 成就触发标签：暂存到 pendingAchievements，附加到下一个可见行
    const achMatch = trimmed.match(ACHIEVEMENT_RE);
    if (achMatch) {
      pendingAchievements.push(achMatch[1].trim());
      continue;
    }

    /** 将暂存的成就触发标识附加到即将创建的 ScriptLine，并清空暂存 */
    const consumePending = (): string[] | undefined =>
      pendingAchievements.length > 0 ? (pendingAchievements.splice(0)) : undefined;

    // 1. 优先匹配带情绪的对话：角色名[情绪]:"对话"
    const dialogMatch = trimmed.match(DIALOG_RE);
    if (dialogMatch) {
      const speaker = dialogMatch[1].trim();
      const emotion = dialogMatch[2].trim();
      result.push({
        type: 'dialog' as const,
        speaker,
        emotion,
        text: dialogMatch[3],
        color: CHARACTER_COLORS[speaker] || 'bg-pop-cyan',
        avatar: isUser(speaker, playerName) ? undefined : CHARACTER_AVATARS[speaker],
        sprite: isUser(speaker, playerName) ? undefined : getCharacterSprite(speaker, emotion),
        location: currentLocation,
        nsfwPhase: currentNsfwPhase,
        nsfwCharacter: currentNsfwCharacter,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 2. 匹配 <user> 对话：<user>:"对话"（无情绪）
    const userDialogMatch = trimmed.match(USER_DIALOG_RE);
    if (userDialogMatch) {
      result.push({
        type: 'dialog' as const,
        speaker: '<user>',
        text: userDialogMatch[1],
        color: 'bg-pop-cyan',
        location: currentLocation,
        nsfwPhase: currentNsfwPhase,
        nsfwCharacter: currentNsfwCharacter,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 3. 匹配带情绪的心理：角色名[情绪]:*心理*
    const thoughtMatch = trimmed.match(THOUGHT_RE);
    if (thoughtMatch) {
      const speaker = thoughtMatch[1].trim();
      const emotion = thoughtMatch[2].trim();
      result.push({
        type: 'thought' as const,
        speaker,
        emotion,
        text: thoughtMatch[3],
        color: CHARACTER_COLORS[speaker] || 'bg-pop-cyan',
        avatar: isUser(speaker, playerName) ? undefined : CHARACTER_AVATARS[speaker],
        sprite: isUser(speaker, playerName) ? undefined : getCharacterSprite(speaker, emotion),
        location: currentLocation,
        nsfwPhase: currentNsfwPhase,
        nsfwCharacter: currentNsfwCharacter,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 4. 匹配 <user> 心理：<user>:*心理*（无情绪）
    const userThoughtMatch = trimmed.match(USER_THOUGHT_RE);
    if (userThoughtMatch) {
      result.push({
        type: 'thought' as const,
        speaker: '<user>',
        text: userThoughtMatch[1],
        color: 'bg-pop-cyan',
        location: currentLocation,
        nsfwPhase: currentNsfwPhase,
        nsfwCharacter: currentNsfwCharacter,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 5. 旁白
    result.push({
      type: 'narrator' as const,
      text: trimmed,
      location: currentLocation,
      nsfwPhase: currentNsfwPhase,
      nsfwCharacter: currentNsfwCharacter,
      achievementTriggers: consumePending(),
    });
  }

  // 标签在末尾无后续行：附加到最后一个可见行
  if (pendingAchievements.length > 0 && result.length > 0) {
    const last = result[result.length - 1];
    last.achievementTriggers = [
      ...(last.achievementTriggers ?? []),
      ...pendingAchievements,
    ];
  }

  return result;
}

/** <user> 或 我 或 玩家自定义名 不需要立绘 */
function isUser(speaker: string, playerName?: string): boolean {
  if (speaker === '<user>' || speaker === '我') return true;
  if (playerName && speaker === playerName) return true;
  return false;
}

/**
 * 从 AI 消息文本中提取 <achievement> 成就触发标签
 *
 * 格式：<achievement>编号</achievement> 或 <achievement>成就ID</achievement>
 * 该标签不显示给玩家，仅供 AchievementContext 解析后触发成就解锁
 * 编号对应 AchievementDef.no 字段，AI 推荐使用编号格式
 *
 * @param rawText AI 消息原始文本
 * @returns 成就触发标识数组（编号或 ID）
 */
export function parseAchievements(rawText: string): string[] {
  const cleaned = stripThinkingZones(rawText);
  const matches = cleaned.matchAll(/<achievement>([^<]+?)<\/achievement>/g);
  const ids: string[] = [];
  for (const m of matches) {
    const id = m[1].trim();
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

/** 平行事件 */
export interface ParallelEvent {
  /** 事件发生的地点 */
  location: string;
  /** 当前发生的平行事件描述 */
  event: string;
}

/**
 * 从 AI 消息文本中提取 <dream_parallel_event> 标签内的平行事件
 *
 * 格式：
 * <dream_parallel_event>
 * <simple_thinking>
 * ${平行事件思考}
 * </simple_thinking>
 * ${事件地点1}|${当前发生的平行事件1}
 * ${事件地点2}|${当前发生的平行事件2}
 * ${事件地点3}|${当前发生的平行事件3}
 * </dream_parallel_event>
 *
 * <simple_thinking> 块会被 stripThinkingZones 自动剥离，不参与解析
 *
 * @param rawText AI 消息原始文本
 * @returns 平行事件数组（最多3条）
 */
export function parseParallelEvents(rawText: string): ParallelEvent[] {
  const cleaned = stripThinkingZones(rawText);
  const blockMatch = cleaned.match(/<dream_parallel_event>([\s\S]*?)<\/dream_parallel_event>/);
  if (!blockMatch) return [];

  const blockContent = blockMatch[1];
  const events: ParallelEvent[] = [];
  const lines = blockContent.split(/\n/).map(s => s.trim()).filter(s => s);

  for (const line of lines) {
    // 匹配 事件地点|事件描述 格式
    const match = line.match(/^(.+?)\|(.+)$/);
    if (match) {
      events.push({
        location: match[1].trim().replace(/<br\s*\/?>/gi, ''),
        event: match[2].trim().replace(/<br\s*\/?>/gi, ''),
      });
    }
  }

  return events;
}

/**
 * 从 AI 消息文本中提取 <options> 或 <choice> 标签内的选项列表
 *
 * 支持两种格式：
 * 1. <options> 标签 + > 前缀行：
 *    <options>
 *    >选项一
 *    >选项二
 *    </options>
 *
 * 2. <choice> 标签（每行一个选项，或多个 <choice></choice> 标签）：
 *    <choice>
 *    选项一
 *    选项二
 *    </choice>
 *    或：
 *    <choice>选项一</choice>
 *    <choice>选项二</choice>
 *
 * @param rawText AI 消息原始文本
 * @returns 选项文本数组
 */
export function parseOptions(rawText: string): string[] {
  const cleaned = stripThinkingZones(rawText);

  const options: string[] = [];

  // 1. 先尝试 <options> 标签
  const optionsMatch = cleaned.match(/<options>([\s\S]*?)<\/options>/);
  if (optionsMatch) {
    const content = optionsMatch[1].trim();
    const lines = content.split(/\n/).map(s => s.trim()).filter(s => s);
    for (const line of lines) {
      const match = line.match(/^>(.+)$/);
      if (match) {
        options.push(match[1].trim());
      }
    }
  }

  // 2. 再尝试 <choice> 标签（块级 <choice>...</choice>）
  const choiceBlockMatch = cleaned.match(/<choice>([\s\S]*?)<\/choice>/);
  if (choiceBlockMatch) {
    const content = choiceBlockMatch[1].trim();
    const lines = content.split(/\n/).map(s => s.trim()).filter(s => s);
    for (const line of lines) {
      options.push(line);
    }
  }

  // 3. 尝试多个独立 <choice>text</choice> 标签
  const individualChoiceMatches = cleaned.matchAll(/<choice>([^<]+?)<\/choice>/g);
  for (const m of individualChoiceMatches) {
    const text = m[1].trim();
    if (text && !options.includes(text)) {
      options.push(text);
    }
  }

  return options;
}
