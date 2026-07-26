import React, { useState } from "react";
import { PopCard } from "./ui/PopCard";
import { Clock, MapPin, User, Briefcase, Eye, EyeOff, Menu, X, Maximize2, Minimize2, Brain, Database, BookText, Trash2, RefreshCw, ChevronUp, ChevronDown, Settings as SettingsIcon, Sun, Cloud, Cloudy, CloudRain, CloudDrizzle, CloudSnow, CloudFog, CloudLightning } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGameContext } from "../state/GameContext";
import { CalendarModal } from "./modals/CalendarModal";
import { MapModal } from "./modals/MapModal";
import { cn } from "../utils";
import { FloorSelector } from "./FloorSelector";
import { getWeather, type WeatherType } from "../data/weather";

interface HUDProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenThinking: () => void;
  onOpenVariables: () => void;
  onOpenReading: () => void;
  onOpenDelete: () => void;
  onOpenSettings: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
  isGenerating?: boolean;
}

export function HUD({ isSidebarOpen, onToggleSidebar, isFullscreen, onToggleFullscreen, onOpenThinking, onOpenVariables, onOpenReading, onOpenDelete, onOpenSettings, onRegenerate, regenerating, isGenerating = false }: HUDProps) {
  const { currentOrder, setIsCalendarOpen, setIsMapOpen, totalDebt, totalIncome, remainingDebt, isEyeCareMode, setIsEyeCareMode, gameTime, currentWeekday, currentLocation } = useGameContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const progress = totalDebt > 0 ? Math.min(100, Math.max(0, (totalIncome / totalDebt) * 100)) : 0;

  const weather = getWeather(gameTime);

  const weatherIcon = (type: WeatherType) => {
    switch (type) {
      case '晴': return <Sun className="w-4 h-4 shrink-0" />;
      case '多云': return <Cloudy className="w-4 h-4 shrink-0" />;
      case '阴': return <Cloud className="w-4 h-4 shrink-0" />;
      case '小雨': return <CloudDrizzle className="w-4 h-4 shrink-0" />;
      case '大雨': return <CloudRain className="w-4 h-4 shrink-0" />;
      case '雪': return <CloudSnow className="w-4 h-4 shrink-0" />;
      case '雾': return <CloudFog className="w-4 h-4 shrink-0" />;
      case '雷暴': return <CloudLightning className="w-4 h-4 shrink-0" />;
    }
  };

  const weatherColor = (type: WeatherType) => {
    switch (type) {
      case '晴': return 'bg-pop-yellow text-pop-black';
      case '多云': return 'bg-gray-200 text-gray-700';
      case '阴': return 'bg-gray-300 text-gray-800';
      case '小雨': return 'bg-pop-cyan text-pop-black';
      case '大雨': return 'bg-pop-cyan text-white';
      case '雪': return 'bg-white text-pop-black';
      case '雾': return 'bg-gray-200 text-gray-700';
      case '雷暴': return 'bg-pop-pink text-white';
    }
  };

  return (
    <>
      {/* Collapsed state: minimal bar */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-2 bg-pop-black/90 border-b-2 border-pop-pink px-4 py-1.5 rounded-b-lg shadow-pop-pink">
              <span className="text-pop-yellow font-black text-xs italic">
                ¥{remainingDebt.toLocaleString()}
              </span>
              <div className="w-16 h-2 bg-white pop-border clip-diagonal relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-stripes-cyan-pink"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-0.5 bg-pop-yellow text-pop-black hover:bg-pop-cyan transition-colors clip-diagonal"
                title="展开HUD"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded HUD */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-40 p-2 pointer-events-none"
          >
            {/* Collapse toggle */}
            <div className="flex justify-end mb-1 pointer-events-auto">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 bg-pop-black/70 text-white hover:bg-pop-pink transition-colors clip-diagonal"
                title="折叠HUD"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch gap-2 w-full">

              {/* Left column: 时间 / 地点 / 折叠按钮 — 大屏显示，竖屏隐藏到"更多" */}
              <div className="hidden lg:flex flex-col gap-2 shrink-0 pointer-events-auto">
                <div className="flex gap-2">
                  <PopCard
                    onClick={() => setIsCalendarOpen(true)}
                    className="py-1 px-3 flex items-center gap-2 bg-pop-cyan clip-diagonal shadow-pop-cyan cursor-pointer hover:scale-105 transition-transform flex-1"
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-sm whitespace-nowrap">
                      {currentWeekday || ['周日','周一','周二','周三','周四','周五','周六'][gameTime.getDay()]} {gameTime.getMonth() + 1}月{String(gameTime.getDate()).padStart(2, '0')}日 {gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </PopCard>
                  <PopCard
                    className={cn("py-1 px-2 flex items-center justify-center clip-diagonal cursor-default shrink-0", weatherColor(weather.type))}
                    title={`${weather.type} · ${weather.description}`}
                  >
                    {weatherIcon(weather.type)}
                  </PopCard>
                </div>
                <div className="flex gap-2">
                <PopCard
                  onClick={() => setIsMapOpen(true)}
                  className="py-1 px-3 flex items-center gap-2 bg-pop-yellow clip-diagonal shadow-pop-cyan cursor-pointer hover:scale-105 transition-transform flex-1"
                  title="打开地图"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-sm whitespace-nowrap">{currentLocation}</span>
                </PopCard>
                  <PopCard
                    onClick={() => setIsEyeCareMode(!isEyeCareMode)}
                    className={`py-1 px-2 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform clip-diagonal shrink-0 ${isEyeCareMode ? 'bg-[#cce3de] text-[#2c3e50]' : 'bg-gray-200 text-gray-700'}`}
                    title="护眼模式"
                  >
                    {isEyeCareMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </PopCard>
                  <PopCard
                    onClick={onToggleFullscreen}
                    className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                    title={isFullscreen ? "退出全屏" : "全屏模式"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </PopCard>
                  <PopCard
                    onClick={onOpenReading}
                    className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                    title="剧情回顾"
                  >
                    <BookText className="w-4 h-4" />
                  </PopCard>
                  <PopCard
                    onClick={onOpenDelete}
                    className="py-1 px-2 flex items-center justify-center bg-pop-pink text-white cursor-pointer hover:scale-105 hover:bg-pop-yellow hover:text-pop-black transition-transform clip-diagonal shrink-0"
                    title="删除楼层"
                  >
                    <Trash2 className="w-4 h-4" />
                  </PopCard>
                  <PopCard
                    onClick={onRegenerate}
                    className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                    title="重新生成"
                  >
                    <RefreshCw className={cn("w-4 h-4", regenerating && "animate-spin")} />
                  </PopCard>
                  <PopCard
                    onClick={onOpenThinking}
                    className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                    title="思维链"
                  >
                    <Brain className="w-4 h-4" />
                  </PopCard>
                  <PopCard
                    onClick={onOpenVariables}
                    className="py-1 px-2 flex items-center justify-center bg-pop-yellow text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-cyan transition-transform clip-diagonal shrink-0"
                    title="变量"
                  >
                    <Database className="w-4 h-4" />
                  </PopCard>
                  <PopCard
                    onClick={onOpenSettings}
                    className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                    title="设置"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </PopCard>
                  <FloorSelector />
                </div>
                <PopCard
                  onClick={onToggleSidebar}
                  className="py-1 px-2 flex items-center justify-center bg-pop-yellow text-pop-black clip-diagonal shadow-pop-pink cursor-pointer hover:scale-110 transition-transform"
                >
                  {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </PopCard>
              </div>

              {/* 竖屏顶部栏：一行核心按钮 */}
              <div className="flex lg:hidden flex-wrap items-center gap-1.5 pointer-events-auto w-full">
                <PopCard
                  onClick={() => setIsCalendarOpen(true)}
                  className="py-1 px-2 flex items-center gap-1 bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 transition-transform clip-diagonal shrink-0"
                  title="时间"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">{gameTime.getMonth() + 1}/{gameTime.getDate()}</span>
                </PopCard>
                <PopCard
                  className={cn("py-1 px-2 flex items-center justify-center clip-diagonal shrink-0", weatherColor(weather.type))}
                  title={`${weather.type} · ${weather.description}`}
                >
                  {weatherIcon(weather.type)}
                </PopCard>
                <PopCard
                  onClick={() => setIsMapOpen(true)}
                  className="py-1 px-2 flex items-center gap-1 bg-pop-yellow text-pop-black cursor-pointer hover:scale-105 transition-transform clip-diagonal shrink-0"
                  title="地图"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs truncate max-w-[60px]">{currentLocation}</span>
                </PopCard>
                <PopCard
                  onClick={onToggleFullscreen}
                  className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                  title={isFullscreen ? "退出全屏" : "全屏模式"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </PopCard>
                <PopCard
                  onClick={onOpenReading}
                  className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                  title="剧情回顾"
                >
                  <BookText className="w-3.5 h-3.5" />
                </PopCard>
                <PopCard
                  onClick={onOpenThinking}
                  className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                  title="思维链"
                >
                  <Brain className="w-3.5 h-3.5" />
                </PopCard>
                <PopCard
                  onClick={() => setIsEyeCareMode(!isEyeCareMode)}
                  className={`py-1 px-2 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform clip-diagonal shrink-0 ${isEyeCareMode ? 'bg-[#cce3de] text-[#2c3e50]' : 'bg-gray-200 text-gray-700'}`}
                  title="护眼模式"
                >
                  {isEyeCareMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </PopCard>
                <PopCard
                  onClick={onOpenDelete}
                  className="py-1 px-2 flex items-center justify-center bg-pop-pink text-white cursor-pointer hover:scale-105 hover:bg-pop-yellow hover:text-pop-black transition-transform clip-diagonal shrink-0"
                  title="删除楼层"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </PopCard>
                <PopCard
                  onClick={onRegenerate}
                  className="py-1 px-2 flex items-center justify-center bg-pop-black text-white cursor-pointer hover:scale-105 hover:bg-pop-pink transition-transform clip-diagonal shrink-0"
                  title="重新生成"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} />
                </PopCard>
                <PopCard
                  onClick={onOpenVariables}
                  className="py-1 px-2 flex items-center justify-center bg-pop-yellow text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-cyan transition-transform clip-diagonal shrink-0"
                  title="变量"
                >
                  <Database className="w-3.5 h-3.5" />
                </PopCard>
                <PopCard
                  onClick={onOpenSettings}
                  className="py-1 px-2 flex items-center justify-center bg-pop-cyan text-pop-black cursor-pointer hover:scale-105 hover:bg-pop-yellow transition-transform clip-diagonal shrink-0"
                  title="设置"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                </PopCard>
                <div className="shrink-0">
                  <FloorSelector />
                </div>
                <PopCard
                  onClick={onToggleSidebar}
                  className="py-1 px-2 flex items-center justify-center bg-pop-yellow text-pop-black clip-diagonal shadow-pop-pink cursor-pointer hover:scale-110 transition-transform shrink-0"
                  title="侧边栏"
                >
                  {isSidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                </PopCard>
              </div>

              {/* 竖屏：债务条 + 状态灯/任务 左右并排 */}
              <div className="flex lg:hidden items-stretch gap-2 w-full">
                {/* 左侧：缩短的债务条 */}
                <PopCard skew className="flex-1 flex flex-col justify-center bg-pop-black text-white p-2 pointer-events-auto border-pop-pink shadow-pop-pink relative overflow-hidden min-w-0">
                  <div className="absolute inset-0 bg-halftone opacity-50"></div>
                  <div className="relative z-10 flex justify-between items-end mb-1">
                    <span className="text-pop-pink font-black text-xs italic hidden sm:inline">DEBT</span>
                    <span className="text-sm font-black text-pop-yellow drop-shadow-[2px_2px_0_#ff3366]">
                      ¥{remainingDebt.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white pop-border clip-diagonal relative overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-stripes-cyan-pink"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, type: "spring" }}
                    />
                  </div>
                </PopCard>

                {/* 右侧：状态灯 + 当前任务 上下堆叠 */}
                <div className="flex flex-col gap-1 shrink-0 w-[100px] pointer-events-auto">
                {/* 状态灯 - 移除 animate-pulse 减少重绘 */}
                <PopCard
                  className={cn(
                    "py-1 px-2 flex items-center justify-center gap-1 clip-diagonal border-2 border-white shadow-[2px_2px_0_#1a1a1a] transition-colors duration-300",
                    isGenerating ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  )}
                  title={isGenerating ? "AI 生成中..." : "AI 空闲"}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isGenerating ? "bg-white" : "bg-white"
                  )} />
                  <span className="font-bold text-xs whitespace-nowrap">
                    {isGenerating ? "生成中" : "就绪"}
                  </span>
                </PopCard>

                  {/* 当前任务 */}
                  <AnimatePresence mode="wait">
                    {!currentOrder ? (
                      <motion.div
                        key="none"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                      >
                        <PopCard className="py-1 px-2 flex items-center justify-center gap-1 bg-pop-black text-gray-400 clip-diagonal border-2 border-gray-600 shadow-none">
                          <span className="font-bold text-xs truncate">无任务</span>
                        </PopCard>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="active"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="flex flex-col gap-1"
                      >
                        <PopCard className="py-1 px-2 flex items-center gap-1 bg-pop-pink clip-diagonal border-2 border-pop-black shadow-[2px_2px_0_#1a1a1a]">
                          <User className="w-3 h-3 shrink-0 text-white" />
                          <span className="font-bold text-xs text-white whitespace-nowrap overflow-hidden text-ellipsis">{currentOrder.charName}</span>
                        </PopCard>
                        <PopCard className="py-1 px-2 flex items-center gap-1 bg-white clip-diagonal border-2 border-pop-black shadow-[2px_2px_0_#1a1a1a] text-pop-pink">
                          <Briefcase className="w-3 h-3 shrink-0 text-pop-black" />
                          <span className="font-bold text-xs text-pop-black whitespace-nowrap overflow-hidden text-ellipsis">{currentOrder.task}</span>
                        </PopCard>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Center column: Debt Progress — 大屏跨两行等高 */}
              <PopCard skew className="hidden lg:flex flex-1 flex-col justify-center bg-pop-black text-white p-2 pointer-events-auto border-pop-pink shadow-pop-pink relative overflow-hidden">
                <div className="absolute inset-0 bg-halftone opacity-50"></div>
                <div className="relative z-10 flex justify-between items-end mb-1">
                  <span className="text-pop-pink font-black text-lg text-stroke-sm italic hidden lg:inline">REMAINING DEBT</span>
                  <span className="text-xl font-black text-pop-yellow drop-shadow-[2px_2px_0_#ff3366]">
                    ¥{remainingDebt.toLocaleString()}
                  </span>
                </div>
                <div className="h-4 w-full bg-white pop-border clip-diagonal relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-stripes-cyan-pink"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, type: "spring" }}
                  />
                </div>
              </PopCard>

              {/* Right column: 当前角色 / 任务 — 大屏显示，竖屏隐藏 */}
              <div className="hidden lg:flex flex-col gap-2 shrink-0 pointer-events-auto min-w-[160px]">
                {/* 状态灯 - 移除 animate-pulse */}
                <PopCard
                  className={cn(
                    "py-1 px-3 flex items-center justify-center gap-2 clip-diagonal border-2 border-white shadow-[2px_2px_0_#1a1a1a] transition-colors duration-300",
                    isGenerating ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  )}
                  title={isGenerating ? "AI 生成中..." : "AI 空闲"}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isGenerating ? "bg-white" : "bg-white"
                  )} />
                  <span className="font-bold text-sm whitespace-nowrap">
                    {isGenerating ? "生成中" : "就绪"}
                  </span>
                </PopCard>

                <AnimatePresence mode="wait">
                  {!currentOrder ? (
                    <motion.div
                      key="none"
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="flex flex-col gap-2"
                    >
                      <PopCard className="py-2 px-3 flex items-center justify-center gap-2 bg-pop-black text-gray-400 clip-diagonal border-2 border-gray-600 shadow-none">
                         <span className="font-bold text-sm">当前任务: 无</span>
                      </PopCard>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="active"
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="flex flex-col gap-2"
                    >
                      <PopCard className="py-1 px-3 flex items-center gap-2 bg-pop-pink clip-diagonal border-2 border-pop-black shadow-[2px_2px_0_#1a1a1a]">
                        <User className="w-4 h-4 shrink-0 text-white" />
                        <span className="font-bold text-sm text-white whitespace-nowrap overflow-hidden text-ellipsis">当前: {currentOrder.charName}</span>
                      </PopCard>
                      <PopCard className="py-1 px-3 flex items-center gap-2 bg-white clip-diagonal border-2 border-pop-black shadow-[2px_2px_0_#1a1a1a] text-pop-pink">
                        <Briefcase className="w-4 h-4 shrink-0 text-pop-black" />
                        <span className="font-bold text-sm text-pop-black whitespace-nowrap overflow-hidden text-ellipsis">{currentOrder.task}</span>
                      </PopCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <CalendarModal key="calendar" />
        <MapModal key="map" />
      </AnimatePresence>
    </>
  );
}
