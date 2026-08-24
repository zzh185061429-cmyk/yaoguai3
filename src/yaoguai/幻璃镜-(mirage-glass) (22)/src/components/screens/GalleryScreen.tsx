import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { LogOut, Image as ImageIcon, BookOpen, Lock, X } from 'lucide-react';
import { GALLERY_CGS, CHARACTER_PROFILES } from '../../data/sampleData';
import { GalleryCG, CharacterProfile } from '../../types';

type Tab = 'cg' | 'characters';

export const GalleryScreen: React.FC = () => {
  const { setCurrentScreen, addNotification, galleryTab, setGalleryTab } = useGameContext();
  const [selectedCG, setSelectedCG] = useState<GalleryCG | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string>(CHARACTER_PROFILES[0].id);

  const selectedChar = CHARACTER_PROFILES.find(c => c.id === selectedCharId) as CharacterProfile;
  const isCyan = selectedChar?.themeColor === 'cyan';
  const themeColorClass = isCyan ? 'text-cyan-500 border-cyan-500' : 'text-vermilion-500 border-vermilion-500';
  const bgGlowClass = isCyan ? 'bg-cyan-500' : 'bg-vermilion-500';

  const handleReturnToTitle = () => {
    setCurrentScreen('game');
  };

  const handleCGClick = (cg: GalleryCG) => {
    if (cg.unlocked) {
      setSelectedCG(cg);
    } else {
      addNotification('该 CG 尚未解锁', 'warning');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-full h-screen bg-ink-900 overflow-hidden flex"
      id="screen-gallery"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-ink-800 via-ink-900 to-ink-900 opacity-80" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay" />

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 w-full p-8 z-30 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={handleReturnToTitle}
            className="flex items-center gap-2 px-4 py-2 bg-ink-900/50 backdrop-blur-md rounded-full border border-ink-700/50 text-paper-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-all font-sans text-sm tracking-widest shadow-lg"
          >
            <LogOut size={16} /> 返回幻境
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full h-full pt-24 pb-12 px-12 z-10 gap-12">
        
        {/* Left Side: Vertical Tabs (Chinese aesthetic) */}
        <div className="w-24 flex flex-col items-center gap-6 shrink-0 border-r border-ink-700/50 pr-8 overflow-y-auto custom-scrollbar pb-6">
          <button 
            onClick={() => setGalleryTab('characters')}
            className={`group flex flex-col items-center gap-3 transition-all duration-500 ${galleryTab === 'characters' ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
          >
            <div className={`p-3 rounded-full border transition-colors ${galleryTab === 'characters' ? 'border-gold-500 text-gold-500 bg-gold-500/10' : 'border-ink-600 text-ink-600'}`}>
              <BookOpen size={20} />
            </div>
            <span className={`font-serif text-lg tracking-[0.4em] writing-vertical transition-colors ${galleryTab === 'characters' ? 'text-paper-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-paper-200'}`}>
              角色图鉴
            </span>
          </button>

          <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-ink-600 to-transparent opacity-50 shrink-0" />

          <button 
            onClick={() => setGalleryTab('character_cg')}
            className={`group flex flex-col items-center gap-3 transition-all duration-500 ${galleryTab === 'character_cg' ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
          >
            <div className={`p-3 rounded-full border transition-colors ${galleryTab === 'character_cg' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-ink-600 text-ink-600'}`}>
              <ImageIcon size={20} />
            </div>
            <span className={`font-serif text-lg tracking-[0.4em] writing-vertical transition-colors ${galleryTab === 'character_cg' ? 'text-paper-100 drop-shadow-[0_0_8px_rgba(48,143,143,0.5)]' : 'text-paper-200'}`}>
              角色ＣＧ
            </span>
          </button>

          <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-ink-600 to-transparent opacity-50 shrink-0" />

          <button 
            onClick={() => setGalleryTab('location_cg')}
            className={`group flex flex-col items-center gap-3 transition-all duration-500 ${galleryTab === 'location_cg' ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
          >
            <div className={`p-3 rounded-full border transition-colors ${galleryTab === 'location_cg' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-ink-600 text-ink-600'}`}>
              <ImageIcon size={20} />
            </div>
            <span className={`font-serif text-lg tracking-[0.4em] writing-vertical transition-colors ${galleryTab === 'location_cg' ? 'text-paper-100 drop-shadow-[0_0_8px_rgba(48,143,143,0.5)]' : 'text-paper-200'}`}>
              地点ＣＧ
            </span>
          </button>
        </div>

        {/* Right Side: Tab Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* --- CHARACTER ENCYCLOPEDIA --- */}
            {galleryTab === 'characters' && (
              <motion.div 
                key="tab-characters"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full flex gap-12"
              >
                {/* Character List */}
                <div className="w-56 flex flex-col gap-4 shrink-0">
                  {CHARACTER_PROFILES.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedCharId(char.id)}
                      className={`relative px-6 py-4 text-left transition-all overflow-hidden border ${selectedCharId === char.id ? (char.themeColor === 'cyan' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-vermilion-500/50 bg-vermilion-500/5') : 'border-ink-800 bg-ink-800/30 hover:border-ink-600 hover:bg-ink-800/80'}`}
                    >
                      {/* Active Indicator Line */}
                      {selectedCharId === char.id && (
                        <motion.div layoutId="char-active-indicator" className={`absolute left-0 top-0 bottom-0 w-1 ${char.themeColor === 'cyan' ? 'bg-cyan-500' : 'bg-vermilion-500'}`} />
                      )}
                      
                      <div className={`font-serif text-xl tracking-widest ${selectedCharId === char.id ? 'text-paper-100' : 'text-paper-200/60'}`}>
                        {char.name}
                      </div>
                      <div className="font-sans text-xs tracking-widest text-ink-500 uppercase mt-1">
                        {char.title || 'UNKNOWN'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Character Detail View */}
                <div className="flex-1 relative bg-ink-800/20 border border-ink-800 p-10 overflow-hidden rounded-sm flex gap-10">
                  
                  {/* Background Watermark */}
                  <div className={`absolute -right-10 -bottom-10 font-serif text-[200px] leading-none tracking-tighter opacity-5 select-none pointer-events-none ${isCyan ? 'text-cyan-500' : 'text-vermilion-500'}`}>
                    {selectedChar.name}
                  </div>

                  {/* Art Placeholder or Illustration */}
                  <div className="w-1/3 shrink-0 relative flex flex-col items-center justify-start pr-10">
                    <div className="w-full relative rounded-sm border border-ink-700/50 bg-ink-900/50 overflow-hidden flex items-center justify-center p-2">
                      {selectedChar.illustrationUrl ? (
                        <img 
                          src={selectedChar.illustrationUrl} 
                          alt={selectedChar.name} 
                          className="w-full h-auto object-contain rounded-sm drop-shadow-md"
                        />
                      ) : (
                        <div className="aspect-[3/4] w-full flex items-center justify-center relative">
                          {/* Decorative inner elements */}
                          <div className={`w-32 h-32 rounded-full border border-dashed animate-spin-slow opacity-30 ${isCyan ? 'border-cyan-400' : 'border-vermilion-400'}`} style={{ animationDuration: '30s' }} />
                          <div className="absolute font-serif text-4xl opacity-20 writing-vertical tracking-widest">
                            {selectedChar.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar pr-6 pb-10">
                    
                    <div className="mb-8">
                      <h2 className={`font-serif text-5xl tracking-widest drop-shadow-md mb-2 ${isCyan ? 'text-cyan-300' : 'text-vermilion-300'}`}>
                        {selectedChar.name}
                      </h2>
                      <div className="flex items-center gap-4">
                        <div className={`h-[1px] w-8 ${bgGlowClass}`} />
                        <span className="font-sans text-sm tracking-[0.3em] text-paper-200 opacity-70 uppercase">{selectedChar.title}</span>
                      </div>
                    </div>

                    {selectedChar.poem && (
                      <div className={`mb-10 font-serif text-lg tracking-widest leading-loose italic text-amber-400 opacity-90 border-l-2 pl-6 ${isCyan ? 'border-cyan-500/50' : 'border-vermilion-500/50'}`}>
                        {selectedChar.poem.split('。').map((line, i) => line && (
                          <p key={i}>{line}。</p>
                        ))}
                      </div>
                    )}

                    <p className="font-sans text-paper-200 leading-loose tracking-wide text-sm mb-10 opacity-90 max-w-xl">
                      {selectedChar.description}
                    </p>

                    {selectedChar.likes && selectedChar.likes.length > 0 && (
                      <div className="mb-6">
                        <details className="group cursor-pointer bg-ink-800/30 border border-ink-700/50 rounded-sm p-4 [&_summary::-webkit-details-marker]:hidden">
                          <summary className={`font-sans text-sm tracking-[0.2em] text-paper-200/80 group-hover:${isCyan ? 'text-cyan-400' : 'text-vermilion-400'} transition-colors outline-none flex items-center justify-between uppercase`}>
                            <span>喜好 (Likes)</span>
                            <span className="opacity-50">+</span>
                          </summary>
                          <div className="mt-4 pt-4 border-t border-ink-700/50 space-y-4">
                            {selectedChar.likes.map((like, i) => (
                              <div key={i} className="bg-ink-900/40 p-4 rounded-sm border border-ink-800/50">
                                <div className={`font-serif text-lg mb-2 ${isCyan ? 'text-cyan-400' : 'text-vermilion-400'}`}>{like.item}</div>
                                <div className="font-sans text-sm text-paper-200/80 leading-relaxed">「 {like.quote} 」</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {selectedChar.dislikes && selectedChar.dislikes.length > 0 && (
                      <div className="mb-6">
                        <details className="group cursor-pointer bg-ink-800/30 border border-ink-700/50 rounded-sm p-4 [&_summary::-webkit-details-marker]:hidden">
                          <summary className={`font-sans text-sm tracking-[0.2em] text-paper-200/80 group-hover:${isCyan ? 'text-cyan-400' : 'text-vermilion-400'} transition-colors outline-none flex items-center justify-between uppercase`}>
                            <span>厌恶 (Dislikes)</span>
                            <span className="opacity-50">+</span>
                          </summary>
                          <div className="mt-4 pt-4 border-t border-ink-700/50 space-y-4">
                            {selectedChar.dislikes.map((dislike, i) => (
                              <div key={i} className="bg-ink-900/40 p-4 rounded-sm border border-ink-800/50">
                                <div className="font-serif text-lg mb-2 text-paper-300">{dislike.item}</div>
                                <div className="font-sans text-sm text-paper-200/80 leading-relaxed">「 {dislike.quote} 」</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {selectedChar.secrets && selectedChar.secrets.length > 0 && (
                      <div className="mb-6">
                        <details className="group cursor-pointer bg-ink-800/30 border border-ink-700/50 rounded-sm p-4 [&_summary::-webkit-details-marker]:hidden">
                          <summary className={`font-sans text-sm tracking-[0.2em] text-paper-200/80 group-hover:${isCyan ? 'text-cyan-400' : 'text-vermilion-400'} transition-colors outline-none flex items-center justify-between uppercase`}>
                            <span>小秘密 (Secrets)</span>
                            <span className="opacity-50">+</span>
                          </summary>
                          <div className="mt-4 pt-4 border-t border-ink-700/50 space-y-3">
                            {selectedChar.secrets.map((secret, i) => (
                              <p key={i} className="font-sans text-sm text-paper-200 leading-loose">
                                <span className={`mr-2 ${isCyan ? 'text-cyan-500' : 'text-vermilion-500'}`}>◆</span>
                                {secret}
                              </p>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    <div className="mt-8 border-l-2 pl-6 py-2 border-ink-700/50 space-y-4 relative">
                      <div className={`absolute left-[-2px] top-0 h-8 w-[2px] ${bgGlowClass}`} />
                      {selectedChar.quotes.map((quote, i) => (
                        <p key={i} className="font-serif text-paper-200/80 italic tracking-wide text-lg">
                          「 {quote} 」
                        </p>
                      ))}
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* --- CHARACTER CG --- */}
            {galleryTab === 'character_cg' && (
              <motion.div 
                key="tab-character-cg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full flex gap-12"
              >
                {/* Character List */}
                <div className="w-56 flex flex-col gap-4 shrink-0">
                  {CHARACTER_PROFILES.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedCharId(char.id)}
                      className={`relative px-6 py-4 text-left transition-all overflow-hidden border ${selectedCharId === char.id ? (char.themeColor === 'cyan' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-vermilion-500/50 bg-vermilion-500/5') : 'border-ink-800 bg-ink-800/30 hover:border-ink-600 hover:bg-ink-800/80'}`}
                    >
                      {selectedCharId === char.id && (
                        <motion.div layoutId="char-cg-active-indicator" className={`absolute left-0 top-0 bottom-0 w-1 ${char.themeColor === 'cyan' ? 'bg-cyan-500' : 'bg-vermilion-500'}`} />
                      )}
                      <div className={`font-serif text-xl tracking-widest ${selectedCharId === char.id ? 'text-paper-100' : 'text-paper-200/60'}`}>
                        {char.name}
                      </div>
                      <div className="font-sans text-xs tracking-widest text-ink-500 uppercase mt-1">
                        {char.title || 'UNKNOWN'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* CG Content View */}
                <div className="flex-1 relative overflow-y-auto custom-scrollbar pr-6 pb-10">
                  {selectedChar.gallerySprites ? (
                    <div className="space-y-12">
                      {/* SFW Section */}
                      {selectedChar.gallerySprites.sfw && (
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                            <h3 className={`font-serif text-2xl tracking-widest ${isCyan ? 'text-cyan-400' : 'text-vermilion-400'}`}>SFW</h3>
                            <div className={`h-[1px] flex-1 ${isCyan ? 'bg-cyan-500/30' : 'bg-vermilion-500/30'}`} />
                          </div>
                          {selectedChar.gallerySprites.sfw.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                              {selectedChar.gallerySprites.sfw.map(sprite => (
                                <div key={sprite.id} className="flex flex-col items-center gap-3 group">
                                  <button
                                    className="w-full aspect-[3/4] rounded-sm border border-ink-700/50 bg-ink-900/80 overflow-hidden cursor-pointer transition-colors hover:border-cyan-400"
                                    onClick={() => setSelectedCG({ id: sprite.id, url: sprite.url, title: `${selectedChar.name} - ${sprite.name}`, unlocked: true, category: 'character' })}
                                  >
                                    <img src={sprite.url} alt={sprite.name} className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                                  </button>
                                  <span className="font-sans text-sm text-paper-200/80 tracking-widest">{sprite.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-ink-500 font-sans tracking-widest text-sm">暂无数据</div>
                          )}
                        </div>
                      )}

                      {/* NSFW Section */}
                      {selectedChar.gallerySprites.nsfw && (
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                            <h3 className={`font-serif text-2xl tracking-widest ${isCyan ? 'text-cyan-400' : 'text-vermilion-400'}`}>NSFW</h3>
                            <div className={`h-[1px] flex-1 ${isCyan ? 'bg-cyan-500/30' : 'bg-vermilion-500/30'}`} />
                          </div>
                          {selectedChar.gallerySprites.nsfw.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                              {selectedChar.gallerySprites.nsfw.map(sprite => (
                                <div key={sprite.id} className="flex flex-col items-center gap-3 group">
                                  <button
                                    className="w-full aspect-[3/4] rounded-sm border border-ink-700/50 bg-ink-900/80 overflow-hidden cursor-pointer transition-colors hover:border-cyan-400"
                                    onClick={() => setSelectedCG({ id: sprite.id, url: sprite.url, title: `${selectedChar.name} - ${sprite.name}`, unlocked: true, category: 'character' })}
                                  >
                                    <img src={sprite.url} alt={sprite.name} className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                                  </button>
                                  <span className="font-sans text-sm text-paper-200/80 tracking-widest">{sprite.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-ink-500 font-sans tracking-widest text-sm">敬请期待...</div>
                          )}
                        </div>
                      )}

                      {/* Chibi Section */}
                      {selectedChar.gallerySprites.chibi && (
                        <div>
                          <div className="flex items-center gap-4 mb-6">
                            <h3 className={`font-serif text-2xl tracking-widest ${isCyan ? 'text-cyan-400' : 'text-vermilion-400'}`}>小人</h3>
                            <div className={`h-[1px] flex-1 ${isCyan ? 'bg-cyan-500/30' : 'bg-vermilion-500/30'}`} />
                          </div>
                          {selectedChar.gallerySprites.chibi.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                              {selectedChar.gallerySprites.chibi.map(sprite => (
                                <div key={sprite.id} className="flex flex-col items-center gap-3 group">
                                  <button
                                    className="w-full aspect-[3/4] rounded-sm border border-ink-700/50 bg-ink-900/80 overflow-hidden cursor-pointer transition-colors hover:border-cyan-400"
                                    onClick={() => setSelectedCG({ id: sprite.id, url: sprite.url, title: `${selectedChar.name} - ${sprite.name}`, unlocked: true, category: 'character' })}
                                  >
                                    <img src={sprite.url} alt={sprite.name} className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                                  </button>
                                  <span className="font-sans text-sm text-paper-200/80 tracking-widest">{sprite.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-ink-500 font-sans tracking-widest text-sm">暂无数据</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                      <ImageIcon size={64} className="mb-4" />
                      <p className="font-serif text-xl tracking-widest">暂无CG数据</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* --- LOCATION CG GALLERY --- */}
            {galleryTab === 'location_cg' && (
              <motion.div 
                key="tab-cg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full flex flex-col"
              >
                <div className="w-full h-full grid grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pb-10 pr-6">
                  {GALLERY_CGS.map((cg, i) => (
                    <motion.button
                      key={cg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                      onClick={() => handleCGClick(cg)}
                      className={`group relative aspect-video rounded-sm overflow-hidden border transition-all duration-500
                        ${cg.unlocked ? 'border-ink-700 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(48,143,143,0.3)] cursor-pointer' : 'border-ink-800/50 cursor-not-allowed'}
                      `}
                    >
                      <div className="absolute inset-0 bg-ink-900" />
                      
                      {/* Image */}
                      <img 
                        src={cg.url} 
                        alt={cg.title}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700
                          ${cg.unlocked ? 'opacity-70 group-hover:opacity-100 group-hover:scale-105' : 'opacity-20 grayscale blur-[2px]'}
                        `}
                      />
                      
                      {/* Unlocked Overlay */}
                      {cg.unlocked && (
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <span className="font-sans text-xs tracking-[0.3em] text-cyan-400 mb-2 block">NO. {String(i + 1).padStart(3, '0')}</span>
                            <h3 className="font-serif text-xl tracking-widest text-paper-100">{cg.title}</h3>
                          </div>
                        </div>
                      )}
  
                      {/* Locked Overlay */}
                      {!cg.unlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                          <Lock size={28} className="text-ink-600" />
                          <span className="font-sans text-xs tracking-[0.4em] text-ink-600 uppercase">未 解 锁</span>
                        </div>
                      )}
                      
                      {/* Hover Border Effects (Unlocked) */}
                      {cg.unlocked && (
                        <>
                          <div className="absolute top-0 left-0 w-0 h-[1px] bg-cyan-400 group-hover:w-full transition-all duration-500 delay-100" />
                          <div className="absolute bottom-0 right-0 w-0 h-[1px] bg-cyan-400 group-hover:w-full transition-all duration-500 delay-100" />
                        </>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Fullscreen Lightbox for CGs */}
      <AnimatePresence>
        {selectedCG && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/95 backdrop-blur-md">
            <button 
              className="absolute top-8 right-8 text-paper-200 hover:text-vermilion-500 transition-colors z-50 p-2 rounded-full hover:bg-ink-800/50"
              onClick={() => setSelectedCG(null)}
            >
              <X size={32} />
            </button>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              className="relative max-w-7xl max-h-[90vh] p-4 flex flex-col items-center"
            >
              <img 
                src={selectedCG.url} 
                alt={selectedCG.title}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-sm border border-ink-700/50"
              />
              <div className="mt-8 text-center">
                <span className="font-sans text-sm tracking-[0.4em] text-cyan-500 block mb-3 uppercase">CG GALLERY</span>
                <h3 className="font-serif text-3xl tracking-widest text-paper-100 drop-shadow-md">
                  {selectedCG.title}
                </h3>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
