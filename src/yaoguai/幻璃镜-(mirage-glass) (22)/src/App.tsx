/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence } from 'motion/react';
import { GameProvider, useGameContext } from './store/GameContext';
import { MainMenu } from './components/screens/MainMenu';
import { GameScreen } from './components/screens/GameScreen';
import { GalleryScreen } from './components/screens/GalleryScreen';
import { NotificationSystem } from './components/ui/NotificationSystem';
import { cn } from './utils';
import { useIsMobile, useMobileMode } from './hooks';

const AppContent: React.FC = () => {
  const { currentScreen } = useGameContext();
  const isMobile = useIsMobile();
  const mobileOverride = useMobileMode();
  // 仅当用户显式选择「手机模式」时显示手机边框（真实手机自动检测不显示边框）
  const isPhoneFrame = mobileOverride === true;

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
          isMobile && "max-w-[430px] mx-auto",
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
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
