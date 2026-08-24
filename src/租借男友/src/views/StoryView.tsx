import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PopCard } from "../components/ui/PopCard";
import { PopButton } from "../components/ui/PopButton";
import { History, ChevronRight, ChevronLeft, Play, Pause, Zap, FastForward, ChevronUp, ChevronDown, X, Radio } from "lucide-react";
import { useToast } from "../components/ToastProvider";
import { useGameContext } from "../state/GameContext";
import { usePhoneContext } from "../state/PhoneContext";
import { parseScriptContent, parseOptions, parseParallelEvents, ScriptLine, ParallelEvent } from "./scriptParser";
import { useAchievementContext } from "../state/AchievementContext";
import { getAssistantFloors } from "../utils/floorNav";
import { getCharacterByTriggerLocation, CHARACTER_CHIBIS } from "../data/characterData";
import { getLocationImage, getLocationImageData } from "../data/locationImages";
import { isOutdoorLocation } from "../data/scheduleData";
import { WeatherOverlay } from "../components/WeatherOverlay";
import { cn } from "../utils";
import { useIsMobile } from "../hooks";
import { sfx } from "../audio/sfxPlayer";
import { textSettings, useTextSettings, getTextDelay } from "../audio/textSettings";

/** 将 <user> 替换为显示名（玩家名优先，否则显示“我”）
 *  如果说话人名字就是玩家自定义名，也返回玩家名（不做额外替换）
 */
function displayName(name: string, playerName?: string): string {
  if (name === '<user>') return playerName || '我';
  return name;
}

/** 打字机速度配置（旧版兼容映射）
 * 速度级别 0=瞬间, 1=慢, 2=普通, 3=快
 * 实际延迟由 getTextDelay() 提供
 */

/** 场景中的角色信息 */
interface SceneCharacter {
  speaker: string;
  emotion: string;
  sprite: string;
  position: 'left' | 'center' | 'right';
  isActive: boolean;
}

