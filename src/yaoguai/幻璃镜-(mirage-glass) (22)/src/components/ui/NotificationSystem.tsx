import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const NotificationSystem: React.FC = () => {
  const { notifications } = useGameContext();

  return (
    <div 
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-md items-center"
      id="notification-container"
    >
      <AnimatePresence>
        {notifications.map((notification) => {
          let Icon = Info;
          let colorClass = 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10';
          
          if (notification.type === 'warning') {
            Icon = AlertCircle;
            colorClass = 'text-vermilion-500 border-vermilion-500/30 bg-vermilion-500/10';
          } else if (notification.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'text-gold-500 border-gold-500/30 bg-gold-500/10';
          }

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              className={`flex items-center gap-3 px-5 py-3 rounded-full border backdrop-blur-md shadow-2xl ${colorClass}`}
              id={`notification-${notification.id}`}
            >
              <Icon size={18} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <span className="font-sans text-sm font-medium tracking-wider">{notification.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
