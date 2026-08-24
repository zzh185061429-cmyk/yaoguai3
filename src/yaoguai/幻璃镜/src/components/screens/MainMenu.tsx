import React from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { AtmosphereEffect } from '../ui/AtmosphereEffect';

export const MainMenu: React.FC = () => {
  const { setCurrentScreen } = useGameContext();

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full h-screen overflow-hidden bg-ink-900 cursor-pointer"
      id="screen-main-menu"
      onClick={() => setCurrentScreen('game')}
    >
      {/* Background CG - Japanese/Chinese Temple at Night (Ancient + Moody) */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], filter: ['brightness(0.6)', 'brightness(0.8)', 'brightness(0.6)'] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528646927357-55d81b29a286?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"
      />
      
      {/* Overlay Gradients for Depth and Layout */}
      <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
      
      {/* Atmospheric Particles */}
      <AtmosphereEffect />

      {/* Content Container */}
      <div className="absolute inset-0 p-16 flex flex-col items-center justify-center z-20 gap-16">
        
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-8xl font-serif text-paper-100 tracking-[0.2em] font-light drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-8">
            幻璃镜
          </h1>
          <p className="text-xl font-sans font-light tracking-[0.5em] text-cyan-400 uppercase">Mirage Glass: Urban Yaoguai Tales</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-col items-center gap-6 mt-12 bg-ink-900/60 p-8 rounded-sm border border-ink-800/50 backdrop-blur-md"
        >
          <p className="font-serif text-2xl tracking-[0.2em] text-paper-200">作者: Zzz</p>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-vermilion-500/50 to-transparent" />
          <p className="font-serif text-xl tracking-[0.1em] text-vermilion-400">严禁二改二传，类脑首发，偷卡死妈</p>
        </motion.div>

        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-16 font-sans text-sm tracking-[0.4em] text-paper-200/50 uppercase"
        >
          点击任意处进入幻境
        </motion.p>
      </div>
    </motion.div>
  );
};
