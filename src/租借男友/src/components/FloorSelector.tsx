import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, ChevronDown, CornerDownRight, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { PopCard } from './ui/PopCard';
import { getAssistantFloors } from '../utils/floorNav';
import { useGameContext } from '../state/GameContext';
import { cn } from '../utils';
import { useIsMobile } from '../hooks';

const FLOORS_PER_PAGE = 10;

/** 楼层下拉选择器 — 虚拟楼层导航，支持"跟随最新"和历史楼层查看，每10楼翻页 */
export function FloorSelector() {
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
      // 最新楼层不在列表中（可能是生成中的新楼层），跳到最后一页
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [isOpen, viewingFloorId, lastAssistantFloorId, floors, totalPages]);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      const allFloors = getAssistantFloors();
      if (isGenerating && generatingFloorId != null) {
        setFloors(allFloors.filter(f => f < generatingFloorId));
      } else if (isGenerating) {
        setFloors(allFloors);
      } else {
        setFloors(allFloors);
      }
      // 重置到包含当前楼层的页
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
      <PopCard
        onClick={handleToggle}
        className={cn(
          "flex items-center bg-pop-black text-white cursor-pointer hover:bg-pop-pink transition-colors clip-diagonal shrink-0",
          isMobile ? "py-0.5 px-1 gap-1" : "py-1 px-2 gap-1.5",
        )}
        title="楼层导航"
      >
        <Layers className={cn("shrink-0 text-pop-cyan", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
        <span className={cn("font-bold tabular-nums", isMobile ? "text-[7px]" : "text-xs")}>
          {`#${displayFloor}`}
        </span>
        <ChevronDown
          className={cn('w-3 h-3 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </PopCard>

      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="fixed left-1/2 -translate-x-1/2 top-20 w-44 max-h-60vh overflow-hidden bg-pop-black border-2 border-white z-50 rounded shadow-[4px_4px_0_#fff] flex flex-col">
            {/* 标题栏 */}
            <div className="sticky top-0 bg-pop-cyan text-pop-black text-xs font-black px-3 py-1 border-b-2 border-white flex items-center justify-between shrink-0">
              <span>助手楼层 ({floors.length})</span>
              {totalPages > 1 && (
                <span className="text-[10px]">
                  {pageStart}-{pageEnd}/{floors.length}
                </span>
              )}
            </div>

            {/* 楼层列表 */}
            <div className="overflow-y-auto flex-1">
              {/* "跟随最新" 选项 — 仅在第1页显示 */}
              {currentPage === 0 && (
                <button
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm font-bold transition-colors flex items-center gap-2 border-b border-white/10',
                    !isViewingHistory
                      ? 'text-pop-yellow bg-white/10'
                      : 'text-white hover:bg-pop-pink hover:text-white',
                  )}
                >
                  <Navigation
                    className={cn('w-3 h-3 shrink-0', !isViewingHistory ? 'text-pop-yellow' : 'opacity-40')}
                  />
                  <span>跟随最新</span>
                  {!isViewingHistory && (
                    <span className="ml-auto text-[10px] text-pop-yellow/70">◀ 当前</span>
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
                      'w-full text-left px-3 py-1.5 text-sm font-bold transition-colors flex items-center gap-2',
                      isActive
                        ? 'text-pop-yellow bg-white/10'
                        : 'text-white hover:bg-pop-pink hover:text-white',
                    )}
                  >
                    <CornerDownRight
                      className={cn('w-3 h-3 shrink-0', isActive ? 'text-pop-yellow' : 'opacity-40')}
                    />
                    <span className="tabular-nums">#{f}</span>
                    {isActive && (
                      <span className="ml-auto text-[10px] text-pop-yellow/70">◀ 查看中</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 翻页控制栏 */}
            {totalPages > 1 && (
              <div className="shrink-0 bg-pop-black border-t-2 border-white/20 px-2 py-1.5 flex items-center justify-between gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[10px] font-black border border-white/30 transition-colors',
                    currentPage === 0
                      ? 'text-white/20 cursor-not-allowed'
                      : 'text-white hover:bg-pop-pink hover:border-pop-pink',
                  )}
                >
                  <ChevronLeft className="w-3 h-3" />
                  上一页
                </button>
                <span className="text-white/60 text-[10px] font-bold tabular-nums">
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[10px] font-black border border-white/30 transition-colors',
                    currentPage >= totalPages - 1
                      ? 'text-white/20 cursor-not-allowed'
                      : 'text-white hover:bg-pop-pink hover:border-pop-pink',
                  )}
                >
                  下一页
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