/** 情绪对应的屏幕特效 */
const EMOTION_EFFECTS: Record<string, {
  shake?: boolean;
  flashColor?: string;
  vignette?: string;
}> = {
  '生气': { shake: true, vignette: 'rgba(255,0,0,0.08)' },
  '惊讶': { shake: true, flashColor: 'rgba(255,255,255,0.2)' },
  '害羞': { vignette: 'rgba(255,105,180,0.1)' },
  '害怕': { vignette: 'rgba(0,0,0,0.25)' },
  '伤心': { vignette: 'rgba(0,0,139,0.15)' },
  '开心': { vignette: 'rgba(255,215,0,0.08)' },
  '吃醋': { vignette: 'rgba(255,165,0,0.1)' },
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

export function StoryView() {
  const [script, setScript] = useState<ScriptLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);

  // ── 场景角色状态（多角色同屏） ──
  const [sceneCharacters, setSceneCharacters] = useState<SceneCharacter[]>([]);

  // ── 打字机控制状态 ──
  // 从共享 textSettings 读取，与 SettingsPanel 同步
  const { textSpeed, autoWaitMultiplier } = useTextSettings();
  const [isAutoMode, setIsAutoMode] = useState(false);

  // ── 文本框收起状态 ──
  const [isTextBoxCollapsed, setIsTextBoxCollapsed] = useState(false);

  // ── 选项栏状态 ──
  const [options, setOptions] = useState<string[]>([]);
  const [optionsDismissed, setOptionsDismissed] = useState(false);

  // ── 平行事件状态 ──
  const [parallelEvents, setParallelEvents] = useState<ParallelEvent[]>([]);
  const [showParallelEvents, setShowParallelEvents] = useState(true);

  // 使用 ref 跟踪跳过状态，避免触发 effect 重新执行
  const skipTypingRef = useRef(false);
  // 跟踪上一次的场景 location，用于检测场景切换并清空立绘
  const prevLocationKeyRef = useRef<string | null>(null);

  // ── 快进状态（Ctrl 按住时）──
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const isFastForwardingRef = useRef(false);
  isFastForwardingRef.current = isFastForwarding;

  const { showToast } = useToast();
  const {
    viewingFloorId, setViewingFloor, lastAssistantFloorId,
    isGenerating, generatingFloorId,
    currentLocation, gameTime,
    nsfwCgUrl, triggerNsfwPhase, resetNsfw,
    setScriptCharacterLocations, setPendingMessage,
    playerName,
  } = useGameContext();

  const { isPhoneOpen } = usePhoneContext();
  const { unlock: unlockAchievement } = useAchievementContext();
  const isMobile = useIsMobile();
  const touchStartRef = useRef<number | null>(null);

  // 读取指定楼层（或最新楼层）消息文本，解析 <content> 标签
  const targetFloorId = viewingFloorId ?? lastAssistantFloorId;

  // ── 楼层翻页导航 ──
  const [floors, setFloors] = useState<number[]>([]);
  // 楼层列表随生成状态刷新
  useEffect(() => {
    setFloors(getAssistantFloors());
  }, [lastAssistantFloorId, isGenerating, generatingFloorId]);

  // 可翻页的楼层（生成中过滤未完成楼层）
  const availableFloors = useMemo(() => {
    if (isGenerating && generatingFloorId != null) {
      return floors.filter(f => f < generatingFloorId);
    }
    return floors;
  }, [floors, isGenerating, generatingFloorId]);

  // 当前导航楼层（跟随最新时取最新已完成楼层，与 FloorSelector 的 displayFloor 逻辑一致）
  const navFloor = viewingFloorId ?? (isGenerating ? lastAssistantFloorId : (generatingFloorId ?? lastAssistantFloorId));
  const navIndex = navFloor != null ? availableFloors.indexOf(navFloor) : -1;
  const canPrevFloor = navIndex > 0;
  const canNextFloor = navIndex >= 0 && navIndex < availableFloors.length - 1;

  // ── 选项栏：Q版小人随机分配（同一楼层内固定，换楼层后重新随机） ──
  const optionChibis = useMemo(() => {
    if (options.length === 0) return [];
    const charNames = Object.keys(CHARACTER_CHIBIS);
    const shuffled = [...charNames].sort(() => Math.random() - 0.5);
    return options.map((_, i) => CHARACTER_CHIBIS[shuffled[i % shuffled.length]]);
  }, [options]);

  // 选项栏显示条件：有选项 + 未关闭 + 剧本播完
  const showOptions = options.length > 0 && !optionsDismissed &&
    currentIndex >= script.length - 1 && !isTyping;

  // 当前场景的地点信息（用于判断NSFW触发条件）
  const sceneLocation = useMemo(() => {
    const line = script[currentIndex];
    if (line?.location) {
      return { parent: line.location.parent, spot: line.location.spot };
    }
    return { parent: currentLocation, spot: undefined };
  }, [script, currentIndex, currentLocation]);

  // ── useCallback 缓存事件处理函数，避免子组件不必要的重渲染 ──

  useEffect(() => {
    if (targetFloorId == null) return;
    // 楼层切换时重置 NSFW 状态
    resetNsfw();
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
        setSceneCharacters([]); // 重置场景
        prevLocationKeyRef.current = null; // 重置场景跟踪

        // ── 预加载所有立绘 ──
        parsed.forEach(line => {
          if (line.sprite) {
            const img = new Image();
            img.src = line.sprite;
          }
        });

        // ── 预加载所有场景背景图（白日+夜晚） ──
        const sceneLocations = new Set<string>();
        parsed.forEach(line => {
          if (line.location?.parent) {
            // 如果没有子地点，用父地点作为子地点查找
            const spotName = line.location.spot || line.location.parent;
            const key = `${line.location.parent}/${spotName}`;
            if (!sceneLocations.has(key)) {
              sceneLocations.add(key);
              // 使用 getLocationImageData 获取图片数据，支持 <user>→玩家名 模糊匹配
              const imgData = getLocationImageData(line.location.parent, spotName, playerName);
              if (imgData) {
                const dayImg = new Image();
                dayImg.src = imgData.day;
                const nightImg = new Image();
                nightImg.src = imgData.night;
              }
            }
          }
        });
      } else {
        setScript([]);
        setSceneCharacters([]);
      }
    } catch {
      console.warn('StoryView: 无法读取楼层', targetFloorId, '的消息文本');
      setScript([]);
      setSceneCharacters([]);
    }
  }, [targetFloorId, playerName]);

  const currentLine = script[currentIndex];

  // ── 成就触发：当玩家推进到带有 achievementTriggers 的行时触发解锁 ──
  useEffect(() => {
    if (!currentLine?.achievementTriggers) return;
    for (const rawId of currentLine.achievementTriggers) {
      unlockAchievement(rawId, targetFloorId ?? undefined);
    }
  }, [currentLine, targetFloorId, unlockAchievement]);

  // ── NSFW 阶段检测：当 currentLine 的 nsfwPhase 变化时自动触发 CG ──
  // 优先使用标签中指定的角色名 [nsfw:角色名:阶段名]，回退到地点匹配
  const nsfwChar = useMemo(() => {
    if (!currentLine?.nsfwPhase) return null;
    if (currentLine.nsfwCharacter) return currentLine.nsfwCharacter;
    return getCharacterByTriggerLocation(sceneLocation.parent, sceneLocation.spot);
  }, [currentLine?.nsfwPhase, currentLine?.nsfwCharacter, sceneLocation]);

  useEffect(() => {
    if (currentLine?.nsfwPhase && nsfwChar) {
      if (currentLine.nsfwPhase === '开始') {
        sfx.play('nsfwEnter');
      }
      triggerNsfwPhase(currentLine.nsfwPhase, nsfwChar);
    }
  }, [currentLine?.nsfwPhase, nsfwChar, triggerNsfwPhase]);

  // ── 从当前阅读进度中提取角色位置，覆盖日程表 ──
  // 遍历 0→currentIndex，每个角色最后出现的场景位置即为当前位置
  // 使用替换而非合并：只保留当前楼层出场的角色位置
  // 未出场角色不在 charLocs 中，会自动回退到日程表查询
  useEffect(() => {
    if (script.length === 0) return;
    const charLocs: Record<string, string> = {};
    const endIdx = Math.min(currentIndex, script.length - 1);
    for (let i = 0; i <= endIdx; i++) {
      const line = script[i];
      // 只从有 speaker 的行提取（旁白无 speaker，跳过）
      if (!line.speaker || line.speaker === '<user>' || line.speaker === '我') continue;
      if (line.location) {
        // 用 parent/spot 格式存储，以区分不同父地点下的同名子位置（如"主卧"）
        const loc = line.location.spot
          ? `${line.location.parent}/${line.location.spot}`
          : line.location.parent;
        if (loc) {
          charLocs[line.speaker] = loc;
        }
      }
    }
    // 替换：只保留当前楼层出场的角色位置
    // 未出场的角色不在 charLocs 中 → getCharacterLocation 会回退到日程表
    // 如果当前楼层还没解析到任何角色位置（如纯旁白），保留之前的状态
    if (Object.keys(charLocs).length > 0) {
      setScriptCharacterLocations(charLocs);
    }
  }, [script, currentIndex, setScriptCharacterLocations]);

  // ── 更新场景角色（当 currentLine 变化时） ──
  // 场景切换时清空所有立绘，只保留当前说话角色；同场景内保留多角色并暗化非说话角色
  useEffect(() => {
    // 计算当前行的场景标识，用于检测场景切换
    const loc = currentLine?.location;
    const currentLocationKey = loc ? `${loc.parent}/${loc.spot || ''}` : null;
    const locationChanged = currentLocationKey !== prevLocationKeyRef.current;
    prevLocationKeyRef.current = currentLocationKey;

    // 旁白处理
    if (!currentLine?.speaker || currentLine.type === 'narrator') {
      if (locationChanged) {
        // 场景切换 + 旁白：清空所有立绘
        setSceneCharacters([]);
      } else {
        // 同场景旁白：只暗化现有角色
        setSceneCharacters(prev => prev.map(c => ({ ...c, isActive: false })));
      }
      return;
    }

    const emotion = currentLine.emotion || '默认';
    const sprite = currentLine.sprite || '';

    // 场景切换：清空后只显示当前说话角色
    if (locationChanged) {
      setSceneCharacters([{
        speaker: currentLine.speaker!,
        emotion,
        sprite,
        position: 'center',
        isActive: true,
      }]);
      return;
    }

    // 同场景内更新
    setSceneCharacters(prev => {
      const existingIndex = prev.findIndex(c => c.speaker === currentLine.speaker);

      if (existingIndex >= 0) {
        // 更新已有角色的情绪和 sprite
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          emotion,
          sprite: sprite || updated[existingIndex].sprite,
          isActive: true,
        };
        // 其他角色设为非活跃
        return updated.map((c, i) => ({ ...c, isActive: i === existingIndex }));
      } else {
        // 新角色加入场景
        const newChar: SceneCharacter = {
          speaker: currentLine.speaker!,
          emotion,
          sprite,
          position: prev.length === 0 ? 'center' : prev.length === 1 ? 'right' : 'left',
          isActive: true,
        };
        // 最多同时显示 3 个角色，移除同位置的旧角色
        const next = [...prev.filter(c => c.position !== newChar.position), newChar];
        const sliced = next.slice(-3);
        return sliced.map((c, i) => ({ ...c, isActive: i === sliced.length - 1 }));
      }
    });
  }, [currentLine]);

  // ── 情绪音效：对话行切换时播放对应情绪音 ──
  useEffect(() => {
    if (!currentLine || currentLine.type === 'narrator') return;
    if (currentLine.emotion && currentLine.emotion !== '默认') {
      sfx.playEmotion(currentLine.emotion);
    }
  }, [currentLine]);

  // 打字机效果
  useEffect(() => {
    let rafId: number;
    let cancelled = false;

    skipTypingRef.current = false;

    if (currentLine && currentIndex < script.length) {
      // 瞬间显示模式或快进模式：跳过打字机动画
      if (textSpeed === 0 || isFastForwardingRef.current) {
        setDisplayedText(currentLine.text);
        setIsTyping(false);
        return;
      }

      setIsTyping(true);
      setDisplayedText("");

      const fullText = currentLine.text;
      let i = 0;
      const delay = getTextDelay(textSpeed);
      let lastTime = performance.now();

      const typeChar = (timestamp: number) => {
        if (cancelled || skipTypingRef.current) {
          if (!cancelled) {
            setDisplayedText(fullText);
            setIsTyping(false);
          }
          return;
        }

        const elapsed = timestamp - lastTime;
        if (elapsed < delay) {
          rafId = requestAnimationFrame(typeChar);
          return;
        }

        lastTime = timestamp;

        if (i < fullText.length) {
          // 快速模式下批量出字
          const batchSize = textSpeed >= 3 ? 3 : 1;
          const endIndex = Math.min(i + batchSize, fullText.length);
          setDisplayedText(fullText.substring(0, endIndex));
          // 打字机 blip — 仅对话/心理行播放，旁白不响
          if (currentLine.type !== 'narrator') {
            sfx.playBlip(currentLine.speaker);
          }
          i = endIndex;
          rafId = requestAnimationFrame(typeChar);
        } else {
          setIsTyping(false);
        }
      };

      rafId = requestAnimationFrame(typeChar);
    }
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentIndex, currentLine, script.length, textSpeed]);

  // Auto 模式
  useEffect(() => {
    if (isAutoMode && !isTyping && currentIndex < script.length - 1) {
      const baseWait = Math.min(3000, Math.max(1000, (currentLine?.text.length || 0) * 100));
      const waitTime = baseWait * autoWaitMultiplier;
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, waitTime);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAutoMode, isTyping, currentIndex, script.length, currentLine, autoWaitMultiplier]);

  // 快进模式（Ctrl 按住时自动翻页）
  useEffect(() => {
    if (isFastForwarding && !isTyping && !showOptions && !showBacklog && !isTextBoxCollapsed) {
      const timer = setTimeout(() => {
        if (currentIndex < script.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else if (canNextFloor && navIndex >= 0) {
          sfx.play('pageTurn');
          if (navIndex + 1 === availableFloors.length - 1) {
            setViewingFloor(null);
          } else {
            setViewingFloor(availableFloors[navIndex + 1]);
          }
        } else {
          // 无更多内容，停止快进
          setIsFastForwarding(false);
        }
      }, 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFastForwarding, isTyping, showOptions, showBacklog, isTextBoxCollapsed, currentIndex, script.length, canNextFloor, navIndex, availableFloors, setViewingFloor]);

  // ── 键盘映射（galgame 风格：D/→ 前进，A/← 后退，Ctrl 快进）──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 不干扰输入框
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      // 选项面板/历史记录/文本框收起时不响应
      if (showOptions || showBacklog || isTextBoxCollapsed) return;
      // 有遮罩（小手机/模态框等）打开时不响应
      if (isPhoneOpen || (window as any).__anyOverlayOpen__) return;

      // Ctrl = 快进
      if (e.key === 'Control') {
        if (!isFastForwarding) {
          e.preventDefault();
          setIsFastForwarding(true);
          // 立即完成当前打字
          if (isTyping && currentLine) {
            skipTypingRef.current = true;
            setDisplayedText(currentLine.text);
            setIsTyping(false);
          }
        }
        return;
      }

      // D / → = 前进（不响应按键重复）
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        if (e.repeat) return;
        e.preventDefault();
        setIsFastForwarding(false); // 手动操作时停止快进
        if (isTyping && currentLine) {
          // 第一次按：完成打字
          skipTypingRef.current = true;
          setDisplayedText(currentLine.text);
          setIsTyping(false);
        } else if (currentIndex < script.length - 1) {
          // 下一句
          sfx.play('click');
          setCurrentIndex(prev => prev + 1);
        } else if (canNextFloor && navIndex >= 0) {
          // 本楼层最后一句：下一楼层
          sfx.play('pageTurn');
          if (navIndex + 1 === availableFloors.length - 1) {
            setViewingFloor(null);
          } else {
            setViewingFloor(availableFloors[navIndex + 1]);
          }
        }
        return;
      }

      // A / ← = 后退（不响应按键重复）
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        if (e.repeat) return;
        e.preventDefault();
        setIsFastForwarding(false); // 手动操作时停止快进
        if (currentIndex > 0) {
          // 上一句
          setCurrentIndex(prev => prev - 1);
        } else if (canPrevFloor && navIndex > 0) {
          // 本楼层第一句：上一楼层
          sfx.play('pageTurn');
          setViewingFloor(availableFloors[navIndex - 1]);
        }
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsFastForwarding(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    showOptions, showBacklog, isTextBoxCollapsed, isFastForwarding, isPhoneOpen,
    isTyping, currentLine, currentIndex, script.length,
    canNextFloor, canPrevFloor, navIndex, availableFloors, setViewingFloor,
  ]);

// ── 鼠标滚轮翻页（同方向键逻辑）──
const wheelLockRef = useRef(false);
useEffect(() => {
const handleWheel = (e: WheelEvent) => {
// 不干扰可滚动区域内的滚轮
const target = e.target as HTMLElement;
if (target.closest('.overflow-y-auto') || target.closest('.overflow-auto')) return;
// 选项面板/历史记录/文本框收起时不响应
if (showOptions || showBacklog || isTextBoxCollapsed) return;
// 非全屏时不响应滚轮翻页
const isFs = typeof (window as any).__TAVERN_SCRIPT_MODE__ !== 'undefined'
  ? !!(window as any).__isFullscreen__
  : !!document.fullscreenElement;
if (!isFs) return;
// 有遮罩（小手机/模态框等）打开时不响应
if (isPhoneOpen || (window as any).__anyOverlayOpen__) return;

      e.preventDefault();
      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      setTimeout(() => { wheelLockRef.current = false; }, 200);

      setIsFastForwarding(false);

      if (e.deltaY > 0) {
        // 向下滚 = 前进（同 D/→）
        if (isTyping && currentLine) {
          skipTypingRef.current = true;
          setDisplayedText(currentLine.text);
          setIsTyping(false);
        } else if (currentIndex < script.length - 1) {
          sfx.play('click');
          setCurrentIndex(prev => prev + 1);
        } else if (canNextFloor && navIndex >= 0) {
          sfx.play('pageTurn');
          if (navIndex + 1 === availableFloors.length - 1) {
            setViewingFloor(null);
          } else {
            setViewingFloor(availableFloors[navIndex + 1]);
          }
        }
      } else if (e.deltaY < 0) {
        // 向上滚 = 后退（同 A/←）
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        } else if (canPrevFloor && navIndex > 0) {
          sfx.play('pageTurn');
          setViewingFloor(availableFloors[navIndex - 1]);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [
    showOptions, showBacklog, isTextBoxCollapsed, isPhoneOpen,
    isTyping, currentLine, currentIndex, script.length,
    canNextFloor, canPrevFloor, navIndex, availableFloors, setViewingFloor,
  ]);

  const handleNext = useCallback(() => {
    if (!currentLine) return;
    if (isTyping) {
      skipTypingRef.current = true;
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      sfx.play('click');
      if (currentIndex < script.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        showToast("本章已读完", "normal");
      }
    }
  }, [currentLine, isTyping, currentIndex, script.length, showToast]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // ── 楼层翻页处理 ──
  const handlePrevFloor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canPrevFloor && navIndex > 0) {
      sfx.play('pageTurn');
      setViewingFloor(availableFloors[navIndex - 1]);
    }
  }, [canPrevFloor, navIndex, availableFloors, setViewingFloor]);

  const handleNextFloor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canNextFloor && navIndex >= 0) {
      sfx.play('pageTurn');
      // 翻到最后一层时恢复"跟随最新"，与 FloorSelector 语义一致
      if (navIndex + 1 === availableFloors.length - 1) {
        setViewingFloor(null);
      } else {
        setViewingFloor(availableFloors[navIndex + 1]);
      }
    }
  }, [canNextFloor, navIndex, availableFloors, setViewingFloor]);

  // ── 选中选项：写入输入框（复用 pendingMessage 管道，自动展开 ChatBar） ──
  const handleSelectOption = useCallback((option: string) => {
    sfx.play('confirm');
    setPendingMessage(option);
    setOptionsDismissed(true);
  }, [setPendingMessage]);

  // 当前情绪特效
  const currentEmotion = currentLine?.emotion || '默认';
  const screenEffect = EMOTION_EFFECTS[currentEmotion];

  // 场景背景图（从当前行的场景标签获取，根据游戏时间自动选择白日/夜晚）
  const sceneBackgroundUrl = useMemo(() => {
    if (nsfwCgUrl) return null;
    if (!currentLine?.location) return null;
    const { parent, spot } = currentLine.location;
    const spotName = spot || parent;
    return getLocationImage(parent, spotName, gameTime, playerName);
  }, [nsfwCgUrl, currentLine, gameTime, playerName]);

  // 无背景图时的文字提示
  const displayLocationName = useMemo(() => {
    if (currentLine?.location) {
      const { parent, spot } = currentLine.location;
      return spot ? `${parent} · ${spot}` : parent;
    }
    return currentLocation || '未知地点';
  }, [currentLine, currentLocation]);

  if (!currentLine) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-pop-black">
        <p className="text-white text-xl font-bold">等待剧情内容...</p>
      </div>
    );
  }

  // ── 手机端 GBF 式布局：上半视觉区(55%) + 下半操作区(45%) ──
  if (isMobile) {
    return (
      <div className="flex flex-col w-full h-full overflow-hidden font-sans contain-strict">

        {/* ════ 上半视觉区 ════ */}
        <div
          className="relative h-[60%] overflow-hidden shrink-0"
          onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartRef.current == null) return;
            const deltaX = e.changedTouches[0].clientX - touchStartRef.current;
            const threshold = 50;
            touchStartRef.current = null;
            if (isPhoneOpen || (window as any).__anyOverlayOpen__) return;
            if (showOptions || showBacklog || isTextBoxCollapsed) return;

            if (deltaX < -threshold) {
              // 左滑 = 前进
              if (isTyping && currentLine) {
                skipTypingRef.current = true;
                setDisplayedText(currentLine.text);
                setIsTyping(false);
              } else if (currentIndex < script.length - 1) {
                sfx.play('click');
                setCurrentIndex(prev => prev + 1);
              } else if (canNextFloor && navIndex >= 0) {
                sfx.play('pageTurn');
                if (navIndex + 1 === availableFloors.length - 1) {
                  setViewingFloor(null);
                } else {
                  setViewingFloor(availableFloors[navIndex + 1]);
                }
              }
            } else if (deltaX > threshold) {
              // 右滑 = 后退
              if (currentIndex > 0) {
                sfx.play('click');
                setCurrentIndex(prev => prev - 1);
              } else if (canPrevFloor && navIndex > 0) {
                sfx.play('pageTurn');
                setViewingFloor(availableFloors[navIndex - 1]);
              }
            }
          }}
        >
          {/* 背景层 — CG 用 contain+模糊填充，场景图用 cover */}
          <div className="absolute inset-0 z-0">
            {(() => {
              // NSFW CG：contain + 模糊背景填充
              if (nsfwCgUrl) {
                return (
                  <div className="absolute inset-0 bg-pop-black overflow-hidden">
                    {/* CG 完整显示 */}
                    <AnimatePresence mode="sync">
                      <motion.img
                        key={nsfwCgUrl}
                        src={nsfwCgUrl}
                        alt="NSFW CG"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 w-full h-full object-contain"
                        decoding="async"
                      />
                    </AnimatePresence>
                  </div>
                );
              }
              // 场景背景图 — contain + 模糊背景填充（和 CG 一样，不裁剪）
              if (sceneBackgroundUrl) {
                return (
                  <div className="absolute inset-0 overflow-hidden">
                    {/* 场景背景图铺满 */}
                    <AnimatePresence mode="sync">
                      <motion.img
                        key={sceneBackgroundUrl}
                        src={sceneBackgroundUrl}
                        alt="场景背景"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover"
                        decoding="async"
                      />
                    </AnimatePresence>
                  </div>
                );
              }
              // 无背景图
              return (
                <div className="w-full h-full bg-pop-black flex items-center justify-center">
                  <div className="text-white/30 text-xl font-black">
                    {displayLocationName}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 天气叠层 */}
          <WeatherOverlay gameTime={gameTime} isOutdoor={(() => {
            if (!currentLine?.location) return false;
            const spotName = currentLine.location.spot || currentLine.location.parent;
            return isOutdoorLocation(spotName) || isOutdoorLocation(currentLine.location.parent);
          })()} />

          {/* 立绘层 — 限制在上半区内 */}
          <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
            <AnimatePresence mode="popLayout">
              {!nsfwCgUrl && sceneCharacters.map((char) => (
                <motion.div
                  key={char.speaker}
                  className={cn(
                    "absolute bottom-0 w-full h-full flex items-end justify-center transition-all duration-300 pointer-events-none",
                    // 多角色时 center 退化为 left，避免与 right 角色重叠
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
                    <img
                      src={char.sprite}
                      alt={`${char.speaker}-${char.emotion}`}
                      className={cn(
                        "max-h-[80%] object-contain object-bottom",
                        sceneCharacters.length <= 1 ? "max-w-full" : sceneCharacters.length === 2 ? "max-w-[45%]" : "max-w-[31%]",
                      )}
                      style={{
                        maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                        filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                      }}
                      loading="eager"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 情绪特效 */}
          <div className="absolute inset-0 z-18 pointer-events-none">
            {screenEffect?.shake && (
              <motion.div
                animate={{ x: [0, -4, 4, -4, 4, 0] }}
                transition={{ duration: 0.25 }}
                className="w-full h-full"
              />
            )}
            {screenEffect?.vignette && (
              <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 200px ${screenEffect.vignette}` }} />
            )}
            {screenEffect?.flashColor && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
                style={{ backgroundColor: screenEffect.flashColor }}
              />
            )}
          </div>

          {/* 平行事件面板 */}
          <AnimatePresence mode="wait">
            {parallelEvents.length > 0 && showParallelEvents && (
              <motion.div
                key="pe-mobile-expanded"
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-2 left-2 z-30 max-w-60 pointer-events-auto"
              >
                <div className="bg-pop-black/90 backdrop-blur-md border-2 border-pop-cyan rounded-lg shadow-[3px_3px_0_rgba(0,229,255,0.3)] overflow-hidden">
                  <div className="flex items-center justify-between bg-pop-cyan/90 px-2 py-1 border-b-2 border-pop-black">
                    <div className="flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-pop-black" />
                      <span className="font-black text-xs text-pop-black tracking-tight">平行事件</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowParallelEvents(false); }}
                      className="text-pop-black hover:scale-110 active:scale-90 transition-transform"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {parallelEvents.map((evt, i) => (
                      <div key={i} className="border-l-2 border-pop-pink pl-1.5">
                        <div className="text-pop-yellow text-xs font-black leading-tight mb-0.5">{evt.location}</div>
                        <div className="text-white/80 text-xs leading-snug">{evt.event}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {parallelEvents.length > 0 && !showParallelEvents && (
              <motion.button
                key="pe-mobile-collapsed"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); setShowParallelEvents(true); }}
                className="absolute top-2 left-2 z-30 bg-pop-black/90 border-2 border-pop-cyan p-1 rounded-lg hover:scale-110 active:scale-90 transition-transform pointer-events-auto"
                title="展开平行事件"
              >
                <Radio className="w-3.5 h-3.5 text-pop-cyan" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* 视觉区底部渐变 — 与操作区自然过渡 */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-pop-black to-transparent z-19 pointer-events-none" />
        </div>

        {/* ════ 下半操作区 ════ */}
        <div className="flex-1 bg-pop-black flex flex-col relative overflow-hidden min-h-0">
          {/* 文字区 — 点击翻页 */}
          <div
            className="flex-1 flex flex-col px-3 pt-2 pb-1 cursor-pointer min-h-0"
            onClick={() => {
              handleNext();
            }}
          >
            {/* 名字标签 */}
            <AnimatePresence mode="wait">
              {currentLine.type !== 'narrator' && (
                <motion.div
                  key={currentLine.speaker}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex items-center gap-2 mb-1 shrink-0"
                >
                  {currentLine.avatar && (
                    <div className={`w-9 h-9 bg-white pop-border border-4 flex items-center justify-center overflow-hidden clip-diagonal relative transform -skew-x-6 ${currentLine.color === 'bg-white' ? 'border-pop-yellow' : 'border-pop-black'}`}>
                      <img src={currentLine.avatar} alt="avatar" className="w-full h-full object-cover object-top scale-110" />
                    </div>
                  )}
                  <div className={`px-3 py-0.5 pop-border border-4 text-xl font-black italic -skew-x-6 text-pop-black shadow-[2px_2px_0_#fff] ${currentLine.color === 'bg-white' ? 'bg-pop-yellow' : currentLine.color}`}>
                    {displayName(currentLine.speaker!, playerName)}
                    {currentLine.emotion && currentLine.emotion !== '默认' && (
                      <span className="ml-1 text-xs font-normal opacity-70">[{currentLine.emotion}]</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 文字内容 — 可滚动 */}
            <div
              className={`flex-1 overflow-y-auto hide-scrollbar text-xl font-bold leading-relaxed tracking-wide min-h-0 ${currentLine.type === 'thought' ? 'text-blue-400' : 'text-white'}`}
            >
              {displayedText}
              {isTyping && <span className={`inline-block w-2 h-4 animate-pulse ml-1 align-middle ${currentLine.type === 'thought' ? 'bg-blue-400' : 'bg-white'}`} />}
            </div>
          </div>

          {/* 按钮组 — 横向可滚动 */}
          <div className="flex items-center gap-1 px-2 pb-2 pt-1 shrink-0 overflow-x-auto hide-scrollbar">
            <PopButton variant="ghost" size="sm" className="gap-1 bg-white/10 text-white hover:bg-white/20 pop-border border-white shadow-none shrink-0" onClick={(e) => { e.stopPropagation(); setShowBacklog(true); }}>
              <History className="w-3.5 h-3.5" />
            </PopButton>
            <PopButton variant="ghost" size="sm" className="gap-1 bg-white/10 text-white hover:bg-white/20 pop-border border-white shadow-none shrink-0" onClick={handlePrev} disabled={currentIndex === 0}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </PopButton>
            <PopButton
              variant="ghost"
              size="sm"
              className={`gap-1 pop-border border-white shadow-none shrink-0 ${isAutoMode ? 'bg-pop-pink text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={(e) => { e.stopPropagation(); setIsAutoMode(prev => !prev); }}
            >
              {isAutoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </PopButton>
            <PopButton
              variant="ghost"
              size="sm"
              className="gap-1 bg-white/10 text-white hover:bg-white/20 pop-border border-white shadow-none shrink-0"
              onClick={(e) => { e.stopPropagation(); const next = textSpeed >= 3 ? 1 : textSpeed + 1; textSettings.setTextSpeed(next); }}
              title={`速度: ${textSpeed === 0 ? '瞬间' : textSpeed === 1 ? '慢' : textSpeed === 2 ? '普通' : '快'}`}
            >
              {textSpeed >= 3 ? <Zap className="w-3.5 h-3.5 text-pop-yellow" /> : <FastForward className="w-3.5 h-3.5" />}
            </PopButton>

            {/* 楼层翻页 — 靠右 */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <PopButton
                variant="ghost"
                size="sm"
                className={cn("gap-1 pop-border border-white shadow-none shrink-0", canPrevFloor ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-600 text-gray-400 cursor-not-allowed")}
                onClick={handlePrevFloor}
                disabled={!canPrevFloor}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </PopButton>
              <PopButton
                variant="ghost"
                size="sm"
                className={cn("gap-1 pop-border border-white shadow-none shrink-0", canNextFloor ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-600 text-gray-400 cursor-not-allowed")}
                onClick={handleNextFloor}
                disabled={!canNextFloor}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </PopButton>
              {!isTyping && (
                <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="shrink-0">
                  <ChevronRight className="w-6 h-6 text-pop-yellow" />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* 选项面板 — 全屏覆盖 */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-35 bg-pop-black/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-halftone opacity-20 pointer-events-none" />
              <button
                onClick={() => setOptionsDismissed(true)}
                className="absolute top-4 right-4 z-40 p-2 bg-pop-yellow text-pop-black pop-border clip-diagonal hover:scale-110 transition-transform shadow-pop-pink font-black"
                title="关闭选项"
              >
                <X className="w-5 h-5" />
              </button>
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
                className="w-full max-w-2xl flex flex-col gap-2 relative z-10"
              >
                {options.map((option, i) => {
                  const colorScheme = i % 3 === 0
                    ? "bg-pop-pink text-white shadow-pop-cyan"
                    : i % 3 === 1
                      ? "bg-pop-cyan text-pop-black shadow-pop-pink"
                      : "bg-pop-yellow text-pop-black shadow-pop-pink";
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, type: "spring", damping: 18 }}
                      onClick={() => handleSelectOption(option)}
                      className={cn(
                        "flex items-center gap-3 p-3 pop-border clip-diagonal font-black text-left",
                        "hover:scale-[1.03] active:translate-x-1 active:translate-y-1 active:shadow-none",
                        "transition-all duration-150 group relative overflow-hidden",
                        colorScheme
                      )}
                    >
                      <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />
                      {optionChibis[i] && (
                        <div className="relative z-10 shrink-0 w-12 h-12 flex items-center justify-center">
                          <img
                            src={optionChibis[i]}
                            alt="chibi"
                            className="w-full h-full object-contain group-hover:scale-125 group-hover:-rotate-6 transition-transform drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                            loading="eager"
                          />
                        </div>
                      )}
                      <span className="relative z-10 flex-1 text-sm leading-snug">
                        {option}
                      </span>
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
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-full bg-pop-black/95 backdrop-blur-md z-50 pop-border border-l-0 flex flex-col border-r-4 border-pop-cyan shadow-[10px_0_0_rgba(0,229,255,0.2)]"
            >
              <div className="p-3 bg-pop-cyan text-pop-black font-black text-xl flex justify-between items-center clip-diagonal mx-2 mt-2 border-2 border-pop-black">
                <span>HISTORY LOG</span>
                <button onClick={() => setShowBacklog(false)} className="text-2xl hover:scale-110 active:scale-90 transition-transform">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {script.slice(0, currentIndex).map((log, idx) => (
                  <div key={idx} className="space-y-2 border-b-2 border-pop-black pb-4 relative">
                    {log.type === 'narrator' ? (
                      <div className="text-white text-base bg-white/5 p-3 clip-diagonal border border-white/10">{log.text}</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {log.avatar && <img src={log.avatar} alt="avatar" className="w-8 h-8 pop-border rounded-full object-cover object-top" />}
                          <div className={`font-black text-sm px-2 py-0.5 pop-border -skew-x-6 ${log.color === 'bg-white' ? 'bg-pop-yellow text-pop-black' : `${log.color} text-pop-black`}`}>
                            {displayName(log.speaker!, playerName)}
                            {log.emotion && log.emotion !== '默认' && (
                              <span className="ml-1 opacity-70">[{log.emotion}]</span>
                            )}
                          </div>
                        </div>
                        <div className={`text-base font-bold pl-10 ${log.type === 'thought' ? 'text-blue-300' : 'text-white'}`}>
                          {log.text}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── 桌面端布局（原有代码不变）──
  return (
    <div className="relative w-full h-full overflow-hidden font-sans contain-strict">

      {/* 全屏背景层 — 场景背景图，随阅读进度切换 */}
      <div className="absolute inset-0 z-0">
        {(() => {
          // NSFW 模式下显示 CG 背景（全屏铺满）
          if (nsfwCgUrl) {
            return (
              <img
                src={nsfwCgUrl}
                alt="NSFW CG"
                className="w-full h-full object-cover"
                style={{ willChange: 'transform' }}
                decoding="async"
              />
            );
          }
          // 场景背景图（带 crossfade 过渡）
          if (sceneBackgroundUrl) {
            return (
              <AnimatePresence mode="sync">
                <motion.img
                  key={sceneBackgroundUrl}
                  src={sceneBackgroundUrl}
                  alt="场景背景"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="w-full h-full object-cover absolute inset-0"
                  style={{ willChange: 'transform' }}
                  decoding="async"
                />
              </AnimatePresence>
            );
          }
          // 无背景图时显示纯色背景 + 地点名称
          return (
            <div className="w-full h-full bg-pop-black flex items-center justify-center">
              <div className="text-white/30 text-2xl font-black">
                {displayLocationName}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 天气视觉叠层 — 叠在背景图上方、渐变遮罩下方 */}
      <WeatherOverlay gameTime={gameTime} isOutdoor={(() => {
        if (!currentLine?.location) return false;
        const spotName = currentLine.location.spot || currentLine.location.parent;
        return isOutdoorLocation(spotName) || isOutdoorLocation(currentLine.location.parent);
      })()} />

      {/* 底部渐变遮罩 — 让文本更易读 */}
      <div className="absolute inset-0 bg-linear-to-t from-pop-black via-transparent to-transparent z-10 pointer-events-none"></div>

      {/* Sprite Area — z-15（立绘层，在背景之上，对话框之下） */}
      <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
        <AnimatePresence mode="popLayout">
          {!nsfwCgUrl && sceneCharacters.map((char) => (
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
                <img
                  src={char.sprite}
                  alt={`${char.speaker}-${char.emotion}`}
                  className="h-full w-auto object-contain object-bottom"
                  style={{
                    // 底部渐变透明，自然融入对话框
                    maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                    filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
                  }}
                  loading="eager"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Screen Effects Layer — z-[18] */}
      <div className="absolute inset-0 z-18 pointer-events-none">
        {/* 震动效果 */}
        {screenEffect?.shake && (
          <motion.div
            animate={{ x: [0, -4, 4, -4, 4, 0] }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          />
        )}
        {/* 暗角效果 */}
        {screenEffect?.vignette && (
          <div
            className="absolute inset-0"
            style={{ boxShadow: `inset 0 0 200px ${screenEffect.vignette}` }}
          />
        )}
        {/* 闪白效果 */}
        {screenEffect?.flashColor && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
            style={{ backgroundColor: screenEffect.flashColor }}
          />
        )}
      </div>

      {/* 平行事件面板 — 桌面端 */}
      <AnimatePresence mode="wait">
        {parallelEvents.length > 0 && showParallelEvents && (
          <motion.div
            key="pe-desktop-expanded"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-4 z-30 max-w-65 pointer-events-auto"
          >
            <div className="bg-pop-black/90 backdrop-blur-md border-2 border-pop-cyan rounded-lg shadow-[4px_4px_0_rgba(0,229,255,0.3)] overflow-hidden">
              <div className="flex items-center justify-between bg-pop-cyan/90 px-3 py-1.5 border-b-2 border-pop-black">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-pop-black" />
                  <span className="font-black text-sm text-pop-black tracking-tight">平行事件</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowParallelEvents(false); }}
                  className="text-pop-black hover:scale-110 active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2.5 space-y-2">
                {parallelEvents.map((evt, i) => (
                  <div key={i} className="border-l-2 border-pop-pink pl-2">
                    <div className="text-pop-yellow text-sm font-black leading-tight mb-1">{evt.location}</div>
                    <div className="text-white/80 text-sm leading-snug">{evt.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {parallelEvents.length > 0 && !showParallelEvents && (
          <motion.button
            key="pe-desktop-collapsed"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setShowParallelEvents(true); }}
            className="absolute top-4 left-4 z-30 bg-pop-black/90 border-2 border-pop-cyan p-1.5 rounded-lg hover:scale-110 active:scale-90 transition-transform pointer-events-auto"
            title="展开平行事件"
          >
            <Radio className="w-4 h-4 text-pop-cyan" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Text Box Area — 绝对定位悬浮在底部 */}
      <AnimatePresence mode="wait">
        {isTextBoxCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 z-30"
          >
            <button
              onClick={() => setIsTextBoxCollapsed(false)}
              className="p-2 bg-pop-black/90 border-2 border-pop-pink text-white hover:bg-pop-pink transition-colors clip-diagonal shadow-pop-pink"
              title="展开文本框"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 cursor-pointer"
            onClick={handleNext}
          >
            {/* 折叠按钮 */}
            <div className="absolute -top-3 right-6 md:right-12 z-40">
              <button
                onClick={(e) => { e.stopPropagation(); setIsTextBoxCollapsed(true); }}
                className="p-1 bg-pop-black/70 text-white hover:bg-pop-pink transition-colors clip-diagonal border border-white/30"
                title="折叠文本框"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Name Tag + Avatar */}
            <AnimatePresence mode="wait">
              {currentLine.type !== 'narrator' && (
                <motion.div
                  key={currentLine.speaker}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="absolute -top-12 md:-top-16 left-6 md:left-12 z-30 flex items-end gap-3 drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
                >
                  {currentLine.avatar && (
                    <div className={`w-16 h-16 md:w-20 md:h-20 bg-white pop-border border-4 flex items-center justify-center overflow-hidden clip-diagonal relative transform -skew-x-6 ${currentLine.color === 'bg-white' ? 'border-pop-yellow' : 'border-pop-black'}`}>
                      <img src={currentLine.avatar} alt="avatar" className="w-full h-full object-cover object-top scale-110" />
                    </div>
                  )}

                  <div className={`px-4 md:px-6 py-1 md:py-2 pop-border border-4 text-xl md:text-2xl font-black italic -skew-x-6 text-pop-black mb-1 shadow-[2px_2px_0_#fff] ${currentLine.color === 'bg-white' ? 'bg-pop-yellow' : currentLine.color}`}>
                    {displayName(currentLine.speaker!, playerName)}
                    {currentLine.emotion && currentLine.emotion !== '默认' && (
                      <span className="ml-2 text-sm font-normal opacity-70">[{currentLine.emotion}]</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Text Box */}
            <div
              className="h-full w-full relative flex flex-col p-4"
              style={{ paddingTop: currentLine.type === 'narrator' ? '1.5rem' : '3.5rem' }}
            >

              <div
                className={`flex-1 overflow-y-auto hide-scrollbar text-xl md:text-[26px] font-bold leading-relaxed tracking-wide z-10 ${currentLine.type === 'thought' ? 'text-blue-400' : 'text-white'}`}
                style={{ willChange: 'contents' }}
              >
                {displayedText}
                {isTyping && <span className={`inline-block w-3 h-6 animate-pulse ml-1 align-middle ${currentLine.type === 'thought' ? 'bg-blue-400' : 'bg-white'}`}></span>}
              </div>

              <div className="flex justify-between items-end mt-4 z-10">
                <div className="flex gap-2 flex-wrap">
                  <PopButton variant="ghost" size="sm" className="gap-2 bg-white/10 text-white hover:bg-white/20 pop-border border-white shadow-none" onClick={(e) => { e.stopPropagation(); setShowBacklog(true); }}>
                    <History className="w-4 h-4" /> 历史记录
                  </PopButton>
                  <PopButton variant="ghost" size="sm" className="gap-2 bg-white/10 text-white hover:bg-white/20 pop-border border-white shadow-none" onClick={handlePrev} disabled={currentIndex === 0}>
                    <ChevronLeft className="w-4 h-4" /> 上一句
                  </PopButton>
                  <PopButton
                    variant="ghost"
                    size="sm"
                    className={`gap-2 pop-border border-white shadow-none ${isAutoMode ? 'bg-pop-pink text-white hover:bg-pop-pink/80' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    onClick={(e) => { e.stopPropagation(); setIsAutoMode(prev => !prev); }}
                    title={isAutoMode ? '关闭 Auto 模式' : '开启 Auto 模式'}
                  >
                    {isAutoMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isAutoMode ? 'Auto 开' : 'Auto'}</span>
                  </PopButton>
                  <PopButton
                    variant="ghost"
                    size="sm"
                    className="gap-2 bg-white/10 text-white hover:bg-white/20 pop-border border-white shadow-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 在 慢(1)→普通(2)→快(3) 之间循环（瞬间(0)只在设置面板中选）
                      const next = textSpeed >= 3 ? 1 : textSpeed + 1;
                      textSettings.setTextSpeed(next);
                    }}
                    title={`当前速度: ${textSpeed === 0 ? '瞬间' : textSpeed === 1 ? '慢' : textSpeed === 2 ? '普通' : '快'}`}
                  >
                    {textSpeed >= 3 ? <Zap className="w-4 h-4 text-pop-yellow" /> : <FastForward className="w-4 h-4" />}
                    <span className="hidden sm:inline">{textSpeed === 0 ? '瞬间' : textSpeed === 1 ? '慢' : textSpeed === 2 ? '普通' : '快'}</span>
                  </PopButton>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* 楼层翻页 — 靠右，不破坏左侧按钮排布 */}
                  <PopButton
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-1 pop-border border-white shadow-none",
                      canPrevFloor ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    )}
                    onClick={handlePrevFloor}
                    disabled={!canPrevFloor}
                    title="上一楼层"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">上层</span>
                  </PopButton>
                  <PopButton
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-1 pop-border border-white shadow-none",
                      canNextFloor ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    )}
                    onClick={handleNextFloor}
                    disabled={!canNextFloor}
                    title="下一楼层"
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">下层</span>
                  </PopButton>
                  {/* 箭头提示 */}
                  {!isTyping && (
                    <motion.div
                      animate={{ x: [0, 8, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <ChevronRight className="w-10 h-10 text-pop-yellow" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Panel — galgame 风格：全屏波普遮罩 + 屏幕中央选项列表 */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-35 bg-pop-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            {/* 半色调波点装饰层 */}
            <div className="absolute inset-0 bg-halftone opacity-20 pointer-events-none" />

            {/* 关闭按钮 */}
            <button
              onClick={() => setOptionsDismissed(true)}
              className="absolute top-4 right-4 z-40 p-2 bg-pop-yellow text-pop-black pop-border clip-diagonal hover:scale-110 transition-transform shadow-pop-pink font-black"
              title="关闭选项"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 选项列表 — 从屏幕中央展开 */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
              className="w-full max-w-2xl flex flex-col gap-3 relative z-10"
            >
              {options.map((option, i) => {
                // 交替使用不同波普配色
                const colorScheme = i % 3 === 0
                  ? "bg-pop-pink text-white shadow-pop-cyan"
                  : i % 3 === 1
                    ? "bg-pop-cyan text-pop-black shadow-pop-pink"
                    : "bg-pop-yellow text-pop-black shadow-pop-pink";
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, type: "spring", damping: 18 }}
                    onClick={() => handleSelectOption(option)}
                    className={cn(
                      "flex items-center gap-4 p-4 pop-border clip-diagonal font-black text-left",
                      "hover:scale-[1.03] active:translate-x-1 active:translate-y-1 active:shadow-none",
                      "transition-all duration-150 group relative overflow-hidden",
                      colorScheme
                    )}
                  >
                    {/* 半色调纹理 */}
                    <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

                    {/* Q版小人 */}
                    {optionChibis[i] && (
                      <div className="relative z-10 shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                        <img
                          src={optionChibis[i]}
                          alt="chibi"
                          className="w-full h-full object-contain group-hover:scale-125 group-hover:-rotate-6 transition-transform drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)]"
                          loading="eager"
                        />
                      </div>
                    )}
                    <span className="relative z-10 flex-1 text-base md:text-xl leading-snug">
                      {option}
                    </span>
                    <ChevronRight className="relative z-10 w-7 h-7 md:w-8 md:h-8 shrink-0 group-hover:translate-x-2 transition-transform" />
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backlog Sidebar */}
      <AnimatePresence>
        {showBacklog && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 left-0 w-full md:w-100 bg-pop-black/95 backdrop-blur-md z-50 pop-border border-l-0 flex flex-col border-r-4 border-pop-cyan shadow-[10px_0_0_rgba(0,229,255,0.2)]"
          >
            <div className="p-4 bg-pop-cyan text-pop-black font-black text-2xl flex justify-between items-center clip-diagonal mx-2 mt-2 border-2 border-pop-black">
              <span>HISTORY LOG</span>
              <button onClick={() => setShowBacklog(false)} className="text-3xl hover:scale-110 active:scale-90 transition-transform">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {script.slice(0, currentIndex).map((log, idx) => (
                <div key={idx} className="space-y-2 border-b-2 border-pop-black pb-4 relative">
                  {log.type === 'narrator' ? (
                    <div className="text-white text-lg bg-white/5 p-3 clip-diagonal border border-white/10">{log.text}</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {log.avatar && <img src={log.avatar} alt="avatar" className="w-8 h-8 pop-border rounded-full object-cover object-top" />}
                        <div className={`font-black text-sm px-2 py-0.5 pop-border -skew-x-6 ${log.color === 'bg-white' ? 'bg-pop-yellow text-pop-black' : `${log.color} text-pop-black`}`}>
                          {displayName(log.speaker!, playerName)}
                          {log.emotion && log.emotion !== '默认' && (
                            <span className="ml-1 opacity-70">[{log.emotion}]</span>
                          )}
                        </div>
                      </div>
                      <div className={`text-lg font-bold pl-10 ${log.type === 'thought' ? 'text-blue-300' : 'text-white'}`}>
                        {log.text}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
