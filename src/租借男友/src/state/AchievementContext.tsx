/**
 * 成就系统 Context — 纯前端元层
 *
 * 设计理念：类似 Steam Overlay
 * - MVU 只管游戏状态，成就系统在之上"观察"变化
 * - 不修改 MVU schema，不改变量更新规则
 * - 存储在聊天变量 {type:'chat'} 中（与 nsfwUnlocked 一致）
 *
 * 触发方式：
 * 1. 前端检测：监听 GameContext 同步好的游戏状态，检测数值类成就条件
 * 2. AI 标签：AI 输出 <achievement>编号</achievement>，scriptParser 将标签附加到
 *    相邻可见行，StoryView 在玩家点击推进到该行时调用 unlock() 触发
 *
 * 关键：不独立读取 MVU，而是复用 GameContext 已同步的数据，避免竞态条件。
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ACHIEVEMENTS,
  resolveAchievementTrigger,
  type AchievementDef,
  type AchievementSnapshot,
} from '../data/achievementData';
import { sfx } from '../audio/sfxPlayer';
import { useGameContext } from './GameContext';

// ── 已解锁成就记录 ──
export interface UnlockedAchievement {
  id: string;
  /** 解锁时的游戏内时间（如 "10月08日 19:00"） */
  unlockedAt: string;
  /** 解锁时所在楼层 */
  floorId?: number;
}

// ── Context 类型 ──
interface AchievementContextType {
  /** 已解锁成就列表 */
  unlocked: UnlockedAchievement[];
  /** 待显示的奖杯通知队列（按顺序弹出） */
  notificationQueue: AchievementDef[];
  /** 手动解锁成就（AI 标签或外部调用） */
  unlock: (id: string, floorId?: number) => void;
  /** 消费队列头部（通知显示完毕后调用） */
  dequeueNotification: () => void;
  /** 查询是否已解锁 */
  isUnlocked: (id: string) => boolean;
  /** 已解锁数量 */
  unlockedCount: number;
  /** 总成就数量 */
  totalCount: number;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// ── Provider ──

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  // 直接使用 GameContext 已同步好的游戏状态
  const {
    totalDebt, totalIncome, remainingDebt,
    currentLocation, characterServiceStates,
    gameTime, lastAssistantFloorId,
    currentOrder,
  } = useGameContext();

  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<AchievementDef[]>([]);
  // 加载完成标记：用 state 而非 ref，使其变化能触发重渲染和检测 effect 重跑
  const [isLoaded, setIsLoaded] = useState(false);

  // 用 ref 存储 unlocked 避免闭包陷阱
  const unlockedRef = useRef<UnlockedAchievement[]>([]);
  unlockedRef.current = unlocked;

  // 所有有效的成就 ID 集合（用于过滤无效记录）
  const validIds = useMemo(() => new Set(ACHIEVEMENTS.map(a => a.id)), []);

  // 从聊天变量加载已解锁成就
  const loadUnlocked = useCallback(() => {
    try {
      const chatVars = getVariables({ type: 'chat' }) as any;
      if (Array.isArray(chatVars?.unlockedAchievements)) {
        // 过滤掉无效的成就 ID（可能来自旧版本或已删除的成就）
        const valid = chatVars.unlockedAchievements.filter((u: any) => u && validIds.has(u.id));
        setUnlocked(valid);
        console.info(`[Achievement] 从聊天变量加载了 ${valid.length} 个已解锁成就（原始 ${chatVars.unlockedAchievements.length} 个，过滤 ${chatVars.unlockedAchievements.length - valid.length} 个无效记录）`);
      } else {
        setUnlocked([]);
      }
      setIsLoaded(true);
    } catch {
      console.warn('[Achievement] 聊天变量未就绪');
      // 不设 isLoaded，等聊天变量就绪后再检测
    }
  }, [validIds]);

  // 持久化到聊天变量
  const persistUnlocked = useCallback((newList: UnlockedAchievement[]) => {
    try {
      updateVariablesWith(vars => ({ ...vars, unlockedAchievements: newList }), { type: 'chat' });
    } catch {
      console.warn('[Achievement] 无法持久化成就到聊天变量');
    }
  }, []);

