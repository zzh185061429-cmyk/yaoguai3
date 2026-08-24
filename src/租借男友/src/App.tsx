/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { HUD } from './components/HUD';
import { ToastProvider, useToast } from './components/ToastProvider';
import { ChatBar } from './components/ChatBar';
import { GameProvider, useGameContext } from './state/GameContext';
import { StoryView } from './views/StoryView';
import { regenerateCurrentFloor } from './utils/interaction';
import { MessageCircle } from 'lucide-react';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { ManualModal } from './components/modals/ManualModal';
import { SettingsPanel } from './components/SettingsPanel';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';
import { useIsMobile, useMobileMode } from './hooks';
import { PhoneProvider } from './state/PhoneContext';
import { PhoneFloatButton } from './components/Phone/PhoneFloatButton';
import { PhoneApp } from './components/Phone/PhoneApp';
import { AchievementProvider } from './state/AchievementContext';
import { AchievementToast } from './components/AchievementToast';

// ── 懒加载模态框组件，减少初始包体积和初始渲染开销 ──
const ReadingModal = lazy(() => import('./views/ReadingModal').then(m => ({ default: m.ReadingModal })));
const ThinkingChainModal = lazy(() => import('./views/ThinkingChainModal').then(m => ({ default: m.ThinkingChainModal })));
const VariableViewerModal = lazy(() => import('./views/VariableViewerModal').then(m => ({ default: m.VariableViewerModal })));
const DeleteFloorsModal = lazy(() => import('./views/DeleteFloorsModal').then(m => ({ default: m.DeleteFloorsModal })));
const MapModal = lazy(() => import('./components/modals/MapModal').then(m => ({ default: m.MapModal })));

