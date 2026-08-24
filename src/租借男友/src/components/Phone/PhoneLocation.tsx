/**
 * 地点图鉴 App — 波普风格
 *
 * 手机版地点图鉴，将大屏 LocationGalleryView 移植到手机界面。
 * - 地点按地图区域分组（住宅区/大学城/商业街区/市区/省外）
 * - 每个区域下父地点以手风琴式折叠，点击展开子地点缩略图网格
 * - 全屏查看器：昼夜切换 + 前后翻页（使用 Portal 突破手机容器 transform 限制）
 */

import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun, Moon, X, MapPin, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronR,
  Home, GraduationCap, Store, Building2, Train,
} from 'lucide-react';
import { LOCATION_IMAGES } from '../../data/locationImages';
import { AppHeader } from './PhoneShared';
import { cn } from '../../utils';

type TimeMode = 'day' | 'night';

// ── 地图区域分组（与 MapModal 中的 AREA_SPOTS 对应）──
type AreaGroup = {
  name: string;
  icon: React.ReactNode;
  color: string;
  locations: string[];
};

const AREA_GROUPS: AreaGroup[] = [
  {
    name: '住宅区',
    icon: <Home className="w-3.5 h-3.5" />,
    color: 'bg-pop-yellow text-pop-black',
    locations: ['沈家别墅', '傅霁公寓', '霍罗同居公寓', '陆时予公寓', '许不倦公寓'],
  },
  {
    name: '大学城',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    color: 'bg-pop-cyan text-pop-black',
    locations: ['燕大校区', '大学城公园'],
  },
  {
    name: '商业街区',
    icon: <Store className="w-3.5 h-3.5" />,
    color: 'bg-pop-pink text-white',
    locations: ['鹿角奶茶店', '二十四帧电影院', '辣当家麻辣烫', '落日居酒屋', '龙与骰子桌游卡牌店', '南门小吃街'],
  },
  {
    name: '市区',
    icon: <Building2 className="w-3.5 h-3.5" />,
    color: 'bg-white text-pop-black',
    locations: ['回头草咖啡', '云顶商场', '星河乐园', '利刃击剑会所', '铁砧兵击俱乐部', '季明舒公寓', '市立音乐厅', '姜氏集团总部', '市立福利院', '姜朝渔住所', '裴今歌住所', '织部宵公寓'],
  },
  {
    name: '省外',
    icon: <Train className="w-3.5 h-3.5" />,
    color: 'bg-pop-pink text-white',
    locations: ['周念安母亲菜摊', '温知晚家', '傅霁爷爷家'],
  },
];