  // 加载 + 监听聊天文件变更
  useEffect(() => {
    loadUnlocked();
    const stop = eventOn(tavern_events.CHAT_CHANGED, () => {
      loadUnlocked();
    });
    return () => stop.stop();
  }, [loadUnlocked]);

  // 格式化游戏时间
  const formatGameTime = useCallback((time: Date | null): string => {
    if (!time) return '未知时间';
    const month = time.getMonth() + 1;
    const day = time.getDate();
    const hour = String(time.getHours()).padStart(2, '0');
    const min = String(time.getMinutes()).padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  }, []);

  /**
   * 解锁成就 — 核心函数
   * 1. 检查是否已解锁（去重）
   * 2. 添加到已解锁列表 + 持久化
   * 3. 添加到通知队列（排队弹窗）
   * 4. 播放音效
   *
   * 支持编号（如 "1"）和 ID（如 "first_bucket"）两种格式
   */
  const unlock = useCallback((rawId: string, floorId?: number) => {
    const def = resolveAchievementTrigger(rawId);
    if (!def) {
      console.warn(`[Achievement] 未知成就标识: ${rawId}`);
      return;
    }

    const id = def.id;

    // 去重
    if (unlockedRef.current.some(a => a.id === id)) return;

    const record: UnlockedAchievement = {
      id,
      unlockedAt: formatGameTime(gameTime),
      floorId,
    };

    setUnlocked(prev => {
      const updated = [...prev, record];
      persistUnlocked(updated);
      return updated;
    });

    // 加入通知队列
    setNotificationQueue(prev => [...prev, def]);

    // 播放音效
    sfx.play('achievementUnlock');

    console.info(`[Achievement] 成就解锁: ${def.name} (${id})`);
  }, [formatGameTime, gameTime, persistUnlocked]);

  /** 消费队列头部（通知显示完毕后调用） */
  const dequeueNotification = useCallback(() => {
    setNotificationQueue(prev => prev.slice(1));
  }, []);

  /** 查询是否已解锁 */
  const isUnlocked = useCallback((id: string): boolean => {
    return unlocked.some(a => a.id === id);
  }, [unlocked]);

  // ── 数值类成就检测：监听 GameContext 状态变化 ──
  // 直接用 GameContext 同步好的数据构建快照，不独立读 MVU
  useEffect(() => {
    if (!isLoaded) return;

    // 构建快照
    const snapshot: AchievementSnapshot = {
      totalIncome,
      remainingDebt,
      totalDebt,
      currentOrderPrice: currentOrder?.price ?? 0,
      currentOrderCustomer: currentOrder?.charName ?? '',
      currentLocation,
      characterStates: Object.fromEntries(
        Object.entries(characterServiceStates).map(([name, state]) => [
          name,
          {
            服务状态: state.服务状态,
            剩余服务小时: state.剩余服务小时,
            剩余服务分钟: state.剩余服务分钟,
          },
        ]),
      ),
      gameTime,
    };

    // 遍历所有 mvu_check 类型的成就
    for (const def of ACHIEVEMENTS) {
      if (def.trigger !== 'mvu_check' || !def.check) continue;
      // 已解锁则跳过
      if (unlockedRef.current.some(a => a.id === def.id)) continue;

      // 检测条件
      if (def.check(snapshot)) {
        unlock(def.id, lastAssistantFloorId ?? undefined);
      }
    }
  }, [isLoaded, totalDebt, totalIncome, remainingDebt, currentLocation, characterServiceStates, gameTime, currentOrder, unlock, lastAssistantFloorId]);

  const contextValue = useMemo<AchievementContextType>(() => ({
    unlocked,
    notificationQueue,
    unlock,
    dequeueNotification,
    isUnlocked,
    unlockedCount: unlocked.length,
    totalCount: ACHIEVEMENTS.length,
  }), [unlocked, notificationQueue, unlock, dequeueNotification, isUnlocked]);

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievementContext() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievementContext must be used within AchievementProvider');
  return ctx;
}
