import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, ChevronUp, ChevronDown, List } from "lucide-react";
import { PopCard } from "./ui/PopCard";
import { cn } from "../utils";
import { bgmBridge, useBgmSettings, getEffectiveBgmVolume } from "../audio/bgmBridge";

// ── BGM 配置 ──
const BGM_BASE = "https://cdn.jsdelivr.net/gh/zzh185061429-cmyk/zujie3@main/BGM";

type BgmCategory = {
  id: string;
  label: string;
  color: string;
  textColor: string;
  tracks: { name: string; artist: string; url: string }[];
};

// 使用 encodeURIComponent 对中文路径编码
const enc = (s: string) => encodeURIComponent(s);
// 构造 CDN URL（对目录和文件名分别编码）
const makeUrl = (dir: string, file: string) =>
  `${BGM_BASE}/${enc(dir)}/${enc(file)}`;

// BGM 来源: DOVA-SYNDROME (https://dova-s.jp/) 免费可商用 BGM
const BGM_CATEGORIES: BgmCategory[] = [
  {
    id: "daily",
    label: "日常",
    color: "bg-pop-cyan",
    textColor: "text-pop-black",
    tracks: [
      { name: "everyone", artist: "yuhei komatsu", url: makeUrl("01_日常", "01_everyone-by-yuhei komatsu.mp3") },
      { name: "魔法使いになりたいの！", artist: "えだまめ88", url: makeUrl("01_日常", "02_魔法使いになりたいの！-by-えだまめ88.mp3") },
      { name: "トワイライト・ハイウェイ", artist: "秦暁", url: makeUrl("01_日常", "03_トワイライト・ハイウェイ-by-秦暁.mp3") },
      { name: "Treatise Seven", artist: "Anonyment", url: makeUrl("01_日常", "04_Treatise Seven-by-Anonyment.mp3") },
      { name: "碧い回路の夜明け", artist: "しんさんわーくす", url: makeUrl("01_日常", "05_碧い回路の夜明け-by-しんさんわーくす.mp3") },
      { name: "rise and shine", artist: "山本リョーマ", url: makeUrl("01_日常", "06_rise and shine-by-山本リョーマ.mp3") },
      { name: "PALETTE", artist: "yuhei komatsu", url: makeUrl("01_日常", "07_PALETTE-by-yuhei komatsu.mp3") },
      { name: "poppop", artist: "Sakuttipanda", url: makeUrl("01_日常", "08_poppop-by-Sakuttipanda.mp3") },
      { name: "Growing in the Sky", artist: "shimtone", url: makeUrl("01_日常", "09_Growing in the Sky-by-shimtone.mp3") },
      { name: "Retail Magic Hour", artist: "MFP【Marron Fields Production】", url: makeUrl("01_日常", "10_Retail Magic Hour-by-MFP【Marron Fields Production】.mp3") },
      { name: "After Dark Rag", artist: "MFP【Marron Fields Production】", url: makeUrl("01_日常", "11_After Dark Rag-by-MFP【Marron Fields Production】.mp3") },
      { name: "Plumeria", artist: "SHUNTA", url: makeUrl("01_日常", "12_Plumeria-by-SHUNTA.mp3") },
      { name: "Blue and Bright", artist: "Fukagawa", url: makeUrl("01_日常", "13_Blue and Bright-by-Fukagawa.mp3") },
      { name: "のどかな一日", artist: "のる", url: makeUrl("01_日常", "14_のどかな一日-by-のる.mp3") },
      { name: "Happy Happy Road", artist: "FLASH☆BEAT", url: makeUrl("01_日常", "15_Happy Happy  Road-by-FLASH☆BEAT.mp3") },
    ],
  },
  {
    id: "romance",
    label: "恋爱",
    color: "bg-pop-pink",
    textColor: "text-white",
    tracks: [
      { name: "Music has not died", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "01_Music has not died-by-蒲鉾さちこ.mp3") },
      { name: "Melancholy autumn rainy day", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "02_Melancholy autumn rainy day-by-蒲鉾さちこ.mp3") },
      { name: "静かな海鳴り", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "03_静かな海鳴り-by-蒲鉾さちこ.mp3") },
      { name: "Luminous time", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "04_Luminous time-by-蒲鉾さちこ.mp3") },
      { name: "波打つ鼓動", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "05_波打つ鼓動-by-蒲鉾さちこ.mp3") },
      { name: "柔らかな温もり", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "06_柔らかな温もり-by-蒲鉾さちこ.mp3") },
      { name: "つながる笑顔", artist: "こばっと", url: makeUrl("02_恋爱温馨", "07_つながる笑顔-by-こばっと.mp3") },
      { name: "BGM - 030 - I Think Of You", artist: "Sound Of Incense", url: makeUrl("02_恋爱温馨", "08_BGM - 030 - I Think Of You-by-Sound Of Incense.mp3") },
      { name: "優しい憂雨に", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "09_優しい憂雨に-by-蒲鉾さちこ.mp3") },
      { name: "夕風と君", artist: "のる", url: makeUrl("02_恋爱温馨", "10_夕風と君-by-のる.mp3") },
      { name: "優しい窓辺", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "11_優しい窓辺-by-蒲鉾さちこ.mp3") },
      { name: "冬の訪れ", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "12_冬の訪れ-by-蒲鉾さちこ.mp3") },
      { name: "優しくなれたら", artist: "蒲鉾さちこ", url: makeUrl("02_恋爱温馨", "13_優しくなれたら-by-蒲鉾さちこ.mp3") },
    ],
  },
  {
    id: "comedy",
    label: "搞笑",
    color: "bg-pop-yellow",
    textColor: "text-pop-black",
    tracks: [
      { name: "Cheerful Chase", artist: "MFP【Marron Fields Production】", url: makeUrl("03_搞笑", "01_Cheerful Chase-by-MFP【Marron Fields Production】.mp3") },
      { name: "失敗は時として…？", artist: "のる", url: makeUrl("03_搞笑", "02_失敗は時として…？-by-のる.mp3") },
      { name: "わいわいミュージック・タイム", artist: "こばっと", url: makeUrl("03_搞笑", "03_わいわいミュージック・タイム-by-こばっと.mp3") },
      { name: "That Goober", artist: "MFP【Marron Fields Production】", url: makeUrl("03_搞笑", "04_That Goober-by-MFP【Marron Fields Production】.mp3") },
      { name: "なんでやねん", artist: "のる", url: makeUrl("03_搞笑", "05_なんでやねん-by-のる.mp3") },
      { name: "Pickin' Pickles", artist: "MFP【Marron Fields Production】", url: makeUrl("03_搞笑", "06_Pickin' Pickles-by-MFP【Marron Fields Production】.mp3") },
      { name: "ピンチだ！どうする！？どうにかなれっ！！", artist: "マイマイシ", url: makeUrl("03_搞笑", "07_ピンチだ！どうする！？どうにかなれっ！！-by-マイマイシ.mp3") },
      { name: "Cheery Cakewalk", artist: "MFP【Marron Fields Production】", url: makeUrl("03_搞笑", "08_Cheery Cakewalk-by-MFP【Marron Fields Production】.mp3") },
      { name: "わんぱく大行進", artist: "こばっと", url: makeUrl("03_搞笑", "09_わんぱく大行進-by-こばっと.mp3") },
      { name: "自慢話", artist: "Sakuttipanda", url: makeUrl("03_搞笑", "10_自慢話-by-Sakuttipanda.mp3") },
      { name: "おてんばジェニファー", artist: "のる", url: makeUrl("03_搞笑", "11_おてんばジェニファー-by-のる.mp3") },
    ],
  },
];

