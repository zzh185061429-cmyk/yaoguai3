import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Volume2, VolumeX, Music, Mic2, MicVocal, Settings,
  Type, Gauge, Keyboard, Zap, CloudRain,
  Monitor, Smartphone,
} from 'lucide-react';
import { cn } from '../../utils';
import { useGameContext } from '../../store/GameContext';
import { sfx } from '../../audio/sfxPlayer';
import { bgmBridge, useBgmSettings } from '../../audio/bgmBridge';
import { textSettings, useTextSettings } from '../../audio/textSettings';
import { useMobileMode, setMobileMode } from '../../hooks';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── 选项定义 ──
const TEXT_SPEED_OPTIONS = [
  { value: 0, label: '瞬间' },
  { value: 1, label: '慢' },
  { value: 2, label: '普通' },
  { value: 3, label: '快' },
];

const AUTO_WAIT_OPTIONS = [
  { value: 0.5, label: '短' },
  { value: 1, label: '普通' },
  { value: 1.5, label: '长' },
  { value: 2, label: '很久' },
];

const BLIP_INTERVAL_OPTIONS = [
  { value: 4, label: '稀疏' },
  { value: 3, label: '正常' },
  { value: 2, label: '密集' },
];

// ── 颜色映射（避免 Tailwind 动态类名问题）──
const ACCENT_COLORS = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-600', bgHover: 'hover:bg-cyan-500' },
  gold: { text: 'text-gold-400', bg: 'bg-gold-600', bgHover: 'hover:bg-gold-500' },
  vermilion: { text: 'text-vermilion-400', bg: 'bg-vermilion-600', bgHover: 'hover:bg-vermilion-500' },
} as const;

type AccentColor = keyof typeof ACCENT_COLORS;

// ── 子组件：音量滑条行 ──
function VolumeRow({
  icon, label, volume, muted, onVolumeChange, onMuteToggle, accentColor,
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
          <span className={cn('shrink-0', muted ? 'text-ink-500' : colors.text)}>
            {icon}
          </span>
          <span className="font-serif text-sm tracking-wide text-paper-200">{label}</span>
        </div>
        <span className="text-xs font-sans text-gold-300 tabular-nums">
          {muted ? '--' : Math.round(volume * 100)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onMuteToggle}
          className={cn(
            'p-1.5 rounded transition-colors shrink-0 border',
            muted
              ? 'bg-ink-700 text-ink-500 border-ink-600'
              : cn(colors.bg, 'text-paper-100 border-transparent', colors.bgHover)
          )}
          title={muted ? '取消静音' : '静音'}
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 relative h-5 flex items-center">
          <div className="absolute inset-x-0 h-2 bg-ink-700 rounded-full overflow-hidden border border-ink-600">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-[width] duration-100"
              style={{ width: `${muted ? 0 : volume * 100}%` }}
            />
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
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
  options, value, onChange,
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
              'px-3 py-1.5 text-xs font-serif tracking-wide rounded transition-all border',
              isActive
                ? 'bg-cyan-700 text-cyan-100 border-cyan-500 shadow-[0_0_8px_rgba(48,143,143,0.3)]'
                : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── 子组件：开关按钮 ──
function ToggleSwitch({ enabled, onClick, accentColor = 'cyan' }: {
  enabled: boolean;
  onClick: () => void;
  accentColor?: AccentColor;
}) {
  const colors = ACCENT_COLORS[accentColor];
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-11 h-5 rounded-full transition-colors border',
        enabled ? cn(colors.bg, 'border-transparent') : 'bg-ink-700 border-ink-600'
      )}
      title={enabled ? '关闭' : '开启'}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute top-0.5 w-4 h-4 bg-paper-100 rounded-full"
      />
    </button>
  );
}

