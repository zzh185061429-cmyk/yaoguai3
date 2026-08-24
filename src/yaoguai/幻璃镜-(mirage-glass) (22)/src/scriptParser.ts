/**
 * 剧本解析器 — 从 AI 消息文本中提取 <content> 标签内容，解析为逐行推进的剧本
 *
 * 移植自租借男友项目，适配幻璃镜的角色数据结构：
 * - 幻璃镜角色 sprites 使用拼音 key（如 'kai-xin'），而 AI 输出中使用中文情绪名（如"开心"）
 * - 通过 EMOTION_MAP 将中文情绪名映射到拼音 key
 *
 * 支持的格式：
 *   角色名[情绪]:"对话"       → dialog
 *   <user>:"对话"             → dialog (玩家，无立绘)
 *   角色名[情绪]:*内心独白*    → thought
 *   <user>:*内心独白*          → thought
 *   纯文本                     → narrator
 *   [scene:父地点/子地点]      → 场景标签（不显示，更新 location）
 *   <achievement>ID</achievement> → 成就触发标签
 */

import { SAMPLE_CHARACTERS } from './data/sampleData';

// ── 中文情绪名 → 拼音 sprite key 映射 ──
const EMOTION_MAP: Record<string, string> = {
  '默认': 'mo-ren',
  '开心': 'kai-xin',
  '生气': 'sheng-qi',
  '惊讶': 'jing-ya',
  '害羞': 'hai-xiu',
  '害怕': 'hai-pa',
  '伤心': 'shang-xin',
  '嫌弃': 'xian-qi',
  '吃醋': 'chi-cu',
  '小人': 'xiao-ren',
};

export type LineType = 'narrator' | 'dialog' | 'thought';

export interface ScriptLine {
  type: LineType;
  speaker?: string;
  emotion?: string;
  text: string;
  /** 角色主题色类名（如 'bg-cyan-900/40'） */
  color?: string;
  /** 角色头像 URL */
  avatar?: string;
  /** 角色立绘 URL */
  sprite?: string;
  /** 场景地点（由 [scene:父地点/子地点] 标签解析，后续句子继承） */
  location?: { parent: string; spot?: string };
  /** 成就触发标识列表 */
  achievementTriggers?: string[];
}

/** 平行事件 */
export interface ParallelEvent {
  location: string;
  event: string;
}

// ── 正则表达式 ──

/** 角色名[情绪]:"对话内容" */
const DIALOG_RE = /^(.+?)\[(.+?)\]:"(.+)"$/s;

/** <user>:"对话内容" — <user> 不需要情绪标签 */
const USER_DIALOG_RE = /^<user>:"(.+)"$/s;

/** 角色名[情绪]:*内心独白* */
const THOUGHT_RE = /^(.+?)\[(.+?)\]:\*(.+)\*$/s;

/** <user>:*内心独白* */
const USER_THOUGHT_RE = /^<user>:\*(.+)\*$/s;

/** [scene:父地点/子地点] 或 [scene:父地点] */
const SCENE_RE = /^\[scene:([^/\]]+)(?:\/([^\]]+))?\]$/;

/** <achievement>编号或ID</achievement> */
const ACHIEVEMENT_RE = /^<achievement>([^<]+?)<\/achievement>$/;

/** 需要移除的思维/规划标签对 */
const STRIP_PAIRS: [string, string][] = [
  ['<Chain_of_Thought>', '</Chain_of_Thought>'],
  ['<draft>', '</draft>'],
  ['<thinking>', '</thinking>'],
  ['<simple_thinking>', '</simple_thinking>'],
];

/** 转义正则特殊字符 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 清理原始文本：删除思维/规划标签对及其内容
 */
function stripThinkingZones(raw: string): string {
  let text = raw;

  for (const [open, close] of STRIP_PAIRS) {
    const re = new RegExp(escapeRegExp(open) + '[\\s\\S]*?' + escapeRegExp(close), 'gi');
    text = text.replace(re, '');
  }

  return text;
}

/** 从角色名获取角色数据（遍历 SAMPLE_CHARACTERS 匹配 name） */
function findCharacterByName(name: string) {
  for (const key of Object.keys(SAMPLE_CHARACTERS)) {
    const char = SAMPLE_CHARACTERS[key as keyof typeof SAMPLE_CHARACTERS];
    if (char.name === name) return char;
  }
  return null;
}

/** 判断说话人是否为玩家 */
function isUser(speaker: string, playerName?: string): boolean {
  if (speaker === '<user>' || speaker === '我') return true;
  if (playerName && speaker === playerName) return true;
  return false;
}

/** 获取角色立绘 URL */
function getSpriteUrl(speaker: string, emotion: string): string | undefined {
  const char = findCharacterByName(speaker);
  if (!char?.sprites) return undefined;
  const spriteKey = EMOTION_MAP[emotion] || EMOTION_MAP['默认'] || 'mo-ren';
  return char.sprites[spriteKey] || char.sprites['mo-ren'];
}

/** 获取角色头像 URL */
function getAvatarUrl(speaker: string): string | undefined {
  const char = findCharacterByName(speaker);
  return char?.illustrationUrl || undefined;
}

