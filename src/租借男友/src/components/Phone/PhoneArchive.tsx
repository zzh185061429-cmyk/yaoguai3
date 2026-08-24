/**
 * 角色图鉴 App — 波普风格
 *
 * 手机版角色图鉴，将大屏 ArchiveView 的功能移植到手机界面。
 * - 列表页：可滚动的角色卡片网格
 * - 详情页：角色详细档案（标签、喜好、秘密、妹妹备忘录）
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Star, Heart, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { CHARACTERS } from '../../data/gameData';
import { AppHeader } from './PhoneShared';
import { cn } from '../../utils';

export function PhoneArchive({ onExit }: { onExit: () => void }) {
  const [selectedChar, setSelectedChar] = useState<typeof CHARACTERS[0] | null>(null);
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => setCurrentIndex((prev) => (prev === 0 ? CHARACTERS.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev === CHARACTERS.length - 1 ? 0 : prev + 1));
  const currentChar = CHARACTERS[currentIndex];

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-pop-black flex flex-col z-10"
    >
      {/* 半调点阵装饰背景 */}
      <div className="absolute inset-0 bg-halftone-pink opacity-15 pointer-events-none" />
      <AppHeader title="角色图鉴" color="bg-pop-pink" textColor="text-white" onBack={onExit} />

      {/* ── 列表/轮播区 ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center justify-start p-4 pt-6">
        {/* 角色卡片轮播 */}
        <div className="flex items-center gap-3 w-full max-w-75">
          <button
            onClick={goToPrev}
            className="shrink-0 w-9 h-9 bg-pop-black text-white border-2 border-pop-black flex items-center justify-center transform -skew-x-6 shadow-pop hover:bg-pop-pink transition-colors active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <motion.div
              key={currentChar.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'w-full aspect-3/4 border-4 border-pop-black shadow-[6px_6px_0px_0px_#1a1a1a] relative overflow-hidden flex flex-col',
                currentChar.color,
              )}
            >
              <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay z-0" />
              <div className="flex-1 bg-white/20 m-3 border-2 border-pop-black relative overflow-hidden pointer-events-none z-10">
                {currentChar.avatar ? (
                  <img src={currentChar.avatar} alt={currentChar.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-3xl opacity-50 mix-blend-overlay -skew-x-6 text-center leading-tight tracking-widest">
                    {currentChar.name.split('').map((n, i) => <div key={i}>{n}</div>)}
                  </div>
                )}
              </div>
              <div className={cn('p-3 pt-0 pointer-events-none z-10 relative', currentChar.textColor || 'text-pop-black')}>
                <h2 className="text-xl font-black italic -skew-x-6 drop-shadow-md">{currentChar.name}</h2>
                <div className="inline-block px-2 py-0.5 bg-pop-black text-white text-[10px] font-bold mt-1 border border-pop-black italic">
                  {currentChar.price}
                </div>
              </div>
            </motion.div>
            <div className="absolute -bottom-3 right-3 z-20">
              <div className="bg-pop-yellow text-pop-black px-3 py-1 font-black text-xs border-2 border-pop-black shadow-pop transform -skew-x-3">
                {currentIndex + 1} / {CHARACTERS.length}
              </div>
            </div>
          </div>

          <button
            onClick={goToNext}
            className="shrink-0 w-9 h-9 bg-pop-black text-white border-2 border-pop-black flex items-center justify-center transform -skew-x-6 shadow-pop hover:bg-pop-pink transition-colors active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 角色简介 */}
        <div className="mt-6 w-full bg-white border-4 border-pop-black p-4 shadow-[4px_4px_0px_0px_#1a1a1a] relative overflow-hidden">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentChar.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-pop-black text-white text-[10px] font-bold border border-pop-black transform -skew-x-6">
                #{tag}
              </span>
            ))}
          </div>
          <p className="font-bold text-pop-black text-xs leading-relaxed">{currentChar.desc}</p>
        </div>

        {/* 查看详细档案按钮 */}
        <button
          onClick={() => { setSelectedChar(currentChar); setIsSecretOpen(false); }}
          className="mt-4 px-6 py-2 bg-pop-yellow text-pop-black font-black text-sm border-2 border-pop-black shadow-pop transform -skew-x-3 hover:scale-105 active:scale-95 transition-transform"
        >
          查看详细档案
        </button>
      </div>

      {/* ── 详情弹窗 ── */}
      <AnimatePresence>
        {selectedChar && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => { setSelectedChar(null); setIsSecretOpen(false); }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[90%] bg-white border-t-4 border-pop-black rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* 顶部彩色区域 */}
              <div className={cn('relative p-4 flex items-center gap-3', selectedChar.color)}>
                <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay" />
                <button
                  onClick={() => { setSelectedChar(null); setIsSecretOpen(false); }}
                  className="absolute top-3 right-3 z-20 w-8 h-8 bg-white text-pop-black border-2 border-pop-black flex items-center justify-center transform -skew-x-6 shadow-pop active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <X className="w-4 h-4" />
                </button>
                {selectedChar.avatar && (
                  <div className="z-10 w-16 h-16 rounded-full border-4 border-pop-black overflow-hidden shadow-pop transform -skew-x-6 shrink-0">
                    <img src={selectedChar.avatar} alt={selectedChar.name} className="w-full h-full object-cover object-top scale-110" />
                  </div>
                )}
                <div className="z-10">
                  <h2 className={cn('text-xl font-black italic -skew-x-6 drop-shadow-md', selectedChar.textColor || 'text-pop-black')}>
                    {selectedChar.name}
                  </h2>
                  <div className="inline-block px-2 py-0.5 bg-pop-black text-white text-[10px] font-bold mt-1 border border-pop-black">
                    {selectedChar.role}
                  </div>
                </div>
              </div>

              {/* 滚动内容 */}
              <div className="flex-1 overflow-y-auto hide-scrollbar bg-halftone-white p-4 space-y-3">
                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedChar.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-white text-pop-black text-[10px] font-bold border-2 border-pop-black transform -skew-x-6 shadow-pop">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 个人情报 */}
                <div className="bg-white border-2 border-pop-black p-3 shadow-pop">
                  <h3 className="text-sm font-black mb-1.5 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-pop-yellow text-pop-yellow" /> 个人情报
                  </h3>
                  <p className="font-bold text-pop-black text-xs leading-relaxed">{selectedChar.desc}</p>
                </div>

                {/* 喜好/讨厌 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-pop-pink border-2 border-pop-black p-2.5 shadow-pop">
                    <h3 className="text-[11px] font-black text-white mb-1 flex items-center gap-1 border-b-2 border-white pb-0.5">
                      <Heart className="w-3 h-3 fill-white" /> 喜欢
                    </h3>
                    <p className="font-bold text-[11px] text-white leading-relaxed">{selectedChar.likes}</p>
                  </div>
                  <div className="bg-pop-cyan border-2 border-pop-black p-2.5 shadow-pop">
                    <h3 className="text-[11px] font-black text-pop-black mb-1 flex items-center gap-1 border-b-2 border-pop-black/30 pb-0.5">
                      <X className="w-3 h-3 stroke-[3px]" /> 讨厌
                    </h3>
                    <p className="font-bold text-[11px] text-pop-black leading-relaxed">{selectedChar.dislikes}</p>
                  </div>
                </div>

                {/* 小秘密 */}
                <div className="bg-pop-black border-2 border-pop-pink p-3 shadow-pop relative overflow-hidden">
                  <div className="absolute top-1 right-1 opacity-20 pointer-events-none">
                    <AlertCircle className="w-8 h-8 text-pop-pink" />
                  </div>
                  <div
                    className="relative z-10 cursor-pointer"
                    onClick={() => setIsSecretOpen(!isSecretOpen)}
                  >
                    <div className="text-sm font-black text-pop-pink flex items-center justify-between">
                      CLASSIFIED SECRET / 小秘密
                      <span className={cn('text-pop-pink transition-transform text-xs', isSecretOpen && 'rotate-180')}>▼</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isSecretOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="font-bold text-white list-disc pl-4 space-y-1.5 relative z-10 overflow-hidden mt-2 text-[11px]"
                      >
                        {selectedChar.secret.map((s, i) => <li key={i}>{s}</li>)}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* 妹妹备忘录 */}
                <div className="bg-pop-yellow border-4 border-pop-pink p-3 shadow-pop">
                  <h3 className="text-xs font-black flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 经纪人(妹妹)的备忘录
                  </h3>
                  <p className="font-bold text-pop-black italic bg-white/50 p-2 border-l-4 border-pop-pink text-[11px] leading-relaxed">
                    {selectedChar.sisterNote}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
