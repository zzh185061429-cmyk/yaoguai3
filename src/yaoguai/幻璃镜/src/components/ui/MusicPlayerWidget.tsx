import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Repeat, Repeat1, Shuffle, ListMusic, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bgmBridge, useBgmSettings, getEffectiveBgmVolume } from '../../audio/bgmBridge';
import { cn } from '../../utils';

type PlayMode = 'list' | 'loop' | 'shuffle';

export const MusicPlayerWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── 从 bgmBridge 订阅音量/静音状态 ──
  const bgmAudio = useBgmSettings();

  const tracks = [
    { title: '霓虹幻梦 (Neon Dream)', artist: 'Cyber City' },
    { title: '暗巷寻踪 (Alley Clues)', artist: 'Detective' },
    { title: '午夜狂奔 (Midnight Run)', artist: 'Synthwave' },
    { title: '深沉谜团 (Deep Mystery)', artist: 'Noir' }
  ];
  const [currentTrack, setCurrentTrack] = useState(0);

  // ── 同步 bgmBridge 音量到 audio 元素 ──
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = getEffectiveBgmVolume();
    }
  }, [bgmAudio.volume, bgmAudio.muted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playMode === 'shuffle') {
      setCurrentTrack(Math.floor(Math.random() * tracks.length));
    } else {
      setCurrentTrack((prev) => (prev + 1) % tracks.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playMode === 'shuffle') {
      setCurrentTrack(Math.floor(Math.random() * tracks.length));
    } else {
      setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
  };

  const togglePlayMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const modes: PlayMode[] = ['list', 'loop', 'shuffle'];
    setPlayMode(modes[(modes.indexOf(playMode) + 1) % modes.length]);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    bgmBridge.toggleMuted();
  };

  const ModeIcon = playMode === 'list' ? Repeat : playMode === 'loop' ? Repeat1 : Shuffle;
  const modeLabel = playMode === 'list' ? '列表循环' : playMode === 'loop' ? '单曲循环' : '随机播放';

  return (
    <div className="fixed bottom-[210px] right-6 z-50 pointer-events-none flex flex-col-reverse items-end gap-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-12 h-12 rounded-full bg-ink-900/90 backdrop-blur-md border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(48,143,143,0.3)] hover:scale-105 transition-all pointer-events-auto group relative overflow-hidden"
      >
        {isPlaying && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent opacity-50"
          />
        )}
        <div className="relative z-10 flex flex-col items-center">
          <Music size={20} className={isPlaying ? "text-cyan-400" : "text-ink-400 group-hover:text-cyan-400"} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-ink-900/95 backdrop-blur-md border border-cyan-900/50 rounded-xl p-4 w-64 shadow-2xl pointer-events-auto"
          >
            {/* Header & Controls */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-serif text-paper-200 truncate">{tracks[currentTrack].title}</span>
                  <span className="text-xs font-sans text-cyan-400 truncate">{tracks[currentTrack].artist}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-ink-400 pt-2 border-t border-ink-800">
                <button onClick={togglePlayMode} className="hover:text-cyan-400 transition-colors p-1" title={modeLabel}>
                  <ModeIcon size={16} />
                </button>
                <div className="flex items-center gap-4 text-paper-200">
                  <button onClick={handlePrev} className="hover:text-cyan-400 transition-colors">
                    <SkipBack size={18} />
                  </button>
                  <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center bg-cyan-900/50 rounded-full hover:bg-cyan-800 transition-colors text-cyan-300">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
                  </button>
                  <button onClick={handleNext} className="hover:text-cyan-400 transition-colors">
                    <SkipForward size={18} />
                  </button>
                </div>
                <button onClick={toggleMute} className={cn('hover:text-cyan-400 transition-colors p-1', bgmAudio.muted && 'text-vermilion-400')} title={bgmAudio.muted ? '取消静音' : '静音'}>
                  {bgmAudio.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* 音量滑条 */}
              <div className="flex items-center gap-2 pt-1">
                <Volume2 size={12} className={cn('shrink-0', bgmAudio.muted ? 'text-ink-500' : 'text-cyan-400')} />
                <div className="flex-1 relative h-4 flex items-center">
                  <div className="absolute inset-x-0 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-[width] duration-100"
                      style={{ width: `${bgmAudio.muted ? 0 : bgmAudio.volume * 100}%` }}
                    />
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={bgmAudio.muted ? 0 : bgmAudio.volume}
                    onChange={(e) => bgmBridge.setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    title="BGM 音量"
                  />
                </div>
                <span className="text-[10px] font-sans text-gold-300 tabular-nums w-6 text-right">
                  {bgmAudio.muted ? '--' : Math.round(bgmAudio.volume * 100)}
                </span>
              </div>
            </div>

            {/* Playlist */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {tracks.map((track, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTrack(idx)}
                  className={`flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors ${
                    idx === currentTrack
                      ? 'bg-cyan-950/40 border border-cyan-900/50'
                      : 'hover:bg-ink-800 border border-transparent'
                  }`}
                >
                  <span className={`text-xs font-serif ${idx === currentTrack ? 'text-cyan-300' : 'text-paper-200'}`}>
                    {track.title}
                  </span>
                  <span className={`text-[10px] font-sans ${idx === currentTrack ? 'text-cyan-500' : 'text-ink-500'}`}>
                    {track.artist}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} />
    </div>
  );
};
