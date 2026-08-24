import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Heart, Maximize2, Minimize2, ShieldAlert } from "lucide-react";
import { useGameContext } from "../../state/GameContext";
import { useToast } from "../ToastProvider";

interface WelcomeModalProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

/**
 * 欢迎弹窗 — 每个新聊天文件首次打开时出现一次
 *
 * 内容：
 * 1. 作者信息 + 版权声明
 * 2. <user> 玩家名设置（用于场景标签匹配）
 */
export function WelcomeModal({ isFullscreen, onToggleFullscreen }: WelcomeModalProps) {
  const { showWelcome, setShowWelcome, playerName, setPlayerName } = useGameContext();
  const { showToast } = useToast();
  const [nameInput, setNameInput] = useState(playerName || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // 弹窗显示时自动聚焦输入框
  useEffect(() => {
    if (showWelcome) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [showWelcome]);

  const handleClose = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setPlayerName(trimmed);
      showToast(`已设置玩家名: ${trimmed}`, 'normal');
    } else {
      showToast('未设置玩家名，部分场景背景图可能无法显示', 'alert');
    }
    setShowWelcome(false);
  };

  return (
    <AnimatePresence>
      {showWelcome && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-2 md:p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-pop-black/90 backdrop-blur-sm"
          />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: 60, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
            className="relative w-full max-w-lg bg-white pop-border shadow-[8px_8px_0_#ff3366] z-10 flex flex-col overflow-hidden clip-diagonal max-h-[95vh]"
          >
            {/* 顶部标题栏 */}
            <div className="bg-pop-pink text-white p-3 flex justify-between items-center border-b-4 border-pop-black shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 shrink-0 fill-white" />
                <h3 className="text-lg font-black italic">欢迎来到租借男友</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* 全屏按钮 */}
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 bg-pop-black text-white hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                  title={isFullscreen ? "退出全屏" : "全屏模式（推荐）"}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                {/* 关闭按钮 */}
                <button
                  onClick={handleClose}
                  className="p-2 bg-pop-black text-white hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 非全屏提示 */}
            {!isFullscreen && (
              <div className="bg-pop-yellow text-pop-black p-2 text-center border-b-2 border-pop-black shrink-0">
                <button
                  onClick={onToggleFullscreen}
                  className="font-black text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Maximize2 className="w-4 h-4" />
                  点击这里全屏查看（推荐）
                </button>
              </div>
            )}

            {/* 内容区 — 可滚动 */}
            <div className="p-3 md:p-4 bg-stripes relative overflow-y-auto hide-scrollbar flex-1 flex flex-col gap-3">
              {/* 1. 作者信息 + 版权声明 */}
              <div className="bg-white border-4 border-pop-black p-4 clip-diagonal shadow-pop relative z-10">
                <span className="bg-pop-yellow text-pop-black font-black text-sm px-2 py-0.5 clip-diagonal -skew-x-6 inline-block mb-2">AUTHOR</span>
                <p className="text-base font-bold text-pop-black leading-relaxed mb-2">
                  作者 <span className="text-pop-pink font-black">Zzz</span>
                </p>
                <p className="text-sm font-bold text-gray-700 leading-relaxed mb-1">
                  类脑首发，偷卡死妈
                </p>
                <div className="flex items-start gap-1.5 mt-2 pt-2 border-t-2 border-dashed border-pop-black/20">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <p className="text-sm font-black text-red-600 leading-relaxed">
                    严禁二改和二传
                  </p>
                </div>
              </div>

              {/* 2. <user> 玩家名设置 */}
              <div className="bg-white border-4 border-pop-black p-3 clip-diagonal shadow-pop relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 shrink-0 text-pop-pink" />
                  <span className="font-black text-base text-pop-black">设置你的名字</span>
                </div>
                <p className="text-sm font-bold text-gray-600 leading-relaxed mb-2">
                  AI 会用你的名字写场景（如"二楼XXX卧室"）。输入名字后前端会自动匹配场景背景图，否则部分背景图无法显示。
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleClose();
                  }}
                  placeholder="输入你在酒馆里设置的名字..."
                  maxLength={20}
                  className="w-full bg-pop-black text-white font-bold p-2 border-4 border-white resize-none
                             placeholder:text-gray-500 focus:outline-none focus:border-pop-yellow
                             transition-colors clip-diagonal text-base"
                />
                {playerName && (
                  <p className="text-sm text-gray-500 font-bold mt-1.5">
                    当前已设置: <span className="text-pop-pink">{playerName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 底部关闭栏 — 固定在底部 */}
            <div className="shrink-0 border-t-4 border-pop-black bg-pop-black p-2">
              <button
                onClick={handleClose}
                className="w-full bg-pop-yellow text-pop-black font-black italic text-lg p-2 border-4 border-white shadow-pop-pink hover:scale-105 active:scale-95 transition-all clip-diagonal flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5 fill-pop-pink text-pop-pink" />
                确认并开始游戏
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
