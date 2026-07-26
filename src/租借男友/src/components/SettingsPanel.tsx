import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Volume2, VolumeX, Music, Mic2, Mic2Off, Settings,
  Type, Gauge, Keyboard, Zap, CloudRain,
} from "lucide-react";
import { PopCard } from "./ui/PopCard";
import { cn } from "../utils";
import { useGameContext } from "../state/GameContext";
import { sfx } from "../audio/sfxPlayer";
import { bgmBridge, useBgmSettings } from "../audio/bgmBridge";
import { textSettings, useTextSettings } from "../audio/textSettings";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── 选项定义 ──
const TEXT_SPEED_OPTIONS = [
  { value: 0, label: "瞬间" },
  { value: 1, label: "慢" },
  { value: 2, label: "普通" },
  { value: 3, label: "快" },
];

const AUTO_WAIT_OPTIONS = [
  { value: 0.5, label: "短" },
  { value: 1, label: "普通" },
  { value: 1.5, label: "长" },
  { value: 2, label: "很久" },
];

const BLIP_INTERVAL_OPTIONS = [
  { value: 4, label: "稀疏" },
  { value: 3, label: "正常" },
  { value: 2, label: "密集" },
];

// ── 颜色映射（避免 Tailwind 动态类名问题）──
const ACCENT_COLORS = {
  "pop-cyan": { text: "text-pop-cyan", bg: "bg-pop-cyan" },
  "pop-pink": { text: "text-pop-pink", bg: "bg-pop-pink" },
  "pop-yellow": { text: "text-pop-yellow", bg: "bg-pop-yellow" },
} as const;

type AccentColor = keyof typeof ACCENT_COLORS;

