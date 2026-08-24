import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, ChevronDown, Loader, Feather } from 'lucide-react';
import { useGameContext } from '../../store/GameContext';
import { useIsMobile } from '../../hooks';
import { cn } from '../../utils';
import { sfx } from '../../audio/sfxPlayer';

/**
 * 案牍奏呈 · 对话输入栏
 * 纯正古风宣纸暗墨、朱印木签、泥金边框
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
      const g = typeof window !== 'undefined' ? window : (globalThis as any);
      const slashFn = g.triggerSlash || ((globalThis as any).triggerSlash);
      
      if (typeof slashFn === 'function') {
        // 第 1 步：创建 user 楼层
        await slashFn('/send ' + trimmed);
        console.info('[幻璃镜] user 案录已创建');

        // 第 2 步：触发 AI 生成并等待完成
        await slashFn('/trigger await=true');
        console.info('[幻璃镜] 断案演化生成完成');
      } else {
        console.warn('[幻璃镜] 未检测到酒馆宿主环境 triggerSlash');
      }
    } catch (err: any) {
      console.error('[幻璃镜] 发送/演化失败:', err?.message || err);
      sfx.play('error');
      setText(trimmed);
    } finally {
      finishGenerating();
    }
  }, [text, isBusy, startGenerating, finishGenerating]);

  const handleClear = useCallback(() => {
    setText('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isBusy) return;
    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── 输入栏主体 ──
  const InputBar = (
    <div className={cn(
      "bg-[#140e0a]/98 backdrop-blur-md border-t-2 border-[#78591c] px-2.5 sm:px-3 py-1.5 sm:py-2 relative font-serif shadow-[0_-10px_30px_rgba(0,0,0,0.8)]",
      isMobile ? "pb-safe" : "pb-2.5",
    )}>
      {/* 顶部古金细饰线 */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-gold-500/60 to-transparent" />

      <div className="flex items-end gap-1.5 sm:gap-2 w-full max-w-5xl mx-auto">
        {/* 输入框外壳 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBusy ? '❖ 灵枢运转 · 案情推演中...' : isMobile ? '起草奏呈 / 决断言行...（点呈递）' : '起草奏呈 / 决断言行...（Enter 呈递，Shift+Enter 换行）'}
            rows={isMobile ? 1 : 2}
            disabled={isBusy}
            autoComplete="off"
            autoCapitalize="sentences"
            autoCorrect="off"
            spellCheck={false}
            style={{ fontSize: isMobile ? '14px' : '15px' }}
            className="w-full bg-[#1b130c]/90 text-paper-50 font-serif p-2 sm:p-2.5 pr-7 sm:pr-8 border border-[#52432d] resize-none
                       placeholder:text-paper-600 placeholder:font-serif focus:outline-none focus:border-gold-500
                       transition-all rounded-xs text-sm shadow-inner
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
                className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 text-paper-600 hover:text-vermilion-400 transition-colors rounded cursor-pointer"
                title="清空墨迹"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 仿古朱漆印章风格发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || isBusy}
          className={cn(
            "shrink-0 rounded-xs flex items-center justify-center gap-1.5 transition-all border font-serif cursor-pointer shadow-md",
            isMobile ? "h-9 px-3" : "h-12 px-5",
            "bg-vermilion-800 border-vermilion-600 text-paper-50",
            "hover:bg-[#96251c] active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-vermilion-800",
          )}
        >
          {isBusy ? (
            <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-gold-300" />
          ) : (
            <>
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-300" />
              <span className="text-[11px] sm:text-sm font-bold tracking-widest whitespace-nowrap">
                呈 递
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ════ 手机端：常驻底部 ════
  if (isMobile) {
    return <div className="shrink-0 relative z-30">{InputBar}</div>;
  }

  // ════ 桌面端：可折叠的古风奏折底部栏 ════
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
              className="absolute -top-7 right-6 z-10 px-3 py-0.5 bg-[#1a120b] text-gold-300 hover:text-paper-50 rounded-t-xs border-t border-x border-[#6b583e] font-serif text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-md"
              title="收合奏栏"
            >
              <span>收合</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {InputBar}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 折叠态：古风朱漆木牌浮动按钮 */}
      <AnimatePresence>
        {!isDesktopOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsDesktopOpen(true)}
            className="fixed bottom-5 left-5 z-40 px-3 py-2 rounded-xs bg-[#1f150e]/95 backdrop-blur-md border border-gold-700 text-gold-300 hover:text-paper-50 hover:bg-[#2e1f14] hover:border-gold-500 flex items-center gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.8)] hover:scale-105 transition-all font-serif text-xs tracking-widest cursor-pointer"
            title="起草断案奏呈"
          >
            <span className="w-4 h-4 rounded-full bg-vermilion-800 border border-vermilion-600 flex items-center justify-center text-[10px] text-paper-50 font-bold">
              奏
            </span>
            <span className="font-bold">起草言行</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
