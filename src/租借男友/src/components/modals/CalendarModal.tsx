import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useGameContext } from "../../state/GameContext";
import { CALENDAR_EVENTS } from "../../data/gameData";

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function CalendarModal() {
  const { isCalendarOpen, setIsCalendarOpen, gameTime } = useGameContext();
  const [currentYear, setCurrentYear] = useState(gameTime.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(gameTime.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 日历打开时自动定位到游戏当前月份（仅打开时执行一次，不监听 gameTime 变化）
  useEffect(() => {
    if (isCalendarOpen) {
      setCurrentYear(gameTime.getFullYear());
      setCurrentMonthIndex(gameTime.getMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalendarOpen]);

  if (!isCalendarOpen) return null;

  const nextMonth = () => {
    setSelectedDay(null);
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    setSelectedDay(null);
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 is Sunday
  
  // Filter events for current month
  const monthEvents = CALENDAR_EVENTS.filter(e => e.month === currentMonthIndex + 1);

  // Group events by day for quick lookup
  const eventsByDay: Record<number, typeof monthEvents> = {};
  monthEvents.forEach(e => {
    if (!eventsByDay[e.day]) eventsByDay[e.day] = [];
    eventsByDay[e.day].push(e);
  });

  const displayedEvents = selectedDay ? monthEvents.filter(e => e.day === selectedDay) : monthEvents;

  return (
    <div className="fixed inset-0 z-100 flex items-start md:items-center justify-center pt-0 md:pt-0 p-0 md:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-pop-black/80 backdrop-blur-sm"
        onClick={() => setIsCalendarOpen(false)}
      />
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="relative w-full h-full md:w-auto md:max-w-lg bg-white pop-border shadow-[8px_8px_0_#00e5ff] z-10 flex flex-col overflow-hidden clip-diagonal md:max-h-[calc(100vh-6rem)]"
      >
        <div className="bg-pop-cyan text-pop-black p-4 flex justify-between items-center border-b-4 border-pop-black shrink-0">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 shrink-0" />
            <h3 className="text-2xl font-black italic">CALENDAR / 年历</h3>
          </div>
          <button 
            onClick={() => setIsCalendarOpen(false)}
            className="bg-pop-black text-white p-2 hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-[2px_2px_0_#ff3366]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 bg-stripes relative overflow-y-auto hide-scrollbar flex-1">
          <div className="bg-white border-4 border-pop-black p-4 shadow-pop clip-diagonal relative z-10">
            
            {/* Header / Nav */}
            <div className="flex justify-between items-center mb-6 bg-pop-black text-white p-2 clip-diagonal">
              <button onClick={prevMonth} className="p-1 hover:bg-pop-pink transition-colors clip-diagonal"><ChevronLeft /></button>
              <div className="text-center">
                <h4 className="text-2xl font-black font-mono text-pop-yellow">{currentYear} / {MONTHS[currentMonthIndex]}</h4>
                <p className="font-bold text-gray-400 text-xs">纪念日与行程安排</p>
              </div>
              <button onClick={nextMonth} className="p-1 hover:bg-pop-cyan transition-colors clip-diagonal text-pop-black bg-white"><ChevronRight /></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-bold text-sm mb-2 text-pop-cyan bg-pop-black py-1">
              <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-bold">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasEvents = eventsByDay[day] && eventsByDay[day].length > 0;
                const isToday = currentYear === gameTime.getFullYear() && currentMonthIndex === gameTime.getMonth() && day === gameTime.getDate();
                const isSelected = selectedDay === day;
                
                return (
                  <button 
                    key={day} 
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`aspect-square flex flex-col items-center justify-center border-2 border-transparent relative hover:bg-gray-200 transition-colors
                      ${isToday ? "bg-pop-yellow text-pop-black border-pop-black shadow-[2px_2px_0_#1a1a1a] -skew-x-6 z-10" : 
                        hasEvents ? "border-pop-pink text-pop-pink bg-pop-pink/10" : "bg-gray-100"}
                      ${isSelected ? "ring-2 ring-pop-cyan ring-offset-2 scale-110 z-20" : ""}
                    `}
                  >
                    <span>{day}</span>
                    {hasEvents && <div className="w-1.5 h-1.5 rounded-full bg-pop-pink mt-0.5"></div>}
                  </button>
                );
              })}
            </div>

            {/* Event List for the Month */}
            <div className="mt-6 border-t-4 border-pop-black pt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-black italic text-lg">{selectedDay ? `${currentMonthIndex + 1}月${selectedDay}日 事件` : "本月事件"}</h5>
                {selectedDay && (
                  <button onClick={() => setSelectedDay(null)} className="text-xs font-bold text-pop-cyan underline">查看全月</button>
                )}
              </div>
              
              {displayedEvents.length === 0 ? (
                <p className="text-gray-500 font-bold text-sm italic">{selectedDay ? "当天暂无特殊事件。" : "本月暂无特殊事件。"}</p>
              ) : (
                <div className="space-y-2">
                  {displayedEvents.map((evt, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-gray-50 p-2 border-l-4 border-pop-pink">
                      <span className="font-black font-mono text-pop-pink w-12 shrink-0">{evt.month}/{evt.day}</span>
                      <div>
                        <p className="font-bold text-sm">{evt.title}</p>
                        {evt.chars.length > 0 && (
                          <p className="text-xs text-gray-500 font-bold mt-1">相关: {evt.chars.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
