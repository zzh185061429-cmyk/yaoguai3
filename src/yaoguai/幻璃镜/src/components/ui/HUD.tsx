import React, { useState } from 'react';
import {
  Maximize2, Minimize2, Brain, Database,
  BookText, Trash2, RefreshCw, Settings as SettingsIcon,
  ChevronDown, ChevronUp, HelpCircle, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { FloorSelector } from './FloorSelector';
import { useIsMobile } from '../../hooks';

interface HUDProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenThinking: () => void;
  onOpenVariables: () => void;
  onOpenReading: () => void;
  onOpenDelete: () => void;
  onOpenSettings: () => void;
  onOpenManual: () => void;
  onOpenCalendar: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

/** 水平工具栏按钮 — 小图标 + 古风标签 */
function ToolButton({
  onClick, title, icon, label, color, textColor, disabled, isMobile, isLarge,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  textColor: string;
  disabled?: boolean;
  isMobile?: boolean;
  isLarge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex flex-col items-center gap-0.5 border border-ink-700/50 shrink-0 rounded",
        "hover:scale-110 active:scale-95 transition-all",
        isMobile ? "py-0.5 px-1" : isLarge ? "py-2 px-3" : "py-1 px-2",
        color, textColor,
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {icon}
      <span className={cn(
        "font-serif tracking-widest leading-none",
        isMobile ? "text-[7px]" : isLarge ? "text-xs" : "text-[8px]",
      )}>{label}</span>
    </button>
  );
}

/** 手机端图标尺寸 */
const mi = "w-3 h-3";
/** 桌面端图标尺寸 */
const di = "w-4 h-4";
/** 桌面端全屏图标尺寸 */
const fi = "w-6 h-6";

export function HUD({
  isFullscreen, onToggleFullscreen,
  onOpenThinking, onOpenVariables, onOpenReading, onOpenDelete,
  onOpenSettings, onOpenManual, onOpenCalendar,
  onRegenerate, regenerating,
}: HUDProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 全屏 + 桌面端 → 使用放大尺寸
  const isLarge = isFullscreen && !isMobile;
  // 图标尺寸：全屏桌面端用 fi，否则用 di / mi
  const ci = isLarge ? fi : isMobile ? mi : di;

  // 分隔线高度
  const sepHeight = isLarge ? "h-10" : "h-7";

  return (
    <div className={cn("z-40 pointer-events-auto", isMobile ? "relative w-full" : "fixed top-0 left-1/2 -translate-x-1/2")}>
      <AnimatePresence mode="wait">
        {(isCollapsed && !isMobile) ? (
          /* ── 收起态：极小圆角按钮 ── */
          <motion.button
            key="collapsed"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCollapsed(false)}
            className="bg-ink-900/95 backdrop-blur-md border border-cyan-500/50 rounded-b-xl shadow-lg px-2 py-1 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
            title="展开工具栏"
          >
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <SettingsIcon className="w-3.5 h-3.5 text-paper-200/50" />
          </motion.button>
        ) : (
          /* ── 展开态：水平工具栏 ── */
          <motion.div
            key="expanded"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-ink-900/95 backdrop-blur-md border border-cyan-900/50",
              isLarge ? "py-2.5 px-3" : "py-1.5 px-2",
              isMobile
                ? "w-full border-t-0"
                : "rounded-b-xl shadow-lg shadow-black/50",
            )}
          >
            <div className={cn("flex items-center", isMobile ? "gap-0.5 justify-between" : isLarge ? "gap-2" : "gap-1")}>
              {/* 收起按钮 — 手机端不显示 */}
              {!isMobile && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className={cn(
                    "shrink-0 flex items-center justify-center bg-cyan-900/40 text-cyan-400 rounded hover:bg-cyan-800/60 transition-colors border border-cyan-900/50",
                    isLarge ? "w-10 h-10" : "w-7 h-7",
                  )}
                  title="收起工具栏"
                >
                  <ChevronUp className={isLarge ? "w-5 h-5" : "w-3.5 h-3.5"} />
                </button>
              )}

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className={cn("w-px bg-ink-700 shrink-0", sepHeight)} />}

              {/* 核心操作 */}
              <ToolButton
                onClick={onToggleFullscreen}
                title={isFullscreen ? "退出全屏" : "全屏模式"}
                label={isFullscreen ? "退出" : "全屏"}
                color="bg-ink-800 border-ink-700"
                textColor="text-paper-200"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={isFullscreen ? <Minimize2 className={ci} /> : <Maximize2 className={ci} />}
              />

              <FloorSelector isLarge={isLarge} />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className={cn("w-px bg-ink-700 shrink-0", sepHeight)} />}

              <ToolButton
                onClick={onOpenCalendar}
                title="日期与时辰"
                label="时辰"
                color="bg-ink-800 border-gold-900/50"
                textColor="text-gold-400"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<Calendar className={ci} />}
              />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className={cn("w-px bg-ink-700 shrink-0", sepHeight)} />}

              {/* 查看 */}
              <ToolButton
                onClick={onOpenReading}
                title="剧情回顾"
                label="剧情"
                color="bg-cyan-950/40 border-cyan-900/50"
                textColor="text-cyan-300"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<BookText className={ci} />}
              />
              <ToolButton
                onClick={onOpenThinking}
                title="思维链"
                label="思维"
                color="bg-cyan-950/40 border-cyan-900/50"
                textColor="text-cyan-300"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<Brain className={ci} />}
              />
              <ToolButton
                onClick={onOpenVariables}
                title="变量"
                label="变量"
                color="bg-gold-950/40 border-gold-900/50"
                textColor="text-gold-300"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<Database className={ci} />}
              />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className={cn("w-px bg-ink-700 shrink-0", sepHeight)} />}

              {/* 编辑 */}
              <ToolButton
                onClick={onOpenDelete}
                title="删除楼层"
                label="删除"
                color="bg-vermilion-950/40 border-vermilion-900/50"
                textColor="text-vermilion-400"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<Trash2 className={ci} />}
              />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className={cn("w-px bg-ink-700 shrink-0", sepHeight)} />}

              {/* 系统 */}
              <ToolButton
                onClick={onRegenerate}
                title="重新生成"
                label="重生成"
                color="bg-ink-800 border-ink-700"
                textColor="text-paper-200"
                disabled={regenerating}
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<RefreshCw className={cn(ci, regenerating && "animate-spin")} />}
              />
              <ToolButton
                onClick={onOpenSettings}
                title="设置"
                label="设置"
                color="bg-cyan-950/40 border-cyan-900/50"
                textColor="text-cyan-300"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<SettingsIcon className={ci} />}
              />
              <ToolButton
                onClick={onOpenManual}
                title="说明书"
                label="说明"
                color="bg-gold-950/40 border-gold-900/50"
                textColor="text-gold-300"
                isMobile={isMobile}
                isLarge={isLarge}
                icon={<HelpCircle className={ci} />}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
