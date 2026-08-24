import React from 'react';
import { motion } from 'motion/react';

export const AtmosphereEffect: React.FC = () => {
  const dustParticles = Array.from({ length: 40 });
  const emberParticles = Array.from({ length: 15 });
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Vignette Overlay for cinematic feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] mix-blend-overlay" />
      
      {/* Subtle Scanlines Effect */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 1) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Floating Dust (Cyan) */}
      {dustParticles.map((_, i) => {
        const size = Math.random() * 3 + 1;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * -20;
        
        return (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full bg-cyan-400/20 shadow-[0_0_8px_rgba(48,143,143,0.5)] blur-[1px] mix-blend-screen"
            style={{ width: size, height: size }}
            initial={{
              y: `${Math.random() * 100}vh`,
              x: `${Math.random() * 100}vw`,
            }}
            animate={{
              y: [null, `${Math.random() * 100}vh`],
              x: [null, `${Math.random() * 100}vw`],
              opacity: [0, Math.random() * 0.4 + 0.1, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "linear",
              delay,
            }}
          />
        );
      })}

      {/* Floating Embers (Vermilion/Gold) */}
      {emberParticles.map((_, i) => {
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * -10;
        
        return (
          <motion.div
            key={`ember-${i}`}
            className="absolute rounded-full bg-vermilion-500/40 shadow-[0_0_12px_rgba(214,61,46,0.8)] blur-[1px] mix-blend-screen"
            style={{ width: size, height: size }}
            initial={{
              y: '110vh',
              x: `${Math.random() * 100}vw`,
              opacity: 0,
            }}
            animate={{
              y: '-10vh',
              x: `${Math.random() * 100 + (Math.random() * 20 - 10)}vw`,
              opacity: [0, Math.random() * 0.6 + 0.2, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "easeIn",
              delay,
            }}
          />
        );
      })}
    </div>
  );
};
