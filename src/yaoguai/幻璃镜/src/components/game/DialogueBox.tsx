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
  const { addNotification, isInvestigating, setIsInvestigating } = useGameContext();

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

    // If the user has text selected, don't advance dialogue
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
      return;
    }

    if (isSkip) {
      onToggleSkip(); // stop skipping on click
      return;
    }
    if (isAuto) {
      onToggleAuto(); // stop auto on click
    }
    if (isTyping) {
      skip();
    } else {
      onNext();
    }
  };

  const isCyan = character?.themeColor === 'cyan';
  const themeColorClass = isCyan ? 'text-cyan-400 border-cyan-500/50' : 'text-vermilion-400 border-vermilion-500/50';
  const bgGlowClass = isCyan ? 'from-cyan-900/30' : 'from-vermilion-900/30';

  const quickActions = [
    { id: 'auto', label: '自动', sub: 'AUTO', action: onToggleAuto, active: isAuto },
    { id: 'skip', label: '快进', sub: 'SKIP', action: onToggleSkip, active: isSkip },
    { id: 'investigate', label: '调查', sub: 'INV', action: () => setIsInvestigating(!isInvestigating), active: isInvestigating },
    { id: 'log', label: '历史', sub: 'LOG', action: onOpenHistory, active: false },
    { id: 'opt', label: '设置', sub: 'OPT', action: onOpenSettings, active: false },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
      <div className="w-full relative pointer-events-auto">
        
        {/* Name Plate (Floating above text box) */}
        <div className="absolute -top-5 left-4 z-30">
          <motion.div 
            key={character?.id}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`bg-ink-900/40 px-4 py-1 relative overflow-hidden rounded-t-sm`}
          >
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-t ${isCyan ? 'from-cyan-500' : 'from-vermilion-500'} to-transparent`} />
            <div className="flex items-baseline gap-2 relative z-10">
              <span className={`font-serif text-xl tracking-[0.1em] font-medium drop-shadow-md ${isCyan ? 'text-cyan-300' : 'text-vermilion-300'}`}>
                {character?.name || '未知'}
              </span>
              {character?.title && (
                <span className="font-sans text-[10px] tracking-widest text-ink-400 uppercase opacity-80">
                  {character.title.split('·')[0]}
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Main Text Box (Flush to bottom) */}
        <div 
          onClick={handleClick}
          className={`relative w-full h-[200px] bg-transparent cursor-pointer overflow-hidden px-10 pt-10 pb-6 ${isInvestigating ? 'border border-gold-500/50 bg-ink-900/40' : ''}`}
          id="dialogue-box"
        >
          {isInvestigating && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gold-400 font-sans text-xs tracking-widest animate-pulse">
              调查模式已开启，请长按或滑动选择文本
            </div>
          )}
          {/* Subtle accent glow on the left edge instead of top */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-1/2 ${isCyan ? 'bg-cyan-500' : 'bg-vermilion-500'} opacity-30 blur-[1px]`} />
          
          {/* Dialogue Text */}
          <div 
            className={`font-sans text-[22px] tracking-[0.1em] leading-[2] text-paper-100 font-light relative z-10 max-w-[85%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] cursor-text ${isInvestigating ? 'select-text' : 'select-none'}`}
            style={isInvestigating ? { WebkitTouchCallout: 'default', WebkitUserSelect: 'text', userSelect: 'text' } : {}}
          >
            {displayedText}
            {/* Blinking cursor when done typing */}
            {!isTyping && (
              <motion.span 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 1.2 }}
                className={`inline-block w-3 h-5 ml-2 align-middle ${isCyan ? 'bg-cyan-400' : 'bg-vermilion-400'}`}
              />
            )}
          </div>
          
          {/* Galgame Quick Controls (Bottom Right) */}
          <div className="absolute bottom-6 right-12 flex items-center gap-6 z-30 pointer-events-auto">
            {quickActions.map(btn => (
              <button 
                key={btn.id}
                onClick={(e) => { e.stopPropagation(); btn.action(); }}
                className={`group flex flex-col items-center gap-1 transition-colors px-2 py-1 ${btn.active ? (isCyan ? 'text-cyan-400' : 'text-vermilion-400') : 'text-ink-500 hover:text-cyan-400'}`}
              >
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase transition-colors">
                  {btn.sub}
                </span>
                <span className={`font-serif text-xs tracking-widest transition-all duration-300 transform ${btn.active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                  {btn.label}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
