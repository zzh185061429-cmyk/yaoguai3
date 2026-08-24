import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Clock, CloudRain, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 古代时辰对应表（每个时辰对应2小时）
const SHICHEN_MAP: { range: [number, number]; name: string; period: string }[] = [
  { range: [23, 1], name: '子时', period: '夜半' },
  { range: [1, 3], name: '丑时', period: '鸡鸣' },
  { range: [3, 5], name: '寅时', period: '平旦' },
  { range: [5, 7], name: '卯时', period: '日出' },
  { range: [7, 9], name: '辰时', period: '食时' },
  { range: [9, 11], name: '巳时', period: '隅中' },
  { range: [11, 13], name: '午时', period: '日中' },
  { range: [13, 15], name: '未时', period: '日昳' },
  { range: [15, 17], name: '申时', period: '晡时' },
  { range: [17, 19], name: '酉时', period: '日入' },
  { range: [19, 21], name: '戌时', period: '黄昏' },
  { range: [21, 23], name: '亥时', period: '人定' },
];

function getShichen(hour: number): { name: string; period: string } {
  const h = hour === 23 ? 23 : hour;
  const found = SHICHEN_MAP.find(s => {
    if (s.range[0] > s.range[1]) {
      return h >= s.range[0] || h < s.range[1];
    }
    return h >= s.range[0] && h < s.range[1];
  });
  return found || { name: '子时', period: '夜半' };
}

// 获取月份天数
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 获取月份第一天是星期几（0=周日）
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// 古代月份名
const ANCIENT_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

// 星期古代称谓
const WEEKDAYS_ANCIENT = ['日', '一', '二', '三', '四', '五', '六'];

// ============================================================
// 游戏内时间 — 来自世界书设定的架空明朝"永明"年间
// 这些是游戏内的虚构时间，不是现实时间
// ============================================================
const GAME_TIME = {
  era: '永明',           // 年号（来自世界书: 世界设定.时代背景.年号）
  year: 3,               // 永明三年
  month: 8,              // 八月（0-indexed: 7）
  day: 15,               // 十五
  hour: 19,              // 戌时（19:00-21:00）
  minute: 0,
  weekday: 4,            // 星期四（0=日）
  weather: '秋雨',
};

