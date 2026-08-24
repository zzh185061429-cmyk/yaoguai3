import React, { useState, useRef, useCallback } from 'react';
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
  onOpenClues?: () => void;
  onOpenHarem?: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

/** 仿古宣纸木牌按钮 — 纯正古风印鉴与木雕质感 */
function TraditionalTagButton({
  id, onClick, title, label, tagPrefix, colorStyle, disabled, isMobile, isLarge,
}: {
  id?: string;
  onClick: () => void;
  title: string;
  label: string;
  tagPrefix?: string;
  colorStyle: string;
  disabled?: boolean;
  isMobile?: boolean;
  isLarge?: boolean;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex items-center justify-center shrink-0 border transition-all relative group cursor-pointer select-none",
        "hover:brightness-110 active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.6)]",
        isMobile ? "py-1 px-1.5 min-w-8.5" : isLarge ? "py-1.5 px-3 min-w-14.5" : "py-1 px-2.5 min-w-11",
        colorStyle,
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {/* 四角仿古暗纹微角 */}
      <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-current opacity-40 pointer-events-none" />
      <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-current opacity-40 pointer-events-none" />
      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-current opacity-40 pointer-events-none" />
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-current opacity-40 pointer-events-none" />

      <div className="flex flex-col items-center justify-center gap-0.5">
        {tagPrefix && (
          <span className={cn(
            "font-serif opacity-60 leading-none",
            isMobile ? "text-[7px]" : isLarge ? "text-[10px]" : "text-[8px]"
          )}>
            {tagPrefix}
          </span>
        )}
        <span className={cn(
          "font-serif tracking-[0.2em] font-bold leading-none pl-[0.2em] whitespace-nowrap",
          isMobile ? "text-[9px]" : isLarge ? "text-[13px]" : "text-[11px]",
        )}>
          {label}
        </span>
      </div>
    </button>
  );
}

