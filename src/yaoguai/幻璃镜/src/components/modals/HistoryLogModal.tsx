import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';

interface HistoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  floorId: number;
  text: string;
}

/**
 * 剧情回顾 — 扫描最近的 assistant 楼层，提取 <content> 正文，按楼层顺序展示
 * （移植自租借男友 ReadingModal，替换原先的硬编码演示对话）
 */
export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const messages = getChatMessages(`0-{{lastMessageId}}`, { role: 'assistant' });
      // 只取最近 10 层，避免超长聊天卡顿
      const latestMessages = messages.slice(-10);
      const result: HistoryEntry[] = [];

      for (const msg of latestMessages) {
        // 步骤 1：剥离思维链（防止思维链中误出现 <content> 标签干扰提取）
        const stripped = msg.message
          .replace(/<Chain_of_Thought>[\s\S]*?<\/Chain_of_Thought>/gi, '')
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .replace(/<simple_thinking>[\s\S]*?<\/simple_thinking>/gi, '')
          .replace(/<draft>[\s\S]*?<\/draft>/gi, '');

        // 步骤 2：仅提取 <content>...</content> 内的内容
        const contentMatch = stripped.match(/<content>([\s\S]*?)<\/content>/i);
        const cleaned = contentMatch
          ? contentMatch[1].replace(/\n{3,}/g, '\n\n').trim()
          : stripped.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();

        if (cleaned) {
          result.push({ floorId: msg.message_id, text: cleaned });
        }
      }

      setEntries(result);
    } catch {
      console.warn('[幻璃镜] 历史记录扫描楼层失败');
      setEntries([]);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="历 史 / HISTORY" id="history-log-modal">
      <div className="space-y-8 pl-4 pr-6">
        {entries.length === 0 && (
          <div className="text-center py-12 text-paper-200/50 font-serif tracking-widest">暂无剧情内容</div>
        )}
        {entries.map((entry, index) => (
          <div key={entry.floorId} className="relative group">
            {/* Decorative line connecting logs */}
            {index !== entries.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-[-32px] w-[2px] bg-ink-700/50 group-hover:bg-ink-600 transition-colors" />
            )}

            <div className="flex gap-6 items-start relative">
              {/* Timeline node */}
              <div className="mt-1.5 shrink-0 w-[24px] h-[24px] rounded-full border-2 border-cyan-500 bg-ink-900 flex items-center justify-center shadow-lg text-cyan-500">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
              </div>

              {/* Content */}
              <div className="flex-1 bg-ink-800/30 p-4 rounded-lg border border-transparent hover:border-ink-700/50 transition-colors">
                <div className="font-serif text-sm mb-2 tracking-widest text-cyan-400/70">
                  ◆ 第 {entry.floorId} 幕 ◆
                </div>
                <div className="text-paper-200 leading-relaxed font-sans font-light tracking-wide text-[15px] whitespace-pre-wrap">
                  {entry.text}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
