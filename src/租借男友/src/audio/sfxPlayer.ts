/**
 * SFX 音效引擎 — 使用 Web Audio API 程序化生成所有音效
 *
 * 特点：
 * - 零外部音频文件，全部用振荡器/噪声合成
 * - 经典 galgame 风格（方波/三角波电子音）
 * - SFX 音量/静音与 BGM 完全独立
 * - 打字机 blip 按角色区分音高
 * - localStorage 持久化设置
 *
 * 使用方式：
 *   import { sfx } from '../audio/sfxPlayer';
 *   sfx.play('click');           // 播放 UI 音效
 *   sfx.playBlip('沈千金');       // 播放角色语音 blip
 *   sfx.playEmotion('生气');     // 播放情绪音效
 */

// ── 音效 ID 类型 ──
export type SfxId =
  | 'click'           // UI 点击推进
  | 'confirm'         // 选项确认
  | 'tabSwitch'       // Tab 切换
  | 'panelOpen'       // 面板/弹窗打开
  | 'panelClose'      // 面板/弹窗关闭
  | 'pageTurn'        // 楼层翻页
  | 'toastNormal'     // 普通通知
  | 'toastAlert'      // 警告通知
  | 'diceRoll'        // 骰子滚动
  | 'dispatchAccept'  // 接单成功（金币声）
  | 'cgUnlock'        // CG 解锁
  | 'nsfwEnter'       // 进入 NSFW
  | 'nsfwExit'        // 退出 NSFW
  | 'send'            // 消息发送
  | 'error'           // 错误
  | 'achievementUnlock'; // 成就解锁 — 金色"叮"声

// ── 角色语音 blip 频率映射（Hz）──
// 根据角色性格/声线特征分配音高
const CHARACTER_BLIP_FREQ: Record<string, number> = {
  沈千金: 740,   // 千金小姐 — 高音
  温知晚: 620,   // 温柔 — 中高
  椎名律: 560,   // 音乐生 — 中
  周念安: 500,   // 邻家 — 中
  裴今歌: 700,   // 明星 — 高
  姜朝渔: 460,   // 女总裁 — 中低
  傅霁: 420,     // 慵懒 — 低
  罗兰: 400,     // 骑士 — 低
  霍千黎: 640,   // 大小姐 — 中高
  季明舒: 580,   // 温柔 — 中
  步玲燕: 760,   // 活泼 — 高
  陆时予: 440,   // 沉稳 — 中低
};

// ── 默认 blip 频率（<user> / 旁白 / 未知角色）──
const DEFAULT_BLIP_FREQ = 500;

// ── localStorage 键名 ──
const STORAGE_KEY = 'rent-boyfriend-sfx-settings';

type SfxSettings = {
  volume: number;       // 0~1
  muted: boolean;       // 静音
  blipEnabled: boolean; // 语音 blip 开关
  blipInterval: number; // 每 N 个字符响一次 blip (2=密集, 3=正常, 4=稀疏)
};

