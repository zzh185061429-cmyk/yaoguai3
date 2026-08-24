import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { AlertCircle, CheckCircle2, Info, ShieldAlert, Sparkles, ScrollText } from 'lucide-react';
import { cn } from '../../utils';

export const NotificationSystem: React.FC = () => {
  const { notifications } = useGameContext();

  return (
    <div 
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 pointer-events-none w-full max-w-md items-center px-4"
      id="notification-container"
    >
      <AnimatePresence>
        {notifications.map((notification) => {
          let Icon = ScrollText;
          let containerStyle = 'bg-[#181410]/95 border-[#8a7556] text-gold-300 shadow-[0_8px_25px_rgba(0,0,0,0.8)]';
          let sealText = '通谕';
          let sealClass = 'border-gold-500 text-gold-500 bg-gold-500/10';

          if (notification.type === 'warning') {
            Icon = ShieldAlert;
            containerStyle = 'bg-[#210c0a]/95 border-vermilion-700 text-paper-100 shadow-[0_8px_25px_rgba(148,32,22,0.4)]';
            sealText = '戒饬';
            sealClass = 'border-vermilion-500 text-vermilion-500 bg-vermilion-500/15';
          } else if (notification.type === 'success') {
            Icon = Sparkles;
            containerStyle = 'bg-[#151d16]/95 border-jade-500 text-paper-100 shadow-[0_8px_25px_rgba(51,141,98,0.3)]';
            sealText = '昭验';
            sealClass = 'border-jade-400 text-jade-400 bg-jade-400/15';
          }

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-sm border backdrop-blur-md",
                containerStyle
              )}
              id={`notification-${notification.id}`}
            >
              {/* 拟古印章徽标 */}
              <span className={cn(
                "px-1.5 py-0.5 text-[11px] font-serif border font-bold rounded-xs tracking-widest",
                sealClass
              )}>
                {sealText}
              </span>
              <div className="flex items-center gap-2">
                <Icon size={16} className="shrink-0" />
                <span className="font-serif text-[13px] tracking-wider leading-none">
                  {notification.message}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
