import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { useGameContext, CaseInfo, TruthTag } from '../../store/GameContext';
import { ClueStatus } from '../../types';
import { Search, Trash2, Link2, Edit2, Check, X, Maximize, Minimize, Plus, FolderPlus, Lock, Unlock, Loader2, Scroll, BookOpen, PenTool, XCircle, ChevronLeft, Stamp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClueNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 横竖排滚动容器
 *
 * 滚轮行为规则：
 * - 横排模式 (horizontal)：滚轮正常垂直滚动（需求一）
 * - 竖排模式 (vertical) + 非推论环节：滚轮 deltaY → scrollLeft（左右翻页）
 * - 竖排模式 (vertical) + 推论合成环节：滚轮恢复垂直滚动（上下翻页看完整内容）（需求二）
 */
const HorizontalScroller: React.FC<{
  children: React.ReactNode;
  className?: string;
  layoutMode: 'horizontal' | 'vertical';
  allowVerticalScroll?: boolean;
  style?: React.CSSProperties;
}> = ({ children, className, layoutMode, allowVerticalScroll = false, style }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (layoutMode === 'horizontal') return;
    if (layoutMode === 'vertical' && allowVerticalScroll) return;
    const handler = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [layoutMode, allowVerticalScroll]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

/* ════════════════ 公共样式（可读性规范：正文≥15px，辅文≥12px，禁用低透明度文字） ════════════════ */
const dialogInputCls =
  'w-full bg-[#f0e8d3] border border-[#b9a67e] px-3 py-2.5 text-[15px] font-sans text-[#241d12] tracking-wide leading-relaxed focus:border-[#6d5b3d] outline-none resize-none transition-colors placeholder:text-[#7a6949] rounded-sm';
const dialogBtnGhostCls =
  'px-5 py-2 text-[14px] font-sans font-bold tracking-[0.25em] pl-[calc(1.25rem+0.25em)] text-[#4a3a22] rounded-sm border border-[#b9a67e] bg-[#efe7d2] hover:bg-[#e5d9ba] hover:border-[#8a7556] transition-all';
const dialogBtnDarkCls =
  'px-5 py-2 text-[14px] font-sans font-bold tracking-[0.25em] pl-[calc(1.25rem+0.25em)] text-[#f4ecd9] rounded-sm border border-[#33291a] bg-[#4c3f2c] hover:bg-[#3a3020] transition-all shadow-md';
const dialogBtnRedCls =
  'px-5 py-2 text-[14px] font-sans font-bold tracking-[0.25em] pl-[calc(1.25rem+0.25em)] text-[#fff1e4] rounded-sm border border-vermilion-800 bg-vermilion-700 hover:bg-vermilion-800 transition-all shadow-md disabled:opacity-40';

/** 明制函套式纸质弹窗面板 */
const PaperDialog: React.FC<{
  title: string;
  onClose?: () => void;
  closeDisabled?: boolean;
  wide?: boolean;
  vermilion?: boolean;
  children: React.ReactNode;
  onBackdropClick?: () => void;
}> = ({ title, onClose, closeDisabled, wide = false, vermilion = false, children, onBackdropClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-50 flex items-center justify-center bg-[#1c1610]/75 backdrop-blur-sm"
    onClick={closeDisabled ? undefined : onBackdropClick}
  >
    <motion.div
      initial={{ scale: 0.92, y: 15, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.92, y: 15, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative ${wide ? 'max-w-lg' : 'max-w-md'} w-[calc(100%-2rem)] bg-[#f6efdc] rounded-sm p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${vermilion ? 'max-h-[85vh]' : ''} overflow-y-auto custom-scrollbar`}
      style={{ border: '1px solid #8a7556', boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 4px #f6efdc, inset 0 0 0 5px #c9b68b' }}
      onClick={e => e.stopPropagation()}
    >
      {/* 函套顶饰：素带 + 朱心 */}
      <div className="absolute top-[5px] left-[5px] right-[5px] h-[3px] flex items-center pointer-events-none">
        <div className={`flex-1 h-px ${vermilion ? 'bg-vermilion-700/50' : 'bg-[#a89370]/60'}`} />
        <div className={`w-1.5 h-1.5 rotate-45 ${vermilion ? 'bg-vermilion-700/60' : 'bg-[#8a7556]/60'}`} />
        <div className={`flex-1 h-px ${vermilion ? 'bg-vermilion-700/50' : 'bg-[#a89370]/60'}`} />
      </div>
      {/* 标题 */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-[#c9b68b]">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`font-serif text-[15px] ${vermilion ? 'text-vermilion-700' : 'text-[#8a7556]'}`}>◆</span>
          <h3 className={`font-serif text-[19px] font-bold tracking-[0.3em] ${vermilion ? 'text-vermilion-800' : 'text-[#241d0f]'}`}>{title}</h3>
          <span className={`font-serif text-[15px] ${vermilion ? 'text-vermilion-700' : 'text-[#8a7556]'}`}>◆</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#6d5b3d] hover:text-vermilion-700 hover:bg-vermilion-700/10 transition-all p-1 rounded-sm shrink-0" title="关闭">
            <X size={20} />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export const ClueNotebookModal: React.FC<ClueNotebookModalProps> = ({ isOpen, onClose }) => {
  const {
    clues, cases, removeClue, combineClues, commitDeduction, editClue,
    updateDeductionStatus,
    createCase, closeCase, reopenCase, deleteCase, getCaseClues,
    addClue, isCombining, addNotification,
  } = useGameContext();

  // 视图层级：'shelf' = 卷宗架首页，'detail' = 展卷详情
  const [view, setView] = useState<'shelf' | 'detail'>('shelf');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 案件创建
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // 横竖排切换
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('vertical');

  // 线索组合
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [combiningOptions, setCombiningOptions] = useState<{ id1: string, id2: string, options: { text: string; truth: TruthTag }[] } | null>(null);
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');
  const [showManualDeduction, setShowManualDeduction] = useState(false);
  const [manualDeductionText, setManualDeductionText] = useState('');
  const [showManualClue, setShowManualClue] = useState(false);
  const [manualClueText, setManualClueText] = useState('');

  // 删卷确认
  const [deletingCase, setDeletingCase] = useState<CaseInfo | null>(null);

  // 结案表单
  const [closingCaseId, setClosingCaseId] = useState<string | null>(null);
  const [closeCaseName, setCloseCaseName] = useState('');
  const [closeKeywords, setCloseKeywords] = useState<string[]>([]);
  const [closeKeywordInput, setCloseKeywordInput] = useState('');
  const [closeStatement, setCloseStatement] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const currentCase = useMemo(() => cases.find(c => c.id === activeCaseId) || null, [cases, activeCaseId]);

  const currentCaseClues = useMemo(() => {
    if (!currentCase) return [];
    return getCaseClues(currentCase.id);
  }, [currentCase, clues, getCaseClues]);

  const isInDeductionMode = !!(combiningOptions || showManualDeduction);

  const baseClues = useMemo(() => currentCaseClues.filter(c => c.type === 'clue'), [currentCaseClues]);
  const deductions = useMemo(() => currentCaseClues.filter(c => c.type === 'deduction'), [currentCaseClues]);

  // 卷宗架数据：分进行中 / 已结案
  const activeCases = useMemo(() => cases.filter(c => c.status === 'active'), [cases]);
  const closedCases = useMemo(() => cases.filter(c => c.status === 'closed'), [cases]);

  // ── 进入卷宗详情 ──
  const openCaseDetail = (caseId: string) => {
    setActiveCaseId(caseId);
    setView('detail');
  };

  // ── 返回卷宗架 ──
  const backToShelf = () => {
    setView('shelf');
    setActiveCaseId(null);
    setSelectedClues([]);
  };

  // ── 案件创建 ──
  const handleCreateCase = () => {
    if (!newCaseName.trim()) { addNotification('请输入案件名称', 'warning'); return; }
    const id = createCase(newCaseName);
    setActiveCaseId(id);
    setShowNewCaseForm(false);
    setNewCaseName('');
    setView('detail');
  };

  // ── 线索选择 ──
  const toggleClue = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId) return;
    setSelectedClues(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  // ── 组合线索 → 调 AI ──
  const handleCombine = async () => {
    if (selectedClues.length !== 2) return;
    const options = await combineClues(selectedClues[0], selectedClues[1]);
    if (options && options.length > 0) {
      setCombiningOptions({ id1: selectedClues[0], id2: selectedClues[1], options });
      setSelectedClues([]);
    } else {
      setSelectedClues([]);
    }
  };

  // ── 选择推论选项 ──
  const selectDeductionOption = (text: string, truth?: TruthTag) => {
    if (!combiningOptions || !currentCase) return;
    const c1 = clues.find(c => c.id === combiningOptions.id1);
    const c2 = clues.find(c => c.id === combiningOptions.id2);
    let posX = 200, posY = 200;
    if (c1?.position && c2?.position) {
      posX = (c1.position.x + c2.position.x) / 2;
      posY = Math.max(c1.position.y, c2.position.y) + 120;
    }
    commitDeduction([combiningOptions.id1, combiningOptions.id2], text, currentCase.id, { x: posX, y: posY }, truth);
    setCombiningOptions(null);
    setEditingOptionIdx(null);
    setEditingOptionValue('');
    setManualDeductionText('');
  };

  const confirmEditedOption = () => {
    const text = editingOptionValue.trim();
    if (!text || editingOptionIdx == null) return;
    selectDeductionOption(text, combiningOptions?.options[editingOptionIdx]?.truth);
  };

  const handleManualDeduction = () => {
    if (!manualDeductionText.trim() || !currentCase) return;
    commitDeduction(selectedClues, manualDeductionText, currentCase.id);
    setShowManualDeduction(false);
    setManualDeductionText('');
    setSelectedClues([]);
  };

  const handleManualClue = () => {
    if (!manualClueText.trim() || !currentCase) return;
    addClue(manualClueText, '玩家手书', currentCase.id);
    setShowManualClue(false);
    setManualClueText('');
  };

  const startCloseCase = (caseInfo: CaseInfo) => {
    setClosingCaseId(caseInfo.id);
    setCloseCaseName(caseInfo.name);
    setCloseKeywords([...caseInfo.keywords]);
    setCloseStatement(caseInfo.closingStatement || '');
    setCloseKeywordInput('');
  };

  const addKeyword = () => {
    const kw = closeKeywordInput.trim();
    if (!kw) return;
    if (!closeKeywords.includes(kw)) setCloseKeywords(prev => [...prev, kw]);
    setCloseKeywordInput('');
  };

  const removeKeyword = (kw: string) => setCloseKeywords(prev => prev.filter(k => k !== kw));

  const handleConfirmCloseCase = async () => {
    if (!closingCaseId || !closeCaseName.trim()) { addNotification('请填写案件名称', 'warning'); return; }
    if (closeKeywords.length === 0) { addNotification('请至少添加一个关键词', 'warning'); return; }
    if (!closeStatement.trim()) { addNotification('请填写结案陈词', 'warning'); return; }
    setIsClosing(true);
    await closeCase(closingCaseId, closeCaseName, closeKeywords, closeStatement);
    setIsClosing(false);
    setClosingCaseId(null);
  };

  /* ══════════════════════════════════════════════════════════════
     渲染：明制卷宗（书架立册）
     · 在查案卷：仿《永乐大典》瓷青函套 + 左上竖排题签
     · 已结案卷：仿黄册旧籍 + 斜贴封条「已结」+ 骑缝印
  ══════════════════════════════════════════════════════════════ */
  const renderShelfItem = (ci: CaseInfo) => {
    const isClosed = ci.status === 'closed';
    const caseClueList = getCaseClues(ci.id);
    const clueCount = caseClueList.filter(c => c.type === 'clue').length;
    const dedCount = caseClueList.filter(c => c.type === 'deduction').length;
    return (
      <motion.div
        key={ci.id}
        layout
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={() => openCaseDetail(ci.id)}
        className="relative cursor-pointer group shrink-0"
        style={{ width: '172px' }}
        title={`展卷：${ci.name}`}
      >
        {/* ── 书册（函套封面）── */}
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ duration: 0.22 }}
          className="relative rounded-[3px] overflow-hidden"
          style={{
            height: '272px',
            background: isClosed
              ? 'linear-gradient(160deg, #dcc489 0%, #cfb476 48%, #c3a565 100%)'
              : 'linear-gradient(160deg, #36497a 0%, #2d3e67 45%, #26355a 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 2px 3px 8px rgba(30,22,10,0.35), 0 10px 22px rgba(30,22,10,0.28)',
          }}
        >
          {/* 织锦纸纹 */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 3px)',
            }} />

          {/* 包背装订边（左侧）+ 四眼线装线迹 */}
          <div className="absolute left-0 top-0 bottom-0 w-[11px]"
            style={{ background: isClosed ? 'linear-gradient(to right, #96793f, #a88a4d)' : 'linear-gradient(to right, #1b2743, #222f52)' }} />
          {[10, 34, 62, 88].map(t => (
            <div key={t} className="absolute left-[3px] w-[7px] h-[7px] rounded-full pointer-events-none"
              style={{
                top: `${t}%`,
                background: 'radial-gradient(circle, #e8dcbb 0 1.5px, rgba(232,220,187,0.4) 1.5px 3px, transparent 3px)',
              }} />
          ))}

          {/* 题签（竖排书名条，双线框） */}
          <div className="absolute left-[26px] top-[15px] rounded-[2px] px-2 pt-2 pb-3"
            style={{
              background: 'linear-gradient(180deg, #f7f0da, #efe6cb)',
              border: '1px solid #b7a67d',
              boxShadow: '2px 2px 6px rgba(15,10,4,0.4), inset 0 0 0 3px #f4ecd7, inset 0 0 0 4px #cbbb92',
            }}>
            <div className="flex flex-col items-center gap-2">
              <span className="font-serif text-[13px] font-bold tracking-[0.3em] pl-[0.3em] text-vermilion-700 border-b border-[#c9b68b] pb-1.5 w-full text-center">
                钦天监
              </span>
              <h3 className="font-serif text-[19px] font-bold leading-none text-[#211a0d] overflow-hidden"
                style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '0.22em', maxHeight: '166px' }}>
                {ci.name}
              </h3>
            </div>
          </div>

          {/* 书根：线索/推论计数与立案日期 */}
          <div className="absolute bottom-0 inset-x-0 h-[38px] flex flex-col items-center justify-center gap-[3px]"
            style={{ background: isClosed ? 'rgba(88,68,32,0.22)' : 'rgba(13,19,34,0.6)' }}>
            <span className={`font-sans text-[12px] font-bold tracking-[0.18em] ${isClosed ? 'text-[#3d2f16]' : 'text-[#eee4c6]'}`}>
              线索{clueCount} · 推论{dedCount}
            </span>
            <span className={`font-sans text-[12px] ${isClosed ? 'text-[#5a4826]' : 'text-[#cdc2a0]'}`}>
              {ci.createdAt}
            </span>
          </div>

          {/* 已结封条（斜贴骑缝） */}
          {isClosed && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] flex items-center gap-2 px-4 py-1.5"
                style={{ background: 'rgba(247,240,218,0.97)', border: '1.5px solid #9c2a1e', boxShadow: '0 2px 10px rgba(40,25,10,0.35)' }}>
                <span className="font-serif text-[21px] font-bold text-[#8f1f14] tracking-[0.4em] pl-[0.4em]">已结</span>
                <span className="font-serif text-[12px] font-bold text-[#8f1f14] border border-[#8f1f14] px-1 py-[1px] rotate-[8deg]">验讫</span>
              </div>
            </div>
          )}

          {/* 悬停展卷提示 */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
            <span className="font-sans text-[13px] font-bold text-[#f6efdc] bg-[#33291a]/85 px-3 py-1 rounded-full tracking-[0.2em]">
              展卷
            </span>
          </div>

          {/* 删卷按钮（悬停显示，左下角） */}
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingCase(ci); }}
            className="absolute bottom-[42px] left-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-6 h-6 rounded-full bg-vermilion-700/90 border border-vermilion-800 text-[#fff1e4] hover:bg-vermilion-800 hover:scale-110 shadow-md"
            title="焚毁案卷"
          >
            <Trash2 size={12} />
          </button>
        </motion.div>

        {/* ── 木搁板 ── */}
        <div className="mx-auto mt-[6px] rounded-[2px]"
          style={{
            width: '196px',
            height: '9px',
            background: 'linear-gradient(to bottom, #7a5a38 0%, #5c422a 45%, #3a2a1a 100%)',
            boxShadow: '0 3px 5px rgba(30,20,8,0.35), inset 0 1px 0 rgba(255,230,190,0.25)',
          }} />
      </motion.div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     渲染：线索/推论卡片（明制档案页，横竖双版式）
  ══════════════════════════════════════════════════════════════ */
  const renderClueCard = (clue: typeof baseClues[number]) => {
    const isSelected = selectedClues.includes(clue.id);
    const isDeduction = clue.type === 'deduction';
    const dStatus = (clue.status || 'pending') as ClueStatus;
    const isReadOnly = currentCase?.status === 'closed';
    const vertical = layoutMode === 'vertical';

    const statusActiveCls: Record<ClueStatus, string> = {
      'pending': 'bg-[#4c4132] text-[#f2e9d2] border-[#33291a]',
      'true': 'bg-vermilion-700 text-[#fff1e4] border-vermilion-800',
      'false': 'bg-[#5a5a5a] text-[#f0f0f0] border-[#404040]',
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: vertical ? 10 : -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        key={clue.id}
        onClick={(e) => !isReadOnly && toggleClue(clue.id, e)}
        className={`relative p-4 rounded-sm transition-all overflow-hidden group ${
          vertical ? 'h-full min-w-75 w-75 shrink-0 flex flex-col justify-between' : ''
        } ${
          isReadOnly
            ? 'bg-[#eee5d0] border border-[#a89370] opacity-95'
            : isSelected
              ? 'bg-[#fbf5e5] border-2 border-vermilion-600 shadow-[0_4px_20px_rgba(184,45,32,0.3)] cursor-pointer'
              : 'bg-[#faf5e8] border border-[#c9b998] hover:border-[#8a7556] hover:shadow-md cursor-pointer'
        }`}
        style={{ transition: 'all 0.2s ease' }}
      >
        {/* 选中态朱印角标 */}
        {isSelected && (
          <div className="absolute right-0 top-0 w-10 h-10 overflow-hidden pointer-events-none z-20">
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-vermilion-600 rotate-45 shadow-sm" />
            <div className="absolute top-1.5 right-1.5 text-[#fff1e4] z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              <Check size={13} strokeWidth={3} />
            </div>
          </div>
        )}

        {/* 类别章（线索·青 / 推论·朱） */}
        <div className={`absolute top-2 left-2 px-2 py-[3px] text-[12px] font-serif font-bold tracking-[0.2em] rounded-[2px] pointer-events-none z-10 border ${
          isDeduction
            ? 'bg-vermilion-700 text-[#fff1e4] border-vermilion-800'
            : 'bg-cyan-700 text-[#eaf4f1] border-cyan-900'
        }`}>
          {isDeduction ? '推论' : '线索'}
        </div>

        {/* 标题栏 */}
        <div className={`flex justify-between items-start gap-2 mb-3 relative z-10 pt-8 ${vertical ? '' : 'border-b-2 pb-2'}`}
          style={{ borderColor: 'rgba(201,185,148,0.9)' }}>
          <span className={`font-serif text-[19px] font-bold tracking-[0.15em] ${dStatus === 'false' ? 'text-[#6a6156] line-through' : 'text-[#1e180c]'}`}
            style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}>
            {clue.title || (isDeduction ? '推论' : '线索')}
          </span>
          {isDeduction && !isReadOnly && (
            <div className={`flex gap-1 ${vertical ? 'flex-col' : ''}`}>
              {(['pending', 'true', 'false'] as const).map(s => (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); updateDeductionStatus(clue.id, s); }}
                  className={`px-2 py-[3px] text-[13px] font-sans font-bold tracking-wider rounded-[2px] border transition-all ${
                    dStatus === s
                      ? statusActiveCls[s]
                      : 'bg-[#f0e8d3] text-[#6d5b3d] border-[#c9b68b] hover:border-[#8a7556] hover:text-[#3d3018]'
                  }`}
                  style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}
                >
                  {s === 'pending' ? '未定' : s === 'true' ? '属实' : '伪证'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 正文 */}
        <HorizontalScroller
          layoutMode={layoutMode}
          allowVerticalScroll={isInDeductionMode}
          className={`font-serif text-[17px] relative z-10 text-[#2a2317] ${
            vertical ? 'leading-[2.2] tracking-[0.08em] flex-1 overflow-x-auto h-[68%] custom-scrollbar' : 'leading-[1.85] tracking-[0.04em]'
          }`}
          style={{
            writingMode: vertical ? 'vertical-rl' : 'horizontal-tb',
          }}
        >
          {clue.text}
        </HorizontalScroller>

        {/* 状态水印（装饰，不承担可读信息） */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.05]">
          <span className={`font-serif font-black text-[64px] -rotate-12 select-none ${
            dStatus === 'true' ? 'text-vermilion-700' : dStatus === 'false' ? 'text-[#525252]' : 'text-[#8c7a56]'
          }`}>
            {dStatus === 'true' ? '属实' : dStatus === 'false' ? '伪证' : '待勘'}
          </span>
        </div>

        {/* 伪证双斜线 */}
        {dStatus === 'false' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
            <div className="w-[140%] h-px bg-[#4a4a4a]/20 transform -rotate-12" />
            <div className="absolute w-[140%] h-px bg-[#4a4a4a]/15 transform rotate-12" />
          </div>
        )}

        {/* 勘验属实骑缝印 */}
        {dStatus === 'true' && (
          <div className={`absolute pointer-events-none z-10 ${vertical ? 'left-3 bottom-12' : 'right-4 bottom-9'}`}>
            <div className="relative rotate-[-10deg]">
              <div className="border-[3px] border-vermilion-700/35 rounded-[4px] px-2 py-1">
                <span className="font-serif text-[22px] font-black text-vermilion-700/45 tracking-[0.15em] select-none">属实</span>
              </div>
            </div>
          </div>
        )}

        {/* 底部信息栏 */}
        <div className={`mt-4 flex justify-between items-center text-[12px] font-sans font-bold relative z-10 ${vertical ? 'flex-col items-start gap-2' : ''}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#6d5b3d]" style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}>
              {clue.source}
            </span>
            <span className="text-[#c4b59d]">|</span>
            <span className="text-[#7c6a49]" style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}>
              {clue.timestamp}
            </span>
          </div>
          {!isReadOnly && (
            <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {editingId !== clue.id && (
                <button onPointerDown={(e: any) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setEditingId(clue.id); setEditValue(clue.text); }}
                  className="text-[#6d5b3d] hover:text-cyan-700 transition-colors pointer-events-auto p-1.5 hover:bg-cyan-700/10 rounded-sm" title="编辑"><Edit2 size={16} /></button>
              )}
              <button onPointerDown={(e: any) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeClue(clue.id); setSelectedClues(prev => prev.filter(id => id !== clue.id)); }}
                className="text-[#6d5b3d] hover:text-vermilion-700 transition-colors pointer-events-auto p-1.5 hover:bg-vermilion-700/10 rounded-sm" title="删除"><Trash2 size={16} /></button>
            </div>
          )}
        </div>

        {/* 编辑态 */}
        {editingId === clue.id && !isReadOnly && (
          <div className="mt-2 mb-1 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <textarea value={editValue} onChange={e => setEditValue(e.target.value)}
              className="w-full text-[14px] font-sans tracking-wide leading-relaxed bg-[#f0e8d3] border-b-2 outline-none resize-none overflow-hidden text-[#241d12] border-[#b9a67e] focus:border-[#6d5b3d] rounded-sm px-2 py-1.5" rows={3} autoFocus onPointerDown={e => e.stopPropagation()} />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-[#6d5b3d] hover:text-[#3d3018] p-1.5 hover:bg-[#6d5b3d]/10 rounded-sm transition-colors" title="取消"><X size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); editClue(clue.id, editValue); setEditingId(null); }} className="text-cyan-700 hover:text-cyan-600 p-1.5 hover:bg-cyan-700/10 rounded-sm transition-colors" title="保存"><Check size={16} /></button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  /* ══════════════════════════════════════════════════════════════
     渲染主体
  ══════════════════════════════════════════════════════════════ */
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="钦 天 监 · 御 览 密 奏"
      id="clue-notebook-modal"
      fullScreen={isFullScreen}
      onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      variant="blank"
    >
      <div className={`absolute inset-0 bg-[#ece2ca] text-[#2a2317] flex flex-col overflow-hidden ${isFullScreen ? '' : 'border-4 border-[#4a3826] rounded-sm'}`}
        style={{ boxShadow: 'inset 0 0 70px rgba(120,96,58,0.13)' }}>

        {/* ── 古风 Header（漆木题匾） ── */}
        <div className="flex items-center justify-between pl-4 pr-3 py-3 relative z-30 shrink-0 border-b-2 border-[#2a2013]"
          style={{ background: 'linear-gradient(180deg, #4a3a26 0%, #3a2c1c 100%)', boxShadow: '0 3px 10px rgba(20,14,6,0.35)' }}>
          <div className="flex items-center gap-3 min-w-0">
            {view === 'detail' && (
              <button onClick={backToShelf}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans font-bold tracking-widest text-[#f0e5c6] bg-[#5c4830] border border-[#7a5f40] rounded-sm hover:bg-[#6d5538] hover:border-[#9c7d55] transition-all shrink-0"
                title="返回卷宗架">
                <ChevronLeft size={16} /> 收卷
              </button>
            )}
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-[3px]"
              style={{ background: 'rgba(20,14,6,0.35)', border: '1px solid #6d5538', boxShadow: 'inset 0 1px 0 rgba(255,235,200,0.12)' }}>
              <span className="text-[#d6b75a] font-serif text-[15px]">◆</span>
              <h2 className="font-serif text-[19px] text-[#f2e7c9] font-bold tracking-[0.3em] whitespace-nowrap"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                {view === 'shelf' ? '钦天监 · 卷宗架' : '钦天监 · 御览密奏'}
              </h2>
              <span className="text-[#d6b75a] font-serif text-[15px]">◆</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {view === 'detail' && (
              <button
                onClick={() => setLayoutMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
                className="mr-1 px-3.5 py-1.5 bg-[#5c4830] border border-[#7a5f40] text-[#f0e5c6] text-[13px] font-sans font-bold tracking-widest hover:bg-[#6d5538] hover:border-[#9c7d55] rounded-sm transition-all shadow-sm"
                title="切换版式"
              >
                <span className="text-[#d6b75a] mr-1">{layoutMode === 'horizontal' ? '◇' : '◈'}</span>
                {layoutMode === 'horizontal' ? '竖排' : '横排'}
              </button>
            )}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-[#e8dcbb] hover:text-[#fff7e2] hover:bg-[#5c4830] transition-all rounded-sm border border-transparent hover:border-[#7a5f40]"
              title={isFullScreen ? "退出全屏" : "全屏查看"}
            >
              {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#e8dcbb] hover:text-[#ffb4a6] hover:bg-vermilion-800/40 transition-all rounded-sm border border-transparent hover:border-vermilion-700"
              title="合卷（关闭）"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* ── 纸张纹理叠层 ── */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none z-0 mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(#8c7a56 1px, transparent 1px), radial-gradient(#8c7a56 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px, 12px 12px',
            backgroundPosition: '0 0, 6px 6px',
          }}
        />

        <AnimatePresence mode="wait">
          {view === 'shelf' ? (
            /* ══════════════════════════════════════════════════════════
               第一层：明制卷宗架
            ══════════════════════════════════════════════════════════ */
            <motion.div
              key="shelf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10"
            >
              {/* ── 正在调查区 ── */}
              <div className="px-7 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <div className="px-3.5 py-1.5 rounded-[3px] flex items-center gap-2.5"
                    style={{ background: 'linear-gradient(160deg, #4e3b26, #3a2b1b)', boxShadow: 'inset 0 1px 0 rgba(255,235,200,0.16), 0 2px 6px rgba(30,20,8,0.3)' }}>
                    <span className="w-2 h-2 rounded-full bg-vermilion-500 shadow-[0_0_6px_rgba(214,61,46,0.9)]" />
                    <h3 className="font-serif text-[17px] font-bold tracking-[0.25em] text-[#f2e7c9]">正在调查</h3>
                  </div>
                  <span className="font-sans text-[13px] font-bold text-[#4a3a22] bg-[#e3d7ba] border border-[#b9a67e] rounded-full px-2.5 py-0.5">{activeCases.length}</span>
                  <div className="flex-1 min-w-[40px] h-[2px]" style={{ background: 'linear-gradient(to right, #a89370, transparent)' }} />
                  <button onClick={() => setShowNewCaseForm(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f6efdc] border border-dashed border-[#8a7556] text-[#4a3a22] hover:border-vermilion-600 hover:text-vermilion-700 hover:bg-[#fdf7e4] transition-all text-[13px] font-sans font-bold tracking-[0.2em] rounded-sm shadow-sm">
                    <FolderPlus size={15} /> 新立案
                  </button>
                </div>

                {activeCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-[#6d5b3d] gap-3">
                    <Search size={40} className="opacity-50" />
                    <p className="font-serif tracking-[0.25em] text-[16px] font-bold text-[#4a3a22]">尚无案件在查</p>
                    <p className="text-[13px] font-sans tracking-wide text-[#6d5b3d]">点击「新立案」开启一卷调查</p>
                  </div>
                ) : (
                  <div className="flex gap-x-6 gap-y-3 flex-wrap justify-start">
                    <AnimatePresence>
                      {activeCases.map(ci => renderShelfItem(ci))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* ── 已结案归档区 ── */}
              {closedCases.length > 0 && (
                <div className="px-7 pt-4 pb-8 border-t-2 border-[#b9a67e]/40">
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="px-3.5 py-1.5 rounded-[3px] flex items-center gap-2.5"
                      style={{ background: 'linear-gradient(160deg, #6d5c3d, #57482d)', boxShadow: 'inset 0 1px 0 rgba(255,235,200,0.14), 0 2px 6px rgba(30,20,8,0.3)' }}>
                      <Stamp size={15} className="text-[#e8dcbb]" />
                      <h3 className="font-serif text-[17px] font-bold tracking-[0.25em] text-[#f2e7c9]">已结归档</h3>
                    </div>
                    <span className="font-sans text-[13px] font-bold text-[#4a3a22] bg-[#e3d7ba] border border-[#b9a67e] rounded-full px-2.5 py-0.5">{closedCases.length}</span>
                    <div className="flex-1 min-w-[40px] h-[2px]" style={{ background: 'linear-gradient(to right, #a89370, transparent)' }} />
                  </div>

                  <div className="flex gap-x-6 gap-y-3 flex-wrap justify-start">
                    <AnimatePresence>
                      {closedCases.map(ci => renderShelfItem(ci))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {cases.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-[#6d5b3d] gap-4 py-16">
                  <BookOpen size={56} className="opacity-40" />
                  <p className="font-serif tracking-[0.3em] text-[19px] font-bold text-[#4a3a22]">卷宗架空空如也</p>
                  <p className="text-[13px] font-sans tracking-wide text-[#6d5b3d]">点击「新立案」开始第一桩调查</p>
                </div>
              )}
            </motion.div>
          ) : (
            /* ══════════════════════════════════════════════════════════
               第二层：展卷详情（双页布局）
            ══════════════════════════════════════════════════════════ */
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className={`flex-1 flex flex-col ${layoutMode === 'vertical' ? 'md:flex-row-reverse' : 'md:flex-row'} relative z-10 min-h-0`}
            >
              {/* ════ 左页：案牍卷宗（线索） ════ */}
              <div className={`w-full md:w-1/2 h-full flex flex-col relative ${layoutMode === 'vertical' ? 'border-l-2' : 'border-r-2'} border-[#b9a67e] bg-[#e8dfc6] shrink-0 min-h-0`}>
                <div className="p-3.5 border-b-2 border-[#b9a67e] bg-[#ddd0b2] flex justify-between items-center shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-[3px] bg-[#3a2c1c] text-[#e8dcbb] shrink-0"><Scroll size={17} /></span>
                    <h3 className="font-serif text-[17px] font-bold tracking-[0.2em] text-[#241d0f] truncate">案牍卷宗</h3>
                  </div>
                  <span className="text-[13px] font-sans font-bold text-[#4a3a22] bg-[#ece2ca] border border-[#b9a67e] rounded-full px-2.5 py-0.5 shrink-0">共 {baseClues.length} 卷</span>
                </div>

                <HorizontalScroller
                  layoutMode={layoutMode}
                  allowVerticalScroll={isInDeductionMode}
                  className={`flex-1 overflow-y-auto custom-scrollbar p-4 pb-20 ${layoutMode === 'vertical' ? 'flex flex-row overflow-x-auto overflow-y-hidden gap-4' : 'space-y-4'}`}
                >
                  {baseClues.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-[#6d5b3d] font-serif gap-4">
                      <BookOpen size={44} className="opacity-50" />
                      <p className="tracking-[0.2em] text-[15px] font-bold text-[#4a3a22]" style={{ writingMode: layoutMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb' }}>
                        {currentCase?.status === 'closed' ? '此案已结，无线索记录' : '尚无线索，请在正文中选词收集'}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {baseClues.map(clue => renderClueCard(clue))}
                    </AnimatePresence>
                  )}
                </HorizontalScroller>

                {/* 底部操作栏（仅进行中案件） */}
                {currentCase?.status === 'active' && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 flex-wrap justify-center max-w-[92%] px-3 py-2 rounded-full"
                    style={{ background: 'rgba(58,44,24,0.92)', boxShadow: '0 4px 16px rgba(20,14,6,0.4)' }}>
                    <button onClick={(e) => { e.stopPropagation(); setShowManualClue(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2e9d2] border border-[#8a7556] rounded-full text-[#3a2f1c] hover:bg-[#fdf7e4] transition-all text-[13px] font-sans font-bold tracking-widest shadow-sm">
                      <Plus size={14} /> 线索
                    </button>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                      selectedClues.length === 2 ? 'bg-vermilion-700 border-vermilion-800 text-[#fff1e4] shadow-[0_0_14px_rgba(214,61,46,0.5)]' : 'bg-[#5c4830] border-[#7a5f40] text-[#e8dcbb]'
                    }`}>
                      <span className="font-sans text-[13px] font-bold tracking-widest">已选 {selectedClues.length}/2</span>
                      <button disabled={selectedClues.length !== 2 || isCombining} onClick={(e) => { e.stopPropagation(); handleCombine(); }}
                        className="flex items-center gap-1.5 font-sans text-[13px] font-bold tracking-widest disabled:opacity-40">
                        {isCombining ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={15} />}
                        {isCombining ? '推演中' : '红线连结'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ════ 右页：勘合定谳（推论） ════ */}
              <div className="w-full md:w-1/2 h-full flex flex-col relative bg-[#f2ead6] min-h-0">
                <div className="p-3.5 border-b-2 border-[#b9a67e] bg-[#e6dac0] flex justify-between items-center shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-1 rounded-[2px] bg-vermilion-700 text-[#fff1e4] font-serif text-[13px] font-bold tracking-widest shadow-sm shrink-0">密奏</span>
                    <h3 className="font-serif text-[17px] font-bold tracking-[0.2em] text-[#241d0f] truncate">臣勘合定谳</h3>
                  </div>
                  {currentCase?.status === 'active' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowManualDeduction(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-vermilion-800 font-sans font-bold border border-vermilion-700/50 rounded-full hover:bg-vermilion-700/10 hover:border-vermilion-700 transition-all text-[13px] tracking-widest bg-[#f6efdc] shadow-sm shrink-0"
                    >
                      <PenTool size={15} />
                      亲笔朱批
                    </button>
                  )}
                </div>

                <HorizontalScroller
                  layoutMode={layoutMode}
                  allowVerticalScroll={isInDeductionMode}
                  className={`flex-1 overflow-y-auto custom-scrollbar p-5 pb-20 ${layoutMode === 'vertical' ? 'flex flex-row overflow-x-auto overflow-y-hidden gap-5' : 'space-y-5'}`}
                >
                  {deductions.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-[#6d5b3d] font-serif gap-4">
                      <BookOpen size={44} className="opacity-50" />
                      <p className="tracking-[0.2em] text-[15px] font-bold text-[#4a3a22] max-w-[280px] text-center" style={{ writingMode: layoutMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb' }}>
                        {currentCase?.status === 'closed' ? '此案已结，无推论记录' : '尚无推演定论，请于左页择取两卷线索，方可提笔'}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {deductions.map(deduction => renderClueCard(deduction))}
                    </AnimatePresence>
                  )}
                </HorizontalScroller>

                {/* 案件状态操作 */}
                <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 px-2.5 py-2 rounded-full"
                  style={{ background: 'rgba(58,44,24,0.92)', boxShadow: '0 4px 16px rgba(20,14,6,0.4)' }}>
                  {currentCase?.status === 'active' ? (
                    <button onClick={(e) => { e.stopPropagation(); startCloseCase(currentCase); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2e9d2] border border-vermilion-700 rounded-full text-vermilion-800 hover:bg-[#ffe9d9] transition-all text-[13px] font-sans font-bold tracking-widest shadow-sm">
                      <Lock size={14} /> 结案
                    </button>
                  ) : currentCase && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); reopenCase(currentCase.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2e9d2] border border-cyan-700/60 rounded-full text-cyan-700 hover:bg-[#e2f0ee] transition-all text-[13px] font-sans font-bold tracking-widest shadow-sm">
                        <Unlock size={14} /> 重开
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeletingCase(currentCase); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f2e9d2] border border-vermilion-700/40 rounded-full text-vermilion-700 hover:bg-[#ffe9d9] transition-all text-[13px] font-sans font-bold tracking-widest shadow-sm">
                        <Trash2 size={14} /> 焚卷
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 书页中缝阴影（仅详情视图） ── */}
        {view === 'detail' && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[16px] pointer-events-none z-20 hidden md:block"
            style={{ background: 'linear-gradient(to right, rgba(90,70,40,0) 0%, rgba(90,70,40,0.16) 35%, rgba(58,44,24,0.3) 50%, rgba(90,70,40,0.16) 65%, rgba(90,70,40,0) 100%)' }} />
        )}
      </div>

      {/* ════ 弹窗（明制函套面板） ════ */}
      {/* ── 焚卷确认 ── */}
      <AnimatePresence>
        {deletingCase && (
          <PaperDialog
            title="焚 卷 验 毁"
            vermilion
            onBackdropClick={() => setDeletingCase(null)}
            onClose={() => setDeletingCase(null)}
          >
            <p className="font-serif text-[16px] text-[#3a2f1c] leading-[2] tracking-[0.1em] mb-2">
              案卷「<span className="font-bold text-vermilion-800">{deletingCase.name}</span>」连同其中线索、推论，
              <span className="text-vermilion-700 font-bold">一旦焚毁，不可复得</span>。
            </p>
            <p className="font-sans text-[13px] text-[#6d5b3d] tracking-wide mb-6">
              共计线索 {getCaseClues(deletingCase.id).filter(c => c.type === 'clue').length} 条，推论 {getCaseClues(deletingCase.id).filter(c => c.type === 'deduction').length} 条。
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingCase(null)} className={dialogBtnGhostCls}>留下</button>
              <button onClick={() => {
                deleteCase(deletingCase.id);
                setDeletingCase(null);
                if (view === 'detail') backToShelf();
              }} className={dialogBtnRedCls}>焚毁</button>
            </div>
          </PaperDialog>
        )}
      </AnimatePresence>

      {/* ── 新建案件 ── */}
      <AnimatePresence>
        {showNewCaseForm && (
          <PaperDialog
            title="新 立 案 卷"
            onBackdropClick={() => setShowNewCaseForm(false)}
          >
            <input value={newCaseName} onChange={e => setNewCaseName(e.target.value)} placeholder="案件名称，如：城北井中鬼事"
              className={`${dialogInputCls} font-serif text-[16px] tracking-[0.15em] border-b-2 border-t-0 border-x-0 rounded-none px-1`}
              autoFocus onKeyDown={e => { if (e.key === 'Enter') handleCreateCase(); }} />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowNewCaseForm(false)} className={dialogBtnGhostCls}>作罢</button>
              <button onClick={handleCreateCase} className={dialogBtnDarkCls}>立案</button>
            </div>
          </PaperDialog>
        )}
      </AnimatePresence>

      {/* ── 手书线索 ── */}
      <AnimatePresence>
        {showManualClue && (
          <PaperDialog
            title="手 书 线 索"
            onBackdropClick={() => { setShowManualClue(false); setManualClueText(''); }}
          >
            <textarea value={manualClueText} onChange={e => setManualClueText(e.target.value)} placeholder="将你所见所闻，书于此处…" rows={4}
              className={dialogInputCls} autoFocus />
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowManualClue(false); setManualClueText(''); }} className={dialogBtnGhostCls}>作罢</button>
              <button onClick={handleManualClue} className={dialogBtnDarkCls}>记入</button>
            </div>
          </PaperDialog>
        )}
      </AnimatePresence>

      {/* ── 推演取舍（AI 选项） ── */}
      <AnimatePresence>
        {combiningOptions && (
          <PaperDialog
            title="推 演 取 舍"
            wide
            onClose={() => { setCombiningOptions(null); setEditingOptionIdx(null); setManualDeductionText(''); }}
            onBackdropClick={() => { setCombiningOptions(null); setEditingOptionIdx(null); setManualDeductionText(''); }}
          >
            <p className="font-sans text-[14px] text-[#4a3a22] mb-4 tracking-wide leading-relaxed font-medium">以下乃司天台推演所得，可直接采录、润色后采录，或自拟一条：</p>
            <div className="flex flex-col gap-3 mb-4">
              {combiningOptions.options.map((option, idx) => (
                <div key={idx} className="text-left p-4 bg-[#f0e8d3] border border-[#c9b68b] hover:border-[#8a7556] hover:shadow-md transition-all group rounded-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#c9b68b]/60" />
                  {editingOptionIdx === idx ? (
                    <div className="flex flex-col gap-2">
                      <textarea value={editingOptionValue} onChange={e => setEditingOptionValue(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-[#8a7556] text-[#241d12] text-[14px] font-sans outline-none resize-none" rows={2} autoFocus />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingOptionIdx(null)} className="text-[#6d5b3d] hover:text-[#3d3018] hover:bg-[#6d5b3d]/10 p-1.5 rounded-sm transition-all" title="取消"><X size={15} /></button>
                        <button onClick={confirmEditedOption} className="text-vermilion-700 hover:text-vermilion-600 hover:bg-vermilion-700/10 p-1.5 rounded-sm transition-all" title="确认"><Check size={15} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => selectDeductionOption(option.text, option.truth)} className="flex-1 text-left font-serif text-[15px] tracking-wide leading-relaxed text-[#241d12] hover:text-[#4a3a22] transition-colors">{option.text}</button>
                      <button onClick={() => { setEditingOptionIdx(idx); setEditingOptionValue(option.text); }}
                        className="text-[#6d5b3d] hover:text-vermilion-700 hover:bg-vermilion-700/10 transition-all opacity-70 group-hover:opacity-100 shrink-0 p-1.5 rounded-sm" title="润色后采录"><Edit2 size={15} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-[#c9b68b] pt-4">
              <p className="font-sans text-[13px] font-bold text-[#6d5b3d] mb-2 tracking-wide">或自行拟一道推论：</p>
              <div className="flex gap-2">
                <input value={manualDeductionText} onChange={e => setManualDeductionText(e.target.value)} placeholder="自拟推论…"
                  className="flex-1 bg-[#f0e8d3] border border-[#b9a67e] px-3 py-2 text-[#241d12] text-[14px] font-sans focus:border-[#6d5b3d] outline-none transition-colors placeholder:text-[#7a6949] rounded-sm"
                  onKeyDown={e => { if (e.key === 'Enter' && manualDeductionText.trim()) { selectDeductionOption(manualDeductionText); } }} />
                <button onClick={() => selectDeductionOption(manualDeductionText)} disabled={!manualDeductionText.trim()}
                  className="px-4 py-2 bg-vermilion-700/12 border border-vermilion-700/50 text-vermilion-800 font-sans text-[14px] font-bold tracking-widest hover:bg-vermilion-700/22 hover:border-vermilion-700 transition-all rounded-sm disabled:opacity-40 shadow-sm">采录</button>
              </div>
            </div>
          </PaperDialog>
        )}
      </AnimatePresence>

      {/* ── 亲笔推论 ── */}
      <AnimatePresence>
        {showManualDeduction && !combiningOptions && (
          <PaperDialog
            title="亲 笔 推 论"
            onBackdropClick={() => { setShowManualDeduction(false); setManualDeductionText(''); }}
          >
            {selectedClues.length > 0 && <p className="font-sans text-[13px] font-bold text-[#6d5b3d] mb-2 tracking-wide">已择 {selectedClues.length} 条源线索，推论将系于此。</p>}
            <textarea value={manualDeductionText} onChange={e => setManualDeductionText(e.target.value)} placeholder="将你的推演，书于此处…" rows={4}
              className={dialogInputCls} autoFocus />
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => { setShowManualDeduction(false); setManualDeductionText(''); }} className={dialogBtnGhostCls}>作罢</button>
              <button onClick={handleManualDeduction}
                className="px-5 py-2 text-[14px] font-sans font-bold tracking-[0.25em] pl-[calc(1.25rem+0.25em)] text-[#fff1e4] rounded-sm border border-vermilion-800 bg-vermilion-700 hover:bg-vermilion-800 transition-all shadow-md">记入</button>
            </div>
          </PaperDialog>
        )}
      </AnimatePresence>

      {/* ── 结案奏折 ── */}
      <AnimatePresence>
        {closingCaseId && (
          <PaperDialog
            title="结 案 奏 折"
            wide
            vermilion
            closeDisabled={isClosing}
            onClose={isClosing ? undefined : () => setClosingCaseId(null)}
            onBackdropClick={() => !isClosing && setClosingCaseId(null)}
          >
            {/* 案件名称 */}
            <div className="mb-4">
              <label className="font-sans text-[13px] text-[#5a4a2e] block mb-1.5 tracking-[0.2em] font-bold">案件名称</label>
              <input value={closeCaseName} onChange={e => setCloseCaseName(e.target.value)}
                className={`${dialogInputCls} font-serif tracking-[0.12em]`} />
            </div>
            {/* 关键词 */}
            <div className="mb-4">
              <label className="font-sans text-[13px] text-[#5a4a2e] block mb-1.5 tracking-[0.2em] font-bold">关键词<span className="ml-2 text-[12px] text-[#7a6949] tracking-normal font-medium">（结案后绿灯激活用）</span></label>
              <div className="flex gap-2 mb-2">
                <input value={closeKeywordInput} onChange={e => setCloseKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="输入关键词后回车" disabled={isClosing}
                  className="flex-1 bg-[#f0e8d3] border border-[#b9a67e] px-3 py-1.5 text-[#241d12] text-[14px] font-sans focus:border-vermilion-700 outline-none transition-colors placeholder:text-[#7a6949] rounded-sm" />
                <button onClick={addKeyword} disabled={isClosing || !closeKeywordInput.trim()}
                  className="px-3 py-1.5 bg-vermilion-700/12 border border-vermilion-700/50 text-vermilion-800 font-sans text-[14px] font-bold hover:bg-vermilion-700/22 hover:border-vermilion-700 transition-all rounded-sm disabled:opacity-40 shadow-sm">
                  <Plus size={15} />
                </button>
              </div>
              {closeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {closeKeywords.map((kw, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-vermilion-700/10 border border-vermilion-700/40 rounded-full text-vermilion-800 text-[13px] font-sans font-bold shadow-sm">
                      {kw}
                      {!isClosing && <button onClick={() => removeKeyword(kw)} className="hover:text-vermilion-600 hover:bg-vermilion-700/20 rounded-full p-0.5 transition-all"><X size={11} /></button>}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* 结案陈词 */}
            <div className="mb-4">
              <label className="font-sans text-[13px] text-[#5a4a2e] block mb-1.5 tracking-[0.2em] font-bold">结案陈词</label>
              <textarea value={closeStatement} onChange={e => setCloseStatement(e.target.value)}
                placeholder="以钦天监保章正的身份书写结案陈词…" rows={5} disabled={isClosing}
                className={dialogInputCls} />
            </div>
            {/* 推理记录只读展示 */}
            {currentCase && (
              <div className="mb-4">
                <label className="font-sans text-[13px] text-[#5a4a2e] block mb-1.5 tracking-[0.2em] font-bold">推理记录<span className="ml-2 text-[12px] text-[#7a6949] tracking-normal font-medium">（只读）</span></label>
                <div className="bg-[#f0e8d3] border border-[#b9a67e] p-3 max-h-40 overflow-y-auto custom-scrollbar rounded-sm">
                  {currentCaseClues.filter(c => c.type === 'deduction').length === 0 ? (
                    <p className="text-[#6d5b3d] text-[13px] font-sans font-medium">无推论记录</p>
                  ) : (
                    currentCaseClues.filter(c => c.type === 'deduction').map((d, i) => (
                      <div key={d.id} className="text-[13px] font-sans text-[#3a2f1c] mb-1 tracking-wide font-medium">
                        {i + 1}. {d.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {/* 按钮 */}
            <div className="flex justify-end gap-3">
              <button onClick={() => setClosingCaseId(null)} disabled={isClosing} className={dialogBtnGhostCls + ' disabled:opacity-40'}>作罢</button>
              <button onClick={handleConfirmCloseCase} disabled={isClosing}
                className={`${dialogBtnRedCls} flex items-center gap-1.5`}>
                {isClosing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {isClosing ? '结案中…' : '准奏'}
              </button>
            </div>
          </PaperDialog>
        )}
      </AnimatePresence>
    </Modal>
  );
};
