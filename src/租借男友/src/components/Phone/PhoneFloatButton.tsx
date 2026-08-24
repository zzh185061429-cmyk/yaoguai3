/**
 * 手机悬浮球
 *
 * - 可拖动，松手后吸附到最近的屏幕边缘
 * - 有新消息时震动 + 红点未读数
 * - 点击展开手机界面
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { Smartphone } from 'lucide-react';
import { usePhoneContext } from '../../state/PhoneContext';
import { cn } from '../../utils';

const BUTTON_SIZE = 52;
const EDGE_MARGIN = 16;

type Edge = 'left' | 'right';

function getNearestEdge(x: number): Edge {
  const halfWidth = window.innerWidth / 2;
  return x < halfWidth ? 'left' : 'right';
}

function snapToEdge(x: number): { x: number; edge: Edge } {
  const edge = getNearestEdge(x);
  return {
    x: edge === 'left' ? EDGE_MARGIN : window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
    edge,
  };
}

export function PhoneFloatButton() {
  const { unreadCount, openPhone } = usePhoneContext();
  const x = useMotionValue(EDGE_MARGIN);
  const y = useMotionValue(window.innerHeight - 120);
  const [isDragging, setIsDragging] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // 初始化位置（从 localStorage 恢复）
  useEffect(() => {
    const saved = localStorage.getItem('phone-float-pos');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        x.set(pos.x);
        y.set(pos.y);
      } catch {
        // 用默认位置
      }
    }
  }, [x, y]);

  // 屏幕旋转/尺寸变化时重新限制位置范围
  useEffect(() => {
    const handleResize = () => {
      const currentX = x.get();
      const currentY = y.get();
      const snapped = snapToEdge(currentX);
      const clampedY = Math.max(
        80,
        Math.min(window.innerHeight - BUTTON_SIZE - 80, currentY),
      );
      x.set(snapped.x);
      y.set(clampedY);
    };
    const handleOrientationChange = () => setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [x, y]);

  // 有新消息时震动
  useEffect(() => {
    if (unreadCount > 0) {
      setIsVibrating(true);
      const timer = setTimeout(() => setIsVibrating(false), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVibrating(false);
    }
  }, [unreadCount]);

  // 拖动结束后吸附到边缘 + 持久化
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);

    const currentX = x.get();
    const currentY = y.get();
    const snapped = snapToEdge(currentX);

    // 限制 Y 范围
    const clampedY = Math.max(
      80,
      Math.min(window.innerHeight - BUTTON_SIZE - 80, currentY),
    );

    // 动画吸附
    x.set(snapped.x);
    y.set(clampedY);

    // 持久化
    localStorage.setItem(
      'phone-float-pos',
      JSON.stringify({ x: snapped.x, y: clampedY }),
    );
  }, [x, y]);

  // 点击处理：如果没有拖动则打开手机
  const handleClick = useCallback(() => {
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    openPhone();
  }, [openPhone]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{
        left: EDGE_MARGIN,
        right: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
        top: 80,
        bottom: window.innerHeight - BUTTON_SIZE - 80,
      }}
      style={{ x, y }}
      onDragStart={() => {
        setIsDragging(true);
        hasMoved.current = false;
        dragStartPos.current = { x: x.get(), y: y.get() };
      }}
      onDrag={() => {
        const dx = Math.abs(x.get() - dragStartPos.current.x);
        const dy = Math.abs(y.get() - dragStartPos.current.y);
        if (dx > 5 || dy > 5) hasMoved.current = true;
      }}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'fixed z-50 flex items-center justify-center cursor-grab active:cursor-grabbing select-none',
        'w-[52px] h-[52px] rounded-full',
        'bg-pop-black border-2 border-pop-pink shadow-pop-pink',
        'transition-shadow hover:shadow-[0_0_20px_rgba(255,51,102,0.6)]',
      )}
      animate={isVibrating ? { x: [x.get(), x.get() - 3, x.get() + 3, x.get() - 3, x.get()] } : {}}
    >
      {/* 半色调装饰 */}
      <div className="absolute inset-0 rounded-full bg-halftone opacity-20 pointer-events-none" />

      {/* 手机图标 */}
      <Smartphone className="w-6 h-6 text-pop-yellow relative z-10" />

      {/* 未读红点 */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 z-20 min-w-[20px] h-5 px-1 bg-pop-pink text-white text-xs font-black flex items-center justify-center rounded-full border-2 border-pop-black"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 拖动提示 */}
      {!isDragging && unreadCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="absolute -bottom-5 text-[9px] text-white font-bold whitespace-nowrap pointer-events-none"
        >
          拖动
        </motion.div>
      )}
    </motion.div>
  );
}
