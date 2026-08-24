/**
 * BGM 音量/静音共享状态 — 桥接 SettingsModal 与 MusicPlayerWidget
 *
 * 通过这个轻量 pub-sub store，SettingsModal 和 MusicPlayerWidget
 * 可以读写同一份 BGM 音频设置，并持久化到 localStorage。
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mirage-bgm-audio-settings';

type BgmAudioSettings = {
  volume: number; // 0~1
  muted: boolean;
};

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
  return { volume: 0.4, muted: false };
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
