import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Lock } from 'lucide-react';
import {
  CHARACTER_SPRITES,
  CHARACTER_SPRITES_NSFW,
  EMOTION_LIST,
  CHARACTER_COLORS,
  CHARACTER_AVATARS,
  CHARACTER_CHIBIS,
  getNsfwData,
  hasNsfwData,
} from '../data/characterData';
import { useGameContext } from '../state/GameContext';
import { cn } from '../utils';

interface GalleryDetailViewProps {
  characterName: string;
  onBack: () => void;
}

export function GalleryDetailView({ characterName, onBack }: GalleryDetailViewProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<string>('默认');
  const [mode, setMode] = useState<'sfw' | 'nsfw' | 'chibi'>('sfw');
  const [selectedCgIndex, setSelectedCgIndex] = useState(0);

  const { nsfwUnlocked } = useGameContext();

  const sfwSprites = CHARACTER_SPRITES[characterName] || {};
  const nsfwSprites = CHARACTER_SPRITES_NSFW[characterName] || {};
  const sprites = mode === 'sfw' ? sfwSprites : nsfwSprites;
  const emotions = EMOTION_LIST.filter((e) => sprites[e]);
  const color = CHARACTER_COLORS[characterName] || 'bg-pop-yellow';
  const avatar = CHARACTER_AVATARS[characterName];
  const chibi = CHARACTER_CHIBIS[characterName];

  // NSFW CG 数据
  const nsfwData = getNsfwData(characterName);
  const isNsfwUnlocked = nsfwUnlocked.includes(characterName);
  const hasNsfwContent = !!nsfwData && nsfwData.stages.length > 0;

  // 切换角色时重置 CG 选中索引
  useEffect(() => {
    setSelectedCgIndex(0);
    setSelectedEmotion('默认');
  }, [characterName]);

  // 当前显示的图片
  const currentSprite = mode === 'nsfw'
    ? (nsfwData && isNsfwUnlocked ? nsfwData.stages[selectedCgIndex]?.imageUrl || '' : '')
    : (sprites[selectedEmotion] || sprites['默认'] || avatar);

  return (
    <div className="w-full h-full bg-[#2a2a2a] pt-0 p-4 md:p-8 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 md:mb-6 z-10">
        <button
          onClick={onBack}
          className="p-2 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl md:text-3xl font-black italic text-white -skew-x-6 drop-shadow-md">
          <span className={cn("text-pop-pink", color.replace('bg-', 'text-'))}>
            {characterName}
          </span>
          <span className="text-gray-300 ml-2">/ 立绘</span>
        </h1>

        {/* SFW / NSFW / Chibi toggle */}
        <div className="ml-auto flex items-center gap-1 bg-pop-black p-1 pop-border clip-diagonal">
          <button
            onClick={() => setMode('sfw')}
            className={cn(
              "px-3 py-1 font-black text-xs transition-colors",
              mode === 'sfw'
                ? "bg-pop-cyan text-pop-black"
                : "bg-transparent text-gray-400 hover:text-white"
            )}
          >
            SFW
          </button>
          <button
            onClick={() => setMode('nsfw')}
            className={cn(
              "px-3 py-1 font-black text-xs transition-colors flex items-center gap-1",
              mode === 'nsfw'
                ? "bg-pop-pink text-white"
                : "bg-transparent text-gray-400 hover:text-white"
            )}
          >
            {hasNsfwContent && !isNsfwUnlocked && <Lock className="w-3 h-3" />}
            NSFW
          </button>
          <button
            onClick={() => setMode('chibi')}
            className={cn(
              "px-3 py-1 font-black text-xs transition-colors",
              mode === 'chibi'
                ? "bg-pop-yellow text-pop-black"
                : "bg-transparent text-gray-400 hover:text-white"
            )}
          >
            小人
          </button>
        </div>
      </div>

      {/* Main display */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 z-10 overflow-hidden">
        {/* Left: Large sprite */}
        <div className="flex-1 flex items-center justify-center relative">
          <div
            className={cn(
              "relative w-full max-w-md aspect-3/4 pop-border shadow-pop-lg overflow-hidden clip-diagonal",
              color
            )}
          >
            <div className="absolute inset-0 bg-halftone opacity-30 mix-blend-overlay pointer-events-none z-0"></div>
            <div className="absolute inset-0 m-3 md:m-4 pop-border overflow-hidden z-10">
              {mode === 'chibi' ? (
                chibi ? (
                  <img
                    src={chibi}
                    alt={`${characterName} - Q版`}
                    className="absolute inset-0 w-full h-full object-contain"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-black text-4xl opacity-50 -skew-x-6">
                    暂无Q版
                  </div>
                )
              ) : mode === 'nsfw' && !hasNsfwContent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-black opacity-50 -skew-x-6">
                  <Lock className="w-12 h-12" />
                  <span className="text-2xl">暂无内容</span>
                </div>
              ) : mode === 'nsfw' && !isNsfwUnlocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-black opacity-50 -skew-x-6">
                  <Lock className="w-12 h-12" />
                  <span className="text-xl text-center px-4">未解锁<br />需在剧情中触发</span>
                </div>
              ) : currentSprite ? (
                <img
                  src={currentSprite}
                  alt={`${characterName} - ${mode === 'nsfw' ? `CG ${selectedCgIndex + 1}` : selectedEmotion}`}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-black text-4xl opacity-50 -skew-x-6">
                  暂无立绘
                </div>
              )}
            </div>
            {/* Mode label */}
            <div className="absolute bottom-4 left-4 z-20">
              <div className="bg-pop-black text-white px-4 py-2 font-black text-lg pop-border shadow-pop clip-diagonal">
                {mode === 'chibi' ? 'Q版' : mode === 'nsfw' ? (hasNsfwContent && isNsfwUnlocked ? `CG ${selectedCgIndex + 1}/${nsfwData!.stages.length}` : 'CG') : selectedEmotion}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Emotion grid / CG grid / Chibi info */}
        <div className="w-full md:w-64 flex flex-col gap-4 overflow-y-auto pb-24 md:pb-0">
          {mode === 'chibi' ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-pop-yellow font-black text-2xl italic -skew-x-6">
                Q版立绘
              </div>
              <div className="text-gray-400 font-bold text-sm text-center">
                角色Q版小人展示
              </div>
            </div>
          ) : mode === 'sfw' ? (
            <>
              <h3 className="text-lg font-black italic text-gray-300 -skew-x-3 mb-2">
                情绪选择
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                {emotions.map((emotion) => {
                  const isActive = selectedEmotion === emotion;
                  const spriteUrl = sprites[emotion];
                  return (
                    <motion.button
                      key={emotion}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedEmotion(emotion)}
                      className={cn(
                        "relative aspect-square pop-border overflow-hidden clip-diagonal transition-all",
                        isActive
                          ? "ring-4 ring-pop-pink shadow-pop-pink"
                          : "hover:shadow-pop"
                      )}
                    >
                      {spriteUrl ? (
                        <img
                          src={spriteUrl}
                          alt={emotion}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-black text-sm opacity-50">
                          {emotion}
                        </div>
                      )}
                      {/* Label overlay */}
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 px-1 py-1 text-center font-black text-[10px] md:text-xs truncate",
                          isActive
                            ? "bg-pop-pink text-white"
                            : "bg-pop-black/70 text-white"
                        )}
                      >
                        {emotion}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : !hasNsfwContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Lock className="w-12 h-12 text-gray-600" />
              <div className="text-gray-500 font-black text-xl italic -skew-x-6">
                暂无内容
              </div>
              <div className="text-gray-600 font-bold text-sm text-center">
                该角色暂无 CG 数据
              </div>
            </div>
          ) : !isNsfwUnlocked ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <Lock className="w-16 h-16 text-pop-pink/50" />
              </div>
              <div className="text-pop-pink font-black text-2xl italic -skew-x-6">
                LOCKED
              </div>
              <div className="text-gray-400 font-bold text-sm text-center">
                在剧情中前往<br />
                <span className="text-pop-yellow">{nsfwData!.triggerLocation.includes('/') ? nsfwData!.triggerLocation.split('/').join(' · ') : nsfwData!.triggerLocation}</span><br />
                触发后解锁 CG 图库
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-black italic text-pop-pink -skew-x-3 mb-2">
                CG 阶段 ({nsfwData!.stages.length})
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                {nsfwData!.stages.map((stage, idx) => {
                  const isActive = selectedCgIndex === idx;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCgIndex(idx)}
                      className={cn(
                        "relative aspect-square pop-border overflow-hidden clip-diagonal transition-all",
                        isActive
                          ? "ring-4 ring-pop-pink shadow-pop-pink"
                          : "hover:shadow-pop"
                      )}
                    >
                      <img
                        src={stage.imageUrl}
                        alt={stage.label}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                      {/* Label overlay */}
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 px-1 py-1 text-center font-black text-[10px] md:text-xs truncate",
                          isActive
                            ? "bg-pop-pink text-white"
                            : "bg-pop-black/70 text-white"
                        )}
                      >
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
    </div>
  );
}
