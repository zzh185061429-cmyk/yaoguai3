import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Screen, NotificationType } from '../types';

export type ClueType = 'clue' | 'deduction';

export interface Clue {
  id: string;
  text: string;
  type: ClueType;
  timestamp: string; // Changed to string for in-game time
  source: string;
  position?: { x: number, y: number }; // For evidence board
}

interface GameContextProps {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  galleryTab: 'characters' | 'character_cg' | 'location_cg';
  setGalleryTab: (tab: 'characters' | 'character_cg' | 'location_cg') => void;
  notifications: NotificationType[];
  addNotification: (message: string, type?: 'info' | 'warning' | 'success') => void;
  removeNotification: (id: string) => void;
  clues: Clue[];
  addClue: (text: string, source: string, type?: ClueType, position?: { x: number, y: number }) => void;
  removeClue: (id: string) => void;
  updateCluePosition: (id: string, position: { x: number, y: number }) => void;
  editClue: (id: string, text: string) => void;
  clueConnections: [string, string][];
  combineClues: (id1: string, id2: string) => string[] | false;
  commitDeduction: (id1: string, id2: string, text: string, position?: { x: number, y: number }) => void;
  isInvestigating: boolean;
  setIsInvestigating: (val: boolean) => void;
  // ── HUD 相关状态 ──
  viewingFloorId: number | null;
  setViewingFloor: (floorId: number | null) => void;
  lastAssistantFloorId: number | null;
  isViewingHistory: boolean;
  isGenerating: boolean;
  generatingFloorId: number | null;
  startGenerating: (floorId?: number) => void;
  finishGenerating: () => void;
  // ── 剧本播放状态 ──
  /** 玩家自定义名字（从酒馆变量读取，AI 可能用它代替 <user>） */
  playerName?: string;
  setPlayerName: (name: string | undefined) => void;
  /** 待发送消息（选项栏选择后写入，ChatInputWidget 读取并展开） */
  pendingMessage: string | null;
  setPendingMessage: (msg: string | null) => void;
  /** 当前场景中角色位置（从剧本解析中提取，覆盖日程表） */
  scriptCharacterLocations: Record<string, string>;
  setScriptCharacterLocations: (locs: Record<string, string>) => void;
  /** 游戏内时间（用于场景背景白日/夜晚切换） */
  gameTime: number;
  setGameTime: (time: number) => void;
  /** 天气粒子特效开关 */
  weatherParticlesEnabled: boolean;
  setWeatherParticlesEnabled: (enabled: boolean) => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main-menu');
  const [galleryTab, setGalleryTab] = useState<'characters' | 'character_cg' | 'location_cg'>('characters');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [clueConnections, setClueConnections] = useState<[string, string][]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [viewingFloorId, setViewingFloorId] = useState<number | null>(null);
  const [lastAssistantFloorId, setLastAssistantFloorId] = useState<number | null>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFloorId, setGeneratingFloorId] = useState<number | null>(null);

  // ── 剧本播放状态 ──
  const [playerName, setPlayerName] = useState<string | undefined>(undefined);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [scriptCharacterLocations, setScriptCharacterLocations] = useState<Record<string, string>>({});
  const [gameTime, setGameTime] = useState<number>(12); // 默认中午12点
  const [weatherParticlesEnabled, setWeatherParticlesEnabled] = useState<boolean>(true);

  const isViewingHistory = viewingFloorId !== null;

  const setViewingFloor = (floorId: number | null) => {
    setViewingFloorId(floorId);
  };

  const startGenerating = (floorId?: number) => {
    setIsGenerating(true);
    if (floorId != null) setGeneratingFloorId(floorId);
  };

  const finishGenerating = () => {
    setIsGenerating(false);
    setGeneratingFloorId(null);
  };

  const addNotification = (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addClue = (text: string, source: string, type: ClueType = 'clue', position?: { x: number, y: number }) => {
    if (clues.some(c => c.text === text)) {
      addNotification('该线索已记录', 'warning');
      return;
    }
    const newClue: Clue = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: '永明三年 八月十五 戌时',
      source,
      position: position || { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 }
    };
    setClues((prev) => [...prev, newClue]);
    addNotification(`已收集${type === 'deduction' ? '推论' : '线索'}`, 'success');
  };

  const removeClue = (id: string) => {
    setClues((prev) => prev.filter(c => c.id !== id));
    setClueConnections((prev) => prev.filter(conn => conn[0] !== id && conn[1] !== id));
  };

  const updateCluePosition = (id: string, position: { x: number, y: number }) => {
    setClues(prev => prev.map(c => c.id === id ? { ...c, position } : c));
  };

  const editClue = (id: string, text: string) => {
    setClues(prev => prev.map(c => c.id === id ? { ...c, text } : c));
    addNotification('线索已更新', 'success');
  };

  const combineClues = (id1: string, id2: string) => {
    const c1 = clues.find(c => c.id === id1);
    const c2 = clues.find(c => c.id === id2);
    if (!c1 || !c2) return false;

    // Check if they are already directly connected to the same deduction
    // This is a simplified check
    const existingConnection = clueConnections.find(
      c => (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1)
    );

    if (existingConnection) {
      addNotification('这两个线索已经关联过了', 'info');
      return false;
    }

    const t1 = c1.text;
    const t2 = c2.text;

    const hasKeywords = (texts: string[], words: string[]) => {
      const combined = texts.join(' ');
      return words.every(w => combined.includes(w));
    };

    let options: string[] = [];
    
    // Hardcoded simple logic for demo scenario
    if (hasKeywords([t1, t2], ['玉佩', '李家'])) {
      options = [
        '这块遗落的带血玉佩属于京城李家，说明凶手很可能是李家的人。',
        '李家玉佩出现在这里，可能是有人故意栽赃陷害李家。',
        '玉佩的主人曾在案发时来过现场，但未必是真凶。'
      ];
    } else if (hasKeywords([t1, t2], ['城北', '客栈']) || hasKeywords([t1, t2], ['城北', '李公子'])) {
      options = [
        '往城北逃窜的黑影，很可能就是住在城北悦来客栈的李公子。',
        '黑影故意逃向城北，是为了将我们的视线引向悦来客栈。',
        '城北除了悦来客栈，还有其他藏身之处，不应过早下定论。'
      ];
    } else if (hasKeywords([t1, t2], ['李家', '客栈']) || hasKeywords([t1, t2], ['李公子', '凶手'])) {
      options = [
        '推演完成：李公子就是出现在土地庙的嫌疑人！案发后他逃回了悦来客栈！',
        '李公子只是个幌子，真正的凶手另有其人，利用了李公子的行踪。',
        '李公子当晚确实去了土地庙，但他是去见受害者的，而非行凶。'
      ];
    } else {
      options = [
        '这两个线索表面看似无关，但背后可能隐藏着某种深层动机。',
        '或许我们需要更多的第三方线索才能将它们串联起来。',
        '这只是一个巧合，这两件事发生的时间恰好重合而已。'
      ];
    }

    return options;
  };

  const commitDeduction = (id1: string, id2: string, text: string, position?: { x: number, y: number }) => {
    let posX = 200;
    let posY = 200;
    
    if (position) {
      posX = position.x;
      posY = position.y;
    }

    const newId = Math.random().toString(36).substring(2, 9);
    const newClue: Clue = {
      id: newId,
      text: text,
      type: 'deduction',
      source: '逻辑推演',
      timestamp: '永明三年 八月十五 戌时', // Simplified logic for demo
      position: { x: posX, y: posY }
    };

    setClues(prev => [...prev, newClue]);
    // Connect both source clues to the new deduction
    setClueConnections(prev => [...prev, [id1, newId], [id2, newId]]);
    addNotification('得出新推论！', 'success');
  };

  return (
    <GameContext.Provider value={{ 
      currentScreen, setCurrentScreen, galleryTab, setGalleryTab, 
      notifications, addNotification, removeNotification,
      clues, addClue, removeClue, updateCluePosition, editClue, clueConnections, combineClues, commitDeduction,
      isInvestigating, setIsInvestigating,
      viewingFloorId, setViewingFloor, lastAssistantFloorId, isViewingHistory,
      isGenerating, generatingFloorId, startGenerating, finishGenerating,
      // 剧本播放状态
      playerName, setPlayerName,
      pendingMessage, setPendingMessage,
      scriptCharacterLocations, setScriptCharacterLocations,
      gameTime, setGameTime,
      weatherParticlesEnabled, setWeatherParticlesEnabled,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
