import { CHARACTER_AVATARS, CHARACTER_COLORS, getCharacterSprite } from '../data/characterData';

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

/**
 * 需要从解析前移除的思维/规划标签对及其内容
 * [开始标记, 结束标记]
 */
const STRIP_PAIRS: [string, string][] = [
  ['<Chain_of_Thought>', '</Chain_of_Thought>'],
  ['<draft>', '</draft>'],
  ['<think>', '</think>'],
  ['<thinking>', '</thinking>'],
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
      continue;
    }

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
      });
      continue;
    }

    // 5. 旁白
    result.push({
      type: 'narrator' as const,
      text: trimmed,
      location: currentLocation,
    });
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
 * 从 AI 消息文本中提取 <options> 标签内的选项列表
 *
 * AI 输出格式示例:
 * <options>
 * >选项一：[...]
 * >选项二：[...]
 * </options>
 *
 * 提取以 > 开头的行作为选项, 去掉 > 前缀后返回完整文本
 * 选项数量不固定, 有几个就提取几个
 *
 * @param rawText AI 消息原始文本
 * @returns 选项文本数组
 */
export function parseOptions(rawText: string): string[] {
  const cleaned = stripThinkingZones(rawText);
  const optionsMatch = cleaned.match(/<options>([\s\S]*?)<\/options>/);
  if (!optionsMatch) return [];

  const content = optionsMatch[1].trim();
  const lines = content.split(/\n/).map(s => s.trim()).filter(s => s);

  const options: string[] = [];
  for (const line of lines) {
    const match = line.match(/^>(.+)$/);
    if (match) {
      options.push(match[1].trim());
    }
  }
  return options;
}
