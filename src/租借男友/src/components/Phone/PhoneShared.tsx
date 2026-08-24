/**
 * 手机共享 UI 组件 — 波普风格
 *
 * 参照 rent-a-boyfriend-pop-ui 参考设计：
 * - AppHeader: 彩色底 + border-b-4 + 半调覆盖 + 斜体倾斜标题
 * - BottomNav: 白底 + border-t-4 + 激活态倾斜 + 硬阴影
 * - TabButton: 底部导航单个 tab 按钮
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../utils';

// ── App 头部 — 波普风格 ──
export function AppHeader({
  title,
  color,
  textColor = 'text-pop-black',
  onBack,
  rightIcon,
}: {
  title: string;
  color: string;
  textColor?: string;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'shrink-0 border-b-4 border-pop-black p-3 flex items-center justify-between relative overflow-hidden shadow-[0px_4px_0px_0px_#1a1a1a] z-20',
        color,
      )}
    >
      <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="flex items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="relative z-10 w-9 h-9 bg-white text-pop-black rounded-lg border-2 border-pop-black flex items-center justify-center transform -skew-x-6 hover:scale-110 hover:bg-pop-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1
          className={cn(
            'relative z-10 text-xl font-black tracking-tighter italic transform -skew-x-6',
            onBack ? 'ml-3' : '',
            textColor,
          )}
        >
          {title}
        </h1>
      </div>
      {rightIcon && <div className="relative z-10">{rightIcon}</div>}
    </div>
  );
}

// ── 底部导航 tab 数据类型 ──
export type NavTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
};

// ── 底部导航 — 波普风格 ──
export function BottomNav({
  tabs,
  activeTab,
  onTabChange,
  activeBgColor,
}: {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  activeBgColor: string;
}) {
  return (
    <div className="bg-white text-pop-black flex justify-around items-center h-14 border-t-4 border-pop-black shadow-[0px_-4px_0px_0px_#1a1a1a] z-20 shrink-0 pb-1.5 pt-1 relative">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center w-16 h-11 rounded-xl transition-all border-2',
              isActive
                ? `${activeBgColor} border-pop-black shadow-[2px_2px_0px_0px_#1a1a1a] transform -skew-x-3`
                : 'border-transparent text-pop-black/50 hover:text-pop-black/80',
            )}
          >
            <tab.icon size={18} strokeWidth={isActive ? 3 : 2} />
            <span className={cn('text-[10px] mt-0.5', isActive ? 'font-black text-pop-black' : 'font-bold')}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
