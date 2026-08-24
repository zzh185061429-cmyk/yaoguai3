/**
 * 手机系统 — 副API调用封装 + 世界书操作封装
 *
 * 职责：
 * 1. 副API配置的读写（脚本变量持久化）
 * 2. 副API生成手机消息 / 论坛帖子
 * 3. 聊天世界书条目管理（角色聊天记录条目、论坛关注条目、群聊记录条目）—— 全部存放在聊天世界书中，随聊天文件自动隔离
 * 4. 破限提示词从当前预设的 jailbreak 系统提示词中读取
 */

import { CHARACTERS } from '../data/gameData';
import { getAllLocationNames } from '../data/mapLocations';
import { parseScriptContent, type ScriptLine } from '../views/scriptParser';

// ── 工具函数 ──

/**
 * 去除文本中的所有 emoji 表情符号
 * 覆盖常见 emoji Unicode 范围，以及 Variation Selector-16
 */
function stripEmoji(text: string): string {
  return text
    // 去除各种 emoji Unicode 范围（使用标准 Unicode 转义）
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{20D0}-\u{20FF}\u{FE0F}\u{200D}\u{20E3}\u{2049}\u{203C}]/gu, '')
    // 合并多余的空格和换行
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// ── 类型定义 ──

export type SubApiConfig = {
  apiurl: string;
  key: string;
  model: string;
  source: string;
};

export type PhoneCharLink = {
  name: string;
  personaEntryName: string;
  personaWorldbookName: string; // 人设条目所在的世界书名
  chatLogEntryName: string;
  enabled: boolean;
  avatar?: string;
};

export type PhoneConfig = {
  characters: PhoneCharLink[];
  subApi: SubApiConfig;
  guideShown: boolean;
  /** 是否允许角色主动发消息（关闭后不再自动触发角色私聊和朋友圈） */
  autoMessageEnabled: boolean;
};

export type PhoneMessage = {
  id: string;
  ts: number;
  /** 游戏内时间戳（格式如 "10/8 19:30"），用于世界书摘要中让AI区分消息发送时间 */
  gameTs?: string;
  text: string;
  from: 'char' | 'player';
  read: boolean;
  /** 标记为 AI 压缩生成的聊天摘要（UI 显示为灰色卡片而非聊天气泡） */
  isSummary?: boolean;
  /** 摘要消息所包含的原始消息（用于查看压缩记录；嵌套压缩时继承子摘要的原始消息） */
  originalMessages?: PhoneMessage[];
};

// ── 论坛板块定义 ──

export type ForumBoard = '首页' | '八卦' | '灵异' | '吐槽' | '求助' | '种草';

export const FORUM_BOARDS: { key: ForumBoard; label: string; color: string; desc: string }[] = [
  { key: '首页', label: '首页', color: 'text-white', desc: '综合热门帖子' },
  { key: '八卦', label: '八卦', color: 'text-orange-400', desc: '校园八卦、吃瓜爆料' },
  { key: '灵异', label: '灵异', color: 'text-purple-400', desc: '校园怪谈、灵异经历' },
  { key: '吐槽', label: '吐槽', color: 'text-red-400', desc: '吐槽发泄、生活不满' },
  { key: '求助', label: '求助', color: 'text-blue-400', desc: '求助问答、生活困扰' },
  { key: '种草', label: '种草', color: 'text-green-400', desc: '好物推荐、种草安利' },
];

export type ForumPost = {
  id: string;
  board: ForumBoard;
  username: string;
  title: string;
  content: string;
  /** 游戏内时间戳（格式如 "10/8 19:30"），用于世界书条目中让AI区分帖子发布时间 */
  gameTs?: string;
  replies: { username: string; content: string; gameTs?: string; replyTo?: string }[];
};

// ── 默认值 ──

const DEFAULT_SUB_API: SubApiConfig = {
  apiurl: '',
  key: '',
  model: '',
  source: 'openai',
};

const DEFAULT_PHONE_CONFIG: PhoneConfig = {
  characters: [],
  subApi: DEFAULT_SUB_API,
  guideShown: false,
  autoMessageEnabled: true,
};

// ── 副API配置读写 ──

/**
 * 读取手机配置
 *
 * - subApi / guideShown / characters → 角色卡变量（跨聊天文件共享，不随聊天文件消失）
 */
export function loadPhoneConfig(): PhoneConfig {
  let subApi = { ...DEFAULT_SUB_API };
  let guideShown = false;
  let characters: PhoneCharLink[] = [];
  let autoMessageEnabled = true;
  try {
    const charVars = getVariables({ type: 'character' });
    if (charVars && typeof charVars === 'object') {
      subApi = { ...DEFAULT_SUB_API, ...((charVars as any).subApi || {}) };
      guideShown = typeof (charVars as any).guideShown === 'boolean' ? (charVars as any).guideShown : false;
      characters = Array.isArray((charVars as any).phoneCharacters) ? (charVars as any).phoneCharacters : [];
      autoMessageEnabled = typeof (charVars as any).autoMessageEnabled === 'boolean' ? (charVars as any).autoMessageEnabled : true;
    }
  } catch (err) {
    console.warn('[phoneApi] 无法读取手机角色卡变量配置:', err);
  }

  return { characters, subApi, guideShown, autoMessageEnabled };
}

/**
 * 保存手机配置
 *
 * - subApi / guideShown / characters → 角色卡变量（跨聊天文件共享，不随聊天文件消失）
 */
export function savePhoneConfig(config: PhoneConfig): void {
  try {
    updateVariablesWith(
      (vars) => ({ ...vars, subApi: config.subApi, guideShown: config.guideShown, phoneCharacters: config.characters, autoMessageEnabled: config.autoMessageEnabled }),
      { type: 'character' },
    );
  } catch (err) {
    console.warn('[phoneApi] 无法持久化手机配置到角色卡变量:', err);
  }
}

/** 检查副API是否已配置可用 */
export function isSubApiReady(config: PhoneConfig): boolean {
  return !!(config.subApi.apiurl && config.subApi.model);
}

/** 获取副API可用模型列表 */
export async function fetchModelList(apiurl: string, key: string): Promise<string[]> {
  if (!apiurl) return [];
  try {
    return await getModelList({ apiurl, key: key || undefined });
  } catch (err) {
    console.warn('[phoneApi] 获取模型列表失败:', err);
    return [];
  }
}

// ── 破限提示词 ──

/**
 * 从当前预设的 jailbreak 系统提示词中读取破限内容
 *
 * 遍历当前预设的 prompts，找到 id 为 'jailbreak' 且已启用的条目，返回其 content。
 * 如果找不到或未启用，返回空字符串（不注入破限）。
 */
export function getPresetJailbreakPrompt(): string {
  try {
    const preset = getPreset('in_use');
    // 尝试多种可能的破限条目 ID
    const jailbreakIds = ['jailbreak', 'jailbreak_prompt', 'jb', 'nsfw', 'main', 'sis'];
    let jailbreak = preset.prompts.find((p) => p.id === 'jailbreak' && p.enabled);
    if (!jailbreak) {
      // 扩大搜索：尝试其他常见破限 ID
      for (const id of jailbreakIds) {
        jailbreak = preset.prompts.find((p) => p.id === id && p.enabled);
        if (jailbreak) break;
      }
    }
    if (!jailbreak) {
      // 最后尝试：名字包含 jailbreak 或破限的已启用条目
      jailbreak = preset.prompts.find((p) => p.enabled && (
        p.name?.toLowerCase().includes('jailbreak') ||
        p.name?.includes('破限') ||
        p.name?.includes('越狱')
      ));
    }
    const content = jailbreak?.content?.trim() || '';
    if (!content) {
      console.warn('[phoneApi] 未找到预设中的破限提示词，已启用条目 ID 列表:', preset.prompts.filter(p => p.enabled).map(p => p.id));
    } else {
      console.info(`[phoneApi] 破限提示词已加载 (来源: ${jailbreak!.id}, 长度: ${content.length})`);
    }
    return content;
  } catch (err) {
    console.warn('[phoneApi] 无法从预设读取破限提示词:', err);
    return '';
  }
}

// ── 副API调用 ──

/**
 * 生成角色手机消息
 *
 * @param charName 角色名
 * @param personaContent 角色人设条目内容（system prompt）
 * @param history 最近的消息历史
 * @param context 触发上下文（游戏时间、天气、最近事件等）
 * @returns AI生成的消息文本
 */
