/**
 * 天气预报 App — 波普风格
 *
 * 参照 rent-a-boyfriend-pop-ui 的 WeatherApp：
 * - 黄色 AppHeader + 返回按钮
 * - 大号温度显示 + 天气图标
 * - 未来几天预报横向滚动卡片
 * - 点击任意天气卡片可弹出该天四个时段天气详情
 * 数据来源：getWeather() 确定性函数，按游戏时间计算
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun, Cloud, Cloudy, CloudRain, CloudDrizzle, CloudSnow, CloudFog, CloudLightning,
  Droplets, Umbrella, Wind, X,
} from 'lucide-react';
import { useGameContext } from '../../state/GameContext';
import { getWeather, getDailyPeriods, getTimePeriod, type WeatherType, type PeriodWeather, type TimePeriod } from '../../data/weather';
import { AppHeader } from './PhoneShared';

// ── 天气图标映射 ──
const WEATHER_ICONS: Record<WeatherType, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  '晴': Sun,
  '多云': Cloudy,
  '阴': Cloud,
  '小雨': CloudDrizzle,
  '大雨': CloudRain,
  '雪': CloudSnow,
  '雾': CloudFog,
  '雷暴': CloudLightning,
};

// 天气对应的近似温度区间（模拟）
const WEATHER_TEMP: Record<WeatherType, { base: number; range: number }> = {
  '晴': { base: 28, range: 4 },
  '多云': { base: 24, range: 3 },
  '阴': { base: 20, range: 3 },
  '小雨': { base: 18, range: 2 },
  '大雨': { base: 16, range: 2 },
  '雪': { base: -2, range: 3 },
  '雾': { base: 15, range: 2 },
  '雷暴': { base: 22, range: 3 },
};

function seededTemp(date: Date, weatherType: WeatherType): number {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const rand = Math.abs(Math.sin(hash) * 10000) % 1;
  const { base, range } = WEATHER_TEMP[weatherType];
  return Math.round(base + (rand - 0.5) * range * 2);
}

const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

/** 从 MVU 当前星期字符串中提取星期字符（如 "星期三" → "三"） */
function parseWeekdayChar(weekdayStr: string): string | null {
  const match = weekdayStr.match(/([日一二三四五六])/);
  return match ? match[1] : null;
}

/** 根据当前星期和偏移天数计算未来星期标签 */
function getFutureWeekdayLabel(currentWeekday: string, offset: number): string {
  const char = parseWeekdayChar(currentWeekday);
  if (!char) return '';
  const currentIdx = WEEKDAYS_SHORT.indexOf(char);
  if (currentIdx === -1) return '';
  const newIdx = ((currentIdx + offset) % 7 + 7) % 7;
  return `周${WEEKDAYS_SHORT[newIdx]}`;
}

// ── 四时段弹窗组件 ──

