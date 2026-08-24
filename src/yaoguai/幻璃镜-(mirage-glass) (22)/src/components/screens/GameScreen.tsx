import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { SettingsModal } from '../modals/SettingsModal';
import { HistoryLogModal } from '../modals/HistoryLogModal';
import { ClueNotebookModal } from '../modals/ClueNotebookModal';
import { MapModal } from '../modals/MapModal';
import { CalendarModal } from '../modals/CalendarModal';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Radio, Play, Pause, Zap, FastForward, History, Users, Image as ImageIcon, Book } from 'lucide-react';
import { AtmosphereEffect } from '../ui/AtmosphereEffect';
import { TextSelectionClue } from '../ui/TextSelectionClue';
import { MusicPlayerWidget } from '../ui/MusicPlayerWidget';
import { ChatInputWidget } from '../ui/ChatInputWidget';
import { HUD } from '../ui/HUD';
import { cn } from '../../utils';
import { useIsMobile } from '../../hooks';
import { sfx } from '../../audio/sfxPlayer';
import { textSettings, useTextSettings, getTextDelay } from '../../audio/textSettings';
import { parseScriptContent, parseOptions, parseParallelEvents, ScriptLine, ParallelEvent } from '../../scriptParser';
import { getAssistantFloors } from '../../utils/floorNav';

// ── 场景角色信息（多角色同屏）──
interface SceneCharacter {
  speaker: string;
  emotion: string;
  sprite: string;
  position: 'left' | 'center' | 'right';
  isActive: boolean;
}

/** 将 <user> 替换为显示名 */
function displayName(name: string, playerName?: string): string {
  if (name === '<user>') return playerName || '我';
  return name;
}

/** 情绪对应的屏幕特效 */
const EMOTION_EFFECTS: Record<string, {
  shake?: boolean;
  flashColor?: string;
  vignette?: string;
}> = {
  '生气': { shake: true, vignette: 'rgba(214,61,46,0.08)' },
  '惊讶': { shake: true, flashColor: 'rgba(255,255,255,0.2)' },
  '害羞': { vignette: 'rgba(232,112,96,0.1)' },
  '害怕': { vignette: 'rgba(0,0,0,0.25)' },
  '伤心': { vignette: 'rgba(10,10,10,0.15)' },
  '开心': { vignette: 'rgba(212,183,90,0.08)' },
  '吃醋': { vignette: 'rgba(184,45,32,0.1)' },
};

/** 获取切换动画配置 */
function getTransitionConfig(emotion: string) {
  switch (emotion) {
    case '生气':
    case '惊讶':
      return {
        initial: { opacity: 0, scale: 1.08, x: 8 },
        animate: { opacity: 1, scale: 1, x: 0 },
        transition: { duration: 0.18, type: "spring", stiffness: 350 }
      };
    case '害羞':
    case '害怕':
      return {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: 0.35, ease: "easeOut" }
      };
    case '伤心':
      return {
        initial: { opacity: 0, y: 25 },
        animate: { opacity: 0.92, y: 0 },
        transition: { duration: 0.45 }
      };
    default:
      return {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28 }
      };
  }
}

/** 从角色名获取主题色 */
function getCharacterThemeColor(speaker?: string): 'cyan' | 'vermilion' | 'gold' {
  if (!speaker) return 'cyan';
  if (speaker === '狐小九') return 'vermilion';
  if (speaker === '陆离') return 'cyan';
  return 'cyan';
}

