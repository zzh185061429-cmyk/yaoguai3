import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ── 类型定义 ──

export type EventType = '关系里程碑' | '信息揭示' | '心态变化' | '特殊事件';

export interface StoryEvent {
  /** 唯一标识 */
  id: string;
  /** 涉及的角色名（'全局' 表示全局事件） */
  character: string;
  /** 事件类型 */
  type: EventType;
  /** 简短标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 游戏内时间 */
  gameTime: string;
  /** 记录时的楼层号 */
  floorId?: number;
  /** 创建时间戳（排序用） */
  timestamp: number;
}

// ── 初始事件（基于角色卡的"信息知晓层级"）──

function getInitialEvents(): StoryEvent[] {
  const now = Date.now();
  return [
    // 裴今歌：完全知情者
    { id: 'init-1', character: '裴今歌', type: '信息揭示', title: '秘密清零债务', description: '裴今歌提前支付了三亿债务，但未告知沈家兄妹', gameTime: '初始', timestamp: now },
    { id: 'init-2', character: '裴今歌', type: '信息揭示', title: '知晓所有客户', description: '裴今歌知道所有客户的存在和彼此的点单关系', gameTime: '初始', timestamp: now + 1 },
    // 姜朝渔：完全知情者
    { id: 'init-3', character: '姜朝渔', type: '信息揭示', title: '知晓所有客户', description: '姜朝渔知道所有客户的存在和彼此的点单关系', gameTime: '初始', timestamp: now + 2 },
    { id: 'init-4', character: '姜朝渔', type: '信息揭示', title: '知道债务已清零', description: '姜朝渔知道债务已被裴今歌清零', gameTime: '初始', timestamp: now + 3 },
    // 沈千金：知道所有客户，但不知道债务已清零
    { id: 'init-5', character: '沈千金', type: '信息揭示', title: '知晓所有客户', description: '沈千金知道所有客户身份和点单记录（作为经纪人）', gameTime: '初始', timestamp: now + 4 },
    // 其余角色：不知情者（无初始信息揭示事件）
    { id: 'init-6', character: '全局', type: '特殊事件', title: '租借男友APP上线', description: '10月8日<user>注册租借男友APP，10月9日起开始接单', gameTime: '10月08日 19:00', timestamp: now + 5 },
  ];
}

// ── Context 类型 ──

