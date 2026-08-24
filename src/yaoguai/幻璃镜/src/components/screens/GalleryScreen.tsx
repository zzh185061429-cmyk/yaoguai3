import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../../store/GameContext';
import { CHARACTER_PROFILES } from '../../data/sampleData';
import { CharacterProfile, SpriteCategory } from '../../types';
import { cn } from '../../utils';
import { sfx } from '../../audio/sfxPlayer';
import { AtmosphereEffect } from '../ui/AtmosphereEffect';
import { useIsMobile } from '../../hooks';
import { X, ZoomIn, ChevronDown, ChevronRight } from 'lucide-react';

// ── 立绘分类 ──
type SpriteTab = 'sfw' | 'nsfw' | 'chibi';

// ── 可折叠文字模块 ──────────────────────────────
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  accentColor = 'gold',
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const accentClasses: Record<string, string> = {
    gold: 'border-gold-500/60 text-gold-300',
    cyan: 'border-cyan-700/60 text-cyan-700',
    vermilion: 'border-vermilion-700/60 text-vermilion-700',
    amber: 'border-[#785c35]/60 text-[#c8a96a]',
    muted: 'border-[#382a1b] text-paper-500',
  };

  return (
    <div className="border-b border-[#382a1b]/50 last:border-b-0">
      <button
        onClick={() => { sfx.play('click'); setOpen(!open); }}
        className="w-full flex items-center gap-1.5 py-1.5 sm:py-2 group cursor-pointer"
      >
        {open
          ? <ChevronDown size={13} className="text-paper-500 shrink-0" />
          : <ChevronRight size={13} className="text-paper-500 shrink-0" />}
        <span className={cn(
          "text-[11px] sm:text-xs font-serif font-bold tracking-wider border-l-2 pl-2",
          accentClasses[accentColor] || accentClasses.muted
        )}>
          {title}
        </span>
        <span className="flex-1 h-px bg-[#382a1b]/40" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-2 sm:pb-2.5 space-y-1.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const GalleryScreen: React.FC = () => {
  const { setCurrentScreen } = useGameContext();
  const isMobile = useIsMobile();
  const [selectedCharId] = useState<string>(CHARACTER_PROFILES[0]?.id || '');
  // 当前立绘分类
  const [spriteTab, setSpriteTab] = useState<SpriteTab>('sfw');
  // SFW 模式下：null = 图鉴初始立绘(illustrationUrl)，否则为 sfw 数组中的情绪 id
  const [sfwExpression, setSfwExpression] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const selectedChar = (CHARACTER_PROFILES.find(c => c.id === selectedCharId) || null) as CharacterProfile | null;

  const handleReturnToGame = () => {
    sfx.play('click');
    setCurrentScreen('game');
  };

  // ── 计算当前展示的立绘图 ──
  const getCurrentIllustration = (): string => {
    if (!selectedChar) return '';
    if (spriteTab === 'sfw') {
      // null = 图鉴初始立绘(灵魅仙姿)
      if (sfwExpression === null) return selectedChar.illustrationUrl || '';
      // 否则取对应情绪
      const sprite = selectedChar.gallerySprites?.sfw?.find(s => s.id === sfwExpression);
      return sprite?.url || selectedChar.illustrationUrl || '';
    }
    if (spriteTab === 'chibi') {
      return selectedChar.gallerySprites?.chibi?.[0]?.url || '';
    }
    // nsfw
    return selectedChar.gallerySprites?.nsfw?.[0]?.url || '';
  };

  const currentIllustration = getCurrentIllustration();

  // ── 当前分类是否有内容 ──
  const hasSfw = (selectedChar?.gallerySprites?.sfw?.length ?? 0) > 0;
  const hasNsfw = (selectedChar?.gallerySprites?.nsfw?.length ?? 0) > 0;
  const hasChibi = (selectedChar?.gallerySprites?.chibi?.length ?? 0) > 0;

  // ── 当前分类标题 ──
  const getTabLabel = (tab: SpriteTab): string => {
    if (tab === 'sfw') return 'SFW';
    if (tab === 'nsfw') return 'NSFW';
    return '小人';
  };

  /** 点击立绘图进入鉴赏模式 */
  const handleIllustrationClick = () => {
    if (!currentIllustration || !selectedChar) return;
    sfx.play('pageTurn');
    let title = selectedChar.name;
    if (spriteTab === 'sfw') {
      const exprInfo = sfwExpression ? selectedChar.gallerySprites?.sfw?.find(s => s.id === sfwExpression) : null;
      title = exprInfo ? `${selectedChar.name} · ${exprInfo.name}` : `${selectedChar.name} · 灵魅仙姿`;
    } else {
      title = `${selectedChar.name} · ${getTabLabel(spriteTab)}`;
    }
    setPreviewImage({ url: currentIllustration, title });
  };

  // ── 立绘图展示（复用） ──
  const IllustrationDisplay = ({ heightClass }: { heightClass: string }) => (
    <div
      className={cn("relative w-full flex items-center justify-center overflow-hidden cursor-pointer group", heightClass)}
      onClick={handleIllustrationClick}
      title="点击鉴赏"
    >
      {currentIllustration ? (
        <motion.img
          key={currentIllustration}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={currentIllustration}
          alt={selectedChar?.name || ''}
          className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-paper-600 font-serif text-sm tracking-widest">
          暂无立绘
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-[#0e0a07]/30">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#33291a]/85 text-gold-300 text-[11px] sm:text-xs font-serif tracking-widest">
          <ZoomIn size={14} />
          鉴赏
        </div>
      </div>
    </div>
  );

  // ── 立绘控制栏（三分类按钮 + SFW情绪按钮） ──
  const SpriteControls = () => (
    <>
      {/* 三分类按钮 */}
      <div className="w-full flex flex-col gap-1">
        <span className="text-[10px] text-paper-500 font-serif tracking-widest">
          立绘·仙姿鉴赏：
        </span>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {/* SFW */}
          <button
            onClick={() => { sfx.play('click'); setSpriteTab('sfw'); setSfwExpression(null); }}
            className={cn(
              "px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-serif rounded-xs border transition-all cursor-pointer",
              spriteTab === 'sfw'
                ? "bg-gold-700 border-gold-500 text-paper-50 font-bold"
                : "bg-[#20150d] border-[#4a3723] text-paper-400 hover:text-gold-300",
              !hasSfw && "opacity-40 cursor-not-allowed"
            )}
            disabled={!hasSfw}
          >
            SFW
          </button>
          {/* NSFW */}
          <button
            onClick={() => { sfx.play('click'); setSpriteTab('nsfw'); }}
            className={cn(
              "px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-serif rounded-xs border transition-all cursor-pointer",
              spriteTab === 'nsfw'
                ? "bg-vermilion-800 border-vermilion-600 text-paper-50 font-bold"
                : "bg-[#20150d] border-[#4a3723] text-paper-400 hover:text-gold-300",
              !hasNsfw && "opacity-40 cursor-not-allowed"
            )}
            disabled={!hasNsfw}
          >
            NSFW
          </button>
          {/* 小人 */}
          <button
            onClick={() => { sfx.play('click'); setSpriteTab('chibi'); }}
            className={cn(
              "px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-serif rounded-xs border transition-all cursor-pointer",
              spriteTab === 'chibi'
                ? "bg-cyan-700 border-cyan-600 text-paper-50 font-bold"
                : "bg-[#20150d] border-[#4a3723] text-paper-400 hover:text-gold-300",
              !hasChibi && "opacity-40 cursor-not-allowed"
            )}
            disabled={!hasChibi}
          >
            小人
          </button>
        </div>
      </div>

      {/* SFW 情绪按钮（仅 SFW 分类时显示，默认展示图鉴立绘） */}
      {spriteTab === 'sfw' && hasSfw && (
        <div className="w-full flex flex-col gap-1">
          <span className="text-[10px] text-paper-500 font-serif tracking-widest">
            神态·情愫变幻：
          </span>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {/* 各情绪按钮（点击切换，不点就默认展示图鉴立绘） */}
            {selectedChar?.gallerySprites?.sfw?.map((s: SpriteCategory) => (
              <button
                key={s.id}
                onClick={() => { sfx.play('click'); setSfwExpression(s.id); }}
                className={cn(
                  "px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-serif rounded-xs border transition-all cursor-pointer",
                  sfwExpression === s.id
                    ? "bg-vermilion-800 border-vermilion-600 text-paper-50"
                    : "bg-[#20150d] border-[#4a3723] text-paper-400 hover:text-gold-300"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // ── 文字内容区（复用，带可折叠模块） ──
  const TextContent = () => (
    <>
      {/* 姓名 */}
      <div className="flex items-center justify-between border-b border-[#382a1b] pb-2 sm:pb-2.5">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-gold-300 tracking-widest truncate">
            {selectedChar?.name}
          </h2>
          <p className="text-[11px] sm:text-xs text-paper-500 tracking-wider mt-0.5 truncate">
            {selectedChar?.title}
          </p>
        </div>
      </div>

      {/* 诗号绝句 */}
      {selectedChar?.poem && (
        <div className="bg-[#1a120b] border-l-2 border-vermilion-800 p-2 sm:p-2.5 rounded-r-xs font-serif text-[11px] sm:text-sm tracking-widest text-gold-300 italic leading-relaxed my-2 sm:my-2.5 shadow-inner">
          {selectedChar.poem}
        </div>
      )}

      {/* 身世简述 — 可折叠 */}
      <CollapsibleSection title="身世密卷" accentColor="gold">
        <p className="text-[11px] sm:text-xs text-paper-400 font-serif leading-relaxed bg-[#160f09] p-2 sm:p-2.5 border border-[#382a1b] rounded-xs">
          {selectedChar?.description}
        </p>
      </CollapsibleSection>

      {/* 喜好 — 可折叠 */}
      {selectedChar?.likes && selectedChar.likes.length > 0 && (
        <CollapsibleSection title="性之所好" accentColor="cyan">
          {selectedChar.likes.map((like, idx) => (
            <div key={idx} className="text-[11px] sm:text-xs font-serif text-paper-50/90 bg-[#1a120b]/60 p-1.5 sm:p-2 border-l border-cyan-700 rounded-r-xs">
              <span className="text-cyan-700 font-bold">「{like.item}」</span>
              <p className="mt-0.5 text-paper-400">{like.quote}</p>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* 厌恶 — 可折叠 */}
      {selectedChar?.dislikes && selectedChar.dislikes.length > 0 && (
        <CollapsibleSection title="性之所恶" accentColor="vermilion" defaultOpen={false}>
          {selectedChar.dislikes.map((dislike, idx) => (
            <div key={idx} className="text-[11px] sm:text-xs font-serif text-paper-50/90 bg-[#1a120b]/60 p-1.5 sm:p-2 border-l border-vermilion-700 rounded-r-xs">
              <span className="text-vermilion-700 font-bold">「{dislike.item}」</span>
              <p className="mt-0.5 text-paper-400">{dislike.quote}</p>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* 隐秘 — 可折叠 */}
      {selectedChar?.secrets && selectedChar.secrets.length > 0 && (
        <CollapsibleSection title="幽微秘辛" accentColor="gold" defaultOpen={false}>
          {selectedChar.secrets.map((secret, idx) => (
            <div key={idx} className="text-[11px] sm:text-xs font-serif text-gold-300/80 italic bg-[#1a120b]/60 p-1.5 sm:p-2 border-l border-gold-500 rounded-r-xs">
              {secret}
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* 独白心语 — 可折叠 */}
      {selectedChar?.quotes && selectedChar.quotes.length > 0 && (
        <CollapsibleSection title="灵犀私语" accentColor="amber" defaultOpen={false}>
          {selectedChar.quotes.map((q, idx) => (
            <div key={idx} className="text-[11px] sm:text-xs font-serif text-paper-50/90 italic bg-[#1a120b]/60 p-1.5 sm:p-2 border-l border-[#785c35] rounded-r-xs">
              「 {q} 」
            </div>
          ))}
        </CollapsibleSection>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full h-screen bg-[#0c0906] text-paper-100 overflow-hidden flex flex-col font-serif select-none"
      id="screen-gallery"
    >
      {/* 沉稳古朴暗水墨底图 */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528646927357-55d81b29a286?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-linear-to-b from-[#0e0a07]/95 via-[#120d09]/90 to-[#080504]/98" />
      <AtmosphereEffect />

      {/* 仿古回纹边框 */}
      <div className="absolute inset-3 sm:inset-6 border border-[#4d3c26]/50 pointer-events-none rounded-xs z-20">
        <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-gold-500/60" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-gold-500/60" />
        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-gold-500/60" />
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-gold-500/60" />
      </div>

      {/* 顶部导航栏 */}
      <div className="relative z-30 flex items-center justify-between px-3 sm:px-8 py-2.5 sm:py-3.5 border-b border-[#3d2e1c] bg-[#140f0b]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-vermilion-800 shrink-0" />
            <h1 className="text-sm sm:text-xl font-bold tracking-[0.15em] sm:tracking-[0.3em] text-paper-50">
              红 颜 画 卷 · 灵 魅 谱
            </h1>
          </div>
          <span className="hidden sm:inline-block text-xs font-serif tracking-widest text-paper-500 border-l border-[#4a3b27] pl-3">
            灵犀因缘录
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            id="btn-gallery-return-game"
            onClick={handleReturnToGame}
            className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-[#261a10] hover:bg-[#382618] border border-gold-700 text-gold-300 hover:text-paper-50 rounded-xs font-serif text-[11px] sm:text-sm tracking-widest transition-all shadow-sm cursor-pointer"
          >
            回归案卷
          </button>
        </div>
      </div>

      {/* 核心内容区 */}
      <div className="relative z-20 flex-1 flex flex-col p-2 sm:p-6 overflow-hidden">
        {selectedChar ? (

          /* ═══ 手机端：整体上下滚动 ═══ */
          isMobile ? (
            <div className="flex-1 bg-[#140e0a]/90 border border-[#453422] rounded-xs p-2.5 overflow-y-auto custom-scrollbar space-y-2.5 shadow-inner">
              {/* 立绘 + 控制按钮 */}
              <div className="flex flex-col items-center bg-[#18110b] border border-[#382a1b] rounded-xs p-2 relative overflow-hidden">
                <IllustrationDisplay heightClass="h-44" />
                <div className="w-full mt-2 pt-2 border-t border-[#382a1b] flex flex-col gap-1.5">
                  <SpriteControls />
                </div>
              </div>

              {/* 文字内容区 */}
              <div className="bg-[#18110b]/50 border border-[#382a1b]/60 rounded-xs p-2.5 space-y-2">
                <TextContent />
              </div>
            </div>

          ) : (

          /* ═══ 电脑端：左右并排 ═══ */
          <div className="flex-1 bg-[#140e0a]/90 border border-[#453422] rounded-xs p-2 sm:p-5 flex flex-row gap-2.5 sm:gap-5 overflow-hidden shadow-inner">
            {/* 立绘与控制按钮 */}
            <div className="w-1/2 flex flex-col items-center justify-between bg-[#18110b] border border-[#382a1b] rounded-xs p-2 sm:p-4 relative overflow-hidden">
              <IllustrationDisplay heightClass="flex-1 min-h-55 max-h-90" />
              <div className="w-full mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#382a1b] flex flex-col gap-1 sm:gap-1.5">
                <SpriteControls />
              </div>
            </div>

            {/* 文字区 */}
            <div className="w-1/2 flex flex-col overflow-y-auto custom-scrollbar pr-1 sm:pr-2 space-y-2 sm:space-y-3.5">
              <TextContent />
            </div>
          </div>
          )
        ) : (
        <div className="flex-1 bg-[#140e0a]/90 border border-[#453422] rounded-xs p-4 flex items-center justify-center">
          <div className="flex items-center justify-center h-full text-paper-600 font-serif text-sm tracking-widest">
            暂无红颜灵魅录
          </div>
        </div>
        )}
      </div>

      {/* 立绘全屏鉴赏模式 */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070503]/95 backdrop-blur-md p-2 sm:p-4">
            <button
              className="absolute top-3 right-3 sm:top-6 sm:right-6 text-paper-400 hover:text-vermilion-400 p-2 rounded-xs border border-[#52432d] bg-[#1a120b] transition-colors z-50 cursor-pointer"
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl max-h-[85vh] flex flex-col items-center"
            >
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] sm:max-h-[75vh] object-contain rounded-xs border-2 border-gold-700 shadow-[0_0_40px_rgba(0,0,0,0.9)]"
              />
              <h3 className="font-serif text-base sm:text-xl font-bold text-gold-300 tracking-widest mt-2 sm:mt-3">
                {previewImage.title}
              </h3>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