/**
 * 设置面板 — 古风 galgame 风格
 *
 * 包含三个 Tab：
 * - 音频：BGM 音量/静音、SE 音量/静音、语音 Blip 开关 + 频率
 * - 文字：文字速度、Auto 等待时间、天气粒子特效
 * - 显示：显示模式（自动/桌面/手机）
 *
 * 所有设置 localStorage 持久化，跨组件实时同步。
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
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

  // ── 显示模式 ──
  const mobileMode = useMobileMode();

  // ── Tab 状态 ──
  const [activeTab, setActiveTab] = useState<'audio' | 'text' | 'display'>('audio');

  // ── SFX 回调 ──
  const handleSfxVolumeChange = useCallback((v: number) => {
    setSfxVolume(v);
    sfx.setVolume(v);
  }, []);

  const handleSfxMuteToggle = useCallback(() => {
    const newMuted = sfx.toggleMute();
    setSfxMuted(newMuted);
    if (!newMuted) sfx.play('confirm');
  }, []);

  const handleBlipToggle = useCallback(() => {
    const next = !blipEnabled;
    setBlipEnabled(next);
    sfx.setBlipEnabled(next);
    if (next && !sfx.isMuted()) sfx.playBlip('狐小九');
  }, [blipEnabled]);

  const handleBlipIntervalChange = useCallback((v: number) => {
    setBlipInterval(v);
    sfx.setBlipInterval(v);
    if (blipEnabled && !sfx.isMuted()) {
      sfx.playBlip('狐小九');
      setTimeout(() => sfx.playBlip('狐小九'), 120);
      setTimeout(() => sfx.playBlip('狐小九'), 240);
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
          className="fixed inset-0 z-60 flex items-center justify-center bg-ink-900/85 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-ink-800 border border-ink-700/50 rounded-2xl shadow-2xl overflow-hidden relative"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between bg-ink-900/80 px-5 py-4 border-b border-ink-700/50 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-gold-500" />
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span className="font-serif text-lg text-paper-100 tracking-widest">设置</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-paper-200 hover:text-vermilion-400 transition-colors rounded-full hover:bg-ink-700/50"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-1 px-4 pt-4">
              <button
                onClick={() => { setActiveTab('audio'); sfx.play('tabSwitch'); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif tracking-wide rounded transition-all border',
                  activeTab === 'audio'
                    ? 'bg-cyan-700 text-cyan-100 border-cyan-500'
                    : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
                )}
              >
                <Music className="w-3.5 h-3.5" />
                音频
              </button>
              <button
                onClick={() => { setActiveTab('text'); sfx.play('tabSwitch'); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif tracking-wide rounded transition-all border',
                  activeTab === 'text'
                    ? 'bg-gold-700 text-gold-100 border-gold-500'
                    : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
                )}
              >
                <Type className="w-3.5 h-3.5" />
                文字
              </button>
              <button
                onClick={() => { setActiveTab('display'); sfx.play('tabSwitch'); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif tracking-wide rounded transition-all border',
                  activeTab === 'display'
                    ? 'bg-vermilion-700 text-vermilion-100 border-vermilion-500'
                    : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                显示
              </button>
            </div>

            {/* 内容区 */}
            <div className="p-5 pt-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">

              {activeTab === 'audio' ? (
                <>
                  {/* ── BGM 音量 ── */}
                  <VolumeRow
                    icon={<Music className="w-4 h-4" />}
                    label="背景音乐 (BGM)"
                    volume={bgmAudio.volume}
                    muted={bgmAudio.muted}
                    onVolumeChange={handleBgmVolumeChange}
                    onMuteToggle={handleBgmMuteToggle}
                    accentColor="cyan"
                  />

                  <div className="h-px bg-ink-700/50" />

                  {/* ── SE 音量 ── */}
                  <VolumeRow
                    icon={<Volume2 className="w-4 h-4" />}
                    label="音效 (SE)"
                    volume={sfxVolume}
                    muted={sfxMuted}
                    onVolumeChange={handleSfxVolumeChange}
                    onMuteToggle={handleSfxMuteToggle}
                    accentColor="vermilion"
                  />

                  <div className="h-px bg-ink-700/50" />

                  {/* ── 语音 Blip ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {blipEnabled
                          ? <Mic2 className="w-4 h-4 text-vermilion-400" />
                          : <MicVocal className="w-4 h-4 text-ink-500" />}
                        <span className="font-serif text-sm tracking-wide text-paper-200">语音 Blip</span>
                      </div>
                      <ToggleSwitch
                        enabled={blipEnabled}
                        onClick={handleBlipToggle}
                        accentColor="vermilion"
                      />
                    </div>
                    {blipEnabled && (
                      <div className="space-y-1.5 pl-1">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3 h-3 text-paper-200/40" />
                          <span className="text-[10px] font-sans text-paper-200/50 tracking-wide">Blip 频率</span>
                        </div>
                        <SegmentedControl
                          options={BLIP_INTERVAL_OPTIONS}
                          value={blipInterval}
                          onChange={handleBlipIntervalChange}
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-paper-200/40 leading-relaxed">
                      对话文字出现时伴随的角色语音音效。频率越高（密集）声音越频繁。
                    </p>
                  </div>
                </>
              ) : activeTab === 'text' ? (
                <>
                  {/* ── 文字速度 ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-cyan-400" />
                      <span className="font-serif text-sm tracking-wide text-paper-200">文字速度</span>
                    </div>
                    <SegmentedControl
                      options={TEXT_SPEED_OPTIONS}
                      value={textSpeed}
                      onChange={(v) => textSettings.setTextSpeed(v)}
                    />
                    <p className="text-[10px] text-paper-200/40 leading-relaxed">
                      控制打字机效果的速度。选「瞬间」则直接显示全文。
                    </p>
                  </div>

                  <div className="h-px bg-ink-700/50" />

                  {/* ── Auto 等待时间 ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold-400" />
                      <span className="font-serif text-sm tracking-wide text-paper-200">Auto 等待时间</span>
                    </div>
                    <SegmentedControl
                      options={AUTO_WAIT_OPTIONS}
                      value={autoWaitMultiplier}
                      onChange={(v) => textSettings.setAutoWaitMultiplier(v)}
                    />
                    <p className="text-[10px] text-paper-200/40 leading-relaxed">
                      Auto 模式下，每段对话读完后的等待时间倍率。
                    </p>
                  </div>

                  <div className="h-px bg-ink-700/50" />

                  {/* ── 天气粒子特效 ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloudRain className={cn('w-4 h-4', weatherParticlesEnabled ? 'text-cyan-400' : 'text-ink-500')} />
                        <span className="font-serif text-sm tracking-wide text-paper-200">氛围粒子特效</span>
                      </div>
                      <ToggleSwitch
                        enabled={weatherParticlesEnabled}
                        onClick={() => {
                          const next = !weatherParticlesEnabled;
                          setWeatherParticlesEnabled(next);
                          if (next) sfx.play('confirm');
                        }}
                        accentColor="cyan"
                      />
                    </div>
                    <p className="text-[10px] text-paper-200/40 leading-relaxed">
                      场景中的浮尘、火星等氛围粒子动画。关闭后仅去除粒子动效以节省性能。
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* ── 显示模式 ── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-vermilion-400" />
                      <span className="font-serif text-sm tracking-wide text-paper-200">显示模式</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {/* 自动 */}
                      <button
                        onClick={() => { setMobileMode(null); sfx.play('confirm'); }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded transition-all border',
                          mobileMode === null
                            ? 'bg-vermilion-700 text-vermilion-100 border-vermilion-500 shadow-[0_0_8px_rgba(214,61,46,0.2)]'
                            : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
                        )}
                      >
                        <Zap className="w-5 h-5" />
                        <span className="text-xs font-serif tracking-wide">自动</span>
                      </button>
                      {/* 桌面 */}
                      <button
                        onClick={() => { setMobileMode(false); sfx.play('confirm'); }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded transition-all border',
                          mobileMode === false
                            ? 'bg-cyan-700 text-cyan-100 border-cyan-500 shadow-[0_0_8px_rgba(48,143,143,0.2)]'
                            : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
                        )}
                      >
                        <Monitor className="w-5 h-5" />
                        <span className="text-xs font-serif tracking-wide">桌面</span>
                      </button>
                      {/* 手机 */}
                      <button
                        onClick={() => { setMobileMode(true); sfx.play('confirm'); }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded transition-all border',
                          mobileMode === true
                            ? 'bg-gold-700 text-gold-100 border-gold-500 shadow-[0_0_8px_rgba(212,183,90,0.2)]'
                            : 'bg-ink-700/50 text-paper-200/50 border-ink-600/50 hover:bg-ink-700 hover:text-paper-200'
                        )}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs font-serif tracking-wide">手机</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-paper-200/40 leading-relaxed">
                      手机模式模拟竖屏手机体验（居中窄屏），桌面模式使用宽屏布局，自动模式根据屏幕宽度智能切换。
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* 底部提示 */}
            <div className="px-5 py-3 bg-ink-900/60 border-t border-ink-700/50">
              <p className="text-[9px] text-paper-200/30 font-sans text-center tracking-wide">
                所有设置自动保存 · 也可以在右下角音乐播放器中控制 BGM
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