type EventContextType = {
  /** 所有事件（按时间排序） */
  events: StoryEvent[];
  /** 添加事件（自动去重） */
  addEvent: (event: Omit<StoryEvent, 'id' | 'timestamp'>) => void;
  /** 批量添加事件（从 AI 输出解析） */
  addEvents: (parsed: Omit<StoryEvent, 'id' | 'timestamp'>[]) => void;
  /** 获取某角色的所有事件 */
  getCharacterEvents: (character: string) => StoryEvent[];
  /** 获取某角色的已知信息列表 */
  getCharacterKnownInfo: (character: string) => string[];
  /** 手动删除事件 */
  removeEvent: (id: string) => void;
  /** 清空所有事件（重置） */
  clearAllEvents: () => void;
  /** 生成注入提示词用的事件摘要文本 */
  getEventPromptText: () => string;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

// ── Provider ──

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<StoryEvent[]>([]);

  // 从聊天变量加载事件
  const loadEvents = useCallback(() => {
    try {
      const chatVars = getVariables({ type: 'chat' }) as any;
      if (chatVars?.storyEvents && Array.isArray(chatVars.storyEvents) && chatVars.storyEvents.length > 0) {
        setEvents(chatVars.storyEvents);
        console.info(`[EventContext] 从聊天变量加载了 ${chatVars.storyEvents.length} 个事件`);
      } else {
        // 初始化默认事件
        const initial = getInitialEvents();
        setEvents(initial);
        try {
          updateVariablesWith(vars => ({ ...vars, storyEvents: initial }), { type: 'chat' });
        } catch {
          console.warn('[EventContext] 无法持久化初始事件');
        }
        console.info('[EventContext] 初始化默认事件');
      }
    } catch {
      console.warn('[EventContext] 聊天变量未就绪，使用默认事件');
      setEvents(getInitialEvents());
    }
  }, []);

  // 持久化到聊天变量
  const persistEvents = useCallback((newEvents: StoryEvent[]) => {
    try {
      updateVariablesWith(vars => ({ ...vars, storyEvents: newEvents }), { type: 'chat' });
    } catch {
      console.warn('[EventContext] 无法持久化事件到聊天变量');
    }
  }, []);

  // 加载事件 + 监听聊天文件变更
  useEffect(() => {
    loadEvents();
    const stop = eventOn(tavern_events.CHAT_CHANGED, () => {
      loadEvents();
    });
    return () => stop.stop();
  }, [loadEvents]);

  // 添加事件（自动去重：同角色+同标题的事件不重复添加）
  const addEvent = useCallback((event: Omit<StoryEvent, 'id' | 'timestamp'>) => {
    setEvents(prev => {
      // 去重检查
      const exists = prev.some(e => e.character === event.character && e.title === event.title);
      if (exists) {
        console.info(`[EventContext] 事件已存在，跳过: ${event.character} - ${event.title}`);
        return prev;
      }
      const newEvent: StoryEvent = {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      };
      const updated = [...prev, newEvent];
      persistEvents(updated);
      console.info(`[EventContext] 新增事件: ${newEvent.character} | ${newEvent.type} | ${newEvent.title}`);
      return updated;
    });
  }, [persistEvents]);

  // 批量添加
  const addEvents = useCallback((parsed: Omit<StoryEvent, 'id' | 'timestamp'>[]) => {
    if (parsed.length === 0) return;
    setEvents(prev => {
      const newOnes: StoryEvent[] = [];
      for (const p of parsed) {
        const exists = prev.some(e => e.character === p.character && e.title === p.title);
        if (!exists) {
          newOnes.push({
            ...p,
            id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
          });
        }
      }
      if (newOnes.length === 0) return prev;
      const updated = [...prev, ...newOnes];
      persistEvents(updated);
      console.info(`[EventContext] 批量新增 ${newOnes.length} 个事件`);
      return updated;
    });
  }, [persistEvents]);

  // 获取角色事件
  const getCharacterEvents = useCallback((character: string): StoryEvent[] => {
    return events.filter(e => e.character === character || e.character === '全局')
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [events]);

  // 获取角色已知信息
  const getCharacterKnownInfo = useCallback((character: string): string[] => {
    return events
      .filter(e => (e.character === character || e.character === '全局') && e.type === '信息揭示')
      .map(e => e.title)
      .sort((a, b) => 0); // 保持插入顺序
  }, [events]);

  // 删除事件
  const removeEvent = useCallback((id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      persistEvents(updated);
      return updated;
    });
  }, [persistEvents]);

  // 清空
  const clearAllEvents = useCallback(() => {
    const initial = getInitialEvents();
    setEvents(initial);
    persistEvents(initial);
    console.info('[EventContext] 已重置为初始事件');
  }, [persistEvents]);

  // 生成注入提示词的事件摘要
  const getEventPromptText = useCallback((): string => {
    if (events.length === 0) return '';
    
    // 按角色分组
    const byCharacter: Record<string, StoryEvent[]> = {};
    for (const e of events) {
      if (!byCharacter[e.character]) byCharacter[e.character] = [];
      byCharacter[e.character].push(e);
    }

    const lines: string[] = ['【已发生事件记录】'];
    
    // 全局事件优先
    if (byCharacter['全局']) {
      lines.push('■ 全局事件:');
      for (const e of byCharacter['全局']) {
        lines.push(`  • ${e.title}（${e.gameTime}）${e.description ? ' - ' + e.description : ''}`);
      }
    }

    // 各角色事件
    const CHARACTER_ORDER = ['沈千金', '周念安', '裴今歌', '姜朝渔', '傅霁', '椎名律', '温知晚', '陆时予', '罗兰', '霍千黎', '季明舒', '步玲燕', '许不倦', '织部宵'];
    for (const name of CHARACTER_ORDER) {
      if (!byCharacter[name]) continue;
      const charEvents = byCharacter[name].sort((a, b) => a.timestamp - b.timestamp);
      lines.push(`■ ${name}:`);
      for (const e of charEvents) {
        const typeLabel = e.type === '关系里程碑' ? '★' : e.type === '信息揭示' ? '◎' : e.type === '心态变化' ? '♢' : '◇';
        lines.push(`  ${typeLabel} ${e.title}（${e.gameTime}）${e.description ? ' - ' + e.description : ''}`);
      }
    }

    // 其他角色（不在列表中的）
    for (const [name, charEvents] of Object.entries(byCharacter)) {
      if (name === '全局' || CHARACTER_ORDER.includes(name)) continue;
      lines.push(`■ ${name}:`);
      for (const e of charEvents.sort((a, b) => a.timestamp - b.timestamp)) {
        const typeLabel = e.type === '关系里程碑' ? '★' : e.type === '信息揭示' ? '◎' : e.type === '心态变化' ? '♢' : '◇';
        lines.push(`  ${typeLabel} ${e.title}（${e.gameTime}）${e.description ? ' - ' + e.description : ''}`);
      }
    }

    // 信息差提示
    lines.push('');
    lines.push('【信息知晓层级提醒】');
    lines.push('完全知情者（裴今歌、姜朝渔）：知道所有客户存在、知道债务已清零、知道彼此在点单');
    lines.push('经纪人（沈千金）：知道所有客户身份，但不知道债务已被裴今歌清零');
    lines.push('不知情者（其余角色）：互不知晓其他客户存在，不知道债务真相');
    lines.push('请严格根据每个角色"已知信息"来控制她能说出和不能说出的内容。');

    return lines.join('\n');
  }, [events]);

  const contextValue = useMemo<EventContextType>(() => ({
    events,
    addEvent,
    addEvents,
    getCharacterEvents,
    getCharacterKnownInfo,
    removeEvent,
    clearAllEvents,
    getEventPromptText,
  }), [events, addEvent, addEvents, getCharacterEvents, getCharacterKnownInfo, removeEvent, clearAllEvents, getEventPromptText]);

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEventContext must be used within EventProvider');
  return ctx;
}

// 注：撞单自动推断已移除——偶遇场景由日程表/位置系统自然产生，不再需要专门的撞单机制