// 将游戏内小时转为现代时间字符串（用于给玩家对照）
function hourToModernStr(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  // 游戏内当前时辰
  const shichen = getShichen(GAME_TIME.hour);
  const modernTimeStr = hourToModernStr(GAME_TIME.hour, GAME_TIME.minute);

  // 日历翻页状态 — 基于游戏内年月
  const [viewEraYear, setViewEraYear] = useState(GAME_TIME.year);
  const [viewMonth, setViewMonth] = useState(GAME_TIME.month);
  const isCurrentMonth = viewEraYear === GAME_TIME.year && viewMonth === GAME_TIME.month;

  // 用游戏内年月计算日历网格（以永明年号映射到真实年份做日历计算）
  // 永明元年对应 baseYear，这样日历星期布局是固定的
  const baseYear = 2000 + GAME_TIME.year; // 永明三年 => 2003
  const calcYear = baseYear + (viewEraYear - GAME_TIME.year);
  const calcMonth = viewMonth;

  const daysInMonth = useMemo(() => getDaysInMonth(calcYear, calcMonth), [calcYear, calcMonth]);
  const firstDayOffset = useMemo(() => getFirstDayOfMonth(calcYear, calcMonth), [calcYear, calcMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewEraYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewEraYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handlePrevYear = () => setViewEraYear(y => y - 1);
  const handleNextYear = () => setViewEraYear(y => y + 1);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOffset }, (_, i) => i);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="日 期 与 时 间" id="calendar-modal">
      <div className="flex flex-col gap-6 h-[600px]">
        {/* Top Info Banner — 游戏内时间 + 古代时辰 */}
        <div className="bg-gradient-to-r from-ink-900 via-cyan-900/20 to-ink-900 border border-cyan-900/50 rounded-xl p-6 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          
          {/* 左侧：游戏内日期 */}
          <div className="flex flex-col gap-2">
            <h3 className="font-serif text-3xl tracking-widest text-gold-400">
              {GAME_TIME.era}{viewEraYear}年 {viewMonth + 1}月 {GAME_TIME.day}日
            </h3>
            <p className="font-sans text-sm tracking-[0.2em] text-cyan-300">
              星期{WEEKDAYS_ANCIENT[GAME_TIME.weekday]}
            </p>
            <p className="font-serif text-sm tracking-widest text-paper-200/60">
              {ANCIENT_MONTHS[viewMonth]}
            </p>
          </div>
          
          {/* 右侧：时间信息 — 现代 + 古代 */}
          <div className="flex items-center gap-6 text-paper-200">
            {/* 天气 */}
            <div className="flex flex-col items-center gap-2">
              <CloudRain size={28} className="text-cyan-500" />
              <span className="font-serif text-sm tracking-widest">{GAME_TIME.weather}</span>
            </div>
            <div className="w-px h-12 bg-ink-700" />
            {/* 现代时间（对照用） */}
            <div className="flex flex-col items-center gap-2">
              <Clock size={28} className="text-cyan-400" />
              <span className="font-serif text-lg tracking-widest text-cyan-300">{modernTimeStr}</span>
              <span className="font-sans text-[10px] tracking-widest text-paper-200/50">现代</span>
            </div>
            <div className="w-px h-12 bg-ink-700" />
            {/* 古代时辰 */}
            <div className="flex flex-col items-center gap-2">
              <Moon size={28} className="text-gold-500" />
              <span className="font-serif text-lg tracking-widest text-gold-400">{shichen.name}</span>
              <span className="font-sans text-[10px] tracking-widest text-paper-200/50">{shichen.period}</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 bg-ink-900 border border-ink-700/50 rounded-xl p-6 flex flex-col">
          {/* 年月翻页 */}
          <div className="flex justify-between items-center mb-2">
            {/* 上一年 */}
            <button onClick={handlePrevYear} className="p-2 text-ink-500 hover:text-gold-400 transition-colors">
              <ChevronLeft size={16} />
              <ChevronLeft size={16} className="-ml-3" />
            </button>
            {/* 上个月 */}
            <button onClick={handlePrevMonth} className="p-2 text-ink-500 hover:text-gold-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
            {/* 年月标题 */}
            <div className="flex flex-col items-center">
              <h4 className="font-serif text-lg text-paper-200 tracking-widest">
                {GAME_TIME.era}{viewEraYear}年 {viewMonth + 1}月
              </h4>
              <span className="font-serif text-xs text-gold-500/60 tracking-widest mt-0.5">
                {ANCIENT_MONTHS[viewMonth]}
              </span>
            </div>
            {/* 下个月 */}
            <button onClick={handleNextMonth} className="p-2 text-ink-500 hover:text-gold-400 transition-colors">
              <ChevronRight size={20} />
            </button>
            {/* 下一年 */}
            <button onClick={handleNextYear} className="p-2 text-ink-500 hover:text-gold-400 transition-colors">
              <ChevronRight size={16} />
              <ChevronRight size={16} className="-ml-3" />
            </button>
          </div>
          
          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-2 mb-4 text-center font-serif text-ink-500 text-sm">
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
          </div>
          
          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {/* 空位偏移 */}
            {emptySlots.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {days.map(day => {
              const isToday = isCurrentMonth && day === GAME_TIME.day;
              return (
                <div 
                  key={day} 
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-colors cursor-pointer
                    ${isToday 
                      ? 'bg-gold-500/20 border-gold-500 text-gold-400 shadow-[0_0_15px_rgba(214,183,90,0.2)]' 
                      : 'bg-ink-800/30 border-ink-800 text-paper-200 hover:border-gold-500/50 hover:bg-ink-800'
                    }
                  `}
                >
                  <span className="font-sans text-lg">{day}</span>
                  <span className="font-serif text-[10px] opacity-70">
                    {isToday ? '今日' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