export const GameScreen: React.FC = () => {
  const {
    setCurrentScreen, addNotification, setGalleryTab,
    startGenerating, finishGenerating,
    viewingFloorId, setViewingFloor, lastAssistantFloorId,
    isGenerating, generatingFloorId,
    setPendingMessage, setScriptCharacterLocations,
    playerName,
    weatherParticlesEnabled,
  } = useGameContext();
  const isMobile = useIsMobile();
  const { textSpeed, autoWaitMultiplier } = useTextSettings();

  // ── 全屏状态 ──
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeModal, setActiveModal] = useState<'settings' | 'history' | 'clues' | 'map' | 'calendar' | 'thinking' | 'variables' | 'delete' | 'manual' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── 剧本播放状态 ──
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [sceneCharacters, setSceneCharacters] = useState<SceneCharacter[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [optionsDismissed, setOptionsDismissed] = useState(false);
  const [parallelEvents, setParallelEvents] = useState<ParallelEvent[]>([]);
  const [showParallelEvents, setShowParallelEvents] = useState(true);
  const [isTextBoxCollapsed, setIsTextBoxCollapsed] = useState(false);

  const skipTypingRef = useRef(false);
  const prevLocationKeyRef = useRef<string | null>(null);
  const touchStartRef = useRef<number | null>(null);

  // ── 全屏：操作父页面 DOM ──
  const toggleFullscreen = async () => {
    const parent$ = window.parent.$;
    if (!parent$) {
      console.warn('[幻璃镜] 无法访问父页面 jQuery');
      return;
    }
    const iframe = window.frameElement as HTMLIFrameElement | null;
    const $mes = iframe ? parent$(iframe).closest('.mes') : parent$('#chat .mes').last();
    if (!isFullscreen) {
      let hideStyle = parent$('#tavern-mirage-fs-hide');
      if (hideStyle.length === 0) {
        hideStyle = parent$('<style id="tavern-mirage-fs-hide"></style>').appendTo('head');
      }
      const floorId = $mes.attr('mesid');
      hideStyle.text(floorId
        ? `#chat .mes:not([mesid="${floorId}"]) { display: none !important; }`
        : `#chat .mes { display: none !important; }`);
      $mes.css({ position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', 'z-index': '99999', 'max-width': 'none', 'max-height': 'none' });
      if (iframe) parent$(iframe).css({ width: '100%', height: '100%' });
      setIsFullscreen(true);
      console.info('[幻璃镜] 已进入全屏模式');
      try { await document.documentElement.requestFullscreen(); } catch (e) { console.warn('[幻璃镜] 浏览器原生全屏失败，使用伪全屏', e); }
    } else {
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { console.warn('[幻璃镜] 退出浏览器全屏失败', e); }
      $mes.css({ position: '', top: '', left: '', width: '', height: '', 'z-index': '', 'max-width': '', 'max-height': '' });
      if (iframe) parent$(iframe).css({ width: '', height: '' });
      parent$('#tavern-mirage-fs-hide').remove();
      setIsFullscreen(false);
      console.info('[幻璃镜] 已退出全屏模式');
    }
  };

  useEffect(() => {
    const onFsChange = async () => {
      if (!document.fullscreenElement && isFullscreen) {
        const parent$ = window.parent.$;
        if (!parent$) return;
        const iframe = window.frameElement as HTMLIFrameElement | null;
        const $mes = iframe ? parent$(iframe).closest('.mes') : parent$('#chat .mes').last();
        $mes.css({ position: '', top: '', left: '', width: '', height: '', 'z-index': '', 'max-width': '', 'max-height': '' });
        if (iframe) parent$(iframe).css({ width: '', height: '' });
        parent$('#tavern-mirage-fs-hide').remove();
        setIsFullscreen(false);
        console.info('[幻璃镜] 浏览器全屏退出，已同步退出伪全屏');
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreen]);

  useEffect(() => {
    return () => {
      const parent$ = window.parent.$;
      if (!parent$) return;
      const iframe = window.frameElement as HTMLIFrameElement | null;
      const $mes = iframe ? parent$(iframe).closest('.mes') : parent$('#chat .mes').last();
      $mes.css({ position: '', top: '', left: '', width: '', height: '', 'z-index': '', 'max-width': '', 'max-height': '' });
      if (iframe) parent$(iframe).css({ width: '', height: '' });
      parent$('#tavern-mirage-fs-hide').remove();
    };
  }, []);

  // ── 读取酒馆楼层消息 ──
  const targetFloorId = viewingFloorId ?? lastAssistantFloorId;

  const [floors, setFloors] = useState<number[]>([]);
  useEffect(() => { setFloors(getAssistantFloors()); }, [lastAssistantFloorId, isGenerating, generatingFloorId]);

  const availableFloors = useMemo(() => {
    if (isGenerating && generatingFloorId != null) return floors.filter(f => f < generatingFloorId);
    return floors;
  }, [floors, isGenerating, generatingFloorId]);

  const navFloor = viewingFloorId ?? (isGenerating ? lastAssistantFloorId : (generatingFloorId ?? lastAssistantFloorId));
  const navIndex = navFloor != null ? availableFloors.indexOf(navFloor) : -1;
  const canPrevFloor = navIndex > 0;
  const canNextFloor = navIndex >= 0 && navIndex < availableFloors.length - 1;

  const showOptions = options.length > 0 && !optionsDismissed && currentIndex >= script.length - 1 && !isTyping;

  const optionChibis = useMemo(() => {
    if (options.length === 0) return [];
    return options.map(() => 'https://i.postimg.cc/DycdNL5D/xiao-ren.png');
  }, [options]);

  const sceneLocation = useMemo(() => {
    const line = script[currentIndex];
    if (line?.location) return { parent: line.location.parent, spot: line.location.spot };
    return { parent: '未知', spot: undefined };
  }, [script, currentIndex]);

  // ── 楼层切换时解析剧本 ──
  useEffect(() => {
    if (targetFloorId == null) {
      setScript([]);
      setOptions([]);
      setParallelEvents([]);
      setCurrentIndex(0);
      setSceneCharacters([]);
      prevLocationKeyRef.current = null;
      return;
    }
    try {
      const msg = getChatMessages(targetFloorId)[0];
      if (msg) {
        const parsed = parseScriptContent(msg.message, playerName);
        const parsedOptions = parseOptions(msg.message);
        const parsedParallelEvents = parseParallelEvents(msg.message);
        setScript(parsed);
        setOptions(parsedOptions);
        setOptionsDismissed(false);
        setParallelEvents(parsedParallelEvents);
        setShowParallelEvents(true);
        setCurrentIndex(0);
        setSceneCharacters([]);
        prevLocationKeyRef.current = null;
        parsed.forEach(line => { if (line.sprite) { const img = new Image(); img.src = line.sprite; } });
      } else {
        setScript([]);
        setOptions([]);
        setParallelEvents([]);
        setCurrentIndex(0);
        setSceneCharacters([]);
        prevLocationKeyRef.current = null;
      }
    } catch {
      console.warn('StoryView: 无法读取楼层', targetFloorId, '的消息文本');
      setScript([]);
      setOptions([]);
      setParallelEvents([]);
      setCurrentIndex(0);
      setSceneCharacters([]);
      prevLocationKeyRef.current = null;
    }
  }, [targetFloorId, playerName]);

  const currentLine = script[currentIndex];

  // ── 从剧本中提取角色位置 ──
  useEffect(() => {
    if (script.length === 0) return;
    const charLocs: Record<string, string> = {};
    const endIdx = Math.min(currentIndex, script.length - 1);
    for (let i = 0; i <= endIdx; i++) {
      const line = script[i];
      if (!line.speaker || line.speaker === '<user>' || line.speaker === '我') continue;
      if (line.location) {
        const loc = line.location.spot ? `${line.location.parent}/${line.location.spot}` : line.location.parent;
        if (loc) charLocs[line.speaker] = loc;
      }
    }
    if (Object.keys(charLocs).length > 0) setScriptCharacterLocations(charLocs);
  }, [script, currentIndex, setScriptCharacterLocations]);

  // ── 更新场景角色（多角色同屏） ──
  useEffect(() => {
    const loc = currentLine?.location;
    const currentLocationKey = loc ? `${loc.parent}/${loc.spot || ''}` : null;
    const locationChanged = currentLocationKey !== prevLocationKeyRef.current;
    prevLocationKeyRef.current = currentLocationKey;

    if (!currentLine?.speaker || currentLine.type === 'narrator') {
      if (locationChanged) setSceneCharacters([]);
      else setSceneCharacters(prev => prev.map(c => ({ ...c, isActive: false })));
      return;
    }
    const emotion = currentLine.emotion || '默认';
    const sprite = currentLine.sprite || '';
    if (locationChanged) {
      setSceneCharacters([{ speaker: currentLine.speaker!, emotion, sprite, position: 'center', isActive: true }]);
      return;
    }
    setSceneCharacters(prev => {
      const existingIndex = prev.findIndex(c => c.speaker === currentLine.speaker);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], emotion, sprite: sprite || updated[existingIndex].sprite, isActive: true };
        return updated.map((c, i) => ({ ...c, isActive: i === existingIndex }));
      } else {
        const newChar: SceneCharacter = { speaker: currentLine.speaker!, emotion, sprite, position: prev.length === 0 ? 'center' : prev.length === 1 ? 'right' : 'left', isActive: true };
        const next = [...prev.filter(c => c.position !== newChar.position), newChar];
        const sliced = next.slice(-3);
        return sliced.map((c, i) => ({ ...c, isActive: i === sliced.length - 1 }));
      }
    });
  }, [currentLine]);

  // ── 情绪音效 ──
  useEffect(() => {
    if (!currentLine || currentLine.type === 'narrator') return;
    if (currentLine.emotion && currentLine.emotion !== '默认') sfx.playEmotion(currentLine.emotion);
  }, [currentLine]);

  // ── 打字机效果 ──
  useEffect(() => {
    let rafId: number;
    let cancelled = false;
    skipTypingRef.current = false;
    if (currentLine && currentIndex < script.length) {
      if (textSpeed === 0 || isSkipping) { setDisplayedText(currentLine.text); setIsTyping(false); return; }
      setIsTyping(true); setDisplayedText("");
      const fullText = currentLine.text;
      let i = 0;
      const delay = getTextDelay(textSpeed);
      let lastTime = performance.now();
      const typeChar = (timestamp: number) => {
        if (cancelled || skipTypingRef.current) { if (!cancelled) { setDisplayedText(fullText); setIsTyping(false); } return; }
        const elapsed = timestamp - lastTime;
        if (elapsed < delay) { rafId = requestAnimationFrame(typeChar); return; }
        lastTime = timestamp;
        if (i < fullText.length) {
          const batchSize = textSpeed >= 3 ? 3 : 1;
          const endIndex = Math.min(i + batchSize, fullText.length);
          setDisplayedText(fullText.substring(0, endIndex));
          if (currentLine.type !== 'narrator') sfx.playBlip(currentLine.speaker);
          i = endIndex;
          rafId = requestAnimationFrame(typeChar);
        } else { setIsTyping(false); }
      };
      rafId = requestAnimationFrame(typeChar);
    }
    return () => { cancelled = true; if (rafId) cancelAnimationFrame(rafId); };
  }, [currentIndex, currentLine, script.length, textSpeed, isSkipping]);

  // Auto 模式
  useEffect(() => {
    if (isAutoMode && !isTyping && currentIndex < script.length - 1) {
      const baseWait = Math.min(3000, Math.max(1000, (currentLine?.text.length || 0) * 100));
      const timer = setTimeout(() => setCurrentIndex(prev => prev + 1), baseWait * autoWaitMultiplier);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAutoMode, isTyping, currentIndex, script.length, currentLine, autoWaitMultiplier]);

  // Skip 模式
  useEffect(() => {
    if (isSkipping && !isTyping && !showOptions && !showBacklog && !isTextBoxCollapsed) {
      const timer = setTimeout(() => {
        if (currentIndex < script.length - 1) setCurrentIndex(prev => prev + 1);
        else if (canNextFloor && navIndex >= 0) {
          sfx.play('pageTurn');
          if (navIndex + 1 === availableFloors.length - 1) setViewingFloor(null);
          else setViewingFloor(availableFloors[navIndex + 1]);
        } else setIsSkipping(false);
      }, 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isSkipping, isTyping, showOptions, showBacklog, isTextBoxCollapsed, currentIndex, script.length, canNextFloor, navIndex, availableFloors, setViewingFloor]);

  const handleNext = useCallback(() => {
    if (!currentLine) return;
    if (isTyping) { skipTypingRef.current = true; setDisplayedText(currentLine.text); setIsTyping(false); }
    else {
      sfx.play('click');
      if (currentIndex < script.length - 1) setCurrentIndex(prev => prev + 1);
      else if (canNextFloor && navIndex >= 0) {
        sfx.play('pageTurn');
        if (navIndex + 1 === availableFloors.length - 1) setViewingFloor(null);
        else setViewingFloor(availableFloors[navIndex + 1]);
      }
    }
  }, [currentLine, isTyping, currentIndex, script.length, canNextFloor, navIndex, availableFloors, setViewingFloor]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) { sfx.play('click'); setCurrentIndex(prev => prev - 1); }
    else if (canPrevFloor && navIndex > 0) { sfx.play('pageTurn'); setViewingFloor(availableFloors[navIndex - 1]); }
  }, [currentIndex, canPrevFloor, navIndex, availableFloors, setViewingFloor]);

  // ── 键盘映射 ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (showOptions || showBacklog || isTextBoxCollapsed || activeModal) return;
      if (e.key === 'Control') {
        if (!isSkipping) { e.preventDefault(); setIsSkipping(true); if (isTyping && currentLine) { skipTypingRef.current = true; setDisplayedText(currentLine.text); setIsTyping(false); } }
        return;
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        if (e.repeat) return; e.preventDefault(); setIsSkipping(false); handleNext(); return;
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        if (e.repeat) return; e.preventDefault(); setIsSkipping(false); handlePrev(); return;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Control') setIsSkipping(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [showOptions, showBacklog, isTextBoxCollapsed, activeModal, isSkipping, isTyping, currentLine, currentIndex, script.length, handleNext, handlePrev]);

  // ── 鼠标滚轮翻页 ──
  const wheelLockRef = useRef(false);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.overflow-y-auto') || target.closest('.overflow-auto')) return;
      if (showOptions || showBacklog || isTextBoxCollapsed || activeModal) return;
      if (!isFullscreen) return;
      e.preventDefault();
      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      setTimeout(() => { wheelLockRef.current = false; }, 200);
      setIsSkipping(false);
      if (e.deltaY > 0) handleNext(); else if (e.deltaY < 0) handlePrev();
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [showOptions, showBacklog, isTextBoxCollapsed, activeModal, isFullscreen, handleNext, handlePrev]);

  const handlePrevFloor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canPrevFloor && navIndex > 0) { sfx.play('pageTurn'); setViewingFloor(availableFloors[navIndex - 1]); }
  }, [canPrevFloor, navIndex, availableFloors, setViewingFloor]);

  const handleNextFloor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canNextFloor && navIndex >= 0) {
      sfx.play('pageTurn');
      if (navIndex + 1 === availableFloors.length - 1) setViewingFloor(null);
      else setViewingFloor(availableFloors[navIndex + 1]);
    }
  }, [canNextFloor, navIndex, availableFloors, setViewingFloor]);

  const handleSelectOption = useCallback((option: string) => {
    sfx.play('confirm'); setPendingMessage(option); setOptionsDismissed(true);
  }, [setPendingMessage]);

  const handleRegenerate = async () => {
    setRegenerating(true); startGenerating();
    console.info('[幻璃镜] 开始重新生成...');
    addNotification('重新生成功能待接入', 'info');
    await new Promise(r => setTimeout(r, 800));
    setRegenerating(false); finishGenerating();
  };

  const currentEmotion = currentLine?.emotion || '默认';
  const screenEffect = EMOTION_EFFECTS[currentEmotion];
  const displayLocationName = useMemo(() => {
    if (currentLine?.location) {
      const { parent, spot } = currentLine.location;
      return spot ? `${parent} · ${spot}` : parent;
    }
    return '幻璃镜';
  }, [currentLine]);

  // 空状态
  if (!currentLine && script.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="relative w-full h-screen bg-ink-900 overflow-hidden flex flex-col" id="screen-game">
        <HUD isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
          onOpenThinking={() => setActiveModal('thinking')} onOpenVariables={() => setActiveModal('variables')}
          onOpenReading={() => setActiveModal('history')} onOpenDelete={() => setActiveModal('delete')}
          onOpenSettings={() => setActiveModal('settings')} onOpenManual={() => setActiveModal('manual')}
          onOpenMap={() => setActiveModal('map')} onOpenCalendar={() => setActiveModal('calendar')}
          onRegenerate={handleRegenerate} regenerating={regenerating} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-paper-200/50 text-xl font-serif tracking-widest">等待剧情内容...</p>
        </div>
        <SettingsModal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} />
        <HistoryLogModal isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} />
        <ClueNotebookModal isOpen={activeModal === 'clues'} onClose={() => setActiveModal(null)} />
        <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} />
        <CalendarModal isOpen={activeModal === 'calendar'} onClose={() => setActiveModal(null)} />
        <ChatInputWidget /><MusicPlayerWidget />
      </motion.div>
    );
  }

  const isCyan = getCharacterThemeColor(currentLine?.speaker) === 'cyan';
  const themeTextClass = isCyan ? 'text-cyan-300' : 'text-vermilion-300';
  const themeBorderClass = isCyan ? 'border-cyan-500/50' : 'border-vermilion-500/50';
  const themeBgClass = isCyan ? 'bg-cyan-900/40' : 'bg-vermilion-900/40';

  // ════════════════════════════════════════════════════════════════
  // ── 手机端布局：GBF 式上下分区（视觉区60% + 操作区40%）──
  // ════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col w-full h-full overflow-hidden bg-ink-900"
        id="screen-game-mobile"
      >
        {/* ════ HUD ════ */}
        <HUD isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
          onOpenThinking={() => setActiveModal('thinking')} onOpenVariables={() => setActiveModal('variables')}
          onOpenReading={() => setActiveModal('history')} onOpenDelete={() => setActiveModal('delete')}
          onOpenSettings={() => setActiveModal('settings')} onOpenManual={() => setActiveModal('manual')}
          onOpenMap={() => setActiveModal('map')} onOpenCalendar={() => setActiveModal('calendar')}
          onRegenerate={handleRegenerate} regenerating={regenerating} />

        {/* ════ 上半视觉区 (60%) ════ */}
        <div
          className="relative h-[60%] overflow-hidden shrink-0"
          onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartRef.current == null) return;
            const deltaX = e.changedTouches[0].clientX - touchStartRef.current;
            const threshold = 50;
            touchStartRef.current = null;
            if (showOptions || showBacklog || isTextBoxCollapsed || activeModal) return;
            if (deltaX < -threshold) {
              // 左滑 = 前进
              if (isTyping && currentLine) {
                skipTypingRef.current = true;
                setDisplayedText(currentLine.text);
                setIsTyping(false);
              } else {
                handleNext();
              }
            } else if (deltaX > threshold) {
              // 右滑 = 后退
              handlePrev();
            }
          }}
        >
          {/* 背景层 */}
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-ink-900 flex items-center justify-center">
              <div className="text-paper-200/20 text-2xl font-serif tracking-[0.3em]">{displayLocationName}</div>
            </div>
          </div>

          {/* 底部渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent z-10 pointer-events-none" />

          {/* 大气粒子 */}
          {weatherParticlesEnabled && <AtmosphereEffect />}

          {/* 立绘层 — 限制在上半区内 */}
          <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
            <AnimatePresence mode="popLayout">
              {sceneCharacters.map((char) => (
                <motion.div
                  key={char.speaker}
                  className={cn(
                    "absolute bottom-0 w-full h-full flex items-end justify-center transition-all duration-300 pointer-events-none",
                    sceneCharacters.length >= 2 && char.position === 'center' && "justify-start pl-[3%]",
                    sceneCharacters.length < 2 && char.position === 'center' && "justify-center",
                    char.position === 'left' && "justify-start pl-[3%]",
                    char.position === 'right' && "justify-end pr-[3%]",
                  )}
                  style={{
                    filter: char.isActive ? 'none' : 'brightness(0.55) grayscale(0.35)',
                    zIndex: char.isActive ? 16 : 15,
                    transform: char.isActive ? 'scale(1)' : 'scale(0.96)',
                    transition: 'filter 0.3s ease, transform 0.3s ease',
                  }}
                  {...getTransitionConfig(char.emotion)}
                >
                  {char.sprite && (
                    <img src={char.sprite} alt={`${char.speaker}-${char.emotion}`}
                      className={cn(
                        "max-h-[80%] object-contain object-bottom",
                        sceneCharacters.length <= 1 ? "max-w-full" : sceneCharacters.length === 2 ? "max-w-[45%]" : "max-w-[31%]",
                      )}
                      style={{
                        maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                        filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                      }}
                      loading="eager" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 情绪特效 */}
          <div className="absolute inset-0 z-18 pointer-events-none">
            {screenEffect?.shake && (
              <motion.div animate={{ x: [0, -4, 4, -4, 4, 0] }} transition={{ duration: 0.25 }} className="w-full h-full" />
            )}
            {screenEffect?.vignette && (
              <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 200px ${screenEffect.vignette}` }} />
            )}
            {screenEffect?.flashColor && (
              <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="absolute inset-0" style={{ backgroundColor: screenEffect.flashColor }} />
            )}
          </div>

          {/* 平行事件面板 — 手机端紧凑版 */}
          <AnimatePresence mode="wait">
            {parallelEvents.length > 0 && showParallelEvents && (
              <motion.div key="pe-m-expanded" initial={{ x: -200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.3 }} className="absolute top-2 left-2 z-30 max-w-60 pointer-events-auto">
                <div className="bg-ink-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between bg-cyan-900/60 px-2 py-1 border-b border-ink-700">
                    <div className="flex items-center gap-1">
                      <Radio className="w-3 h-3 text-cyan-400" />
                      <span className="font-serif text-xs text-cyan-300 tracking-widest">平行事件</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowParallelEvents(false); }}
                      className="text-paper-200 hover:text-vermilion-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {parallelEvents.map((evt, i) => (
                      <div key={i} className="border-l-2 border-vermilion-500 pl-1.5">
                        <div className="text-gold-300 text-xs font-serif leading-tight mb-0.5">{evt.location}</div>
                        <div className="text-paper-200/80 text-xs leading-snug">{evt.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {parallelEvents.length > 0 && !showParallelEvents && (
              <motion.button key="pe-m-collapsed" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); setShowParallelEvents(true); }}
                className="absolute top-2 left-2 z-30 bg-ink-900/90 border border-cyan-900/50 p-1 rounded-lg hover:scale-110 active:scale-90 transition-transform pointer-events-auto"
                title="展开平行事件">
                <Radio className="w-3 h-3 text-cyan-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* 视觉区底部渐变 */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-ink-900 to-transparent z-19 pointer-events-none" />
        </div>

        {/* ════ 下半操作区 ════ */}
        <div className="flex-1 bg-ink-900 flex flex-col relative overflow-hidden min-h-0">
          {/* 文字区 — 点击翻页 */}
          <div
            className="flex-1 flex flex-col px-3 pt-2 pb-1 cursor-pointer min-h-0"
            onClick={() => handleNext()}
          >
            {/* 名字标签 */}
            <AnimatePresence mode="wait">
              {currentLine.type !== 'narrator' && (
                <motion.div key={currentLine.speaker} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                  className="flex items-center gap-2 mb-1 shrink-0">
                  {currentLine.avatar && (
                    <div className={`w-9 h-9 bg-white border-4 flex items-center justify-center overflow-hidden relative transform -skew-x-6 ${isCyan ? 'border-cyan-500' : 'border-vermilion-500'}`}>
                      <img src={currentLine.avatar} alt="avatar" className="w-full h-full object-cover object-top scale-110" />
                    </div>
                  )}
                  <div className={`px-3 py-0.5 border-4 ${themeBorderClass} ${themeBgClass} text-lg font-serif italic -skew-x-6 ${themeTextClass} shadow-[2px_2px_0_rgba(0,0,0,0.5)]`}>
                    {displayName(currentLine.speaker!, playerName)}
                    {currentLine.emotion && currentLine.emotion !== '默认' && (
                      <span className="ml-1 text-xs font-sans opacity-70">[{currentLine.emotion}]</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 文字内容 — 可滚动 */}
            <div className={`flex-1 overflow-y-auto hide-scrollbar text-lg font-sans tracking-wide leading-relaxed min-h-0 ${currentLine.type === 'thought' ? 'text-cyan-400' : 'text-paper-100'}`}>
              {displayedText}
              {isTyping && <span className={`inline-block w-2 h-4 animate-pulse ml-1 align-middle ${currentLine.type === 'thought' ? 'bg-cyan-400' : 'bg-paper-100'}`} />}
            </div>
          </div>

          {/* 按钮组 — 横向可滚动 */}
          <div className="flex items-center gap-1 px-2 pb-2 pt-1 shrink-0 overflow-x-auto hide-scrollbar">
            <button onClick={(e) => { e.stopPropagation(); setShowBacklog(true); }}
              className="flex items-center gap-1 px-2 py-1 bg-ink-800/60 border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded text-xs shrink-0">
              <History className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0}
              className="flex items-center gap-1 px-2 py-1 bg-ink-800/60 border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded text-xs disabled:opacity-30 shrink-0">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsAutoMode(prev => !prev); }}
              className={`flex items-center gap-1 px-2 py-1 border transition-colors rounded text-xs shrink-0 ${isAutoMode ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300' : 'bg-ink-800/60 border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50'}`}
              title={isAutoMode ? '关闭 Auto' : '开启 Auto'}>
              {isAutoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); const next = textSpeed >= 3 ? 1 : textSpeed + 1; textSettings.setTextSpeed(next); }}
              className="flex items-center gap-1 px-2 py-1 bg-ink-800/60 border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded text-xs shrink-0"
              title={`速度: ${textSpeed === 0 ? '瞬间' : textSpeed === 1 ? '慢' : textSpeed === 2 ? '普通' : '快'}`}>
              {textSpeed >= 3 ? <Zap className="w-3.5 h-3.5 text-gold-400" /> : <FastForward className="w-3.5 h-3.5" />}
            </button>

            {/* 楼层翻页 — 靠右 */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button onClick={(e) => { e.stopPropagation(); if (canPrevFloor && navIndex > 0) { sfx.play('pageTurn'); setViewingFloor(availableFloors[navIndex - 1]); } }} disabled={!canPrevFloor}
                className={`flex items-center gap-1 px-2 py-1 border transition-colors rounded text-xs shrink-0 ${canPrevFloor ? 'bg-ink-800/60 border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50' : 'bg-ink-800/30 border-ink-700/30 text-ink-500 cursor-not-allowed'}`}
                title="上一楼层">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (canNextFloor && navIndex >= 0) { sfx.play('pageTurn'); if (navIndex + 1 === availableFloors.length - 1) setViewingFloor(null); else setViewingFloor(availableFloors[navIndex + 1]); } }} disabled={!canNextFloor}
                className={`flex items-center gap-1 px-2 py-1 border transition-colors rounded text-xs shrink-0 ${canNextFloor ? 'bg-ink-800/60 border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50' : 'bg-ink-800/30 border-ink-700/30 text-ink-500 cursor-not-allowed'}`}
                title="下一楼层">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {!isTyping && (
                <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="shrink-0">
                  <ChevronRight className="w-5 h-5 text-gold-400" />
                </motion.div>
              )}
            </div>
          </div>

          {/* ════ 对话输入栏 — 内嵌在 flex 流中，不遮挡内容 ════ */}
          <ChatInputWidget />
        </div>

        {/* 选项面板 — 全屏覆盖 */}
        <AnimatePresence>
          {showOptions && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="absolute inset-0 z-35 bg-ink-900/85 backdrop-blur-md flex items-center justify-center p-4">
              <button onClick={() => setOptionsDismissed(true)}
                className="absolute top-4 right-4 z-40 p-2 bg-gold-500 text-ink-900 hover:scale-110 transition-transform rounded font-serif"
                title="关闭选项">
                <X className="w-5 h-5" />
              </button>
              <motion.div initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }} transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
                className="w-full max-w-2xl flex flex-col gap-2 relative z-10">
                {options.map((option, i) => {
                  const colorScheme = i % 2 === 0
                    ? "bg-cyan-900/60 border-cyan-500/50 text-cyan-300"
                    : "bg-vermilion-900/60 border-vermilion-500/50 text-vermilion-300";
                  return (
                    <motion.button key={i} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, type: "spring", damping: 18 }}
                      onClick={() => handleSelectOption(option)}
                      className={cn(
                        "flex items-center gap-3 p-3 border-2 font-serif text-left rounded",
                        "hover:scale-[1.03] active:scale-95 transition-all duration-150 group relative overflow-hidden",
                        colorScheme
                      )}>
                      {optionChibis[i] && (
                        <div className="relative z-10 shrink-0 w-12 h-12 flex items-center justify-center">
                          <img src={optionChibis[i]} alt="chibi"
                            className="w-full h-full object-contain group-hover:scale-125 group-hover:-rotate-6 transition-transform drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                            loading="eager" />
                        </div>
                      )}
                      <span className="relative z-10 flex-1 text-sm leading-snug">{option}</span>
                      <ChevronRight className="relative z-10 w-5 h-5 shrink-0 group-hover:translate-x-2 transition-transform" />
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 历史记录侧边栏 — 全屏覆盖 */}
        <AnimatePresence>
          {showBacklog && (
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-full bg-ink-900/95 backdrop-blur-md z-50 flex flex-col border-r-2 border-cyan-900/50">
              <div className="p-4 bg-cyan-900/40 text-cyan-300 font-serif text-lg flex justify-between items-center border-b border-ink-700">
                <span className="tracking-widest">回忆记录</span>
                <button onClick={() => setShowBacklog(false)}
                  className="text-2xl hover:scale-110 active:scale-90 transition-transform text-paper-200 hover:text-vermilion-400">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {script.slice(0, currentIndex).map((log, idx) => (
                  <div key={idx} className="space-y-1 border-b border-ink-700/50 pb-3 relative">
                    {log.type === 'narrator' ? (
                      <div className="text-paper-200/70 text-sm bg-ink-800/50 p-2 rounded border border-ink-700/50 font-serif italic">{log.text}</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {log.avatar && <img src={log.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover object-top border border-ink-700" />}
                          <div className={`font-serif text-xs px-2 py-0.5 -skew-x-6 ${getCharacterThemeColor(log.speaker) === 'cyan' ? 'bg-cyan-900/60 text-cyan-300' : 'bg-vermilion-900/60 text-vermilion-300'}`}>
                            {displayName(log.speaker!, playerName)}
                            {log.emotion && log.emotion !== '默认' && <span className="ml-1 opacity-70">[{log.emotion}]</span>}
                          </div>
                        </div>
                        <div className={`text-sm font-serif pl-9 ${log.type === 'thought' ? 'text-cyan-400/80 italic' : 'text-paper-200'}`}>{log.text}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 模态框 */}
        <SettingsModal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} />
        <HistoryLogModal isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} />
        <ClueNotebookModal isOpen={activeModal === 'clues'} onClose={() => setActiveModal(null)} />
        <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} />
        <CalendarModal isOpen={activeModal === 'calendar'} onClose={() => setActiveModal(null)} />

        {/* 待接入模态框占位 */}
        {activeModal === 'thinking' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
            <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
            <div className="relative bg-ink-800 border border-cyan-900/50 rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="font-serif text-lg text-cyan-400 tracking-widest mb-3">思维链</h2>
              <p className="text-paper-200 text-sm">思维链查看功能待接入。</p>
              <button onClick={() => setActiveModal(null)} className="mt-3 text-ink-500 hover:text-cyan-400 text-sm">关闭</button>
            </div>
          </div>
        )}
        {activeModal === 'variables' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
            <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
            <div className="relative bg-ink-800 border border-gold-900/50 rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="font-serif text-lg text-gold-400 tracking-widest mb-3">变量查看</h2>
              <p className="text-paper-200 text-sm">变量查看器待接入。</p>
              <button onClick={() => setActiveModal(null)} className="mt-3 text-ink-500 hover:text-gold-400 text-sm">关闭</button>
            </div>
          </div>
        )}
        {activeModal === 'delete' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
            <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
            <div className="relative bg-ink-800 border border-vermilion-900/50 rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="font-serif text-lg text-vermilion-400 tracking-widest mb-3">删除楼层</h2>
              <p className="text-paper-200 text-sm">删除楼层功能待接入。</p>
              <button onClick={() => setActiveModal(null)} className="mt-3 text-ink-500 hover:text-vermilion-400 text-sm">关闭</button>
            </div>
          </div>
        )}
        {activeModal === 'manual' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
            <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
            <div className="relative bg-ink-800 border border-gold-900/50 rounded-xl p-6 max-w-sm max-h-[80vh] overflow-y-auto custom-scrollbar mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="font-serif text-xl text-gold-400 tracking-widest mb-4">说明书</h2>
              <div className="space-y-3 text-paper-200 text-sm leading-relaxed">
                <section>
                  <h3 className="font-serif text-cyan-400 tracking-widest mb-1">基本操作</h3>
                  <p>点击下半区域或左滑推进剧情。右滑回看上一句。</p>
                </section>
                <section>
                  <h3 className="font-serif text-cyan-400 tracking-widest mb-1">文本框</h3>
                  <p>点击文字区域推进剧本。底部按钮提供历史、上一句、Auto、速度、楼层翻页功能。</p>
                </section>
                <section>
                  <h3 className="font-serif text-gold-400 tracking-widest mb-1">工具栏</h3>
                  <p>顶部工具栏提供全屏、楼层导航、地图、时辰、剧情回顾、思维链、变量、删除、重生成、设置等功能。</p>
                </section>
              </div>
              <button onClick={() => setActiveModal(null)} className="mt-4 px-4 py-2 bg-cyan-900/40 border border-cyan-900/50 text-cyan-300 rounded font-serif tracking-widest hover:bg-cyan-800/40 transition-colors">关闭</button>
            </div>
          </div>
        )}

        <TextSelectionClue />
        <MusicPlayerWidget />
      </motion.div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // ── 桌面端布局 ──
  // ════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-full h-screen bg-ink-900 overflow-hidden" id="screen-game"
    >
      {/* ════ 背景层 ════ */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-ink-900 flex items-center justify-center">
          <div className="text-paper-200/20 text-3xl font-serif tracking-[0.3em]">{displayLocationName}</div>
        </div>
      </div>

      {/* 底部渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent z-10 pointer-events-none" />

      {/* 大气粒子 */}
      {weatherParticlesEnabled && <AtmosphereEffect />}

      {/* ════ HUD ════ */}
      <HUD isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
        onOpenThinking={() => setActiveModal('thinking')} onOpenVariables={() => setActiveModal('variables')}
        onOpenReading={() => setActiveModal('history')} onOpenDelete={() => setActiveModal('delete')}
        onOpenSettings={() => setActiveModal('settings')} onOpenManual={() => setActiveModal('manual')}
        onOpenMap={() => setActiveModal('map')} onOpenCalendar={() => setActiveModal('calendar')}
        onRegenerate={handleRegenerate} regenerating={regenerating} />

      {/* ════ 左侧栏 ════ */}
      <div className="absolute left-0 top-[40%] z-40 pointer-events-auto">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-ink-900/60 backdrop-blur-md border border-l-0 border-ink-700/50 p-3 rounded-r-md text-paper-200 hover:text-cyan-400 transition-colors shadow-lg">
          {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0, x: '-100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 bottom-0 w-64 bg-ink-900/90 backdrop-blur-xl border-r border-ink-700/50 z-30 flex flex-col py-16 pointer-events-auto">
            <h3 className="font-serif text-2xl text-center text-paper-200 tracking-widest mb-12">浮世万象</h3>
            <button onClick={() => { setGalleryTab('characters'); setCurrentScreen('gallery'); }}
              className="flex flex-col items-center gap-4 py-8 px-4 hover:bg-ink-800/50 transition-colors border-y border-transparent hover:border-ink-700/50 group">
              <div className="w-16 h-16 rounded-full border border-ink-700/50 flex items-center justify-center group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
                <Users size={24} />
              </div>
              <span className="font-sans text-sm tracking-widest text-paper-200 group-hover:text-cyan-400">角色图鉴</span>
            </button>
            <button onClick={() => { setGalleryTab('character_cg'); setCurrentScreen('gallery'); }}
              className="flex flex-col items-center gap-4 py-8 px-4 hover:bg-ink-800/50 transition-colors border-b border-transparent hover:border-ink-700/50 group">
              <div className="w-16 h-16 rounded-full border border-ink-700/50 flex items-center justify-center group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
                <ImageIcon size={24} />
              </div>
              <span className="font-sans text-sm tracking-widest text-paper-200 group-hover:text-cyan-400">角色CG</span>
            </button>
            <button onClick={() => { setGalleryTab('location_cg'); setCurrentScreen('gallery'); }}
              className="flex flex-col items-center gap-4 py-8 px-4 hover:bg-ink-800/50 transition-colors border-b border-transparent hover:border-ink-700/50 group">
              <div className="w-16 h-16 rounded-full border border-ink-700/50 flex items-center justify-center group-hover:border-cyan-400 group-hover:text-cyan-400 transition-colors">
                <ImageIcon size={24} />
              </div>
              <span className="font-sans text-sm tracking-widest text-paper-200 group-hover:text-cyan-400">地点CG</span>
            </button>
            <button onClick={() => setActiveModal('clues')}
              className="flex flex-col items-center gap-4 py-8 px-4 hover:bg-ink-800/50 transition-colors border-b border-transparent hover:border-ink-700/50 group">
              <div className="w-16 h-16 rounded-full border border-ink-700/50 flex items-center justify-center group-hover:border-gold-400 group-hover:text-gold-400 transition-colors">
                <Book size={24} />
              </div>
              <span className="font-sans text-sm tracking-widest text-paper-200 group-hover:text-gold-400">调查卷宗</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ 立绘层（多角色同屏） ════ */}
      <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
        <AnimatePresence mode="popLayout">
          {sceneCharacters.map((char) => (
            <motion.div
              key={char.speaker}
              className={cn(
                "absolute bottom-0 h-full w-auto transition-all duration-300",
                char.position === 'left' && "left-[5%]",
                char.position === 'center' && "left-1/2 -translate-x-1/2",
                char.position === 'right' && "right-[5%]",
              )}
              style={{
                filter: char.isActive ? 'none' : 'brightness(0.55) grayscale(0.35)',
                zIndex: char.isActive ? 16 : 15,
                transform: char.isActive ? 'scale(1)' : 'scale(0.96)',
                transition: 'filter 0.3s ease, transform 0.3s ease',
              }}
              {...getTransitionConfig(char.emotion)}
            >
              {char.sprite && (
                <img src={char.sprite} alt={`${char.speaker}-${char.emotion}`}
                  className="h-[85vh] max-h-[1000px] w-auto object-contain object-bottom drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                  }}
                  loading="eager" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ════ 情绪特效 ════ */}
      <div className="absolute inset-0 z-18 pointer-events-none">
        {screenEffect?.shake && (
          <motion.div animate={{ x: [0, -4, 4, -4, 4, 0] }} transition={{ duration: 0.25 }} className="w-full h-full" />
        )}
        {screenEffect?.vignette && (
          <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 200px ${screenEffect.vignette}` }} />
        )}
        {screenEffect?.flashColor && (
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="absolute inset-0" style={{ backgroundColor: screenEffect.flashColor }} />
        )}
      </div>

      {/* ════ 平行事件面板 ════ */}
      <AnimatePresence mode="wait">
        {parallelEvents.length > 0 && showParallelEvents && (
          <motion.div key="pe-expanded" initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }} className="absolute top-16 left-4 z-30 max-w-65 pointer-events-auto">
            <div className="bg-ink-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between bg-cyan-900/60 px-3 py-1.5 border-b border-ink-700">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="font-serif text-sm text-cyan-300 tracking-widest">平行事件</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowParallelEvents(false); }}
                  className="text-paper-200 hover:text-vermilion-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2.5 space-y-2">
                {parallelEvents.map((evt, i) => (
                  <div key={i} className="border-l-2 border-vermilion-500 pl-2">
                    <div className="text-gold-300 text-sm font-serif leading-tight mb-1">{evt.location}</div>
                    <div className="text-paper-200/80 text-sm leading-snug">{evt.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {parallelEvents.length > 0 && !showParallelEvents && (
          <motion.button key="pe-collapsed" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setShowParallelEvents(true); }}
            className="absolute top-16 left-4 z-30 bg-ink-900/90 border border-cyan-900/50 p-1.5 rounded-lg hover:scale-110 active:scale-90 transition-transform pointer-events-auto"
            title="展开平行事件">
            <Radio className="w-4 h-4 text-cyan-400" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════ 文本框 ════ */}
      <AnimatePresence mode="wait">
        {isTextBoxCollapsed ? (
          <motion.div key="collapsed" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }} className="fixed bottom-4 right-4 z-30">
            <button onClick={() => setIsTextBoxCollapsed(false)}
              className="p-2 bg-ink-900/90 border border-cyan-900/50 text-cyan-400 hover:bg-cyan-900/40 transition-colors rounded"
              title="展开文本框">
              <ChevronUp className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div key="expanded" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }} className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 cursor-pointer"
            onClick={handleNext}>
            {/* 折叠按钮 */}
            <div className="absolute -top-3 right-6 md:right-12 z-40">
              <button onClick={(e) => { e.stopPropagation(); setIsTextBoxCollapsed(true); }}
                className="p-1 bg-ink-900/70 text-paper-200 hover:bg-vermilion-900/60 transition-colors rounded border border-ink-700"
                title="折叠文本框">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* 名字标签 + 头像 */}
            <AnimatePresence mode="wait">
              {currentLine.type !== 'narrator' && (
                <motion.div key={currentLine.speaker} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                  className="absolute -top-12 md:-top-16 left-6 md:left-12 z-30 flex items-end gap-3 drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                  {currentLine.avatar && (
                    <div className={`w-16 h-16 md:w-20 md:h-20 bg-white border-4 flex items-center justify-center overflow-hidden relative transform -skew-x-6 ${isCyan ? 'border-cyan-500' : 'border-vermilion-500'}`}>
                      <img src={currentLine.avatar} alt="avatar" className="w-full h-full object-cover object-top scale-110" />
                    </div>
                  )}
                  <div className={`px-4 md:px-6 py-1 md:py-2 border-4 ${themeBorderClass} ${themeBgClass} text-xl md:text-2xl font-serif italic -skew-x-6 ${themeTextClass} mb-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]`}>
                    {displayName(currentLine.speaker!, playerName)}
                    {currentLine.emotion && currentLine.emotion !== '默认' && (
                      <span className="ml-2 text-sm font-sans opacity-70">[{currentLine.emotion}]</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 主文本框 */}
            <div className="h-full w-full relative flex flex-col p-4"
              style={{ paddingTop: currentLine.type === 'narrator' ? '1.5rem' : '3.5rem' }}>
              <div className={`flex-1 overflow-y-auto hide-scrollbar text-xl md:text-[26px] font-sans tracking-[0.1em] leading-[2] z-10 ${currentLine.type === 'thought' ? 'text-cyan-400' : 'text-paper-100'}`}
                style={{ willChange: 'contents' }}>
                {displayedText}
                {isTyping && <span className={`inline-block w-3 h-6 animate-pulse ml-1 align-middle ${currentLine.type === 'thought' ? 'bg-cyan-400' : 'bg-paper-100'}`} />}
              </div>

              {/* 按钮组 */}
              <div className="flex justify-between items-end mt-4 z-10">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={(e) => { e.stopPropagation(); setShowBacklog(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink-800/60 border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded text-sm">
                    <History className="w-4 h-4" /> 历史
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink-800/60 border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded text-sm disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" /> 上一句
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsAutoMode(prev => !prev); }}
                    className={`flex items-center gap-1 px-3 py-1.5 border transition-colors rounded text-sm ${isAutoMode ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300' : 'bg-ink-800/60 border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50'}`}
                    title={isAutoMode ? '关闭 Auto' : '开启 Auto'}>
                    {isAutoMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isAutoMode ? 'Auto' : 'Auto'}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); const next = textSpeed >= 3 ? 1 : textSpeed + 1; textSettings.setTextSpeed(next); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-ink-800/60 border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded text-sm"
                    title={`速度: ${textSpeed === 0 ? '瞬间' : textSpeed === 1 ? '慢' : textSpeed === 2 ? '普通' : '快'}`}>
                    {textSpeed >= 3 ? <Zap className="w-4 h-4 text-gold-400" /> : <FastForward className="w-4 h-4" />}
                    <span className="hidden sm:inline">{textSpeed === 0 ? '瞬间' : textSpeed === 1 ? '慢' : textSpeed === 2 ? '普通' : '快'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handlePrevFloor} disabled={!canPrevFloor}
                    className={`flex items-center gap-1 px-3 py-1.5 border transition-colors rounded text-sm ${canPrevFloor ? 'bg-ink-800/60 border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50' : 'bg-ink-800/30 border-ink-700/30 text-ink-500 cursor-not-allowed'}`}
                    title="上一楼层">
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">上层</span>
                  </button>
                  <button onClick={handleNextFloor} disabled={!canNextFloor}
                    className={`flex items-center gap-1 px-3 py-1.5 border transition-colors rounded text-sm ${canNextFloor ? 'bg-ink-800/60 border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50' : 'bg-ink-800/30 border-ink-700/30 text-ink-500 cursor-not-allowed'}`}
                    title="下一楼层">
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">下层</span>
                  </button>
                  {!isTyping && (
                    <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <ChevronRight className="w-8 h-8 text-gold-400" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ 选项面板 ════ */}
      <AnimatePresence>
        {showOptions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="absolute inset-0 z-35 bg-ink-900/85 backdrop-blur-md flex items-center justify-center p-4">
            <button onClick={() => setOptionsDismissed(true)}
              className="absolute top-4 right-4 z-40 p-2 bg-gold-500 text-ink-900 hover:scale-110 transition-transform rounded font-serif"
              title="关闭选项">
              <X className="w-5 h-5" />
            </button>
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }} transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
              className="w-full max-w-2xl flex flex-col gap-3 relative z-10">
              {options.map((option, i) => {
                const colorScheme = i % 2 === 0
                  ? "bg-cyan-900/60 border-cyan-500/50 text-cyan-300"
                  : "bg-vermilion-900/60 border-vermilion-500/50 text-vermilion-300";
                return (
                  <motion.button key={i} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, type: "spring", damping: 18 }}
                    onClick={() => handleSelectOption(option)}
                    className={cn(
                      "flex items-center gap-4 p-4 border-2 font-serif text-left rounded",
                      "hover:scale-[1.03] active:scale-95 transition-all duration-150 group relative overflow-hidden",
                      colorScheme
                    )}>
                    {optionChibis[i] && (
                      <div className="relative z-10 shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                        <img src={optionChibis[i]} alt="chibi"
                          className="w-full h-full object-contain group-hover:scale-125 group-hover:-rotate-6 transition-transform drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                          loading="eager" />
                      </div>
                    )}
                    <span className="relative z-10 flex-1 text-base md:text-xl leading-snug">{option}</span>
                    <ChevronRight className="relative z-10 w-6 h-6 shrink-0 group-hover:translate-x-2 transition-transform" />
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ 历史记录侧边栏 ════ */}
      <AnimatePresence>
        {showBacklog && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 left-0 w-full md:w-96 bg-ink-900/95 backdrop-blur-md z-50 flex flex-col border-r-2 border-cyan-900/50">
            <div className="p-4 bg-cyan-900/40 text-cyan-300 font-serif text-xl flex justify-between items-center border-b border-ink-700">
              <span className="tracking-widest">回忆记录</span>
              <button onClick={() => setShowBacklog(false)}
                className="text-2xl hover:scale-110 active:scale-90 transition-transform text-paper-200 hover:text-vermilion-400">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {script.slice(0, currentIndex).map((log, idx) => (
                <div key={idx} className="space-y-2 border-b border-ink-700/50 pb-4 relative">
                  {log.type === 'narrator' ? (
                    <div className="text-paper-200/70 text-base bg-ink-800/50 p-3 rounded border border-ink-700/50 font-serif italic">{log.text}</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {log.avatar && <img src={log.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover object-top border border-ink-700" />}
                        <div className={`font-serif text-sm px-2 py-0.5 -skew-x-6 ${getCharacterThemeColor(log.speaker) === 'cyan' ? 'bg-cyan-900/60 text-cyan-300' : 'bg-vermilion-900/60 text-vermilion-300'}`}>
                          {displayName(log.speaker!, playerName)}
                          {log.emotion && log.emotion !== '默认' && <span className="ml-1 opacity-70">[{log.emotion}]</span>}
                        </div>
                      </div>
                      <div className={`text-base font-serif pl-10 ${log.type === 'thought' ? 'text-cyan-400/80 italic' : 'text-paper-200'}`}>{log.text}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ 模态框 ════ */}
      <SettingsModal isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} />
      <HistoryLogModal isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} />
      <ClueNotebookModal isOpen={activeModal === 'clues'} onClose={() => setActiveModal(null)} />
      <MapModal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} />
      <CalendarModal isOpen={activeModal === 'calendar'} onClose={() => setActiveModal(null)} />

      {/* 待接入模态框占位 */}
      {activeModal === 'thinking' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
          <div className="relative bg-ink-800 border border-cyan-900/50 rounded-xl p-8 max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-cyan-400 tracking-widest mb-4">思维链</h2>
            <p className="text-paper-200 text-sm">思维链查看功能待接入。</p>
            <button onClick={() => setActiveModal(null)} className="mt-4 text-ink-500 hover:text-cyan-400 text-sm">关闭</button>
          </div>
        </div>
      )}
      {activeModal === 'variables' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
          <div className="relative bg-ink-800 border border-gold-900/50 rounded-xl p-8 max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-gold-400 tracking-widest mb-4">变量查看</h2>
            <p className="text-paper-200 text-sm">变量查看器待接入。</p>
            <button onClick={() => setActiveModal(null)} className="mt-4 text-ink-500 hover:text-gold-400 text-sm">关闭</button>
          </div>
        </div>
      )}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
          <div className="relative bg-ink-800 border border-vermilion-900/50 rounded-xl p-8 max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-vermilion-400 tracking-widest mb-4">删除楼层</h2>
            <p className="text-paper-200 text-sm">删除楼层功能待接入。</p>
            <button onClick={() => setActiveModal(null)} className="mt-4 text-ink-500 hover:text-vermilion-400 text-sm">关闭</button>
          </div>
        </div>
      )}
      {activeModal === 'manual' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
          <div className="relative bg-ink-800 border border-gold-900/50 rounded-xl p-8 max-w-lg max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <h2 className="font-serif text-2xl text-gold-400 tracking-widest mb-6">说明书</h2>
            <div className="space-y-4 text-paper-200 text-sm leading-relaxed">
              <section>
                <h3 className="font-serif text-cyan-400 tracking-widest mb-2">基本操作</h3>
                <p>点击屏幕或按 →/Enter 推进剧情。按 ← 回看上一句。Ctrl 快进。</p>
              </section>
              <section>
                <h3 className="font-serif text-cyan-400 tracking-widest mb-2">文本框</h3>
                <p>点击文本框推进剧本。可折叠/展开。底部按钮提供历史、上一句、Auto、速度、楼层翻页功能。</p>
              </section>
              <section>
                <h3 className="font-serif text-gold-400 tracking-widest mb-2">工具栏</h3>
                <p>顶部工具栏提供全屏、楼层导航、地图、时辰、剧情回顾、思维链、变量、删除、重生成、设置等功能。</p>
              </section>
            </div>
            <button onClick={() => setActiveModal(null)} className="mt-6 px-6 py-2 bg-cyan-900/40 border border-cyan-900/50 text-cyan-300 rounded font-serif tracking-widest hover:bg-cyan-800/40 transition-colors">关闭</button>
          </div>
        </div>
      )}

      <TextSelectionClue />
      <ChatInputWidget />
      <MusicPlayerWidget />
    </motion.div>
  );
};
