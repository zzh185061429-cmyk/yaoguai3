import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useIsMobile } from '../../hooks';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  id?: string;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
  variant?: 'default' | 'blank';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, id, fullScreen = false, onToggleFullScreen, variant = 'default' }) => {
  const isMobile = useIsMobile();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={"fixed inset-0 z-40 flex items-center justify-center pointer-events-auto " + (isMobile ? "p-0" : "p-4 sm:p-6")} id={id}>
          {/* Backdrop with ink wash blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/85 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`relative flex flex-col overflow-hidden ${
              variant === 'default'
                ? `bg-linear-to-b from-ink-900 via-ink-850 to-ink-950 border border-gold-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] ${fullScreen ? 'w-full h-full rounded-none border-0' : isMobile ? 'w-full h-full rounded-none border-0' : 'w-full max-w-4xl max-h-[88vh] rounded-xl'}`
                : `w-full h-full sm:w-[96vw] sm:h-[94vh] shadow-2xl ${fullScreen ? 'w-full h-full sm:w-full sm:h-full rounded-none' : 'rounded-sm'}`
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ornate Traditional Corner Accents */}
            {variant === 'default' && !fullScreen && (
              <>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-400/60 pointer-events-none z-20" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-400/60 pointer-events-none z-20" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-400/60 pointer-events-none z-20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-400/60 pointer-events-none z-20" />
              </>
            )}

            {variant === 'default' && (
              <>
                {/* Subtle Ancient Xuan Paper / Stardust Grain */}
                <div
                  className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: 'radial-gradient(#e5be62 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* Header (Ancient Plaque Style) */}
                <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 border-b border-gold-500/20 bg-ink-950/70 relative overflow-hidden shrink-0">
                  {/* Decorative side accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b from-gold-400 via-vermilion-500 to-cyan-500" />

                  <div className="flex items-center gap-2 sm:gap-3 pl-2 min-w-0">
                    <span className="text-gold-400 opacity-60 font-serif text-sm hidden sm:inline">❖</span>
                    <h2 className="font-serif text-lg sm:text-2xl text-paper-100 tracking-[0.15em] sm:tracking-[0.25em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                      {title}
                    </h2>
                    <span className="text-gold-400 opacity-60 font-serif text-sm hidden sm:inline">❖</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onToggleFullScreen && (
                      <button
                        onClick={onToggleFullScreen}
                        className="p-2 text-paper-300 hover:text-gold-300 transition-colors rounded-lg hover:bg-gold-500/10 border border-transparent hover:border-gold-500/30"
                        title={fullScreen ? "退出全屏" : "全屏查看"}
                      >
                        {fullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 text-paper-300 hover:text-vermilion-400 transition-colors rounded-lg hover:bg-vermilion-500/10 border border-transparent hover:border-vermilion-500/30 group"
                      id="modal-close-btn"
                      title="关闭"
                    >
                      <X size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                </div>

                {/* Classical Divider under header */}
                <div className="w-full h-px bg-linear-to-r from-transparent via-gold-500/40 to-transparent shrink-0" />
              </>
            )}

            {/* Content */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar relative z-10 ${variant === 'default' ? (fullScreen || isMobile ? 'p-3 sm:p-6' : 'p-6 sm:p-8') : ''}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
