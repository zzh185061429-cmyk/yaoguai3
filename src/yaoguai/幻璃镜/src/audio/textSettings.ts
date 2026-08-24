/**
 * 文本速度 & Auto 等待时间共享设置
 *
 * StoryView 读取打字机速度，SettingsPanel 控制这些值。
 * 通过 pub-sub store 共享，localStorage 持久化。
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mirage-text-settings';

type TextSettingsState = {
  /** 打字机速度级别: 0=瞬间, 1=慢, 2=普通, 3=快 */
  textSpeed: number;
  /** Auto 模式等待倍率: 0.5=短, 1=普通, 1.5=长, 2=很久 */
  autoWaitMultiplier: number;
};

function loadSettings(): TextSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        textSpeed: typeof parsed.textSpeed === 'number' ? parsed.textSpeed : 2,
        autoWaitMultiplier: typeof parsed.autoWaitMultiplier === 'number' ? parsed.autoWaitMultiplier : 1,
      };
    }
  } catch {
    // ignore
  }
  return { textSpeed: 2, autoWaitMultiplier: 1 };
}

function saveSettings(settings: TextSettingsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// ── 速度级别 → 每字符延迟(ms) 映射 ──
const SPEED_DELAYS: Record<number, number> = {
  0: 0,   // 瞬间
  1: 55,  // 慢
  2: 28,  // 普通
  3: 10,  // 快
};

/** 获取指定速度级别的每字符延迟 */
export function getTextDelay(speed: number): number {
  return SPEED_DELAYS[speed] ?? 28;
}

// ── Pub-Sub ──
const listeners = new Set<() => void>();
let state: TextSettingsState = loadSettings();

function notify() {
  listeners.forEach(fn => fn());
}

export const textSettings = {
  getState: (): TextSettingsState => state,

  getTextSpeed: () => state.textSpeed,
  getAutoWaitMultiplier: () => state.autoWaitMultiplier,

  setTextSpeed: (speed: number) => {
    state = { ...state, textSpeed: Math.max(0, Math.min(3, speed)) };
    saveSettings(state);
    notify();
  },

  setAutoWaitMultiplier: (m: number) => {
    state = { ...state, autoWaitMultiplier: Math.max(0.5, Math.min(2, m)) };
    saveSettings(state);
    notify();
  },

  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

// ── React Hook ──
export function useTextSettings(): TextSettingsState {
  return useSyncExternalStore(textSettings.subscribe, textSettings.getState);
}
