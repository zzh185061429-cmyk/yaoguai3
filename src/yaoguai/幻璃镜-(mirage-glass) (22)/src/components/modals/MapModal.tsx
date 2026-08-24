import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut, Target, CornerUpLeft, Maximize, Minimize } from 'lucide-react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Data definitions
const MACRO_NODES = [
  { id: 'n1', name: '事务所', x: 20, y: 50, status: 'locked', hasSubMap: false },
  { id: 'n2', name: '土地庙旧址', x: 50, y: 65, status: 'current', characters: ['c3'], hasSubMap: true },
  { id: 'n3', name: '城北集市', x: 65, y: 35, status: 'visited', hasSubMap: false },
  { id: 'n4', name: '悦来客栈', x: 85, y: 45, status: 'unlocked', hasSubMap: false }
];

const MACRO_EDGES = [
  { from: 'n1', to: 'n2', status: 'explored' },
  { from: 'n2', to: 'n3', status: 'explored' },
  { from: 'n3', to: 'n4', status: 'unexplored' }
];

const MICRO_MAPS: Record<string, { title: string, nodes: any[], edges: any[] }> = {
  'n2': {
    title: '土地庙旧址 - 内部构造',
    nodes: [
      { id: 'm2_1', name: '庙宇正门', x: 30, y: 70, status: 'visited' },
      { id: 'm2_2', name: '前庭', x: 50, y: 50, status: 'current', characters: ['c3'] },
      { id: 'm2_3', name: '正殿', x: 50, y: 25, status: 'unlocked' },
      { id: 'm2_4', name: '偏房', x: 70, y: 45, status: 'locked' }
    ],
    edges: [
      { from: 'm2_1', to: 'm2_2', status: 'explored' },
      { from: 'm2_2', to: 'm2_3', status: 'unexplored' },
      { from: 'm2_2', to: 'm2_4', status: 'unexplored' }
    ]
  }
};

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
  const [scale, setScale] = useState(1);
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeNodes = currentRegion ? MICRO_MAPS[currentRegion].nodes : MACRO_NODES;
  const activeEdges = currentRegion ? MICRO_MAPS[currentRegion].edges : MACRO_EDGES;
  const currentTitle = currentRegion ? MICRO_MAPS[currentRegion].title : '全城概览';

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
  const handleReset = () => setScale(1);
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  const handleNodeClick = (node: any) => {
    if (!currentRegion && node.hasSubMap) {
      setCurrentRegion(node.id);
      setScale(1); // Reset zoom on region change
    }
  };

  const getNodeColor = (status: string) => {
    if (status === 'locked') return { bg: 'bg-ink-800', border: 'border-ink-600', shadow: '' };
    if (status === 'current') return { bg: 'bg-cyan-500', border: 'border-cyan-300', shadow: 'shadow-[0_0_15px_rgba(48,143,143,0.8)]' };
    if (status === 'unlocked') return { bg: 'bg-vermilion-500', border: 'border-vermilion-300', shadow: 'shadow-[0_0_15px_rgba(214,61,46,0.6)]' };
    if (status === 'visited') return { bg: 'bg-ink-600', border: 'border-cyan-500', shadow: '' };
    return { bg: 'bg-ink-800', border: 'border-ink-600', shadow: '' };
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="幻 璃 镜 · 地 图" 
      id="map-modal" 
      fullScreen={isFullScreen}
      onToggleFullScreen={toggleFullScreen}
    >
      <div className={`relative w-full bg-ink-900 rounded-xl overflow-hidden border border-ink-700/50 flex flex-col ${isFullScreen ? 'h-[calc(100vh-100px)] border-0 rounded-none' : 'h-[500px]'}`} ref={containerRef}>
        
        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            {currentRegion && (
              <button 
                onClick={() => { setCurrentRegion(null); setScale(1); }}
                className="bg-ink-900/80 backdrop-blur border border-cyan-500/50 text-cyan-400 px-3 py-1.5 rounded flex items-center gap-2 hover:bg-cyan-900/40 transition-colors shadow-lg"
              >
                <CornerUpLeft size={16} />
                <span className="font-serif text-sm tracking-widest">返回上级</span>
              </button>
            )}
            <div className="bg-ink-900/80 backdrop-blur border border-ink-700/50 px-4 py-2 rounded shadow-lg">
              <span className="font-serif tracking-widest text-paper-200">{currentTitle}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button onClick={handleZoomIn} className="bg-ink-900/80 backdrop-blur border border-ink-700/50 text-ink-400 hover:text-cyan-400 p-2 rounded shadow-lg transition-colors">
              <ZoomIn size={20} />
            </button>
            <button onClick={handleZoomOut} className="bg-ink-900/80 backdrop-blur border border-ink-700/50 text-ink-400 hover:text-cyan-400 p-2 rounded shadow-lg transition-colors">
              <ZoomOut size={20} />
            </button>
            <button onClick={handleReset} className="bg-ink-900/80 backdrop-blur border border-ink-700/50 text-ink-400 hover:text-cyan-400 p-2 rounded shadow-lg transition-colors" title="重置视角">
              <Target size={20} />
            </button>
          </div>
        </div>

        {/* Map Drag Area */}
        <div className="flex-1 w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing">
          {/* Map Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d6b75a 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', transform: `scale(${scale})`, transformOrigin: 'center' }} />
          
          <motion.div 
            className="absolute inset-0 w-full h-full"
            drag
            dragConstraints={containerRef}
            dragElastic={0.2}
            animate={{ scale }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ transformOrigin: 'center' }}
          >
            {/* SVG Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_8px_rgba(48,143,143,0.3)]" viewBox="0 0 100 100" preserveAspectRatio="none">
              {activeEdges.map((edge, idx) => {
                const fromNode = activeNodes.find(n => n.id === edge.from);
                const toNode = activeNodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                return (
                  <g key={idx}>
                    {/* Glow Base */}
                    <path 
                      d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`} 
                      fill="none" 
                      stroke={edge.status === 'explored' ? '#308f8f' : '#c29d38'} 
                      strokeWidth="2" 
                      className={edge.status === 'explored' ? 'opacity-20' : 'opacity-10'} 
                    />
                    {/* Main Road Line */}
                    <path 
                      d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`} 
                      fill="none" 
                      stroke={edge.status === 'explored' ? '#308f8f' : '#c29d38'} 
                      strokeWidth="0.5" 
                      strokeDasharray={edge.status === 'unexplored' ? '1,1' : 'none'} 
                      className={edge.status === 'explored' ? 'opacity-90' : 'opacity-60'} 
                    />
                    {/* Inner Core for Explored */}
                    {edge.status === 'explored' && (
                      <path 
                        d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`} 
                        fill="none" 
                        stroke="#a5f3fc" 
                        strokeWidth="0.2" 
                        className="opacity-50" 
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {activeNodes.map(node => {
              const colors = getNodeColor(node.status);
              
              return (
                <motion.div 
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group z-10 pointer-events-auto"
                  style={{ left: `${node.x}%`, top: `${node.y}%`, cursor: (node.hasSubMap || node.status === 'unlocked') ? 'pointer' : 'default' }}
                  whileHover={(node.hasSubMap || node.status === 'unlocked') ? { scale: 1.15 } : {}}
                >
                  {/* Chibi characters on node */}
                  {node.characters && node.characters.includes('c3') && (
                    <div className="absolute bottom-full mb-1 w-20 h-20 flex justify-center items-end animate-bounce pointer-events-none">
                      <img src="https://i.postimg.cc/DycdNL5D/xiao-ren.png" alt="chibi" className="h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                    </div>
                  )}
                  
                  {/* Node Dot */}
                  <div className="relative w-6 h-6 flex items-center justify-center transition-all duration-300">
                    {/* Pulsing ring for current/unlocked nodes */}
                    {(node.status === 'current' || node.status === 'unlocked') && (
                      <motion.div 
                        className={`absolute inset-0 rounded-full border-2 ${colors.border} opacity-50`}
                        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                    <div className={`
                      w-full h-full flex items-center justify-center transition-all duration-300 rounded-full
                      ${colors.bg} ${colors.border} border-2 ${colors.shadow}
                      ${(node.hasSubMap || node.status === 'unlocked') ? 'group-hover:brightness-125' : ''}
                    `}>
                      <div className={`
                        w-2 h-2 bg-white/80 rounded-full
                        ${node.status === 'current' ? 'animate-ping opacity-100' : 'opacity-50'}
                      `} />
                    </div>
                  </div>
                  
                  {/* Node Label */}
                  <div className={`px-2 py-0.5 rounded bg-ink-900/90 backdrop-blur border text-xs font-serif tracking-wider whitespace-nowrap transition-colors pointer-events-none
                    ${node.status === 'current' ? 'border-cyan-500 text-cyan-300' : 
                      node.status === 'unlocked' ? 'border-vermilion-500/80 text-vermilion-300' :
                      node.status === 'visited' ? 'border-cyan-700/50 text-paper-200' :
                      'border-ink-800 text-ink-600'}
                  `}>
                    {node.name}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
        
        {/* Floating Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          className="absolute bottom-4 right-4 z-20 p-3 bg-ink-900/80 backdrop-blur border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors rounded shadow-lg flex items-center justify-center"
        >
          {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>
    </Modal>
  );
};
