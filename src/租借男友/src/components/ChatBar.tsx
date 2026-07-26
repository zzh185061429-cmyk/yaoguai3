import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Loader, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../state/GameContext';
import { useToast } from '../components/ToastProvider';
import { sfx } from '../audio/sfxPlayer';

/**
 * 底部输入栏 — 可折叠
 * - 读取 GameContext.pendingMessage（地图/派单写入的文本）
 * - 用户可编辑后点击发送：
 *   1. triggerSlash('/send ...')   → 创建 user 楼层
 *   2. triggerSlash('/trigger await=true')  → 触发 AI 生成并等待
 * - 生成期间显示加载态，完成后清空输入
 */
export function ChatBar({ onClose }: { onClose: () => void }) {
  const { pendingMessage, setPendingMessage, startGenerating, finishGenerating, isGenerating } = useGameContext();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 生成中禁用输入
  const isBusy = isGenerating;

  // pendingMessage 有值 → 自动填入并聚焦
  useEffect(() => {
    if (pendingMessage) {
      setText(pendingMessage);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [pendingMessage]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    setText('');
    setPendingMessage('');
    sfx.play('send');

    // 通知 GameContext 开始生成，锁定当前画面
    startGenerating();

    try {
      // 第 1 步：创建 user 楼层（不触发生成）
      await triggerSlash('/send ' + trimmed);
      console.info('[ChatBar] user 楼层已创建');

      // 第 2 步：触发 AI 生成并等待完成
      await triggerSlash('/trigger await=true');
      console.info('[ChatBar] AI 生成完成');
    } catch (err: any) {
      console.error('[ChatBar] 发送/生成失败:', err?.message || err);
      sfx.play('error');
      showToast('消息发送失败，请重试', 'alert');
      // 恢复文本以便重试
      setText(trimmed);
    } finally {
      // 通知 GameContext 生成结束
      finishGenerating();
    }
  }, [text, isBusy, setPendingMessage, showToast, startGenerating, finishGenerating]);

  const handleClear = useCallback(() => {
    setText('');
    setPendingMessage('');
  }, [setPendingMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 生成中禁用键盘发送
    if (isBusy) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 bg-pop-black border-t-4 border-white p-3 md:p-4 relative">
      {/* 收起按钮 */}
      <button
        onClick={onClose}
        className="absolute top-1 left-1 z-10 p-1 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
        title="收起输入栏"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      <div className="flex items-end gap-3 w-full px-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBusy ? '剧情生成中，请稍候...' : '输入剧情走向... (Enter 发送, Shift+Enter 换行)'}
            rows={2}
            disabled={isBusy}
            className="w-full bg-white text-pop-black font-bold p-3 pr-10 border-4 border-white resize-none
                       placeholder:text-gray-400 focus:outline-none focus:border-pop-yellow
                       transition-colors clip-diagonal text-sm md:text-base
                       disabled:bg-gray-200 disabled:text-gray-500"
          />
          {/* X 清空按钮 */}
          <AnimatePresence>
            {text && !isBusy && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-pop-pink text-white rounded-full hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 发送按钮 / 加载态 */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isBusy}
          className="shrink-0 px-4 py-2 sm:px-6 sm:py-3 bg-pop-yellow text-pop-black font-black italic text-base sm:text-lg
                     border-4 border-white shadow-pop-pink
                     hover:scale-105 active:scale-95 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                     clip-diagonal flex items-center gap-2 min-w-[60px] sm:min-w-[80px] justify-center"
        >
          {isBusy ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span className="hidden md:inline">发送</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
