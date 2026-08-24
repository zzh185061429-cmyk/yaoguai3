/**
 * 年历 App — 波普风格
 *
 * 基于已有的 CalendarModal，适配手机小屏幕。
 * 使用 CALENDAR_EVENTS 数据（生日/纪念日/节日）。
 * - 粉色 AppHeader + 返回按钮
 * - 月历网格：今日高亮、有事件日期标红点
 * - 点击日期查看当天事件 / 查看本月全部事件
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Cake, Heart, Sparkles } from 'lucide-react';
import { useGameContext } from '../../state/GameContext';
import { CALENDAR_EVENTS } from '../../data/gameData';
import { AppHeader } from './PhoneShared';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// 事件类型 → 图标 + 颜色
const EVENT_TYPE_META: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; label: string }> = {
  birthday: { icon: Cake, color: 'text-pop-pink', label: '生日' },
  holiday: { icon: Sparkles, color: 'text-pop-yellow', label: '节日' },
  memory: { icon: Heart, color: 'text-pop-cyan', label: '纪念日' },
};

export function PhoneCalendar({ onExit }: { onExit: () => void }) {
  const { gameTime } = useGameContext();
  const [currentYear, setCurrentYear] = useState(gameTime.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(gameTime.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const nextMonth = () => {
    setSelectedDay(null);
    if (currentMonthIndex === 11) { setCurrentMonthIndex(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonthIndex((m) => m + 1);
  };
  const prevMonth = () => {
    setSelectedDay(null);
    if (currentMonthIndex === 0) { setCurrentMonthIndex(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonthIndex((m) => m - 1);
  };

  // 当月天数 + 起始星期
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();

  // 当月事件
  const monthEvents = useMemo(
    () => CALENDAR_EVENTS.filter((e) => e.month === currentMonthIndex + 1),
    [currentMonthIndex],
  );

  // 按日期分组
  const eventsByDay = useMemo(() => {
    const map: Record<number, typeof monthEvents> = {};
    monthEvents.forEach((e) => {
      if (!map[e.day]) map[e.day] = [];
      map[e.day].push(e);
    });
    return map;
  }, [monthEvents]);

  const displayedEvents = selectedDay
    ? monthEvents.filter((e) => e.day === selectedDay)
    : monthEvents;

  // 日期网格
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [startDayOfWeek, daysInMonth]);

  const isViewingCurrentMonth = currentYear === gameTime.getFullYear() && currentMonthIndex === gameTime.getMonth();
  const todayDay = gameTime.getDate();
  const dateStr = `${gameTime.getMonth() + 1}月${gameTime.getDate()}日`;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-pop-yellow flex flex-col z-10"
    >
      <AppHeader title="年历" color="bg-pop-pink" textColor="text-white" onBack={onExit} />

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-12 bg-halftone-white">
        {/* ── 月历卡片 ── */}
        <div className="bg-white border-4 border-pop-black shadow-[6px_6px_0px_0px_#1a1a1a] overflow-hidden">
          {/* 标题栏 — 月份切换 */}
          <div className="bg-pop-black text-white p-3 flex justify-between items-center">
            <button
              onClick={prevMonth}
              className="w-8 h-8 bg-white/10 hover:bg-pop-pink border border-white/20 flex items-center justify-center rounded transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h4 className="font-black text-xl font-mono text-pop-yellow transform -skew-x-3">
                {currentYear} / {MONTHS[currentMonthIndex]}
              </h4>
              <p className="font-bold text-white/40 text-[10px]">纪念日与行程安排</p>
            </div>
            <button
              onClick={nextMonth}
              className="w-8 h-8 bg-white/10 hover:bg-pop-cyan border border-white/20 flex items-center justify-center rounded transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-0.5 text-center bg-pop-black/5 py-1.5 border-b-2 border-pop-black/10">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="font-black text-[10px] text-pop-pink">{d}</div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="p-2">
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                const hasEvents = eventsByDay[day] && eventsByDay[day].length > 0;
                const isToday = isViewingCurrentMonth && day === todayDay;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`aspect-square flex flex-col items-center justify-center border-2 relative transition-all
                      ${isToday
                        ? 'border-pop-black bg-pop-green text-pop-black font-black scale-110 -skew-x-3 shadow-[2px_2px_0px_0px_#1a1a1a] z-10'
                        : hasEvents
                          ? 'border-pop-pink text-pop-pink bg-pop-pink/10 hover:bg-pop-pink/20'
                          : 'border-transparent text-pop-black/70 hover:bg-pop-black/5'}
                      ${isSelected ? 'ring-2 ring-pop-cyan ring-offset-1 scale-110 z-20' : ''}
                    `}
                  >
                    <span className="font-black text-xs">{day}</span>
                    {hasEvents && (
                      <div className="w-1.5 h-1.5 rounded-full bg-pop-pink mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 事件列表 ── */}
        <div className="bg-white border-4 border-pop-black shadow-[4px_4px_0px_0px_#1a1a1a] overflow-hidden">
          {/* 事件标题栏 */}
          <div className="bg-pop-pink text-white px-3 py-2 flex items-center justify-between border-b-2 border-pop-black">
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={14} strokeWidth={2.5} />
              <span className="font-black text-sm italic transform -skew-x-3">
                {selectedDay ? `${currentMonthIndex + 1}月${selectedDay}日 事件` : '本月事件'}
              </span>
            </div>
            {selectedDay && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-[10px] font-black text-white/70 underline hover:text-white"
              >
                查看全月
              </button>
            )}
          </div>

          {/* 事件内容 */}
          <div className="p-2 min-h-[80px]">
            {displayedEvents.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-pop-black/30 text-xs font-black italic transform -skew-x-3">
                {selectedDay ? '当天暂无特殊事件' : '本月暂无特殊事件'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayedEvents.map((evt, idx) => {
                  const meta = EVENT_TYPE_META[evt.type] || EVENT_TYPE_META.memory;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={idx}
                      className="flex gap-2 items-start bg-pop-black/5 p-2 border-l-4 border-pop-pink"
                    >
                      <span className="font-black font-mono text-pop-pink text-xs w-10 shrink-0">
                        {evt.month}/{evt.day}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Icon size={12} className={meta.color} />
                          <p className="font-black text-sm text-pop-black truncate">{evt.title}</p>
                        </div>
                        {evt.chars.length > 0 && (
                          <p className="text-[10px] text-pop-black/50 font-bold mt-0.5">
                            相关: {evt.chars.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 今日信息卡 ── */}
        <div className="bg-pop-black text-white border-4 border-pop-black p-3 shadow-[6px_6px_0px_0px_#ff0055] relative overflow-hidden">
          <div className="absolute inset-0 bg-stripes-subtle opacity-5 pointer-events-none mix-blend-overlay" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="text-[10px] font-black uppercase text-white/40">今日</div>
              <div className="font-black text-lg text-pop-yellow italic transform -skew-x-3">{dateStr}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-white/40">本月事件</div>
              <div className="font-black text-lg text-pop-pink">{monthEvents.length}</div>
            </div>
          </div>
          {/* 今日是否有事件 */}
          {(() => {
            const todayEvents = isViewingCurrentMonth ? (eventsByDay[todayDay] || []) : [];
            if (todayEvents.length === 0) return null;
            return (
              <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                <div className="text-[10px] font-black text-pop-cyan mb-1">今日事件</div>
                {todayEvents.map((evt, i) => (
                  <div key={i} className="text-xs font-bold text-white/80">
                    · {evt.title}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}
