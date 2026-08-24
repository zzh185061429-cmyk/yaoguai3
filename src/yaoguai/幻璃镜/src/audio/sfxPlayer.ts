/**
 * SFX 音效引擎 — 使用 Web Audio API 程序化生成所有音效
 *
 * 零外部音频文件，全部用振荡器/噪声合成
 * 古风 galgame 风格（正弦波/三角波）
 * localStorage 持久化音量设置
 * 支持语音 Blip 开关 + 频率控制
 */

export type SfxId =
  | 'click'           // UI 点击推进
  | 'confirm'         // 选项确认
  | 'tabSwitch'       // Tab 切换
  | 'panelOpen'       // 面板/弹窗打开
  | 'panelClose'      // 面板/弹窗关闭
  | 'pageTurn'        // 楼层翻页
  | 'error'           // 发送/生成失败
  | 'achievementUnlock'; // 成就解锁

// ── 角色语音 blip 频率映射（Hz）──
const CHARACTER_BLIP_FREQ: Record<string, number> = {
  '狐小九': 740,  // 高音
};

const DEFAULT_BLIP_FREQ = 660;

const STORAGE_KEY = 'mirage-sfx-settings';

type SfxSettings = {
  volume: number;       // 0~1
  muted: boolean;
  blipEnabled: boolean; // 语音 blip 开关
  blipInterval: number; // 每 N 个字符响一次 blip (2=密集, 3=正常, 4=稀疏)
};

function loadSettings(): SfxSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        volume: typeof parsed.volume === 'number' ? parsed.volume : 0.3,
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
        blipEnabled: typeof parsed.blipEnabled === 'boolean' ? parsed.blipEnabled : true,
        blipInterval: typeof parsed.blipInterval === 'number' ? parsed.blipInterval : 3,
      };
    }
  } catch {
    // ignore
  }
  return { volume: 0.3, muted: false, blipEnabled: true, blipInterval: 3 };
}

