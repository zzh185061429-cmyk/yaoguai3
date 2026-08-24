/**
 * 全局 BGM 播放器单例 — 跨组件生命周期持续播放
 *
 * 设计动机：
 * 原 PhoneMusic / BgmPlayer 各自在 React useEffect 中创建 <audio> 元素，
 * 组件卸载（退出音乐 App）时 audio.pause() 被执行，音乐随即停止。
 *
 * 本单例将 Audio 元素和播放状态提升到组件外部（参照 sfxPlayer.ts 的设计），
 * 无论 PhoneMusic 组件是否挂载，Audio 元素始终存活，音乐可跨界面持续播放。
 *
 * 使用方式：
 *   import { bgmPlayer, useBgmPlayer, BGM_CATEGORIES, ALL_TRACKS } from '../audio/bgmPlayer';
 *   const state = useBgmPlayer();              // React 组件中订阅状态
 *   bgmPlayer.togglePlay();                    // 播放/暂停
 *   bgmPlayer.setTrack(index, true);           // 切歌并自动播放
 *
 * 音量/静音仍由 bgmBridge 统一管理，本单例订阅其变化并同步到 audio 元素。
 */

import { useSyncExternalStore } from 'react';
import { bgmBridge, getEffectiveBgmVolume } from './bgmBridge';

// ── BGM 配置 ──
const BGM_BASE = 'https://cdn.jsdelivr.net/gh/zzh185061429-cmyk/zujie3@main/BGM';

export type BgmCategory = {
  id: string;
  label: string;
  color: string;
  textColor: string;
  tracks: { name: string; artist: string; url: string }[];
};

const enc = (s: string) => encodeURIComponent(s);
const makeUrl = (dir: string, file: string) =>
  `${BGM_BASE}/${enc(dir)}/${enc(file)}`;