function loadSettings(): SfxSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        volume: typeof parsed.volume === 'number' ? parsed.volume : 0.4,
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
        blipEnabled: typeof parsed.blipEnabled === 'boolean' ? parsed.blipEnabled : true,
        blipInterval: typeof parsed.blipInterval === 'number' ? parsed.blipInterval : 3,
      };
    }
  } catch {
    // ignore
  }
  return { volume: 0.4, muted: false, blipEnabled: true, blipInterval: 3 };
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
  private blipCharCount = 0; // 用于 blip 节流

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
      // 可能处于 suspended 状态（如用户切回标签页）
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
      console.info('[SFX] AudioContext 已初始化');
    } catch (e) {
      console.warn('[SFX] AudioContext 初始化失败:', e);
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
    this.blipCharCount = 0; // 重置计数器
    saveSettings(this.settings);
  }

  private updateMasterGain() {
    if (this.masterGain && this.ctx) {
      const target = this.settings.muted ? 0 : this.settings.volume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  // ── 底层合成原语 ──

  /** 播放一个单音 */
  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
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

  /** 播放频率扫描音（从 startFreq 到 endFreq） */
  private playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'square',
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

  /** 播放滤波噪声 */
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
        // 清脆短促的点击声 — 方波快速下降
        this.playSweep(900, 500, 0.03, 'square', 0.15);
        break;

      case 'confirm':
        // 确认声 — 两音上升
        this.playTone(660, 0.05, 'square', 0.18);
        this.playTone(880, 0.08, 'square', 0.18, 0.05);
        break;

      case 'tabSwitch':
        // Tab 切换 — 快速噪声扫过
        this.playNoise(0.08, 1500, 0.1, 'highpass');
        break;

      case 'panelOpen':
        // 面板打开 — 上升扫描
        this.playSweep(300, 800, 0.12, 'triangle', 0.12);
        break;

      case 'panelClose':
        // 面板关闭 — 下降扫描
        this.playSweep(800, 300, 0.1, 'triangle', 0.12);
        break;

      case 'pageTurn':
        // 翻页声 — 短噪声 + 低音
        this.playNoise(0.06, 2000, 0.08, 'highpass');
        this.playTone(400, 0.04, 'triangle', 0.1);
        break;

      case 'toastNormal':
        // 普通通知 — 两音叮咚
        this.playTone(784, 0.08, 'sine', 0.15);
        this.playTone(1047, 0.12, 'sine', 0.12, 0.08);
        break;

      case 'toastAlert':
        // 警告通知 — 下降三音
        this.playTone(660, 0.1, 'square', 0.15);
        this.playTone(550, 0.1, 'square', 0.15, 0.1);
        this.playTone(440, 0.15, 'square', 0.15, 0.2);
        break;

      case 'diceRoll':
        // 骰子滚动 — 连续随机短噪声
        for (let i = 0; i < 8; i++) {
          this.playTone(
            200 + Math.random() * 400,
            0.02,
            'square',
            0.08,
            i * 0.05,
          );
        }
        break;

      case 'dispatchAccept':
        // 接单成功 — 金币声（两个高频金属音）
        this.playTone(1318, 0.08, 'sine', 0.2);
        this.playTone(1568, 0.12, 'sine', 0.18, 0.08);
        this.playTone(2093, 0.1, 'sine', 0.12, 0.12);
        break;

      case 'cgUnlock':
        // CG 解锁 — 上升琶音
        [523, 659, 784, 1047].forEach((f, i) => {
          this.playTone(f, 0.1, 'sine', 0.15, i * 0.06);
        });
        break;

      case 'nsfwEnter':
        // 进入 NSFW — 低沉感性音
        this.playTone(220, 0.3, 'sine', 0.18);
        this.playTone(330, 0.4, 'sine', 0.12, 0.1);
        break;

      case 'nsfwExit':
        // 退出 NSFW — 反向消退
        this.playTone(330, 0.15, 'sine', 0.15);
        this.playTone(220, 0.25, 'sine', 0.12, 0.1);
        break;

      case 'send':
        // 消息发送 — 上升确认音
        this.playTone(587, 0.04, 'square', 0.15);
        this.playTone(784, 0.06, 'square', 0.15, 0.04);
        break;

      case 'error':
        // 错误 — 低沉短促
        this.playTone(200, 0.15, 'sawtooth', 0.18);
        break;

      case 'achievementUnlock':
        // 成就解锁 — 金色"叮"声：上升琶音 + 持续高音光辉感
        this.playTone(523, 0.08, 'sine', 0.18);
        this.playTone(659, 0.08, 'sine', 0.18, 0.06);
        this.playTone(784, 0.12, 'sine', 0.18, 0.12);
        this.playTone(1047, 0.3, 'sine', 0.14, 0.2);
        this.playTone(1319, 0.4, 'sine', 0.08, 0.2);
        break;
    }
  }

  /**
   * 播放角色语音 blip — 打字机效果配套
   * 内部自动节流：根据 blipInterval 设置每 N 字符响一次
   * 时间节流：最小间隔 90ms，避免太密刺耳
   */
  playBlip(charName?: string) {
    if (!this.ctx || !this.masterGain) return;
    if (this.settings.muted || !this.settings.blipEnabled) return;

    // 字符节流：每 blipInterval 个字符响一次
    this.blipCharCount++;
    if (this.blipCharCount % this.settings.blipInterval !== 0) return;

    // 时间节流：最小间隔 90ms（比之前 50ms 更宽松，减少疲劳感）
    const now = this.ctx.currentTime;
    if (now - this.lastBlipTime < 0.09) return;
    this.lastBlipTime = now;

    const baseFreq = (charName && CHARACTER_BLIP_FREQ[charName]) || DEFAULT_BLIP_FREQ;
    // 轻微随机变化，避免机械感
    const freq = baseFreq + (Math.random() - 0.5) * 30;

    this.playTone(freq, 0.022, 'square', 0.07);
  }

  /** 播放情绪音效 — 与 EMOTION_EFFECTS 配套 */
  playEmotion(emotion: string) {
    if (!this.ctx || !this.masterGain) return;
    if (this.settings.muted) return;

    switch (emotion) {
      case '生气':
        // 低频冲击 + 噪声爆
        this.playTone(80, 0.15, 'sine', 0.4);
        this.playNoise(0.08, 300, 0.25, 'lowpass');
        break;

      case '惊讶':
        // 快速高频 zap
        this.playSweep(1400, 600, 0.06, 'square', 0.2);
        break;

      case '害羞':
        // 双重心跳
        this.playTone(60, 0.1, 'sine', 0.35);
        this.playTone(60, 0.1, 'sine', 0.25, 0.15);
        break;

      case '伤心':
        // 下降小调三度
        this.playTone(440, 0.2, 'triangle', 0.18);
        this.playTone(370, 0.4, 'triangle', 0.15, 0.2);
        break;

      case '害怕':
        // 低频不协和持续音
        this.playTone(110, 0.5, 'sawtooth', 0.12);
        this.playTone(116, 0.5, 'sawtooth', 0.08);
        break;

      case '开心':
        // 上升大调琶音
        this.playTone(523, 0.06, 'square', 0.18);
        this.playTone(659, 0.06, 'square', 0.18, 0.06);
        this.playTone(784, 0.1, 'square', 0.18, 0.12);
        break;

      case '吃醋':
        // 小二度不协和
        this.playTone(440, 0.15, 'triangle', 0.14);
        this.playTone(466, 0.15, 'triangle', 0.1);
        break;

      case '嫌弃':
        // 下降短促
        this.playSweep(500, 200, 0.12, 'sawtooth', 0.12);
        break;

      case '害怕':
        break; // 已处理
    }
  }
}

// ── 导出单例 ──
export const sfx = new SfxEngine();
