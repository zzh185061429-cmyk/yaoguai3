/**
 * 手机系统状态管理
 *
 * 职责：
 * 1. 管理手机配置（角色关联、副API配置）
 * 2. 管理手机消息历史（聊天变量持久化）
 * 3. 管理论坛关注帖子 + 玩家回复
 * 4. 管理朋友圈动态（关联角色自动发）
 * 5. 管理群聊（玩家手动创建）
 * 6. 触发角色主动发消息
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGameContext } from './GameContext';
import {
  type PhoneConfig,
  type PhoneMessage,
  type PhoneCharLink,
  type PhoneMoment,
  type GroupChat,
  type GroupMessage,
  type ForumPost,
  type ForumBoard,
  type SubApiConfig,
  type WbEntryRef,
  loadPhoneConfig,
  savePhoneConfig,
  isSubApiReady,
  fetchModelList,
  loadPhoneMessages,
  savePhoneMessages,
  loadFollowedPosts,
  saveFollowedPosts,
  loadForumNpcPool,
  saveForumNpcPool,
  loadPhoneMoments,
  savePhoneMoments,
  loadGroupChats,
  saveGroupChats,
  loadGroupMessages,
  saveGroupMessages,
  generatePhoneMessage,
  generateForumPosts,
  generateMoment,
  generateGroupMessage,
  generateForumReply,
  generateMomentReply,
  parseMoveTag,
  summarizeChatHistory,
  summarizeGroupChatHistory,
  summarizeForumReplies,
  createCharChatLogEntry,
  updateCharChatLogEntry,
  deleteCharChatLogEntry,
  createGroupChatLogEntry,
  updateGroupChatLogEntry,
  deleteGroupChatLogEntry,
  ensureAllCharChatLogEntries,
  ensureAllGroupChatLogEntries,
  summarizeGroupMessages,
  readPersonaEntry,
  followForumPost,
  unfollowForumPost,
  listAllWorldbookEntries,
  genMsgId,
  summarizeMessages,
  getRecentStoryContext,
  getLatestGameTs,
  detectOrderIntent,
} from '../utils/phoneApi';
import { getWeather } from '../data/weather';
import { getCharacterLocation, getGenericActivity } from '../data/scheduleData';

type PhoneContextType = {
  // ── 配置 ──
  config: PhoneConfig;
  isReady: boolean;
  // ── 消息 ──
  messages: Record<string, PhoneMessage[]>;
  unreadCount: number;
  // ── 论坛 ──
  followedPosts: ForumPost[];
  // ── 朋友圈 ──
  moments: PhoneMoment[];
  // ── 群聊 ──
  groupChats: GroupChat[];
  groupMessages: Record<string, GroupMessage[]>;
  groupUnreadCount: number;
  // ── 手机界面状态 ──
  isPhoneOpen: boolean;
  openPhone: () => void;
  closePhone: () => void;
  // ── 派单通知 ──
  dispatchBadge: number;
  clearDispatchBadge: () => void;
  // ── 配置操作 ──
  saveSubApi: (subApi: SubApiConfig) => void;
  addCharacter: (name: string, personaEntryName: string, worldbookName: string, avatar?: string) => Promise<void>;
  removeCharacter: (name: string) => Promise<void>;
  toggleCharacter: (name: string) => void;
  setGuideShown: (shown: boolean) => void;
  setAutoMessageEnabled: (enabled: boolean) => void;
  getEntryList: () => Promise<WbEntryRef[]>;
  // ── 消息操作 ──
  sendMessage: (charName: string, text: string) => Promise<void>;
  markRead: (charName: string) => void;
  clearChatHistory: (charName: string) => Promise<void>;
  deleteMessage: (charName: string, msgId: string) => Promise<void>;
  // ── 论坛操作 ──
  refreshForum: (board?: ForumBoard) => Promise<ForumPost[]>;
  followPost: (post: ForumPost) => Promise<void>;
  unfollowPost: (postId: string) => Promise<void>;
  replyForumPost: (post: ForumPost, text: string, replyTarget?: { username: string; content: string } | null) => Promise<ForumPost | null>;
  // ── 朋友圈操作 ──
  refreshMoments: (force?: boolean) => Promise<void>;
  initMoments: () => Promise<void>;
  likeMoment: (id: string) => void;
  commentMoment: (id: string, content: string) => Promise<void>;
  // ── 群聊操作 ──
  createGroupChat: (name: string, memberNames: string[]) => void;
  removeGroupChat: (id: string) => void;
  sendGroupMessage: (groupId: string, text: string) => Promise<void>;
  markGroupRead: (groupId: string) => void;
  clearGroupChatHistory: (groupId: string) => Promise<void>;
  deleteGroupMessage: (groupId: string, msgId: string) => Promise<void>;
  // ── 触发 ──
  triggerAutoMessages: () => Promise<void>;
  // ── 自动注入条目 ──
  ensureChatLogEntries: () => Promise<void>;
  // ── 数据压缩 ──
  compressCharChat: (charName: string, keepRecent?: number) => Promise<boolean>;
  compressGroupChat: (groupId: string, keepRecent?: number) => Promise<boolean>;
  compressForumPost: (postId: string, keepRecent?: number) => Promise<boolean>;
  // ── 手动压缩选定消息 ──
  compressSelectedMessages: (charName: string, msgIds: string[]) => Promise<boolean>;
  compressSelectedGroupMessages: (groupId: string, msgIds: string[]) => Promise<boolean>;
};

const PhoneContext = createContext<PhoneContextType | undefined>(undefined);

// ── 触发冷却 ──
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 每个角色单聊冷却4小时（现实时间）
const GLOBAL_COOLDOWN_MS = 30 * 60 * 1000; // 全局冷却：任意角色发过消息后30分钟内不再触发
const MOMENT_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 朋友圈冷却3小时

/** 获取角色当前所在地点，用于朋友圈发布地点 */
function getCharLocationForMoment(charName: string, gameTime: Date, overrides: Record<string, string>): string {
  const loc = getCharacterLocation(charName, gameTime, overrides);
  if (!loc) return '未知地点';
  // 如果有父地点，返回 "父地点/子地点" 或仅 "父地点" 的简洁形式
  if (loc.parentLocation) return loc.parentLocation;
  return loc.location;
}

/**
 * 生成租借男友APP的时间线提示，用于论坛/朋友圈生成时约束AI内容
 * 10月9日前：禁止提及租借男友相关内容
 * 10月9日及以后：允许提及
 */
function knowsRentAppHint(gameTime: Date): string {
  const month = gameTime.getMonth() + 1;
  const day = gameTime.getDate();
  const knows = month > 10 || (month === 10 && day >= 9);
  return knows
    ? ''
    : '注意：目前校园中还没有人知道「租借男友」APP的存在，论坛帖子和朋友圈中不应出现任何与租借男友服务相关的内容。';
}

/**
 * 判断角色是否知道「租借男友」APP
 * 规则：沈千金始终知道（她是APP的注册用户）；其他角色在10月9日及以后才知道
 */
function knowsRentApp(charName: string, gameTime: Date): boolean {
  if (charName === '沈千金') return true;
  const month = gameTime.getMonth() + 1;
  const day = gameTime.getDate();
  // 10月9日及以后，所有角色都知道
  return month > 10 || (month === 10 && day >= 9);
}

/**
 * 将一段文本按换行拆分为多条手机消息，模拟真人分条发送微信
 */
function splitIntoMessages(text: string, gameTs: string, from: 'char'): PhoneMessage[];
function splitIntoMessages(text: string, from: string, gameTs?: string): GroupMessage[];
function splitIntoMessages(text: string, p1: string, p2?: 'char' | string): PhoneMessage[] | GroupMessage[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  if (p2 === 'char') {
    // PhoneMessage 版本: p1 = gameTs, p2 = 'char'
    return lines.map((line, i) => ({
      id: genMsgId(),
      ts: Date.now() + i,
      gameTs: p1,
      text: line,
      from: 'char' as const,
      read: false,
    }));
  }
  // GroupMessage 版本: p1 = 发送者名, p2 = gameTs（可选）
  return lines.map((line, i) => ({
    id: genMsgId(),
    ts: Date.now() + i,
    gameTs: p2,
    text: line,
    from: p1,
    read: false,
  }));
}