// BGM 来源: DOVA-SYNDROME (https://dova-s.jp/) 免费可商用 BGM
export const BGM_CATEGORIES: BgmCategory[] = [
  {
    id: 'daily',
    label: '日常',
    color: 'bg-pop-cyan',
    textColor: 'text-pop-black',
    tracks: [
      { name: 'everyone', artist: 'yuhei komatsu', url: makeUrl('01_日常', '01_everyone-by-yuhei komatsu.mp3') },
      { name: '魔法使いになりたいの！', artist: 'えだまめ88', url: makeUrl('01_日常', '02_魔法使いになりたいの！-by-えだまめ88.mp3') },
      { name: 'トワイライト・ハイウェイ', artist: '秦暁', url: makeUrl('01_日常', '03_トワイライト・ハイウェイ-by-秦暁.mp3') },
      { name: 'Treatise Seven', artist: 'Anonyment', url: makeUrl('01_日常', '04_Treatise Seven-by-Anonyment.mp3') },
      { name: '碧い回路の夜明け', artist: 'しんさんわーくす', url: makeUrl('01_日常', '05_碧い回路の夜明け-by-しんさんわーくす.mp3') },
      { name: 'rise and shine', artist: '山本リョーマ', url: makeUrl('01_日常', '06_rise and shine-by-山本リョーマ.mp3') },
      { name: 'PALETTE', artist: 'yuhei komatsu', url: makeUrl('01_日常', '07_PALETTE-by-yuhei komatsu.mp3') },
      { name: 'poppop', artist: 'Sakuttipanda', url: makeUrl('01_日常', '08_poppop-by-Sakuttipanda.mp3') },
      { name: 'Growing in the Sky', artist: 'shimtone', url: makeUrl('01_日常', '09_Growing in the Sky-by-shimtone.mp3') },
      { name: 'Retail Magic Hour', artist: 'MFP【Marron Fields Production】', url: makeUrl('01_日常', '10_Retail Magic Hour-by-MFP【Marron Fields Production】.mp3') },
      { name: 'After Dark Rag', artist: 'MFP【Marron Fields Production】', url: makeUrl('01_日常', '11_After Dark Rag-by-MFP【Marron Fields Production】.mp3') },
      { name: 'Plumeria', artist: 'SHUNTA', url: makeUrl('01_日常', '12_Plumeria-by-SHUNTA.mp3') },
      { name: 'Blue and Bright', artist: 'Fukagawa', url: makeUrl('01_日常', '13_Blue and Bright-by-Fukagawa.mp3') },
      { name: 'のどかな一日', artist: 'のる', url: makeUrl('01_日常', '14_のどかな一日-by-のる.mp3') },
      { name: 'Happy Happy Road', artist: 'FLASH☆BEAT', url: makeUrl('01_日常', '15_Happy Happy  Road-by-FLASH☆BEAT.mp3') },
    ],
  },
  {
    id: 'romance',
    label: '恋爱',
    color: 'bg-pop-pink',
    textColor: 'text-white',
    tracks: [
      { name: 'Music has not died', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '01_Music has not died-by-蒲鉾さちこ.mp3') },
      { name: 'Melancholy autumn rainy day', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '02_Melancholy autumn rainy day-by-蒲鉾さちこ.mp3') },
      { name: '静かな海鳴り', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '03_静かな海鳴り-by-蒲鉾さちこ.mp3') },
      { name: 'Luminous time', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '04_Luminous time-by-蒲鉾さちこ.mp3') },
      { name: '波打つ鼓動', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '05_波打つ鼓動-by-蒲鉾さちこ.mp3') },
      { name: '柔らかな温もり', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '06_柔らかな温もり-by-蒲鉾さちこ.mp3') },
      { name: 'つながる笑顔', artist: 'こばっと', url: makeUrl('02_恋爱温馨', '07_つながる笑顔-by-こばっと.mp3') },
      { name: 'BGM - 030 - I Think Of You', artist: 'Sound Of Incense', url: makeUrl('02_恋爱温馨', '08_BGM - 030 - I Think Of You-by-Sound Of Incense.mp3') },
      { name: '優しい憂雨に', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '09_優しい憂雨に-by-蒲鉾さちこ.mp3') },
      { name: '夕風と君', artist: 'のる', url: makeUrl('02_恋爱温馨', '10_夕風と君-by-のる.mp3') },
      { name: '優しい窓辺', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '11_優しい窓辺-by-蒲鉾さちこ.mp3') },
      { name: '冬の訪れ', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '12_冬の訪れ-by-蒲鉾さちこ.mp3') },
      { name: '優しくなれたら', artist: '蒲鉾さちこ', url: makeUrl('02_恋爱温馨', '13_優しくなれたら-by-蒲鉾さちこ.mp3') },
    ],
  },
  {
    id: 'comedy',
    label: '搞笑',
    color: 'bg-pop-yellow',
    textColor: 'text-pop-black',
    tracks: [
      { name: 'Cheerful Chase', artist: 'MFP【Marron Fields Production】', url: makeUrl('03_搞笑', '01_Cheerful Chase-by-MFP【Marron Fields Production】.mp3') },
      { name: '失敗は時として…？', artist: 'のる', url: makeUrl('03_搞笑', '02_失敗は時として…？-by-のる.mp3') },
      { name: 'わいわいミュージック・タイム', artist: 'こばっと', url: makeUrl('03_搞笑', '03_わいわいミュージック・タイム-by-こばっと.mp3') },
      { name: 'That Goober', artist: 'MFP【Marron Fields Production】', url: makeUrl('03_搞笑', '04_That Goober-by-MFP【Marron Fields Production】.mp3') },
      { name: 'なんでやねん', artist: 'のる', url: makeUrl('03_搞笑', '05_なんでやねん-by-のる.mp3') },
      { name: "Pickin' Pickles", artist: 'MFP【Marron Fields Production】', url: makeUrl('03_搞笑', "06_Pickin' Pickles-by-MFP【Marron Fields Production】.mp3") },
      { name: 'ピンチだ！どうする！？どうにかなれっ！！', artist: 'マイマイシ', url: makeUrl('03_搞笑', '07_ピンチだ！どうする！？どうにかなれっ！！-by-マイマイシ.mp3') },
      { name: 'Cheery Cakewalk', artist: 'MFP【Marron Fields Production】', url: makeUrl('03_搞笑', '08_Cheery Cakewalk-by-MFP【Marron Fields Production】.mp3') },
      { name: 'わんぱく大行進', artist: 'こばっと', url: makeUrl('03_搞笑', '09_わんぱく大行進-by-こばっと.mp3') },
      { name: '自慢話', artist: 'Sakuttipanda', url: makeUrl('03_搞笑', '10_自慢話-by-Sakuttipanda.mp3') },
      { name: 'おてんばジェニファー', artist: 'のる', url: makeUrl('03_搞笑', '11_おてんばジェニファー-by-のる.mp3') },
    ],
  },
];

// 所有曲目的扁平列表
export const ALL_TRACKS = BGM_CATEGORIES.flatMap(cat =>
  cat.tracks.map(t => ({ ...t, categoryId: cat.id, categoryLabel: cat.label })),
);

// ── localStorage 持久化（仅存储曲目索引，不自动恢复播放状态）──
const STORAGE_KEY = 'rent-boyfriend-bgm-settings-v3';

type PersistedSettings = {
  currentTrackIndex: number;
};

function loadPersisted(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentTrackIndex:
          typeof parsed.currentTrackIndex === 'number' ? parsed.currentTrackIndex : 0,
      };
    }
  } catch {
    // ignore
  }
  return { currentTrackIndex: 0 };
}

function savePersisted(settings: PersistedSettings) {
  try {
    // 保留旧格式的 isPlaying 字段（始终为 false），兼容可能读取旧 key 的代码
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...settings, isPlaying: false }),
    );
  } catch {
    // ignore
  }
}

// ── 播放器状态 ──
export type BgmPlayerState = {
  currentTrackIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
};

