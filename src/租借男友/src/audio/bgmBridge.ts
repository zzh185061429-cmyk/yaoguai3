/**
 * BGM 音量/静音共享状态 — 桥接 SettingsPanel 与 BgmPlayer
 *
 * 设计动机：
 * BgmPlayer 内部管理 <audio> 元素，但 SettingsPanel 也需要控制 BGM 音量/静音。
 * 通过这个轻量 pub-sub store，两者可以读写同一份 BGM 音频设置。
 *
 * 使用方式：
 *   import { bgmBridge, useBgmSettings } from '../audio/bgmBridge';
 *   bgmBridge.setVolume(0.5);        // 写入音量
 *   bgmBridge.setMuted(true);        // 静音
 *   const { volume, muted } = useBgmSettings();  // React 组件中订阅
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'rent-boyfriend-bgm-audio-settings';

type BgmAudioSettings = {
  volume: number; // 0~1
  muted: boolean;
};

// ── 迁移：从旧的 BgmPlayer localStorage key 读取已有音量 ──
function migrateFromOldKey(): number | null {
  try {
    const raw = localStorage.getItem('rent-boyfriend-bgm-settings-v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.volume === 'number') return parsed.volume;
    }
  } catch {
    // ignore
  }
  return null;
}

function loadSettings(): BgmAudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        volume: typeof parsed.volume === 'number' ? parsed.volume : 0.4,
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
      };
    }
  } catch {
    // ignore
  }
  // 尝试从旧 key 迁移音量
  const migrated = migrateFromOldKey();
  return { volume: migrated ?? 0.4, muted: false };
}

function saveSettings(settings: BgmAudioSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ── Pub-Sub ──
const listeners = new Set<() => void>();
let state: BgmAudioSettings = loadSettings();

function notify() {
  listeners.forEach(fn => fn());
}

/** 实际应用到 audio 元素的音量（静音时为 0） */
export function getEffectiveBgmVolume(): number {
  return state.muted ? 0 : state.volume;
}

export const bgmBridge = {
  getState: (): BgmAudioSettings => state,

  getVolume: () => state.volume,
  getMuted: () => state.muted,

  setVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    state = { ...state, volume: clamped, muted: clamped === 0 ? false : state.muted };
    saveSettings(state);
    notify();
  },

  setMuted: (muted: boolean) => {
    state = { ...state, muted };
    saveSettings(state);
    notify();
  },

  toggleMuted: () => {
    state = { ...state, muted: !state.muted };
    saveSettings(state);
    notify();
    return state.muted;
  },

  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

// ── React Hook ──
export function useBgmSettings(): BgmAudioSettings {
  return useSyncExternalStore(bgmBridge.subscribe, bgmBridge.getState);
}