export async function generatePhoneMessage(
  charName: string,
  personaContent: string,
  history: PhoneMessage[],
  context: string,
  subApi: SubApiConfig,
): Promise<string> {
  console.info(`[phoneApi] 生成 ${charName} 的手机消息`);

  // 从预设读取破限提示词
  const jailbreakPrompt = getPresetJailbreakPrompt();

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 0.9,
      max_tokens: 2000,
    },
    ordered_prompts: [
      // 0. 破限提示词（如果有）
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      // 1. 角色人设
      { role: 'system', content: personaContent || `你是${charName}，请以该角色的身份和语气发微信消息。` },
      // 2. 防 OOC 角色内化思考链
      {
        role: 'system',
        content: `在回复前，先在内心快速过一遍自己的角色设定：\n→ 翻开你的【经历】：成长轨迹、行为模式、说话习惯、处事方式。每段经历体现什么性格？\n→ 翻开你的【思考点1】：核心矛盾和行为逻辑。面对这些矛盾你怎么表现？\n→ 翻开你的【喜欢】：每条提炼一个性格侧面。\n→ 翻开你的【不喜欢】：本次对话的雷区在哪？\n→ 翻开你的【小秘密】：本次场景有没有可能触发或差点暴露？\n→ 翻开你的【思考点2】：核心矛盾。不许拿前面的重复，逐条展开。\n→ 【对其他女孩的看法】：你怎么看待竞争关系？\n→ 【对对方的看法】：核心情感。嘴上说的和心里想的一致吗？哪里在掩饰？\n→ 【单人整合】：所有侧面摊开——哪些互相支撑？哪些互相矛盾？在本场景怎么碰撞？你会怎么说话、做事、掩饰、哪里缄不住？\n以上思考仅用于指导你的回复语气和内容，不要在消息中输出思考过程。`,
      },
      // 3. 手机消息风格指导
      {
        role: 'system',
        content:
          '你正在通过微信发消息。要求：1) 回复2-4句话，可以分多条消息发，用换行分隔 2) 符合角色性格和说话习惯，像真人微信聊天一样自然 3) 可以主动延伸话题、反问、开玩笑，增加互动感 4) 不要使用任何emoji表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等方括号文字） 5) 不要写动作描写或旁白 6) 只输出消息内容本身，不要加引号或角色名前缀 7) 如果你在消息中表达了要前往某地的意图（如"我这就过去"、"我出发了"、"我去找你"），在消息最末尾另起一行输出 [move:父地点/子地点] 或 [move:父地点] 来标记你的目的地。这个标签不会被玩家看到。如果你没有移动意图，不要输出此标签',
      },
      // 4. 最近手机消息历史
      ...history.slice(-10).map((msg) => ({
        role: (msg.from === 'char' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: msg.text,
      })),
      // 5. 触发上下文
      { role: 'user', content: context },
    ],
  });

  const raw = typeof result === 'string' ? result.trim() : '';
  if (!raw) {
    console.warn(`[phoneApi] ${charName} 的消息生成结果为空`);
  }
  // 后处理：去除 emoji
  return stripEmoji(raw);
}

/**
 * 生成论坛帖子（NPC用户和内容全部动态生成）
 *
 * 不使用 json_schema（很多中转 API 不支持结构化输出），
 * 改用 prompt 引导 + 健壮的 JSON 提取解析。
 *
 * @param subApi 副API配置
 * @param context 当前校园背景上下文
 * @param npcPool 已有的常驻NPC（副API有概率复用）
 * @param board 板块类型，默认 '首页'（综合）
 * @returns 帖子数组
 */
export async function generateForumPosts(
  subApi: SubApiConfig,
  context: string,
  _npcPool: { name: string; avatar: string }[],
  board: ForumBoard = '首页',
): Promise<ForumPost[]> {
  console.info(`[phoneApi] 生成论坛帖子，板块: ${board}，API: ${subApi.apiurl}，模型: ${subApi.model}`);
  // 从预设读取破限提示词
  const jailbreakPrompt = getPresetJailbreakPrompt();

  // 根据板块定制 prompt
  const boardHint = FORUM_BOARDS.find((b) => b.key === board);
  const boardPrompt = board === '首页'
    ? '帖子类型不限，可以包含各种类型（吐槽、求助、八卦、种草等）。'
    : `只生成「${board}」板块的帖子。${boardHint?.desc || ''}。帖子内容要紧扣该板块主题。`;

  try {
    const result = await generateRaw({
      should_silence: true,
      max_chat_history: 0,
      custom_api: {
        apiurl: subApi.apiurl || undefined,
        key: subApi.key || undefined,
        model: subApi.model,
        source: subApi.source || 'openai',
        temperature: 1.0,
        max_tokens: 8000,
      },
      ordered_prompts: [
        ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
        {
          role: 'system',
          content:
            '你是燕大匿名论坛系统。生成有趣的校园论坛帖子。规则：1) 禁止出现任何真实角色名 2) 所有用户都是匿名网友 3) 帖子内容要自然、有趣、贴近大学生活 4) 每个帖子的发帖人和回复者必须用不同的随机用户名 5) 用户名要有创意，符合大学生特点 6) 每条帖子必须包含3-5条回复，回复内容要多样、有趣、有不同观点 7) 回复者也要有不同的用户名和语气风格 8) 不要使用任何emoji表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等方括号文字）',
        },
        { role: 'system', content: `当前校园背景：${context}` },
        { role: 'system', content: boardPrompt },
        {
          role: 'user',
          content:
            '生成5条新帖子，每条帖子必须包含3-5条回复。只输出JSON，不要输出其他内容。格式：{"posts":[{"username":"用户名","title":"标题","content":"50-120字","replies":[{"username":"回复者","content":"回复内容"}]}]}。注意replies数组至少3个元素。',
        },
      ],
    });

    console.info('[phoneApi] generateRaw 返回类型:', typeof result, '内容长度:', typeof result === 'string' ? result.length : 'N/A');

    if (typeof result !== 'string') {
      console.warn('[phoneApi] 论坛帖子生成结果不是字符串:', JSON.stringify(result).slice(0, 200));
      return [];
    }

    if (!result || result.trim() === '') {
      console.warn('[phoneApi] 论坛帖子生成结果为空字符串');
      return [];
    }

    console.info('[phoneApi] 论坛帖子原始响应（前300字）:', result.slice(0, 300));

    // 健壮的 JSON 提取：尝试从响应中提取 JSON（传入实际请求的板块）
    const posts = parseForumPostsFromText(result, board);
    if (posts.length === 0) {
      console.warn('[phoneApi] 论坛帖子JSON解析失败，原始响应（前200字）:', result.slice(0, 200));
    } else {
      console.info(`[phoneApi] 成功解析 ${posts.length} 条论坛帖子`);
    }
    return posts;
  } catch (err) {
    console.error('[phoneApi] generateForumPosts 出错:', err);
    return [];
  }
}

/** 从文本推断板块类型（用于解析时自动归类） */
function inferBoardFromText(text: string): ForumBoard {
  for (const board of FORUM_BOARDS) {
    if (board.key !== '首页' && text.includes(board.key)) {
      return board.key;
    }
  }
  return '首页';
}

/**
 * 从文本中健壮地提取论坛帖子 JSON
 * 支持：纯JSON、带markdown代码块的JSON、前后有额外文本的JSON、被截断的不完整JSON
 */
function parseForumPostsFromText(text: string, requestedBoard: ForumBoard = '首页'): ForumPost[] {
  // 优先使用实际请求的板块，而不是从文本中推断
  const board = requestedBoard;
  // 尝试方法1：直接解析
  try {
    const parsed = JSON.parse(text);
    if (parsed.posts && Array.isArray(parsed.posts)) {
      return mapPosts(parsed.posts, board);
    }
  } catch { /* 继续尝试 */ }

  // 尝试方法2：从 markdown 代码块中提取
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed.posts && Array.isArray(parsed.posts)) {
        return mapPosts(parsed.posts, board);
      }
    } catch { /* 继续尝试 */ }
  }

  // 尝试方法3：从文本中提取第一个 { 开始的块
  const jsonStart = text.indexOf('{');
  if (jsonStart >= 0) {
    const jsonCandidate = text.slice(jsonStart);
    // 先尝试直接解析
    try {
      const parsed = JSON.parse(jsonCandidate);
      if (parsed.posts && Array.isArray(parsed.posts)) {
        return mapPosts(parsed.posts, board);
      }
    } catch { /* 继续尝试 */ }

    // 尝试修复被截断的 JSON
    const repaired = repairTruncatedJson(jsonCandidate);
    if (repaired) {
      try {
        const parsed = JSON.parse(repaired);
        if (parsed.posts && Array.isArray(parsed.posts)) {
          console.info('[phoneApi] JSON 被截断，已修复并成功解析');
          return mapPosts(parsed.posts, board);
        }
      } catch { /* 继续尝试 */ }
    }
  }

  return [];
}

/**
 * 尝试修复被截断的 JSON 文本
 * 策略：从后往前找到最后一个完整的对象/数组元素，然后补全未闭合的括号和字符串
 */
function repairTruncatedJson(text: string): string | null {
  let result = text.trim();

  // 如果已经能直接解析，不需要修复
  try {
    JSON.parse(result);
    return result;
  } catch { /* 需要修复 */ }

  // 检查是否在字符串中间被截断（统计未配对的引号）
  let inString = false;
  let escape = false;
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; }
  }
  // 如果在字符串中间被截断，补上闭合引号
  if (inString) {
    result += '"';
  }

  // 尝试找到最后一个完整的对象边界
  // 从后往前找，移除不完整的尾部，然后补全括号
  // 找最后一个完整的 key-value 或 }, 或 ]
  // 策略：找到最后一个完整的 `}` 或 `]` 或 `,` 之后的位置
  
  // 统计未闭合的括号
  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  escape = false;
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // 如果括号不平衡，可能需要在中间截断处补逗号
  // 先尝试直接补全
  // 如果最后一个非空白字符是 { 或 [ 或 , ，去掉它
  result = result.replace(/[\s,]+$/, '');
  
  // 如果最后一个有效字符是 : 说明 key 后面的 value 被截断了，移除这个不完整的 key
  // 如果最后一个有效字符是 { 说明开始了一个新对象但没内容，移除它
  while (result.length > 0) {
    const lastChar = result[result.length - 1];
    if (lastChar === '{' || lastChar === '[' || lastChar === ',' || lastChar === ':') {
      result = result.slice(0, -1).trim();
      // 重新统计括号
    } else {
      break;
    }
  }
  
  // 重新统计并补全括号
  openBraces = 0;
  openBrackets = 0;
  inString = false;
  escape = false;
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }
  
  // 补全未闭合的括号
  for (let i = 0; i < openBrackets; i++) result += ']';
  for (let i = 0; i < openBraces; i++) result += '}';
  
  try {
    JSON.parse(result);
    return result;
  } catch {
    return null;
  }
}

/** 将原始帖子数据映射为 ForumPost 类型 */
function mapPosts(rawPosts: any[], board: ForumBoard = '首页'): ForumPost[] {
  return rawPosts.map((p: any, i: number) => ({
    id: `post_${Date.now()}_${i}`,
    board: (p.board as ForumBoard) || board,
    username: stripEmoji(String(p.username || '匿名用户')),
    title: stripEmoji(String(p.title || '无标题')),
    content: stripEmoji(String(p.content || '')),
    replies: (p.replies || []).map((r: any) => ({
      username: stripEmoji(String(r.username || '匿名用户')),
      content: stripEmoji(String(r.content || '')),
    })),
  }));
}

