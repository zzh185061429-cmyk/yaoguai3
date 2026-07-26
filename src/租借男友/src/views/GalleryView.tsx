import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CHARACTER_AVATARS, CHARACTER_COLORS } from '../data/characterData';
import { cn } from '../utils';

const CHARACTERS = Object.keys(CHARACTER_AVATARS);
const PAGE_SIZE = 9;

interface GalleryViewProps {
  onSelectChar: (name: string) => void;
}

export function GalleryView({ onSelectChar }: GalleryViewProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(CHARACTERS.length / PAGE_SIZE);
  const currentChars = CHARACTERS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="w-full h-full bg-[#2a2a2a] pt-0 p-4 md:p-8 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 z-10">
        <h1 className="text-3xl md:text-4xl font-black italic text-white -skew-x-6 drop-shadow-md">
          <span className="text-pop-pink">GALLERY</span> <span className="text-gray-300">/ 画廊</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={page === 0}
            className={cn(
              "p-2 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal",
              page === 0 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-3 py-1 bg-white pop-border font-black text-pop-black text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={page >= totalPages - 1}
            className={cn(
              "p-2 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal",
              page >= totalPages - 1 && "opacity-30 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-24 cv-auto">
          {currentChars.map((name) => {
            const avatar = CHARACTER_AVATARS[name];
            const color = CHARACTER_COLORS[name] || 'bg-pop-yellow';
            return (
              <motion.div
                key={name}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectChar(name)}
                className="cursor-pointer relative"
              >
                <div
                  className={cn(
                    "w-full aspect-3/4 pop-border shadow-pop-lg relative overflow-hidden flex flex-col clip-diagonal",
                    color
                  )}
                >
                  <div className="absolute inset-0 bg-halftone opacity-30 mix-blend-overlay pointer-events-none z-0"></div>
                  <div className="flex-1 bg-white/20 m-3 md:m-4 pop-border relative overflow-hidden pointer-events-none z-10">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-4xl opacity-50 mix-blend-overlay -skew-x-6 text-center leading-tight tracking-widest">
                        {name.split('').map((n, i) => (
                          <div key={i}>{n}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4 pt-0 pointer-events-none z-10 relative text-pop-black">
                    <h2 className="text-xl md:text-2xl font-black italic -skew-x-6 drop-shadow-md">
                      {name}
                    </h2>
                  </div>
                </div>
                <div className="absolute -bottom-2 right-2 md:-bottom-3 md:right-3 z-20">
                  <div className="bg-pop-yellow text-pop-black px-3 py-1 md:px-4 md:py-1.5 font-black text-xs md:text-sm pop-border shadow-pop clip-diagonal">
                    VIEW
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
