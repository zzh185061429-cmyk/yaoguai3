import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAssistantFloors } from '../../utils/floorNav';
import { useGameContext } from '../../store/GameContext';
import { cn } from '../../utils';
import { useIsMobile } from '../../hooks';

const FLOORS_PER_PAGE = 10;

/** 楼层选择器 — 仿古木刻卷轴楼层导航，纯正古风印牌设计 */
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
          "flex items-center bg-[#1c140c] border border-[#6e5535] hover:border-[#b89552] transition-colors rounded-xs shrink-0 cursor-pointer shadow-sm",
          isMobile ? "py-1 px-1.5 gap-1" : isLarge ? "py-1.5 px-3 gap-2" : "py-1 px-2.5 gap-1.5",
        )}
        title="翻阅层卷"
      >
        <span className={cn("font-serif text-gold-300 font-bold", isMobile ? "text-[8px]" : isLarge ? "text-xs" : "text-[10px]")}>
          卷
        </span>
        <span className={cn("font-serif tabular-nums text-paper-50 font-bold tracking-wider", isMobile ? "text-[8px]" : isLarge ? "text-xs" : "text-[10px]")}>
          {`#${displayFloor}`}
        </span>
        <span className={cn('text-paper-500 transition-transform duration-200 text-[9px]', isOpen && 'rotate-180')}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className={cn("fixed left-1/2 -translate-x-1/2 overflow-hidden bg-[#16100b]/95 backdrop-blur-md border border-[#6b583e] z-50 rounded-xs shadow-2xl flex flex-col font-serif", isLarge ? "top-20 w-56 max-h-70vh" : "top-14 w-44 max-h-60vh")}>
            {/* 标题栏 */}
            <div className={cn("sticky top-0 bg-[#22170e] text-gold-300 font-serif border-b border-[#52432d] flex items-center justify-between shrink-0", isLarge ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5")}>
              <span className="tracking-widest font-bold">卷宗层数 ({floors.length})</span>
              {totalPages > 1 && (
                <span className={cn("text-paper-400", isLarge ? "text-xs" : "text-[10px]")}>
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
                    'w-full text-left font-serif transition-colors flex items-center gap-2 border-b border-[#3d2e1c] cursor-pointer',
                    isLarge ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                    !isViewingHistory
                      ? 'text-gold-300 bg-[#2a1d12] font-bold'
                      : 'text-paper-400 hover:bg-[#20150d] hover:text-gold-300',
                  )}
                >
                  <span className="text-xs text-gold-500">✦</span>
                  <span className="tracking-widest">跟随最新案情</span>
                  {!isViewingHistory && (
                    <span className={cn("ml-auto text-vermilion-400", isLarge ? "text-xs" : "text-[10px]")}>当前</span>
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
                      'w-full text-left font-serif transition-colors flex items-center gap-2 cursor-pointer',
                      isLarge ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
                      isActive
                        ? 'text-gold-300 bg-[#2a1d12] font-bold'
                        : 'text-paper-400 hover:bg-[#20150d] hover:text-gold-300',
                    )}
                  >
                    <span className="text-[10px] text-paper-600">↳</span>
                    <span className="tabular-nums tracking-widest font-bold">#{f} 卷</span>
                    {isActive && (
                      <span className={cn("ml-auto text-gold-300", isLarge ? "text-xs" : "text-[10px]")}>审阅中</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 翻页控制栏 */}
            {totalPages > 1 && (
              <div className={cn("shrink-0 bg-[#1a120b] border-t border-[#3d2e1c] flex items-center justify-between gap-2", isLarge ? "px-3 py-2" : "px-2 py-1.5")}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className={cn(
                    'flex items-center gap-1 font-serif tracking-widest border border-[#52432d] transition-colors rounded-xs cursor-pointer',
                    isLarge ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
                    currentPage === 0
                      ? 'text-[#5a4835] cursor-not-allowed opacity-40'
                      : 'text-gold-300 hover:bg-[#281c12] hover:border-gold-700',
                  )}
                >
                  前页
                </button>
                <span className={cn("text-paper-400 font-serif tabular-nums", isLarge ? "text-xs" : "text-[10px]")}>
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className={cn(
                    'flex items-center gap-1 font-serif tracking-widest border border-[#52432d] transition-colors rounded-xs cursor-pointer',
                    isLarge ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
                    currentPage >= totalPages - 1
                      ? 'text-[#5a4835] cursor-not-allowed opacity-40'
                      : 'text-gold-300 hover:bg-[#281c12] hover:border-gold-700',
                  )}
                >
                  后页
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