// ── 聊天世界书操作 ──

/** 获取或创建当前聊天的专属世界书 */
async function getChatWorldbook(): Promise<string> {
  return await getOrCreateChatWorldbook('current');
}

/**
 * 关联角色时自动创建手机聊天记录条目（绿灯）
 * 条目 keys = 角色名，主线AI写到该角色时自动激活
 * 条目创建在聊天世界书中，随聊天文件自动隔离
 *
 * @param charName 角色名
 */
export async function createCharChatLogEntry(charName: string, playerName: string): Promise<string> {
  const worldbookName = await getChatWorldbook();
  const entryName = `手机聊天记录-${charName}`;

  // 计算关键词：角色名 + 去掉姓氏的名（假设第一个字是姓）
  const keys = [charName];
  const givenName = charName.length > 1 ? charName.slice(1) : charName;
  if (givenName !== charName) {
    keys.push(givenName);
  }

  try {
    console.info(`[phoneApi] 开始创建聊天记录条目: ${entryName}, 世界书: ${worldbookName}, 关键词: ${keys.join(', ')}`);

    // 如果已存在同名条目，先删除再全新创建（确保是空白记录）
    await deleteWorldbookEntries(
      worldbookName,
      (e) => e.name === entryName,
      { render: 'immediate' },
    );

    const { new_entries } = await createWorldbookEntries(
      worldbookName,
      [
        {
          name: entryName,
          enabled: true,
          strategy: {
            type: 'selective',
            keys,
            keys_secondary: { logic: 'and_any', keys: [] },
            // scan_depth 不写，默认跟随全局设置
          },
          position: {
            type: 'after_character_definition',
            order: 100,
          },
          recursion: {
            prevent_incoming: true,
            prevent_outgoing: true,
            delay_until: null,
          },
          content: `【手机聊天记录】${charName}的微信聊天记录将在此更新。\n（注：此为${charName}与${playerName}之间的私密微信聊天记录，仅${charName}本人和${playerName}知晓，其他角色不应知道或提及此内容。）`,
          probability: 100,
        },
      ],
      { render: 'immediate' },
    );

    console.info(`[phoneApi] ✅ 已创建聊天记录条目: ${entryName} (uid: ${new_entries[0]?.uid}, 世界书: ${worldbookName})`);
    return entryName;
  } catch (err) {
    console.error(`[phoneApi] ❌ 创建聊天记录条目失败: ${entryName}`, err);
    throw err;
  }
}

/**
 * 删除单个角色的手机聊天记录世界书条目
 *
 * @param charName 角色名
 */
export async function deleteCharChatLogEntry(charName: string): Promise<void> {
  const worldbookName = await getChatWorldbook();
  const entryName = `手机聊天记录-${charName}`;
  try {
    await deleteWorldbookEntries(
      worldbookName,
      (e) => e.name === entryName,
      { render: 'immediate' },
    );
    console.info(`[phoneApi] 已删除聊天记录条目: ${entryName} (世界书: ${worldbookName})`);
  } catch (err) {
    console.warn(`[phoneApi] 删除聊天记录条目失败: ${entryName}`, err);
  }
}

/**
 * 更新角色聊天记录条目内容（追加最新消息摘要）
 *
 * @param charName 角色名
 * @param summary 消息摘要内容
 */
export async function updateCharChatLogEntry(charName: string, summary: string): Promise<void> {
    const worldbookName = await getChatWorldbook();
    const entryName = `手机聊天记录-${charName}`;

    await updateWorldbookWith(
      worldbookName,
    (entries) => {
      return entries.map((e) => {
        if (e.name === entryName) {
          return { ...e, content: summary };
        }
        return e;
      });
    },
    { render: 'immediate' },
  );
}

/**
 * 读取角色人设条目内容（从指定世界书）
 */
export async function readPersonaEntry(entryName: string, worldbookName: string): Promise<string> {
  try {
    const entries = await getWorldbook(worldbookName);
    const entry = entries.find((e) => e.name === entryName);
    return entry?.content || '';
  } catch {
    console.warn(`[phoneApi] 无法从世界书 ${worldbookName} 读取条目 ${entryName}`);
    return '';
  }
}

/** 世界书条目（含来源世界书名） */
export type WbEntryRef = {
  name: string;
  worldbookName: string;
  content: string;
};

/**
 * 遍历所有可用世界书（全局 + 角色卡 + 聊天），收集所有条目
 */
export async function listAllWorldbookEntries(): Promise<WbEntryRef[]> {
  const allEntries: WbEntryRef[] = [];

  // 1. 全局世界书
  try {
    const globalNames = getGlobalWorldbookNames();
    for (const wbName of globalNames) {
      const entries = await getWorldbook(wbName);
      for (const e of entries) {
        allEntries.push({ name: e.name, worldbookName: wbName, content: e.content });
      }
    }
  } catch {
    console.warn('[phoneApi] 读取全局世界书失败');
  }

  // 2. 角色卡世界书
  try {
    const charWbs = getCharWorldbookNames('current');
    const charWbNames = [charWbs.primary, ...charWbs.additional].filter((n): n is string => !!n);
    for (const wbName of charWbNames) {
      const entries = await getWorldbook(wbName);
      for (const e of entries) {
        allEntries.push({ name: e.name, worldbookName: wbName, content: e.content });
      }
    }
  } catch {
    console.warn('[phoneApi] 读取角色卡世界书失败');
  }

  // 3. 聊天世界书
  try {
    const chatWbName = await getOrCreateChatWorldbook('current');
    const entries = await getWorldbook(chatWbName);
    for (const e of entries) {
      allEntries.push({ name: e.name, worldbookName: chatWbName, content: e.content });
    }
  } catch {
    console.warn('[phoneApi] 读取聊天世界书失败');
  }

  console.info(`[phoneApi] 共找到 ${allEntries.length} 条世界书条目`);
  return allEntries;
}

/**
 * 关注论坛帖子 → 写入聊天世界书绿灯条目（和聊天记录条目一样的位置和方式）
 * 条目 keys = ["论坛", "热议", 帖子标题前4字]，主线 AI 写到论坛时自动激活
 * 如果已存在同名条目，先删除再全新创建
 */
export async function followForumPost(post: ForumPost): Promise<void> {
  const wbName = await getChatWorldbook();
  const entryName = `论坛关注-${post.id}`;

  // 构造条目内容：包含帖子完整信息 + 时间戳
  const postTime = post.gameTs ? `[${post.gameTs}] ` : '';
  const replyLines = post.replies.length > 0
    ? '\n回复：\n' + post.replies.map(r => {
      const replyTime = r.gameTs ? `[${r.gameTs}] ` : '';
      const replyTo = r.replyTo ? `（回复${r.replyTo}）` : '';
      return `  ${replyTime}${r.username}${replyTo}：${r.content}`;
    }).join('\n')
    : '';
  const content = `【燕大论坛热议】\n发帖时间：${post.gameTs || '未知'}\n发帖人：${post.username}\n标题：${post.title}\n内容：${post.content}${replyLines}`;

  // 如果已存在同名条目，先删除再全新创建
  await deleteWorldbookEntries(
    wbName,
    (e) => e.name === entryName,
    { render: 'immediate' },
  );

  await createWorldbookEntries(
    wbName,
    [
      {
        name: entryName,
        enabled: true,
        strategy: {
          type: 'selective',
          keys: ['论坛', '热议', post.title.slice(0, 4)],
          keys_secondary: { logic: 'and_any', keys: [] },
        },
        position: {
          type: 'after_character_definition',
          order: 101,
        },
        recursion: {
          prevent_incoming: true,
          prevent_outgoing: true,
          delay_until: null,
        },
        content,
        probability: 100,
      },
    ],
    { render: 'immediate' },
  );

  console.info(`[phoneApi] 已关注论坛帖子（角色卡世界书）: ${post.title}`);
}

/**
 * 取关论坛帖子 → 删除角色卡世界书条目
 */
export async function unfollowForumPost(postId: string): Promise<void> {
  const wbName = await getChatWorldbook();
  const entryName = `论坛关注-${postId}`;

  await deleteWorldbookEntries(
    wbName,
    (e) => e.name === entryName,
    { render: 'immediate' },
  );

  console.info(`[phoneApi] 已取关论坛帖子: ${postId}`);
}

// ── 群聊世界书条目操作 ──

/**
 * 创建群聊世界书条目（绿灯/selective）
 *
 * 条目 keys = 群名 + 所有成员名，主线AI写到该群聊时自动激活
 * 如果已存在同名条目，先删除再全新创建
 *
 * @param group 群聊信息
 */
export async function createGroupChatLogEntry(group: GroupChat, playerName: string): Promise<string> {
  const wbName = await getChatWorldbook();
  const entryName = `手机群聊记录-${group.id}`;

  // 关键词：群名 + 所有成员名
  const keys = [group.name, ...group.memberNames];

  try {
    console.info(`[phoneApi] 开始创建群聊记录条目: ${entryName}, 世界书: ${wbName}, 关键词: ${keys.join(', ')}`);

    // 如果已存在同名条目，先删除
    await deleteWorldbookEntries(
      wbName,
      (e) => e.name === entryName,
      { render: 'immediate' },
    );

    const { new_entries } = await createWorldbookEntries(
      wbName,
      [
        {
          name: entryName,
          enabled: true,
          strategy: {
            type: 'selective',
            keys,
            keys_secondary: { logic: 'and_any', keys: [] },
          },
          position: {
            type: 'after_character_definition',
            order: 102,
          },
          recursion: {
            prevent_incoming: true,
            prevent_outgoing: true,
            delay_until: null,
          },
          content: `【手机群聊记录】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${playerName}）的聊天记录将在此更新。\n（注：此为群聊记录，仅群成员知晓，其他角色不应知道或提及此内容。）`,
          probability: 100,
        },
      ],
      { render: 'immediate' },
    );

    console.info(`[phoneApi] ✅ 已创建群聊记录条目: ${entryName} (uid: ${new_entries[0]?.uid})`);
    return entryName;
  } catch (err) {
    console.error(`[phoneApi] ❌ 创建群聊记录条目失败: ${entryName}`, err);
    throw err;
  }
}