// 所有曲目的扁平列表
const ALL_TRACKS = BGM_CATEGORIES.flatMap(cat =>
  cat.tracks.map(t => ({ ...t, categoryId: cat.id, categoryLabel: cat.label }))
);

// ── localStorage 持久化（仅存储曲目索引和播放状态，音量/静音由 bgmBridge 管理）──
// v3: 音量/静音迁移到 bgmBridge，这里只保留曲目索引和播放状态
const STORAGE_KEY = "rent-boyfriend-bgm-settings-v3";

type BgmSettings = {
  currentTrackIndex: number;
  isPlaying: boolean;
};

function loadSettings(): BgmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentTrackIndex: typeof parsed.currentTrackIndex === "number" ? parsed.currentTrackIndex : 0,
        isPlaying: false, // 不自动恢复播放状态（浏览器限制）
      };
    }
  } catch {
    // ignore
  }
  return { currentTrackIndex: 0, isPlaying: false };
}

function saveSettings(settings: BgmSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ── 主组件 ──

export function BgmPlayer() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [settings, setSettings] = useState<BgmSettings>(loadSettings);
  // BGM 音量/静音从 bgmBridge 获取（与 SettingsPanel 共享）
  const bgmAudio = useBgmSettings();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    ALL_TRACKS[settings.currentTrackIndex]?.categoryId || "daily"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 用 ref 记录「应该播放」的意图，避免 src 变更时立即 play 导致失败
  const shouldPlayRef = useRef(false);

  const currentTrack = ALL_TRACKS[settings.currentTrackIndex];

  // ── 初始化 audio 元素 ──
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = getEffectiveBgmVolume();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // ── 当曲目变化时更新 audio src ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    setIsLoading(true);
    setAudioError(false);
    audio.src = currentTrack.url;
    audio.load();
    // 不立即 play，等 canplay 事件触发后再播放
  }, [settings.currentTrackIndex]);

  // ── 播放/暂停控制 ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    shouldPlayRef.current = settings.isPlaying;

    if (settings.isPlaying) {
      // 只有在音频已就绪时才 play
      if (audio.readyState >= 2) {
        audio.play().catch(() => {
          setAudioError(true);
          setSettings(prev => ({ ...prev, isPlaying: false }));
        });
      }
      // 否则等 canplay 事件自动播放
    } else {
      audio.pause();
    }
  }, [settings.isPlaying]);

  // ── 音量控制（从 bgmBridge 同步）──
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = getEffectiveBgmVolume();
    }
  }, [bgmAudio.volume, bgmAudio.muted]);

  // ── 持久化设置 ──
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // ── 音频事件监听 ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onCanPlay = () => {
      setIsLoading(false);
      // 如果应该播放但还没在播放，自动播放
      if (shouldPlayRef.current && audio.paused) {
        audio.play().catch(() => {
          setAudioError(true);
          setSettings(prev => ({ ...prev, isPlaying: false }));
        });
      }
    };
    const onError = () => {
      setIsLoading(false);
      setAudioError(true);
      setSettings(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // ── 页面卸载时暂停 ──
  useEffect(() => {
    const handlePageHide = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  // ── 控制函数 ──
  const togglePlay = useCallback(() => {
    setSettings(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const nextTrack = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      currentTrackIndex: (prev.currentTrackIndex + 1) % ALL_TRACKS.length,
    }));
    // 更新激活的分类
    const next = ALL_TRACKS[(settings.currentTrackIndex + 1) % ALL_TRACKS.length];
    setActiveCategoryId(next.categoryId);
  }, [settings.currentTrackIndex]);

  const prevTrack = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      currentTrackIndex: (prev.currentTrackIndex - 1 + ALL_TRACKS.length) % ALL_TRACKS.length,
    }));
    const prev2 = ALL_TRACKS[(settings.currentTrackIndex - 1 + ALL_TRACKS.length) % ALL_TRACKS.length];
    setActiveCategoryId(prev2.categoryId);
  }, [settings.currentTrackIndex]);

  const selectTrack = useCallback((globalIndex: number) => {
    setSettings(prev => ({
      ...prev,
      currentTrackIndex: globalIndex,
      isPlaying: true,
    }));
  }, []);

  const setVolume = useCallback((vol: number) => {
    bgmBridge.setVolume(vol);
  }, []);

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
                      {currentTrack?.categoryLabel || "—"} / {settings.isPlaying ? "NOW PLAYING" : "PAUSED"}
                    </div>
                    <div className="text-sm font-black text-pop-yellow truncate drop-shadow-[1px_1px_0_#ff3366]">
                      {currentTrack?.name || "未选择"}
                    </div>
                    {currentTrack?.artist && (
                      <div className="text-[10px] text-white/60 font-bold truncate">
                        by {currentTrack.artist}
                      </div>
                    )}
                    {audioError && (
                      <div className="text-[10px] text-red-400 font-bold mt-0.5">⚠ 音频加载失败</div>
                    )}
                    {isLoading && settings.isPlaying && !audioError && (
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
                      settings.isPlaying
                        ? "bg-pop-pink text-white hover:bg-white hover:text-pop-pink"
                        : "bg-pop-cyan text-pop-black hover:bg-pop-yellow"
                    )}
                    title={settings.isPlaying ? "暂停" : "播放"}
                  >
                    {settings.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
                    const isCurrent = globalIdx === settings.currentTrackIndex;
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
                          {isCurrent && settings.isPlaying ? (
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
                settings.isPlaying
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