/** 获取角色主题色类名 */
function getColorClass(speaker: string): string {
  const char = findCharacterByName(speaker);
  if (char?.themeColor === 'cyan') return 'bg-cyan-900/40';
  if (char?.themeColor === 'vermilion') return 'bg-vermilion-900/40';
  return 'bg-ink-800/60';
}

/**
 * 从 AI 消息文本中提取 <content> 标签内的剧本内容，解析为 ScriptLine[]
 */
export function parseScriptContent(rawText: string, playerName?: string): ScriptLine[] {
  const cleaned = stripThinkingZones(rawText);
  const contentMatch = cleaned.match(/<content>([\s\S]*?)<\/content>/);
  if (!contentMatch) return [];

  const content = contentMatch[1].trim();
  const segments = content.split(/\n/).filter(s => s.trim());

  const result: ScriptLine[] = [];
  let currentLocation: { parent: string; spot?: string } | undefined;
  let pendingAchievements: string[] = [];

  for (const segment of segments) {
    const trimmed = segment.trim();

    // 场景标签
    const sceneMatch = trimmed.match(SCENE_RE);
    if (sceneMatch) {
      currentLocation = {
        parent: sceneMatch[1].trim(),
        spot: sceneMatch[2]?.trim() || undefined,
      };
      continue;
    }

    // 成就触发标签
    const achMatch = trimmed.match(ACHIEVEMENT_RE);
    if (achMatch) {
      pendingAchievements.push(achMatch[1].trim());
      continue;
    }

    const consumePending = (): string[] | undefined =>
      pendingAchievements.length > 0 ? pendingAchievements.splice(0) : undefined;

    // 1. 角色名[情绪]:"对话"
    const dialogMatch = trimmed.match(DIALOG_RE);
    if (dialogMatch) {
      const speaker = dialogMatch[1].trim();
      const emotion = dialogMatch[2].trim();
      result.push({
        type: 'dialog' as const,
        speaker,
        emotion,
        text: dialogMatch[3],
        color: getColorClass(speaker),
        avatar: isUser(speaker, playerName) ? undefined : getAvatarUrl(speaker),
        sprite: isUser(speaker, playerName) ? undefined : getSpriteUrl(speaker, emotion),
        location: currentLocation,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 2. <user>:"对话"
    const userDialogMatch = trimmed.match(USER_DIALOG_RE);
    if (userDialogMatch) {
      result.push({
        type: 'dialog' as const,
        speaker: '<user>',
        text: userDialogMatch[1],
        color: 'bg-cyan-900/40',
        location: currentLocation,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 3. 角色名[情绪]:*内心独白*
    const thoughtMatch = trimmed.match(THOUGHT_RE);
    if (thoughtMatch) {
      const speaker = thoughtMatch[1].trim();
      const emotion = thoughtMatch[2].trim();
      result.push({
        type: 'thought' as const,
        speaker,
        emotion,
        text: thoughtMatch[3],
        color: getColorClass(speaker),
        avatar: isUser(speaker, playerName) ? undefined : getAvatarUrl(speaker),
        sprite: isUser(speaker, playerName) ? undefined : getSpriteUrl(speaker, emotion),
        location: currentLocation,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 4. <user>:*内心独白*
    const userThoughtMatch = trimmed.match(USER_THOUGHT_RE);
    if (userThoughtMatch) {
      result.push({
        type: 'thought' as const,
        speaker: '<user>',
        text: userThoughtMatch[1],
        color: 'bg-cyan-900/40',
        location: currentLocation,
        achievementTriggers: consumePending(),
      });
      continue;
    }

    // 5. 旁白
    result.push({
      type: 'narrator' as const,
      text: trimmed,
      location: currentLocation,
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

/**
 * 从 AI 消息文本中提取 <options> 或 <choice> 标签内的选项列表
 */
export function parseOptions(rawText: string): string[] {
  const cleaned = stripThinkingZones(rawText);
  const options: string[] = [];

  // 1. <options> 标签 + > 前缀行
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

  // 2. <choice>...</choice> 块级标签
  const choiceBlockMatch = cleaned.match(/<choice>([\s\S]*?)<\/choice>/);
  if (choiceBlockMatch) {
    const content = choiceBlockMatch[1].trim();
    const lines = content.split(/\n/).map(s => s.trim()).filter(s => s);
    for (const line of lines) {
      options.push(line);
    }
  }

  // 3. 多个独立 <choice>text</choice> 标签
  const individualChoiceMatches = cleaned.matchAll(/<choice>([^<]+?)<\/choice>/g);
  for (const m of individualChoiceMatches) {
    const text = m[1].trim();
    if (text && !options.includes(text)) {
      options.push(text);
    }
  }

  return options;
}

/**
 * 从 AI 消息文本中提取 <dream_parallel_event> 标签内的平行事件
 */
export function parseParallelEvents(rawText: string): ParallelEvent[] {
  const cleaned = stripThinkingZones(rawText);
  const blockMatch = cleaned.match(/<dream_parallel_event>([\s\S]*?)<\/dream_parallel_event>/);
  if (!blockMatch) return [];

  const blockContent = blockMatch[1];
  const events: ParallelEvent[] = [];
  const lines = blockContent.split(/\n/).map(s => s.trim()).filter(s => s);

  for (const line of lines) {
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
