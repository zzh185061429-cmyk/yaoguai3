import React, { useState, useRef } from "react";
import { PopCard } from "../components/ui/PopCard";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Heart, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { CHARACTERS } from "../data/gameData";

export function ArchiveView() {
  const [selectedChar, setSelectedChar] = useState<typeof CHARACTERS[0] | null>(null);
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? CHARACTERS.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === CHARACTERS.length - 1 ? 0 : prev + 1));
  };

  const currentChar = CHARACTERS[currentIndex];

  return (
    <div className="w-full h-full bg-pop-black pt-0 p-4 md:p-8 flex flex-col relative overflow-hidden">
      {/* 半调点阵装饰背景 */}
      <div className="absolute inset-0 bg-halftone-pink opacity-15 pointer-events-none" />

      {/* 大屏：drag 轮播 */}
      <div ref={carouselRef} className="hidden md:flex flex-1 overflow-hidden z-10 px-2 md:px-4 cursor-grab active:cursor-grabbing pb-24 md:pb-0">
        <motion.div
          drag="x"
          dragConstraints={carouselRef}
          dragElastic={0.2}
          className="flex gap-8 h-full items-center w-max"
        >
          {CHARACTERS.map((char) => (
            <motion.div
              key={char.id}
              whileHover={{ y: -15, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedChar(char); setIsSecretOpen(false); }}
              className="shrink-0 relative h-[320px] md:h-[420px] min-h-[280px] cursor-pointer"
            >
              <div
                className={`w-[220px] md:w-[260px] lg:w-[280px] h-full pop-border shadow-pop-lg relative overflow-hidden flex flex-col clip-diagonal ${char.color}`}
              >
                <div className="absolute inset-0 bg-halftone opacity-30 mix-blend-overlay pointer-events-none z-0"></div>
                <div className="flex-1 bg-white/20 m-4 pop-border relative overflow-hidden pointer-events-none z-10">
                   {char.avatar ? (
                     <img src={char.avatar} alt={char.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                   ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-5xl md:text-6xl opacity-50 mix-blend-overlay -skew-x-6 text-center leading-tight tracking-widest">
                       {char.name.split('').map((n, i) => <div key={i}>{n}</div>)}
                     </div>
                   )}
                </div>
                <div className={`p-4 md:p-6 pt-0 pointer-events-none z-10 relative ${char.textColor || 'text-pop-black'}`}>
                  <h2 className="text-3xl md:text-4xl font-black italic -skew-x-6 drop-shadow-md">{char.name}</h2>
                  <div className="inline-block px-3 py-1 bg-pop-black text-white text-sm font-bold mt-2 pop-border italic">
                    {char.price}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 right-4 z-20">
                <div className="bg-pop-yellow text-pop-black px-4 py-2 font-black pop-border shadow-pop clip-diagonal">
                  VIEW
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 竖屏：按钮翻页 */}
      <div className="flex md:hidden flex-1 flex-col items-center justify-center z-10 px-4 pb-20">
        <div className="flex items-center gap-4 w-full max-w-sm">
          <button
            onClick={goToPrev}
            className="shrink-0 p-3 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 relative">
            <div
              className={`w-full aspect-3/4 pop-border shadow-pop-lg relative overflow-hidden flex flex-col clip-diagonal ${currentChar.color}`}
            >
              <div className="absolute inset-0 bg-halftone opacity-30 mix-blend-overlay pointer-events-none z-0"></div>
              <div className="flex-1 bg-white/20 m-3 pop-border relative overflow-hidden pointer-events-none z-10">
                {currentChar.avatar ? (
                  <img src={currentChar.avatar} alt={currentChar.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-4xl opacity-50 mix-blend-overlay -skew-x-6 text-center leading-tight tracking-widest">
                    {currentChar.name.split('').map((n, i) => <div key={i}>{n}</div>)}
                  </div>
                )}
              </div>
              <div className={`p-4 pt-0 pointer-events-none z-10 relative ${currentChar.textColor || 'text-pop-black'}`}>
                <h2 className="text-2xl font-black italic -skew-x-6 drop-shadow-md">{currentChar.name}</h2>
                <div className="inline-block px-2 py-0.5 bg-pop-black text-white text-xs font-bold mt-1 pop-border italic">
                  {currentChar.price}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 right-3 z-20">
              <div className="bg-pop-yellow text-pop-black px-3 py-1.5 font-black text-sm pop-border shadow-pop clip-diagonal">
                {currentIndex + 1} / {CHARACTERS.length}
              </div>
            </div>
          </div>

          <button
            onClick={goToNext}
            className="shrink-0 p-3 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => { setSelectedChar(currentChar); setIsSecretOpen(false); }}
          className="mt-6 px-6 py-2 bg-pop-yellow text-pop-black font-black text-lg pop-border shadow-pop hover:scale-105 transition-transform clip-diagonal"
        >
          查看详细档案
        </button>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-pop-black/80 backdrop-blur-sm"
              onClick={() => { setSelectedChar(null); setIsSecretOpen(false); }}
            />

            <motion.div
              initial={{ scale: 0.8, y: 100, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, y: 100, rotate: 5 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-4xl bg-white pop-border shadow-pop-lg z-10 flex flex-col md:flex-row overflow-hidden clip-diagonal max-h-[90vh] md:max-h-[90vh] my-4 md:my-4"
            >
              <button
                onClick={() => { setSelectedChar(null); setIsSecretOpen(false); }}
                className="absolute top-4 right-4 z-20 bg-pop-pink text-white p-2 pop-border hover:scale-110 active:scale-90 transition-transform shadow-[2px_2px_0_#1a1a1a]"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Left: Graphic */}
              <div className={`w-full md:w-2/5 p-4 flex flex-col justify-center items-center relative shrink-0 ${selectedChar.color}`}>
                <div className="absolute inset-0 bg-halftone opacity-30"></div>
                {selectedChar.avatar ? (
                  <div className="z-10 w-24 h-24 md:w-48 md:h-48 rounded-full border-4 border-white overflow-hidden shadow-pop-lg transform -skew-x-6">
                    <img src={selectedChar.avatar} alt={selectedChar.name} className="w-full h-full object-cover object-top scale-110" />
                  </div>
                ) : (
                  <h2 className={`text-4xl md:text-6xl font-black italic -skew-x-12 z-10 text-center drop-shadow-md ${selectedChar.textColor || 'text-pop-black'}`}>
                    {selectedChar.name}
                  </h2>
                )}
                <div className="mt-4 md:mt-6 px-4 md:px-6 py-1.5 md:py-2 bg-pop-black text-white font-black text-lg md:text-xl pop-border z-10 transform -rotate-3 uppercase tracking-wider shadow-[4px_4px_0_#ffcc00] antialiased">
                  {selectedChar.role}
                </div>
              </div>

              {/* Right: Info */}
              <div className="w-full md:w-3/5 p-4 bg-halftone flex flex-col gap-3 md:gap-4 overflow-y-auto">

                <div className="flex flex-wrap gap-2">
                  {selectedChar.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white text-pop-black text-sm font-bold pop-border -skew-x-6 shadow-[2px_2px_0_#1a1a1a]">
                      #{tag}
                    </span>
                  ))}
                </div>

                <PopCard className="bg-white">
                  <h3 className="text-lg md:text-xl font-black mb-2 flex items-center gap-2"><Star className="fill-pop-yellow text-pop-yellow"/> 个人情报</h3>
                  <p className="font-bold text-gray-700 leading-relaxed text-sm md:text-base">{selectedChar.desc}</p>
                </PopCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <PopCard variant="pink" className="p-3 md:p-4 shadow-pop">
                    <h3 className="text-sm md:text-md font-black text-white mb-2 flex items-center gap-2 border-b-2 border-white pb-1">
                      <Heart className="w-4 h-4 fill-white" /> 喜欢 (Likes)
                    </h3>
                    <p className="font-bold text-sm leading-relaxed">{selectedChar.likes}</p>
                  </PopCard>
                  <PopCard variant="cyan" className="p-3 md:p-4 shadow-pop">
                    <h3 className="text-sm md:text-md font-black text-pop-black mb-2 flex items-center gap-2 border-b-2 border-pop-black/30 pb-1">
                      <X className="w-4 h-4 stroke-[4px]" /> 讨厌 (Dislikes)
                    </h3>
                    <p className="font-bold text-sm leading-relaxed">{selectedChar.dislikes}</p>
                  </PopCard>
                </div>

                <PopCard className="bg-pop-black text-white shadow-pop-pink border-pop-pink relative">
                  <div className="absolute top-2 right-2 opacity-20 pointer-events-none"><AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-pop-pink" /></div>
                  <div className="relative z-10 cursor-pointer" onClick={() => setIsSecretOpen(!isSecretOpen)}>
                    <div className="text-base md:text-lg font-black text-pop-pink outline-none select-none flex items-center justify-between">
                      CLASSIFIED SECRET / 小秘密
                      <span className={`text-pop-pink transition-transform ${isSecretOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isSecretOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "linear" }}
                        className="font-bold text-white antialiased list-disc pl-5 space-y-2 relative z-10 overflow-hidden mt-4 text-sm md:text-base"
                      >
                        {selectedChar.secret.map((s, i) => <li key={i}>{s}</li>)}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </PopCard>

                <PopCard variant="yellow" className="bg-pop-yellow shadow-pop-pink border-4 border-pop-pink">
                  <h3 className="text-base md:text-lg font-black flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5"/> 经纪人(妹妹)的备忘录</h3>
                  <p className="font-bold text-pop-black italic bg-white/50 p-2 border-l-4 border-pop-pink text-sm md:text-base">
                    {selectedChar.sisterNote}
                  </p>
                </PopCard>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
