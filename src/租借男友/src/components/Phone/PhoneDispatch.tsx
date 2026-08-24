/**
 * 租借男友 App — 波普风格
 *
 * 手机版债务调度应用
 * - 顶部：债务条（总债务 / 已收入 / 剩余债务 + 进度条）
 * - 中部：当前任务进度 / 三张候选卡片（每天自动生成）
 * - 每天8点自动触发派单通知，玩家点进来后自动加载3位候选人
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Loader, Check, RefreshCw,
} from 'lucide-react';
import { useToast } from '../ToastProvider';
import { useGameContext } from '../../state/GameContext';
import { usePhoneContext } from '../../state/PhoneContext';
import { sfx } from '../../audio/sfxPlayer';
import { AppHeader } from './PhoneShared';
import { CHARACTERS } from '../../data/gameData';
import { getWeather } from '../../data/weather';
import { generateDispatchOrders, type DispatchCandidate } from '../../utils/phoneApi';
import { cn } from '../../utils';

// ── 角色数据 ──
const CHAR_DATA: Record<string, { avatar: string; rate: number; color: string; textColor: string }> = {
  '温知晚': { avatar: 'https://i.postimg.cc/25BpPsRQ/1000213271.png', rate: 5000, color: 'border-pop-cyan', textColor: 'text-pop-cyan' },
  '周念安': { avatar: 'https://i.postimg.cc/bN8z1wX5/1000213237.png', rate: 2000, color: 'border-white', textColor: 'text-white' },
  '傅霁': { avatar: 'https://i.postimg.cc/zfRm9sZ7/1000213236.png', rate: 8000, color: 'border-pop-pink', textColor: 'text-pop-pink' },
  '椎名律': { avatar: 'https://i.postimg.cc/0Np69H75/nai-4055558051.png', rate: 3000, color: 'border-pop-yellow', textColor: 'text-pop-yellow' },
  '姜朝渔': { avatar: 'https://i.postimg.cc/k5trk03S/1000213361.png', rate: 500000, color: 'border-pop-cyan', textColor: 'text-pop-cyan' },
  '裴今歌': { avatar: 'https://i.postimg.cc/yNSqwM4h/1000213352.png', rate: 500000, color: 'border-pop-pink', textColor: 'text-pop-pink' },
  '罗兰': { avatar: 'https://i.postimg.cc/HnZVHWtB/1000213897.png', rate: 10000, color: 'border-white', textColor: 'text-white' },
  '霍千黎': { avatar: 'https://i.postimg.cc/RhsN9CTD/1000213899.png', rate: 10000, color: 'border-pop-black', textColor: 'text-gray-900' },
  '季明舒': { avatar: 'https://i.postimg.cc/kgpwtzwq/nai-3587295711.png', rate: 500000, color: 'border-white', textColor: 'text-white' },
  '步玲燕': { avatar: 'https://i.postimg.cc/ht5M76MK/2729c1ef-df54-4b2e-85fe-d65322e28c65.png', rate: 200, color: 'border-pop-yellow', textColor: 'text-pop-yellow' },
  '陆时予': { avatar: 'https://i.meee.com.tw/tPhxPog.png', rate: 10000, color: 'border-pop-cyan', textColor: 'text-pop-cyan' },
  '许不倦': { avatar: 'https://i.postimg.cc/kgKMgWHv/20a3b651-666d-4dd2-a651-13fee3a9eaf0.png', rate: 3000, color: 'border-pop-cyan', textColor: 'text-pop-cyan' },
  '织部宵': { avatar: 'https://i.postimg.cc/j5dFqXLC/47b854c6-079a-45b8-ae37-ea7cbfa1b2d5.png', rate: 10000, color: 'border-pop-yellow', textColor: 'text-pop-yellow' },
};

const DURATIONS = [
  { label: "1 小时", hours: 1 },
  { label: "2 小时", hours: 2 },
  { label: "4 小时", hours: 4 },
  { label: "8 小时", hours: 8 },
  { label: "包日", hours: 24 },
  { label: "连续2天", hours: 48 },
  { label: "连续3天", hours: 72 },
  { label: "连续7天", hours: 168 },
];

type DispatchCard = {
  name: string;
  description: string;
  durationHours: number;
  durationLabel: string;
  scheduledTime: Date;
  price: number;
  avatar: string;
  color: string;
  textColor: string;
};

/** 持久化到聊天变量的每日派单数据 */
type DailyDispatchData = {
  dateKey: string;
  viewed: boolean;
  cards: Array<{
    name: string;
    description: string;
    durationHours: number;
    durationLabel: string;
    scheduledTime: number; // timestamp
    price: number;
    avatar: string;
    color: string;
    textColor: string;
  }>;
};

function formatMvuTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

function buildPersonaSummary(name: string): string {
  const char = CHARACTERS.find(c => c.name === name);
  if (!char) return '';
  return `${char.desc} 标签：${char.tags.join('、')}。喜欢：${char.likes}。不喜欢：${char.dislikes}。`;
}

export function PhoneDispatch({ onExit }: { onExit: () => void }) {
  const { showToast } = useToast();
  const {
    currentOrder, acceptDispatch, gameTime,
    characterServiceStates,
    totalDebt, totalIncome, remainingDebt, setPendingMessage,
  } = useGameContext();
  const { config, isReady, clearDispatchBadge } = usePhoneContext();

  const [cards, setCards] = useState<DispatchCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasInitializedRef = useRef(false);
  const prevDateKeyRef = useRef<string>('');

  const progress = totalDebt > 0 ? Math.min(100, Math.max(0, (totalIncome / totalDebt) * 100)) : 0;

  const rollDurationAndPrice = useCallback((charName: string) => {
    const rand = Math.random();
    let dur;
    if (rand < 0.6) dur = DURATIONS[Math.floor(Math.random() * 4)];
    else if (rand < 0.9) dur = DURATIONS[4];
    else dur = DURATIONS[5 + Math.floor(Math.random() * 3)];
    const dailyRate = CHAR_DATA[charName]?.rate || 0;
    let price = 0;
    if (dur.hours < 12) price = Math.ceil(dailyRate * (dur.hours / 12));
    else price = dailyRate * (dur.hours / 24);
    return { ...dur, price };
  }, []);

  const generateScheduledTime = useCallback(() => {
    const offsetHours = 1 + Math.floor(Math.random() * 6);
    let scheduled = new Date(gameTime.getTime() + offsetHours * 60 * 60 * 1000);
    const hour = scheduled.getHours();
    if (hour < 8) scheduled.setHours(8, 0, 0, 0);
    else if (hour >= 22) { scheduled.setDate(scheduled.getDate() + 1); scheduled.setHours(8, 0, 0, 0); }
    if (scheduled <= gameTime) { scheduled.setDate(scheduled.getDate() + 1); scheduled.setHours(8, 0, 0, 0); }
    return scheduled;
  }, [gameTime]);

  // ── 从聊天变量加载今日派单 ──
  const loadDailyDispatch = useCallback((): DailyDispatchData | null => {
    try {
      const chatVars = getVariables({ type: 'chat' }) as any;
      const raw = chatVars?.dailyDispatch;
      if (!raw || typeof raw !== 'object' || typeof raw.dateKey !== 'string') return null;
      return raw as DailyDispatchData;
    } catch { return null; }
  }, []);

  // ── 保存今日派单到聊天变量 ──
  const saveDailyDispatch = useCallback((data: DailyDispatchData) => {
    try {
      updateVariablesWith(vars => ({ ...vars, dailyDispatch: data }), { type: 'chat' });
    } catch (e) {
      console.warn('[PhoneDispatch] 无法持久化每日派单:', e);
    }
  }, []);

  // ── 自动生成3个候选人 ──
  const generateCards = useCallback(async (dateKey: string) => {
    if (!isReady) {
      showToast('请先在手机设置中配置副API', 'alert');
      return;
    }
    setIsGenerating(true);
    setCards([]);
    sfx.play('diceRoll');

    try {
      const availableChars = Object.keys(CHAR_DATA).filter(name => {
        const state = characterServiceStates[name];
        return !state || state.服务状态 === '无服务';
      });
      const shuffled = [...availableChars].sort(() => 0.5 - Math.random());
      const picked = shuffled.slice(0, 3);

      // 为每个角色掷时长/时间/价格
      const rolledData = picked.map(name => {
        const dur = rollDurationAndPrice(name);
        const scheduledTime = generateScheduledTime();
        return { name, dur, scheduledTime };
      });

      const candidates: DispatchCandidate[] = rolledData.map(({ name, dur, scheduledTime }) => ({
        name,
        personaSummary: buildPersonaSummary(name),
        durationHours: dur.hours,
        scheduledTimeStr: formatMvuTime(scheduledTime),
        dailyRate: CHAR_DATA[name]?.rate || 0,
      }));

      const weather = getWeather(gameTime);
      const descriptions = await generateDispatchOrders(candidates, gameTime, weather.type, config.subApi);

      const newCards: DispatchCard[] = rolledData.map(({ name, dur, scheduledTime }) => {
        const charData = CHAR_DATA[name];
        return {
          name,
          description: descriptions[name] || '（该角色暂无下单意向）',
          durationHours: dur.hours,
          durationLabel: dur.label,
          scheduledTime,
          price: dur.price,
          avatar: charData?.avatar || '',
          color: charData?.color || 'border-pop-cyan',
          textColor: charData?.textColor || 'text-pop-cyan',
        };
      });

      setCards(newCards);

      // 持久化到聊天变量
      const dispatchData: DailyDispatchData = {
        dateKey,
        viewed: true,
        cards: newCards.map(c => ({
          ...c,
          scheduledTime: c.scheduledTime.getTime(),
        })),
      };
      saveDailyDispatch(dispatchData);

      // 清除手机badge
      clearDispatchBadge();

      showToast('收到 3 位客户的新指名派单', 'normal');
      console.info(`[PhoneDispatch] 自动生成今日派单: ${picked.join(', ')}`);
    } catch (err) {
      console.error('[PhoneDispatch] 派单生成失败:', err);
      showToast('派单生成失败，请重试', 'alert');
    } finally {
      setIsGenerating(false);
    }
  }, [isReady, config.subApi, characterServiceStates, gameTime, showToast, rollDurationAndPrice, generateScheduledTime, saveDailyDispatch, clearDispatchBadge]);

  // ── 进入时自动加载/生成今日派单（8:00后才生成）──
  useEffect(() => {
    const dateKey = `${gameTime.getFullYear()}-${gameTime.getMonth()}-${gameTime.getDate()}`;

    // 检查聊天变量中是否已有今日派单
    const existing = loadDailyDispatch();
    if (existing && existing.dateKey === dateKey && existing.cards?.length > 0) {
      // 今日已生成过派单，直接加载
      const loadedCards: DispatchCard[] = existing.cards.map(c => ({
        ...c,
        scheduledTime: new Date(c.scheduledTime),
      }));
      setCards(loadedCards);
      if (!existing.viewed) {
        saveDailyDispatch({ ...existing, viewed: true });
      }
      clearDispatchBadge();
      prevDateKeyRef.current = dateKey;
      if (!hasInitializedRef.current) {
        console.info(`[PhoneDispatch] 加载今日派单: ${existing.cards.length} 张卡片`);
      }
      hasInitializedRef.current = true;
      return;
    }

    // 时间未到8:00，今日订单尚未刷新
    if (gameTime.getHours() < 8) {
      setCards([]);
      if (prevDateKeyRef.current !== dateKey + '_pending') {
        console.info('[PhoneDispatch] 当前时间未到8:00，今日订单尚未刷新');
        prevDateKeyRef.current = dateKey + '_pending';
      }
      return;
    }

    // 已过8:00但当天未生成过订单 — 不自动生成，等玩家手动刷新
    setCards([]);
    prevDateKeyRef.current = dateKey + '_manual';
    console.info('[PhoneDispatch] 今日暂无派单，等待玩家手动刷新');
  }, [gameTime, loadDailyDispatch, saveDailyDispatch, clearDispatchBadge]);

  const handleAccept = useCallback((card: DispatchCard) => {
    const timeStr = formatMvuTime(card.scheduledTime);
    acceptDispatch({
      charName: card.name,
      description: card.description,
      durationString: card.durationLabel,
      price: card.price,
      scheduledTime: card.scheduledTime.getTime(),
      durationMinutes: card.durationHours * 60,
    }, {
      客户: card.name,
      描述: card.description,
      预约时间: timeStr,
      服务时长: card.durationHours,
      价格: card.price,
    });
    // 写入输入框，让 AI 知道订单详情
    const msg = `[派单确认]\n客户：${card.name}\n描述：${card.description}\n预约时间：${timeStr}\n服务时长：${card.durationLabel}\n价格：¥${card.price.toLocaleString()}`;
    setPendingMessage(msg);
    sfx.play('dispatchAccept');
    showToast(`已接受 ${card.name} 的委托`);
    setCards([]);
  }, [acceptDispatch, showToast, setPendingMessage]);

  const fmtTime = (d: Date) => d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-[#2a2a2a] flex flex-col z-10"
    >
      <AppHeader title="租借男友" color="bg-pop-yellow" onBack={onExit} />

      {/* ── 债务条 ── */}
      <div className="shrink-0 bg-pop-black border-b-2 border-pop-pink p-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-halftone-white opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-end justify-between mb-1.5">
          <span className="text-pop-pink font-black text-[10px] italic -skew-x-6">REMAINING DEBT</span>
          <span className="text-pop-yellow font-black text-lg drop-shadow-[2px_2px_0_#ff3366] tabular-nums">
            ¥{remainingDebt.toLocaleString()}
          </span>
        </div>
        <div className="h-3.5 w-full bg-white border-2 border-pop-black relative overflow-hidden transform -skew-x-3">
          <motion.div
            className="absolute top-0 left-0 h-full bg-stripes-cyan-pink"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, type: 'spring' }}
          />
        </div>
        <div className="relative z-10 flex justify-between mt-1.5">
          <div className="text-[9px] font-bold text-gray-400">
            总债务 <span className="text-white tabular-nums">¥{totalDebt.toLocaleString()}</span>
          </div>
          <div className="text-[9px] font-bold text-gray-400">
            已收入 <span className="text-pop-green tabular-nums">¥{totalIncome.toLocaleString()}</span>
          </div>
          <div className="text-[9px] font-bold text-pop-cyan tabular-nums">
            {progress.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ── 内容区 ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3">
        <AnimatePresence mode="wait">
          {/* 当前任务进行中 */}
          {currentOrder ? (
            <motion.div
              key="active-order"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-pop-pink border-4 border-pop-black shadow-pop p-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-15 pointer-events-none">
                <Clock className="w-20 h-20 animate-spin-slow text-white" />
              </div>
              <div className="relative z-10">
                <div className="inline-block bg-pop-black px-2.5 py-1 -skew-x-6 border-2 border-white mb-3">
                  <h3 className="text-sm font-black italic text-white">ACTIVE DISPATCH</h3>
                </div>
                <p className="font-bold text-xs mb-3 bg-white text-pop-black inline-block px-2 py-0.5 -skew-x-6">
                  当前服务对象: <span className="text-pop-pink font-black">{currentOrder.charName}</span>
                </p>
                {currentOrder.description && (
                  <p className="text-[11px] text-white/80 mb-3 italic leading-relaxed">{currentOrder.description}</p>
                )}
                {(() => {
                  const charState = characterServiceStates[currentOrder.charName];
                  const remainingMins = charState ? charState.剩余服务小时 * 60 + charState.剩余服务分钟 : 0;
                  const totalMins = currentOrder.durationMinutes || 1;
                  const pct = Math.min(100, Math.max(0, ((totalMins - remainingMins) / totalMins) * 100));
                  const remH = Math.floor(remainingMins / 60);
                  const remM = remainingMins % 60;
                  return (
                    <div>
                      <div className="flex justify-between font-bold text-[11px] text-white mb-1">
                        <span>{currentOrder.durationString}</span>
                        <span className="text-pop-yellow">{remH}h {remM}m · {Math.floor(pct)}%</span>
                      </div>
                      <div className="h-3.5 w-full bg-pop-black border-2 border-white relative overflow-hidden -skew-x-3">
                        <div className="absolute top-0 left-0 h-full bg-pop-cyan transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-pop-black border-4 border-pop-black p-8 text-center"
            >
              <Loader className="w-8 h-8 mx-auto mb-3 animate-spin text-pop-yellow" />
              <p className="font-black text-sm text-gray-400 italic -skew-x-6">GENERATING ORDERS...</p>
              <p className="font-bold text-xs text-gray-500 mt-1">三位客户正在下单中...</p>
            </motion.div>
          ) : cards.length > 0 ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-center mb-2">
                <span className="text-pop-yellow font-black text-[10px] italic -skew-x-6 bg-pop-black px-2 py-0.5 inline-block border border-pop-yellow">
                  今日派单 · {cards.length} 位客户
                </span>
              </div>
              {cards.map((card, i) => {
                const colorScheme = i % 3 === 0
                  ? 'bg-pop-pink text-white border-pop-cyan'
                  : i % 3 === 1
                    ? 'bg-pop-cyan text-pop-black border-pop-pink'
                    : 'bg-pop-yellow text-pop-black border-pop-pink';
                return (
                  <motion.div
                    key={card.name}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, type: 'spring', damping: 18 }}
                    className={cn('border-4 border-pop-black p-3 relative overflow-hidden', colorScheme)}
                  >
                    <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
                    <div className="relative z-10">
                      {/* 头像 + 名字 + 价格 */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-12 h-12 shrink-0 border-2 border-pop-black overflow-hidden">
                          <img src={card.avatar} alt={card.name} className="w-full h-full object-cover object-top scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black italic truncate">{card.name}</h3>
                          <p className="text-[10px] font-bold opacity-70">¥{card.price.toLocaleString()} · {card.durationLabel}</p>
                        </div>
                        <div className="text-[10px] font-bold flex items-center gap-1 opacity-80">
                          <Clock className="w-3 h-3 shrink-0" />
                          {fmtTime(card.scheduledTime)}
                        </div>
                      </div>
                      {/* 描述 */}
                      <p className="text-[11px] font-bold leading-relaxed mb-2.5">{card.description}</p>
                      {/* 接受按钮 */}
                      <button
                        onClick={() => handleAccept(card)}
                        className="w-full py-2 bg-pop-black text-white font-black text-xs border-2 border-pop-black shadow-pop hover:bg-white hover:text-pop-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all -skew-x-3 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>接受委托</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : gameTime.getHours() < 8 ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-pop-black border-4 border-pop-yellow p-8 text-center"
            >
              <Clock className="w-8 h-8 mx-auto mb-3 text-pop-yellow" />
              <div className="text-gray-400 font-black text-sm italic -skew-x-6">PENDING ORDER...</div>
              <p className="font-bold text-xs text-gray-500 mt-1">今日订单尚未刷新</p>
              <p className="font-bold text-xs text-pop-yellow mt-1">每天早上 8:00 后更新</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-pop-black border-4 border-pop-cyan p-8 text-center"
            >
              <RefreshCw className="w-8 h-8 mx-auto mb-3 text-pop-cyan" />
              <div className="text-gray-400 font-black text-sm italic -skew-x-6">NO DISPATCH YET</div>
              <p className="font-bold text-xs text-gray-500 mt-1">今日尚未生成派单</p>
              <button
                onClick={() => {
                  const dateKey = `${gameTime.getFullYear()}-${gameTime.getMonth()}-${gameTime.getDate()}`;
                  generateCards(dateKey);
                }}
                disabled={!isReady}
                className="mt-3 px-4 py-2 bg-pop-cyan text-pop-black font-black text-xs border-2 border-pop-black shadow-pop hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all -skew-x-3 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>刷新派单</span>
              </button>
              {!isReady && (
                <p className="font-bold text-[10px] text-pop-pink mt-2">请先在手机设置中配置副API</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
