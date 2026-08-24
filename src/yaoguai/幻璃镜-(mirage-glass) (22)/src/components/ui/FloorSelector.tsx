import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, ChevronDown, CornerDownRight, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAssistantFloors } from '../../utils/floorNav';
import { useGameContext } from '../../store/GameContext';
import { cn } from '../../utils';
import { useIsMobile } from '../../hooks';

const FLOORS_PER_PAGE = 10;

/** 楼层下拉选择器 — 虚拟楼层导航，支持“跟随最新”和历史楼层查看，每10楼翻页 */
export function FloorSelector({ isLarge = false }: { isLarge?: boolean }) {
  const [floors, setFloors] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { viewingFloorId, setViewingFloor, lastAssistantFloorId, isViewingHistory, isGenerating, generatingFloorId } = useGameContext();
  const isMobile = useIsMobile();

  // 初始化：扫描所有 assistant 楼层
  useEffect(() => {
    setFloors(getAssistantFloors());
  }, []);

  const totalPages = Math.ceil(floors.length / FLOORS_PER_PAGE);

  // 当前页的楼层列表
  const pageFloors = useMemo(() => {
    const start = currentPage * FLOORS_PER_PAGE;
    return floors.slice(start, start + FLOORS_PER_PAGE);
  }, [floors, currentPage]);

  // 自动跳到当前查看楼层所在页
  useEffect(() => {
    if (!isOpen || floors.length === 0) return;
    const targetFloor = viewingFloorId ?? lastAssistantFloorId;
    if (targetFloor == null) return;
    const idx = floors.indexOf(targetFloor);
    if (idx >= 0) {
      const page = Math.floor(idx / FLOORS_PER_PAGE);
      setCurrentPage(page);
    } else {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [isOpen, viewingFloorId, lastAssistantFloorId, floors, totalPages]);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      const allFloors = getAssistantFloors();
      if (isGenerating && generatingFloorId != null) {
        setFloors(allFloors.filter(f => f < generatingFloorId));
      } else {
        setFloors(allFloors);
      }
      const targetFloor = viewingFloorId ?? lastAssistantFloorId;
      if (targetFloor != null) {
        const idx = allFloors.indexOf(targetFloor);
        if (idx >= 0) {
          setCurrentPage(Math.floor(idx / FLOORS_PER_PAGE));
        } else {
          setCurrentPage(Math.max(0, Math.ceil(allFloors.length / FLOORS_PER_PAGE) - 1));
        }
      }
    }
    setIsOpen((p) => !p);
  }, [isOpen, isGenerating, generatingFloorId, viewingFloorId, lastAssistantFloorId]);

  const handleSelect = useCallback(
    (floorId: number | null) => {
      setIsOpen(false);
      setViewingFloor(floorId);
    },
    [setViewingFloor],
  );

  const handlePrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(0, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const displayFloor = viewingFloorId ?? (isGenerating ? lastAssistantFloorId : (generatingFloorId ?? lastAssistantFloorId));

  const pageStart = currentPage * FLOORS_PER_PAGE + 1;
  const pageEnd = Math.min((currentPage + 1) * FLOORS_PER_PAGE, floors.length);

  return (
    <div className="relative shrink-0">
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center bg-ink-900 border border-cyan-900/50 cursor-pointer hover:border-cyan-500 transition-colors rounded-sm shrink-0",
          isMobile ? "py-0.5 px-1 gap-1" : isLarge ? "py-2 px-3 gap-1.5" : "py-1 px-2 gap-1.5",
        )}
        title="楼层导航"
      >
        <Layers className={cn("shrink-0 text-cyan-400", isMobile ? "w-3 h-3" : isLarge ? "w-6 h-6" : "w-3.5 h-3.5")} />
        <span className={cn("font-serif tabular-nums text-paper-200", isMobile ? "text-[7px]" : isLarge ? "text-xs" : "text-xs")}>
          {`#${displayFloor}`}
        </span>
        <ChevronDown
          className={cn('transition-transform duration-200 text-ink-500', isMobile ? 'w-3 h-3' : isLarge ? 'w-4 h-4' : 'w-3 h-3', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className={cn("fixed left-1/2 -translate-x-1/2 overflow-hidden bg-ink-900/95 backdrop-blur-md border border-cyan-900/50 z-50 rounded-lg shadow-2xl flex flex-col", isLarge ? "top-20 w-56 max-h-70vh" : "top-16 w-44 max-h-60vh")}>
            {/* 标题栏 */}
            <div className={cn("sticky top-0 bg-cyan-950/60 text-cyan-300 font-serif border-b border-cyan-900/50 flex items-center justify-between shrink-0", isLarge ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5")}>
              <span className="tracking-widest">助手楼层 ({floors.length})</span>
              {totalPages > 1 && (
                <span className={cn("text-paper-200/60", isLarge ? "text-xs" : "text-[10px]")}>
                  {pageStart}-{pageEnd}/{floors.length}
                </span>
              )}
            </div>

            {/* 楼层列表 */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {/* “跟随最新” 选项 — 仅在第1页显示 */}
              {currentPage === 0 && (
                <button
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full text-left font-serif transition-colors flex items-center gap-2 border-b border-ink-800',
                    isLarge ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm',
                    !isViewingHistory
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-paper-200 hover:bg-ink-800 hover:text-cyan-400',
                  )}
                >
                  <Navigation
                    className={cn('shrink-0', isLarge ? 'w-4 h-4' : 'w-3 h-3', !isViewingHistory ? 'text-gold-400' : 'opacity-40')}
                  />
                  <span className="tracking-widest">跟随最新</span>
                  {!isViewingHistory && (
                    <span className={cn("ml-auto text-gold-500/70", isLarge ? "text-xs" : "text-[10px]")}>◀ 当前</span>
                  )}
                </button>
              )}

              {pageFloors.map((f) => {
                const isActive = f === viewingFloorId;
                return (
                  <button
                    key={f}
                    onClick={() => handleSelect(f)}
                    className={cn(
                      'w-full text-left font-serif transition-colors flex items-center gap-2',
                      isLarge ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm',
                      isActive
                        ? 'text-gold-400 bg-gold-500/10'
                        : 'text-paper-200 hover:bg-ink-800 hover:text-cyan-400',
                    )}
                  >
                    <CornerDownRight
                      className={cn('shrink-0', isLarge ? 'w-4 h-4' : 'w-3 h-3', isActive ? 'text-gold-400' : 'opacity-40')}
                    />
                    <span className="tabular-nums tracking-widest">#{f}</span>
                    {isActive && (
                      <span className={cn("ml-auto text-gold-500/70", isLarge ? "text-xs" : "text-[10px]")}>◀ 查看中</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 翻页控制栏 */}
            {totalPages > 1 && (
              <div className={cn("shrink-0 bg-ink-900 border-t border-ink-800 flex items-center justify-between gap-2", isLarge ? "px-3 py-2" : "px-2 py-1.5")}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className={cn(
                    'flex items-center gap-1 font-serif tracking-widest border border-ink-700 transition-colors rounded',
                    isLarge ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]',
                    currentPage === 0
                      ? 'text-ink-700 cursor-not-allowed'
                      : 'text-paper-200 hover:bg-cyan-900/30 hover:border-cyan-700',
                  )}
                >
                  <ChevronLeft className={isLarge ? "w-4 h-4" : "w-3 h-3"} />
                  上一页
                </button>
                <span className={cn("text-paper-200/60 font-serif tabular-nums", isLarge ? "text-xs" : "text-[10px]")}>
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className={cn(
                    'flex items-center gap-1 font-serif tracking-widest border border-ink-700 transition-colors rounded',
                    isLarge ? 'px-3 py-1.5 text-xs' : 'px-2 py-1 text-[10px]',
                    currentPage >= totalPages - 1
                      ? 'text-ink-700 cursor-not-allowed'
                      : 'text-paper-200 hover:bg-cyan-900/30 hover:border-cyan-700',
                  )}
                >
                  下一页
                  <ChevronRight className={isLarge ? "w-4 h-4" : "w-3 h-3"} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
