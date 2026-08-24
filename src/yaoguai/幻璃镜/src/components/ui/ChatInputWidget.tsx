import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, ChevronDown, Loader } from 'lucide-react';
import { useGameContext } from '../../store/GameContext';
import { useIsMobile } from '../../hooks';
import { cn } from '../../utils';
import { sfx } from '../../audio/sfxPlayer';

/**
 * 对话输入栏 — 参考租借男友的 ChatBar 排布方式
 *
 * 手机端：常驻底部（relative + shrink-0），内嵌在 flex 布局流中，不遮挡内容
 * 桌面端：可折叠的 fixed 底部栏，折叠时显示浮动按钮
 */
export const ChatInputWidget: React.FC = () => {
  const { pendingMessage, setPendingMessage, isGenerating, startGenerating, finishGenerating } = useGameContext();
  const isMobile = useIsMobile();
  const [text, setText] = useState('');
  const [isDesktopOpen, setIsDesktopOpen] = useState(false); // 桌面端展开/折叠
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = isGenerating;

  // 选项栏选择后，pendingMessage 被设置 → 自动填充并展开
  useEffect(() => {
    if (pendingMessage) {
      setText(pendingMessage);
      setIsDesktopOpen(true);
      setPendingMessage(null);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [pendingMessage, setPendingMessage]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    setText('');
    sfx.play('confirm');

    // 通知 GameContext 开始生成，锁定当前画面
    startGenerating();

    try {
      // 第 1 步：创建 user 楼层（不触发生成）
      await triggerSlash('/send ' + trimmed);
      console.info('[幻璃镜] user 楼层已创建');

      // 第 2 步：触发 AI 生成并等待完成
      await triggerSlash('/trigger await=true');
      console.info('[幻璃镜] AI 生成完成');
    } catch (err: any) {
      console.error('[幻璃镜] 发送/生成失败:', err?.message || err);
      sfx.play('error');
      // 恢复文本以便重试
      setText(trimmed);
    } finally {
      // 通知 GameContext 生成结束
      finishGenerating();
    }
  }, [text, isBusy, startGenerating, finishGenerating]);

  const handleClear = useCallback(() => {
    setText('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isBusy) return;
    // 手机端不用回车发送，避免无法分行；桌面端 Enter 发送，Shift+Enter 换行
    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── 输入栏主体（手机端和桌面端共用） ──
  const InputBar = (
    <div className={cn(
      "bg-ink-900/95 backdrop-blur-md border-t border-cyan-900/50 px-3 py-2 relative",
      isMobile ? "pb-safe" : "pb-2",
    )}>
      <div className="flex items-end gap-2 w-full">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBusy ? '剧情生成中，请稍候...' : isMobile ? '输入剧情走向... (点发送按钮发送)' : '输入剧情走向... (Enter 发送, Shift+Enter 换行)'}
            rows={isMobile ? 1 : 2}
            disabled={isBusy}
            autoComplete="off"
            autoCapitalize="sentences"
            autoCorrect="off"
            spellCheck={false}
            style={{ fontSize: '16px' }}
            className="w-full bg-ink-800/80 text-paper-100 font-sans p-2.5 pr-8 border border-ink-700/50 resize-none
                       placeholder:text-ink-500 focus:outline-none focus:border-cyan-400/50
                       transition-colors rounded-lg text-sm
                       disabled:opacity-50"
          />
          {/* X 清空按钮 */}
          <AnimatePresence>
            {text && !isBusy && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={handleClear}
                className="absolute top-1 right-1 p-0.5 text-ink-500 hover:text-vermilion-400 transition-colors rounded"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 发送按钮 / 加载态 */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isBusy}
          className={cn(
            "shrink-0 rounded-lg flex items-center justify-center transition-all border",
            isMobile ? "w-10 h-10" : "w-12 h-12",
            "bg-cyan-600 border-cyan-400 text-white",
            "hover:bg-cyan-500 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cyan-600",
          )}
        >
          {isBusy ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className={cn("w-4 h-4", text.trim() && "translate-x-0.5 -translate-y-0.5")} />
          )}
        </button>
      </div>
    </div>
  );

  // ════ 手机端：常驻底部，内嵌在 flex 流中 ════
  if (isMobile) {
    return <div className="shrink-0 relative z-30">{InputBar}</div>;
  }

  // ════ 桌面端：可折叠的 fixed 底部栏 ════
  return (
    <>
      <AnimatePresence>
        {isDesktopOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* 收起按钮 */}
            <button
              onClick={() => setIsDesktopOpen(false)}
              className="absolute -top-7 right-4 z-10 p-1 bg-ink-900/90 text-paper-200 hover:text-cyan-400 rounded-full border border-ink-700 transition-colors"
              title="收起输入栏"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {InputBar}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 折叠态浮动按钮 */}
      <AnimatePresence>
        {!isDesktopOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsDesktopOpen(true)}
            className="fixed bottom-4 left-4 z-40 w-11 h-11 rounded-full bg-cyan-600/90 backdrop-blur border border-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(48,143,143,0.5)] hover:scale-110 hover:bg-cyan-500 transition-all"
            title="与角色对话"
          >
            <MessageSquare size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