// ── 子组件：音量滑条行 ──
function VolumeRow({
  icon,
  label,
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  volume: number;
  muted: boolean;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  accentColor: AccentColor;
}) {
  const colors = ACCENT_COLORS[accentColor];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("shrink-0", muted ? "text-gray-500" : colors.text)}>
            {icon}
          </span>
          <span className="font-black text-sm uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-xs font-bold text-pop-yellow tabular-nums">
          {muted ? "--" : Math.round(volume * 100)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onMuteToggle}
          className={cn(
            "p-1.5 clip-diagonal pop-border transition-colors shrink-0",
            muted
              ? "bg-gray-600 text-gray-400"
              : cn(colors.bg, "text-pop-black hover:bg-pop-yellow")
          )}
          title={muted ? "取消静音" : "静音"}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 relative h-5 flex items-center">
          <div className="absolute inset-x-0 h-2.5 bg-white/20 clip-diagonal overflow-hidden pop-border">
            <div
              className="h-full bg-stripes-cyan-pink transition-[width] duration-100"
              style={{ width: `${muted ? 0 : volume * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            disabled={muted}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            title={label}
          />
        </div>
      </div>
    </div>
  );
}

// ── 子组件：分段选择器 ──
function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-black uppercase clip-diagonal pop-border transition-all border-2 border-pop-black",
              isActive
                ? "bg-pop-pink text-white shadow-[2px_2px_0_#1a1a1a]"
                : "bg-white/10 text-white/50 hover:bg-white/20"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 设置面板 — 完整 galgame 风格
 *
 * 包含：
 * - BGM 音量 + 静音（与 BgmPlayer 共享 bgmBridge）
 * - 音效(SE) 音量 + 静音（sfxPlayer）
 * - 语音 Blip 开关 + 频率（稀疏/正常/密集）
 * - 文字速度（瞬间/慢/普通/快）
 * - Auto 等待时间（短/普通/长/很久）
 *
 * 所有设置 localStorage 持久化，跨组件实时同步。
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  // ── SFX 设置 ──
  const [sfxVolume, setSfxVolume] = useState(sfx.getVolume());
  const [sfxMuted, setSfxMuted] = useState(sfx.isMuted());
  const [blipEnabled, setBlipEnabled] = useState(sfx.isBlipEnabled());
  const [blipInterval, setBlipInterval] = useState(sfx.getBlipInterval());

  // ── BGM 设置（从 bgmBridge 订阅）──
  const bgmAudio = useBgmSettings();

  // ── 文字设置（从 textSettings 订阅）──
  const { textSpeed, autoWaitMultiplier } = useTextSettings();

  // ── 天气粒子特效开关（从 GameContext 订阅）──
  const { weatherParticlesEnabled, setWeatherParticlesEnabled } = useGameContext();

  // ── Tab 状态 ──
  const [activeTab, setActiveTab] = useState<"audio" | "text">("audio");

  // ── SFX 回调 ──
  const handleSfxVolumeChange = useCallback((v: number) => {
    setSfxVolume(v);
    sfx.setVolume(v);
  }, []);

  const handleSfxMuteToggle = useCallback(() => {
    const newMuted = sfx.toggleMute();
    setSfxMuted(newMuted);
    if (!newMuted) sfx.play("confirm");
  }, []);

  const handleBlipToggle = useCallback(() => {
    const next = !blipEnabled;
    setBlipEnabled(next);
    sfx.setBlipEnabled(next);
    if (next && !sfx.isMuted()) sfx.playBlip("沈千金");
  }, [blipEnabled]);

  const handleBlipIntervalChange = useCallback((v: number) => {
    setBlipInterval(v);
    sfx.setBlipInterval(v);
    // 预览效果
    if (blipEnabled && !sfx.isMuted()) {
      sfx.playBlip("沈千金");
      setTimeout(() => sfx.playBlip("沈千金"), 120);
      setTimeout(() => sfx.playBlip("沈千金"), 240);
    }
  }, [blipEnabled]);

  // ── BGM 回调 ──
  const handleBgmVolumeChange = useCallback((v: number) => {
    bgmBridge.setVolume(v);
  }, []);

  const handleBgmMuteToggle = useCallback(() => {
    bgmBridge.toggleMuted();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-pop-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <PopCard
              skew
              className="bg-pop-black text-white p-0 shadow-pop-pink overflow-hidden relative"
            >
              {/* 半色调装饰 */}
              <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

              {/* 标题栏 */}
              <div className="flex items-center justify-between bg-stripes-cyan-pink px-4 py-3 clip-diagonal relative z-10">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-white drop-shadow-[1px_1px_0_#1a1a1a]" />
                  <span className="font-black text-lg text-white text-stroke-sm italic">SETTINGS</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 bg-pop-pink text-white hover:bg-white hover:text-pop-pink transition-colors clip-diagonal pop-border"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab 切换 */}
              <div className="flex gap-1 px-3 pt-3 relative z-10">
                <button
                  onClick={() => { setActiveTab("audio"); sfx.play("tabSwitch"); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase clip-diagonal pop-border transition-all border-2 border-pop-black",
                    activeTab === "audio"
                      ? "bg-pop-cyan text-pop-black shadow-[2px_2px_0_#1a1a1a]"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  )}
                >
                  <Music className="w-3.5 h-3.5" />
                  音频
                </button>
                <button
                  onClick={() => { setActiveTab("text"); sfx.play("tabSwitch"); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase clip-diagonal pop-border transition-all border-2 border-pop-black",
                    activeTab === "text"
                      ? "bg-pop-pink text-white shadow-[2px_2px_0_#1a1a1a]"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  )}
                >
                  <Type className="w-3.5 h-3.5" />
                  文字
                </button>
              </div>

              {/* 内容区 */}
              <div className="relative z-10 p-4 pt-3 space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar">

                {activeTab === "audio" ? (
                  <>
                    {/* ── BGM 音量 ── */}
                    <VolumeRow
                      icon={<Music className="w-4 h-4" />}
                      label="BGM 音量"
                      volume={bgmAudio.volume}
                      muted={bgmAudio.muted}
                      onVolumeChange={handleBgmVolumeChange}
                      onMuteToggle={handleBgmMuteToggle}
                      accentColor="pop-cyan"
                    />

                    <div className="h-px bg-white/10" />

                    {/* ── SE 音量 ── */}
                    <VolumeRow
                      icon={<Volume2 className="w-4 h-4" />}
                      label="音效 (SE) 音量"
                      volume={sfxVolume}
                      muted={sfxMuted}
                      onVolumeChange={handleSfxVolumeChange}
                      onMuteToggle={handleSfxMuteToggle}
                      accentColor="pop-pink"
                    />

                    <div className="h-px bg-white/10" />

                    {/* ── 语音 Blip ── */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {blipEnabled ? (
                            <Mic2 className="w-4 h-4 text-pop-pink" />
                          ) : (
                            <Mic2Off className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-black text-sm uppercase tracking-wide">语音 Blip</span>
                        </div>
                        <button
                          onClick={handleBlipToggle}
                          className={cn(
                            "relative w-11 h-5 clip-diagonal pop-border transition-colors",
                            blipEnabled ? "bg-pop-pink" : "bg-gray-600"
                          )}
                          title={blipEnabled ? "关闭语音 blip" : "开启语音 blip"}
                        >
                          <motion.div
                            animate={{ x: blipEnabled ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute top-0.5 w-4 h-4 bg-white pop-border"
                          />
                        </button>
                      </div>
                      {blipEnabled && (
                        <div className="space-y-1.5 pl-1">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-3 h-3 text-white/40" />
                            <span className="text-[10px] font-bold text-white/50 uppercase">Blip 频率</span>
                          </div>
                          <SegmentedControl
                            options={BLIP_INTERVAL_OPTIONS}
                            value={blipInterval}
                            onChange={handleBlipIntervalChange}
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed">
                        对话文字出现时伴随的角色语音音效。频率越高（密集）声音越频繁。
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* ── 文字速度 ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Keyboard className="w-4 h-4 text-pop-cyan" />
                        <span className="font-black text-sm uppercase tracking-wide">文字速度</span>
                      </div>
                      <SegmentedControl
                        options={TEXT_SPEED_OPTIONS}
                        value={textSpeed}
                        onChange={(v) => textSettings.setTextSpeed(v)}
                      />
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed">
                        控制打字机效果的速度。选「瞬间」则直接显示全文。
                      </p>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* ── Auto 等待时间 ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-pop-yellow" />
                        <span className="font-black text-sm uppercase tracking-wide">Auto 等待时间</span>
                      </div>
                      <SegmentedControl
                        options={AUTO_WAIT_OPTIONS}
                        value={autoWaitMultiplier}
                        onChange={(v) => textSettings.setAutoWaitMultiplier(v)}
                      />
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed">
                        Auto 模式下，每段对话读完后的等待时间倍率。
                      </p>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* ── 天气粒子特效 ── */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudRain className={cn("w-4 h-4", weatherParticlesEnabled ? "text-pop-cyan" : "text-gray-500")} />
                          <span className="font-black text-sm uppercase tracking-wide">天气粒子特效</span>
                        </div>
                        <button
                          onClick={() => {
                            const next = !weatherParticlesEnabled;
                            setWeatherParticlesEnabled(next);
                            if (next) sfx.play("confirm");
                          }}
                          className={cn(
                            "relative w-11 h-5 clip-diagonal pop-border transition-colors",
                            weatherParticlesEnabled ? "bg-pop-cyan" : "bg-gray-600"
                          )}
                          title={weatherParticlesEnabled ? "关闭粒子特效" : "开启粒子特效"}
                        >
                          <motion.div
                            animate={{ x: weatherParticlesEnabled ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="absolute top-0.5 w-4 h-4 bg-white pop-border"
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed">
                        室外场景的雨/雪/雾/闪电粒子动画。室内外均保留天气对背景的调色滤镜，关闭后仅去除粒子动效以节省性能。
                      </p>
                    </div>
                  </>
                )}

              </div>

              {/* 底部提示 */}
              <div className="relative z-10 px-4 py-2 bg-pop-black/60 border-t-2 border-white/10">
                <p className="text-[9px] text-white/30 font-bold text-center">
                  所有设置自动保存 · 也可以在右下角音乐播放器中控制 BGM
                </p>
              </div>
            </PopCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
