import { useState, useEffect, useSyncExternalStore } from 'react';

// ── 全局手机模式覆盖状态（手动开关优先于自动检测）──
const STORAGE_KEY = 'mirage-mobile-mode';
let mobileOverride: boolean | null = null;
const listeners = new Set<() => void>();

function readOverride(): boolean | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? null : stored === 'true';
  } catch {
    return null;
  }
}

function getSnapshot(): boolean | null {
  if (mobileOverride === null) {
    mobileOverride = readOverride();
  }
  return mobileOverride;
}

function getServerSnapshot(): boolean | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** 手动设置手机模式：true=强制手机端, false=强制桌面端, null=自动检测 */
export function setMobileMode(value: boolean | null) {
  mobileOverride = value;
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  } catch {
    // localStorage 不可用时静默
  }
  listeners.forEach(l => l());
}

/** 获取当前手机模式设置（null = 自动检测） */
export function getMobileMode(): boolean | null {
  return getSnapshot();
}

/**
 * 检测当前是否为手机端
 *
 * 优先级：手动设置 > 自动检测（matchMedia 视口宽度）
 *
 * 在酒馆 iframe 中，matchMedia 检测的是 iframe 自身的视口宽度。
 * 电脑全屏时 iframe 宽度 > 768px 返回 false；
 * 可通过 setMobileMode(true) 手动强制启用手机端布局。
 *
 * @param breakpoint 视口宽度阈值，默认 768px（Tailwind md 断点）
 */
export function useIsMobile(breakpoint = 768): boolean {
  // 手动覆盖（全局响应式）
  const override = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 自动检测（视口宽度）
  const [autoMobile, setAutoMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setAutoMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  // 手动设置优先
  if (override !== null) return override;
  return autoMobile;
}

/** 获取当前手机模式设置（响应式） */
export function useMobileMode(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