export function PhoneProvider({ children }: { children: React.ReactNode }) {
  const { gameTime, currentLocation, characterServiceStates, playerName, scriptCharacterLocations, setScriptCharacterLocations } = useGameContext();
  const pName = playerName || '玩家';
  const [config, setConfig] = useState<PhoneConfig>(() => loadPhoneConfig());
  const [messages, setMessages] = useState<Record<string, PhoneMessage[]>>(() => loadPhoneMessages());
  // ref 始终指向最新的 messages，避免 sendMessage 等异步回调中的闭包陷阱
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [followedPosts, setFollowedPosts] = useState<ForumPost[]>(() => loadFollowedPosts());
  const [moments, setMoments] = useState<PhoneMoment[]>(() => loadPhoneMoments());
  const [groupChats, setGroupChats] = useState<GroupChat[]>(() => loadGroupChats());
  const [groupMessages, setGroupMessages] = useState<Record<string, GroupMessage[]>>(() => {
    // 加载所有群聊的消息
    const groups = loadGroupChats();
    const allMsgs: Record<string, GroupMessage[]> = {};
    for (const g of groups) {
      allMsgs[g.id] = loadGroupMessages(g.id);
    }
    return allMsgs;
  });
  // ref 始终指向最新的 groupMessages，避免异步回调中的闭包陷阱
  const groupMessagesRef = useRef(groupMessages);
  groupMessagesRef.current = groupMessages;
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [npcPool, setNpcPool] = useState<{ name: string; avatar: string }[]>(() => loadForumNpcPool());

  // ── 派单通知 badge：每天8点游戏时间触发，玩家点进派单APP后清除 ──
  const [dispatchBadge, setDispatchBadge] = useState(0);
  const lastDispatchDateKeyRef = useRef<string>('');
  const dispatchNotifiedRef = useRef<string>('');

  const isReady = isSubApiReady(config);

  // 使用 ref 追踪最新的 moments 和 followedPosts，避免异步回调中的闭包过期问题
  const momentsRef = useRef(moments);
  momentsRef.current = moments;
  const followedPostsRef = useRef(followedPosts);
  followedPostsRef.current = followedPosts;

/** 将游戏时间格式化为简短时间标签（如 "10/8 19:30"） */
const formatGameTs = (time: Date): string => {
  return `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
};

  // 持久化配置
  const saveConfig = useCallback((next: PhoneConfig) => {
    setConfig(next);
    savePhoneConfig(next);
  }, []);

  // 持久化消息（支持直接传值或函数式更新）
  const persistMessages = useCallback((nextOrUpdater: Record<string, PhoneMessage[]> | ((prev: Record<string, PhoneMessage[]>) => Record<string, PhoneMessage[]>)) => {
    setMessages(prev => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      savePhoneMessages(next);
      return next;
    });
  }, []);

  // 持久化论坛关注
  const persistFollowed = useCallback((next: ForumPost[]) => {
    setFollowedPosts(next);
    saveFollowedPosts(next);
  }, []);

  // 持久化朋友圈
  const persistMoments = useCallback((next: PhoneMoment[]) => {
    setMoments(next);
    savePhoneMoments(next);
  }, []);

  // 持久化群聊列表
  const persistGroupChats = useCallback((next: GroupChat[]) => {
    setGroupChats(next);
    saveGroupChats(next);
  }, []);

  // 持久化群聊消息
  const persistGroupMessages = useCallback((groupId: string, next: GroupMessage[]) => {
    setGroupMessages((prev) => {
      const updated = { ...prev, [groupId]: next };
      saveGroupMessages(groupId, next);
      return updated;
    });
  }, []);

  // ── 未读消息计数 ──
  const unreadCount = useMemo(() => {
    let count = 0;
    for (const charMessages of Object.values(messages)) {
      count += charMessages.filter((m) => m.from === 'char' && !m.read).length;
    }
    return count;
  }, [messages]);

  const groupUnreadCount = useMemo(() => {
    let count = 0;
    for (const msgs of Object.values(groupMessages)) {
      count += msgs.filter((m) => m.from !== 'player' && !m.read).length;
    }
    return count;
  }, [groupMessages]);

  // ── 手机界面操作 ──
  const openPhone = useCallback(() => setIsPhoneOpen(true), []);
  const closePhone = useCallback(() => setIsPhoneOpen(false), []);
  const clearDispatchBadge = useCallback(() => setDispatchBadge(0), []);

  // ── 配置操作 ──
  const saveSubApi = useCallback(
    (subApi: SubApiConfig) => saveConfig({ ...config, subApi }),
    [config, saveConfig],
  );

  const addCharacter = useCallback(
    async (name: string, personaEntryName: string, worldbookName: string, avatar?: string) => {
      const chatLogEntryName = await createCharChatLogEntry(name, pName);
      const newChar: PhoneCharLink = { name, personaEntryName, personaWorldbookName: worldbookName, chatLogEntryName, enabled: true, avatar };
      const nextMessages = { ...messages };
      delete nextMessages[name];
      persistMessages(nextMessages);
      saveConfig({ ...config, characters: [...config.characters, newChar] });
      console.info(`[Phone] 已关联角色: ${name} → 人设条目: ${personaEntryName}`);
    },
    [config, saveConfig, messages, persistMessages],
  );

  const removeCharacter = useCallback(
    async (name: string) => {
      const charLink = config.characters.find((c) => c.name === name);
      if (charLink) await deleteCharChatLogEntry(name);
      const nextMessages = { ...messages };
      delete nextMessages[name];
      persistMessages(nextMessages);
      saveConfig({ ...config, characters: config.characters.filter((c) => c.name !== name) });
      console.info(`[Phone] 已移除角色关联并清除聊天记录: ${name}`);
    },
    [config, saveConfig, messages, persistMessages],
  );

  const toggleCharacter = useCallback(
    (name: string) => saveConfig({ ...config, characters: config.characters.map((c) => c.name === name ? { ...c, enabled: !c.enabled } : c) }),
    [config, saveConfig],
  );

  const setGuideShown = useCallback((shown: boolean) => saveConfig({ ...config, guideShown: shown }), [config, saveConfig]);
  const setAutoMessageEnabled = useCallback((enabled: boolean) => saveConfig({ ...config, autoMessageEnabled: enabled }), [config, saveConfig]);
  const getEntryList = useCallback(async () => listAllWorldbookEntries(), []);

  // ── 消息操作 ──
  const sendMessage = useCallback(
    async (charName: string, text: string) => {
      if (!isReady) { console.warn('[Phone] 副API未配置'); return; }
      const charLink = config.characters.find((c) => c.name === charName);
      if (!charLink) { console.warn(`[Phone] 角色未关联: ${charName}`); return; }

      // 使用 formatGameTs 避免触发 MVU 写入导致的级联重渲染黑屏
      const playerMsg: PhoneMessage = { id: genMsgId(), ts: Date.now(), gameTs: formatGameTs(gameTime), text, from: 'player', read: true };
      const charHistory = messagesRef.current[charName] || [];
      const afterPlayer = [...charHistory, playerMsg];
      persistMessages(prev => ({ ...prev, [charName]: afterPlayer }));

      const personaContent = await readPersonaEntry(charLink.personaEntryName, charLink.personaWorldbookName);
      const weather = getWeather(gameTime);
      const storyContext = getRecentStoryContext(charName);
      // 注入角色当前所在位置
      const charLoc = getCharacterLocation(charName, gameTime, scriptCharacterLocations);
      const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」（正在${getGenericActivity(charLoc.location, charLoc.activity)}）。` : '';
      const orderHint = detectOrderIntent(charName, afterPlayer, gameTime);
      const context = `当前时间：${gameTime.getMonth() + 1}月${gameTime.getDate()}日 ${gameTime.getHours()}:${String(gameTime.getMinutes()).padStart(2, '0')}，天气：${weather.type}。${locDesc}${orderHint}${pName}刚给你发了微信消息，请回复。${storyContext ? '\n' + storyContext : ''}`;

      try {
        const replyText = await generatePhoneMessage(charName, personaContent, afterPlayer, context, config.subApi);
        if (replyText) {
          // 解析 [move:地点] 标签
          const { cleanText, moveTarget } = parseMoveTag(replyText);
          if (moveTarget) {
            console.info(`[Phone] ${charName} 移动到: ${moveTarget}`);
            setScriptCharacterLocations(prev => ({ ...prev, [charName]: moveTarget }));
          }
          const gameTs = getLatestGameTs(gameTime);
          const charMsgs = splitIntoMessages(cleanText, gameTs, 'char');
          const afterChar = [...afterPlayer, ...charMsgs];
          persistMessages(prev => ({ ...prev, [charName]: afterChar }));
          const summary = summarizeMessages(charName, afterChar, pName);
          await updateCharChatLogEntry(charName, summary);
          // 同步 MVU 时间（新消息已持久化到聊天变量）
          getLatestGameTs(gameTime);
        }
      } catch (err) { console.error('[Phone] 角色回复生成失败:', err); }
    },
    [isReady, config, gameTime, currentLocation, persistMessages, scriptCharacterLocations, setScriptCharacterLocations],
  );

  const markRead = useCallback(
    (charName: string) => {
      const charHistory = messages[charName];
      if (!charHistory) return;
      persistMessages({ ...messages, [charName]: charHistory.map((m) => ({ ...m, read: true })) });
    },
    [messages, persistMessages],
  );

  // ── 清空私聊记录（保留角色关联）──
  const clearChatHistory = useCallback(
    async (charName: string) => {
      const next = { ...messages };
      delete next[charName];
      persistMessages(next);
      // 重置世界书条目为初始模板内容
      const initialContent = `【手机聊天记录】${charName}的微信聊天记录将在此更新。\n（注：此为${charName}与${pName}之间的私密微信聊天记录，仅${charName}本人和${pName}知晓，其他角色不应知道或提及此内容。）`;
      await updateCharChatLogEntry(charName, initialContent);
      console.info(`[Phone] 已清空 ${charName} 的聊天记录`);
    },
    [messages, persistMessages, pName],
  );

  // ── 删除单条私聊消息 ──
  const deleteMessage = useCallback(
    async (charName: string, msgId: string) => {
      const charMessages = messages[charName];
      if (!charMessages) return;
      const next = charMessages.filter((m) => m.id !== msgId);
      const nextMessages = { ...messages, [charName]: next };
      persistMessages(nextMessages);
      // 重新生成世界书：摘要消息文本放【早期聊天摘要】，普通消息放【最近消息】
      if (next.length > 0) {
        const summaries = next.filter(m => m.isSummary);
        const summariesText = summaries.map(m => m.text).join('\n---\n');
        const recentMsgs = next.filter(m => !m.isSummary).slice(-15).map(m => {
          const sender = m.from === 'char' ? charName : pName;
          const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
          return `${timeLabel}${sender}：${m.text}`;
        }).join('\n');
        const wbContent = summariesText
          ? `【微信动态（私密信息）】${charName}最近在微信上的聊天记录。\n注意：此为${charName}与${pName}之间的私密对话，仅${charName}本人和${pName}知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n\n【早期聊天摘要】\n${summariesText}\n\n【最近消息】\n${recentMsgs}`
          : summarizeMessages(charName, next, pName);
        await updateCharChatLogEntry(charName, wbContent);
      } else {
        const initialContent = `【手机聊天记录】${charName}的微信聊天记录将在此更新。\n（注：此为${charName}与${pName}之间的私密微信聊天记录，仅${charName}本人和${pName}知晓，其他角色不应知道或提及此内容。）`;
        await updateCharChatLogEntry(charName, initialContent);
      }
      console.info(`[Phone] 已删除 ${charName} 的一条消息`);
    },
    [messages, persistMessages, pName],
  );

  // ── 论坛操作 ──
  const refreshForum = useCallback(async (board?: ForumBoard): Promise<ForumPost[]> => {
    if (!isReady) { console.warn('[Phone] 副API未配置'); return []; }
    const weather = getWeather(gameTime);
    const season = gameTime.getMonth() + 1 >= 3 && gameTime.getMonth() + 1 <= 6 ? '春季学期' : gameTime.getMonth() + 1 >= 9 ? '秋季学期' : '假期';
    const context = `当前是${season}，${gameTime.getMonth() + 1}月${gameTime.getDate()}日，天气${weather.type}。${knowsRentAppHint(gameTime)}`;
    const ts = getLatestGameTs(gameTime);
    try {
      const posts = await generateForumPosts(config.subApi, context, npcPool, board || '首页');
      // 为每个帖子和回复打上当前游戏时间戳
      const stampedPosts = posts.map(p => ({
        ...p,
        gameTs: ts,
        replies: p.replies.map(r => ({ ...r, gameTs: ts })),
      }));
      const newNpcs = stampedPosts.map((p) => ({ name: p.username, avatar: '' }));
      const mergedPool = [...npcPool];
      for (const npc of newNpcs) { if (!mergedPool.find((n) => n.name === npc.name)) mergedPool.push(npc); }
      if (mergedPool.length > 30) mergedPool.splice(0, mergedPool.length - 30);
      setNpcPool(mergedPool);
      saveForumNpcPool(mergedPool);
      return stampedPosts;
    } catch (err) { console.error('[Phone] 论坛刷新失败:', err); return []; }
  }, [isReady, config.subApi, gameTime, npcPool]);

  const followPost = useCallback(
    async (post: ForumPost) => { persistFollowed([...followedPosts, post]); await followForumPost(post); },
    [followedPosts, persistFollowed],
  );

  const unfollowPost = useCallback(
    async (postId: string) => { persistFollowed(followedPosts.filter((p) => p.id !== postId)); await unfollowForumPost(postId); },
    [followedPosts, persistFollowed],
  );

  // ── 论坛回复（玩家回复 + AI生成NPC新回复）──
  const replyForumPost = useCallback(
    async (post: ForumPost, text: string, replyTarget?: { username: string; content: string } | null): Promise<ForumPost | null> => {
      if (!isReady) return null;
      const ts = getLatestGameTs(gameTime);

      // 1. 玩家回复加入帖子（带游戏时间戳，标记回复目标）
      const updatedPost: ForumPost = {
        ...post,
        replies: [...post.replies, { username: pName, content: text, gameTs: ts, replyTo: replyTarget?.username }],
      };

      // 2. 如果帖子已关注，更新关注列表 — 使用 ref 获取最新状态
      const wasFollowed = followedPostsRef.current.some((p) => p.id === post.id);
      if (wasFollowed) {
        const nextFollowed = followedPostsRef.current.map((p) => p.id === post.id ? updatedPost : p);
        persistFollowed(nextFollowed);
      }

      // 3. 调副API生成NPC新回复
      const weather = getWeather(gameTime);
      const context = `${gameTime.getMonth() + 1}月${gameTime.getDate()}日，天气${weather.type}。`;
      try {
        const newReplies = await generateForumReply(updatedPost, text, context, config.subApi, pName, replyTarget);
        // 为NPC回复也打上游戏时间戳
        const stampedReplies = newReplies.map(r => ({ ...r, gameTs: ts }));
        const finalPost = stampedReplies.length > 0
          ? { ...updatedPost, replies: [...updatedPost.replies, ...stampedReplies] }
          : updatedPost;

        // 4. 如果帖子已关注，更新关注列表和世界书 — 使用 ref 获取最新状态，避免闭包过期
        if (wasFollowed) {
          const finalFollowed = followedPostsRef.current.map((p) => p.id === post.id ? finalPost : p);
          persistFollowed(finalFollowed);
          await followForumPost(finalPost);
          // 同步 MVU 时间（论坛回复已持久化到聊天变量）
          getLatestGameTs(gameTime);
        }
        return finalPost;
      } catch (err) {
        console.error('[Phone] 论坛回复生成失败:', err);
        return updatedPost;
      }
    },
    [isReady, persistFollowed, gameTime, config.subApi, pName],
  );

  // ── 朋友圈操作 ──
  const refreshMoments = useCallback(async (force: boolean = false) => {
    if (!isReady) return;
    const enabledChars = config.characters.filter((c) => c.enabled);
    if (enabledChars.length === 0) return;

    // 检查冷却：最后一条朋友圈发布时间（手动刷新可绕过）
    if (!force) {
      const lastMoment = moments[0];
      if (lastMoment && Date.now() - lastMoment.ts < MOMENT_COOLDOWN_MS) {
        console.info('[Phone] 朋友圈冷却中');
        return;
      }
    }

    // 随机选一个角色发朋友圈
    const char = enabledChars[Math.floor(Math.random() * enabledChars.length)];
    try {
      const personaContent = await readPersonaEntry(char.personaEntryName, char.personaWorldbookName);
      const weather = getWeather(gameTime);
      const hour = gameTime.getHours();
      const timeDesc = hour >= 6 && hour < 10 ? '早上' : hour >= 10 && hour < 14 ? '中午' : hour >= 14 && hour < 18 ? '下午' : hour >= 18 && hour < 22 ? '晚上' : '深夜';
      const charLoc = getCharacterLocation(char.name, gameTime, scriptCharacterLocations);
      const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」。` : '';
      const context = `当前${gameTime.getMonth() + 1}月${gameTime.getDate()}日${timeDesc}，天气${weather.type}。${locDesc}${knowsRentAppHint(gameTime)}请发一条朋友圈。`;
      const text = await generateMoment(char.name, personaContent, context, config.subApi);
      if (text) {
        const newMoment: PhoneMoment = { id: genMsgId(), charName: char.name, text, ts: Date.now(), likes: 0, liked: false, comments: [], location: getCharLocationForMoment(char.name, gameTime, scriptCharacterLocations) };
        const next = [newMoment, ...moments].slice(0, 50);
        persistMoments(next);
        console.info(`[Phone] ${char.name} 发了一条朋友圈`);
      }
    } catch (err) { console.error(`[Phone] ${char.name} 朋友圈生成失败:`, err); }
  }, [isReady, config, moments, gameTime, persistMoments, scriptCharacterLocations]);

  // ── 首次打开朋友圈时批量生成 ──
  const initMoments = useCallback(async () => {
    if (!isReady) return;
    // 已经有朋友圈内容则跳过
    if (moments.length > 0) return;
    const enabledChars = config.characters.filter((c) => c.enabled);
    if (enabledChars.length === 0) return;

    // 随机选 3 个角色（不足则全选）并行生成
    const shuffled = [...enabledChars].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, Math.min(3, shuffled.length));
    console.info(`[Phone] 首次打开朋友圈，批量生成 ${picks.length} 条`);

    const weather = getWeather(gameTime);
    const hour = gameTime.getHours();
    const timeDesc = hour >= 6 && hour < 10 ? '早上' : hour >= 10 && hour < 14 ? '中午' : hour >= 14 && hour < 18 ? '下午' : hour >= 18 && hour < 22 ? '晚上' : '深夜';

    const results = await Promise.allSettled(
      picks.map(async (char) => {
        const personaContent = await readPersonaEntry(char.personaEntryName, char.personaWorldbookName);
        const charLoc = getCharacterLocation(char.name, gameTime, scriptCharacterLocations);
        const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」。` : '';
        const context = `当前${gameTime.getMonth() + 1}月${gameTime.getDate()}日${timeDesc}，天气${weather.type}。${locDesc}${knowsRentAppHint(gameTime)}请发一条朋友圈。`;
        const text = await generateMoment(char.name, personaContent, context, config.subApi);
        return { char, text };
      }),
    );

    const newMoments: PhoneMoment[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.text) {
        newMoments.push({
          id: genMsgId(),
          charName: r.value.char.name,
          text: r.value.text,
          ts: Date.now() - Math.floor(Math.random() * 3600000), // 随机回溯最多1小时，让时间看起来更自然
          likes: Math.floor(Math.random() * 5),
          liked: false,
          comments: [],
          location: getCharLocationForMoment(r.value.char.name, gameTime, scriptCharacterLocations),
        });
      }
    }

    if (newMoments.length > 0) {
      // 按时间倒序排列
      newMoments.sort((a, b) => b.ts - a.ts);
      persistMoments([...newMoments, ...moments].slice(0, 50));
      console.info(`[Phone] 首次批量生成完成，共 ${newMoments.length} 条朋友圈`);
    }
  }, [isReady, config, moments, gameTime, persistMoments, scriptCharacterLocations]);

  const likeMoment = useCallback(
    (id: string) => {
      const next = moments.map((m) => m.id === id ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1 } : m);
      persistMoments(next);
    },
    [moments, persistMoments],
  );

  const commentMoment = useCallback(
    async (id: string, content: string) => {
      // 1. 先存入玩家评论
      const targetMoment = momentsRef.current.find((m) => m.id === id);
      if (!targetMoment) return;
      const updatedMoment: PhoneMoment = {
        ...targetMoment,
        comments: [...targetMoment.comments, { username: pName, content }],
      };
      const next = momentsRef.current.map((m) => m.id === id ? updatedMoment : m);
      persistMoments(next);

      // 2. 调副API生成角色/网友回复
      if (!isReady) return;
      try {
        // 尝试读取发圈角色的人设
        const charLink = config.characters.find((c) => c.name === targetMoment.charName);
        let personaContent = '';
        if (charLink) {
          personaContent = await readPersonaEntry(charLink.personaEntryName, charLink.personaWorldbookName);
        }
        const weather = getWeather(gameTime);
        const charLoc = getCharacterLocation(targetMoment.charName, gameTime, scriptCharacterLocations);
        const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」。` : '';
        const context = `当前${gameTime.getMonth() + 1}月${gameTime.getDate()}日，天气${weather.type}。${locDesc}`;
        // 传入 targetMoment（不含玩家评论）而非 updatedMoment，避免玩家评论在 prompt 中重复
        const replies = await generateMomentReply(targetMoment, content, targetMoment.charName, personaContent, context, config.subApi, pName);
        if (replies.length > 0) {
          // 3. 将AI回复追加到评论列表 — 使用 momentsRef.current 获取最新状态，避免闭包过期
          const latestMoment = momentsRef.current.find((m) => m.id === id);
          if (!latestMoment) return;
          const finalMoment = {
            ...latestMoment,
            comments: [...latestMoment.comments, ...replies],
          };
          const finalNext = momentsRef.current.map((m) => m.id === id ? finalMoment : m);
          persistMoments(finalNext);
        }
      } catch (err) {
        console.error('[Phone] 朋友圈评论回复生成失败:', err);
      }
    },
    [persistMoments, isReady, config.characters, gameTime, pName],
  );

  // ── 群聊操作 ──
  const createGroupChat = useCallback(
    (name: string, memberNames: string[]) => {
      const newGroup: GroupChat = { id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, memberNames };
      persistGroupChats([...groupChats, newGroup]);
      // 创建群聊世界书条目
      createGroupChatLogEntry(newGroup, pName).catch(err => console.warn('[Phone] 创建群聊世界书条目失败:', err));
      console.info(`[Phone] 已创建群聊: ${name}，成员: ${memberNames.join('、')}`);
    },
    [groupChats, persistGroupChats],
  );

  const removeGroupChat = useCallback(
    (id: string) => {
      persistGroupChats(groupChats.filter((g) => g.id !== id));
      setGroupMessages((prev) => { const next = { ...prev }; delete next[id]; saveGroupMessages(id, []); return next; });
      // 删除群聊世界书条目
      deleteGroupChatLogEntry(id).catch(err => console.warn('[Phone] 删除群聊世界书条目失败:', err));
    },
    [groupChats, persistGroupChats],
  );

  const sendGroupMessage = useCallback(
    async (groupId: string, text: string) => {
      if (!isReady) return;
      const group = groupChats.find((g) => g.id === groupId);
      if (!group) return;
      const history = groupMessagesRef.current[groupId] || [];

// 1. 存入玩家消息（使用 formatGameTs 避免触发 MVU 写入导致的级联重渲染黑屏）
const gameTs = formatGameTs(gameTime);
const playerMsg: GroupMessage = { id: genMsgId(), ts: Date.now(), gameTs, text, from: 'player', read: true };
const afterPlayer = [...history, playerMsg];
persistGroupMessages(groupId, afterPlayer);

      // 2. 读取人设
      const personas: { name: string; content: string }[] = [];
      for (const memberName of group.memberNames) {
        const charLink = config.characters.find((c) => c.name === memberName);
        if (charLink) {
          const content = await readPersonaEntry(charLink.personaEntryName, charLink.personaWorldbookName);
          personas.push({ name: memberName, content });
        }
      }

      // 3. 构建上下文
      const weather = getWeather(gameTime);
      const memberLocDescs = group.memberNames.map((name) => {
        const loc = getCharacterLocation(name, gameTime, scriptCharacterLocations);
        if (!loc) return `${name}的位置未知`;
        return `${name}在「${loc.parentLocation ? loc.parentLocation + '/' + loc.location : loc.location}」`;
      }).join('，');
      const context = `当前${gameTime.getMonth() + 1}月${gameTime.getDate()}日，天气${weather.type}。群成员当前位置：${memberLocDescs}。${pName}在群聊中发了消息，请以某个群成员的口吻回复。`;

      // 4. 调副API生成群聊回复
      try {
        const result = await generateGroupMessage(group.name, group.memberNames, afterPlayer, context, personas, config.subApi, pName);
        if (result) {
          // 解析 [move:地点] 标签
          const { cleanText, moveTarget } = parseMoveTag(result.text);
          if (moveTarget) {
            console.info(`[Phone] ${result.sender} 移动到: ${moveTarget}`);
            setScriptCharacterLocations(prev => ({ ...prev, [result.sender]: moveTarget }));
          }
const charMsgs = splitIntoMessages(cleanText, result.sender, gameTs);
const afterChar = [...afterPlayer, ...charMsgs];
          persistGroupMessages(groupId, afterChar);
          // 更新群聊世界书条目
          const summary = summarizeGroupMessages(group, afterChar, pName);
          updateGroupChatLogEntry(group, summary).catch(err => console.warn('[Phone] 更新群聊世界书条目失败:', err));
        }
      } catch (err) { console.error('[Phone] 群聊回复生成失败:', err); }
    },
    [isReady, config, groupChats, gameTime, persistGroupMessages, scriptCharacterLocations, setScriptCharacterLocations],
  );

  const markGroupRead = useCallback(
    (groupId: string) => {
      const history = groupMessages[groupId];
      if (!history) return;
      persistGroupMessages(groupId, history.map((m) => ({ ...m, read: true })));
    },
    [groupMessages, persistGroupMessages],
  );

  // ── 清空群聊记录（保留群聊本身）──
  const clearGroupChatHistory = useCallback(
    async (groupId: string) => {
      const group = groupChats.find((g) => g.id === groupId);
      persistGroupMessages(groupId, []);
      if (group) {
        const initialContent = `【手机群聊记录】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${pName}）的聊天记录将在此更新。\n（注：此为群聊记录，仅群成员知晓，其他角色不应知道或提及此内容。）`;
        await updateGroupChatLogEntry(group, initialContent);
      }
      console.info(`[Phone] 已清空群聊 ${groupId} 的聊天记录`);
    },
    [groupChats, persistGroupMessages, pName],
  );

  // ── 删除单条群聊消息 ──
  const deleteGroupMessage = useCallback(
    async (groupId: string, msgId: string) => {
      const group = groupChats.find((g) => g.id === groupId);
      const history = groupMessages[groupId] || [];
      const next = history.filter((m) => m.id !== msgId);
      persistGroupMessages(groupId, next);
      if (group) {
        if (next.length > 0) {
          const summaries = next.filter(m => m.isSummary);
const summariesText = summaries.map(m => m.text).join('\n---\n');
const recentMsgs = next.filter(m => !m.isSummary).slice(-15).map(m => {
  const sender = m.from === 'player' ? pName : m.from;
  const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
  return `${timeLabel}${sender}：${m.text}`;
}).join('\n');
const wbContent = summariesText
  ? `【微信群聊动态（私密信息）】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${pName}）最近的聊天记录。\n注意：此为群聊私密对话，仅群成员知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n\n【早期群聊摘要】\n${summariesText}\n\n【最近消息】\n${recentMsgs}`
  : summarizeGroupMessages(group, next, pName);
          await updateGroupChatLogEntry(group, wbContent);
        } else {
          const initialContent = `【手机群聊记录】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${pName}）的聊天记录将在此更新。\n（注：此为群聊记录，仅群成员知晓，其他角色不应知道或提及此内容。）`;
          await updateGroupChatLogEntry(group, initialContent);
        }
      }
      console.info(`[Phone] 已删除群聊 ${groupId} 的一条消息`);
    },
    [groupChats, groupMessages, persistGroupMessages, pName],
  );

  // ── 自动注入聊天记录条目（点进微信时调用）──
  const ensureChatLogEntries = useCallback(async () => {
    try {
      await Promise.all([
        ensureAllCharChatLogEntries(config.characters, pName),
        ensureAllGroupChatLogEntries(groupChats, pName),
      ]);
      console.info('[Phone] 聊天记录条目检查/注入完成');
    } catch (err) {
      console.warn('[Phone] 聊天记录条目检查/注入失败:', err);
    }
  }, [config.characters, groupChats]);

  // ── 自动触发角色消息 ──
  const triggerAutoMessages = useCallback(async () => {
    if (!isReady) return;
    if (!config.autoMessageEnabled) {
      console.info('[Phone] 角色主动消息已关闭，跳过自动触发');
      return;
    }
    const now = Date.now();

    // ── 全局冷却：检查所有角色最近一次发消息的时间 ──
    // 如果任意角色在 GLOBAL_COOLDOWN_MS 内发过消息，则跳过本次触发
    {
      let lastAnyMsgTs = 0;
      for (const char of config.characters) {
        if (!char.enabled) continue;
        const charMsgs = messages[char.name] || [];
        const last = charMsgs[charMsgs.length - 1];
        if (last && last.ts > lastAnyMsgTs) lastAnyMsgTs = last.ts;
      }
      if (now - lastAnyMsgTs < GLOBAL_COOLDOWN_MS) {
        console.info('[Phone] 全局冷却中，跳过自动触发');
        return;
      }
    }

    const weather = getWeather(gameTime);
    const hour = gameTime.getHours();
    const timeDesc = hour >= 6 && hour < 10 ? '早上' : hour >= 10 && hour < 14 ? '中午' : hour >= 14 && hour < 18 ? '下午' : hour >= 18 && hour < 22 ? '晚上' : '深夜';
    let sentCount = 0;

    // ── 第一优先级：服务状态相关消息（高概率，不受普通冷却限制）──
    for (const char of config.characters) {
      if (!char.enabled) continue;
      // 角色正在当前场景中和玩家在一起，不应该发微信
      if (scriptCharacterLocations[char.name]) continue;
      // 10月9日之前，非沈千金角色不知道租借男友APP，不可能有服务状态
      if (!knowsRentApp(char.name, gameTime)) continue;
      const charState = characterServiceStates[char.name];
      if (!charState) continue;

      const charMessages = messages[char.name] || [];
      const lastMsg = charMessages[charMessages.length - 1];
      const sinceLast = lastMsg ? now - lastMsg.ts : Infinity;
      const serviceCooldown = 30 * 60 * 1000; // 服务相关消息30分钟冷却

      let serviceContext = '';
      let serviceProbability = 0;

      if (charState.服务状态 === '未开始') {
        // 预约即将开始 — 50%概率发消息
        serviceContext = `你预约了${pName}的服务，即将开始。你有点期待/紧张/兴奋，想给${pName}发条消息。`;
        serviceProbability = 0.5;
      } else if (charState.服务状态 === '进行中') {
        // 服务进行中 — 40%概率发消息
        const remaining = `${charState.剩余服务小时}小时${charState.剩余服务分钟}分钟`;
        serviceContext = `${pName}正在为你服务中，剩余服务时间约${remaining}。你可以聊聊服务中的感受、闲聊、或者提些要求。`;
        serviceProbability = 0.4;
      } else if (charState.服务状态 === '无服务' && lastMsg && lastMsg.gameTs) {
        // 刚结束服务不久（最近2小时内最后一条消息是服务期间的）— 30%概率发消息
        if (sinceLast < 2 * 60 * 60 * 1000) {
          serviceContext = `你的服务刚刚结束了。你可以对${pName}的服务进行评价、感谢、或者聊聊天。`;
          serviceProbability = 0.3;
        }
      }

      if (serviceContext && Math.random() < serviceProbability && sinceLast > serviceCooldown) {
        // 注入角色当前所在位置
        const charLoc = getCharacterLocation(char.name, gameTime, scriptCharacterLocations);
        const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」（正在${getGenericActivity(charLoc.location, charLoc.activity)}）。` : '';
        const storyContext = getRecentStoryContext(char.name);
        const orderHint = detectOrderIntent(char.name, charMessages, gameTime);
        const context = `当前是${gameTime.getMonth() + 1}月${gameTime.getDate()}日${timeDesc}，天气${weather.type}。${locDesc}${orderHint}${serviceContext}${storyContext ? '\n' + storyContext : ''}`;
        try {
          const personaContent = await readPersonaEntry(char.personaEntryName, char.personaWorldbookName);
          const replyText = await generatePhoneMessage(char.name, personaContent, charMessages, context, config.subApi);
          if (replyText) {
            // 解析 [move:地点] 标签
            const { cleanText, moveTarget } = parseMoveTag(replyText);
            if (moveTarget) {
              console.info(`[Phone] ${char.name} 移动到: ${moveTarget}`);
              setScriptCharacterLocations(prev => ({ ...prev, [char.name]: moveTarget }));
            }
            const gameTs = getLatestGameTs(gameTime);
            const charMsgs = splitIntoMessages(cleanText, gameTs, 'char');
            const afterChar = [...charMessages, ...charMsgs];
            persistMessages({ ...messages, [char.name]: afterChar });
            const summary = summarizeMessages(char.name, afterChar, pName);
            await updateCharChatLogEntry(char.name, summary);
            console.info(`[Phone] ${char.name} 服务相关主动消息`);
            sentCount++;
          }
        } catch (err) { console.error(`[Phone] ${char.name} 服务消息生成失败:`, err); }
        break; // 每次触发最多发一条服务相关消息
      }
    }

    // ── 第二优先级：日常随机消息（中等概率）──
    if (sentCount === 0) {
      for (const char of config.characters) {
        if (!char.enabled) continue;
        // 角色正在当前场景中和玩家在一起，不应该发微信
        if (scriptCharacterLocations[char.name]) continue;
        const charMessages = messages[char.name] || [];
        const lastMsg = charMessages[charMessages.length - 1];
        if (lastMsg && now - lastMsg.ts < COOLDOWN_MS) continue;

        // 根据时间段调整概率
        let baseProb = 0.12; // 基础12%
        if (hour >= 22 || hour < 6) baseProb = 0.05; // 深夜降低
        if (hour >= 6 && hour < 10) baseProb = 0.18; // 早上稍高（早安消息）
        if (hour >= 18 && hour < 22) baseProb = 0.18; // 晚上稍高

        if (Math.random() > baseProb) continue;

        // 根据时间段定制消息类型
        let msgHint = '';
        if (hour >= 6 && hour < 10) {
          msgHint = '现在是早上，可以发早安消息、分享早餐、或者抱怨起床困难。';
        } else if (hour >= 10 && hour < 14) {
          msgHint = '现在是中午，可以聊聊午饭、午休、或者上午的事情。';
        } else if (hour >= 14 && hour < 18) {
          msgHint = '现在是下午，可以分享日常琐事、吐槽、或者闲聊。';
        } else if (hour >= 18 && hour < 22) {
          msgHint = '现在是晚上，可以聊聊晚餐、晚上在做什么、或者找点话题聊天。';
        } else {
          msgHint = '现在是深夜，如果发消息可以是睡不着、深夜emo、或者随手发的一条消息。';
        }

        const charState = characterServiceStates[char.name];
        const serviceDesc = (charState?.服务状态 === '进行中' && knowsRentApp(char.name, gameTime)) ? '你正在接受服务中' : (charState?.服务状态 === '未开始' && knowsRentApp(char.name, gameTime)) ? '你预约了服务即将开始' : '';
        const storyContext = getRecentStoryContext(char.name);
        const charLoc = getCharacterLocation(char.name, gameTime, scriptCharacterLocations);
        const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」（正在${getGenericActivity(charLoc.location, charLoc.activity)}）。` : '';
        const orderHint = detectOrderIntent(char.name, charMessages, gameTime);
        const context = `当前是${gameTime.getMonth() + 1}月${gameTime.getDate()}日${timeDesc}，天气${weather.type}。${locDesc}${orderHint}${serviceDesc}。${msgHint} 请主动给${pName}发一条微信消息，内容要自然随意，像真人发微信一样。${storyContext ? '\n' + storyContext : ''}`;

        try {
          const personaContent = await readPersonaEntry(char.personaEntryName, char.personaWorldbookName);
          const replyText = await generatePhoneMessage(char.name, personaContent, charMessages, context, config.subApi);
          if (replyText) {
            // 解析 [move:地点] 标签
            const { cleanText, moveTarget } = parseMoveTag(replyText);
            if (moveTarget) {
              console.info(`[Phone] ${char.name} 移动到: ${moveTarget}`);
              setScriptCharacterLocations(prev => ({ ...prev, [char.name]: moveTarget }));
            }
            const gameTs = getLatestGameTs(gameTime);
            const charMsgs = splitIntoMessages(cleanText, gameTs, 'char');
            const afterChar = [...charMessages, ...charMsgs];
            persistMessages({ ...messages, [char.name]: afterChar });
            const summary = summarizeMessages(char.name, afterChar, pName);
            await updateCharChatLogEntry(char.name, summary);
            console.info(`[Phone] ${char.name} 日常主动消息`);
            sentCount++;
          }
        } catch (err) { console.error(`[Phone] ${char.name} 日常消息生成失败:`, err); }
        break;
      }
    }

    // ── 朋友圈自动触发（提高概率）──
    if (Math.random() < 0.2) {
      const lastMoment = moments[0];
      if (!lastMoment || Date.now() - lastMoment.ts > MOMENT_COOLDOWN_MS) {
        try {
          const enabledChars = config.characters.filter((c) => c.enabled);
          if (enabledChars.length > 0) {
            const char = enabledChars[Math.floor(Math.random() * enabledChars.length)];
            const personaContent = await readPersonaEntry(char.personaEntryName, char.personaWorldbookName);
            // 根据时间段定制朋友圈内容
            let momentHint = '';
          if (hour >= 6 && hour < 10) momentHint = '早上好心情、早餐打卡、或者起床吐槽';
          else if (hour >= 10 && hour < 14) momentHint = '午饭分享、日常心情';
          else if (hour >= 14 && hour < 18) momentHint = '下午茶、下午的日常、自拍、分享';
          else if (hour >= 18 && hour < 22) momentHint = '晚餐、晚上心情、夜景、夜生活';
          else momentHint = '深夜emo、失眠、夜猫子日常';

            const charLoc = getCharacterLocation(char.name, gameTime, scriptCharacterLocations);
            const locDesc = charLoc ? `你目前在「${charLoc.parentLocation ? charLoc.parentLocation + '/' + charLoc.location : charLoc.location}」。` : '';
            const context = `当前${gameTime.getMonth() + 1}月${gameTime.getDate()}日${timeDesc}，天气${weather.type}。${locDesc}请发一条朋友圈。内容方向参考：${momentHint}。`;
            const text = await generateMoment(char.name, personaContent, context, config.subApi);
            if (text) {
              const newMoment: PhoneMoment = { id: genMsgId(), charName: char.name, text, ts: Date.now(), likes: 0, liked: false, comments: [], location: getCharLocationForMoment(char.name, gameTime, scriptCharacterLocations) };
              const next = [newMoment, ...moments].slice(0, 50);
              persistMoments(next);
              console.info(`[Phone] ${char.name} 发了一条朋友圈`);
            }
          }
        } catch (err) { console.error('[Phone] 朋友圈自动生成失败:', err); }
      }
    }
  }, [isReady, config, messages, moments, gameTime, currentLocation, characterServiceStates, persistMessages, persistMoments, scriptCharacterLocations]);

  // ── 派单通知：每天8:00游戏时间触发 ──
  useEffect(() => {
    const dateKey = `${gameTime.getFullYear()}-${gameTime.getMonth()}-${gameTime.getDate()}`;
    const hour = gameTime.getHours();

    // 首次加载：记录当天key，不触发badge（避免刷新就震动）
    if (lastDispatchDateKeyRef.current === '') {
      lastDispatchDateKeyRef.current = dateKey;
      // 如果当天已经8点后，检查聊天变量中是否已查看过当天派单
      if (hour >= 8) {
        try {
          const chatVars = getVariables({ type: 'chat' }) as any;
          const todayDispatch = chatVars?.dailyDispatch;
          // 如果今天还没有派单记录或还没查看，设置badge
          if (!todayDispatch || todayDispatch.dateKey !== dateKey || !todayDispatch.viewed) {
            setDispatchBadge(1);
            dispatchNotifiedRef.current = dateKey;
          }
        } catch { /* ignore */ }
      }
      return;
    }

    // 日期变更 → 新的一天
    if (dateKey !== lastDispatchDateKeyRef.current) {
      lastDispatchDateKeyRef.current = dateKey;
      dispatchNotifiedRef.current = '';
      if (hour >= 8) {
        // 新的一天且已过8点 → 立即触发
        setDispatchBadge(1);
        dispatchNotifiedRef.current = dateKey;
        console.info('[Phone] 新一天8点已过，触发派单通知');
      } else {
        console.info('[Phone] 新一天，等待8点触发派单通知');
      }
      return;
    }

    // 同一天内：检查是否跨过8点
    if (hour >= 8 && dispatchNotifiedRef.current !== dateKey) {
      setDispatchBadge(1);
      dispatchNotifiedRef.current = dateKey;
      console.info('[Phone] 8点到达，触发派单通知');
    }
  }, [gameTime]);

  // ── 监听酒馆事件触发 ──
  const triggerRef = useRef(triggerAutoMessages);
  triggerRef.current = triggerAutoMessages;

  useEffect(() => {
    // MESSAGE_RECEIVED 即可触发，story_interaction_done 是冗余的（同一轮会触发两次）
    const stop1 = eventOn(tavern_events.MESSAGE_RECEIVED, () => { setTimeout(() => triggerRef.current(), 3000); });
    const stop3 = eventOn(tavern_events.CHAT_CHANGED, () => {
      setConfig(loadPhoneConfig());
      setMessages(loadPhoneMessages());
      setFollowedPosts(loadFollowedPosts());
      setMoments(loadPhoneMoments());
      const groups = loadGroupChats();
      setGroupChats(groups);
      const allMsgs: Record<string, GroupMessage[]> = {};
      for (const g of groups) allMsgs[g.id] = loadGroupMessages(g.id);
      setGroupMessages(allMsgs);
    });
    return () => { stop1.stop(); stop3.stop(); };
  }, []);

  // ── 数据压缩 ──
  const compressCharChat = useCallback(
    async (charName: string, keepRecent: number = 20): Promise<boolean> => {
      if (!isReady) { console.warn('[Phone] 副API未配置，无法压缩'); return false; }
      const charHistory = messages[charName] || [];
      if (charHistory.length <= keepRecent) {
        console.info(`[Phone] ${charName} 的聊天记录不足 ${keepRecent} 条，无需压缩`);
        return false;
      }
      const toCompress = charHistory.slice(0, charHistory.length - keepRecent);
      const toKeep = charHistory.slice(charHistory.length - keepRecent);
      try {
        const summaryText = await summarizeChatHistory(charName, toCompress, config.subApi, pName);
        if (!summaryText) return false;
        const summaryMsg: PhoneMessage = {
          id: genMsgId(),
          ts: toCompress[toCompress.length - 1]?.ts || Date.now(),
          gameTs: toCompress[toCompress.length - 1]?.gameTs,
          text: `【聊天记录摘要】${summaryText}`,
          from: 'char',
          read: true,
          isSummary: true,
        };
        const newHistory = [summaryMsg, ...toKeep];
        persistMessages({ ...messages, [charName]: newHistory });
        // 更新世界书条目 — 写入 AI 摘要 + 最近几条原文，而非全部原始消息
        const recentForWb = toKeep.slice(-5).map((m) => {
          const sender = m.from === 'char' ? charName : pName;
          const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
          return `${timeLabel}${sender}：${m.text}`;
        }).join('\n');
        const wbContent = `【微信动态（私密信息）】${charName}最近在微信上的聊天记录。\n注意：此为${charName}与${pName}之间的私密对话，仅${charName}本人和${pName}知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n\n【早期聊天摘要】\n${summaryText}\n\n【最近消息】\n${recentForWb}`;
        await updateCharChatLogEntry(charName, wbContent);
        console.info(`[Phone] ${charName} 的聊天记录已压缩：${toCompress.length} 条 → 1 条摘要`);
        return true;
      } catch (err) {
        console.error(`[Phone] 压缩 ${charName} 的聊天记录失败:`, err);
        return false;
      }
    },
    [isReady, config.subApi, messages, persistMessages, pName],
  );

  const compressGroupChat = useCallback(
    async (groupId: string, keepRecent: number = 20): Promise<boolean> => {
      if (!isReady) { console.warn('[Phone] 副API未配置，无法压缩'); return false; }
      const group = groupChats.find((g) => g.id === groupId);
      if (!group) { console.warn(`[Phone] 群聊不存在: ${groupId}`); return false; }
      const history = groupMessages[groupId] || [];
      if (history.length <= keepRecent) {
        console.info(`[Phone] 群聊 ${group.name} 的记录不足 ${keepRecent} 条，无需压缩`);
        return false;
      }
      const toCompress = history.slice(0, history.length - keepRecent);
      const toKeep = history.slice(history.length - keepRecent);
      try {
        const summaryText = await summarizeGroupChatHistory(group, toCompress, config.subApi, pName);
        if (!summaryText) return false;
const summaryMsg: GroupMessage = {
  id: genMsgId(),
  ts: toCompress[toCompress.length - 1]?.ts || Date.now(),
  gameTs: toCompress[toCompress.length - 1]?.gameTs,
  text: `【群聊记录摘要】${summaryText}`,
  from: '系统',
  read: true,
  isSummary: true,
};
const newHistory = [summaryMsg, ...toKeep];
persistGroupMessages(groupId, newHistory);
// 更新群聊世界书条目 — 写入 AI 摘要 + 最近几条原文
const recentForWb = toKeep.slice(-5).map((m) => {
  const sender = m.from === 'player' ? pName : m.from;
  const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
  return `${timeLabel}${sender}：${m.text}`;
}).join('\n');
        const wbContent = `【微信群聊动态（私密信息）】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${pName}）最近的聊天记录。\n注意：此为群聊私密对话，仅群成员知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n\n【早期群聊摘要】\n${summaryText}\n\n【最近消息】\n${recentForWb}`;
        await updateGroupChatLogEntry(group, wbContent);
        console.info(`[Phone] 群聊 ${group.name} 的记录已压缩：${toCompress.length} 条 → 1 条摘要`);
        return true;
      } catch (err) {
        console.error(`[Phone] 压缩群聊 ${group.name} 的记录失败:`, err);
        return false;
      }
    },
    [isReady, config.subApi, groupChats, groupMessages, persistGroupMessages, pName],
  );

  const compressForumPost = useCallback(
    async (postId: string, keepRecent: number = 10): Promise<boolean> => {
      if (!isReady) { console.warn('[Phone] 副API未配置，无法压缩'); return false; }
      const post = followedPosts.find((p) => p.id === postId);
      if (!post) { console.warn(`[Phone] 论坛帖子不存在: ${postId}`); return false; }
      if (post.replies.length <= keepRecent) {
        console.info(`[Phone] 帖子 "${post.title}" 的回复不足 ${keepRecent} 条，无需压缩`);
        return false;
      }
      const toCompress = post.replies.slice(0, post.replies.length - keepRecent);
      const toKeep = post.replies.slice(post.replies.length - keepRecent);
      try {
        const summaryText = await summarizeForumReplies(post, toCompress, config.subApi);
        if (!summaryText) return false;
        const updatedPost: ForumPost = {
          ...post,
          replies: [
            { username: '系统摘要', content: `【回复摘要】${summaryText}` },
            ...toKeep,
          ],
        };
        const nextFollowed = followedPosts.map((p) => p.id === postId ? updatedPost : p);
        persistFollowed(nextFollowed);
        await followForumPost(updatedPost);
        console.info(`[Phone] 帖子 "${post.title}" 的回复已压缩：${toCompress.length} 条 → 1 条摘要`);
        return true;
      } catch (err) {
        console.error(`[Phone] 压缩帖子 "${post.title}" 的回复失败:`, err);
        return false;
      }
    },
    [isReady, config.subApi, followedPosts, persistFollowed],
  );

  // ── 手动压缩选定私聊消息（选中消息删除，插入摘要卡片，写入世界书）──
  const compressSelectedMessages = useCallback(
    async (charName: string, msgIds: string[]): Promise<boolean> => {
      if (!isReady) { console.warn('[Phone] 副API未配置，无法压缩'); return false; }
      const charHistory = messages[charName] || [];
      const toCompress = charHistory.filter(m => msgIds.includes(m.id));
      if (toCompress.length === 0) {
        console.info('[Phone] 没有可压缩的消息');
        return false;
      }
      try {
        console.info(`[Phone] 开始压缩 ${charName} 的 ${toCompress.length} 条选定消息`);

        // 如果被压缩的消息中有摘要卡片，继承其原始消息；否则收集原始消息本身
        const collectedOriginals: PhoneMessage[] = [];
        for (const m of toCompress) {
          if (m.isSummary && m.originalMessages) {
            collectedOriginals.push(...m.originalMessages);
          } else {
            collectedOriginals.push(m);
          }
        }

        // 调用 AI 生成摘要（对摘要文本再摘要，或对原始消息摘要）
        const summaryText = await summarizeChatHistory(charName, toCompress, config.subApi, pName);
        if (!summaryText) return false;

        // 找到第一条被压缩消息的位置，用摘要替换
        const firstIdx = charHistory.findIndex(m => msgIds.includes(m.id));
const summaryMsg: PhoneMessage = {
  id: `summary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  ts: toCompress[0].ts,
  gameTs: toCompress[toCompress.length - 1]?.gameTs,
  text: summaryText,
  from: 'char',
  read: true,
  isSummary: true,
  originalMessages: collectedOriginals,
};

        // 删除被选中的消息，在原位置插入摘要
        const remaining = charHistory.filter(m => !msgIds.includes(m.id));
        remaining.splice(firstIdx, 0, summaryMsg);
        persistMessages({ ...messages, [charName]: remaining });

        // 更新世界书：所有摘要文本 + 最近未压缩消息原文
        const summaries = remaining.filter(m => m.isSummary);
        const summariesText = summaries.map(m => m.text).join('\n---\n');
        const recentMsgs = remaining.filter(m => !m.isSummary).slice(-15).map(m => {
          const sender = m.from === 'char' ? charName : pName;
          const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
          return `${timeLabel}${sender}：${m.text}`;
        }).join('\n');

        const wbContent = `【微信动态（私密信息）】${charName}最近在微信上的聊天记录。\n注意：此为${charName}与${pName}之间的私密对话，仅${charName}本人和${pName}知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n\n【早期聊天摘要】\n${summariesText}\n\n【最近消息】\n${recentMsgs}`;
        await updateCharChatLogEntry(charName, wbContent);
        console.info(`[Phone] ${charName} 的 ${toCompress.length} 条消息已压缩，摘要已插入聊天列表`);
        return true;
      } catch (err) {
        console.error(`[Phone] 压缩 ${charName} 的选定消息失败:`, err);
        return false;
      }
    },
    [isReady, config.subApi, messages, persistMessages, pName],
  );

  // ── 手动压缩选定群聊消息（删原消息+插摘要+继承原始消息）──
  const compressSelectedGroupMessages = useCallback(
    async (groupId: string, msgIds: string[]): Promise<boolean> => {
      if (!isReady) { console.warn('[Phone] 副API未配置，无法压缩'); return false; }
      const group = groupChats.find((g) => g.id === groupId);
      if (!group) { console.warn(`[Phone] 群聊不存在: ${groupId}`); return false; }
      const history = groupMessages[groupId] || [];
      const toCompress = history.filter(m => msgIds.includes(m.id));
      if (toCompress.length === 0) {
        console.info('[Phone] 没有可压缩的群聊消息');
        return false;
      }
      try {
        console.info(`[Phone] 开始压缩群聊 ${group.name} 的 ${toCompress.length} 条选定消息`);

        // 继承原始消息
        const collectedOriginals: GroupMessage[] = [];
        for (const m of toCompress) {
          if (m.isSummary && m.originalMessages) {
            collectedOriginals.push(...m.originalMessages);
          } else {
            collectedOriginals.push(m);
          }
        }

        const summaryText = await summarizeGroupChatHistory(group, toCompress, config.subApi, pName);
        if (!summaryText) return false;

        const firstIdx = history.findIndex(m => msgIds.includes(m.id));
const summaryMsg: GroupMessage = {
  id: `summary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  ts: toCompress[0].ts,
  gameTs: toCompress[toCompress.length - 1]?.gameTs,
  text: summaryText,
  from: 'system',
  read: true,
  isSummary: true,
  originalMessages: collectedOriginals,
};

const remaining = history.filter(m => !msgIds.includes(m.id));
remaining.splice(firstIdx, 0, summaryMsg);
persistGroupMessages(groupId, remaining);

// 更新世界书
const summaries = remaining.filter(m => m.isSummary);
const summariesText = summaries.map(m => m.text).join('\n---\n');
const recentMsgs = remaining.filter(m => !m.isSummary).slice(-15).map(m => {
  const sender = m.from === 'player' ? pName : m.from;
  const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
  return `${timeLabel}${sender}：${m.text}`;
}).join('\n');

        const wbContent = `【微信群聊动态（私密信息）】群聊「${group.name}」（成员：${group.memberNames.join('、')}、${pName}）最近的聊天记录。\n注意：此为群聊私密对话，仅群成员知晓。其他角色不应知道或提及这些聊天内容。\n每条消息前方的[时间]表示该消息的发送时间，请注意区分消息的时间先后顺序。\n\n【早期群聊摘要】\n${summariesText}\n\n【最近消息】\n${recentMsgs}`;
        await updateGroupChatLogEntry(group, wbContent);
        console.info(`[Phone] 群聊 ${group.name} 的 ${toCompress.length} 条消息已压缩`);
        return true;
      } catch (err) {
        console.error(`[Phone] 压缩群聊 ${group.name} 的选定消息失败:`, err);
        return false;
      }
    },
    [isReady, config.subApi, groupChats, groupMessages, persistGroupMessages, pName],
  );

  const contextValue = useMemo<PhoneContextType>(
    () => ({
      config, isReady, messages, unreadCount, followedPosts, moments, groupChats, groupMessages, groupUnreadCount,
      isPhoneOpen, openPhone, closePhone,
      dispatchBadge, clearDispatchBadge,
      saveSubApi, addCharacter, removeCharacter, toggleCharacter, setGuideShown, setAutoMessageEnabled, getEntryList,
      sendMessage, markRead, clearChatHistory, deleteMessage,
      refreshForum, followPost, unfollowPost, replyForumPost,
      refreshMoments, initMoments, likeMoment, commentMoment,
      createGroupChat, removeGroupChat, sendGroupMessage, markGroupRead, clearGroupChatHistory, deleteGroupMessage,
      triggerAutoMessages,
      ensureChatLogEntries,
      compressCharChat, compressGroupChat, compressForumPost,
      compressSelectedMessages, compressSelectedGroupMessages,
    }),
    [
      config, isReady, messages, unreadCount, followedPosts, moments, groupChats, groupMessages, groupUnreadCount,
      isPhoneOpen, openPhone, closePhone,
      dispatchBadge, clearDispatchBadge,
      saveSubApi, addCharacter, removeCharacter, toggleCharacter, setGuideShown, setAutoMessageEnabled, getEntryList,
      sendMessage, markRead, clearChatHistory, deleteMessage,
      refreshForum, followPost, unfollowPost, replyForumPost,
      refreshMoments, initMoments, likeMoment, commentMoment,
      createGroupChat, removeGroupChat, sendGroupMessage, markGroupRead, clearGroupChatHistory, deleteGroupMessage,
      triggerAutoMessages,
      ensureChatLogEntries,
      compressCharChat, compressGroupChat, compressForumPost,
      compressSelectedMessages, compressSelectedGroupMessages,
    ],
  );

  return <PhoneContext.Provider value={contextValue}>{children}</PhoneContext.Provider>;
}

export function usePhoneContext() {
  const ctx = useContext(PhoneContext);
  if (!ctx) throw new Error('usePhoneContext must be used within PhoneProvider');
  return ctx;
}
