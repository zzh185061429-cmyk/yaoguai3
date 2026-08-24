import React, { useEffect, useState, useRef } from 'react';
import { useGameContext, ClueType } from '../../store/GameContext';
import { MessageSquare, Box, MapPin, Users } from 'lucide-react';

export const TextSelectionClue: React.FC = () => {
  const { addClue, isInvestigating, setIsInvestigating } = useGameContext();
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInvestigating) {
      setSelectionRect(null);
      setSelectedText('');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const handleSelectionChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
          const text = selection.toString().trim();
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            setSelectedText(text);
            setSelectionRect(rect);
          }
        } else {
          setSelectionRect(null);
          setSelectedText('');
        }
      }, 100);
    };

    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      // Don't do anything if we click inside the popover
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      handleSelectionChange();
    };

    const handleScroll = () => {
      setSelectionRect(null);
      setSelectedText('');
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    window.addEventListener('scroll', handleScroll, true); // true for capturing phase to catch inner scrolls

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isInvestigating]);

  if (!selectionRect || !selectedText || !isInvestigating) return null;

  const handleAddClue = () => {
    addClue(selectedText, '玩家收集');
    setSelectionRect(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div
      ref={popoverRef}
      className="fixed z-[1000] animate-in fade-in zoom-in duration-200 pointer-events-auto"
      style={{
        top: Math.max(10, selectionRect.top - 50),
        left: selectionRect.left + selectionRect.width / 2,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center bg-ink-900 border border-gold-500/50 rounded shadow-lg shadow-black/50 overflow-hidden">
        <button
          onClick={handleAddClue}
          className="flex items-center gap-2 px-4 py-2 hover:bg-ink-800 transition-colors group"
        >
          <Box size={14} className="text-gold-400 opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="font-sans text-xs tracking-widest text-paper-200 whitespace-nowrap">收集线索</span>
        </button>
      </div>
    </div>
  );
};
