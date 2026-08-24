import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Flame, AlertTriangle } from 'lucide-react';
import { useGameContext } from '../../store/GameContext';
import { cn } from '../../utils';

interface DeleteFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 焚卷抽条 — 删除指定范围的楼层，使用 /cut 命令彻底删除 */
export function DeleteFloorModal({ isOpen, onClose }: DeleteFloorModalProps) {
  const { lastAssistantFloorId, addNotification } = useGameContext();
  const [startFloor, setStartFloor] = useState('');
  const [endFloor, setEndFloor] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 自动填充默认值：当前楼层
  React.useEffect(() => {
    if (isOpen && lastAssistantFloorId != null) {
      setStartFloor(String(lastAssistantFloorId));
      setEndFloor(String(lastAssistantFloorId));
    }
  }, [isOpen, lastAssistantFloorId]);

  async function handleDelete() {
    const start = parseInt(startFloor, 10);
    const end = parseInt(endFloor, 10);

    if (isNaN(start) || isNaN(end) || start < 0 || end < start) {
      addNotification('请输入有效的楼层范围', 'warning');
      return;
    }

    setDeleting(true);
    try {
      // 使用 /cut 命令彻底删除楼层（不是 deleteChatMessages，那个只是清空内容）
      await triggerSlash(`/cut ${start}-${end}`);
      addNotification(`已焚撤第 ${start} 至 ${end} 卷`, 'info');
      onClose();
      // 发送事件通知前端刷新，而不是强制页面重载（避免退出全屏）
      eventEmit('mirage_story_updated');
    } catch (e: any) {
      addNotification(e?.message || '焚毁失败', 'warning');
    }
    setDeleting(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="焚 卷 抽 条 · 撤 销 幕 次" id="delete-floor-modal">
      <div className="flex flex-col gap-4 sm:gap-6 text-paper-100">
        {/* 警告区 */}
        <div className="bg-[#26100c] border border-vermilion-700 p-3 sm:p-5 rounded-xs flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 bg-[#381510] text-vermilion-400 rounded-xs border border-vermilion-700 shrink-0">
            <Flame size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1.5 font-serif">
            <h4 className="text-base font-bold text-paper-50 tracking-wider">
              确定焚毁指定卷宗楼层？
            </h4>
            <p className="text-xs text-paper-400 leading-relaxed">
              此举将彻底抽去指定范围内的案情公文记录，且不可复原。若该幕中录有物证线索，亦将自密札中归档隐去。
            </p>
          </div>
        </div>

        {/* 不可撤销警示条 */}
        <div className="bg-[#2a120e] border-l-2 border-vermilion-700 px-3 sm:px-4 py-2 flex items-center gap-2 text-xs font-serif text-vermilion-400 font-bold tracking-widest">
          <AlertTriangle size={14} />
          此举不可撤销
        </div>

        {/* 输入区 */}
        <div className="space-y-3 sm:space-y-4 font-serif">
          <div>
            <label className="block text-xs font-bold text-paper-500 mb-1.5 tracking-widest">起始卷宗</label>
            <input
              type="number"
              min={0}
              value={startFloor}
              onChange={(e) => setStartFloor(e.target.value)}
              placeholder="如 5"
              className={cn(
                "w-full px-3 py-2 border bg-[#1a1510] text-paper-50 text-sm font-bold",
                "focus:outline-none focus:border-gold-500 rounded-xs tracking-wider",
                deleting && "opacity-40 pointer-events-none"
              )}
              disabled={deleting}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-paper-500 mb-1.5 tracking-widest">结束卷宗</label>
            <input
              type="number"
              min={0}
              value={endFloor}
              onChange={(e) => setEndFloor(e.target.value)}
              placeholder="如 10"
              className={cn(
                "w-full px-3 py-2 border bg-[#1a1510] text-paper-50 text-sm font-bold",
                "focus:outline-none focus:border-gold-500 rounded-xs tracking-wider",
                deleting && "opacity-40 pointer-events-none"
              )}
              disabled={deleting}
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting || !startFloor || !endFloor}
            className={cn(
              "w-full py-2.5 bg-vermilion-700 hover:bg-vermilion-600 border border-vermilion-400 text-white text-xs font-bold tracking-widest rounded-xs transition-all shadow-md",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {deleting ? '焚毁中...' : '决意焚毁'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
