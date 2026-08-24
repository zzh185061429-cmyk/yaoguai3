import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { useGameContext } from '../../store/GameContext';
import { Search, Trash2, Box, Lightbulb, Link2, Edit2, Check, X, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClueNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClueNotebookModal: React.FC<ClueNotebookModalProps> = ({ isOpen, onClose }) => {
  const { clues, removeClue, updateCluePosition, combineClues, commitDeduction, editClue, clueConnections } = useGameContext();
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [combiningOptions, setCombiningOptions] = useState<{ id1: string, id2: string, options: string[] } | null>(null);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleClue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId) return; // Prevent selection while editing
    setSelectedClues(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCombine = () => {
    if (selectedClues.length === 2) {
      const options = combineClues(selectedClues[0], selectedClues[1]);
      if (options && options.length > 0) {
        setCombiningOptions({ id1: selectedClues[0], id2: selectedClues[1], options });
      } else {
        setSelectedClues([]);
      }
    }
  };

  const selectDeductionOption = (text: string) => {
    if (!combiningOptions) return;
    const c1 = clues.find(c => c.id === combiningOptions.id1);
    const c2 = clues.find(c => c.id === combiningOptions.id2);
    let posX = 200, posY = 200;
    if (c1?.position && c2?.position) {
      posX = (c1.position.x + c2.position.x) / 2;
      posY = Math.max(c1.position.y, c2.position.y) + 120;
    }
    commitDeduction(combiningOptions.id1, combiningOptions.id2, text, { x: posX, y: posY });
    setCombiningOptions(null);
    setSelectedClues([]);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, startPos: {x: number, y: number}) => {
    if (editingId === id) return; // Don't drag while editing
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 100; // 100 is half width roughly
    const y = e.clientY - rect.top - 50;  // 50 is half height roughly
    updateCluePosition(draggingId, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="调 查 卷 宗 / EVIDENCE BOARD" 
      id="clue-notebook-modal"
      fullScreen={isFullScreen}
      onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
    >
      <div 
        className={`relative w-full bg-ink-900 border border-ink-700/50 rounded-xl overflow-hidden shadow-inner ${isFullScreen ? 'h-[calc(100vh-100px)] border-0' : 'h-[600px]'}`}
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.5) 2px, transparent 2px)', backgroundSize: '40px 40px' }}
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {clues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-500 gap-4 pointer-events-none">
            <Search size={48} className="opacity-50" />
            <p className="font-serif tracking-widest text-lg">卷宗尚无记录</p>
            <p className="text-sm font-sans tracking-wide">在对话记录中选中关键文本，即可收集线索。</p>
          </div>
        ) : (
          <>
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {clueConnections.map((conn, i) => {
                const c1 = clues.find(c => c.id === conn[0]);
                const c2 = clues.find(c => c.id === conn[1]);
                if (!c1?.position || !c2?.position) return null;
                return (
                  <g key={i}>
                    {/* Background faint line */}
                    <line 
                      x1={c1.position.x + 100} 
                      y1={c1.position.y + 50} 
                      x2={c2.position.x + 100} 
                      y2={c2.position.y + 50} 
                      stroke="#ef4444" 
                      strokeWidth="1" 
                      className="opacity-30"
                    />
                    {/* Animated dashed line */}
                    <motion.line 
                      x1={c1.position.x + 100} 
                      y1={c1.position.y + 50} 
                      x2={c2.position.x + 100} 
                      y2={c2.position.y + 50} 
                      stroke="#ef4444" 
                      strokeWidth="2" 
                      strokeDasharray="6 6"
                      className="opacity-80"
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: -24 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))' }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Clue Nodes */}
            <AnimatePresence>
              {clues.map((clue) => {
                const isSelected = selectedClues.includes(clue.id);
                const isDeduction = clue.type === 'deduction';
                const pos = clue.position || { x: 0, y: 0 };
                
                return (
                  <motion.div
                    layout
                    key={clue.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onPointerDown={(e: any) => handlePointerDown(e, clue.id, pos)}
                    onClick={(e: any) => toggleClue(clue.id, e)}
                    className={`absolute w-[200px] min-h-[100px] rounded-lg p-4 shadow-lg cursor-grab active:cursor-grabbing border-t-4 select-none z-10 transition-shadow ${
                      isSelected ? 'ring-2 ring-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : ''
                    } ${
                      isDeduction 
                        ? 'bg-ink-800 border-t-emerald-500 text-emerald-100' 
                        : 'bg-paper-100 border-t-gold-500 text-ink-900'
                    }`}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      touchAction: 'none'
                    }}
                  >
                    {/* Pin */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-sm z-20 bg-vermilion-500 border border-vermilion-700" />
                    
                    <div className="flex justify-between items-start mb-2 pointer-events-none">
                      <div className={`flex items-center gap-1.5 ${isDeduction ? 'text-emerald-400' : 'text-gold-600'}`}>
                        {isDeduction ? <Lightbulb size={14} /> : <Box size={14} />}
                        <span className="font-serif tracking-widest text-xs font-bold">
                          {isDeduction ? '推论' : '线索'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingId !== clue.id && (
                          <button
                            onPointerDown={(e: any) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setEditingId(clue.id); setEditValue(clue.text); }}
                            className="text-ink-500 hover:text-cyan-500 transition-colors pointer-events-auto"
                            title="编辑"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button
                          onPointerDown={(e: any) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); removeClue(clue.id); setSelectedClues(prev => prev.filter(id => id !== clue.id)); }}
                          className="text-ink-500 hover:text-vermilion-500 transition-colors pointer-events-auto"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {editingId === clue.id ? (
                      <div className="mt-2 mb-1 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <textarea
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className={`w-full text-sm font-sans tracking-wide leading-relaxed bg-transparent border-b outline-none resize-none overflow-hidden ${
                            isDeduction 
                              ? 'text-paper-200 border-emerald-500/50 focus:border-emerald-400 placeholder:text-ink-600' 
                              : 'text-ink-800 border-gold-500/50 focus:border-gold-400 placeholder:text-ink-400'
                          }`}
                          rows={3}
                          autoFocus
                          onPointerDown={e => e.stopPropagation()}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-ink-500 hover:text-ink-400 p-1">
                            <X size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); editClue(clue.id, editValue); setEditingId(null); }} className="text-emerald-500 hover:text-emerald-400 p-1">
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`font-sans text-sm tracking-wide leading-relaxed pointer-events-none ${isDeduction ? 'text-paper-200' : 'text-ink-800'}`}>
                        {clue.text}
                      </p>
                    )}
                    
                    <div className={`text-[10px] mt-3 flex justify-between items-center font-sans opacity-70 pointer-events-none ${isDeduction ? 'text-emerald-200' : 'text-ink-600'}`}>
                      <span>{clue.source}</span>
                      <span>{clue.timestamp}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}

        {/* Combine Action Bar */}
        <AnimatePresence>
          {selectedClues.length > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink-900/90 backdrop-blur-md border border-gold-500/50 rounded-full px-6 py-3 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50"
            >
              <div className="flex items-center gap-2 font-sans text-sm">
                <span className="text-paper-200 tracking-widest">已选:</span>
                <span className="text-gold-400 font-bold">{selectedClues.length}/2</span>
              </div>
              
              <button
                disabled={selectedClues.length !== 2}
                onClick={(e) => { e.stopPropagation(); handleCombine(); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border tracking-widest font-serif text-sm transition-all ${
                  selectedClues.length === 2
                    ? 'bg-gold-500/20 border-gold-500 text-gold-400 hover:bg-gold-500/30 hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : 'bg-ink-800 border-ink-700 text-ink-500 cursor-not-allowed'
                }`}
              >
                <Link2 size={16} />
                红线连结
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combining Options Overlay */}
        <AnimatePresence>
          {combiningOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm pointer-events-auto"
              onClick={() => setCombiningOptions(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-ink-800 border border-gold-500/30 rounded-xl p-8 max-w-lg w-full shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl text-gold-400 tracking-widest flex items-center gap-2">
                    <Lightbulb size={20} />
                    产生新推论
                  </h3>
                  <button onClick={() => setCombiningOptions(null)} className="text-ink-400 hover:text-vermilion-400">
                    <X size={20} />
                  </button>
                </div>
                
                <p className="font-sans text-sm text-paper-200 mb-6 tracking-wide">
                  基于你选择的两条线索，请在下方选择一个最符合你观点的推论方向：
                </p>
                
                <div className="flex flex-col gap-3">
                  {combiningOptions.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectDeductionOption(option)}
                      className="text-left font-sans text-sm tracking-wide leading-relaxed p-4 rounded-lg bg-ink-900 border border-ink-700 hover:border-emerald-500/50 hover:bg-emerald-900/20 text-paper-100 transition-all group"
                    >
                      <span className="text-emerald-500 font-bold mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        •
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Fullscreen Toggle */}
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="absolute bottom-4 right-4 z-40 p-3 bg-ink-900/80 backdrop-blur border border-ink-700/50 text-paper-200 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors rounded shadow-lg flex items-center justify-center"
        >
          {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </Modal>
  );
};
