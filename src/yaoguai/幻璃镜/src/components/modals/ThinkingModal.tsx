import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { useGameContext } from '../../store/GameContext';
import { cn } from '../../utils';

type ThinkSection = {
  label: string;
  content: string;
  collapsed: boolean;
};

/** 提取当前楼层的所有思维链内容 */
function extractThinkingChain(raw: string): ThinkSection[] {
  const sections: ThinkSection[] = [];

  // ── 以 </konatan_planning~> 为界，之前全是思维链 ──
  const konatanIdx = raw.search(/<\/konatan_planning~>/i);
  const thinkRaw = konatanIdx >= 0 ? raw.slice(0, konatanIdx) : raw;

  // ── 按顺序提取各标签内容 ──
  const tagDefs: { regex: RegExp; label: string }[] = [
    { regex: /<draft>([\s\S]*?)<\/draft>/gi, label: '草稿' },
    { regex: /<Chain_of_Thought>([\s\S]*?)<\/Chain_of_Thought>/gi, label: '思维链' },
    { regex: /<thinking>([\s\S]*?)<\/thinking>/gi, label: '思考' },
    { regex: /⋘([\s\S]*?)<\/think>/gi, label: '思考' },
  ];

  let remaining = thinkRaw;

  for (const { regex, label } of tagDefs) {
    let match: RegExpExecArray | null;
    let count = 0;
    const source = remaining;
    regex.lastIndex = 0;

    while ((match = regex.exec(source)) !== null) {
      const content = match[1].trim();
      if (content) {
        count++;
        sections.push({
          label: count > 1 ? `${label} #${count}` : label,
          content,
          collapsed: false,
        });
      }
    }

    regex.lastIndex = 0;
    remaining = remaining.replace(regex, '');
  }

  // ── 残余未标记文本 ──
  remaining = remaining.trim();
  if (remaining) {
    sections.push({
      label: '未标记内容',
      content: remaining,
      collapsed: false,
    });
  }

  return sections;
}

interface ThinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 灵境神识·思维链查看器 — 展示当前楼层生成时的原始思维链内容 */
export const ThinkingModal: React.FC<ThinkingModalProps> = ({ isOpen, onClose }) => {
  const [sections, setSections] = useState<ThinkSection[]>([]);
  const [floorId, setFloorId] = useState<number | null>(null);
  const { viewingFloorId, lastAssistantFloorId } = useGameContext();

  useEffect(() => {
    if (!isOpen) return;
    loadThinkingChain();
  }, [isOpen, viewingFloorId, lastAssistantFloorId]);

  function loadThinkingChain() {
    try {
      const targetFloor = viewingFloorId ?? lastAssistantFloorId;
      if (targetFloor == null) {
        setSections([]);
        setFloorId(null);
        return;
      }

      const msgs = getChatMessages(targetFloor);
      if (!msgs || msgs.length === 0) {
        setSections([]);
        setFloorId(targetFloor);
        return;
      }

      const raw = msgs[0].message || '';
      setSections(extractThinkingChain(raw));
      setFloorId(targetFloor);
    } catch {
      console.warn('[ThinkingModal] 读取楼层失败');
      setSections([]);
      setFloorId(null);
    }
  }

  function toggleSection(idx: number) {
    setSections(prev =>
      prev.map((s, i) => (i === idx ? { ...s, collapsed: !s.collapsed } : s)),
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="灵 境 神 识 · 思 维 链" id="thinking-modal">
      <div className="flex flex-col gap-4 text-paper-100">
        {/* 顶部玄思卷首 */}
        <div className="bg-[#14100c] border border-[#6b583e] rounded-xs p-3 sm:p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-[#241e17] border border-[#52432d] text-cyan-300 rounded-xs shrink-0">
              <Brain size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-gold-300 tracking-widest">
                推演心境 · 潜台解构
              </h3>
              <p className="font-serif text-xs text-paper-500 tracking-wider">
                {floorId != null ? `当前审阅楼层 #${floorId}` : '尚未定位楼层'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-serif border border-jade-500 text-jade-400 bg-[#151d16] rounded-xs">
            神识清明
          </span>
        </div>

        {/* 思维链内容区 */}
        <div className="bg-[#181410] border border-[#6b583e] rounded-xs overflow-hidden">
          <div className="overflow-y-auto custom-scrollbar max-h-[45vh] sm:max-h-[55vh] p-3 sm:p-4">
            {sections.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-paper-600 font-serif text-sm tracking-widest">
                当前楼层无思维链内容
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, idx) => (
                  <div key={idx} className="border border-[#3d2e1c] rounded-xs overflow-hidden">
                    {/* 可折叠标题 */}
                    <button
                      onClick={() => toggleSection(idx)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 bg-[#1f1912] hover:bg-[#241c14] transition-colors text-left',
                      )}
                    >
                      {section.collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-paper-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-paper-600" />
                      )}
                      <span className="font-serif text-sm font-bold text-gold-300">
                        {section.label}
                      </span>
                      <span className="ml-auto text-xs text-paper-500 tabular-nums">
                        {section.content.length} 字
                      </span>
                    </button>

                    {/* 内容体 */}
                    {!section.collapsed && (
                      <div className="p-3 bg-[#1c1712]">
                        <pre className="text-sm text-paper-200 leading-relaxed whitespace-pre-wrap font-mono break-all">
                          {section.content}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 border-t border-[#3d2e1c] flex justify-between items-center">
            <span className="text-xs font-serif text-paper-500">
              共 {sections.length} 个段落
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#241e17] hover:bg-[#2d251c] border border-[#52432d] text-paper-400 hover:text-paper-50 text-xs font-serif tracking-widest rounded-xs transition-colors"
            >
              归掩
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
