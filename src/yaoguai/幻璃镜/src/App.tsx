/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { GameProvider, useGameContext } from './store/GameContext';
import { MainMenu } from './components/screens/MainMenu';
import { GameScreen } from './components/screens/GameScreen';
import { GalleryScreen } from './components/screens/GalleryScreen';
import { NotificationSystem } from './components/ui/NotificationSystem';
import { cn } from './utils';
import { useIsMobile, useMobileMode } from './hooks';

import { ErrorBoundary } from './components/ui/ErrorBoundary';

const AppContent: React.FC = () => {
  const { currentScreen } = useGameContext();
  const isMobile = useIsMobile();
  const mobileOverride = useMobileMode();
  // 仅当用户显式选择「手机模式」时显示手机边框（真实手机自动检测不显示边框）
  const isPhoneFrame = mobileOverride === true;

  // ── 暴力锁死 iframe 高度：不管什么情况都给我撑大 ──
  // MutationObserver 监听 iframe style 变化 + 定时器双保险
  useEffect(() => {
    let parent$: any = null;
    try {
      if (window.parent && window.parent !== window) {
        parent$ = (window.parent as any).$;
      }
    } catch {
      parent$ = null;
    }
    if (!parent$) return;

    let iframe: HTMLIFrameElement | null = null;
    try {
      iframe = window.frameElement as HTMLIFrameElement | null;
    } catch {
      iframe = null;
    }
    if (!iframe) return;

    const targetH = isMobile ? 700 : 800;

    // 立即撑大
    const forceHeight = () => {
      try {
        // 全屏时跳过，不干扰全屏逻辑
        if ((window as any).__mirageFullscreen) return;
        const currentH = parent$(iframe).height();
        if (currentH !== targetH) {
          parent$(iframe).css({ height: `${targetH}px` });
        }
      } catch {
        // ignore
      }
    };

    // 立即执行一次
    forceHeight();

    // 退出全屏后连发修复（解决退出全屏后酒馆打回 150px 的竞态）
    // 监听 __mirageFullscreen 从 true 变 false 的时刻
    let prevFs = (window as any).__mirageFullscreen || false;
    const fsWatcher = window.setInterval(() => {
      const curFs = (window as any).__mirageFullscreen || false;
      if (prevFs && !curFs) {
        // 刚退出全屏，连发 10 次 forceHeight，每 50ms 一次
        for (let i = 0; i < 10; i++) {
          window.setTimeout(forceHeight, i * 50);
        }
      }
      prevFs = curFs;
    }, 50);

    // 定时器：50ms 高频检查（比 100ms 更暴力，几乎无闪烁）
    const guardTimer = window.setInterval(forceHeight, 50);

    // MutationObserver：监听 iframe 的 style 属性变化，一旦被改立即修正
    let observer: MutationObserver | null = null;
    try {
      observer = new MutationObserver(() => {
        forceHeight();
      });
      observer.observe(iframe, { attributes: true, attributeFilter: ['style'] });
    } catch {
      // ignore
    }

    // 也监听父页面中 iframe 父元素的 class 变化（酒馆有时通过 class 控制高度）
    let parentObserver: MutationObserver | null = null;
    try {
      const parentEl = iframe.parentElement;
      if (parentEl) {
        parentObserver = new MutationObserver(() => {
          forceHeight();
        });
        parentObserver.observe(parentEl, { attributes: true, attributeFilter: ['style', 'class'] });
      }
    } catch {
      // ignore
    }

    return () => {
      window.clearInterval(guardTimer);
      window.clearInterval(fsWatcher);
      observer?.disconnect();
      parentObserver?.disconnect();
      try {
        parent$(iframe).css({ height: '' });
      } catch {
        // ignore
      }
    };
  }, [isMobile]);

  return (
    <div
      className={cn(
        "w-full h-screen flex items-center justify-center overflow-hidden",
        isPhoneFrame && "phone-frame-outer",
      )}
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div
        className={cn(
          "flex flex-col bg-ink-900 overflow-hidden text-paper-100 selection:bg-cyan-500/30 font-sans relative transition-all duration-300 w-full h-full",
          isMobile && "max-w-107.5 mx-auto",
          isPhoneFrame && "phone-frame",
        )}
      >
        <NotificationSystem />
        <AnimatePresence mode="wait">
          {currentScreen === 'main-menu' && <MainMenu key="main-menu" />}
          {currentScreen === 'game' && <GameScreen key="game" />}
          {currentScreen === 'gallery' && <GalleryScreen key="gallery" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </ErrorBoundary>
  );
}
