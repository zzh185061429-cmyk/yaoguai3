import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export const AtmosphereEffect: React.FC = () => {
  // 极简微弱古朴浮尘/微光，不遮挡背景地点立绘
  const dustParticles = useMemo(() => Array.from({ length: 10 }), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none">
      {/* 极简古典暗角晕染 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,8,6,0.5)_100%)] mix-blend-multiply pointer-events-none" />

      {/* 极少量清淡金墨微尘 */}
      {dustParticles.map((_, i) => {
        const size = (i % 3) + 2;
        const duration = 16 + (i % 6) * 3;
        const delay = -(i * 2.5);
        const startX = (i * 11) % 95;
        
        return (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full bg-gold-300/40 blur-[0.5px]"
            style={{ width: size, height: size }}
            initial={{
              y: '100vh',
              x: `${startX}vw`,
              opacity: 0,
            }}
            animate={{
              y: ['100vh', '-5vh'],
              x: [
                `${startX}vw`,
                `${startX + ((i % 2 === 0) ? 4 : -4)}vw`,
              ],
              opacity: [0, 0.4, 0.5, 0.2, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        );
      })}
    </div>
  );
};
