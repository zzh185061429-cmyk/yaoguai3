import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PopCard } from "../components/ui/PopCard";
import { PopButton } from "../components/ui/PopButton";
import { Clock, Loader, Check, X, MapPin, Coffee, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../components/ToastProvider";
import { useGameContext } from "../state/GameContext";
import { usePhoneContext } from "../state/PhoneContext";
import { sfx } from "../audio/sfxPlayer";
import { CHARACTERS } from "../data/gameData";
import { getWeather } from "../data/weather";
import { getCharacterLocation } from "../data/scheduleData";
import { generateDispatchOrders, type DispatchCandidate } from "../utils/phoneApi";
import { cn } from "../utils";

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

// ── 短时时长选项（不再有包日/多天）──
const DURATIONS = [
  { label: "1 小时", hours: 1, weight: 3 },
  { label: "2 小时", hours: 2, weight: 5 },
  { label: "4 小时", hours: 4, weight: 2 },
];

// ── 时段选项 ──
const TIME_SLOTS = [
  { startHour: 9, endHour: 12, label: "上午" },
  { startHour: 13, endHour: 17, label: "下午" },
  { startHour: 18, endHour: 21, label: "傍晚" },
];

// ── 每日订单类型 ──
type DailyOrder = {
  charName: string;
  description: string;
  durationHours: number;
  durationLabel: string;
  scheduledTime: number; // timestamp
  price: number;
  avatar: string;
  color: string;
  textColor: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  dateKey: string;
};

/** 将 Date 转为 schema 规定的 MM月DD日 HH:mm 格式 */
function formatMvuTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

/** 从 gameData 构建角色人设摘要 */
function buildPersonaSummary(name: string): string {
  const char = CHARACTERS.find(c => c.name === name);
  if (!char) return '';
  return `${char.desc} 标签：${char.tags.join('、')}。喜欢：${char.likes}。不喜欢：${char.dislikes}。`;
}

/** 加权随机选时长 */
function pickDuration() {
  const totalWeight = DURATIONS.reduce((s, d) => s + d.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const d of DURATIONS) {
    rand -= d.weight;
    if (rand <= 0) return d;
  }
  return DURATIONS[0];
}

/** 查询角色在指定时间点的日程状态，返回可读字符串 */
function getCharScheduleStatus(charName: string, date: Date): string {
  try {
    const loc = getCharacterLocation(charName, date);
    if (!loc) return "空闲";
    if (loc.isFree) {
      const fullLoc = loc.parentLocation ? `${loc.parentLocation}/${loc.location}` : loc.location;
      return `空闲（当前在${fullLoc}）`;
    }
    if (loc.activity) {
      const fullLoc = loc.parentLocation ? `${loc.parentLocation}/${loc.location}` : loc.location;
      return `${loc.activity}（在${fullLoc}），下单时需避开此时段`;
    }
    return "空闲";
  } catch {
    return "空闲";
  }
}

/** 检查角色在指定时间段内是否完全空闲（无核心日程冲突） */
function isCharFreeDuring(charName: string, start: Date, durationHours: number): boolean {
  try {
    for (let i = 0; i < durationHours * 2; i++) {
      const checkTime = new Date(start.getTime() + i * 30 * 60 * 1000);
      const loc = getCharacterLocation(charName, checkTime);
      if (loc && !loc.isFree && loc.activity) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

/** 随机选时段 + 具体开始小时 */
function pickScheduledTime(gameTime: Date, durationHours: number): Date {
  const slot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
  // 确保开始时间 + 时长不超出时段
  const maxStart = slot.endHour - durationHours;
  const startHour = slot.startHour + Math.floor(Math.random() * Math.max(1, maxStart - slot.startHour + 1));
  const scheduled = new Date(gameTime);
  scheduled.setHours(startHour, 0, 0, 0);
  // 如果预约时间已过（比当前游戏时间还早），顺延到当前时间之后
  if (scheduled <= gameTime) {
    scheduled.setTime(gameTime.getTime() + (1 + Math.floor(Math.random() * 3)) * 60 * 60 * 1000);
    const h = scheduled.getHours();
    if (h < 8) scheduled.setHours(8, 0, 0, 0);
    else if (h >= 22) {
      scheduled.setDate(scheduled.getDate() + 1);
      scheduled.setHours(8, 0, 0, 0);
    }
  }
  return scheduled;
}

export function DispatchView() {
  const { showToast } = useToast();
  const {
    currentOrder, acceptDispatch, gameTime,
    characterServiceStates, setIsMapOpen, setPendingMessage,
  } = useGameContext();
  const { config, isReady } = usePhoneContext();

  const [dailyOrder, setDailyOrder] = useState<DailyOrder | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const prevDateKeyRef = useRef<string>('');
  const prevOrderActiveRef = useRef(false);

  // ── 从聊天变量加载订单 ──
  const loadOrderFromVars = useCallback((): DailyOrder | null => {
    try {
      const chatVars = getVariables({ type: 'chat' });
      if (!chatVars) return null;
      const raw = (chatVars as any).dailyOrder;
      if (!raw || typeof raw !== 'object') return null;
      if (typeof raw.charName !== 'string' || typeof raw.status !== 'string') return null;
      if (typeof raw.dateKey !== 'string' || typeof raw.scheduledTime !== 'number') return null;
      return raw as DailyOrder;
    } catch { return null; }
  }, []);

  // ── 保存订单到聊天变量 ──
  const saveOrderToVars = useCallback((order: DailyOrder) => {
    try {
      updateVariablesWith(vars => ({ ...vars, dailyOrder: order }), { type: 'chat' });
    } catch (e) {
      console.warn('[DispatchView] 无法持久化每日订单:', e);
    }
  }, []);

  // ── 更新订单状态 ──
  const updateOrderStatus = useCallback((status: DailyOrder['status']) => {
    setDailyOrder(prev => {
      if (!prev) return prev;
      const updated = { ...prev, status };
      saveOrderToVars(updated);
      return updated;
    });
  }, [saveOrderToVars]);

  // ── 生成今日订单 ──
  const generateOrder = useCallback(async (dateKey: string) => {
    setIsGenerating(true);
    try {
      // 1. 随机选时长
      const dur = pickDuration();

      // 2. 随机选时段 + 具体时间
      const scheduledTime = pickScheduledTime(gameTime, dur.hours);

      // 3. 筛选可用角色：排除经纪人(沈千金)、正在服务中的、在预约时段有核心日程冲突的
      const availableChars = Object.keys(CHAR_DATA).filter(name => {
        const state = characterServiceStates[name];
        if (state && state.服务状态 !== '无服务') return false;
        // 检查角色在预约时段是否空闲
        return isCharFreeDuring(name, scheduledTime, dur.hours);
      });

      // 如果按日程筛选后无可用角色，回退到不检查日程的筛选（保证总能生成订单）
      let candidateChars = availableChars;
      if (candidateChars.length === 0) {
        candidateChars = Object.keys(CHAR_DATA).filter(name => {
          const state = characterServiceStates[name];
          return !state || state.服务状态 === '无服务';
        });
        console.warn('[DispatchView] 无日程空闲角色，回退到不检查日程的筛选');
      }

      if (candidateChars.length === 0) {
        console.warn('[DispatchView] 无可用角色生成订单');
        setIsGenerating(false);
        return;
      }
      const charName = candidateChars[Math.floor(Math.random() * candidateChars.length)];

      // 4. 计算价格
      const dailyRate = CHAR_DATA[charName]?.rate || 0;
      const price = Math.ceil(dailyRate * (dur.hours / 12));

      // 5. 查询角色日程状态（传给副API作为上下文）
      const scheduleStatus = getCharScheduleStatus(charName, scheduledTime);

      // 6. 通过副API生成下单描述（注入天气和日程上下文）
      let description = '（该角色想下单租借你）';
      if (isReady) {
        try {
          const weather = getWeather(gameTime);
          const candidates: DispatchCandidate[] = [{
            name: charName,
            personaSummary: buildPersonaSummary(charName),
            durationHours: dur.hours,
            scheduledTimeStr: formatMvuTime(scheduledTime),
            dailyRate,
            scheduleStatus,
          }];
          const descriptions = await generateDispatchOrders(candidates, gameTime, weather.type, config.subApi);
          if (descriptions[charName]) {
            description = descriptions[charName];
          }
        } catch (e) {
          console.error('[DispatchView] 订单描述生成失败:', e);
        }
      }

      // 7. 组装并存储
      const order: DailyOrder = {
        charName,
        description,
        durationHours: dur.hours,
        durationLabel: dur.label,
        scheduledTime: scheduledTime.getTime(),
        price,
        avatar: CHAR_DATA[charName]?.avatar || '',
        color: CHAR_DATA[charName]?.color || 'border-pop-cyan',
        textColor: CHAR_DATA[charName]?.textColor || 'text-pop-cyan',
        status: 'pending',
        dateKey,
      };
      saveOrderToVars(order);
      setDailyOrder(order);
      sfx.play('diceRoll');
      console.info(`[DispatchView] 生成今日订单: ${charName}, ${dur.label}, ¥${price}, 日程: ${scheduleStatus}`);
    } finally {
      setIsGenerating(false);
    }
  }, [gameTime, characterServiceStates, isReady, config, saveOrderToVars]);

  // ── 游戏日期变更/8点到达时检查/生成订单 ──
  useEffect(() => {
    const dateKey = `${gameTime.getFullYear()}-${gameTime.getMonth()}-${gameTime.getDate()}`;

    // 检查聊天变量中是否已有今日订单
    const existing = loadOrderFromVars();
    if (existing && existing.dateKey === dateKey) {
      setDailyOrder(existing);
      if (prevDateKeyRef.current !== dateKey) {
        console.info(`[DispatchView] 加载今日订单: ${existing.charName} (${existing.status})`);
        prevDateKeyRef.current = dateKey;
      }
      return;
    }

    // 只有游戏时间 >= 当天8:00 才生成新订单
    if (gameTime.getHours() < 8) {
      setDailyOrder(null);
      if (prevDateKeyRef.current !== dateKey + '_pending') {
        console.info('[DispatchView] 当前时间未到8:00，今日订单尚未刷新');
        prevDateKeyRef.current = dateKey + '_pending';
      }
      return;
    }

    // 已过8:00且当天未生成过订单
    if (prevDateKeyRef.current === dateKey) return;
    prevDateKeyRef.current = dateKey;
    generateOrder(dateKey);
  }, [gameTime, loadOrderFromVars, generateOrder]);

  // ── 检测服务完成 → 更新状态为 completed ──
  useEffect(() => {
    const isActive = !!currentOrder;
    if (prevOrderActiveRef.current && !isActive && dailyOrder?.status === 'accepted') {
      updateOrderStatus('completed');
      showToast('今日服务已完成', 'normal');
    }
    prevOrderActiveRef.current = isActive;
  }, [currentOrder, dailyOrder, updateOrderStatus, showToast]);

  // ── 接受订单 ──
  const handleAccept = useCallback(async () => {
    if (!dailyOrder) return;
    const scheduled = new Date(dailyOrder.scheduledTime);
    sfx.play('dispatchAccept');

    acceptDispatch({
      charName: dailyOrder.charName,
      description: dailyOrder.description,
      durationString: dailyOrder.durationLabel,
      price: dailyOrder.price,
      scheduledTime: dailyOrder.scheduledTime,
      durationMinutes: dailyOrder.durationHours * 60,
    }, {
      客户: dailyOrder.charName,
      描述: dailyOrder.description,
      预约时间: formatMvuTime(scheduled),
      服务时长: dailyOrder.durationHours,
      价格: dailyOrder.price,
    });

  // 写入输入框，让 AI 知道订单详情
  const msg = `[派单确认]\n客户：${dailyOrder.charName}\n描述：${dailyOrder.description}\n预约时间：${formatMvuTime(scheduled)}\n服务时长：${dailyOrder.durationLabel}\n价格：¥${dailyOrder.price.toLocaleString()}`;
  setPendingMessage(msg);

  showToast(`已接受 ${dailyOrder.charName} 的委托`);
  updateOrderStatus('accepted');
}, [dailyOrder, acceptDispatch, showToast, updateOrderStatus, setPendingMessage]);

  // ── 拒绝订单 ──
  const handleDecline = useCallback(() => {
    if (!dailyOrder) return;
    sfx.play('click');
    showToast(`已拒绝 ${dailyOrder.charName} 的委托`);
    updateOrderStatus('declined');
  }, [dailyOrder, showToast, updateOrderStatus]);

  // ── 显示状态 ──
  const displayState = useMemo<'loading' | 'pending' | 'service' | 'free' | 'waiting'>(() => {
    if (isGenerating) return 'loading';
    if (!dailyOrder) {
      if (gameTime.getHours() < 8) return 'waiting';
      return 'loading';
    }
    if (dailyOrder.status === 'pending') return 'pending';
    if (dailyOrder.status === 'declined' || dailyOrder.status === 'completed') return 'free';
    if (dailyOrder.status === 'accepted') {
      return currentOrder ? 'service' : 'free';
    }
    return 'loading';
  }, [dailyOrder, isGenerating, currentOrder, gameTime]);

  const scheduledDate = dailyOrder ? new Date(dailyOrder.scheduledTime) : null;

  return (
    <div className="w-full h-full bg-halftone flex flex-col">
      <div className="flex-1 overflow-y-auto pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
          <div className="space-y-4 relative z-10">
            <AnimatePresence mode="wait">

              {/* ── 加载中 ── */}
              {displayState === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PopCard className="bg-pop-black text-white border-4 border-white shadow-pop p-12 text-center clip-diagonal">
                    <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-pop-yellow" />
                    <h3 className="text-2xl font-black italic text-white">GENERATING ORDER...</h3>
                    <p className="font-bold mt-2 text-gray-400">正在生成今日派单...</p>
                  </PopCard>
                </motion.div>
              )}

              {/* ── 等待8点刷新 ── */}
              {displayState === 'waiting' && (
                <motion.div key="waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <PopCard className="bg-pop-black text-white border-4 border-pop-yellow shadow-[8px_8px_0px_0px_#fbbf24] p-12 text-center clip-diagonal overflow-hidden relative">
                    <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
                    <div className="relative z-10">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-pop-yellow" />
                      <h3 className="text-2xl font-black italic text-white">PENDING ORDER...</h3>
                      <p className="font-bold mt-2 text-gray-400">今日订单尚未刷新</p>
                      <p className="font-bold mt-1 text-pop-yellow text-sm">每天早上 8:00 后更新</p>
                    </div>
                  </PopCard>
                </motion.div>
              )}

              {/* ── 待处理：今日唯一订单 ── */}
              {displayState === 'pending' && dailyOrder && scheduledDate && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  {/* 标题 */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-pop-pink border border-pop-black transform -skew-x-3" />
                    <span className="font-black text-lg uppercase italic transform -skew-x-3 text-pop-black">TODAY'S ORDER / 今日派单</span>
                  </div>

                  <PopCard className={cn(
                    "flex flex-col border-4 border-pop-black clip-diagonal overflow-hidden relative group",
                    "bg-white text-pop-black shadow-[8px_8px_0px_0px_#ff3366]",
                  )}>
                    <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

                    {/* 头像 + 名字 + 价格 */}
                    <div className="relative z-10 flex items-center gap-4 p-5 border-b-4 border-pop-black bg-pop-cyan">
                      <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 border-4 border-pop-black overflow-hidden clip-diagonal">
                        <img src={dailyOrder.avatar} alt={dailyOrder.charName} className="w-full h-full object-cover object-top scale-110" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-3xl font-black italic truncate text-pop-black">{dailyOrder.charName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-sm bg-pop-black text-white px-2 py-0.5 -skew-x-6 border-2 border-pop-black">
                            ¥{dailyOrder.price.toLocaleString()}
                          </span>
                          <span className="font-bold text-xs text-pop-black/70">{dailyOrder.durationLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* 下单描述 */}
                    <div className="relative z-10 p-5 min-h-20">
                      <p className="text-base font-bold leading-relaxed text-pop-black">{dailyOrder.description}</p>
                    </div>

                    {/* 时间信息 */}
                    <div className="relative z-10 px-5 pb-3 flex items-center gap-2 text-sm font-bold text-pop-black/70">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{scheduledDate.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="relative z-10 p-5 pt-2 flex gap-3">
                      <PopButton
                        onClick={handleAccept}
                        size="lg"
                        className="flex-1 bg-pop-black text-white hover:bg-white hover:text-pop-black border-2 border-pop-black flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        <span className="text-xl font-black italic">接受</span>
                      </PopButton>
                      <PopButton
                        onClick={handleDecline}
                        size="lg"
                        variant="ghost"
                        className="flex-1 bg-white/50 text-pop-black/60 hover:bg-gray-200 border-2 border-pop-black/30 flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        <span className="text-xl font-black italic">拒绝</span>
                      </PopButton>
                    </div>
                  </PopCard>
                </motion.div>
              )}

              {/* ── 服务进行中 ── */}
              {displayState === 'service' && currentOrder && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <PopCard className="bg-pop-pink text-white border-4 border-white shadow-[8px_8px_0px_0px_#00e5ff] p-8 clip-diagonal overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                      <Clock className="w-32 h-32 animate-spin-slow" />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-block bg-pop-black px-4 py-2 -skew-x-6 border-2 border-white mb-4">
                        <h3 className="text-3xl font-black italic text-white">ACTIVE DISPATCH / 任务进行中</h3>
                      </div>
                      <p className="font-bold text-xl mb-6 bg-white text-pop-black inline-block px-3 py-1 -skew-x-6">
                        当前服务对象: <span className="text-pop-pink">{currentOrder.charName}</span>
                      </p>
                      {currentOrder.description && (
                        <p className="text-sm text-white/80 mb-4 italic">{currentOrder.description}</p>
                      )}
                      <div className="space-y-2">
                        {(() => {
                          const charState = characterServiceStates[currentOrder.charName];
                          const remainingMins = charState
                            ? charState.剩余服务小时 * 60 + charState.剩余服务分钟
                            : 0;
                          const totalMins = currentOrder.durationMinutes || 1;
                          const pct = Math.min(100, Math.max(0, ((totalMins - remainingMins) / totalMins) * 100));
                          const remH = Math.floor(remainingMins / 60);
                          const remM = remainingMins % 60;
                          return (
                            <>
                              <div className="flex justify-between font-bold text-sm">
                                <span>任务进度 ({currentOrder.durationString})</span>
                                <span className="text-pop-yellow animate-pulse">
                                  {remH}h {remM}m 剩余 · {Math.floor(pct)}%
                                </span>
                              </div>
                              <div className="h-4 w-full bg-pop-black border-2 border-white clip-diagonal relative overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-pop-cyan transition-all duration-1000 ease-linear"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </PopCard>
                </motion.div>
              )}

              {/* ── 空闲时间（P5 风格）── */}
              {displayState === 'free' && (
                <motion.div
                  key="free"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto space-y-4"
                >
                  {/* 状态卡片 */}
                  <PopCard className="bg-pop-black text-white border-4 border-pop-cyan shadow-[8px_8px_0px_0px_#00e5ff] p-8 clip-diagonal overflow-hidden relative">
                    <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="inline-block bg-pop-cyan px-4 py-2 -skew-x-6 border-2 border-white mb-4">
                        <h3 className="text-2xl font-black italic text-pop-black">
                          {dailyOrder?.status === 'completed' ? 'WORK DONE / 今日已完成' : 'DAY OFF / 今日无工作'}
                        </h3>
                      </div>
                      <p className="font-bold text-lg text-white/80 mb-2">
                        {dailyOrder?.status === 'completed'
                          ? `服务对象 ${dailyOrder.charName} 的委托已完成。`
                          : dailyOrder?.status === 'declined'
                            ? `已拒绝 ${dailyOrder.charName} 的委托。`
                            : '今天没有派单。'}
                      </p>
                      <p className="text-sm text-pop-yellow font-bold flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        剩余时间是你的——去城市里走走，也许会遇到谁。
                      </p>
                    </div>
                  </PopCard>

                  {/* 自由探索入口 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 打开地图 */}
                    <PopCard
                      className="bg-pop-yellow text-pop-black border-4 border-pop-black shadow-[6px_6px_0px_0px_#ff3366] p-6 clip-diagonal cursor-pointer hover:scale-[1.03] active:translate-x-1 active:translate-y-1 transition-all duration-150"
                      onClick={() => setIsMapOpen(true)}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-14 h-14 bg-pop-black rounded-lg flex items-center justify-center border-2 border-pop-black">
                          <MapPin className="w-8 h-8 text-pop-yellow" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black italic">探索地图</h4>
                          <p className="text-xs font-bold opacity-70">查看角色位置，自由偶遇</p>
                        </div>
                      </div>
                    </PopCard>

                    {/* 手机提示 */}
                    <PopCard className="bg-pop-cyan text-pop-black border-4 border-pop-black shadow-[6px_6px_0px_0px_#ff3366] p-6 clip-diagonal">
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-14 h-14 bg-pop-black rounded-lg flex items-center justify-center border-2 border-pop-black">
                          <Coffee className="w-8 h-8 text-pop-cyan" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black italic">自由活动</h4>
                          <p className="text-xs font-bold opacity-70">在酒馆输入框自由行动</p>
                        </div>
                      </div>
                    </PopCard>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
