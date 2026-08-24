import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { AtmosphereEffect } from '../ui/AtmosphereEffect';
import { sfx } from '../../audio/sfxPlayer';

export const MainMenu: React.FC = () => {
  const { setCurrentScreen } = useGameContext();
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenDossier = () => {
    if (isOpening) return;
    setIsOpening(true);
    sfx.play('pageTurn');

    // 案卷翻阅动画后进入游戏
    setTimeout(() => {
      setCurrentScreen('game');
    }, 700);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={handleOpenDossier}
      className="relative w-full h-screen overflow-hidden bg-[#0c0906] select-none font-serif flex flex-col items-center justify-between py-12 px-6 cursor-pointer"
      id="screen-main-menu"
    >
      {/* 水墨素雅暗纹底图 */}
      <div 
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528646927357-55d81b29a286?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-15 mix-blend-luminosity scale-100 pointer-events-none"
      />
      <div className="absolute inset-0 bg-linear-to-b from-[#0e0a07]/95 via-[#120d09]/85 to-[#080504]/98 pointer-events-none" />
      <AtmosphereEffect />

      {/* 宣纸线装古籍装订线与仿古回纹铜角 */}
      <div className="absolute inset-4 sm:inset-8 border border-[#4d3c26]/60 pointer-events-none rounded-xs">
        <div className="absolute inset-1.5 border border-gold-700/20 pointer-events-none" />
        
        {/* 左侧线装古籍孔眼与穿线效果 */}
        <div className="hidden sm:flex absolute left-4 inset-y-6 flex-col justify-between items-center py-6 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#080504] border border-[#6b583e]" />
              {i < 5 && <div className="w-0.5 h-16 bg-[#52432d]/40" />}
            </div>
          ))}
        </div>

        {/* 四角仿古铜包角 */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-gold-500/80" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-gold-500/80" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-gold-500/80" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-gold-500/80" />
      </div>

      {/* 顶部空间占位 */}
      <div className="h-4" />

      {/* 中央主视觉：八卦古铜镜 + 楷书书名 + 作者严正声明帖 */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto max-w-xl w-full text-center">
        
        {/* 幻璃古镜（青铜雕纹与幽光镜心） */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          whileHover={{ scale: 1.03 }}
          className="relative mb-6 flex items-center justify-center group"
        >
          {/* 青铜外圈 */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-[#78591c] bg-[#1a130c] shadow-[0_0_35px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-center">
            {/* 镜面幽光 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(72,139,133,0.25)_0%,transparent_70%)]" />
            <div className="absolute inset-2 rounded-full border border-gold-700/40" />
            
            {/* 镜心八卦铜印 */}
            <div className="flex flex-col items-center justify-center gap-1 text-gold-300">
              <span className="text-xl font-serif text-gold-500 opacity-80 group-hover:scale-110 transition-transform duration-500">
                ✦
              </span>
              <span className="text-[11px] font-serif tracking-[0.4em] text-paper-400 font-bold pl-[0.4em]">
                幻 璃 照 世
              </span>
            </div>
          </div>
        </motion.div>

        {/* 正楷题名 */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative mb-3"
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl text-paper-50 tracking-[0.25em] font-bold drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] pl-[0.25em]">
            <span className="bg-linear-to-b from-[#ffffff] via-[#faeed0] to-paper-400 bg-clip-text text-transparent">
              幻璃镜
            </span>
          </h1>
        </motion.div>

        {/* 作者严正声明（古风宣纸朱印帖） */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="bg-[#18120c]/90 border border-[#52432d] py-3 px-6 rounded-xs shadow-xl my-4 max-w-sm w-full relative overflow-hidden backdrop-blur-sm"
        >
          <div className="flex items-center justify-center gap-2.5">
            <p className="text-sm tracking-[0.15em] text-paper-50 font-bold">
              作者：Zzz
            </p>
          </div>
          <div className="w-full h-px bg-linear-to-r from-transparent via-vermilion-800/60 to-transparent my-2" />
          <p className="text-xs tracking-widest text-vermilion-400 font-serif leading-relaxed">
            严禁二改二传 · 类脑首发 · 偷卡死妈
          </p>
        </motion.div>
      </div>

      {/* 底部：仿古纯文字印牌提示（无emoji，无科技感） */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative z-20 flex flex-col items-center gap-2 pb-3"
      >
        <div className="px-7 py-2.5 bg-[#22180f] hover:bg-[#302215] border border-gold-700 text-gold-300 hover:text-paper-50 rounded-xs font-serif text-sm tracking-[0.35em] transition-all shadow-md active:scale-95 pl-[0.35em]">
          【 翻 阅 卷 宗 · 启 案 】
        </div>
        <span className="text-[11px] font-serif tracking-widest text-paper-600">
          点击任意处即可翻开卷宗
        </span>
      </motion.div>

      {/* 翻阅卷宗翻页转场遮罩 */}
      <AnimatePresence>
        {isOpening && (
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0 }}
            className="fixed inset-0 z-50 bg-[#120d09] border-r-4 border-gold-700 flex items-center justify-center shadow-2xl"
          >
            <div className="text-center space-y-3 font-serif">
              <div className="w-12 h-12 rounded-full border-2 border-gold-500 mx-auto flex items-center justify-center bg-[#22170e] text-gold-300 text-lg font-bold">
                卷
              </div>
              <p className="text-xl text-gold-300 tracking-[0.4em] font-bold pl-[0.4em]">
                正在翻阅案卷……
              </p>
              <p className="text-xs text-paper-500 tracking-widest">
                钟山风雨起，缇骑夜巡时
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