/**
 * 更新群聊记录条目内容
 *
 * @param group 群聊信息
 * @param summary 消息摘要内容
 */
export async function updateGroupChatLogEntry(group: GroupChat, summary: string): Promise<void> {
  const wbName = await getChatWorldbook();
  const entryName = `手机群聊记录-${group.id}`;

  await updateWorldbookWith(
    wbName,
    (entries) => entries.map((e) => {
      if (e.name === entryName) {
        return { ...e, content: summary };
      }
      return e;
    }),
    { render: 'immediate' },
  );
}

/**
 * 删除单个群聊记录条目
 *
 * @param groupId 群聊ID
 */
export async function deleteGroupChatLogEntry(groupId: string): Promise<void> {
  const wbName = await getChatWorldbook();
  const entryName = `手机群聊记录-${groupId}`;

  try {
    await deleteWorldbookEntries(
      wbName,
      (e) => e.name === entryName,
      { render: 'immediate' },
    );
    console.info(`[phoneApi] 已删除群聊记录条目: ${entryName}`);
  } catch (err) {
    console.warn(`[phoneApi] 删除群聊记录条目失败: ${entryName}`, err);
  }
}

// ── 自动注入条目 ──

/**
 * 确保所有关联角色的聊天记录条目都存在（点进微信时调用）
 *
 * 遍历所有已关联角色，如果世界书中不存在对应的聊天记录条目则自动创建。
 * 已存在的条目不修改（保留当前内容）。
 *
 * @param characters 已关联的角色列表
 */
export async function ensureAllCharChatLogEntries(characters: PhoneCharLink[], playerName: string): Promise<void> {
  if (characters.length === 0) return;

  console.info(`[phoneApi] ensureAllCharChatLogEntries: 检查 ${characters.length} 个角色的聊天记录条目`);

  const wbName = await getChatWorldbook();

  for (const char of characters) {
    try {
      const entryName = `手机聊天记录-${char.name}`;

      // 检查条目是否已存在
      const entries = await getWorldbook(wbName);
      const exists = entries.some((e) => e.name === entryName);

      if (!exists) {
        console.info(`[phoneApi] 自动注入: 为 ${char.name} 创建聊天记录条目`);
        await createCharChatLogEntry(char.name, playerName);
      }
    } catch (err) {
      console.warn(`[phoneApi] 自动注入 ${char.name} 的聊天记录条目失败:`, err);
    }
  }
  console.info('[phoneApi] ensureAllCharChatLogEntries: 完成');
}

/**
 * 确保所有群聊的记录条目都存在（点进微信时调用）
 *
 * @param groups 群聊列表
 */
export async function ensureAllGroupChatLogEntries(groups: GroupChat[], playerName: string): Promise<void> {
  if (groups.length === 0) return;

  console.info(`[phoneApi] ensureAllGroupChatLogEntries: 检查 ${groups.length} 个群聊的记录条目`);

  const wbName = await getChatWorldbook();

  for (const group of groups) {
    try {
      const entryName = `手机群聊记录-${group.id}`;

      const entries = await getWorldbook(wbName);
      const exists = entries.some((e) => e.name === entryName);

      if (!exists) {
        console.info(`[phoneApi] 自动注入: 为群聊 ${group.name} 创建记录条目`);
        await createGroupChatLogEntry(group, playerName);
      }
    } catch (err) {
      console.warn(`[phoneApi] 自动注入群聊 ${group.name} 的记录条目失败:`, err);
    }
  }
  console.info('[phoneApi] ensureAllGroupChatLogEntries: 完成');
}

/** 将群聊消息历史格式化为世界书摘要 */
export function summarizeGroupMessages(group: GroupChat, messages: GroupMessage[], playerName: string): string {
  if (messages.length === 0) return '';
  const recent = messages.slice(-15);
  const lines = recent.map((m) => {
    const sender = m.from === 'player' ? playerName : m.from;
    const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
    return `${timeLabel}${sender}：${m.text}`;
  });
  return `【微信群聊动态（私密信息）】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${playerName}）最近的聊天记录。\n注意：此为群聊私密对话，仅群成员知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n${lines.join('\n')}`;
}

// ── 点单/预约意图检测 ──

/** 点单/预约关键词 */
const ORDER_KEYWORDS = [
  '点单', '下单', '预约', '订', '租', '租借', '租个', '租你',
  '需要你', '要你', '想要你', '服务', '多少钱', '价位', '价格',
  '一天多少', '怎么收费', '包天', '几个小时', '约你', '约一下',
  'book', 'booking', 'order',
];

/**
 * 检测最近的微信消息中是否包含点单/预约意图
 *
 * 扫描最近 N 条消息，如果命中关键词则返回订单上下文描述
 * （包含角色单价和当前时间），直接拼入发给 AI 的 context
 *
 * @param charName 角色名
 * @param messages 该角色的消息列表
 * @param gameTime 当前游戏时间
 * @returns 订单上下文字符串，无意图时返回空字符串
 */
export function detectOrderIntent(
  charName: string,
  messages: PhoneMessage[],
  gameTime: Date,
): string {
  if (!messages || messages.length === 0) return '';

  // 只扫描最近 10 条消息
  const recent = messages.slice(-10);
  const hit = recent.some((m) => {
    const text = m.text.toLowerCase();
    return ORDER_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
  });
  if (!hit) return '';

  // 从 CHARACTERS 查找单价
  const charInfo = CHARACTERS.find((c) => c.name === charName);
  if (!charInfo) return '';

  const timeStr = `${gameTime.getMonth() + 1}月${gameTime.getDate()}日 ${gameTime.getHours()}:${String(gameTime.getMinutes()).padStart(2, '0')}`;
  return `【点单提醒】${charName}在微信聊天中提到了点单或预约服务的意向。该角色的服务单价为${charInfo.price}。当前时间为${timeStr}。请在回复中自然地回应点单/预约相关话题。`;
}

// ── 消息历史读写（聊天变量） ──

/** 从聊天变量读取手机消息历史 */
export function loadPhoneMessages(): Record<string, PhoneMessage[]> {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars || typeof vars !== 'object') return {};
    const msgs = (vars as any).phoneMessages;
    if (!msgs || typeof msgs !== 'object') return {};
    return msgs;
  } catch {
    return {};
  }
}

/** 将手机消息历史写入聊天变量 */
export function savePhoneMessages(messages: Record<string, PhoneMessage[]>): void {
  try {
    updateVariablesWith((vars) => ({ ...vars, phoneMessages: messages }), { type: 'chat' });
  } catch {
    console.warn('[phoneApi] 无法持久化手机消息到聊天变量');
  }
}

/** 从聊天变量读取论坛关注帖子 */
export function loadFollowedPosts(): ForumPost[] {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars || typeof vars !== 'object') return [];
    const followed = (vars as any).forumFollowed;
    if (!Array.isArray(followed)) return [];
    return followed;
  } catch {
    return [];
  }
}

/** 将论坛关注帖子写入聊天变量 */
export function saveFollowedPosts(posts: ForumPost[]): void {
  try {
    updateVariablesWith((vars) => ({ ...vars, forumFollowed: posts }), { type: 'chat' });
  } catch {
    console.warn('[phoneApi] 无法持久化论坛关注帖子到聊天变量');
  }
}

/** 从聊天变量读取论坛NPC池 */
export function loadForumNpcPool(): { name: string; avatar: string }[] {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars || typeof vars !== 'object') return [];
    const pool = (vars as any).forumNpcPool;
    if (!Array.isArray(pool)) return [];
    return pool;
  } catch {
    return [];
  }
}

/** 将论坛NPC池写入聊天变量 */
export function saveForumNpcPool(pool: { name: string; avatar: string }[]): void {
  try {
    updateVariablesWith((vars) => ({ ...vars, forumNpcPool: pool }), { type: 'chat' });
  } catch {
    console.warn('[phoneApi] 无法持久化论坛NPC池到聊天变量');
  }
}

// ── 工具函数 ──

/** 生成消息ID */
export function genMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 获取主线最近几楼中与指定角色相关的正文上下文
 *
 * 角色参与判定（满足任一即视为该角色参与了此楼层）：
 * 1. 角色 speaker 精确匹配（parseScriptContent 提取的 ScriptLine.speaker === charName）
 * 2. 正文文本中包含角色全名或任一昵称（如"念安"匹配周念安）
 *
 * 匹配的楼层会给出完整 <content> 正文，而非截取前 N 字符。
 *
 * @param charName 角色名
 * @param depth 读取最近几楼消息（用户+AI合计），默认10楼
 * @returns 格式化的正文上下文字符串
 */