export function PhoneLocation({ onExit }: { onExit: () => void }) {
  const [timeMode, setTimeMode] = useState<TimeMode>('day');
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState<{
    parentLocation: string;
    spotName: string;
    image: string;
  } | null>(null);

  // 扁平化所有地点图片为有序数组，用于全屏翻页
  const flatList = useMemo(() => {
    const list: { parentLocation: string; spotName: string; day: string; night: string }[] = [];
    for (const [parent, spots] of Object.entries(LOCATION_IMAGES)) {
      for (const [spot, imgs] of Object.entries(spots)) {
        list.push({ parentLocation: parent, spotName: spot, day: imgs.day, night: imgs.night });
      }
    }
    return list;
  }, []);

  const currentFlatIndex = fullscreen
    ? flatList.findIndex(item => item.parentLocation === fullscreen.parentLocation && item.spotName === fullscreen.spotName)
    : -1;

  const goToFlatIndex = useCallback((index: number) => {
    if (index < 0 || index >= flatList.length) return;
    const item = flatList[index];
    setFullscreen({
      parentLocation: item.parentLocation,
      spotName: item.spotName,
      image: timeMode === 'day' ? item.day : item.night,
    });
  }, [flatList, timeMode]);

  const handleToggleTime = () => {
    const newMode = timeMode === 'day' ? 'night' : 'day';
    setTimeMode(newMode);
    if (fullscreen && currentFlatIndex >= 0) {
      const item = flatList[currentFlatIndex];
      setFullscreen({
        ...fullscreen,
        image: newMode === 'day' ? item.day : item.night,
      });
    }
  };

  const toggleArea = (name: string) => {
    setExpandedArea(prev => prev === name ? null : name);
  };

  const toggleParent = (parent: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parent)) next.delete(parent);
      else next.add(parent);
      return next;
    });
  };

  // 获取每个区域的父地点 + 子地点
  const areaData = useMemo(() => {
    return AREA_GROUPS.map(group => {
      const locations = group.locations
        .filter(loc => LOCATION_IMAGES[loc])
        .map(loc => ({
          parent: loc,
          spots: Object.entries(LOCATION_IMAGES[loc]),
        }));
      return { ...group, locations };
    });
  }, []);

  const totalSpots = flatList.length;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-[#2a2a2a] flex flex-col z-10"
    >
      <AppHeader
        title="地点图鉴"
        color="bg-pop-cyan"
        onBack={onExit}
        rightIcon={
          <div className="flex items-center gap-0.5 bg-pop-black p-0.5 border-2 border-pop-black transform -skew-x-3">
            <button
              onClick={() => {
                setTimeMode('day');
                if (fullscreen && currentFlatIndex >= 0) {
                  const item = flatList[currentFlatIndex];
                  setFullscreen({ ...fullscreen, image: item.day });
                }
              }}
              className={cn(
                'px-2 py-0.5 font-black text-[10px] transition-colors flex items-center gap-1',
                timeMode === 'day' ? 'bg-pop-yellow text-pop-black' : 'bg-transparent text-gray-400 hover:text-white',
              )}
            >
              <Sun className="w-3 h-3" />
              白日
            </button>
            <button
              onClick={() => {
                setTimeMode('night');
                if (fullscreen && currentFlatIndex >= 0) {
                  const item = flatList[currentFlatIndex];
                  setFullscreen({ ...fullscreen, image: item.night });
                }
              }}
              className={cn(
                'px-2 py-0.5 font-black text-[10px] transition-colors flex items-center gap-1',
                timeMode === 'night' ? 'bg-pop-cyan text-pop-black' : 'bg-transparent text-gray-400 hover:text-white',
              )}
            >
              <Moon className="w-3 h-3" />
              夜晚
            </button>
          </div>
        }
      />

      {/* 统计栏 */}
      <div className="shrink-0 px-3 py-1.5 bg-pop-black/50 border-b border-white/5 flex items-center justify-between">
        <span className="text-gray-400 font-bold text-[10px]">
          共 {AREA_GROUPS.length} 个区域 · {totalSpots} 个场景
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExpandedArea(null);
              setExpandedParents(new Set());
            }}
            className="text-gray-400 font-black text-[10px] hover:text-white transition-colors"
          >
            全部收起
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={() => {
              setExpandedArea(AREA_GROUPS[0].name);
              const all = new Set<string>();
              AREA_GROUPS.forEach(g => g.locations.forEach(l => all.add(l)));
              setExpandedParents(all);
            }}
            className="text-pop-cyan font-black text-[10px] hover:text-white transition-colors"
          >
            全部展开
          </button>
        </div>
      </div>

      {/* 地点列表 — 区域分组 + 手风琴 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
        <div className="flex flex-col gap-1.5">
          {areaData.map(group => {
            const isAreaExpanded = expandedArea === group.name;
            const spotCount = group.locations.reduce((sum, l) => sum + l.spots.length, 0);
            return (
              <div key={group.name} className="overflow-hidden">
                {/* 区域标题 — 可点击展开/收起 */}
                <button
                  onClick={() => toggleArea(group.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 border-2 border-pop-black transition-colors',
                    isAreaExpanded ? group.color : 'bg-white/5 text-gray-300 hover:bg-white/10',
                  )}
                >
                  {group.icon}
                  <span className="font-black text-sm italic -skew-x-3">{group.name}</span>
                  <span className={cn(
                    'ml-auto px-1.5 py-0.5 font-black text-[10px] border',
                    isAreaExpanded ? 'bg-black/20 border-black/20' : 'bg-pop-black/50 text-gray-400 border-white/10',
                  )}>
                    {spotCount}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', isAreaExpanded ? 'rotate-0' : '-rotate-90')} />
                </button>

                {/* 区域内容 — 父地点手风琴 */}
                <AnimatePresence initial={false}>
                  {isAreaExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 p-1 pt-1.5">
                        {group.locations.map(({ parent, spots }) => {
                          const isParentExpanded = expandedParents.has(parent);
                          return (
                            <div key={parent} className="overflow-hidden">
                              {/* 父地点标题 */}
                              <button
                                onClick={() => toggleParent(parent)}
                                className={cn(
                                  'w-full flex items-center gap-2 px-2.5 py-1.5 border border-pop-black/50 transition-colors',
                                  isParentExpanded ? 'bg-pop-pink text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10',
                                )}
                              >
                                {isParentExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                  : <ChevronR className="w-3.5 h-3.5 shrink-0" />}
                                <MapPin className={cn('w-3 h-3 shrink-0', isParentExpanded ? 'text-white' : 'text-pop-pink')} />
                                <span className="font-black text-xs italic -skew-x-3 truncate">{parent}</span>
                                <span className={cn(
                                  'ml-auto px-1.5 py-0.5 font-black text-[9px] border',
                                  isParentExpanded ? 'bg-white/20 border-white/20' : 'bg-pop-black/50 text-gray-400 border-white/5',
                                )}>
                                  {spots.length}
                                </span>
                              </button>

                              {/* 子地点缩略图网格 */}
                              <AnimatePresence initial={false}>
                                {isParentExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className="grid grid-cols-2 gap-1.5 p-1.5 pt-2">
                                      {spots.map(([spotName, imgs]) => {
                                        const imgUrl = timeMode === 'day' ? imgs.day : imgs.night;
                                        return (
                                          <motion.div
                                            key={spotName}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFullscreen({
                                              parentLocation: parent,
                                              spotName,
                                              image: imgUrl,
                                            })}
                                            className="cursor-pointer relative group"
                                          >
                                            <div className="w-full aspect-video border-2 border-pop-black shadow-pop overflow-hidden relative bg-pop-black">
                                              <img
                                                src={imgUrl}
                                                alt={`${parent} - ${spotName}`}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                                                loading="lazy"
                                                decoding="async"
                                              />
                                              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                              <div className="absolute bottom-1 left-1 right-1 z-10">
                                                <div className="text-white font-black text-[10px] truncate drop-shadow-lg">
                                                  {spotName}
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 全屏查看器 — 使用 Portal 突破手机容器 transform 限制 */}
      {fullscreen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 bg-black/95 flex items-center justify-center"
            onClick={() => setFullscreen(null)}
          >
            {/* 关闭按钮 */}
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreen(null); }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-pop-pink text-white border-2 border-pop-black flex items-center justify-center shadow-pop hover:bg-pop-yellow hover:text-pop-black transition-colors active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 昼夜切换 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleTime(); }}
              className={cn(
                'absolute top-4 left-4 z-10 px-4 py-2 font-black text-sm border-2 border-pop-black shadow-pop flex items-center gap-1.5 transition-colors',
                timeMode === 'day' ? 'bg-pop-yellow text-pop-black' : 'bg-pop-cyan text-pop-black',
              )}
            >
              {timeMode === 'day' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {timeMode === 'day' ? '白日' : '夜晚'}
            </button>

            {/* 上一张 */}
            {currentFlatIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToFlatIndex(currentFlatIndex - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-pop-black/80 text-white border-2 border-pop-black flex items-center justify-center shadow-pop hover:bg-pop-pink transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* 下一张 */}
            {currentFlatIndex < flatList.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToFlatIndex(currentFlatIndex + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-pop-black/80 text-white border-2 border-pop-black flex items-center justify-center shadow-pop hover:bg-pop-pink transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* 图片 */}
            <AnimatePresence mode="wait">
              <motion.img
                key={`${fullscreen.parentLocation}/${fullscreen.spotName}-${timeMode}`}
                src={fullscreen.image}
                alt={`${fullscreen.parentLocation} - ${fullscreen.spotName}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="max-w-[95vw] max-h-[85vh] object-contain border-2 border-pop-black shadow-pop-lg"
                onClick={(e) => e.stopPropagation()}
                decoding="async"
              />
            </AnimatePresence>

            {/* 底部地点名称 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-pop-black/90 text-white px-4 py-2 font-black text-sm border-2 border-pop-black shadow-pop flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-pop-pink" />
                {fullscreen.parentLocation} / {fullscreen.spotName}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
