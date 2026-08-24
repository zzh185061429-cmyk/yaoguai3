import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils';

interface HistoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  floorId: number;
  text: string;
}

/**
 * 案卷溯回（历史记录） — 竖屏长卷展开，展现历次断案正文
 */
export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const g = typeof window !== 'undefined' ? window : (globalThis as any);
      const getMsgs = g.getChatMessages || ((globalThis as any).getChatMessages);
      const messages = typeof getMsgs === 'function' 
        ? getMsgs(`0-{{lastMessageId}}`, { role: 'assistant' })
        : [];
      
      // 只取最近 15 层，按序展示
      const latestMessages = messages.slice(-15);
      const result: HistoryEntry[] = [];

      for (const msg of latestMessages) {
        // 步骤 1：剥离思维链
        const stripped = (msg.message || '')
          .replace(/<Chain_of_Thought>[\s\S]*?<\/Chain_of_Thought>/gi, '')
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<simple_thinking>[\s\S]*?<\/simple_thinking>/gi, '')
          .replace(/<draft>[\s\S]*?<\/draft>/gi, '');

        // 步骤 2：提取 <content>...</content> 内的内容
        const contentMatch = stripped.match(/<content>([\s\S]*?)<\/content>/i);
        const cleaned = contentMatch
          ? contentMatch[1].replace(/\n{3,}/g, '\n\n').trim()
          : stripped.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

        if (cleaned) {
          result.push({ floorId: msg.message_id ?? msg.mesid ?? 0, text: cleaned });
        }
      }

      setEntries(result);
    } catch {
      console.warn('[幻璃镜] 案卷溯回扫描失败');
      setEntries([]);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="案 卷 溯 回 · 历 史 录" id="history-log-modal">
      <div className="space-y-4 sm:space-y-6 px-1 sm:px-4 py-2 font-serif select-text">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-paper-600 tracking-widest text-sm space-y-2">
            <div>❖ 案牍清朗 · 暂无前卷 ❖</div>
            <div className="text-xs text-[#6b583e]">推进问卜断案后，此卷将自动载录历史</div>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.floorId} className="relative group">
              {/* 贯通的古铜色装订垂线 */}
              {index !== entries.length - 1 && (
                <div className="absolute left-3.5 top-7 -bottom-4 sm:-bottom-6 w-px bg-linear-to-b from-gold-700 via-ink-800 to-transparent pointer-events-none" />
              )}

              <div className="flex gap-3 sm:gap-5 items-start relative">
                {/* 仿古朱漆印章节点 */}
                <div className="mt-1 shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-gold-700 bg-[#1a120b] flex items-center justify-center shadow-md text-gold-300 text-[9px] sm:text-[10px] font-bold">
                  {entry.floorId}
                </div>

                {/* 案卷正文宣纸卡片 */}
                <div className="flex-1 bg-[#140e0a]/90 p-3 sm:p-5 rounded-xs border border-[#4a3925] hover:border-gold-700 transition-all shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-[#382a1b] pb-2">
                    <span className="text-xs font-bold tracking-widest text-gold-300">
                      【 第 {entry.floorId} 卷 · 勘案录 】
                    </span>
                    <span className="text-[10px] text-paper-600 tracking-wider">
                      镇抚司档案
                    </span>
                  </div>
                  <div className="text-paper-50 leading-relaxed text-xs sm:text-base tracking-wide whitespace-pre-wrap">
                    {entry.text}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