export function getRecentStoryContext(charName: string, depth: number = 10): string {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) return '';
    const startId = Math.max(0, lastId - depth + 1);
    const messages = getChatMessages(`${startId}-${lastId}`);

    // 从角色图鉴查找昵称列表，与全名一起构成匹配变体
    const charInfo = CHARACTERS.find((c) => c.name === charName);
    const nameVariants = [charName, ...(charInfo?.nicknames || [])];

    const storyLines: string[] = [];
    for (const m of messages) {
      if (m.role !== 'assistant' && m.role !== 'user') continue;

      // 提取可读正文
      let readableText = '';
      let scriptLines: ScriptLine[] = [];
      if (m.role === 'assistant') {
        // AI 消息：用 parseScriptContent 提取 <content> 正文，跳过思维链
        scriptLines = parseScriptContent(m.message);
        if (scriptLines.length > 0) {
          readableText = scriptLines.map((l) => {
            if (l.type === 'narrator') return l.text;
            if (l.type === 'dialog') return `${l.speaker}：${l.text}`;
            if (l.type === 'thought') return `${l.speaker}（心想）：${l.text}`;
            return '';
          }).filter((s) => s).join('\n');
        } else {
          // 没有 <content> 标签，跳过（思维链/格式内容对副API无用）
          continue;
        }
      } else {
        // 用户消息：直接用原文
        readableText = m.message;
      }

      // 角色参与判定：
      // 1. speaker 精确匹配（角色在这层楼说了话）
      // 2. 正文中包含角色全名或任一昵称（角色被提及）
      const speakerMatched = scriptLines.some((l) => l.speaker === charName);
      const textMatched = nameVariants.some((name) => readableText.includes(name));
      if (!speakerMatched && !textMatched) continue;

      const sender = m.role === 'user' ? '玩家' : (m.name || 'AI');
      // 上限 2000 字符，避免上下文过长
      const truncated = readableText.length > 2000 ? readableText.slice(0, 2000) + '…' : readableText;
      storyLines.push(`${sender}：${truncated}`);
    }

    if (storyLines.length === 0) return '';
    return `【你最近参与的主线剧情】以下是你最近在主线中经历的事情，请基于这些经历来聊天：\n${storyLines.join('\n')}`;
  } catch {
    console.warn('[phoneApi] 获取主线正文上下文失败');
    return '';
  }
}

