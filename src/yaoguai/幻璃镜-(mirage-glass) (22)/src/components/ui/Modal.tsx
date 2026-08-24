import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  id?: string;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, id, fullScreen = false, onToggleFullScreen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto" id={id}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`relative flex flex-col bg-ink-800 border-ink-700/50 shadow-2xl overflow-hidden ${
              fullScreen ? 'w-full h-full rounded-none border-0' : 'w-full max-w-4xl max-h-[85vh] rounded-2xl border'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-ink-700/50 bg-ink-900/50 relative overflow-hidden shrink-0">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-gold-500"></div>
              <h2 className="font-serif text-2xl text-paper-100 tracking-widest">{title}</h2>
              <div className="flex items-center gap-2">
                {onToggleFullScreen && (
                  <button
                    onClick={onToggleFullScreen}
                    className="p-2 text-paper-200 hover:text-cyan-400 transition-colors rounded-full hover:bg-ink-700/50"
                  >
                    {fullScreen ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-paper-200 hover:text-vermilion-500 transition-colors rounded-full hover:bg-ink-700/50"
                  id="modal-close-btn"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${fullScreen ? '' : 'p-8'}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
