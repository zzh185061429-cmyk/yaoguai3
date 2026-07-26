/**
 * 天气视觉叠层
 *
 * 叠在场景背景图上方，用半透明色块 + 粒子效果表现当前天气。
 * 不替换背景图本身（那需要为每个地点×每种天气准备图片，工作量巨大），
 * 而是用不同颜色的半透明色块模拟天气对光线的影响，室外额外叠加粒子。
 *
 * 室内外差异：
 * - 室外：较浓的天气色块 + 粒子效果（雨/雪/雾/闪电）
 * - 室内：更淡的天气色块（模拟室外天气对室内采光的影响），无粒子效果
 *
 * 注意：不使用 backdrop-filter（在部分浏览器/iframe 上下文中会导致白屏），
 * 改用半透明色块叠加，每个天气类型有不同色调。
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getWeather, type WeatherType } from '../data/weather';
import { useGameContext } from '../state/GameContext';

interface WeatherOverlayProps {
  /** 游戏时间 */
  gameTime: Date;
  /** 当前地点是否为室外（决定色块浓度 + 是否显示粒子） */
  isOutdoor: boolean;
}

/**
 * 室外天气 → 半透明色块（每个天气不同色调，较浓）
 * 晴/多云：透明，无效果
 */
const OUTDOOR_OVERLAY_COLOR: Record<WeatherType, string> = {
  '晴': 'transparent',
  '多云': 'rgba(200,205,215,0.06)',
  '阴': 'rgba(70,75,95,0.18)',
  '小雨': 'rgba(50,65,85,0.28)',
  '大雨': 'rgba(25,35,55,0.42)',
  '雪': 'rgba(210,225,240,0.18)',
  '雾': 'rgba(175,180,190,0.28)',
  '雷暴': 'rgba(15,20,35,0.52)',
};

/**
 * 室内天气 → 半透明色块（每个天气不同色调，比室外略淡）
 * 晴/多云：透明，无效果
 */
const INDOOR_OVERLAY_COLOR: Record<WeatherType, string> = {
  '晴': 'transparent',
  '多云': 'rgba(200,205,215,0.05)',
  '阴': 'rgba(70,75,95,0.14)',
  '小雨': 'rgba(50,65,85,0.22)',
  '大雨': 'rgba(25,35,55,0.34)',
  '雪': 'rgba(210,225,240,0.14)',
  '雾': 'rgba(175,180,190,0.22)',
  '雷暴': 'rgba(15,20,35,0.4)',
};

// ============================================================
// 雨粒子（Canvas）
// ============================================================

function RainCanvas({ intensity }: { intensity: 'light' | 'heavy' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const count = intensity === 'heavy' ? 300 : 120;
    const speed = intensity === 'heavy' ? 14 : 9;
    const length = intensity === 'heavy' ? 20 : 14;

    const drops = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: length + Math.random() * 8,
    }));

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(180, 200, 230, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.len);
        d.y += speed;
        d.x -= 0.8;
        if (d.y > h) {
          d.y = -d.len;
          d.x = Math.random() * w;
        }
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ============================================================
// 雪粒子（DOM + CSS 动画，数量少用 DOM 更轻）
// ============================================================

function SnowLayer() {
  const flakes = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 3 + Math.random() * 6,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 40,
    })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flakes.map(f => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animation: `snowfall ${f.duration}s linear ${f.delay}s infinite`,
            '--drift': `${f.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-10px) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// 雾层（纯 CSS 渐变 + 动画）
// ============================================================

function FogLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(200,200,200,0.35) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(220,220,220,0.3) 0%, transparent 55%)',
        }}
        animate={{ x: [0, 30, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ============================================================
// 闪电闪烁（雷暴）
// ============================================================

function LightningFlash() {
  return (
    <motion.div
      className="absolute inset-0 bg-white pointer-events-none"
      animate={{ opacity: [0, 0, 0.7, 0, 0.3, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 + Math.random() * 5, times: [0, 0.4, 0.45, 0.5, 0.55, 1] }}
    />
  );
}

// ============================================================
// 主组件
// ============================================================

export function WeatherOverlay({ gameTime, isOutdoor }: WeatherOverlayProps) {
  const weather = getWeather(gameTime);
  const { weatherParticlesEnabled } = useGameContext();
  // 粒子效果需要同时满足：室外 + 全局开关开启
  const showParticles = isOutdoor && weatherParticlesEnabled;
  // 室内外使用不同浓度的色块
  const overlayColor = (isOutdoor ? OUTDOOR_OVERLAY_COLOR : INDOOR_OVERLAY_COLOR)[weather.type];

  return (
    <>
      {/* 天气色块 — 每个天气不同色调，室内外不同浓度 */}
      {overlayColor !== 'transparent' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ backgroundColor: overlayColor }}
        />
      )}

      {/* 粒子效果（仅室外） */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {weather.type === '小雨' && <RainCanvas key="rain-light" intensity="light" />}
            {weather.type === '大雨' && <RainCanvas key="rain-heavy" intensity="heavy" />}
            {weather.type === '雷暴' && <RainCanvas key="rain-storm" intensity="heavy" />}
            {weather.type === '雪' && <SnowLayer key="snow" />}
            {weather.type === '雾' && <FogLayer key="fog" />}
          </AnimatePresence>
          {weather.type === '雷暴' && <LightningFlash />}
        </div>
      )}
    </>
  );
}