/** 解析 "M/D H:MM" 格式时间字符串为 Date */
function parseGameTs(ts: string): Date | null {
  const m = ts.match(/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (!m) return null;
  return new Date(2026, parseInt(m[1]) - 1, parseInt(m[2]), parseInt(m[3]), parseInt(m[4]));
}

/** 将 Date 格式化为 MVU 时间格式 "X月X日 HH:MM" */
function formatMvuTime(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 将 Date 格式化为简短时间标签 "M/D HH:MM" */
export function formatGameTs(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 从三个时间源中取最靠后的一个，并回写 MVU 变量
 *
 * 三个时间源：
 * 1. MVU 变量中的 stat_data.时间.当前日期时间
 * 2. 所有微信消息中最晚的 gameTs
 * 3. 所有论坛帖子和回复中最晚的 gameTs
 *
 * 如果三个源都读取失败，回退到 fallback（通常是 React state 的 gameTime）。
 * 如果最靠后的时间比 MVU 当前时间更晚，会将其回写到 MVU 变量。
 *
 * @param messages 当前所有微信消息
 * @param posts 当前所有论坛帖子（含已关注）
 * @param fallback 回退时间（React state gameTime）
 * @returns 最靠后的游戏时间 Date 对象
 */
export function resolveLatestGameDate(
  messages: Record<string, PhoneMessage[]>,
  posts: ForumPost[],
  fallback: Date,
): Date {
  // 1. 读取 MVU 变量时间
  let mvuDate: Date | null = null;
  let mvuMsgId: number | null = null;
  try {
    const lastId = getLastMessageId();
    if (lastId != null && lastId >= 0) {
      const lastMsg = getChatMessages(lastId)[0];
      if (lastMsg && lastMsg.role === 'assistant') {
        mvuMsgId = lastMsg.message_id;
      } else if (lastId > 0) {
        const prev = getChatMessages(lastId - 1)[0];
        if (prev && prev.role === 'assistant') {
          mvuMsgId = prev.message_id;
        }
      }
      if (mvuMsgId != null) {
        const variables = Mvu.getMvuData({ type: 'message', message_id: mvuMsgId });
        const timeStr = _.get(variables, 'stat_data.时间.当前日期时间');
        if (timeStr && typeof timeStr === 'string') {
          const m = timeStr.match(/(\d+)月(\d+)日\s+(\d+):(\d+)/);
          if (m) {
            mvuDate = new Date(2026, parseInt(m[1]) - 1, parseInt(m[2]), parseInt(m[3]), parseInt(m[4]));
          }
        }
      }
    }
  } catch {
    // MVU 读取失败，忽略
  }

  // 2. 从所有微信消息中找最晚的 gameTs
  let wechatDate: Date | null = null;
  for (const charMessages of Object.values(messages)) {
    for (const msg of charMessages) {
      if (msg.gameTs) {
        const d = parseGameTs(msg.gameTs);
        if (d && (!wechatDate || d > wechatDate)) wechatDate = d;
      }
    }
  }

  // 3. 从所有论坛帖子和回复中找最晚的 gameTs
  let forumDate: Date | null = null;
  for (const post of posts) {
    if (post.gameTs) {
      const d = parseGameTs(post.gameTs);
      if (d && (!forumDate || d > forumDate)) forumDate = d;
    }
    for (const reply of post.replies) {
      if (reply.gameTs) {
        const d = parseGameTs(reply.gameTs);
        if (d && (!forumDate || d > forumDate)) forumDate = d;
      }
    }
  }

  // 4. 取最靠后的（以 fallback 为基准）
  let latestDate: Date = fallback;
  if (mvuDate && mvuDate > latestDate) latestDate = mvuDate;
  if (wechatDate && wechatDate > latestDate) latestDate = wechatDate;
  if (forumDate && forumDate > latestDate) latestDate = forumDate;

  // 5. 如果最靠后的时间比 MVU 当前时间更晚，回写到 MVU 变量
  if (mvuMsgId != null && (!mvuDate || latestDate > mvuDate)) {
    try {
      const variables = Mvu.getMvuData({ type: 'message', message_id: mvuMsgId });
      _.set(variables, 'stat_data.时间.当前日期时间', formatMvuTime(latestDate));
      Mvu.replaceMvuData(variables, { type: 'message', message_id: mvuMsgId });
      console.info(`[phoneApi] 已将 MVU 时间更新为最靠后的时间: ${formatMvuTime(latestDate)}`);
    } catch (err) {
      console.warn('[phoneApi] 回写 MVU 时间失败:', err);
    }
  }

  return latestDate;
}

/**
 * 获取最靠后的游戏时间字符串（格式 "M/D HH:MM"）
 *
 * 内部调用 resolveLatestGameDate，从三个时间源中取最靠后的并回写 MVU。
 * 在每次创建手机消息或论坛帖子后调用，以确保 MVU 时间实时同步。
 *
 * @param fallback 回退时间（React state gameTime）
 * @returns 最靠后的游戏时间字符串
 */
export function getLatestGameTs(fallback: Date): string {
  const messages = loadPhoneMessages();
  const posts = loadFollowedPosts();
  const latest = resolveLatestGameDate(messages, posts, fallback);
  return formatGameTs(latest);
}

/** 将消息历史格式化为世界书摘要（含时间信息，含隐私声明，防止角色间信息泄露） */
export function summarizeMessages(charName: string, messages: PhoneMessage[], playerName: string): string {
  if (messages.length === 0) return '';
  const recent = messages.slice(-15);
  const lines = recent.map((m) => {
    const sender = m.from === 'char' ? charName : playerName;
    const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
    return `${timeLabel}${sender}：${m.text}`;
  });
  return `【微信动态（私密信息）】${charName}最近在微信上的聊天记录。\n注意：此为${charName}与${playerName}之间的私密对话，仅${charName}本人和${playerName}知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n${lines.join('\n')}`;
}

// ════════════════════════════════════════
//  朋友圈（Moments）
// ════════════════════════════════════════

export type PhoneMoment = {
  id: string;
  charName: string;
  text: string;
  ts: number;
  likes: number;
  liked: boolean;
  comments: { username: string; content: string }[];
  location: string;
};

/** 朋友圈随机地点池 */
const MOMENT_LOCATIONS = [
  '鹿角奶茶店', '回头草咖啡', '云顶商场', '南门小吃街',
  '落日居酒屋', '二十四帧电影院', '龙与骰子桌游卡牌店',
  '校门口便利店', '银杏树下步道', '人工湖岸', '环湖步道',
  '操场看台', '图书馆', '食堂', 'B102教室', 'A204教室',
  '沈家别墅', '健身房', '公园', '超市', '地铁站',
  '甜品店', '花店', '书店', '酒吧', 'KTV', '火锅店',
  '日料店', '西餐厅', '面包房', '便利店', '宠物店',
];

/** 随机选一个朋友圈发布地点 */
export function randomMomentLocation(): string {
  return MOMENT_LOCATIONS[Math.floor(Math.random() * MOMENT_LOCATIONS.length)];
}

/** 生成角色朋友圈动态（副AI） */
export async function generateMoment(
  charName: string,
  personaContent: string,
  context: string,
  subApi: SubApiConfig,
): Promise<string> {
  console.info(`[phoneApi] 生成 ${charName} 的朋友圈动态`);
  // 从预设读取破限提示词
  const jailbreakPrompt = getPresetJailbreakPrompt();

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 0.95,
      max_tokens: 2000,
    },
    ordered_prompts: [
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      { role: 'system', content: personaContent || `你是${charName}，请以该角色的身份发一条朋友圈。` },
      {
        role: 'system',
        content:
          '你正在发微信朋友圈。要求：1) 30-80字 2) 符合角色性格 3) 可以是日常心情、吐槽、分享、炫耀等 4) 不要写动作描写 5) 只输出朋友圈正文内容本身 6) 不要用引号包裹内容 7) 不要输出任何JSON或代码块格式 8) 不要在结尾加任何解释或备注 9) 不要使用任何emoji表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等方括号文字）',
      },
      { role: 'user', content: context },
    ],
  });
  if (typeof result !== 'string') return '';
  // 清理 AI 输出：去除引号、代码块标记、多余空白
  let cleaned = result.trim();
  // 去除代码块包裹
  cleaned = cleaned.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
  // 去除首尾引号（中文引号、英文引号）
  cleaned = cleaned.replace(/^["""''']+|["""''']+$/g, '');
  // 去除首尾的「」『』
  cleaned = cleaned.replace(/^[\u300c\u300e]+|[\u300d\u300f]+$/g, '');
  // 去除 emoji
  cleaned = stripEmoji(cleaned);
  return cleaned.trim();
}

/**
 * 生成朋友圈评论回复（副AI）
 *
 * 玩家评论后，发朋友圈的角色或随机网友会回复玩家评论。
 * 如果该朋友圈是关联角色发的，用其人设生成回复；否则用随机网友身份回复。
 *
 * @param moment 朋友圈动态
 * @param playerComment 玩家的评论内容
 * @param charName 发圈角色名
 * @param personaContent 发圈角色的人设条目内容（如果有的话）
 * @param context 当前上下文（时间、天气等）
 * @param subApi 副API配置
 * @param playerName 玩家名
 * @returns 0-2条评论回复
 */
export async function generateMomentReply(
  moment: PhoneMoment,
  playerComment: string,
  charName: string,
  personaContent: string,
  context: string,
  subApi: SubApiConfig,
  playerName: string,
): Promise<{ username: string; content: string }[]> {
  console.info(`[phoneApi] 生成朋友圈 "${moment.text.slice(0, 20)}..." 的评论回复`);
  // 从预设读取破限提示词
  const jailbreakPrompt = getPresetJailbreakPrompt();

  // existingComments 只包含玩家评论之前的已有评论，避免与 playerComment 重复
  const existingComments = moment.comments
    .filter((c) => c.username !== playerName || c.content !== playerComment)
    .map((c) => `${c.username}：${c.content}`).join('\n');

  let result: string | unknown;
  try {
    result = await generateRaw({
      should_silence: true,
      max_chat_history: 0,
      custom_api: {
        apiurl: subApi.apiurl || undefined,
        key: subApi.key || undefined,
        model: subApi.model,
        source: subApi.source || 'openai',
        temperature: 0.95,
        max_tokens: 1500,
      },
      ordered_prompts: [
        ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
        {
          role: 'system',
          content: `你正在模拟微信朋友圈评论。${charName}发了一条朋友圈："${moment.text}"。${existingComments ? `\n已有评论：\n${existingComments}` : ''}\n${playerName}评论：${playerComment}\n\n规则：1) 生成${charName}对${playerName}评论的回复，1-2条 2) 回复者只能是${charName}本人，不能出现其他路人或网友 3) 回复简短自然，符合社交媒体风格 4) ${charName}的回复要符合其角色性格 5) 如果生成2条回复，它们必须是连贯的对话——比如第一条是直接回复${playerName}的评论，第二条是对第一条的补充、追问、或者自言自语的延伸。两条回复之间要有逻辑关联，不能是两个无关的话题 6) 不要使用任何emoji表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等方括号文字） 7) 只输出JSON，不要输出任何其他内容 8) JSON格式：{"replies":[{"username":"${charName}","content":"回复内容"}]}`,
        },
        // 仅当 personaContent 非空时才发送角色人设，避免空 system 消息导致 API 异常
        ...(personaContent && personaContent.trim() ? [{ role: 'system' as const, content: `角色人设：${personaContent.slice(0, 500)}` }] : []),
        { role: 'system', content: `当前背景：${context}` },
        { role: 'user', content: `生成1-2条评论回复。如果生成2条，第二条必须和第一条连贯（比如补充说明、追问、延伸话题），不能是无关内容。只输出JSON，不要输出任何其他内容。` },
      ],
    });
  } catch (err) {
    console.error('[phoneApi] generateRaw 调用失败（朋友圈评论回复）:', err);
    return [];
  }

  if (typeof result !== 'string') {
    console.warn('[phoneApi] 朋友圈评论回复结果不是字符串:', JSON.stringify(result).slice(0, 300));
    return [];
  }

  const trimmed = result.trim();
  if (!trimmed) {
    console.warn('[phoneApi] 朋友圈评论回复结果为空');
    return [];
  }

  console.info('[phoneApi] 朋友圈评论回复原始内容（前200字）:', trimmed.slice(0, 200));

  // 尝试多种方式提取 JSON
  try {
    let parsed: any = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try { parsed = JSON.parse(codeBlockMatch[1].trim()); } catch { /* continue */ }
      }
    }
    if (!parsed) {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* continue */ }
      }
    }

    if (parsed && parsed.replies && Array.isArray(parsed.replies)) {
      const replies = parsed.replies
        .filter((r: any) => r && typeof r === 'object')
        .map((r: any) => ({
          username: String(r.username || r.name || '匿名用户'),
          content: stripEmoji(String(r.content || r.text || '')),
        }))
        .filter((r: { content: string }) => r.content.length > 0);
      console.info(`[phoneApi] 朋友圈评论回复解析成功，共 ${replies.length} 条`);
      return replies;
    }

    if (parsed && Array.isArray(parsed)) {
      const replies = parsed
        .filter((r: any) => r && typeof r === 'object')
        .map((r: any) => ({
          username: String(r.username || r.name || '匿名用户'),
          content: String(r.content || r.text || ''),
        }))
        .filter((r: { content: string }) => r.content.length > 0);
      if (replies.length > 0) return replies;
    }

    console.warn('[phoneApi] 朋友圈评论回复 JSON 解析失败，结构不符:', JSON.stringify(parsed).slice(0, 300));
  } catch (err) {
    console.error('[phoneApi] 朋友圈评论回复 JSON 解析异常:', err, '原始内容:', trimmed.slice(0, 300));
  }

  // 文本降级：如果模型没返回有效JSON，尝试直接用原始文本作为角色回复
  const textLines = trimmed.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (textLines.length >= 1) {
    const fallbackReplies: { username: string; content: string }[] = [];
    for (const line of textLines.slice(0, 2)) {
      // 尝试 "用户名：内容" 格式
      const m = line.match(/^(.+?)[：:]\s*(.+)$/);
      if (m) {
        fallbackReplies.push({ username: charName, content: m[2].trim().slice(0, 200) });
      } else {
        // 纯文本行，直接作为角色回复
        fallbackReplies.push({ username: charName, content: line.slice(0, 200) });
      }
    }
    if (fallbackReplies.length > 0) {
      console.info(`[phoneApi] 朋友圈评论回复使用文本降级，共 ${fallbackReplies.length} 条`);
      return fallbackReplies;
    }
  }

  return [];
}

/** 从聊天变量读取朋友圈动态 */
export function loadPhoneMoments(): PhoneMoment[] {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars || typeof vars !== 'object') return [];
    const moments = (vars as any).phoneMoments;
    if (!Array.isArray(moments)) return [];
    // 旧数据兼容：为缺少 location 的朋友圈补充默认值
    return moments.map((m: any) => ({
      ...m,
      location: m.location || '未知地点',
    }));
  } catch {
    return [];
  }
}

/** 将朋友圈动态写入聊天变量 */
export function savePhoneMoments(moments: PhoneMoment[]): void {
  try {
    updateVariablesWith((vars) => ({ ...vars, phoneMoments: moments }), { type: 'chat' });
  } catch {
    console.warn('[phoneApi] 无法持久化朋友圈动态到聊天变量');
  }
}

// ════════════════════════════════════════
//  群聊（Group Chat）
// ════════════════════════════════════════

export type GroupChat = {
  id: string;
  name: string;
  memberNames: string[];
};

export type GroupMessage = {
  id: string;
  ts: number;
  /** 游戏内时间戳（格式如 "10/8 19:30"），用于世界书摘要中让AI区分消息发送时间 */
  gameTs?: string;
  text: string;
  from: string;
  read: boolean;
  /** 标记为 AI 压缩生成的聊天摘要（UI 显示为灰色卡片而非聊天气泡） */
  isSummary?: boolean;
  /** 摘要消息所包含的原始消息（用于查看压缩记录；嵌套压缩时继承子摘要的原始消息） */
  originalMessages?: GroupMessage[];
};

/** 生成群聊消息（副AI，模拟群成员中随机一人回复） */
export async function generateGroupMessage(
  groupName: string,
  memberNames: string[],
  history: GroupMessage[],
  context: string,
  personas: { name: string; content: string }[],
  subApi: SubApiConfig,
  playerName: string,
): Promise<{ sender: string; text: string } | null> {
  console.info(`[phoneApi] 生成群聊 ${groupName} 的消息`);
  const personaSummary = personas.map((p) => `【${p.name}】${p.content.slice(0, 200)}`).join('\n');
  // 从预设读取破限提示词
  const jailbreakPrompt = getPresetJailbreakPrompt();

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 0.9,
      max_tokens: 1000,
    },
    ordered_prompts: [
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      {
        role: 'system',
        content: `你是一个微信群聊模拟器。群名：${groupName}。群成员：${memberNames.join('、')}、${playerName}。\n以下是各成员的人设简介：\n${personaSummary}\n\n规则：1) 从群成员中随机选一人回复 2) 回复简短自然1-3句 3) 符合角色性格 4) 可以@${playerName}或回应之前的话题 5) 不要使用任何emoji表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等方括号文字） 6) 只输出JSON格式：{"sender":"角色名","text":"消息内容"} 7) 如果回复的角色在消息中表达了要前往某地的意图（如"我这就过去"、"我出发了"），在text字段末尾另起一行输出 [move:父地点/子地点] 或 [move:父地点] 来标记目的地。这个标签不会被玩家看到。如果没有移动意图，不要输出此标签`,
      },
      ...history.slice(-10).map((msg) => ({
        role: (msg.from === 'player' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: `${msg.from === 'player' ? playerName : msg.from}：${msg.text}`,
      })),
      { role: 'user', content: context },
    ],
  });

  if (typeof result !== 'string' || !result.trim()) return null;
  try {
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.sender && parsed.text) {
        return { sender: String(parsed.sender), text: stripEmoji(String(parsed.text).trim()) };
      }
    }
  } catch { /* fallthrough */ }
  // 降级：直接用原始文本，随机选一个成员
  const randomMember = memberNames[Math.floor(Math.random() * memberNames.length)];
  return { sender: randomMember, text: stripEmoji(result.trim().slice(0, 100)) };
}

/** 从聊天变量读取群聊列表 */
export function loadGroupChats(): GroupChat[] {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars || typeof vars !== 'object') return [];
    const groups = (vars as any).phoneGroups;
    return Array.isArray(groups) ? groups : [];
  } catch {
    return [];
  }
}

/** 将群聊列表写入聊天变量 */
export function saveGroupChats(groups: GroupChat[]): void {
  try {
    updateVariablesWith((vars) => ({ ...vars, phoneGroups: groups }), { type: 'chat' });
  } catch {
    console.warn('[phoneApi] 无法持久化群聊列表到聊天变量');
  }
}

/** 从聊天变量读取某群聊的消息历史 */
export function loadGroupMessages(groupId: string): GroupMessage[] {
  try {
    const vars = getVariables({ type: 'chat' });
    if (!vars || typeof vars !== 'object') return [];
    const allMsgs = (vars as any).phoneGroupMessages;
    if (!allMsgs || typeof allMsgs !== 'object') return [];
    const msgs = allMsgs[groupId];
    return Array.isArray(msgs) ? msgs : [];
  } catch {
    return [];
  }
}

/** 将某群聊的消息历史写入聊天变量 */
export function saveGroupMessages(groupId: string, messages: GroupMessage[]): void {
  try {
    updateVariablesWith(
      (vars) => {
        const allMsgs = (vars as any).phoneGroupMessages || {};
        return { ...vars, phoneGroupMessages: { ...allMsgs, [groupId]: messages } };
      },
      { type: 'chat' },
    );
  } catch {
    console.warn('[phoneApi] 无法持久化群聊消息到聊天变量');
  }
}

// ════════════════════════════════════════
//  论坛回复（Forum Reply）
// ════════════════════════════════════════

/** 生成论坛帖子的新回复（副AI，模拟论坛讨论） */
export async function generateForumReply(
  post: ForumPost,
  playerReply: string | null,
  context: string,
  subApi: SubApiConfig,
  playerName: string,
  replyTarget?: { username: string; content: string } | null,
): Promise<{ username: string; content: string; replyTo?: string }[]> {
  console.info(`[phoneApi] 生成论坛帖子 "${post.title}" 的新回复${replyTarget ? `，回复目标: ${replyTarget.username}` : ''}`);
  // 从预设读取破限提示词
  const jailbreakPrompt = getPresetJailbreakPrompt();
  const existingReplies = post.replies.map((r) => r.replyTo ? `${r.username}（回复${r.replyTo}）：${r.content}` : `${r.username}：${r.content}`).join('\n');
  const playerLine = playerReply ? (replyTarget ? `\n${playerName}回复${replyTarget.username}（“${replyTarget.content}”）：${playerReply}` : `\n${playerName}回复：${playerReply}`) : '';
  const boardName = post.board || '首页';

  let result: string | unknown;
  try {
    result = await generateRaw({
      should_silence: true,
      max_chat_history: 0,
      custom_api: {
        apiurl: subApi.apiurl || undefined,
        key: subApi.key || undefined,
        model: subApi.model,
        source: subApi.source || 'openai',
        temperature: 1.0,
        max_tokens: 4000,
      },
      ordered_prompts: [
        ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
        {
          role: 'system',
          content: `你是燕大匿名论坛系统。为已有帖子生成2-4条新的网友回复。规则：
1) 禁止出现真实角色名
2) 回复者用不同的随机用户名
3) 回复内容多样、有趣、有不同观点
4) 楼主（${post.username}）应该继续发言，补充内容、回应质疑、或者推进故事，不能发完帖子就消失
5) 如果有人回复了某个网友，该网友有可能回复他，也可能不理他
6) 其他人可能顺着${playerName}的话继续讨论
7) 对于灵异、推理、故事类帖子，楼主必须继续推进剧情，不能只回复无关内容
8) 不要使用任何emoji表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等方括号文字）
9) 只输出JSON，不要输出任何其他文字
10) 每条回复必须是一个完整的对象，包含username和content两个字段，不能把用户名、内容、回复目标拆分到不同对象中
11) JSON格式严格如下：
{"replies":[{"username":"用户名","content":"回复内容","replyTo":"被回复的用户名"}]}
其中replyTo是可选字段，表示回复的是哪位网友。如果没有特定回复对象，就不要加replyTo字段。
示例：
{"replies":[{"username":"吃瓜群众","content":"这也太离谱了吧😂"},{"username":"${post.username}","content":"我也觉得很离谱，但确实是真的","replyTo":"吃瓜群众"}]}`,
        },
        { role: 'system', content: `帖子板块：${boardName}\n帖子标题：${post.title}\n帖子内容：${post.content}\n已有回复：\n${existingReplies}${playerLine}` },
        { role: 'system', content: `当前校园背景：${context}` },
        { role: 'user', content: `请生成2-4条新回复。${replyTarget ? `${playerName}回复了${replyTarget.username}的评论，${replyTarget.username}有较大概率回复${playerName}。` : ''}其中至少一条必须是楼主（${post.username}）的回复。如果有网友被回复了，该网友有概率回复。只输出JSON，不要输出任何其他内容。` },
      ],
    });
  } catch (err) {
    console.error('[phoneApi] generateRaw 调用失败（论坛回复）:', err);
    return [];
  }

  console.info('[phoneApi] 论坛回复 generateRaw 返回类型:', typeof result, '内容长度:', typeof result === 'string' ? result.length : 'N/A');

  if (typeof result !== 'string') {
    console.warn('[phoneApi] 论坛回复结果不是字符串:', JSON.stringify(result).slice(0, 300));
    return [];
  }

  const trimmed = result.trim();
  if (!trimmed) {
    console.warn('[phoneApi] 论坛回复结果为空字符串');
    return [];
  }

  console.info('[phoneApi] 论坛回复原始内容（前300字）:', trimmed.slice(0, 300));

  // 尝试多种方式提取 JSON
  try {
    // 方式1：直接 parse
    let parsed: any = null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // 方式2：提取 ```json ... ``` 代码块
      const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try { parsed = JSON.parse(codeBlockMatch[1].trim()); } catch { /* continue */ }
      }
    }

    // 方式3：提取第一个 { 到最后一个 } 的内容
    if (!parsed) {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* continue */ }
      }
    }

    if (parsed && parsed.replies && Array.isArray(parsed.replies)) {
      const replies = parsed.replies
        .filter((r: any) => r && typeof r === 'object')
        .map((r: any) => ({
          username: String(r.username || r.name || '匿名用户'),
          content: String(r.content || r.text || ''),
          replyTo: (r.replyTo || r.reply_to) ? String(r.replyTo || r.reply_to) : undefined,
        }))
        .filter((r: { content: string }) => r.content.length > 0);
      console.info(`[phoneApi] 论坛回复解析成功，共 ${replies.length} 条`);
      return replies;
    }

    // 方式4：如果 parse 成功但结构不对，检查是否有 replies 字段
    if (parsed && !parsed.replies) {
      // 可能直接返回了数组
      if (Array.isArray(parsed)) {
        const replies = parsed
          .filter((r: any) => r && typeof r === 'object')
          .map((r: any) => ({
            username: String(r.username || r.name || '匿名用户'),
            content: String(r.content || r.text || ''),
            replyTo: (r.replyTo || r.reply_to) ? String(r.replyTo || r.reply_to) : undefined,
          }))
          .filter((r: { content: string }) => r.content.length > 0);
        if (replies.length > 0) {
          console.info(`[phoneApi] 论坛回复解析成功（数组格式），共 ${replies.length} 条`);
          return replies;
        }
      }
      console.warn('[phoneApi] 论坛回复 JSON 解析成功但结构不符:', JSON.stringify(parsed).slice(0, 300));
    }
  } catch (err) {
    console.error('[phoneApi] 论坛回复 JSON 解析失败:', err, '原始内容:', trimmed.slice(0, 500));
  }

  // 方式5：文本降级 — 如果模型没返回JSON，尝试按行解析纯文本回复
  // 格式如 "用户名：回复内容" 或 "用户名: 回复内容"
  const textLines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (textLines.length >= 1) {
    const fallbackReplies: { username: string; content: string }[] = [];
    for (const line of textLines.slice(0, 5)) {
      // 尝试 "用户名：内容" 或 "用户名: 内容" 格式
      const m = line.match(/^(.+?)[：:]\s*(.+)$/);
      if (m) {
        fallbackReplies.push({ username: m[1].trim(), content: m[2].trim() });
      }
    }
    if (fallbackReplies.length > 0) {
      console.info(`[phoneApi] 论坛回复使用文本降级解析，共 ${fallbackReplies.length} 条`);
      return fallbackReplies;
    }

    // 最后降级：把整段文本作为一条匿名回复
    if (trimmed.length > 5 && trimmed.length < 500) {
      console.info('[phoneApi] 论坛回复使用整段文本降级为1条回复');
      return [{ username: '匿名用户', content: trimmed.slice(0, 200) }];
    }
  }

  return [];
}

// ════════════════════════════════════════
//  聊天记录压缩（Summarize）
// ════════════════════════════════════════

/**
 * 从消息文本中解析 [move:地点] 标签
 *
 * @param text AI 生成的原始消息文本
 * @returns { cleanText: 去除标签后的纯文本, moveTarget: 移动目标地点（如 "南门小吃街/小吃摊"）或 null }
 */
export function parseMoveTag(text: string): { cleanText: string; moveTarget: string | null } {
  const match = text.match(/\[move:([^\]]+)\]/);
  if (!match) return { cleanText: text, moveTarget: null };
  const moveTarget = match[1].trim();
  const cleanText = text.replace(/\s*\[move:[^\]]+\]\s*$/, '').trim();
  return { cleanText, moveTarget };
}

/**
 * 压缩私聊消息历史 — 将旧消息交给副AI总结为一段摘要
 *
 * @param charName 角色名
 * @param messagesToCompress 需要压缩的消息（通常是除最近N条以外的所有消息）
 * @param subApi 副API配置
 * @param playerName 玩家名
 * @returns AI 生成的摘要文本
 */
export async function summarizeChatHistory(
  charName: string,
  messagesToCompress: PhoneMessage[],
  subApi: SubApiConfig,
  playerName: string,
): Promise<string> {
  console.info(`[phoneApi] 压缩 ${charName} 的聊天记录，共 ${messagesToCompress.length} 条消息`);

  const historyText = messagesToCompress.map((m) => {
    const sender = m.from === 'char' ? charName : playerName;
    const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
    return `${timeLabel}${sender}：${m.text}`;
  }).join('\n');

  const jailbreakPrompt = getPresetJailbreakPrompt();

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 0.7,
      max_tokens: 1500,
    },
    ordered_prompts: [
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      {
        role: 'system',
        content: `你是一个聊天记录总结助手。以下是${charName}和${playerName}之间的微信聊天记录。请将其总结为一段精简的摘要，保留关键事件、约定、情感变化、重要信息，去掉无关紧要的寒暄和重复内容。摘要应该用第三人称叙述，让人能快速了解之前聊了什么。只输出摘要正文，不要加任何标题或前缀。`,
      },
      { role: 'user', content: `以下是聊天记录：\n${historyText}\n\n请总结以上聊天记录，保留关键信息，200-400字。` },
    ],
  });

  const text = typeof result === 'string' ? result.trim() : '';
  if (!text) {
    console.warn(`[phoneApi] ${charName} 的聊天记录压缩结果为空`);
  }
  return text;
}

/**
 * 压缩群聊消息历史 — 将旧消息交给副AI总结为一段摘要
 *
 * @param group 群聊信息
 * @param messagesToCompress 需要压缩的消息
 * @param subApi 副API配置
 * @param playerName 玩家名
 * @returns AI 生成的摘要文本
 */
export async function summarizeGroupChatHistory(
  group: GroupChat,
  messagesToCompress: GroupMessage[],
  subApi: SubApiConfig,
  playerName: string,
): Promise<string> {
  console.info(`[phoneApi] 压缩群聊 ${group.name} 的记录，共 ${messagesToCompress.length} 条消息`);

  const historyText = messagesToCompress.map((m) => {
    const sender = m.from === 'player' ? playerName : m.from;
    const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
    return `${timeLabel}${sender}：${m.text}`;
  }).join('\n');

  const jailbreakPrompt = getPresetJailbreakPrompt();

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 0.7,
      max_tokens: 1500,
    },
    ordered_prompts: [
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      {
        role: 'system',
        content: `你是一个群聊记录总结助手。以下是群聊「${group.name}」（成员：${group.memberNames.join('、')}、${playerName}）的聊天记录。请将其总结为一段精简的摘要，保留关键事件、约定、重要讨论，去掉无关紧要的寒暄和重复内容。摘要应该用第三人称叙述。只输出摘要正文，不要加任何标题或前缀。`,
      },
      { role: 'user', content: `以下是群聊记录（每条消息前方的[时间]表示该消息的发送时间）：\n${historyText}\n\n请总结以上群聊记录，保留关键信息，200-400字。` },
    ],
  });

  const text = typeof result === 'string' ? result.trim() : '';
  if (!text) {
    console.warn(`[phoneApi] 群聊 ${group.name} 的记录压缩结果为空`);
  }
  return text;
}

/**
 * 压缩论坛帖子回复 — 将旧回复交给副AI总结为一段摘要
 *
 * @param post 论坛帖子
 * @param repliesToCompress 需要压缩的回复
 * @param subApi 副API配置
 * @returns AI 生成的摘要文本
 */
export async function summarizeForumReplies(
  post: ForumPost,
  repliesToCompress: { username: string; content: string }[],
  subApi: SubApiConfig,
): Promise<string> {
  console.info(`[phoneApi] 压缩论坛帖子 "${post.title}" 的回复，共 ${repliesToCompress.length} 条`);

  const repliesText = repliesToCompress.map((r) => `${r.username}：${r.content}`).join('\n');

  const jailbreakPrompt = getPresetJailbreakPrompt();

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 0.7,
      max_tokens: 1000,
    },
    ordered_prompts: [
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      {
        role: 'system',
        content: `你是一个论坛回复总结助手。以下是帖子「${post.title}」（发帖人：${post.username}）的回复记录。请将其总结为一段精简的摘要，保留关键讨论、主要观点、争论焦点，去掉无关紧要的回复。摘要应该用第三人称叙述。只输出摘要正文，不要加任何标题或前缀。`,
      },
      { role: 'user', content: `帖子内容：${post.content}\n\n以下是回复：\n${repliesText}\n\n请总结以上回复，保留关键讨论，150-300字。` },
    ],
  });

  const text = typeof result === 'string' ? result.trim() : '';
  if (!text) {
    console.warn(`[phoneApi] 论坛帖子 "${post.title}" 的回复压缩结果为空`);
  }
  return text;
}

// ── 派单描述生成 ──

/** 派单候选人（前端已掷好时长/时间/价格） */
export type DispatchCandidate = {
  name: string;
  /** 角色人设摘要（来自 gameData.ts 的 desc + tags + likes + dislikes） */
  personaSummary: string;
  /** 服务时长（小时） */
  durationHours: number;
  /** 预约时间，格式 "MM月DD日 HH:mm" */
  scheduledTimeStr: string;
  /** 日费率 */
  dailyRate: number;
  /** 角色在预约时间段的日程状态（空闲/有课/打工等），由前端从日程表查询 */
  scheduleStatus?: string;
};

/**
 * 一次性调用副API为 3 个角色各生成一段下单描述
 *
 * AI 输出格式：
 * <order name="角色名">下单消息内容</order>
 *
 * @param candidates 3 个候选人
 * @param gameTime 当前游戏时间
 * @param weatherType 当前天气
 * @param subApi 副API配置
 * @returns { 角色名 → 描述文本 } 的映射
 */
export async function generateDispatchOrders(
  candidates: DispatchCandidate[],
  gameTime: Date,
  weatherType: string,
  subApi: SubApiConfig,
): Promise<Record<string, string>> {
  console.info(`[phoneApi] 生成 ${candidates.length} 个派单描述`);

  const jailbreakPrompt = getPresetJailbreakPrompt();
  const season = gameTime.getMonth() + 1 >= 3 && gameTime.getMonth() + 1 <= 6
    ? '春季学期' : gameTime.getMonth() + 1 >= 9 ? '秋季学期' : '假期';

  // 构建每个角色的信息块
  const charBlocks = candidates.map((c, i) => {
    const scheduleLine = c.scheduleStatus ? `当前状态：${c.scheduleStatus}` : '';
    return [`--- 候选 ${i + 1} ---`, `角色名：${c.name}`, `人设摘要：${c.personaSummary}`, `预约时间：${c.scheduledTimeStr}`, `服务时长：${c.durationHours} 小时`, `日费率：${c.dailyRate} 元/天`, scheduleLine].filter(Boolean).join('\n');
  }).join('\n\n');

  const result = await generateRaw({
    should_silence: true,
    max_chat_history: 0,
    custom_api: {
      apiurl: subApi.apiurl || undefined,
      key: subApi.key || undefined,
      model: subApi.model,
      source: subApi.source || 'openai',
      temperature: 1.0,
      max_tokens: 3000,
    },
    ordered_prompts: [
      ...(jailbreakPrompt.trim() ? [{ role: 'system' as const, content: jailbreakPrompt }] : []),
      {
        role: 'system',
        content:
          `你是一个"租借男友"APP的派单系统模拟器。有${candidates.length}位客户想下单租借男友服务，请为每位客户写一段简短的下单消息。\n\n`
          + '要求：\n'
          + '1) 每段消息 2-4 句话，以该角色的语气和说话方式直接表达（第一人称）\n'
          + '2) 内容自然地包含：想做什么、什么时候（基于给定的预约时间）、在哪里（必须从下方提供的合法地点列表中选择，不可编造不存在的地点）\n'
          + '3) 不要提及具体价格数字\n'
          + '4) 不要使用任何 emoji 表情符号，也不要使用文字描述表情（如[捂脸]、[微笑]等）\n'
          + '5) 不要写动作描写或旁白\n'
          + `6) 输出格式：每位客户用 <order name="角色名">消息内容</order> 包裹，共输出 ${candidates.length} 个 order 标签\n`
          + '7) 只输出 3 个 order 标签，不要加任何其他内容\n'
          + '8) 下单内容要结合当前天气和角色的日程状态：恶劣天气下多选室内活动（看电影、吃饭、咖啡厅等），好天气多选户外活动（散步、游乐园、公园等）',
      },
      {
        role: 'system',
        content: `当前背景：${season}，${gameTime.getMonth() + 1}月${gameTime.getDate()}日，天气${weatherType}。\n\n合法地点列表（下单描述中的地点必须从中选择，格式为"区域名"或"区域名/子地点"，不可编造不在此列表中的地点）：\n${getAllLocationNames().join('、')}\n\n以下是${candidates.length}位客户的信息：\n\n${charBlocks}`,
      },
      { role: 'user', content: '请为以上三位客户各生成一段下单描述。' },
    ],
  });

  const raw = typeof result === 'string' ? result.trim() : '';
  if (!raw) {
    console.warn('[phoneApi] 派单描述生成结果为空');
    return {};
  }

  // 解析 <order name="角色名">内容</order>
  const orders: Record<string, string> = {};
  const re = /<order\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/order>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const name = match[1].trim();
    const content = match[2].trim();
    if (name && content) {
      orders[name] = stripEmoji(content);
    }
  }

  console.info(`[phoneApi] 派单描述解析完成，共 ${Object.keys(orders).length} 条`);
  return orders;
}
