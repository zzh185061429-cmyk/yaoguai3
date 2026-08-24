/**
 * 手机主界面 — 波普风格
 *
 * 参照 rent-a-boyfriend-pop-ui 参考设计：
 * - 深色手机壳：bg-[#222] + border-[14px] border-pop-black + ring-inset
 * - 黑色状态栏：恋爱OS 品牌 + 时间 + 电量
 * - 深色桌面：halftone 背景 + 装饰文字 + 大图标（border-4 + shadow-pop）
 * - Home 指示条：底部黑色横条，点击返回桌面
 * - 各 App 自带 AppHeader（不再由 PhoneApp 统一渲染顶部导航）
 */

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MessageCircle,
  Globe,
  Settings as SettingsIcon,
  Zap,
  BatteryCharging,
  Sun,
  Cloud,
  Cloudy,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudSun,
  Calendar as CalendarIcon,
  MapPin,
  BookUser,
  Image,
  Map,
  Dices,
  Music,
  Trophy,
} from 'lucide-react';
import { usePhoneContext } from '../../state/PhoneContext';
import { useGameContext } from '../../state/GameContext';
import { getWeather, getDailyWeather, type WeatherType } from '../../data/weather';
import { cn } from '../../utils';
import { PhoneGuide } from './PhoneGuide';

// 懒加载子页面
const PhoneWeChat = lazy(() => import('./PhoneWeChat').then((m) => ({ default: m.PhoneWeChat })));
const PhoneForum = lazy(() => import('./PhoneForum').then((m) => ({ default: m.PhoneForum })));
const PhoneSettings = lazy(() => import('./PhoneSettings').then((m) => ({ default: m.PhoneSettings })));
const PhoneWeather = lazy(() => import('./PhoneWeather').then((m) => ({ default: m.PhoneWeather })));
const PhoneCalendar = lazy(() => import('./PhoneCalendar').then((m) => ({ default: m.PhoneCalendar })));
const PhoneArchive = lazy(() => import('./PhoneArchive').then((m) => ({ default: m.PhoneArchive })));
const PhoneGallery = lazy(() => import('./PhoneGallery').then((m) => ({ default: m.PhoneGallery })));
const PhoneLocation = lazy(() => import('./PhoneLocation').then((m) => ({ default: m.PhoneLocation })));
const PhoneDispatch = lazy(() => import('./PhoneDispatch').then((m) => ({ default: m.PhoneDispatch })));
const PhoneMusic = lazy(() => import('./PhoneMusic').then((m) => ({ default: m.PhoneMusic })));
const PhoneAchievements = lazy(() => import('./PhoneAchievements').then((m) => ({ default: m.PhoneAchievements })));

type AppView = 'desktop' | 'wechat' | 'forum' | 'settings' | 'weather' | 'calendar' | 'archive' | 'gallery' | 'location' | 'dispatch' | 'music' | 'achievements';

