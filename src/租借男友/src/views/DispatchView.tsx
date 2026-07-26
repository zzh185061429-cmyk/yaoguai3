import React, { useState } from "react";
import { PopCard } from "../components/ui/PopCard";
import { PopButton } from "../components/ui/PopButton";
import { Briefcase, Skull, Clock, Dices } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../components/ToastProvider";
import { useGameContext } from "../state/GameContext";
import { sfx } from "../audio/sfxPlayer";

const CHAR_DATA = {
  '温知晚': { avatar: 'https://i.postimg.cc/25BpPsRQ/1000213271.png', rate: 5000, color: 'border-pop-cyan', textColor: 'text-pop-cyan', weights: { '室内陪伴': 40, '外出约会': 30, '专项任务': 20, '活动出席': 10 } },
  '周念安': { avatar: 'https://i.postimg.cc/bN8z1wX5/1000213237.png', rate: 2000, color: 'border-white', textColor: 'text-white', weights: { '外出约会': 40, '室内陪伴': 30, '活动出席': 20, '专项任务': 10 } },
  '傅霁': { avatar: 'https://i.postimg.cc/zfRm9sZ7/1000213236.png', rate: 8000, color: 'border-pop-pink', textColor: 'text-pop-pink', weights: { '专项任务': 50, '室内陪伴': 30, '外出约会': 15, '活动出席': 5 } },
  '椎名律': { avatar: 'https://i.postimg.cc/0Np69H75/nai-4055558051.png', rate: 3000, color: 'border-pop-yellow', textColor: 'text-pop-yellow', weights: { '专项任务': 35, '外出约会': 35, '室内陪伴': 20, '活动出席': 10 } },
  '姜朝渔': { avatar: 'https://i.postimg.cc/k5trk03S/1000213361.png', rate: 500000, color: 'border-pop-cyan', textColor: 'text-pop-cyan', weights: { '室内陪伴': 40, '外出约会': 25, '活动出席': 25, '专项任务': 10 } },
  '裴今歌': { avatar: 'https://i.postimg.cc/yNSqwM4h/1000213352.png', rate: 500000, color: 'border-pop-pink', textColor: 'text-pop-pink', weights: { '外出约会': 40, '活动出席': 25, '室内陪伴': 25, '专项任务': 10 } },
  '罗兰': { avatar: 'https://i.postimg.cc/HnZVHWtB/1000213897.png', rate: 10000, color: 'border-white', textColor: 'text-white', weights: { '外出约会': 25, '室内陪伴': 25, '活动出席': 25, '专项任务': 25 } },
  '霍千黎': { avatar: 'https://i.postimg.cc/RhsN9CTD/1000213899.png', rate: 10000, color: 'border-pop-black', textColor: 'text-gray-900', weights: { '外出约会': 25, '室内陪伴': 25, '活动出席': 25, '专项任务': 25 } },
  '季明舒': { avatar: 'https://i.postimg.cc/kgpwtzwq/nai-3587295711.png', rate: 500000, color: 'border-white', textColor: 'text-white', weights: { '外出约会': 40, '活动出席': 30, '室内陪伴': 20, '专项任务': 10 } },
  '步玲燕': { avatar: 'https://i.postimg.cc/ht5M76MK/2729c1ef-df54-4b2e-85fe-d65322e28c65.png', rate: 200, color: 'border-pop-yellow', textColor: 'text-pop-yellow', weights: { '外出约会': 40, '专项任务': 30, '室内陪伴': 20, '活动出席': 10 } },
  '陆时予': { avatar: 'https://i.meee.com.tw/tPhxPog.png', rate: 10000, color: 'border-pop-cyan', textColor: 'text-pop-cyan', weights: { '室内陪伴': 50, '外出约会': 25, '活动出席': 15, '专项任务': 10 } },
  '许不倦': { avatar: 'https://i.postimg.cc/kgKMgWHv/20a3b651-666d-4dd2-a651-13fee3a9eaf0.png', rate: 3000, color: 'border-pop-cyan', textColor: 'text-pop-cyan', weights: { '室内陪伴': 40, '外出约会': 30, '专项任务': 20, '活动出席': 10 } }
};

