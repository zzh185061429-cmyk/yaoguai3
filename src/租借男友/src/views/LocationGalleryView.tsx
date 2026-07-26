import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { LOCATION_IMAGES } from '../data/locationImages';
import { cn } from '../utils';

type TimeMode = 'day' | 'night';

/** 全屏查看器 */
function FullscreenViewer({
  parentLocation,
  spotName,
  image,
  timeMode,
  onClose,
  onPrev,
  onNext,
  onToggleTime,
  hasPrev,
  hasNext,
}: {
  parentLocation: string;
  spotName: string;
  image: string;
  timeMode: TimeMode;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleTime: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-10 p-2 bg-pop-pink text-white pop-border shadow-pop hover:bg-pop-yellow hover:text-pop-black transition-colors clip-diagonal"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 昼夜切换 */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleTime(); }}
        className={cn(
          "absolute top-4 left-4 z-10 px-4 py-2 font-black text-sm pop-border shadow-pop clip-diagonal transition-colors flex items-center gap-2",
          timeMode === 'day'
            ? "bg-pop-yellow text-pop-black hover:bg-pop-cyan"
            : "bg-pop-cyan text-pop-black hover:bg-pop-yellow"
        )}
      >
        {timeMode === 'day' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {timeMode === 'day' ? '白日' : '夜晚'}
      </button>

      {/* 上一张 */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-pop-black/80 text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* 下一张 */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-pop-black/80 text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* 图片 */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`${parentLocation}/${spotName}-${timeMode}`}
          src={image}
          alt={`${parentLocation} - ${spotName}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="max-w-[95vw] max-h-[90vh] object-contain pop-border shadow-pop-lg"
          onClick={(e) => e.stopPropagation()}
          decoding="async"
        />
      </AnimatePresence>

      {/* 底部地点名称 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-pop-black/90 text-white px-6 py-2 font-black text-lg pop-border shadow-pop clip-diagonal flex items-center gap-2">
          <MapPin className="w-5 h-5 text-pop-pink" />
          {parentLocation} / {spotName}
        </div>
      </div>
    </motion.div>
  );
}

export function LocationGalleryView() {
  const [timeMode, setTimeMode] = useState<TimeMode>('day');
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

  // 全屏翻页
  const currentFlatIndex = fullscreen
    ? flatList.findIndex(item => item.parentLocation === fullscreen.parentLocation && item.spotName === fullscreen.spotName)
    : -1;

  const goToFlatIndex = (index: number) => {
    if (index < 0 || index >= flatList.length) return;
    const item = flatList[index];
    setFullscreen({
      parentLocation: item.parentLocation,
      spotName: item.spotName,
      image: timeMode === 'day' ? item.day : item.night,
    });
  };

  // 全屏切换昼夜时同步图片
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

  return (
    <div className="w-full h-full bg-[#2a2a2a] p-4 md:p-8 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 z-10">
        <h1 className="text-3xl md:text-4xl font-black italic text-white -skew-x-6 drop-shadow-md">
          <span className="text-pop-cyan">LOCATIONS</span> <span className="text-gray-300">/ 地点画廊</span>
        </h1>

        {/* 昼夜切换 */}
        <div className="flex items-center gap-1 bg-pop-black p-1 pop-border clip-diagonal">
          <button
            onClick={() => {
              setTimeMode('day');
              if (fullscreen && currentFlatIndex >= 0) {
                const item = flatList[currentFlatIndex];
                setFullscreen({ ...fullscreen, image: item.day });
              }
            }}
            className={cn(
              "px-4 py-1.5 font-black text-sm transition-colors flex items-center gap-2",
              timeMode === 'day'
                ? "bg-pop-yellow text-pop-black"
                : "bg-transparent text-gray-400 hover:text-white"
            )}
          >
            <Sun className="w-4 h-4" />
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
              "px-4 py-1.5 font-black text-sm transition-colors flex items-center gap-2",
              timeMode === 'night'
                ? "bg-pop-cyan text-pop-black"
                : "bg-transparent text-gray-400 hover:text-white"
            )}
          >
            <Moon className="w-4 h-4" />
            夜晚
          </button>
        </div>
      </div>

      {/* 地点分组列表 */}
      <div className="flex-1 overflow-y-auto z-10 pb-24 cv-auto">
        <div className="flex flex-col gap-8">
          {Object.entries(LOCATION_IMAGES).map(([parentLocation, spots]) => {
            const spotEntries = Object.entries(spots);
            if (spotEntries.length === 0) return null;
            return (
              <div key={parentLocation}>
                {/* 分组标题 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-pop-pink text-white px-4 py-1.5 font-black text-lg italic -skew-x-6 pop-border shadow-pop clip-diagonal flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {parentLocation}
                  </div>
                  <div className="text-gray-500 font-bold text-sm">
                    {spotEntries.length} 个场景
                  </div>
                  <div className="flex-1 h-0.5 bg-linear-to-r from-pop-pink/50 to-transparent" />
                </div>

                {/* 缩略图网格 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {spotEntries.map(([spotName, imgs]) => {
                    const imgUrl = timeMode === 'day' ? imgs.day : imgs.night;
                    return (
                      <motion.div
                        key={spotName}
                        whileHover={{ y: -4, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setFullscreen({
                          parentLocation,
                          spotName,
                          image: imgUrl,
                        })}
                        className="cursor-pointer relative group"
                      >
                        <div className="w-full aspect-video pop-border shadow-pop overflow-hidden clip-diagonal relative bg-pop-black">
                          <img
                            src={imgUrl}
                            alt={`${parentLocation} - ${spotName}`}
                            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                          {/* 底部渐变遮罩 */}
                          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          {/* 场景名 */}
                          <div className="absolute bottom-2 left-2 right-2 z-10">
                            <div className="text-white font-black text-xs md:text-sm truncate drop-shadow-lg">
                              {spotName}
                            </div>
                          </div>
                          {/* hover 放大提示 */}
                          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-pop-yellow text-pop-black px-2 py-0.5 font-black text-[10px] pop-border shadow-pop clip-diagonal">
                              VIEW
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 全屏查看器 */}
      <AnimatePresence>
        {fullscreen && (
          <FullscreenViewer
            parentLocation={fullscreen.parentLocation}
            spotName={fullscreen.spotName}
            image={fullscreen.image}
            timeMode={timeMode}
            onClose={() => setFullscreen(null)}
            onPrev={() => goToFlatIndex(currentFlatIndex - 1)}
            onNext={() => goToFlatIndex(currentFlatIndex + 1)}
            onToggleTime={handleToggleTime}
            hasPrev={currentFlatIndex > 0}
            hasNext={currentFlatIndex < flatList.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
