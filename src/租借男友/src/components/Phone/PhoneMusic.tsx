/**
 * 音乐播放器 App — 波普风格
 *
 * 将原 BgmPlayer 的功能移植到手机界面。
 * 音频播放由全局单例 bgmPlayer 管理，退出 App 后音乐不会停止。
 * - AppHeader + 返回按钮
 * - 当前曲目信息 + 播放控制
 * - 音量控制
 * - 分类标签 + 曲目列表
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Music,
} from 'lucide-react';
import { useBgmSettings, bgmBridge } from '../../audio/bgmBridge';
import { bgmPlayer, useBgmPlayer, BGM_CATEGORIES, ALL_TRACKS } from '../../audio/bgmPlayer';
import { AppHeader } from './PhoneShared';
import { cn } from '../../utils';

export function PhoneMusic({ onExit }: { onExit: () => void }) {
  // 播放状态从全局单例获取
  const playerState = useBgmPlayer();
  const bgmAudio = useBgmSettings();

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    ALL_TRACKS[playerState.currentTrackIndex]?.categoryId || 'daily',
  );

  const currentTrack = ALL_TRACKS[playerState.currentTrackIndex];
  const { isPlaying, isLoading, hasError } = playerState;

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
  // 仅在曲目变化时触发，用户手动点分类标签时不触发（避免无法切换分类）
  const prevTrackIndexRef = React.useRef(playerState.currentTrackIndex);
  React.useEffect(() => {
    if (prevTrackIndexRef.current === playerState.currentTrackIndex) return;
    prevTrackIndexRef.current = playerState.currentTrackIndex;
    const track = ALL_TRACKS[playerState.currentTrackIndex];
    if (track && track.categoryId !== activeCategoryId) {
      setActiveCategoryId(track.categoryId);
    }
  }, [playerState.currentTrackIndex]); // 故意不包含 activeCategoryId

  const currentCategoryTracks = useMemo(() => {
    const cat = BGM_CATEGORIES.find(c => c.id === activeCategoryId);
    return cat ? cat.tracks : [];
  }, [activeCategoryId]);

  const categoryStartIndex = useMemo(() => {
    let index = 0;
    for (const cat of BGM_CATEGORIES) {
      if (cat.id === activeCategoryId) break;
      index += cat.tracks.length;
    }
    return index;
  }, [activeCategoryId]);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-pop-black flex flex-col z-10"
    >
      <AppHeader title="音乐" color="bg-pop-pink" onBack={onExit} />

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 bg-halftone-white">
        {/* ── 当前曲目卡片 ── */}
        <div className="bg-white border-4 border-pop-black shadow-[6px_6px_0px_0px_#1a1a1a] overflow-hidden">
          {/* 标题栏 */}
          <div className="bg-stripes-cyan-pink px-3 py-2 flex items-center justify-between clip-diagonal">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-white drop-shadow-[1px_1px_0_#1a1a1a]" />
              <span className="font-black text-sm text-white text-stroke-sm italic">NOW PLAYING</span>
            </div>
            <span className="text-[10px] font-black text-white/80">
              {currentTrack?.categoryLabel || '—'}
            </span>
          </div>

          {/* 曲目信息 */}
          <div className="px-3 py-3 bg-pop-black/80 relative">
            <div className="absolute inset-0 bg-halftone opacity-20"></div>
            <div className="relative z-10 text-center">
              <div className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 border-4 border-white",
                isPlaying ? "bg-pop-pink animate-pulse" : "bg-gray-700"
              )}>
                {isPlaying ? (
                  <div className="flex items-end gap-0.5 h-6">
                    <div className="w-1 bg-white animate-[bounce_0.5s_ease-in-out_infinite] h-3" />
                    <div className="w-1 bg-white animate-[bounce_0.5s_ease-in-out_0.2s_infinite] h-5" />
                    <div className="w-1 bg-white animate-[bounce_0.5s_ease-in-out_0.4s_infinite] h-4" />
                  </div>
                ) : (
                  <Music className="w-7 h-7 text-white/50" />
                )}
              </div>
              <div className="text-sm font-black text-pop-yellow truncate drop-shadow-[1px_1px_0_#ff3366]">
                {currentTrack?.name || "未选择"}
              </div>
              {currentTrack?.artist && (
                <div className="text-[10px] text-white/60 font-bold truncate mt-0.5">
                  by {currentTrack.artist}
                </div>
              )}
              {hasError && (
                <div className="text-[10px] text-red-400 font-bold mt-1">⚠ 音频加载失败</div>
              )}
              {isLoading && isPlaying && !hasError && (
                <div className="text-[10px] text-pop-cyan font-bold mt-1 animate-pulse">加载中...</div>
              )}
            </div>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-3 px-3 py-3 bg-pop-black">
            <button
              onClick={prevTrack}
              className="p-2.5 bg-white text-pop-black hover:bg-pop-yellow transition-colors clip-diagonal border-2 border-pop-black shadow-pop"
              title="上一曲"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className={cn(
                "p-3 clip-diagonal border-2 border-pop-black shadow-pop transition-colors",
                isPlaying
                  ? "bg-pop-pink text-white hover:bg-white hover:text-pop-pink"
                  : "bg-pop-cyan text-pop-black hover:bg-pop-yellow"
              )}
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              onClick={nextTrack}
              className="p-2.5 bg-white text-pop-black hover:bg-pop-yellow transition-colors clip-diagonal border-2 border-pop-black shadow-pop"
              title="下一曲"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* 音量控制 */}
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
              <div className="absolute inset-x-0 h-2 bg-white/20 clip-diagonal overflow-hidden">
                <div
                  className="h-full bg-stripes-cyan-pink transition-[width] duration-100"
                  style={{ width: `${bgmAudio.muted ? 0 : bgmAudio.volume * 100}%` }}
                />
              </div>
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
        </div>

        {/* ── 分类标签 ── */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {BGM_CATEGORIES.map(cat => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={cn(
                  "px-3 py-1 text-xs font-black uppercase whitespace-nowrap clip-diagonal transition-all border-2 border-pop-black",
                  isActive
                    ? `${cat.color} ${cat.textColor} shadow-pop`
                    : "bg-white/10 text-white/50 hover:bg-white/20"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── 曲目列表 ── */}
        <div className="bg-pop-black/50 border-2 border-pop-black">
          {currentCategoryTracks.map((track, idx) => {
            const globalIdx = categoryStartIndex + idx;
            const isCurrent = globalIdx === playerState.currentTrackIndex;
            return (
              <button
                key={`${track.name}-${idx}`}
                onClick={() => selectTrack(globalIdx)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-b border-white/5",
                  isCurrent
                    ? "bg-pop-pink/30 text-pop-yellow"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className={cn(
                  "w-6 h-6 flex items-center justify-center shrink-0 clip-diagonal border border-white/20",
                  isCurrent ? "bg-pop-pink" : "bg-white/5"
                )}>
                  {isCurrent && isPlaying ? (
                    <Pause className="w-3 h-3 text-white" />
                  ) : isCurrent ? (
                    <Play className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-[9px] font-bold text-white/40">{idx + 1}</span>
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
      </div>
    </motion.div>
  );
}