export function HUD({
  isFullscreen, onToggleFullscreen,
  onOpenThinking, onOpenVariables, onOpenReading, onOpenDelete,
  onOpenSettings, onOpenManual, onOpenCalendar, onOpenClues, onOpenHarem,
  onRegenerate, regenerating,
}: HUDProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 鼠标滚轮垂直滚动 → HUD 水平滚动
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    // 只在内容溢出时才转换
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }, []);

  // 全屏 + 桌面端 → 使用放大尺寸
  const isLarge = isFullscreen && !isMobile;
  const sepHeight = isLarge ? "h-9" : "h-7";

  return (
    <div className={cn("z-40 pointer-events-auto", isMobile ? "relative w-full" : "fixed top-0 left-1/2 -translate-x-1/2")} id="hud-navigation-bar">
      <AnimatePresence mode="wait">
        {(isCollapsed && !isMobile) ? (
          /* ── 收起态：木匾印牌 ── */
          <motion.button
            id="btn-hud-expand"
            key="collapsed"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCollapsed(false)}
            className="bg-[#18120b] border-2 border-t-0 border-[#78591c] rounded-b-xs shadow-[0_8px_20px_rgba(0,0,0,0.8)] px-4 py-1.5 flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-gold-300 cursor-pointer"
            title="展布案牍仪轨"
          >
            <span className="text-xs font-serif text-gold-500">▼</span>
            <span className="text-xs font-serif tracking-[0.3em] font-bold text-paper-50 pl-[0.3em]">天 枢 案 牍</span>
          </motion.button>
        ) : (
          /* ── 展开态：线装宣纸木雕案牍工具栏 ── */
          <motion.div
            id="hud-toolbar-panel"
            key="expanded"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-[#150f0a]/95 backdrop-blur-md border border-[#52432d] border-t-0",
              isLarge ? "py-2.5 px-4" : "py-1.5 px-3",
              isMobile
                ? "w-full min-w-0 border-x-0"
                : "rounded-b-xs shadow-[0_12px_35px_rgba(0,0,0,0.9)] border-t-0",
            )}
          >
            {/* 顶栏暗铜装订边线 */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-transparent via-[#8a7047] to-transparent pointer-events-none" />

            <div ref={scrollRef} onWheel={handleWheel} className={cn("flex items-center w-full min-w-0", isMobile ? "gap-1 justify-start overflow-x-auto hide-scrollbar py-0.5 [-webkit-overflow-scrolling:touch]" : isLarge ? "gap-2" : "gap-1.5")}>
              
              {/* 收起匾牌按钮 — 仅桌面端 */}
              {!isMobile && (
                <button
                  id="btn-hud-collapse"
                  onClick={() => setIsCollapsed(true)}
                  className={cn(
                    "shrink-0 flex items-center justify-center bg-[#20160d] text-gold-300 hover:text-paper-50 hover:bg-[#302115] transition-colors border border-[#6b5437] rounded-xs cursor-pointer",
                    isLarge ? "w-8 h-8 text-xs font-serif" : "w-6 h-6 text-[10px] font-serif",
                  )}
                  title="收起案牍"
                >
                  ▲
                </button>
              )}

              {!isMobile && <div className={cn("w-px bg-[#453624] shrink-0", sepHeight)} />}

              {/* 屏息全屏 */}
              <TraditionalTagButton
                id="btn-hud-fullscreen"
                onClick={onToggleFullscreen}
                title={isFullscreen ? "退出屏息" : "全屏屏息"}
                label={isFullscreen ? "常态" : "屏息"}
                colorStyle="bg-[#1c140c] border-[#5e4930] text-paper-200 hover:border-[#a8894d]"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              {/* 楼层导航 */}
              <FloorSelector isLarge={isLarge} />

              {!isMobile && <div className={cn("w-px bg-[#453624] shrink-0", sepHeight)} />}

              {/* 通书时历 */}
              <TraditionalTagButton
                id="btn-hud-calendar"
                onClick={onOpenCalendar}
                title="岁时通书与时辰"
                label="通书"
                colorStyle="bg-[#24180d] border-[#8a6828] text-gold-300 hover:border-gold-500"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              {/* 密札推演 */}
              {onOpenClues && (
                <TraditionalTagButton
                  id="btn-hud-clues"
                  onClick={onOpenClues}
                  title="案卷密札推演"
                  label="密札"
                  colorStyle="bg-[#220d0a] border-vermilion-800 text-vermilion-300 hover:border-vermilion-600"
                  isMobile={isMobile}
                  isLarge={isLarge}
                />
              )}

              {/* 红颜谱 */}
              {onOpenHarem && (
                <TraditionalTagButton
                  id="btn-hud-harem"
                  onClick={onOpenHarem}
                  title="红颜画卷·灵魅谱"
                  label="红颜"
                  colorStyle="bg-[#260e0a] border-[#9c251b] text-vermilion-300 hover:border-vermilion-400"
                  isMobile={isMobile}
                  isLarge={isLarge}
                />
              )}

              {!isMobile && <div className={cn("w-px bg-[#453624] shrink-0", sepHeight)} />}

              {/* 剧情与思辨 */}
              <TraditionalTagButton
                id="btn-hud-history"
                onClick={onOpenReading}
                title="案情溯回录"
                label="溯回"
                colorStyle="bg-[#101b1b] border-[#225757] text-cyan-300 hover:border-cyan-700"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              <TraditionalTagButton
                id="btn-hud-thinking"
                onClick={onOpenThinking}
                title="灵境神识思维链"
                label="神识"
                colorStyle="bg-[#101b1b] border-[#225757] text-cyan-300 hover:border-cyan-700"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              <TraditionalTagButton
                id="btn-hud-variables"
                onClick={onOpenVariables}
                title="天机造化变量"
                label="天机"
                colorStyle="bg-[#241a0d] border-[#8a6828] text-[#e8c86b] hover:border-gold-500"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              {!isMobile && <div className={cn("w-px bg-[#453624] shrink-0", sepHeight)} />}

              {/* 焚卷 */}
              <TraditionalTagButton
                id="btn-hud-delete-floor"
                onClick={onOpenDelete}
                title="焚卷抽条（删除楼层）"
                label="焚卷"
                colorStyle="bg-[#220d09] border-[#881c14] text-[#e85a4a] hover:border-[#ba291d]"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              {!isMobile && <div className={cn("w-px bg-[#453624] shrink-0", sepHeight)} />}

              {/* 系统与通鉴 */}
              <TraditionalTagButton
                id="btn-hud-regenerate"
                onClick={onRegenerate}
                title="重新问卜推演"
                label={regenerating ? "推演中" : "重演"}
                disabled={regenerating}
                colorStyle="bg-[#1c140c] border-[#5e4930] text-paper-200 hover:border-[#a8894d]"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              <TraditionalTagButton
                id="btn-hud-settings"
                onClick={onOpenSettings}
                title="仪轨设置"
                label="仪轨"
                colorStyle="bg-[#1a140f] border-[#5a4630] text-paper-400 hover:border-gold-700"
                isMobile={isMobile}
                isLarge={isLarge}
              />

              <TraditionalTagButton
                id="btn-hud-manual"
                onClick={onOpenManual}
                title="操作通鉴"
                label="通鉴"
                colorStyle="bg-[#241a0d] border-[#8a6828] text-[#e8c86b] hover:border-gold-500"
                isMobile={isMobile}
                isLarge={isLarge}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