// ── 全局单例引擎 ──
class BgmPlayerEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<() => void>();
  private state: BgmPlayerState;
  /** 标记是否已绑定 audio 事件监听 */
  private audioEventsBound = false;
  /** 标记是否已订阅 bgmBridge 音量变化 */
  private volumeSyncBound = false;

  constructor() {
    const persisted = loadPersisted();
    this.state = {
      currentTrackIndex: Math.max(0, Math.min(persisted.currentTrackIndex, ALL_TRACKS.length - 1)),
      isPlaying: false, // 不自动恢复播放状态（浏览器自动播放策略限制）
      isLoading: false,
      hasError: false,
    };

    // 整个前端界面卸载时暂停播放（pagehide 是酒馆助手推荐的卸载事件）
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        this.pause();
      });
    }
  }

  // ── Pub-Sub ──
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  };

  getState = (): BgmPlayerState => this.state;

  private setState(partial: Partial<BgmPlayerState>) {
    this.state = { ...this.state, ...partial };
    // 持久化曲目索引
    if (partial.currentTrackIndex !== undefined) {
      savePersisted({ currentTrackIndex: this.state.currentTrackIndex });
    }
    this.listeners.forEach(fn => fn());
  }

  // ── 懒初始化 Audio 元素 ──
  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'metadata';
      audio.volume = getEffectiveBgmVolume();
      this.audio = audio;
      this.bindAudioEvents();
      this.bindVolumeSync();

      // 如果已有当前曲目，设置 src
      const track = ALL_TRACKS[this.state.currentTrackIndex];
      if (track) {
        this.state = { ...this.state, isLoading: true };
        audio.src = track.url;
        audio.load();
      }

      console.info('[BGM] Audio 元素已创建');
    }
    return this.audio;
  }

  // ── 绑定 audio 元素事件（仅一次）──
  private bindAudioEvents() {
    if (this.audioEventsBound || !this.audio) return;
    this.audioEventsBound = true;

    const audio = this.audio;

    audio.addEventListener('canplay', () => {
      this.setState({ isLoading: false });
      // 如果应该播放但还没在播放，自动播放
      if (this.state.isPlaying && audio.paused) {
        audio.play().catch(() => {
          this.setState({ hasError: true, isPlaying: false });
        });
      }
    });

    audio.addEventListener('error', () => {
      this.setState({ isLoading: false, hasError: true, isPlaying: false });
    });

    // 播放结束（loop=true 时不会触发，但以防万一）
    audio.addEventListener('ended', () => {
      this.setState({ isPlaying: false });
    });
  }

  // ── 订阅 bgmBridge 音量变化，同步到 audio 元素 ──
  private bindVolumeSync() {
    if (this.volumeSyncBound) return;
    this.volumeSyncBound = true;
    bgmBridge.subscribe(() => {
      if (this.audio) {
        this.audio.volume = getEffectiveBgmVolume();
      }
    });
  }

  // ── 播放控制 ──

  /** 开始播放（懒初始化 audio 元素）*/
  play() {
    const audio = this.ensureAudio();
    this.setState({ isPlaying: true, hasError: false });
    // 只有在音频已就绪时才 play，否则等 canplay 事件自动播放
    if (audio.readyState >= 2) {
      audio.play().catch(() => {
        this.setState({ hasError: true, isPlaying: false });
      });
    }
  }

  /** 暂停播放（不销毁 audio 元素）*/
  pause() {
    if (this.audio) {
      this.audio.pause();
    }
    this.setState({ isPlaying: false });
  }

  /** 切换播放/暂停 */
  togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 切换到指定曲目
   * @param index 全局曲目索引
   * @param autoplay 是否自动播放（默认保持当前播放状态）
   */
  setTrack(index: number, autoplay?: boolean) {
    const clamped = Math.max(0, Math.min(index, ALL_TRACKS.length - 1));
    const audio = this.ensureAudio();
    const track = ALL_TRACKS[clamped];

    this.setState({
      currentTrackIndex: clamped,
      isLoading: true,
      hasError: false,
    });

    if (track) {
      audio.src = track.url;
      audio.load();
    }

    // 决定是否播放
    const shouldPlay = autoplay ?? this.state.isPlaying;
    if (shouldPlay) {
      this.play();
    }
  }

  /** 下一曲（保持当前播放状态）*/
  next() {
    const nextIndex = (this.state.currentTrackIndex + 1) % ALL_TRACKS.length;
    this.setTrack(nextIndex);
  }

  /** 上一曲（保持当前播放状态）*/
  prev() {
    const prevIndex =
      (this.state.currentTrackIndex - 1 + ALL_TRACKS.length) % ALL_TRACKS.length;
    this.setTrack(prevIndex);
  }
}

// ── 导出单例 ──
export const bgmPlayer = new BgmPlayerEngine();

// ── React Hook ──
export function useBgmPlayer(): BgmPlayerState {
  return useSyncExternalStore(bgmPlayer.subscribe, bgmPlayer.getState);
}