function saveSettings(settings: SfxSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

class SfxEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private settings: SfxSettings;
  private lastBlipTime = 0;
  private blipCharCount = 0;

  constructor() {
    this.settings = loadSettings();

    // 浏览器自动播放策略：AudioContext 必须在用户交互后创建
    if (typeof window !== 'undefined') {
      const initOnce = () => {
        this.init();
        window.removeEventListener('pointerdown', initOnce);
        window.removeEventListener('keydown', initOnce);
      };
      window.addEventListener('pointerdown', initOnce);
      window.addEventListener('keydown', initOnce);
    }
  }

  /** 初始化 AudioContext（延迟到首次用户交互） */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.volume;
      this.masterGain.connect(this.ctx.destination);
      console.info('[幻璃镜-SFX] AudioContext 已初始化');
    } catch (e) {
      console.warn('[幻璃镜-SFX] AudioContext 初始化失败:', e);
    }
  }

  // ── 设置 ──

  getVolume() { return this.settings.volume; }
  isMuted() { return this.settings.muted; }
  isBlipEnabled() { return this.settings.blipEnabled; }
  getBlipInterval() { return this.settings.blipInterval; }

  setVolume(v: number) {
    this.settings.volume = Math.max(0, Math.min(1, v));
    this.updateMasterGain();
    saveSettings(this.settings);
  }

  setMuted(muted: boolean) {
    this.settings.muted = muted;
    this.updateMasterGain();
    saveSettings(this.settings);
  }

  toggleMute() {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  setBlipEnabled(enabled: boolean) {
    this.settings.blipEnabled = enabled;
    saveSettings(this.settings);
  }

  setBlipInterval(interval: number) {
    this.settings.blipInterval = Math.max(2, Math.min(5, interval));
    this.blipCharCount = 0;
    saveSettings(this.settings);
  }

  private updateMasterGain() {
    if (this.masterGain && this.ctx) {
      const target = this.settings.muted ? 0 : this.settings.volume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  // ── 底层合成原语 ──

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue: number = 0.2,
    startOffset: number = 0,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + startOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue: number = 0.2,
    startOffset: number = 0,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + startOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playNoise(
    duration: number,
    filterFreq: number,
    gainValue: number = 0.15,
    filterType: BiquadFilterType = 'bandpass',
    startOffset: number = 0,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + startOffset;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.value = 1;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
    source.stop(now + duration);
  }

  // ── 公开 API ──

  /** 播放指定音效 */
  play(soundId: SfxId) {
    if (!this.ctx || !this.masterGain) return;
    if (this.settings.muted) return;

    switch (soundId) {
      case 'click':
        // 清脆短促的点击声
        this.playSweep(800, 500, 0.04, 'sine', 0.12);
        break;

      case 'confirm':
        // 确认声 — 两音上升
        this.playTone(660, 0.05, 'triangle', 0.15);
        this.playTone(880, 0.08, 'triangle', 0.15, 0.05);
        break;

      case 'tabSwitch':
        // Tab 切换 — 快速噪声扫过
        this.playNoise(0.08, 1500, 0.08, 'highpass');
        break;

      case 'panelOpen':
        // 面板打开 — 上升扫描
        this.playSweep(300, 700, 0.12, 'sine', 0.1);
        break;

      case 'panelClose':
        // 面板关闭 — 下降扫描
        this.playSweep(700, 300, 0.1, 'sine', 0.1);
        break;

      case 'pageTurn':
        // 翻页声 — 短噪声 + 低音
        this.playNoise(0.06, 2000, 0.06, 'highpass');
        this.playTone(400, 0.04, 'triangle', 0.08);
        break;

      case 'error':
        // 错误声 — 双音下降
        this.playTone(330, 0.09, 'square', 0.06);
        this.playTone(220, 0.16, 'square', 0.06, 0.09);
        break;

      case 'achievementUnlock':
        // 成就解锁 — 上升琶音 + 持续高音
        this.playTone(523, 0.08, 'sine', 0.15);
        this.playTone(659, 0.08, 'sine', 0.15, 0.06);
        this.playTone(784, 0.12, 'sine', 0.15, 0.12);
        this.playTone(1047, 0.3, 'sine', 0.12, 0.2);
        this.playTone(1319, 0.4, 'sine', 0.06, 0.2);
        break;
    }
  }

  /**
   * 播放角色语音 blip — 打字机效果配套
   * 内部自动节流：根据 blipInterval 设置每 N 字符响一次
   */
  playBlip(speaker?: string) {
    if (!this.ctx || !this.masterGain) return;
    if (this.settings.muted || !this.settings.blipEnabled) return;

    this.blipCharCount++;
    if (this.blipCharCount % this.settings.blipInterval !== 0) return;

    const now = this.ctx.currentTime;
    if (now - this.lastBlipTime < 0.09) return;
    this.lastBlipTime = now;

    const baseFreq = (speaker && CHARACTER_BLIP_FREQ[speaker]) || DEFAULT_BLIP_FREQ;
    const freq = baseFreq + (Math.random() - 0.5) * 30;

    this.playTone(freq, 0.025, 'sine', 0.06);
  }

  /** 播放情绪音效 */
  playEmotion(emotion: string) {
    if (!this.ctx || !this.masterGain) return;
    if (this.settings.muted) return;

    switch (emotion) {
      case '生气':
        this.playTone(100, 0.15, 'sawtooth', 0.3);
        this.playNoise(0.08, 300, 0.2, 'lowpass');
        break;

      case '惊讶':
        this.playSweep(1200, 600, 0.06, 'sine', 0.15);
        break;

      case '害羞':
        this.playTone(70, 0.1, 'sine', 0.3);
        this.playTone(70, 0.1, 'sine', 0.2, 0.15);
        break;

      case '伤心':
        this.playTone(440, 0.2, 'triangle', 0.15);
        this.playTone(370, 0.4, 'triangle', 0.12, 0.2);
        break;

      case '害怕':
        this.playTone(110, 0.4, 'sawtooth', 0.1);
        this.playTone(116, 0.4, 'sawtooth', 0.06);
        break;

      case '开心':
        this.playTone(523, 0.06, 'sine', 0.15);
        this.playTone(659, 0.06, 'sine', 0.15, 0.06);
        this.playTone(784, 0.1, 'sine', 0.15, 0.12);
        break;

      case '吃醋':
        this.playTone(440, 0.15, 'triangle', 0.12);
        this.playTone(466, 0.15, 'triangle', 0.08);
        break;

      case '嫌弃':
        this.playSweep(500, 200, 0.12, 'sawtooth', 0.1);
        break;
    }
  }
}

// ── 导出单例 ──
export const sfx = new SfxEngine();