type DispatchState = {
  mode: "single" | "crash" | "idle";
  char1: string | null;
  task1: string | null;
  char2: string | null;
  task2: string | null;
  duration1?: { label: string, hours: number, price: number };
  duration2?: { label: string, hours: number, price: number };
  scheduledTime1?: Date;
  scheduledTime2?: Date;
};

const DURATIONS = [
  { label: "1 小时", type: "short", hours: 1 },
  { label: "2 小时", type: "short", hours: 2 },
  { label: "4 小时", type: "short", hours: 4 },
  { label: "8 小时", type: "short", hours: 8 },
  { label: "包日", type: "day", hours: 24 },
  { label: "连续2天", type: "multi", hours: 48 },
  { label: "连续3天", type: "multi", hours: 72 },
  { label: "连续7天", type: "multi", hours: 168 },
];

/** 将 Date 转为 schema 规定的 MM月DD日 HH:mm 格式 */
function formatMvuTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export function DispatchView() {
  const { showToast } = useToast();
  const { currentOrder, acceptDispatch, gameTime, characterServiceStates, setPendingMessage } = useGameContext();
  
  const [dispatchResult, setDispatchResult] = useState<DispatchState>({
    mode: "idle",
    char1: null,
    task1: null,
    char2: null,
    task2: null
  });

  const rollDurationAndPrice = (charName: string) => {
    const rand = Math.random();
    let dur;
    if (rand < 0.6) dur = DURATIONS[Math.floor(Math.random() * 4)];
    else if (rand < 0.9) dur = DURATIONS[4];
    else dur = DURATIONS[5 + Math.floor(Math.random() * 3)];

    const dailyRate = CHAR_DATA[charName as keyof typeof CHAR_DATA].rate;
    let price = 0;
    if (dur.hours < 12) {
      price = Math.ceil(dailyRate * (dur.hours / 12));
    } else {
      price = dailyRate * (dur.hours / 24);
    }
    return { ...dur, price };
  };

  const handleRoll = () => {
    console.info('[DispatchView] handleRoll 被调用');
    sfx.play('diceRoll');
    const chars = Object.keys(CHAR_DATA);
    const shuffled = [...chars].sort(() => 0.5 - Math.random());
    const char1 = shuffled[0];
    const char2 = shuffled[1];

    const rollTask = (charName: string) => {
      const w = CHAR_DATA[charName as keyof typeof CHAR_DATA].weights;
      let total = Object.values(w).reduce((sum, val) => sum + val, 0);
      let rand = Math.random() * total;
      for (let task in w) {
        if (rand < w[task as keyof typeof w]) return task;
        rand -= w[task as keyof typeof w];
      }
      return '待定';
    };

    const task1 = rollTask(char1);
    const task2 = rollTask(char2);

    // 只有两人都是"外出约会"时才会撞单
    const isCrash = Math.random() < 0.3 && task1 === '外出约会' && task2 === '外出约会';

    const dur1 = rollDurationAndPrice(char1);
    const dur2 = isCrash ? rollDurationAndPrice(char2) : undefined;

    let scheduledTime1: Date | undefined;
    let scheduledTime2: Date | undefined;

    if (isCrash && dur2) {
      const overlap = generateOverlapTimes(dur1.hours, dur2.hours);
      scheduledTime1 = overlap.time1;
      scheduledTime2 = overlap.time2;
    } else {
      scheduledTime1 = generateScheduledTime();
    }

    setDispatchResult({ mode: isCrash ? "crash" : "single", char1, task1, char2: isCrash ? char2 : null, task2: isCrash ? task2 : null, duration1: dur1, duration2: dur2, scheduledTime1, scheduledTime2 });
    
    showToast(
      isCrash ? "💥 警报：检测到撞单时间冲突！" : "👤 收到新指名派单", 
      isCrash ? "alert" : "normal"
    );
  };

  const getCharData = (name: string | null) => name ? CHAR_DATA[name as keyof typeof CHAR_DATA] : null;

  // 生成预约时间：当前时间 + 1~6h，时段约束为 8:00~21:00，禁止半夜单
  const generateScheduledTime = () => {
    const offsetHours = 1 + Math.floor(Math.random() * 6);
    let scheduled = new Date(gameTime.getTime() + offsetHours * 60 * 60 * 1000);
    const hour = scheduled.getHours();
    if (hour < 8) {
      scheduled.setHours(8, 0, 0, 0);
    } else if (hour >= 22) {
      scheduled.setDate(scheduled.getDate() + 1);
      scheduled.setHours(8, 0, 0, 0);
    }
    if (scheduled <= gameTime) {
      scheduled.setDate(scheduled.getDate() + 1);
      scheduled.setHours(8, 0, 0, 0);
    }
    return scheduled;
  };

  // 生成撞单重叠时间：time2 在 time1 服务进行期间插入，保证时间有重合
  const generateOverlapTimes = (dur1Hours: number, dur2Hours: number) => {
    for (let i = 0; i < 10; i++) {
      const time1 = generateScheduledTime();
      const time1End = new Date(time1.getTime() + dur1Hours * 60 * 60 * 1000);
      const earliestTime2 = new Date(time1.getTime() + 30 * 60 * 1000);
      const latestTime2 = new Date(time1End.getTime() - 30 * 60 * 1000);

      if (latestTime2 <= earliestTime2) continue;

      const range = latestTime2.getTime() - earliestTime2.getTime();
      const time2 = new Date(earliestTime2.getTime() + Math.random() * range);
      const hour2 = time2.getHours();
      if (hour2 < 8 || hour2 >= 22) continue;

      return { time1, time2 };
    }
    // 兜底
    const time1 = generateScheduledTime();
    const time2 = new Date(time1.getTime() + 30 * 60 * 1000);
    return { time1, time2 };
  };

  const handleAcceptSingle = () => {
    if (dispatchResult.char1 && dispatchResult.task1 && dispatchResult.duration1 && dispatchResult.scheduledTime1) {
      const timeStr = formatMvuTime(dispatchResult.scheduledTime1);
      const price1Str = dispatchResult.duration1.price.toLocaleString();

      acceptDispatch({
        charName: dispatchResult.char1,
        task: dispatchResult.task1,
        durationString: dispatchResult.duration1.label,
        price: dispatchResult.duration1.price,
        scheduledTime: dispatchResult.scheduledTime1.getTime(),
        durationMinutes: dispatchResult.duration1.hours * 60,
      }, {
        模式: '单人',
        客户1: dispatchResult.char1,
        客户2: '无',
        任务类型1: dispatchResult.task1,
        任务类型2: '无',
        预约时间1: timeStr,
        服务时长1: dispatchResult.duration1.hours,
        价格1: dispatchResult.duration1.price,
        预约时间2: '',
        服务时长2: 0,
        价格2: 0,
      });

      const dialogText = [
        `📋${dispatchResult.char1}预约了${timeStr}的${dispatchResult.task1}任务，服务时长${dispatchResult.duration1.hours}小时，预期收入¥${price1Str}`,
      ].join('\\n');
      setPendingMessage(dialogText);
      sfx.play('dispatchAccept');
      showToast(`已接受 ${dispatchResult.char1} 的委托`);
      setDispatchResult({ mode: 'idle', char1: null, task1: null, char2: null, task2: null });
    }
  };

  const handleAcceptCrash = () => {
    if (dispatchResult.char1 && dispatchResult.char2 && dispatchResult.duration1 && dispatchResult.duration2 && dispatchResult.scheduledTime1 && dispatchResult.scheduledTime2) {
      const t1 = formatMvuTime(dispatchResult.scheduledTime1);
      const t2 = formatMvuTime(dispatchResult.scheduledTime2);
      const maxMinutes = Math.max(dispatchResult.duration1.hours, dispatchResult.duration2.hours) * 60;
      const earliestTime = Math.min(dispatchResult.scheduledTime1.getTime(), dispatchResult.scheduledTime2.getTime());

      acceptDispatch({
        charName: `${dispatchResult.char1} & ${dispatchResult.char2}`,
        task: "修罗场并行",
        durationString: `${dispatchResult.duration1.label} (同时)`,
        price: dispatchResult.duration1.price + dispatchResult.duration2.price,
        scheduledTime: earliestTime,
        durationMinutes: maxMinutes,
      }, {
        模式: '撞单',
        客户1: dispatchResult.char1,
        客户2: dispatchResult.char2,
        任务类型1: dispatchResult.task1,
        任务类型2: dispatchResult.task2,
        预约时间1: t1,
        服务时长1: dispatchResult.duration1.hours,
        价格1: dispatchResult.duration1.price,
        预约时间2: t2,
        服务时长2: dispatchResult.duration2.hours,
        价格2: dispatchResult.duration2.price,
      });
      const price1Str = dispatchResult.duration1.price.toLocaleString();
      const price2Str = dispatchResult.duration2.price.toLocaleString();
      const totalPriceStr = (dispatchResult.duration1.price + dispatchResult.duration2.price).toLocaleString();
      const dialogText = [
        `📋${dispatchResult.char1}预约了${t1}的${dispatchResult.task1}任务，同时${dispatchResult.char2}预约了${t2}的${dispatchResult.task2}任务，服务时长分别为${dispatchResult.duration1.hours}小时和${dispatchResult.duration2.hours}小时，预期总收入¥${totalPriceStr}`,
      ].join('\\n');
      setPendingMessage(dialogText);
      sfx.play('dispatchAccept');
      showToast(`已开启时间管理大师模式！`);
      setDispatchResult({ mode: 'idle', char1: null, task1: null, char2: null, task2: null });
    }
  };

  return (
    <div className="w-full h-full bg-halftone flex flex-col">
      
      {/* Scrollable top area */}
        <div className="flex-1 overflow-y-auto pt-28 md:pt-32 p-4 md:p-8">
        
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
          <div className="space-y-4 relative z-10">
            <AnimatePresence mode="wait">
            {currentOrder ? (
               <motion.div 
                 key="active-order" 
                 initial={{ opacity: 0, scale: 0.9 }} 
                 animate={{ opacity: 1, scale: 1 }} 
                 exit={{ opacity: 0, scale: 0.9 }}
               >
                 <PopCard className="bg-pop-pink text-white border-4 border-white shadow-[8px_8px_0_#00e5ff] p-8 clip-diagonal overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                     <Clock className="w-32 h-32 animate-spin-slow" />
                   </div>
                   <div className="relative z-10">
                     <div className="inline-block bg-pop-black px-4 py-2 -skew-x-6 border-2 border-white mb-4">
                       <h3 className="text-3xl font-black italic text-white">ACTIVE DISPATCH / 任务进行中</h3>
                     </div>
                     <p className="font-bold text-xl mb-6 bg-white text-pop-black inline-block px-3 py-1 -skew-x-6">当前服务对象: <span className="text-pop-pink">{currentOrder.charName}</span></p>
                     
                     <div className="space-y-2">
                       {(() => {
                         // 撞单：两条独立进度条
                         if (currentOrder.crashChars && currentOrder.crashChars.length === 2) {
                           return (
                             <>
                               {currentOrder.crashChars.map((char) => {
                                 const charState = characterServiceStates[char.name];
                                 const remainingMins = charState
                                   ? charState.剩余服务小时 * 60 + charState.剩余服务分钟
                                   : char.totalMinutes;
                                 const totalMins = char.totalMinutes || 1;
                                 const pct = Math.min(100, Math.max(0, ((totalMins - remainingMins) / totalMins) * 100));
                                 const remH = Math.floor(remainingMins / 60);
                                 const remM = remainingMins % 60;
                                 return (
                                   <div key={char.name}>
                                     <div className="flex justify-between font-bold text-sm">
                                       <span>{char.name} · {currentOrder.task}</span>
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
                                   </div>
                                 );
                               })}
                             </>
                           );
                         }
                         // 单人：原有逻辑
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
                               <span>任务进度 ({currentOrder.task} · {currentOrder.durationString})</span>
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
            ) : dispatchResult.mode === "idle" ? (
               <motion.div 
                 key="idle" 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
               >
                 <PopCard className="bg-pop-black text-white border-4 border-white shadow-pop p-12 text-center clip-diagonal">
                   <h3 className="text-2xl font-black italic text-gray-400">NO DISPATCH YET / 暂无派单</h3>
                   <p className="font-bold mt-2 text-gray-400">点击底部的 ROLL DISPATCH 开始抽取今日委托</p>
                 </PopCard>
               </motion.div>
            ) : dispatchResult.mode === "single" && dispatchResult.char1 ? (
              <motion.div 
                key="single" 
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring" }}
              >
                <PopCard variant="cyan" className="flex flex-col md:flex-row items-stretch md:items-center gap-6 p-6 md:p-8 clip-diagonal border-4">
                  <div className="bg-pop-black text-white clip-diagonal w-32 h-32 md:w-40 md:h-40 flex items-center justify-center shrink-0 shadow-pop-pink border-4 border-pop-pink overflow-hidden">
                    <img src={getCharData(dispatchResult.char1)?.avatar} alt={dispatchResult.char1} className="w-full h-full object-cover object-top scale-110" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-pop-pink text-white px-3 py-1 font-black text-sm pop-border -skew-x-6 shadow-[2px_2px_0_#1a1a1a]">单人指名</span>
                      <h3 className="text-4xl font-black italic drop-shadow-sm">{dispatchResult.char1}</h3>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-lg mt-4">
                      <Briefcase className="w-5 h-5" />
                      <span>任务类型: {dispatchResult.task1}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-gray-700 mt-2">
                      <Clock className="w-5 h-5 text-pop-cyan" />
                      <span>时长: {dispatchResult.duration1?.label}</span>
                    </div>
                    {dispatchResult.scheduledTime1 && (
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                      <Clock className="w-5 h-5 text-pop-yellow" />
                      <span>预约时间: {dispatchResult.scheduledTime1.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    )}
                  </div>
                  <div className="md:text-right bg-white p-4 pop-border shadow-pop-pink self-center">
                    <span className="block text-sm font-bold text-gray-500 mb-1">预期总收入</span>
                    <span className="text-3xl md:text-4xl font-black font-mono text-pop-pink">
                      ¥{dispatchResult.duration1?.price?.toLocaleString() || 0}
                    </span>
                    <PopButton onClick={handleAcceptSingle} size="sm" className="w-full mt-4 bg-pop-black text-white hover:bg-pop-pink">开始服务</PopButton>
                  </div>
                </PopCard>
              </motion.div>
            ) : dispatchResult.mode === "crash" && dispatchResult.char1 && dispatchResult.char2 ? (
              <motion.div 
                key="crash" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <PopCard className="bg-stripes text-white border-4 border-pop-yellow shadow-[8px_8px_0_#ffcc00] p-6 md:p-8 relative overflow-hidden clip-diagonal">
                  <div className="absolute -top-10 -right-10 text-pop-pink opacity-80 mix-blend-screen pointer-events-none"><Skull className="w-64 h-64" /></div>
                  <div className="relative z-10">
                    <div className="inline-block bg-pop-yellow text-pop-black px-6 py-2 font-black text-2xl mb-6 -skew-x-12 uppercase animate-pulse border-4 border-pop-black shadow-pop-pink">
                      💥 撞单修罗场警报 (CRASH DETECTED)
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* Conflict 1 */}
                      <div className={`bg-pop-black border-4 ${getCharData(dispatchResult.char1)?.color} shadow-pop-lg p-5 clip-diagonal relative flex flex-col xl:flex-row items-stretch xl:items-center gap-4`}>
                        <div className={`absolute top-0 right-0 bg-white text-pop-black font-black px-3 py-1 text-sm border-l-4 border-b-4 ${getCharData(dispatchResult.char1)?.color} z-10`}>客户 A</div>
                        <div className={`w-24 h-24 xl:w-28 xl:h-28 shrink-0 border-4 ${getCharData(dispatchResult.char1)?.color} clip-diagonal overflow-hidden mt-4 xl:mt-0`}>
                           <img src={getCharData(dispatchResult.char1)?.avatar} alt={dispatchResult.char1} className="w-full h-full object-cover object-top scale-110" />
                        </div>
                        <div className="flex-1 space-y-2 relative z-10">
                          <h3 className={`text-3xl font-black italic ${getCharData(dispatchResult.char1)?.textColor}`}>{dispatchResult.char1}</h3>
                          <div className="space-y-1 font-bold text-sm">
                             <p className="flex items-center gap-2 text-white"><Briefcase className="w-4 h-4 shrink-0"/> 任务类型: {dispatchResult.task1}</p>
                             <p className="flex items-center gap-2 text-white"><Clock className="w-4 h-4 shrink-0"/> 时长: {dispatchResult.duration1?.label}</p>
                             {dispatchResult.scheduledTime1 && (
                             <p className="flex items-center gap-2 text-white"><Clock className="w-4 h-4 shrink-0 text-pop-yellow"/> 预约时间: {dispatchResult.scheduledTime1.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                             )}
                             <p className="text-pop-yellow mt-2 text-base">预计收入: ¥{dispatchResult.duration1?.price?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Conflict 2 */}
                      <div className={`bg-pop-black border-4 ${getCharData(dispatchResult.char2)?.color} shadow-pop-lg p-5 clip-diagonal relative flex flex-col xl:flex-row items-stretch xl:items-center gap-4`}>
                        <div className={`absolute top-0 right-0 bg-white text-pop-black font-black px-3 py-1 text-sm border-l-4 border-b-4 ${getCharData(dispatchResult.char2)?.color} z-10`}>客户 B</div>
                        <div className={`w-24 h-24 xl:w-28 xl:h-28 shrink-0 border-4 ${getCharData(dispatchResult.char2)?.color} clip-diagonal overflow-hidden mt-4 xl:mt-0`}>
                           <img src={getCharData(dispatchResult.char2)?.avatar} alt={dispatchResult.char2} className="w-full h-full object-cover object-top scale-110" />
                        </div>
                        <div className="flex-1 space-y-2 relative z-10">
                          <h3 className={`text-3xl font-black italic ${getCharData(dispatchResult.char2)?.textColor}`}>{dispatchResult.char2}</h3>
                          <div className="space-y-1 font-bold text-sm">
                             <p className="flex items-center gap-2 text-white"><Briefcase className="w-4 h-4 shrink-0"/> 任务类型: {dispatchResult.task2}</p>
                             <p className="flex items-center gap-2 text-white"><Clock className="w-4 h-4 shrink-0"/> 时长: {dispatchResult.duration2?.label}</p>
                             {dispatchResult.scheduledTime2 && (
                             <p className="flex items-center gap-2 text-white"><Clock className="w-4 h-4 shrink-0 text-pop-yellow"/> 预约时间: {dispatchResult.scheduledTime2.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                             )}
                             <p className="text-pop-yellow mt-2 text-base">预计收入: ¥{dispatchResult.duration2?.price?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                    <div className="mt-6 flex flex-col items-center">
                      <p className="text-xl font-bold mb-4 font-mono">总预期收入: ¥{((dispatchResult.duration1?.price || 0) + (dispatchResult.duration2?.price || 0)).toLocaleString()}</p>
                      <PopButton onClick={handleAcceptCrash} variant="danger" size="lg" className="shadow-pop hover:scale-105 active:scale-95 bg-white text-pop-black border-white hover:bg-pop-pink hover:text-white hover:border-pop-black">
                        强行时间管理 (极度危险)
                      </PopButton>
                    </div>
                  </div>
                </PopCard>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

      </div>
    </div>

    {/* White footer with ROLL DISPATCH button */}
    <div className="shrink-0 bg-white border-t-4 border-pop-black p-4 flex justify-center">
      <PopButton 
        onClick={handleRoll} 
        disabled={!!currentOrder}
        variant={currentOrder ? "ghost" : "cyan"} 
        size="lg" 
        className={`shadow-[8px_8px_0_#ff3366] flex items-center gap-2 border-4 border-pop-black clip-diagonal transition-all ${
          currentOrder ? 'opacity-50 cursor-not-allowed bg-gray-400 border-gray-600 shadow-none' : 'hover:scale-110 active:scale-95 animate-pulse'
        }`}
      >
        <Dices className="w-8 h-8" />
        <span className="text-2xl font-black italic">ROLL DISPATCH</span>
      </PopButton>
    </div>

  </div>
  );
}

