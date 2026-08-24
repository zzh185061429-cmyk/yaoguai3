/**
 * 成就解锁通知 — Steam 风格奖杯弹窗
 *
 * 从屏幕顶端滑入，金色波普风格
 * 多个成就同时解锁时排队依次弹出
 * 点击弹窗或关闭按钮可手动关闭
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import { useAchievementContext } from '../state/AchievementContext';
import { TIER_COLORS } from '../data/achievementData';
import { cn } from '../utils';

export function AchievementToast() {
  const { notificationQueue, dequeueNotification } = useAchievementContext();
  const [isVisible, setIsVisible] = useState(false);

  const current = notificationQueue[0];

  // 当队列头部变化时，触发入场动画
  useEffect(() => {
    if (current) {
      setIsVisible(true);
      // 停留 8 秒后自动滑出（也可手动关闭）
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [current]);

  // 滑出动画结束后，消费队列
  const handleExitComplete = () => {
    if (!isVisible && current) {
      dequeueNotification();
    }
  };

  // 手动关闭
  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-100 pointer-events-none">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {current && isVisible && (
          <motion.div
            key={current.id}
            initial={{ y: -200, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -200, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={handleClose}
            className={cn(
              'relative border-4 shadow-[6px_6px_0px_0px_#1a1a1a] flex items-center gap-3 px-5 py-3 min-w-72 max-w-90 cursor-pointer pointer-events-auto',
              TIER_COLORS[current.tier].bg,
              TIER_COLORS[current.tier].text,
              TIER_COLORS[current.tier].border,
            )}
          >
            {/* 半调点阵装饰 */}
            <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay" />

            {/* 奖杯图标 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12, stiffness: 200 }}
              className="relative z-10 shrink-0 w-12 h-12 bg-pop-black rounded-full border-4 border-pop-black flex items-center justify-center shadow-pop"
            >
              <Trophy className="w-7 h-7 text-pop-yellow" strokeWidth={2.5} />
            </motion.div>

            {/* 文字区域 */}
            <div className="relative z-10 flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 transform -skew-x-6">
                成就已解锁
              </span>
              <span className="text-lg font-black italic -skew-x-6 leading-tight tracking-tight">
                {current.name}
              </span>
              <span className="text-[11px] font-bold leading-snug opacity-80 mt-0.5">
                {current.description}
              </span>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="relative z-10 shrink-0 w-7 h-7 flex items-center justify-center bg-pop-black/20 hover:bg-pop-black/40 rounded-full transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