// 天气图标映射
function WeatherIcon({ type, className }: { type: WeatherType; className?: string }) {
  const icons: Record<WeatherType, React.ReactNode> = {
    '晴': <Sun className={className} />,
    '多云': <Cloudy className={className} />,
    '阴': <Cloud className={className} />,
    '小雨': <CloudDrizzle className={className} />,
    '大雨': <CloudRain className={className} />,
    '雪': <CloudSnow className={className} />,
    '雾': <CloudFog className={className} />,
    '雷暴': <CloudLightning className={className} />,
  };
  return <>{icons[type]}</>;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function PhoneApp() {
  const { isPhoneOpen, closePhone, config, unreadCount, groupUnreadCount, dispatchBadge } = usePhoneContext();
  const { gameTime, currentWeekday, isMapOpen, setIsMapOpen } = useGameContext();
  const [activeApp, setActiveApp] = useState<AppView>('desktop');

  const weatherInfo = useMemo(() => {
    const today = getWeather(gameTime);
    const tomorrow = new Date(gameTime); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(gameTime); dayAfter.setDate(dayAfter.getDate() + 2);
    return { today, tomorrow: getDailyWeather(tomorrow), dayAfter: getDailyWeather(dayAfter) };
  }, [gameTime]);

  const handleClose = () => { setActiveApp('desktop'); closePhone(); };
  const totalUnread = unreadCount + groupUnreadCount;

  return (
    <AnimatePresence>
      {isPhoneOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-95 h-full max-h-200 bg-[#222] rounded-[3rem] border-14 border-pop-black shadow-2xl overflow-hidden flex flex-col ring-4 ring-[#333] ring-inset"
          >
            {/* 听筒 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-pop-black rounded-b-2xl z-50" />

            {/* 状态栏 — 黑底白字，波普风格 */}
            <div className="bg-black text-white px-4 py-1.5 flex justify-between items-center z-40 relative shrink-0">
              <div className="flex items-center gap-1">
                <Zap size={14} className="text-pop-cyan fill-current" />
                <span className="font-bold text-[10px] tracking-widest uppercase">恋爱OS</span>
              </div>
              <div className="font-black text-xs tracking-tighter">
                {gameTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 text-pop-yellow">
                <span className="font-bold text-[10px]">98%</span>
                <BatteryCharging size={14} />
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 relative overflow-hidden bg-pop-black">
              <AnimatePresence mode="wait">
                {activeApp === 'desktop' && (
                  <motion.div
                    key="desktop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col z-0 pt-4 px-4"
                  >
                    {/* 半调背景 */}
                    <div className="absolute inset-0 bg-halftone-white opacity-30 pointer-events-none" />
                    {/* 装饰文字 */}
                    <div className="absolute top-8 -left-6 text-[70px] font-black text-pop-pink opacity-20 rotate-[-15deg] pointer-events-none tracking-tighter mix-blend-overlay">RENT</div>
                    <div className="absolute top-28 right-0 text-[50px] font-black text-pop-cyan opacity-20 rotate-10 pointer-events-none tracking-tighter mix-blend-overlay">BOY</div>

                    {/* 引导 */}
                    {!config.guideShown && <PhoneGuide onComplete={() => setActiveApp('settings')} />}

                    {/* 天气日期卡片 — 紧凑 widget */}
                    <div className="relative z-10 mt-2">
                      <WeatherCard date={gameTime} weatherInfo={weatherInfo} currentWeekday={currentWeekday} />
                    </div>

                    {/* App 图标网格 — 4 列，贴合参考设计 */}
                    <div className="grid grid-cols-4 gap-3 mt-5 relative z-10 justify-items-center">
                      <AppIcon icon={<MessageCircle className="w-7 h-7" strokeWidth={2.5} />} label="微信" badge={totalUnread} color="bg-pop-pink" iconColor="text-white" onClick={() => setActiveApp('wechat')} />
                      <AppIcon icon={<Globe className="w-7 h-7" strokeWidth={2.5} />} label="论坛" badge={0} color="bg-pop-cyan" iconColor="text-pop-black" onClick={() => setActiveApp('forum')} />
                      <AppIcon icon={<MapPin className="w-7 h-7" strokeWidth={2.5} />} label="地图" badge={0} color="bg-pop-black" iconColor="text-white" onClick={() => setIsMapOpen(true)} />
                      <AppIcon icon={<CloudSun className="w-7 h-7" strokeWidth={2.5} />} label="天气" badge={0} color="bg-pop-yellow" iconColor="text-pop-black" onClick={() => setActiveApp('weather')} />
                      <AppIcon icon={<CalendarIcon className="w-7 h-7" strokeWidth={2.5} />} label="日历" badge={0} color="bg-white" iconColor="text-pop-black" onClick={() => setActiveApp('calendar')} />
                      <AppIcon icon={<BookUser className="w-7 h-7" strokeWidth={2.5} />} label="图鉴" badge={0} color="bg-pop-yellow" iconColor="text-pop-black" onClick={() => setActiveApp('archive')} />
                      <AppIcon icon={<Image className="w-7 h-7" strokeWidth={2.5} />} label="画廊" badge={0} color="bg-pop-cyan" iconColor="text-pop-black" onClick={() => setActiveApp('gallery')} />
                      <AppIcon icon={<Map className="w-7 h-7" strokeWidth={2.5} />} label="地点" badge={0} color="bg-pop-pink" iconColor="text-white" onClick={() => setActiveApp('location')} />
                      <AppIcon icon={<Dices className="w-7 h-7" strokeWidth={2.5} />} label="租借" badge={dispatchBadge} color="bg-pop-cyan" iconColor="text-pop-black" onClick={() => setActiveApp('dispatch')} />
                      <AppIcon icon={<Music className="w-7 h-7" strokeWidth={2.5} />} label="音乐" badge={0} color="bg-pop-pink" iconColor="text-white" onClick={() => setActiveApp('music')} />
                      <AppIcon icon={<Trophy className="w-7 h-7" strokeWidth={2.5} />} label="成就" badge={0} color="bg-pop-yellow" iconColor="text-pop-black" onClick={() => setActiveApp('achievements')} />
                      <AppIcon icon={<SettingsIcon className="w-7 h-7" strokeWidth={2.5} />} label="设置" badge={0} color="bg-pop-green" iconColor="text-pop-black" onClick={() => setActiveApp('settings')} />
                    </div>

                    {/* 副API状态指示 */}
                    <div className="mt-auto mb-4 relative z-10 flex justify-center">
                      <div className={cn(
                        'px-3 py-1.5 text-[10px] font-black border-2 border-pop-black transform -skew-x-3 shadow-pop',
                        config.subApi.apiurl && config.subApi.model ? 'bg-pop-green text-pop-black' : 'bg-white text-pop-pink',
                      )}>
                        {config.subApi.apiurl && config.subApi.model ? '副API 已连接' : '副API 未配置'}
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeApp !== 'desktop' && (
                  <motion.div
                    key={activeApp}
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0"
                  >
                    <Suspense fallback={<div className="h-full flex items-center justify-center bg-pop-black"><div className="text-white/30 text-sm font-black italic transform -skew-x-6">加载中...</div></div>}>
                      {activeApp === 'wechat' && <PhoneWeChat onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'forum' && <PhoneForum onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'settings' && <PhoneSettings onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'weather' && <PhoneWeather onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'calendar' && <PhoneCalendar onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'archive' && <PhoneArchive onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'gallery' && <PhoneGallery onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'location' && <PhoneLocation onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'dispatch' && <PhoneDispatch onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'music' && <PhoneMusic onExit={() => setActiveApp('desktop')} />}
                      {activeApp === 'achievements' && <PhoneAchievements onExit={() => setActiveApp('desktop')} />}
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Home 指示条 */}
            <div className="bg-black shrink-0 flex justify-center py-1.5 relative z-50">
              <button
                onClick={() => activeApp !== 'desktop' ? setActiveApp('desktop') : handleClose()}
                className="w-1/3 h-1.5 bg-white/30 rounded-full hover:bg-pop-pink transition-colors border border-white/10"
              />
            </div>

            {/* 桌面关闭按钮 */}
            {activeApp === 'desktop' && (
              <button
                onClick={handleClose}
                className="absolute top-1.5 right-3 z-50 w-7 h-7 bg-pop-pink text-white rounded-full border-2 border-pop-black flex items-center justify-center shadow-pop hover:scale-110 active:scale-95 transition-transform"
                title="收起手机"
              >
                <X className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            )}

            {/* 全局条纹覆盖效果 */}
            <div className="absolute inset-0 pointer-events-none bg-stripes-subtle opacity-[0.03] mix-blend-overlay z-60" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 天气日期卡片 — 波普风格 ──
function WeatherCard({ date, weatherInfo, currentWeekday }: {
  date: Date;
  weatherInfo: {
    today: { type: WeatherType; description: string };
    tomorrow: { type: WeatherType; description: string };
    dayAfter: { type: WeatherType; description: string };
  };
  currentWeekday: string;
}) {
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
  const weekday = currentWeekday || `星期${WEEKDAYS[date.getDay()]}`;
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full bg-white border-4 border-pop-black shadow-pop p-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-stripes-subtle opacity-10 pointer-events-none" />
      <div className="flex items-end justify-between mb-2 relative z-10">
        <div>
          <div className="text-pop-black font-black text-lg italic transform -skew-x-3">{dateStr}</div>
          <div className="text-pop-black/50 text-xs font-bold">{weekday}</div>
        </div>
        <div className="text-pop-pink text-2xl font-black tabular-nums italic transform -skew-x-3">{timeStr}</div>
      </div>
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <WeatherIcon type={weatherInfo.today.type} className="w-7 h-7 text-pop-yellow" />
        <div>
          <div className="text-pop-black font-black text-sm">{weatherInfo.today.type}</div>
          <div className="text-pop-black/40 text-[11px]">{weatherInfo.today.description}</div>
        </div>
      </div>
      <div className="flex gap-2 relative z-10">
        <div className="flex-1 flex flex-col items-center bg-pop-black/5 border-2 border-pop-black/10 py-1.5">
          <span className="text-pop-black/50 text-[10px] font-black">明天</span>
          <WeatherIcon type={weatherInfo.tomorrow.type} className="w-4 h-4 text-pop-black/70 mt-0.5" />
          <span className="text-pop-black/70 text-[10px] mt-0.5 font-black">{weatherInfo.tomorrow.type}</span>
        </div>
        <div className="flex-1 flex flex-col items-center bg-pop-black/5 border-2 border-pop-black/10 py-1.5">
          <span className="text-pop-black/50 text-[10px] font-black">后天</span>
          <WeatherIcon type={weatherInfo.dayAfter.type} className="w-4 h-4 text-pop-black/70 mt-0.5" />
          <span className="text-pop-black/70 text-[10px] mt-0.5 font-black">{weatherInfo.dayAfter.type}</span>
        </div>
      </div>
    </div>
  );
}

// ── App 图标 — 波普风格大图标 ──
function AppIcon({ icon, label, badge, color, iconColor, onClick }: {
  icon: React.ReactNode;
  label: string;
  badge: number;
  color: string;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'w-16 h-16 rounded-2xl border-4 border-pop-black flex items-center justify-center shadow-pop relative overflow-hidden group',
          color, iconColor,
        )}
      >
        <div className="absolute inset-0 bg-halftone-white opacity-30 pointer-events-none" />
        <div className="relative z-10 transform group-hover:-skew-x-6 group-hover:rotate-12 transition-transform">
          {icon}
        </div>
        {badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-pop-pink text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-pop-black shadow-pop animate-bounce">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </motion.button>
      <span className="mt-2 text-white font-bold text-[10px] tracking-wide px-1.5 py-0.5 bg-pop-black border border-white/20 rounded shadow-md">
        {label}
      </span>
    </div>
  );
}
