import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../../types';

interface CharacterSpriteProps {
  character?: Character;
  isVisible: boolean;
  expression?: string;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({ character, isVisible, expression = 'mo-ren' }) => {
  const isCyan = character?.themeColor === 'cyan';
  
  const spriteUrl = character?.sprites?.[expression] || character?.sprites?.['mo-ren'];

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-center items-end overflow-hidden z-10">
      <AnimatePresence mode="wait">
        {isVisible && character && (
          <motion.div
            key={`${character.id}-${expression}`}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
            id={`sprite-${character.id}`}
          >
            {spriteUrl ? (
              <motion.img 
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                src={spriteUrl} 
                alt={character.name} 
                className="h-[90vh] max-h-250 w-auto object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] -mb-8" 
              />
            ) : (
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-[700px] h-[95vh] -mb-10"
              >
                {/* Elegant placeholder for character silhouette using modern UI + ancient aesthetics */}
                <div className="absolute inset-0 flex flex-col items-center justify-end drop-shadow-2xl">
                  
                  {/* Back aura / spirit energy */}
                  <div className={`absolute top-1/4 w-[500px] h-[700px] rounded-[100%] blur-[120px] opacity-40 mix-blend-screen ${isCyan ? 'bg-cyan-500' : 'bg-vermilion-500'}`} />
                  
                  {/* Character Glassmorphic Monolith (Instead of a human figure, we use an abstract spiritual monolith) */}
                  <div className={`relative w-[360px] h-[800px] rounded-t-[180px] border-t border-l border-r backdrop-blur-md bg-linear-to-t shadow-[0_0_40px_rgba(0,0,0,0.8)]
                    ${isCyan ? 'from-ink-900 via-cyan-900/40 to-cyan-400/10 border-cyan-400/30' : 'from-ink-900 via-vermilion-900/40 to-vermilion-400/10 border-vermilion-400/30'}
                    overflow-hidden flex flex-col items-center`}
                  >
                    {/* Inner glowing core line */}
                    <div className={`absolute inset-y-0 w-[1px] ${isCyan ? 'bg-linear-to-b from-transparent via-cyan-300 to-transparent' : 'bg-linear-to-b from-transparent via-vermilion-300 to-transparent'} opacity-50 shadow-[0_0_15px_currentColor]`} />
                    
                    {/* Traditional geometric patterns overlay */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0, #0a0a0a 100%)' }} />
                    
                    {/* Floating runic / modern UI rings */}
                    <div className="absolute top-32 w-full flex justify-center">
                      <div className={`w-40 h-40 rounded-full border-[1px] border-dashed ${isCyan ? 'border-cyan-300' : 'border-vermilion-300'} animate-spin-slow opacity-60 mix-blend-screen`} style={{ animationDuration: '30s' }} />
                      <div className={`absolute w-24 h-24 rounded-full border-[1px] ${isCyan ? 'border-cyan-200' : 'border-vermilion-200'} animate-spin-slow opacity-30 mix-blend-screen`} style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                    </div>
                    
                    {/* Floating Talisman / Data tags */}
                    <div className="absolute top-1/3 flex flex-col items-center gap-12 w-full px-12 z-10">
                      <motion.div 
                        animate={{ y: [-5, 5, -5] }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className={`w-full p-4 border-l-2 backdrop-blur-lg bg-ink-900/50 ${isCyan ? 'border-cyan-400' : 'border-vermilion-400'}`}
                      >
                        <div className="font-sans text-[10px] tracking-[0.3em] text-paper-200/50 uppercase mb-1">Entity ID</div>
                        <div className={`font-serif tracking-widest text-lg ${isCyan ? 'text-cyan-300' : 'text-vermilion-300'}`}>
                          {character.name}
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        animate={{ y: [5, -5, 5] }} 
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className={`self-end w-2/3 p-3 border-r-2 backdrop-blur-lg bg-ink-900/50 text-right ${isCyan ? 'border-cyan-400' : 'border-vermilion-400'}`}
                      >
                         <div className="font-sans text-[10px] tracking-[0.3em] text-paper-200/50 uppercase mb-1">Class</div>
                        <div className={`font-sans tracking-widest text-sm ${isCyan ? 'text-cyan-300/80' : 'text-vermilion-300/80'}`}>
                          {character.title?.split('·')[1] || 'UNKNOWN'}
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="absolute bottom-16 w-full text-center flex flex-col items-center gap-2">
                      <div className={`h-12 w-[1px] ${isCyan ? 'bg-cyan-500' : 'bg-vermilion-500'}`} />
                      <span className={`font-serif text-5xl tracking-[0.3em] opacity-90 drop-shadow-[0_0_10px_currentColor] ${isCyan ? 'text-cyan-300' : 'text-vermilion-300'}`}>
                        {character.name}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
