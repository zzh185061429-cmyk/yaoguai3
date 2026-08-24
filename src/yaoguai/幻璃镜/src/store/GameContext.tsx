import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Screen, NotificationType, ClueStatus } from '../types';
import { createCaseEntry, updateCaseEntry, closeCaseEntry, deleteCaseEntry } from '../utils/clueWorldbook';
import { loadSubApi, isSubApiReady, type SubApiConfig } from '../utils/subApi';

export type ClueType = 'clue' | 'deduction';

/**
 * 推论真伪的隐藏判定（由副API在生成候选时给出，玩家不可见）：
 * - 'true'  直接成立的关联 → 视为已确立事实
 * - 'half'  半真，另有隐情 → 待验，可部分印证但保留反转
 * - 'false' 表面合理实为误导 → 待验，AI 应渐进安排反证
 * undefined（玩家手书/编辑）→ 待验
 */
export type TruthTag = 'true' | 'half' | 'false';

/** 案件状态 */
export type CaseStatus = 'active' | 'closed';

/** 案件信息 */
export interface CaseInfo {
  id: string;
  name: string;
  status: CaseStatus;
  keywords: string[];
  closingStatement?: string;
  createdAt: string;
}

export interface Clue {
  id: string;
  title?: string;
  text: string;
  type: ClueType;
  timestamp: string;
  source: string;
  position?: { x: number, y: number };
  /** 所属案件 ID */
  caseId: string;
  /** 推论的源线索 ID 列表（仅 type='deduction' 时有效） */
  sourceClueIds?: string[];
  /** 隐藏真伪判定（仅推论有效；玩家界面不渲染，只进世界书 AI 专属区） */
  truth?: TruthTag;
  /** 推论真伪状态标记（玩家可见） */
  status?: 'pending' | 'true' | 'false';
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
  cases: CaseInfo[];
  addClue: (text: string, source: string, caseId: string, type?: ClueType, position?: { x: number, y: number }) => void;
  removeClue: (id: string) => void;
  updateCluePosition: (id: string, position: { x: number, y: number }) => void;
  editClue: (id: string, text: string) => void;
  updateDeductionStatus: (id: string, status: ClueStatus) => void;
  clueConnections: [string, string][];
  /** 调用 AI 生成三条推论选项（每条带隐藏真伪判定） */
  combineClues: (id1: string, id2: string) => Promise<{ text: string; truth: TruthTag }[] | false>;
  /** 确认推论（可以是 AI 给的也可以是玩家自己写的）；truth 为隐藏判定，玩家手书时不传 */
  commitDeduction: (sourceClueIds: string[], text: string, caseId: string, position?: { x: number, y: number }, truth?: TruthTag) => void;
  /** 创建新案件 */
  createCase: (name: string) => string;
  /** 结案（玩家自己填关键词和结案陈词） */
  closeCase: (caseId: string, caseName: string, keywords: string[], closingStatement: string) => Promise<boolean>;
  /** 重新开启已结案的案件 */
  reopenCase: (caseId: string) => void;
  /** 删除案件 */
  deleteCase: (caseId: string) => void;
  /** 获取指定案件的所有线索和推论 */
  getCaseClues: (caseId: string) => Clue[];
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
  /** 推论生成中（combineClues 调 AI 时） */
  isCombining: boolean;
  // ── 剧本播放状态 ──
  playerName?: string;
  setPlayerName: (name: string | undefined) => void;
  pendingMessage: string | null;
  setPendingMessage: (msg: string | null) => void;
  scriptCharacterLocations: Record<string, string>;
  setScriptCharacterLocations: (locs: Record<string, string>) => void;
  gameTime: number;
  setGameTime: (time: number) => void;
  weatherParticlesEnabled: boolean;
  setWeatherParticlesEnabled: (enabled: boolean) => void;
  storyVersion: number;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

/** 聊天变量中的线索存储键 */
const CLUES_STORAGE_KEY = 'mirageClues';

/** 从聊天变量读取持久化数据 */
function loadChatData(): { playerName?: string; clues?: Clue[]; clueConnections?: [string, string][]; cases?: CaseInfo[] } | null {
  try {
    const chatVars = getVariables({ type: 'chat' }) as any;
    if (!chatVars) return null;
    return {
      playerName: typeof chatVars.playerName === 'string' ? chatVars.playerName : undefined,
      clues: Array.isArray(chatVars[CLUES_STORAGE_KEY]?.clues) ? chatVars[CLUES_STORAGE_KEY].clues : undefined,
      clueConnections: Array.isArray(chatVars[CLUES_STORAGE_KEY]?.connections) ? chatVars[CLUES_STORAGE_KEY].connections : undefined,
      cases: Array.isArray(chatVars[CLUES_STORAGE_KEY]?.cases) ? chatVars[CLUES_STORAGE_KEY].cases : undefined,
    };
  } catch {
    return null;
  }
}

/** 获取最新 assistant 楼层号 */
function getLatestAssistantId(): number | null {
  try {
    const lastId = getLastMessageId();
    if (lastId == null) return null;
    const msg = getChatMessages(lastId)[0];
    if (!msg) return null;
    if (msg.role === 'assistant') return msg.message_id;
    if (lastId > 0) {
      const prev = getChatMessages(lastId - 1)[0];
      if (prev && prev.role === 'assistant') return prev.message_id;
    }
    return null;
  } catch {
    return null;
  }
}

/** 生成随机 ID */
function genId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** 获取游戏内时间戳（占位：年号与世界观一致为「永安」，待接入游戏内历法） */
function getGameTimestamp(): string {
  return '永安三年 八月十五 戌时';
}

/**
 * 从 AI 响应中解析推论候选：
 * 优先解析 {"options":[{text,tag}]} 结构化 JSON；
 * 失败则按行拆分（去掉编号前缀），全部视为 half（半真待验）。
 */
function parseInferenceOptions(raw: string): { text: string; truth: TruthTag }[] {
  const normalizeTag = (tag: unknown): TruthTag => (tag === 'true' || tag === 'false' ? tag : 'half');

  // 尝试直接解析，或提取第一个平衡的 JSON 对象
  const jsonCandidates: string[] = [raw];
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) jsonCandidates.push(raw.slice(first, last + 1));