function AppContent() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [isVariableViewerOpen, setIsVariableViewerOpen] = useState(false);
  const [isReadingOpen, setIsReadingOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const mobileOverride = useMobileMode();
  // 仅当用户显式选择「手机模式」时显示手机边框（真实手机自动检测不显示边框）
  const isPhoneFrame = mobileOverride === true;
  const { isEyeCareMode, startGenerating, finishGenerating, pendingMessage, showWelcome } = useGameContext();
  const { showToast } = useToast();

  // 检测脚本模式：通过 __TAVERN_SCRIPT_MODE__ 标记区分全屏策略和 CSS
  const isScriptMode = typeof (window as any).__TAVERN_SCRIPT_MODE__ !== 'undefined';

  // 全屏状态同步到全局，供 StoryView 等子组件读取
  useEffect(() => {
    (window as any).__isFullscreen__ = isFullscreen;
  }, [isFullscreen]);

  // 遮罩打开状态同步到全局（小手机 + 各模态框），供 StoryView 的滚轮/键盘判断是否该禁用
  const isAnyOverlayOpen = isChatOpen || isThinkingOpen || isVariableViewerOpen || isReadingOpen || isDeleteOpen || isSettingsOpen || isManualOpen || showWelcome;
  useEffect(() => {
    (window as any).__anyOverlayOpen__ = isAnyOverlayOpen;
  }, [isAnyOverlayOpen]);

  // 当有待发送消息时（地图/派单写入），自动展开输入栏
  useEffect(() => {
    if (pendingMessage) {
      setIsChatOpen(true);
    }
  }, [pendingMessage]);

  // 欢迎弹窗关闭后，自动弹出说明书（每个聊天文件首次打开时显示一次）
  const prevShowWelcomeRef = useRef(showWelcome);
  useEffect(() => {
    // 检测 showWelcome 从 true → false 的变化（欢迎弹窗刚关闭）
    if (prevShowWelcomeRef.current && !showWelcome) {
      try {
        const chatVars = getVariables({ type: 'chat' }) as any;
        if (!chatVars?.manualShown) {
          setIsManualOpen(true);
        }
      } catch {
        // 聊天变量可能尚未就绪，安全跳过
      }
    }
    prevShowWelcomeRef.current = showWelcome;
  }, [showWelcome]);

  // 关闭说明书时标记为已显示
  const handleManualClose = useCallback(() => {
    setIsManualOpen(false);
    try {
      updateVariablesWith(vars => ({ ...vars, manualShown: true }), { type: 'chat' });
      console.info('[App] 说明书已标记为已显示');
    } catch {
      console.warn('[App] 无法持久化说明书显示标记');
    }
  }, []);

  // 监听全屏状态变化（用户按 Esc 退出等）— 仅前端模式需要
  useEffect(() => {
    if (isScriptMode) return;
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isScriptMode]);

  const toggleFullscreen = async () => {
    if (isScriptMode) {
      const next = !isFullscreen;
      setIsFullscreen(next);
      (window as any).__setFullscreen__(next);
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    startGenerating();
    console.info('[App] 开始重新生成...');
    try {
      const result = await regenerateCurrentFloor();
      console.info('[App] 重新生成结果:', result);
      if (result.success) {
        showToast('已重新生成最后一楼层', 'normal');
      } else {
        showToast((result as { success: false; error: string }).error || '重新生成失败', 'alert');
      }
    } catch (e: any) {
      console.error('[App] 重新生成异常:', e);
      showToast(e?.message || '重新生成失败', 'alert');
    }
    setRegenerating(false);
    finishGenerating();
  };
  return (
    <div 
      className={cn(
        "w-full h-screen flex items-center justify-center overflow-hidden",
        isPhoneFrame && "phone-frame-outer",
      )}
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div 
        className={cn(
          "flex flex-col bg-pop-black overflow-hidden font-sans relative transition-all duration-300 w-full h-full",
          isMobile && "max-w-107.5 mx-auto",
          isPhoneFrame && "phone-frame",
        )}
        style={{ filter: isEyeCareMode ? 'sepia(0.2) brightness(0.9) contrast(0.95)' : 'none' }}
      >
        
        {/* Global HUD */}
        <HUD
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onOpenThinking={() => setIsThinkingOpen(true)}
          onOpenVariables={() => setIsVariableViewerOpen(true)}
          onOpenReading={() => setIsReadingOpen(true)}
          onOpenDelete={() => setIsDeleteOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenManual={() => setIsManualOpen(true)}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
        />

        {/* Main Content Area */}
        <main className="flex-1 relative w-full min-h-0 overflow-hidden bg-white">
          <StoryView />
        </main>

        {/* 底部输入栏 — 手机端始终展开，桌面端可折叠 */}
        <AnimatePresence>
          {(isChatOpen || isMobile) && (
            <motion.div
              initial={isMobile ? false : { y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={isMobile ? undefined : { y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "z-50 pb-safe",
                isMobile ? "shrink-0 relative" : "fixed bottom-0 left-0 right-0"
              )}
              style={isMobile ? { position: 'relative' } : undefined}
            >
              <ChatBar onClose={isMobile ? () => {} : () => setIsChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 折叠态浮动按钮 — 手机端不显示 */}
        <AnimatePresence>
          {!isChatOpen && !isMobile && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-pop-yellow text-pop-black rounded-full pop-border shadow-pop-pink flex items-center justify-center hover:scale-110 transition-transform active:scale-90 pb-safe"
              title="展开输入栏"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* 手机悬浮球 — 可拖动，有消息时震动 */}
        <PhoneFloatButton />

        {/* 手机界面 — 点击悬浮球展开 */}
        <PhoneApp />

        {/* 成就解锁通知 — 顶端弹窗 */}
        <AchievementToast />

        {/* 设置面板 */}
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        {/* 说明书模态框 */}
        <ManualModal isOpen={isManualOpen} onClose={handleManualClose} />

        {/* 欢迎弹窗 — 每个新聊天文件首次打开时显示 */}
        <WelcomeModal isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />

        {/* 全局 Modals — 懒加载，仅在打开时渲染 */}
        <Suspense fallback={null}>
          <ThinkingChainModal isOpen={isThinkingOpen} onClose={() => setIsThinkingOpen(false)} />
          <VariableViewerModal isOpen={isVariableViewerOpen} onClose={() => setIsVariableViewerOpen(false)} />
          <ReadingModal isOpen={isReadingOpen} onClose={() => setIsReadingOpen(false)} />
          <DeleteFloorsModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} />
          <MapModal />
        </Suspense>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AchievementProvider>
        <ToastProvider>
          <PhoneProvider>
            <AppContent />
          </PhoneProvider>
        </ToastProvider>
      </AchievementProvider>
    </GameProvider>
  );
}
