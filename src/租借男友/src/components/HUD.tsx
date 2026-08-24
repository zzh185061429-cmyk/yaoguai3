import React, { useState } from "react";
import {
  Eye, EyeOff,
  Maximize2, Minimize2, Brain, Database,
  BookText, Trash2, RefreshCw, Settings as SettingsIcon,
  ChevronDown, ChevronUp, HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGameContext } from "../state/GameContext";
import { cn } from "../utils";
import { FloorSelector } from "./FloorSelector";
import { useIsMobile } from "../hooks";

interface HUDProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenThinking: () => void;
  onOpenVariables: () => void;
  onOpenReading: () => void;
  onOpenDelete: () => void;
  onOpenSettings: () => void;
  onOpenManual: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

/** 水平工具栏按钮 — 小图标 */
function ToolButton({
  onClick, title, icon, label, color, textColor, disabled, isMobile,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  textColor: string;
  disabled?: boolean;
  isMobile?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex flex-col items-center gap-0.5 border-2 border-pop-black shrink-0",
        "hover:scale-110 active:scale-95 transition-transform rounded-lg",
        isMobile ? "py-0.5 px-1" : "py-1 px-2",
        color, textColor,
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {icon}
      <span className={cn("font-black tracking-tight leading-none", isMobile ? "text-[7px]" : "text-[8px]")}>{label}</span>
    </button>
  );
}

/** 手机端图标尺寸 */
const mi = "w-3 h-3";
/** 桌面端图标尺寸 */
const di = "w-4 h-4";

export function HUD({
  isFullscreen, onToggleFullscreen,
  onOpenThinking, onOpenVariables, onOpenReading, onOpenDelete,
  onOpenSettings, onOpenManual, onRegenerate, regenerating,
}: HUDProps) {
  const { isEyeCareMode, setIsEyeCareMode } = useGameContext();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            className="bg-pop-black/95 border-2 border-pop-pink rounded-b-xl shadow-pop-pink px-2 py-1 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
            title="展开工具栏"
          >
            <ChevronDown className="w-3.5 h-3.5 text-pop-yellow" />
            <SettingsIcon className="w-3.5 h-3.5 text-white/50" />
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
              "bg-pop-black/95 border-2 border-pop-pink py-1.5 px-2",
              isMobile
                ? "w-full border-t-0"
                : "rounded-b-2xl shadow-pop-pink max-w-[calc(100vw-1rem)] overflow-x-auto hide-scrollbar",
            )}
          >
            <div className={cn("flex items-center", isMobile ? "gap-0.5 justify-between" : "gap-1")}>
              {/* 收起按钮 — 手机端不显示 */}
              {!isMobile && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center bg-pop-pink text-white rounded-lg hover:bg-pop-yellow hover:text-pop-black transition-colors border-2 border-pop-black"
                  title="收起工具栏"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}

              {/* 分隔线 — 手机端隐藏节省空间 */}
              {!isMobile && <div className="w-px h-7 bg-white/20 shrink-0" />}

              {/* 核心操作 */}
              <ToolButton
                onClick={onToggleFullscreen}
                title={isFullscreen ? "退出全屏" : "全屏模式"}
                label={isFullscreen ? "退出" : "全屏"}
                color="bg-pop-black border-white"
                textColor="text-white"
                isMobile={isMobile}
                icon={isFullscreen ? <Minimize2 className={isMobile ? mi : di} /> : <Maximize2 className={isMobile ? mi : di} />}
              />

              <FloorSelector />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className="w-px h-7 bg-white/20 shrink-0" />}

              {/* 查看 */}
              <ToolButton
                onClick={onOpenReading}
                title="剧情回顾"
                label="剧情"
                color="bg-pop-cyan"
                textColor="text-pop-black"
                isMobile={isMobile}
                icon={<BookText className={isMobile ? mi : di} />}
              />
              <ToolButton
                onClick={onOpenThinking}
                title="思维链"
                label="思维"
                color="bg-pop-cyan"
                textColor="text-pop-black"
                isMobile={isMobile}
                icon={<Brain className={isMobile ? mi : di} />}
              />
              <ToolButton
                onClick={onOpenVariables}
                title="变量"
                label="变量"
                color="bg-pop-yellow"
                textColor="text-pop-black"
                isMobile={isMobile}
                icon={<Database className={isMobile ? mi : di} />}
              />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className="w-px h-7 bg-white/20 shrink-0" />}

              {/* 编辑 */}
              <ToolButton
                onClick={onOpenDelete}
                title="删除楼层"
                label="删除"
                color="bg-pop-pink"
                textColor="text-white"
                isMobile={isMobile}
                icon={<Trash2 className={isMobile ? mi : di} />}
              />

              {/* 分隔线 — 手机端隐藏 */}
              {!isMobile && <div className="w-px h-7 bg-white/20 shrink-0" />}

              {/* 系统 */}
              <ToolButton
                onClick={() => setIsEyeCareMode(!isEyeCareMode)}
                title="护眼模式"
                label={isEyeCareMode ? "护眼开" : "护眼"}
                color={isEyeCareMode ? "bg-[#cce3de]" : "bg-gray-200"}
                textColor="text-pop-black"
                isMobile={isMobile}
                icon={isEyeCareMode ? <Eye className={isMobile ? mi : di} /> : <EyeOff className={isMobile ? mi : di} />}
              />
              <ToolButton
                onClick={onRegenerate}
                title="重新生成"
                label="重生成"
                color="bg-white"
                textColor="text-pop-black"
                disabled={regenerating}
                isMobile={isMobile}
                icon={<RefreshCw className={cn(isMobile ? mi : di, regenerating && "animate-spin")} />}
              />
              <ToolButton
                onClick={onOpenSettings}
                title="设置"
                label="设置"
                color="bg-pop-cyan"
                textColor="text-pop-black"
                isMobile={isMobile}
                icon={<SettingsIcon className={isMobile ? mi : di} />}
              />
              <ToolButton
                onClick={onOpenManual}
                title="说明书"
                label="说明"
                color="bg-pop-yellow"
                textColor="text-pop-black"
                isMobile={isMobile}
                icon={<HelpCircle className={isMobile ? mi : di} />}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
