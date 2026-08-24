import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Database, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import { useGameContext } from '../../store/GameContext';
import { cn } from '../../utils';

type TreeNodeProps = {
  label: string;
  value: unknown;
  path: string;
  depth: number;
};

/** 判断是否为叶子节点（不可展开） */
function isLeaf(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object') {
    return Object.keys(value as object).length === 0;
  }
  return true;
}

/** 值类型标签样式 — 古风配色 */
function getTypeBadge(value: unknown): { text: string; color: string } {
  if (value === null || value === undefined) return { text: 'null', color: 'bg-[#3a2e1e] text-paper-600' };
  if (typeof value === 'number') return { text: 'number', color: 'bg-[#1a1521] text-cyan-300' };
  if (typeof value === 'boolean') return { text: 'boolean', color: 'bg-[#2a1a12] text-gold-500' };
  if (typeof value === 'string') return { text: 'string', color: 'bg-[#1a2218] text-jade-400' };
  if (Array.isArray(value)) return { text: `array[${value.length}]`, color: 'bg-[#2a1a12] text-vermilion-400' };
  if (typeof value === 'object') {
    const keys = Object.keys(value as object);
    return { text: `object{${keys.length}}`, color: 'bg-[#1a1b22] text-cyan-300' };
  }
  return { text: typeof value, color: 'bg-[#3a2e1e] text-paper-600' };
}

function ValuePreview({ value }: { value: unknown }) {
  if (value === null) return <span className="text-[#5a4835] italic">null</span>;
  if (value === undefined) return <span className="text-[#5a4835] italic">undefined</span>;
  if (typeof value === 'string') {
    const display = value.length > 60 ? value.slice(0, 60) + '…' : value;
    return <span className="text-jade-400">"{display}"</span>;
  }
  if (typeof value === 'number') return <span className="text-cyan-300">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-gold-500">{value ? 'true' : 'false'}</span>;
  return null;
}

/** 递归树节点 */
function TreeNode({ label, value, path, depth }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(depth >= 3);
  const leaf = isLeaf(value);
  const badge = getTypeBadge(value);

  if (leaf) {
    return (
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-[#241c14] transition-colors group"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <Circle className="w-1.5 h-1.5 shrink-0 text-[#5a4835]" />
        <span className="font-serif text-sm font-bold text-paper-50">{label}</span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0 rounded-xs', badge.color)}>
          {badge.text}
        </span>
        <ValuePreview value={value} />
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? (value as unknown[]).map((v, i) => ({ key: String(i), val: v }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({ key: k, val: v }));

  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 py-1 px-2 hover:bg-[#241c14] transition-colors text-left"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-paper-600" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-paper-600" />
        )}
        <span className="font-serif text-sm font-bold text-gold-300">{label}</span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0 rounded-xs', badge.color)}>
          {badge.text}
        </span>
      </button>

      {!collapsed && (
        <div>
          {entries.map(({ key, val }) => (
            <TreeNode
              key={key}
              label={key}
              value={val}
              path={`${path}.${key}`}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 天机造化变量查看器 — 展示当前楼层的 MVU 变量，古风皮肤 */
export function VariablesModal({ isOpen, onClose }: VariablesModalProps) {
  const [statData, setStatData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [floorId, setFloorId] = useState<number | null>(null);
  const { viewingFloorId, lastAssistantFloorId } = useGameContext();

  useEffect(() => {
    if (!isOpen) return;
    loadVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function loadVariables() {
    setLoading(true);
    try {
      const targetFloor = viewingFloorId ?? lastAssistantFloorId;
      if (targetFloor == null) {
        setStatData(null);
        setFloorId(null);
        setLoading(false);
        return;
      }

      console.info('[VariablesModal] 开始加载变量，目标楼层:', targetFloor);

      // 等待 MVU 初始化，带超时和直接检查回退
      try {
        await Promise.race([
          waitGlobalInitialized('Mvu'),
          new Promise<void>((resolve, reject) => {
            const checkInterval = setInterval(() => {
              if (typeof window !== 'undefined' && (window as any).Mvu) {
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                resolve();
              }
            }, 500);
            const timeoutId = setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('MVU 初始化超时'));
            }, 5000);
          })
        ]);
      } catch (e) {
        if (typeof window !== 'undefined' && (window as any).Mvu) {
          console.info('[VariablesModal] waitGlobalInitialized 超时，但 window.Mvu 可用');
        } else {
          throw e;
        }
      }

      console.info('[VariablesModal] MVU 已就绪');

      let variables: Mvu.MvuData | null = null;

      // 先尝试从消息楼层读取
      try {
        variables = Mvu.getMvuData({ type: 'message', message_id: targetFloor });
        console.info('[VariablesModal] 从消息楼层读取成功:', targetFloor);
      } catch (e) {
        console.info('[VariablesModal] 消息楼层无数据，尝试角色卡变量:', e);
        try {
          variables = Mvu.getMvuData({ type: 'character' });
          console.info('[VariablesModal] 从角色卡读取成功');
        } catch (e2) {
          console.info('[VariablesModal] 角色卡无数据，尝试全局变量:', e2);
          try {
            variables = Mvu.getMvuData({ type: 'global' });
            console.info('[VariablesModal] 从全局变量读取成功');
          } catch (e3) {
            console.warn('[VariablesModal] 所有变量源都失败:', e3);
          }
        }
      }

      if (variables) {
        const data = _.get(variables, 'stat_data');
        console.info('[VariablesModal] stat_data:', data);
        setStatData(typeof data === 'object' && data !== null ? data as Record<string, unknown> : null);
        setFloorId(targetFloor);
      } else {
        console.warn('[VariablesModal] 无法获取任何变量数据');
        setStatData(null);
        setFloorId(targetFloor);
      }
    } catch (e) {
      console.warn('[VariablesModal] 读取变量失败:', e);
      setStatData(null);
      setFloorId(null);
    }
    setLoading(false);
  }

  const entries = statData
    ? Object.entries(statData).map(([k, v]) => ({ key: k, val: v }))
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="天 机 造 化 · 变 量 录" id="variables-modal">
      <div className="flex flex-col gap-4 text-paper-100">
        {/* 顶部简述 */}
        <div className="bg-[#14100c] border border-[#6b583e] rounded-xs p-3 sm:p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-[#241e17] border border-[#52432d] text-gold-300 rounded-xs shrink-0">
              <Database size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-gold-300 tracking-widest">
                乾坤气数 · 命数名录
              </h3>
              <p className="font-serif text-xs text-paper-500 tracking-wider">
                {floorId != null ? `当前审阅楼层 #${floorId}` : '尚未定位楼层'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-serif border border-[#8a7556] text-gold-300 bg-[#241e17] rounded-xs">
            实时造化
          </span>
        </div>

        {/* 变量树内容区 */}
        <div className="bg-[#181410] border border-[#6b583e] rounded-xs overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[45vh] sm:max-h-[55vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-paper-600 font-serif text-sm tracking-widest">
                天机推演中...
              </div>
            ) : !statData || entries.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-paper-600 font-serif text-sm tracking-widest">
                当前楼层无变量数据
              </div>
            ) : (
              <div className="py-2 font-mono">
                {entries.map(({ key, val }) => (
                  <TreeNode
                    key={key}
                    label={key}
                    value={val}
                    path={key}
                    depth={0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 border-t border-[#3d2e1c] flex justify-between items-center">
            <span className="text-xs font-serif text-paper-500">
              {statData ? `${Object.keys(statData).length} 个顶层字段` : ''}
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
}
