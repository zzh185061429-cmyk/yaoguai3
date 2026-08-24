import React from 'react';
import { Modal } from '../ui/Modal';
import { History } from 'lucide-react';
import { SAMPLE_DIALOGUE, SAMPLE_CHARACTERS } from '../../data/sampleData';

interface HistoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="历 史 / HISTORY" id="history-log-modal">
      <div className="space-y-8 pl-4 pr-6">
        {SAMPLE_DIALOGUE.map((line, index) => {
          const char = SAMPLE_CHARACTERS[line.characterId as keyof typeof SAMPLE_CHARACTERS];
          const isCyan = char.themeColor === 'cyan';
          
          return (
            <div key={line.id} className="relative group">
              {/* Decorative line connecting logs */}
              {index !== SAMPLE_DIALOGUE.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-[-32px] w-[2px] bg-ink-700/50 group-hover:bg-ink-600 transition-colors" />
              )}
              
              <div className="flex gap-6 items-start relative">
                {/* Timeline node */}
                <div className={`mt-1.5 shrink-0 w-[24px] h-[24px] rounded-full border-2 bg-ink-900 flex items-center justify-center shadow-lg
                  ${isCyan ? 'border-cyan-500 text-cyan-500' : 'border-vermilion-500 text-vermilion-500'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${isCyan ? 'bg-cyan-500' : 'bg-vermilion-500'}`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 bg-ink-800/30 p-4 rounded-lg border border-transparent hover:border-ink-700/50 transition-colors">
                  <div className={`font-serif text-lg mb-2 tracking-widest ${isCyan ? 'text-cyan-400' : 'text-vermilion-400'}`}>
                    {char.name}
                  </div>
                  <div className="text-paper-200 leading-relaxed font-sans font-light tracking-wide text-[15px]">
                    {line.text}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