function PeriodModal({
  periods,
  currentPeriod,
  label,
  dateStr,
  onClose,
}: {
  periods: PeriodWeather[];
  currentPeriod: TimePeriod | null;
  label: string;
  dateStr: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        className="bg-pop-cyan border-4 border-pop-black p-4 shadow-[8px_8px_0px_0px_#1a1a1a] max-w-70 w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-pop-pink border-4 border-pop-black flex items-center justify-center shadow-[3px_3px_0px_0px_#1a1a1a] active:translate-x-px active:translate-y-px transition-transform"
        >
          <X size={16} className="text-white" strokeWidth={3} />
        </button>

        {/* 标题 */}
        <div className="bg-pop-yellow border-4 border-pop-black p-2 mb-3 text-center">
          <span className="font-black text-base text-pop-black">{label} · {dateStr}</span>
        </div>

        {/* 四时段网格 */}
        <div className="grid grid-cols-2 gap-2">
          {periods.map((p) => {
            const Icon = WEATHER_ICONS[p.type];
            const isCurrent = currentPeriod !== null && p.period === currentPeriod;
            return (
              <div
                key={p.period}
                className={`border-4 border-pop-black p-2 flex flex-col items-center shadow-[3px_3px_0px_0px_#1a1a1a] ${
                  isCurrent ? 'bg-pop-yellow' : 'bg-white'
                }`}
              >
                {isCurrent && (
                  <span className="text-[8px] font-black bg-pop-pink text-white px-1 mb-0.5 border border-pop-black">现在</span>
                )}
                <span className={`font-black text-xs mb-0.5 ${isCurrent ? 'text-pop-pink' : 'text-pop-black'}`}>{p.label}</span>
                <span className="text-[8px] font-bold text-pop-black/40 mb-1">{p.timeRange}</span>
                <Icon size={28} className={isCurrent ? 'text-pop-pink mb-1' : 'text-pop-black mb-1'} strokeWidth={2} />
                <span className={`font-black text-sm ${isCurrent ? 'text-pop-pink' : 'text-pop-black'}`}>{p.type}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PhoneWeather({ onExit }: { onExit: () => void }) {
  const { gameTime, currentLocation, currentWeekday } = useGameContext();

  // 当前弹窗选中的日期（null = 不显示弹窗）
  const [selectedDate, setSelectedDate] = useState<{ date: Date; label: string } | null>(null);

  const weatherData = useMemo(() => {
    const today = getWeather(gameTime);
    const todayTemp = seededTemp(gameTime, today.type);
    const todayPeriods = getDailyPeriods(gameTime);
    const currentPeriod = getTimePeriod(gameTime);

    // 未来预报：每天用上午（第一时段）天气作为卡片显示天气
    const forecast: { date: Date; weatherType: WeatherType; temp: number; label: string; periods: PeriodWeather[] }[] = [];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(gameTime);
      d.setDate(d.getDate() + i);
      const periods = getDailyPeriods(d);
      // 卡片显示的天气 = 上午时段天气（第一时段）
      const morningType = periods[0].type;
      forecast.push({
        date: d,
        weatherType: morningType,
        temp: seededTemp(d, morningType),
        label: i === 1 ? '明天' : i === 2 ? '后天' : (getFutureWeekdayLabel(currentWeekday, i) || `周${WEEKDAYS_SHORT[d.getDay()]}`),
        periods,
      });
    }

    // 根据天气模拟湿度/降水概率
    const humidity = today.type === '晴' ? 45 : today.type === '多云' ? 55 : today.type === '阴' ? 65 : today.type === '小雨' ? 80 : today.type === '大雨' ? 92 : today.type === '雪' ? 85 : today.type === '雾' ? 90 : 75;
    const rainChance = today.type === '晴' ? 5 : today.type === '多云' ? 15 : today.type === '阴' ? 30 : today.type === '小雨' ? 70 : today.type === '大雨' ? 90 : today.type === '雪' ? 60 : today.type === '雾' ? 20 : 85;

    return { today, todayTemp, forecast, humidity, rainChance, todayPeriods, currentPeriod };
  }, [gameTime, currentWeekday]);

  const TodayIcon = WEATHER_ICONS[weatherData.today.type];
  const dateStr = `${gameTime.getMonth() + 1}月${gameTime.getDate()}日`;
  const weekday = currentWeekday || `星期${WEEKDAYS_SHORT[gameTime.getDay()]}`;

  // 弹窗数据
  const modalPeriods = selectedDate ? getDailyPeriods(selectedDate.date) : [];
  const modalCurrentPeriod = selectedDate ? getTimePeriod(selectedDate.date) : null;
  const modalDateStr = selectedDate ? `${selectedDate.date.getMonth() + 1}月${selectedDate.date.getDate()}日` : '';
  const modalLabel = selectedDate?.label ?? '';

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-pop-cyan flex flex-col z-10"
    >
      <AppHeader title="天气预报" color="bg-pop-yellow" onBack={onExit} />

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-12 bg-halftone-white">
        {/* ── 今日天气主卡（可点击查看时段详情） ── */}
        <button
          className="w-full text-left bg-white border-4 border-pop-black p-5 shadow-[8px_8px_0px_0px_#1a1a1a] relative overflow-hidden flex flex-col items-center mt-2 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[6px_6px_0px_0px_#1a1a1a] transition-all"
          onClick={() => setSelectedDate({ date: gameTime, label: '今天' })}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-stripes-subtle opacity-10 pointer-events-none" />

          {/* 位置信息 */}
          <h2 className="font-black text-xl uppercase tracking-widest mb-1 relative z-10">{currentLocation || '当前位置'}</h2>
          <p className="font-bold text-xs text-pop-black/50 mb-1 relative z-10 border-2 border-pop-black px-2 py-0.5 transform -skew-x-6 bg-white">
            {dateStr} · {weekday}
          </p>

          {/* 天气图标 */}
          <div className="relative z-10 mb-2 transform hover:scale-110 transition-transform">
            <div className="absolute inset-0 bg-pop-yellow rounded-full blur-xl opacity-50" />
            <TodayIcon size={90} className="text-pop-pink relative z-10" strokeWidth={2} />
          </div>

          {/* 温度 */}
          <div className="flex items-start relative z-10">
            <span className="font-black text-6xl tracking-tighter transform -skew-x-6 text-pop-black">{weatherData.todayTemp}</span>
            <span className="font-black text-xl mt-2 text-pop-black">°C</span>
          </div>

          {/* 天气描述 */}
          <p className="font-black text-sm text-pop-black mt-1 relative z-10">{weatherData.today.type} · {weatherData.today.description}</p>

          {/* 详细参数 */}
          <div className="flex w-full justify-around border-t-4 border-pop-black pt-3 mt-4 border-dashed relative z-10">
            <div className="flex flex-col items-center">
              <Droplets size={18} className="text-pop-cyan mb-1" strokeWidth={2.5} />
              <span className="font-bold text-[10px] text-pop-black/50">湿度</span>
              <span className="font-black text-base text-pop-black">{weatherData.humidity}%</span>
            </div>
            <div className="flex flex-col items-center">
              <Umbrella size={18} className="text-pop-pink mb-1" strokeWidth={2.5} />
              <span className="font-bold text-[10px] text-pop-black/50">降水概率</span>
              <span className="font-black text-base text-pop-pink">{weatherData.rainChance}%</span>
            </div>
            <div className="flex flex-col items-center">
              <Wind size={18} className="text-pop-green mb-1" strokeWidth={2.5} />
              <span className="font-bold text-[10px] text-pop-black/50">出行指数</span>
              <span className="font-black text-base text-pop-green">
                {weatherData.today.outdoorMultiplier >= 0.9 ? '适宜' : weatherData.today.outdoorMultiplier >= 0.5 ? '一般' : '不宜'}
              </span>
            </div>
          </div>

          {/* 点击提示 */}
          <div className="flex items-center gap-1 mt-3 relative z-10">
            <span className="text-[10px] font-bold text-pop-black/40">点击查看今日时段</span>
          </div>
        </button>

        {/* ── 未来天气预报 ── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 bg-pop-pink border border-pop-black transform -skew-x-3" />
            <span className="font-black text-sm uppercase italic transform -skew-x-3 text-pop-black">未来预报</span>
            <span className="text-[10px] font-bold text-pop-black/40 ml-1">点击查看时段详情</span>
          </div>
          <div className="flex gap-3 overflow-x-auto py-2 overscroll-x-contain forecast-scroll" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
            <style>{`
              .forecast-scroll::-webkit-scrollbar { height: 4px; }
              .forecast-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 2px; }
              .forecast-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
              .forecast-scroll { scrollbar-width: thin; scrollbar-color: #1a1a1a rgba(0,0,0,0.05); }
            `}</style>
            {weatherData.forecast.map((f, i) => {
              const Icon = WEATHER_ICONS[f.weatherType];
              return (
                <button
                  key={i}
                  className="bg-white border-4 border-pop-black min-w-19.5 p-3 flex flex-col items-center shadow-[4px_4px_0px_0px_#1a1a1a] shrink-0 transform hover:-translate-y-2 active:translate-x-px active:translate-y-px active:shadow-[3px_3px_0px_0px_#1a1a1a] transition-all"
                  onClick={() => setSelectedDate({ date: f.date, label: f.label })}
                >
                  <span className="font-black text-xs mb-1 text-pop-black">{f.label}</span>
                  <span className="text-[10px] font-bold text-pop-black/50 mb-1.5">
                    {f.date.getMonth() + 1}/{f.date.getDate()}
                  </span>
                  <Icon size={28} className="text-pop-black mb-1.5" strokeWidth={2} />
                  <span className="font-black text-base text-pop-black">{f.temp}°</span>
                  <span className="text-[10px] font-bold text-pop-black/50 mt-0.5">{f.weatherType}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 天气小贴士 ── */}
        <div className="bg-pop-black text-white border-4 border-pop-black p-4 shadow-[6px_6px_0px_0px_#ff0055] relative overflow-hidden">
          <div className="absolute inset-0 bg-stripes-subtle opacity-5 pointer-events-none mix-blend-overlay" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Wind size={18} className="text-pop-yellow" strokeWidth={2.5} />
            <span className="font-black text-sm uppercase italic transform -skew-x-3 text-pop-yellow">天气贴士</span>
          </div>
          <p className="text-sm font-bold leading-relaxed relative z-10">
            {weatherData.today.outdoorMultiplier >= 0.9
              ? '天气晴好，适合户外约会！别忘了防晒~'
              : weatherData.today.outdoorMultiplier >= 0.5
                ? '天气尚可，出行注意安全。'
                : weatherData.today.type === '雷暴'
                  ? '雷暴天气，请避免外出！建议室内活动。'
                  : '天气不佳，建议携带雨具或改为室内约会。'}
          </p>
        </div>
      </div>

      {/* ── 四时段弹窗 ── */}
      <AnimatePresence>
        {selectedDate && (
          <PeriodModal
            periods={modalPeriods}
            currentPeriod={modalCurrentPeriod}
            label={modalLabel}
            dateStr={modalDateStr}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
