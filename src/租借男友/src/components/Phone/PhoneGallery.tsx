/**
 * 画廊 App — 波普风格
 *
 * 手机版画廊，将大屏 GalleryView + GalleryDetailView 合并为一个手机应用。
 * - 列表页：角色头像网格，分页浏览
 * - 详情页：立绘查看（SFW/NSFW/Q版三模式切换）
 * - 全屏查看：CG 和立绘均可全屏查看（使用 Portal 突破手机容器 transform 限制）
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Lock, X, Maximize2,
} from 'lucide-react';
import {
  CHARACTER_AVATARS,
  CHARACTER_COLORS,
  CHARACTER_SPRITES,
  CHARACTER_SPRITES_NSFW,
  EMOTION_LIST,
  CHARACTER_CHIBIS,
  getNsfwData,
} from '../../data/characterData';
import { useGameContext } from '../../state/GameContext';
import { AppHeader } from './PhoneShared';
import { cn } from '../../utils';

const CHARACTERS = Object.keys(CHARACTER_AVATARS);
const PAGE_SIZE = 6;

export function PhoneGallery({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState(0);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const totalPages = Math.ceil(CHARACTERS.length / PAGE_SIZE);
  const currentChars = CHARACTERS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-[#2a2a2a] flex flex-col z-10"
    >
      <AppHeader title="画廊" color="bg-pop-pink" textColor="text-white" onBack={onExit} />

      {/* 列表页 */}
      {!selectedChar && (
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
          {/* 分页头 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-4 bg-pop-pink border border-pop-black transform -skew-x-3" />
              <span className="font-black text-xs uppercase italic text-white -skew-x-3">GALLERY</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={goPrev}
                disabled={page === 0}
                className={cn(
                  'w-7 h-7 bg-pop-black text-white border-2 border-pop-black flex items-center justify-center shadow-pop transform -skew-x-3 transition-colors',
                  page === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pop-pink',
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 bg-white border-2 border-pop-black font-black text-pop-black text-[10px]">
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={goNext}
                disabled={page >= totalPages - 1}
                className={cn(
                  'w-7 h-7 bg-pop-black text-white border-2 border-pop-black flex items-center justify-center shadow-pop transform -skew-x-3 transition-colors',
                  page >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pop-pink',
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 角色网格 */}
          <div className="grid grid-cols-2 gap-3 pb-4">
            {currentChars.map((name) => {
              const avatar = CHARACTER_AVATARS[name];
              const color = CHARACTER_COLORS[name] || 'bg-pop-yellow';
              return (
                <motion.div
                  key={name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedChar(name)}
                  className="cursor-pointer relative"
                >
                  <div className={cn(
                    'w-full aspect-3/4 border-4 border-pop-black shadow-pop relative overflow-hidden flex flex-col',
                    color,
                  )}>
                    <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay z-0" />
                    <div className="flex-1 bg-white/20 m-2 border-2 border-pop-black relative overflow-hidden pointer-events-none z-10">
                      <img src={avatar} alt={name} className="absolute inset-0 w-full h-full object-cover object-top" />
                    </div>
                    <div className="p-2 pt-0 pointer-events-none z-10 relative text-pop-black">
                      <h2 className="text-sm font-black italic -skew-x-6 drop-shadow-md">{name}</h2>
                    </div>
                  </div>
                  <div className="absolute -bottom-1.5 right-1.5 z-20">
                    <div className="bg-pop-yellow text-pop-black px-2 py-0.5 font-black text-[9px] border-2 border-pop-black shadow-pop transform -skew-x-3">
                      VIEW
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 详情页 */}
      <AnimatePresence>
        {selectedChar && (
          <GalleryDetailMobile
            characterName={selectedChar}
            onBack={() => setSelectedChar(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 立绘详情子组件 ──
function GalleryDetailMobile({ characterName, onBack }: { characterName: string; onBack: () => void }) {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('默认');
  const [mode, setMode] = useState<'sfw' | 'nsfw' | 'chibi'>('sfw');
  const [selectedCgIndex, setSelectedCgIndex] = useState(0);
  const [isFullscreenView, setIsFullscreenView] = useState(false);
  const { nsfwUnlocked } = useGameContext();

  const sfwSprites = CHARACTER_SPRITES[characterName] || {};
  const nsfwSprites = CHARACTER_SPRITES_NSFW[characterName] || {};
  const sprites = mode === 'sfw' ? sfwSprites : nsfwSprites;
  const emotions = EMOTION_LIST.filter((e) => sprites[e]);
  const color = CHARACTER_COLORS[characterName] || 'bg-pop-yellow';
  const avatar = CHARACTER_AVATARS[characterName];
  const chibi = CHARACTER_CHIBIS[characterName];

  const nsfwData = getNsfwData(characterName);
  const isNsfwUnlocked = nsfwUnlocked.includes(characterName);
  const hasNsfwContent = !!nsfwData && nsfwData.stages.length > 0;

  useEffect(() => {
    setSelectedCgIndex(0);
    setSelectedEmotion('默认');
  }, [characterName]);

  const currentSprite = mode === 'nsfw'
    ? (nsfwData && isNsfwUnlocked ? nsfwData.stages[selectedCgIndex]?.imageUrl || '' : '')
    : (sprites[selectedEmotion] || sprites['默认'] || avatar);

  // 是否可以全屏查看
  const canFullscreen = (mode === 'nsfw' && hasNsfwContent && isNsfwUnlocked && !!currentSprite)
    || (mode === 'sfw' && !!currentSprite);

  // NSFW CG 全屏翻页
  const goCgPrev = () => {
    if (!nsfwData) return;
    setSelectedCgIndex((prev) => (prev === 0 ? nsfwData.stages.length - 1 : prev - 1));
  };
  const goCgNext = () => {
    if (!nsfwData) return;
    setSelectedCgIndex((prev) => (prev === nsfwData.stages.length - 1 ? 0 : prev + 1));
  };

  // 全屏图片标题
  const fullscreenTitle = mode === 'nsfw'
    ? `${nsfwData?.stages[selectedCgIndex]?.label} (CG ${selectedCgIndex + 1}/${nsfwData!.stages.length})`
    : selectedEmotion;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      className="absolute inset-0 bg-[#2a2a2a] flex flex-col z-20"
    >
      {/* 头部 */}
      <div className="shrink-0 border-b-4 border-pop-black p-3 flex items-center gap-2 bg-pop-pink relative overflow-hidden shadow-[0px_4px_0px_0px_#1a1a1a] z-20">
        <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay" />
        <button
          onClick={onBack}
          className="relative z-10 w-9 h-9 bg-white text-pop-black border-2 border-pop-black flex items-center justify-center transform -skew-x-6 shadow-pop hover:scale-110 hover:bg-pop-black hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="relative z-10 text-lg font-black tracking-tighter italic transform -skew-x-6 text-white">
          {characterName} <span className="text-white/60 text-xs">/ 立绘</span>
        </h1>

        {/* 模式切换 */}
        <div className="ml-auto relative z-10 flex items-center gap-0.5 bg-pop-black p-0.5 border-2 border-pop-black transform -skew-x-3">
          <button
            onClick={() => setMode('sfw')}
            className={cn(
              'px-2 py-0.5 font-black text-[10px] transition-colors',
              mode === 'sfw' ? 'bg-pop-cyan text-pop-black' : 'bg-transparent text-gray-400 hover:text-white',
            )}
          >
            SFW
          </button>
          <button
            onClick={() => setMode('nsfw')}
            className={cn(
              'px-2 py-0.5 font-black text-[10px] transition-colors flex items-center gap-0.5',
              mode === 'nsfw' ? 'bg-pop-pink text-white' : 'bg-transparent text-gray-400 hover:text-white',
            )}
          >
            {hasNsfwContent && !isNsfwUnlocked && <Lock className="w-2.5 h-2.5" />}
            NSFW
          </button>
          <button
            onClick={() => setMode('chibi')}
            className={cn(
              'px-2 py-0.5 font-black text-[10px] transition-colors',
              mode === 'chibi' ? 'bg-pop-yellow text-pop-black' : 'bg-transparent text-gray-400 hover:text-white',
            )}
          >
            小人
          </button>
        </div>
      </div>

      {/* 主显示区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 立绘大图 */}
        <div className="flex items-center justify-center relative p-3 pb-1">
          <div className={cn(
                    'relative w-full max-w-60 aspect-3/4 border-4 border-pop-black shadow-pop overflow-hidden',
            color,
          )}>
            <div className="absolute inset-0 bg-halftone-white opacity-20 pointer-events-none mix-blend-overlay z-0" />
            <div className="absolute inset-0 m-2 border-2 border-pop-black overflow-hidden z-10">
              {mode === 'chibi' ? (
                chibi ? (
                  <img src={chibi} alt={`${characterName} - Q版`} className="absolute inset-0 w-full h-full object-contain" decoding="async" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-black text-2xl opacity-50 -skew-x-6">暂无Q版</div>
                )
              ) : mode === 'nsfw' && !hasNsfwContent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 font-black opacity-50 -skew-x-6">
                  <Lock className="w-8 h-8" />
                  <span className="text-base">暂无内容</span>
                </div>
              ) : mode === 'nsfw' && !isNsfwUnlocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 font-black opacity-50 -skew-x-6">
                  <Lock className="w-8 h-8" />
                  <span className="text-xs text-center px-2">未解锁<br />需在剧情中触发</span>
                </div>
              ) : currentSprite ? (
                <>
                  <img src={currentSprite} alt={`${characterName} - ${mode === 'nsfw' ? `CG ${selectedCgIndex + 1}` : selectedEmotion}`} className="absolute inset-0 w-full h-full object-cover object-top" />
                  {canFullscreen && (
                    <button
                      onClick={() => setIsFullscreenView(true)}
                      className="absolute top-1.5 right-1.5 z-30 w-7 h-7 bg-pop-black/70 text-white border border-white/20 rounded flex items-center justify-center hover:bg-pop-pink transition-colors"
                      title="全屏查看"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-black text-2xl opacity-50 -skew-x-6">暂无立绘</div>
              )}
            </div>
            {/* 模式标签 */}
            <div className="absolute bottom-2 left-2 z-20">
              <div className="bg-pop-black text-white px-2 py-1 font-black text-xs border border-pop-black shadow-pop transform -skew-x-3">
                {mode === 'chibi' ? 'Q版' : mode === 'nsfw' ? (hasNsfwContent && isNsfwUnlocked ? `CG ${selectedCgIndex + 1}/${nsfwData!.stages.length}` : 'CG') : selectedEmotion}
              </div>
            </div>
          </div>
        </div>

        {/* 情绪/CG 选择区 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-4">
          {mode === 'chibi' ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="text-pop-yellow font-black text-lg italic -skew-x-6">Q版立绘</div>
              <div className="text-gray-400 font-bold text-xs text-center">角色Q版小人展示</div>
            </div>
          ) : mode === 'sfw' ? (
            <>
              <h3 className="text-xs font-black italic text-gray-300 -skew-x-3 mb-2">情绪选择</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {emotions.map((emotion) => {
                  const isActive = selectedEmotion === emotion;
                  const spriteUrl = sprites[emotion];
                  return (
                    <motion.button
                      key={emotion}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedEmotion(emotion)}
                      className={cn(
                        'relative aspect-square border-2 border-pop-black overflow-hidden transition-all',
                        isActive ? 'ring-2 ring-pop-pink shadow-pop' : 'opacity-70',
                      )}
                    >
                      {spriteUrl ? (
                        <img src={spriteUrl} alt={emotion} className="absolute inset-0 w-full h-full object-cover object-top" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-black text-[10px] opacity-50">{emotion}</div>
                      )}
                      <div className={cn(
                        'absolute bottom-0 left-0 right-0 px-0.5 py-0.5 text-center font-black text-[8px] truncate',
                        isActive ? 'bg-pop-pink text-white' : 'bg-pop-black/70 text-white',
                      )}>
                        {emotion}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : !hasNsfwContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Lock className="w-8 h-8 text-gray-600" />
              <div className="text-gray-500 font-black text-base italic -skew-x-6">暂无内容</div>
            </div>
          ) : !isNsfwUnlocked ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Lock className="w-10 h-10 text-pop-pink/50" />
              <div className="text-pop-pink font-black text-base italic -skew-x-6">LOCKED</div>
              <div className="text-gray-400 font-bold text-[11px] text-center">
                在剧情中前往<br />
                <span className="text-pop-yellow">{nsfwData!.triggerLocation.includes('/') ? nsfwData!.triggerLocation.split('/').join(' · ') : nsfwData!.triggerLocation}</span><br />
                触发后解锁 CG 图库
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-black italic text-pop-pink -skew-x-3 mb-2">
                CG 阶段 ({nsfwData!.stages.length})
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {nsfwData!.stages.map((stage, idx) => {
                  const isActive = selectedCgIndex === idx;
                  return (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedCgIndex(idx)}
                      className={cn(
                        'relative aspect-square border-2 border-pop-black overflow-hidden transition-all',
                        isActive ? 'ring-2 ring-pop-pink shadow-pop' : 'opacity-70',
                      )}
                    >
                      <img src={stage.imageUrl} alt={stage.label} className="absolute inset-0 w-full h-full object-cover object-top" loading="lazy" />
                      <div className={cn(
                        'absolute bottom-0 left-0 right-0 px-0.5 py-0.5 text-center font-black text-[8px] truncate',
                        isActive ? 'bg-pop-pink text-white' : 'bg-pop-black/70 text-white',
                      )}>
                        {stage.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 全屏查看器 — 使用 Portal 突破手机容器 transform 限制 ── */}
      {isFullscreenView && canFullscreen && currentSprite && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 bg-black/95 flex items-center justify-center"
            onClick={() => setIsFullscreenView(false)}
          >
            {/* 关闭按钮 */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreenView(false); }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-pop-pink text-white border-2 border-pop-black flex items-center justify-center shadow-pop hover:bg-pop-yellow hover:text-pop-black transition-colors active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 角色名 + 标签 */}
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-pop-black/90 text-white px-4 py-2 font-black text-sm border-2 border-pop-black shadow-pop flex items-center gap-2">
                <span className="text-pop-pink">{characterName}</span>
                <span className="text-white/40">/</span>
                <span>{fullscreenTitle}</span>
              </div>
            </div>

            {/* NSFW CG 翻页按钮 */}
            {mode === 'nsfw' && nsfwData && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goCgPrev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-pop-black/80 text-white border-2 border-pop-black flex items-center justify-center shadow-pop hover:bg-pop-pink transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goCgNext(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-pop-black/80 text-white border-2 border-pop-black flex items-center justify-center shadow-pop hover:bg-pop-pink transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* 图片 */}
            <AnimatePresence mode="wait">
              <motion.img
                key={`${characterName}-${mode}-${mode === 'nsfw' ? selectedCgIndex : selectedEmotion}`}
                src={currentSprite}
                alt={`${characterName} - ${fullscreenTitle}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="max-w-[95vw] max-h-[90vh] object-contain border-2 border-pop-black shadow-pop-lg"
                onClick={(e) => e.stopPropagation()}
                decoding="async"
              />
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
