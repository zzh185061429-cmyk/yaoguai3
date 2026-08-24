import React from 'react';
import { motion } from 'motion/react';
import { useTypewriter } from '../../hooks/useTypewriter';
import { Character, DialogueLine } from '../../types';
import { useGameContext } from '../../store/GameContext';

interface DialogueBoxProps {
  line: DialogueLine;
  character?: Character;
  onNext: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  isAuto: boolean;
  isSkip: boolean;
  onToggleAuto: () => void;
  onToggleSkip: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ 
  line, character, onNext, onOpenHistory, onOpenSettings,
  isAuto, isSkip, onToggleAuto, onToggleSkip
}) => {
  const { displayedText, isTyping, skip } = useTypewriter(line.text, 40);
  const { isInvestigating, setIsInvestigating } = useGameContext();

  React.useEffect(() => {
    if (!isTyping) {
      if (isSkip) {
        const timer = setTimeout(onNext, 100);
        return () => clearTimeout(timer);
      } else if (isAuto) {
        const timer = setTimeout(onNext, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      if (isSkip) {
        skip();
      }
    }
  }, [isTyping, isSkip, isAuto, onNext, skip, line]);

  const handleClick = (e: React.MouseEvent) => {
    if (isInvestigating) {
      return;
    }

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      return;
    }

    if (isSkip) {
      onToggleSkip();
      return;
    }
    if (isAuto) {
      onToggleAuto();
    }
    if (isTyping) {
      skip();
    } else {
      onNext();
    }
  };

  const isRed = character?.themeColor !== 'cyan';

  const quickActions = [
    { id: 'auto', label: '自动', action: onToggleAuto, active: isAuto },
    { id: 'skip', label: '快进', action: onToggleSkip, active: isSkip },
    { id: 'investigate', label: '勘验', action: () => setIsInvestigating(!isInvestigating), active: isInvestigating },
    { id: 'log', label: '案录', action: onOpenHistory, active: false },
    { id: 'opt', label: '仪轨', action: onOpenSettings, active: false },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none font-serif">
      <div className="w-full relative pointer-events-auto">
        
        {/* 说话者姓名牌 — 仿古朱漆木雕名贴 */}
        <div className="absolute -top-7 left-6 sm:left-10 z-30">
          <motion.div 
            key={character?.id || 'speaker'}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#1c130b]/95 border-2 border-b-0 border-[#78591c] px-5 py-1.5 rounded-t-xs shadow-lg flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion-800" />
            <span className="font-serif text-lg tracking-[0.2em] font-bold text-paper-50 drop-shadow-md">
              {character?.name || '旁白'}
            </span>
            {character?.title && (
              <span className="font-serif text-xs tracking-wider text-gold-300 opacity-80 border-l border-[#52432d] pl-2">
                {character.title.split('·')[0]}
              </span>
            )}
          </motion.div>
        </div>

        {/* 宣纸古风对白底框 */}
        <div 
          onClick={handleClick}
          className={`relative w-full min-h-[190px] max-h-[260px] bg-linear-to-t from-[#0c0805]/98 via-[#130d08]/92 to-[#1a120b]/75 border-t border-[#52432d] cursor-pointer overflow-hidden px-8 sm:px-14 pt-8 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.85)] ${isInvestigating ? 'border-2 border-vermilion-800 bg-[#1a0a08]/90' : ''}`}
          id="dialogue-box"
        >
          {isInvestigating && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-vermilion-400 font-serif text-xs tracking-widest animate-pulse font-bold bg-[#140604] px-4 py-0.5 border border-vermilion-800 rounded-xs">
              【勘验模式已开启 · 划词选录线索】
            </div>
          )}

          {/* 左侧朱砂古籍装订朱红细线 */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-linear-to-b from-vermilion-800 via-gold-500/60 to-transparent" />
          
          {/* 对白正文（大字清晰、水墨宣纸韵味） */}
          <div 
            className={`font-serif text-[20px] sm:text-[22px] tracking-[0.08em] leading-[1.8] text-paper-100 font-medium relative z-10 max-w-[88%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] cursor-text ${isInvestigating ? 'select-text' : 'select-none'}`}
            style={isInvestigating ? { WebkitTouchCallout: 'default', WebkitUserSelect: 'text', userSelect: 'text' } : {}}
          >
            {displayedText}
            {!isTyping && (
              <motion.span 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 1.1 }}
                className="inline-block w-2.5 h-4 ml-2 align-middle bg-gold-300"
              />
            )}
          </div>
          
          {/* 右下角：仿古快捷操控木签（自动、快进、勘验、案录、仪轨） */}
          <div className="absolute bottom-4 right-6 sm:right-10 flex items-center gap-2 z-30 pointer-events-auto select-none">
            {quickActions.map(btn => (
              <button 
                key={btn.id}
                onClick={(e) => { e.stopPropagation(); btn.action(); }}
                className={`px-2.5 py-1 rounded-xs font-serif text-xs tracking-widest border transition-all cursor-pointer ${
                  btn.active 
                    ? 'bg-vermilion-800 border-vermilion-600 text-paper-50 shadow-sm font-bold' 
                    : 'bg-[#18110a]/90 border-[#4a3925] text-paper-500 hover:text-gold-300 hover:border-gold-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
