import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X } from "lucide-react";
import { PopCard } from "./ui/PopCard";
import { cn } from "../utils";
import { bgmBridge, useBgmSettings } from "../audio/bgmBridge";
import { bgmPlayer, useBgmPlayer, BGM_CATEGORIES, ALL_TRACKS } from "../audio/bgmPlayer";

// ── 主组件 ──
// 音频播放由全局单例 bgmPlayer 管理，组件卸载不会停止播放。

export function BgmPlayer() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // 播放状态从全局单例获取
  const playerState = useBgmPlayer();
  const bgmAudio = useBgmSettings();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    ALL_TRACKS[playerState.currentTrackIndex]?.categoryId || "daily"
  );

  const currentTrack = ALL_TRACKS[playerState.currentTrackIndex];
  const { isPlaying, isLoading, hasError } = playerState;

  // ── 控制函数 ──
  const togglePlay = useCallback(() => {
    bgmPlayer.togglePlay();
  }, []);

  const nextTrack = useCallback(() => {
    bgmPlayer.next();
    const next = ALL_TRACKS[(playerState.currentTrackIndex + 1) % ALL_TRACKS.length];
    setActiveCategoryId(next.categoryId);
  }, [playerState.currentTrackIndex]);

  const prevTrack = useCallback(() => {
    bgmPlayer.prev();
    const prev2 = ALL_TRACKS[(playerState.currentTrackIndex - 1 + ALL_TRACKS.length) % ALL_TRACKS.length];
    setActiveCategoryId(prev2.categoryId);
  }, [playerState.currentTrackIndex]);

  const selectTrack = useCallback((globalIndex: number) => {
    bgmPlayer.setTrack(globalIndex, true);
  }, []);

  const setVolume = useCallback((vol: number) => {
    bgmBridge.setVolume(vol);
  }, []);

  // 当当前曲目所属分类与激活分类不一致时，自动切换激活分类
  React.useEffect(() => {
    const track = ALL_TRACKS[playerState.currentTrackIndex];
    if (track && track.categoryId !== activeCategoryId) {
      setActiveCategoryId(track.categoryId);
    }
  }, [playerState.currentTrackIndex, activeCategoryId]);

  // ── 当前分类的曲目列表 ──
  const currentCategoryTracks = useMemo(() => {
    const cat = BGM_CATEGORIES.find(c => c.id === activeCategoryId);
    return cat ? cat.tracks : [];
  }, [activeCategoryId]);

  // ── 当前分类的全局起始索引（用于计算全局 index） ──
  const categoryStartIndex = useMemo(() => {
    let index = 0;
    for (const cat of BGM_CATEGORIES) {
      if (cat.id === activeCategoryId) break;
      index += cat.tracks.length;
    }
    return index;
  }, [activeCategoryId]);

  // ── 缓存静态动画对象 ──
  const panelVariants = useMemo(() => ({
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 20 },
  }), []);

  const buttonVariants = useMemo(() => ({
    hidden: { scale: 0 },
    visible: { scale: 1 },
    exit: { scale: 0 },
  }), []);

  return (
    <>
      {/* ── 浮动 BGM 按钮 ── */}
      {/* 底部偏上，避开左下角的 ChatBar 折叠按钮和展开后的输入栏 */}
<div className="fixed bottom-20 right-4 z-50">
        <AnimatePresence mode="wait">
          {isPanelOpen ? (
            <motion.div
              key="panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <PopCard
                skew
                className="bg-pop-black text-white p-0 shadow-pop-pink overflow-hidden w-72 max-w-[calc(100vw-2rem)]"
              >
                {/* ── 标题栏 ── */}
                <div className="flex items-center justify-between bg-stripes-cyan-pink px-3 py-2 clip-diagonal">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-white drop-shadow-[1px_1px_0_#1a1a1a]" />
                    <span className="font-black text-sm text-white text-stroke-sm italic">BGM PLAYER</span>
                  </div>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-1 bg-pop-pink text-white hover:bg-white hover:text-pop-pink transition-colors clip-diagonal"
                    title="关闭"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ── 当前曲目信息 ── */}
                <div className="px-3 py-2 bg-pop-black/80 relative">
                  <div className="absolute inset-0 bg-halftone opacity-20"></div>
                  <div className="relative z-10">
                    <div className="text-[10px] text-pop-cyan font-bold uppercase tracking-wider">
                      {currentTrack?.categoryLabel || "—"} / {isPlaying ? "NOW PLAYING" : "PAUSED"}
                    </div>
                    <div className="text-sm font-black text-pop-yellow truncate drop-shadow-[1px_1px_0_#ff3366]">
                      {currentTrack?.name || "未选择"}
                    </div>
                    {currentTrack?.artist && (
                      <div className="text-[10px] text-white/60 font-bold truncate">
                        by {currentTrack.artist}
                      </div>
                    )}
                    {hasError && (
                      <div className="text-[10px] text-red-400 font-bold mt-0.5">⚠ 音频加载失败</div>
                    )}
                    {isLoading && isPlaying && !hasError && (
                      <div className="text-[10px] text-pop-cyan font-bold mt-0.5 animate-pulse">加载中...</div>
                    )}
                  </div>
                </div>

                {/* ── 播放控制按钮 ── */}
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-pop-black">
                  <button
                    onClick={prevTrack}
                    className="p-2 bg-white text-pop-black hover:bg-pop-yellow transition-colors clip-diagonal pop-border"
                    title="上一曲"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className={cn(
                      "p-2.5 clip-diagonal pop-border transition-colors",
                      isPlaying
                        ? "bg-pop-pink text-white hover:bg-white hover:text-pop-pink"
                        : "bg-pop-cyan text-pop-black hover:bg-pop-yellow"
                    )}
                    title={isPlaying ? "暂停" : "播放"}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={nextTrack}
                    className="p-2 bg-white text-pop-black hover:bg-pop-yellow transition-colors clip-diagonal pop-border"
                    title="下一曲"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* ── 音量控制 ── */}
                <div className="flex items-center gap-2 px-3 py-2 bg-pop-black/60">
                  <button
                    onClick={() => bgmBridge.toggleMuted()}
                    className={cn(
                      "p-1 transition-colors shrink-0",
                      bgmAudio.muted ? "text-gray-500" : "text-white hover:text-pop-cyan"
                    )}
                    title={bgmAudio.muted ? "取消静音" : "静音"}
                  >
                    {bgmAudio.muted || bgmAudio.volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 relative h-4 flex items-center">
                    {/* 音量轨道 */}
                    <div className="absolute inset-x-0 h-2 bg-white/20 clip-diagonal overflow-hidden">
                      <div
                        className="h-full bg-stripes-cyan-pink transition-[width] duration-100"
                        style={{ width: `${bgmAudio.muted ? 0 : bgmAudio.volume * 100}%` }}
                      />
                    </div>
                    {/* 滑块 */}
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={bgmAudio.volume}
                      onChange={e => setVolume(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      title="音量"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/70 w-7 text-right shrink-0">
                    {bgmAudio.muted ? "--" : Math.round(bgmAudio.volume * 100)}
                  </span>
                </div>

                {/* ── 分类标签 ── */}
                <div className="flex gap-1 px-2 py-1.5 bg-pop-black/40 overflow-x-auto hide-scrollbar">
                  {BGM_CATEGORIES.map(cat => {
                    const isActive = activeCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-black uppercase whitespace-nowrap clip-diagonal transition-all border-2 border-pop-black",
                          isActive
                            ? `${cat.color} ${cat.textColor} shadow-[2px_2px_0_#1a1a1a]`
                            : "bg-white/10 text-white/50 hover:bg-white/20"
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── 曲目列表 ── */}
                <div className="max-h-48 overflow-y-auto hide-scrollbar bg-pop-black/30">
                  {currentCategoryTracks.map((track, idx) => {
                    const globalIdx = categoryStartIndex + idx;
                    const isCurrent = globalIdx === playerState.currentTrackIndex;
                    return (
                      <button
                        key={`${track.name}-${idx}`}
                        onClick={() => selectTrack(globalIdx)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors border-b border-white/5",
                          isCurrent
                            ? "bg-pop-pink/30 text-pop-yellow"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 flex items-center justify-center shrink-0 clip-diagonal border border-white/20",
                          isCurrent ? "bg-pop-pink" : "bg-white/5"
                        )}>
                          {isCurrent && isPlaying ? (
                            <Pause className="w-2.5 h-2.5 text-white" />
                          ) : isCurrent ? (
                            <Play className="w-2.5 h-2.5 text-white" />
                          ) : (
                            <span className="text-[8px] font-bold text-white/40">{idx + 1}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold truncate block">{track.name}</span>
                          <span className="text-[9px] text-white/40 truncate block">by {track.artist}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopCard>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={() => setIsPanelOpen(true)}
              className={cn(
                "w-12 h-12 rounded-full pop-border shadow-pop-pink flex items-center justify-center transition-all clip-diagonal",
                isPlaying
                  ? "bg-pop-pink text-white animate-pulse"
                  : "bg-pop-yellow text-pop-black hover:scale-110 active:scale-90"
              )}
              title="打开音乐播放器"
            >
              <Music className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