  for (const candidate of jsonCandidates) {
    try {
      const parsed = JSON.parse(candidate);
      const arr = Array.isArray(parsed?.options) ? parsed.options : Array.isArray(parsed) ? parsed : null;
      if (arr) {
        const options = arr
          .map((o: any) => ({ text: String(o?.text ?? o ?? '').trim(), truth: normalizeTag(o?.tag) }))
          .filter((o: { text: string }) => o.text)
          .slice(0, 3);
        if (options.length > 0) return options;
      }
    } catch { /* 继续尝试 */ }
  }

  // 降级：按行拆分
  const lines = raw.split(/\n/).map(s => s.trim().replace(/^\d+[.、)]\s*/, '')).filter(s => s);
  return lines.slice(0, 3).map(text => ({ text, truth: 'half' as TruthTag }));
}

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main-menu');
  const [galleryTab, setGalleryTab] = useState<'characters' | 'character_cg' | 'location_cg'>('characters');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [clueConnections, setClueConnections] = useState<[string, string][]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [viewingFloorId, setViewingFloorId] = useState<number | null>(null);
  const [lastAssistantFloorId, setLastAssistantFloorId] = useState<number | null>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFloorId, setGeneratingFloorId] = useState<number | null>(null);
  const [isCombining, setIsCombining] = useState(false);

  // ── 剧本播放状态 ──
  const [playerName, setPlayerNameState] = useState<string | undefined>(undefined);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [scriptCharacterLocations, setScriptCharacterLocations] = useState<Record<string, string>>({});
  const [gameTime, setGameTime] = useState<number>(12);
  const [weatherParticlesEnabled, setWeatherParticlesEnabled] = useState<boolean>(true);
  const [storyVersion, setStoryVersion] = useState(0);

  const isViewingHistory = viewingFloorId !== null;

  const setViewingFloor = (floorId: number | null) => {
    setViewingFloorId(floorId);
  };

  // ── state 的 ref 镜像 ──
  const cluesRef = useRef<Clue[]>([]);
  const clueConnectionsRef = useRef<[string, string][]>([]);
  const casesRef = useRef<CaseInfo[]>([]);

  // ── 聊天数据加载 ──
  const loadChatDataIntoState = useCallback(() => {
    const data = loadChatData();
    if (!data) return;
    setPlayerNameState(data.playerName);
    if (data.clues && data.clues.length > 0) {
      cluesRef.current = data.clues;
      setClues(data.clues);
    }
    if (data.clueConnections) {
      clueConnectionsRef.current = data.clueConnections;
      setClueConnections(data.clueConnections);
    }
    if (data.cases && data.cases.length > 0) {
      casesRef.current = data.cases;
      setCases(data.cases);
    }
  }, []);

  useEffect(() => {
    loadChatDataIntoState();
    try {
      const stop = eventOn(tavern_events.CHAT_CHANGED, () => {
        loadChatDataIntoState();
        setLastAssistantFloorId(getLatestAssistantId());
        setViewingFloorId(null);
      });
      return () => {
        if (stop?.stop) stop.stop();
      };
    } catch (e) {
      console.warn('[幻璃镜] CHAT_CHANGED 监听注册跳过:', e);
      return undefined;
    }
  }, [loadChatDataIntoState]);

  const setPlayerName = useCallback((name: string | undefined) => {
    const trimmed = name?.trim() || undefined;
    setPlayerNameState(trimmed);
    try {
      updateVariablesWith(vars => ({ ...vars, playerName: trimmed ?? '' }), { type: 'chat' });
      console.info('[幻璃镜] 玩家名已设置:', trimmed ?? '(清空)');
    } catch {
      console.warn('[幻璃镜] 无法持久化玩家名到聊天变量');
    }
  }, []);

  /** 持久化到聊天变量 */
  const persistAll = useCallback((nextClues: Clue[], nextConnections: [string, string][], nextCases: CaseInfo[]) => {
    try {
      updateVariablesWith(
        vars => ({ ...vars, [CLUES_STORAGE_KEY]: { clues: nextClues, connections: nextConnections, cases: nextCases } }),
        { type: 'chat' },
      );
    } catch {
      console.warn('[幻璃镜] 无法持久化线索卷宗到聊天变量');
    }
  }, []);

  /** 同时更新 React state 和聊天变量 */
  const updateCluesAndCases = useCallback((cluesUpdater: (prev: Clue[]) => Clue[], connectionsUpdater?: (prev: [string, string][]) => [string, string][], casesUpdater?: (prev: CaseInfo[]) => CaseInfo[]) => {
    const nextClues = cluesUpdater(cluesRef.current);
    const nextConn = connectionsUpdater ? connectionsUpdater(clueConnectionsRef.current) : clueConnectionsRef.current;
    const nextCases = casesUpdater ? casesUpdater(casesRef.current) : casesRef.current;
    cluesRef.current = nextClues;
    clueConnectionsRef.current = nextConn;
    casesRef.current = nextCases;
    setClues(nextClues);
    setClueConnections(nextConn);
    setCases(nextCases);
    persistAll(nextClues, nextConn, nextCases);
  }, [persistAll]);

  const startGenerating = useCallback((floorId?: number) => {
    const lockFloor = floorId ?? viewingFloorId ?? lastAssistantFloorId;
    if (lockFloor != null) setViewingFloor(lockFloor);
    setIsGenerating(true);
    console.info('[幻璃镜] 开始生成，锁定画面到楼层', lockFloor);
  }, [viewingFloorId, lastAssistantFloorId]);

  const finishGenerating = useCallback(() => {
    setIsGenerating(false);
    const newFloorId = getLatestAssistantId();
    if (newFloorId != null) setGeneratingFloorId(newFloorId);
    console.info('[幻璃镜] 生成完成，最新 assistant 楼层:', newFloorId);
  }, []);

  // ── 楼层同步 ──
  const isGeneratingRef = useRef(isGenerating);
  const generatingFloorIdRef = useRef(generatingFloorId);
  isGeneratingRef.current = isGenerating;
  generatingFloorIdRef.current = generatingFloorId;

  useEffect(() => {
    const syncLatestFloor = () => {
      const latestId = getLatestAssistantId();
      if (latestId == null) return;
      if (isGeneratingRef.current) {
        if (generatingFloorIdRef.current == null || latestId > generatingFloorIdRef.current) {
          setGeneratingFloorId(latestId);
        }
      } else {
        setLastAssistantFloorId(prev => (prev === latestId ? prev : latestId));
      }
    };

    const stops: (() => void)[] = [];
    const register = (ret: EventOnReturn | undefined) => {
      if (ret?.stop) stops.push(() => ret.stop?.());
    };
    register(eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      syncLatestFloor();
    }));
    register(eventOn(tavern_events.MESSAGE_UPDATED, () => {
      syncLatestFloor();
      setStoryVersion(v => v + 1);
    }));
    register(eventOn(iframe_events.GENERATION_ENDED, () => {
      setTimeout(syncLatestFloor, 300);
    }));
    register(eventOn('mirage_story_updated', () => {
      syncLatestFloor();
      setStoryVersion(v => v + 1);
    }));

    const pollInterval = setInterval(syncLatestFloor, 3000);
    syncLatestFloor();

    return () => {
      stops.forEach(stop => stop());
      clearInterval(pollInterval);
    };
  }, []);

  const addNotification = (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const id = genId();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // ── 案件管理 ──

  /** 创建新案件，返回案件 ID */
  const createCase = useCallback((name: string): string => {
    const caseId = genId();
    const newCase: CaseInfo = {
      id: caseId,
      name: name.trim() || '未命名案件',
      status: 'active',
      keywords: [],
      createdAt: getGameTimestamp(),
    };
    updateCluesAndCases(
      prev => prev, // clues 不变
      prev => prev, // connections 不变
      prev => [...prev, newCase],
    );
    // 创建世界书条目
    createCaseEntry(caseId, newCase.name, []);
    addNotification(`案件「${newCase.name}」已创建`, 'success');
    console.info('[幻璃镜] 新案件已创建:', caseId, newCase.name);
    return caseId;
  }, [updateCluesAndCases]);

  /** 结案 */
  const closeCase = useCallback(async (caseId: string, caseName: string, keywords: string[], closingStatement: string): Promise<boolean> => {
    const caseClues = cluesRef.current.filter(c => c.caseId === caseId);
    const success = await closeCaseEntry(caseId, caseName, keywords, caseClues, closingStatement);
    if (success) {
      updateCluesAndCases(
        prev => prev,
        prev => prev,
        prev => prev.map(c => c.id === caseId ? { ...c, status: 'closed', name: caseName, keywords, closingStatement } : c),
      );
      addNotification(`案件「${caseName}」已结案`, 'success');
    } else {
      addNotification('结案失败，请检查世界书设置', 'warning');
    }
    return success;
  }, [updateCluesAndCases]);

  /** 重新开启已结案的案件 */
  const reopenCase = useCallback((caseId: string) => {
    updateCluesAndCases(
      prev => prev,
      prev => prev,
      prev => prev.map(c => c.id === caseId ? { ...c, status: 'active' } : c),
    );
    // 更新世界书条目回蓝灯
    const caseInfo = casesRef.current.find(c => c.id === caseId);
    const caseClues = cluesRef.current.filter(c => c.caseId === caseId);
    if (caseInfo) {
      updateCaseEntry(caseId, caseInfo.name, caseClues, false);
    }
    addNotification('案件已重新开启', 'info');
  }, [updateCluesAndCases]);

  /** 删除案件 */
  const deleteCase = useCallback((caseId: string) => {
    deleteCaseEntry(caseId);
    updateCluesAndCases(
      prev => prev.filter(c => c.caseId !== caseId),
      prevConn => prevConn.filter(conn => {
        const c1 = cluesRef.current.find(c => c.id === conn[0]);
        const c2 = cluesRef.current.find(c => c.id === conn[1]);
        return c1?.caseId !== caseId && c2?.caseId !== caseId;
      }),
      prev => prev.filter(c => c.id !== caseId),
    );
    addNotification('案件已删除', 'info');
  }, [updateCluesAndCases]);

  /** 获取指定案件的所有线索和推论 */
  const getCaseClues = useCallback((caseId: string): Clue[] => {
    return cluesRef.current.filter(c => c.caseId === caseId);
  }, []);

  // ── 线索/推论管理 ──

  /** 添加线索 */
  const addClue = useCallback((text: string, source: string, caseId: string, type: ClueType = 'clue', position?: { x: number, y: number }) => {
    // 目标案件不存在时（开局未建案、_temp 等），自动创建「初录案卷」承接，避免线索漏出世界书
    let effectiveCaseId = caseId;
    if (!casesRef.current.some(c => c.id === caseId)) {
      const newCaseId = genId();
      const newCase: CaseInfo = {
        id: newCaseId,
        name: '初录案卷',
        status: 'active',
        keywords: [],
        createdAt: getGameTimestamp(),
      };
      updateCluesAndCases(
        prev => prev,
        undefined,
        prev => [...prev, newCase],
      );
      createCaseEntry(newCaseId, newCase.name, []);
      effectiveCaseId = newCaseId;
      addNotification('已自动创建「初录案卷」', 'info');
    }

    if (cluesRef.current.some(c => c.text === text && c.caseId === effectiveCaseId)) {
      addNotification('该线索已记录', 'warning');
      return;
    }
    const newClue: Clue = {
      id: genId(),
      text,
      type,
      timestamp: getGameTimestamp(),
      source,
      position: position || { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 },
      caseId: effectiveCaseId,
    };
    updateCluesAndCases(prev => [...prev, newClue]);

    // 同步到世界书
    const caseInfo = casesRef.current.find(c => c.id === effectiveCaseId);
    if (caseInfo) {
      const caseClues = [...cluesRef.current.filter(c => c.caseId === effectiveCaseId), newClue];
      updateCaseEntry(effectiveCaseId, caseInfo.name, caseClues, caseInfo.status === 'closed', caseInfo.closingStatement);
    }

    addNotification(`已收集${type === 'deduction' ? '推论' : '线索'}`, 'success');
  }, [updateCluesAndCases]);

  /** 删除线索/推论 */
  const removeClue = useCallback((id: string) => {
    const clue = cluesRef.current.find(c => c.id === id);
    if (!clue) return;
    const caseId = clue.caseId;

    updateCluesAndCases(
      prev => prev.filter(c => c.id !== id),
      prevConn => prevConn.filter(conn => conn[0] !== id && conn[1] !== id),
    );

    // 同步到世界书
    const caseInfo = casesRef.current.find(c => c.id === caseId);
    if (caseInfo) {
      const caseClues = cluesRef.current.filter(c => c.caseId === caseId && c.id !== id);
      updateCaseEntry(caseId, caseInfo.name, caseClues, caseInfo.status === 'closed', caseInfo.closingStatement);
    }
  }, [updateCluesAndCases]);

  /** 更新线索位置 */
  const updateCluePosition = useCallback((id: string, position: { x: number, y: number }) => {
    updateCluesAndCases(prev => prev.map(c => c.id === id ? { ...c, position } : c));
  }, [updateCluesAndCases]);

  /** 编辑线索/推论文本 */
  const editClue = useCallback((id: string, text: string) => {
    const clue = cluesRef.current.find(c => c.id === id);
    if (!clue) return;
    const caseId = clue.caseId;

    updateCluesAndCases(prev => prev.map(c => c.id === id ? { ...c, text } : c));

    // 同步到世界书
    const caseInfo = casesRef.current.find(c => c.id === caseId);
    if (caseInfo) {
      const caseClues = cluesRef.current.filter(c => c.caseId === caseId).map(c => c.id === id ? { ...c, text } : c);
      updateCaseEntry(caseId, caseInfo.name, caseClues, caseInfo.status === 'closed', caseInfo.closingStatement);
    }
    addNotification('已更新', 'success');
  }, [updateCluesAndCases]);

  /** 更新推论的真伪状态标记 */
  const updateDeductionStatus = useCallback((id: string, status: ClueStatus) => {
    const clue = cluesRef.current.find(c => c.id === id);
    if (!clue) return;
    const caseId = clue.caseId;

    updateCluesAndCases(prev => prev.map(c => c.id === id ? { ...c, status } : c));

    // 同步到世界书
    const caseInfo = casesRef.current.find(c => c.id === caseId);
    if (caseInfo) {
      const caseClues = cluesRef.current.filter(c => c.caseId === caseId).map(c => c.id === id ? { ...c, status } : c);
      updateCaseEntry(caseId, caseInfo.name, caseClues, caseInfo.status === 'closed', caseInfo.closingStatement);
    }
    const statusLabel = status === 'true' ? '属实' : status === 'false' ? '伪证' : '未定';
    addNotification(`推论已标记为「${statusLabel}」`, 'info');
  }, [updateCluesAndCases]);

  /**
   * 调用 AI 生成三条推论选项（每条带隐藏真伪判定）
   * 已配置推演副API → generateRaw 独立调用（无主聊天上下文，便宜且不剧透主模型伏笔）
   * 未配置 → 回退主连接 generate()（候选默认 half）
   */
  const combineClues = useCallback(async (id1: string, id2: string): Promise<{ text: string; truth: TruthTag }[] | false> => {
    const c1 = cluesRef.current.find(c => c.id === id1);
    const c2 = cluesRef.current.find(c => c.id === id2);
    if (!c1 || !c2) return false;

    // 检查是否已经关联过
    const existingConnection = clueConnectionsRef.current.find(
      c => (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1)
    );
    if (existingConnection) {
      addNotification('这两个线索已经关联过了', 'info');
      return false;
    }

    // 案件上下文：案件名 + 当前卷宗摘要（含隐藏判定，副API可信）
    const caseInfo = casesRef.current.find(c => c.id === c1.caseId);
    const caseClues = cluesRef.current.filter(c => c.caseId === c1.caseId);
    const canonLines = caseClues.map(c => {
      if (c.type === 'clue') return `线索：${c.text}`;
      const tagDesc = c.truth === 'true' ? '（已证）' : c.truth === 'false' ? '（判定为假）' : c.truth === 'half' ? '（判定半真）' : '';
      return `推论：${c.text}${tagDesc}`;
    });
    const canonSummary = canonLines.length > 0 ? canonLines.join('\n') : '（暂无线索记录）';

    setIsCombining(true);
    const subApi: SubApiConfig = loadSubApi();
    try {
      let raw = '';

      if (isSubApiReady(subApi)) {
        // ── 副 API 路径：独立调用，干净上下文 ──
        const result = await generateRaw({
          should_silence: true,
          max_chat_history: 0,
          custom_api: {
            apiurl: subApi.apiurl || undefined,
            key: subApi.key || undefined,
            model: subApi.model,
            source: subApi.source || 'openai',
            temperature: 0.9,
            max_tokens: 1000,
          },
          ordered_prompts: [
            {
              role: 'system' as const,
              content: `你是大雍朝钦天监的探案推演助手。世界观：志怪邪异真实存在，行为各有因果缘由；钦天监懂因果，民间只知禁忌土法。你负责根据玩家收集的线索给出推论方向。`,
            },
            {
              role: 'system' as const,
              content: `当前案件《${caseInfo?.name ?? '未命名'}》卷宗：\n${canonSummary}`,
            },
            {
              role: 'user' as const,
              content: `线索1：${c1.text}\n线索2：${c2.text}\n\n请给出三个不同角度的推论方向，三者必须真正分岔：\n- 一条 tag 为 "true"：由两线索直接成立的最顺关联\n- 一条 tag 为 "half"：表面成立但另有隐情，存在第二种解释\n- 一条 tag 为 "false"：表面最合理、实为误导或巧合\ntag 是给系统的隐藏标记，玩家不可见。每条推论简洁有力，指向下一步调查方向（可指向具体地点或人物）。\n只输出JSON，格式：{"options":[{"text":"...","tag":"true"},{"text":"...","tag":"half"},{"text":"...","tag":"false"}]}`,
            },
          ],
        });
        raw = typeof result === 'string' ? result.trim() : '';
      } else {
        // ── 回退路径：主连接 ──
        const result = await generate({
          user_input: `你正在协助玩家调查一个志怪案件。玩家发现了以下两条线索：\n\n线索1：${c1.text}\n线索2：${c2.text}\n\n请基于这两条线索，给出三个不同角度的推论方向，让玩家选择。要求：\n1. 三个推论应有不同角度：一个直接关联、一个可能有隐情或另一种解释、一个可能是巧合或误导\n2. 每条推论一行，不要编号，不要额外解释\n3. 推论应简洁有力，指向下一步调查方向\n\n只返回三行推论文本，每条一行：`,
          should_stream: false,
          should_silence: true,
        });
        raw = typeof result === 'string' ? result.trim() : '';
      }

      if (!raw) {
        addNotification('AI 未能生成推论', 'warning');
        return false;
      }

      // 解析：优先结构化 JSON，失败则降级为按行拆分（全部视为 half）
      const options = parseInferenceOptions(raw);
      if (options.length === 0) {
        addNotification('AI 未能生成推论', 'warning');
        return false;
      }

      console.info('[幻璃镜] AI 生成的推论选项:', options);
      return options;
    } catch (e) {
      console.error('[幻璃镜] 调用 AI 生成推论失败', e);
      addNotification('生成推论失败', 'warning');
      return false;
    } finally {
      setIsCombining(false);
    }
  }, []);

  /** 确认推论（支持任意数量的源线索，也支持玩家手动写的推论）；truth 为隐藏真伪判定 */
  const commitDeduction = useCallback((sourceClueIds: string[], text: string, caseId: string, position?: { x: number, y: number }, truth?: TruthTag) => {
    let posX = 200;
    let posY = 200;

    if (position) {
      posX = position.x;
      posY = position.y;
    } else if (sourceClueIds.length > 0) {
      // 取源线索位置的中下方
      const sourceClues = cluesRef.current.filter(c => sourceClueIds.includes(c.id));
      if (sourceClues.length > 0 && sourceClues[0].position) {
        posX = sourceClues.reduce((sum, c) => sum + (c.position?.x ?? 200), 0) / sourceClues.length;
        posY = Math.max(...sourceClues.map(c => c.position?.y ?? 200)) + 120;
      }
    }

    const newId = genId();
    const newClue: Clue = {
      id: newId,
      text,
      type: 'deduction',
      timestamp: getGameTimestamp(),
      source: sourceClueIds.length > 0 ? '逻辑推演' : '玩家手书',
      position: { x: posX, y: posY },
      caseId,
      sourceClueIds: sourceClueIds.length > 0 ? sourceClueIds : undefined,
      truth,
    };

    const newConnections = sourceClueIds.map(sid => [sid, newId] as [string, string]);
    updateCluesAndCases(
      prev => [...prev, newClue],
      prevConn => [...prevConn, ...newConnections],
    );

    // 同步到世界书
    const caseInfo = casesRef.current.find(c => c.id === caseId);
    if (caseInfo) {
      const caseClues = [...cluesRef.current.filter(c => c.caseId === caseId), newClue];
      updateCaseEntry(caseId, caseInfo.name, caseClues, caseInfo.status === 'closed', caseInfo.closingStatement);
    }

    addNotification('得出新推论！', 'success');
  }, [updateCluesAndCases]);

  return (
    <GameContext.Provider value={{
      currentScreen, setCurrentScreen, galleryTab, setGalleryTab,
      notifications, addNotification, removeNotification,
      clues, cases, addClue, removeClue, updateCluePosition, editClue, updateDeductionStatus, clueConnections, combineClues, commitDeduction,
      createCase, closeCase, reopenCase, deleteCase, getCaseClues,
      isInvestigating, setIsInvestigating,
      isCombining,
      viewingFloorId, setViewingFloor, lastAssistantFloorId, isViewingHistory,
      isGenerating, generatingFloorId, startGenerating, finishGenerating,
      playerName, setPlayerName,
      pendingMessage, setPendingMessage,
      scriptCharacterLocations, setScriptCharacterLocations,
      gameTime, setGameTime,
      weatherParticlesEnabled, setWeatherParticlesEnabled,
      storyVersion,
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
