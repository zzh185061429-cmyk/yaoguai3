/**
 * 朋友圈 — 微信"发现"Tab 内容
 *
 * 参照 rent-a-boyfriend-pop-ui 波普风格：
 * - 黑色封面 + 条纹图案覆盖
 * - 玩家头像：方形 border-4，右下角倾斜放置
 * - 动态信息流：头像(左) + 姓名/正文/时间/操作(右)
 * - 姓名：黑底彩字 + 白边框 + 硬阴影
 * - 评论区域：白底 border-2 + 小三角箭头
 * - 操作弹出条：黑底 + 波普按钮
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Loader, Camera, RefreshCw, MoreHorizontal, Image as ImageIcon, MapPin } from 'lucide-react';
import { usePhoneContext } from '../../state/PhoneContext';
import { useGameContext } from '../../state/GameContext';
import { cn } from '../../utils';

const AVATAR_COLORS = [
  'bg-pop-pink',
  'bg-pop-cyan',
  'bg-pop-yellow',
  'bg-pop-green',
  'bg-purple-500',
];

function CharAvatar({ name, avatar, size = 'md' }: { name: string; avatar?: string; size?: 'sm' | 'md' | 'lg' }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };
  return (
    <div className={cn(
      'shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-white font-black border-2 border-pop-black shadow-sm',
      color, sizes[size],
    )}>
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(-1)
      )}
    </div>
  );
}

function formatMomentTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 172800000) return '昨天';
  return `${Math.floor(diff / 86400000)}天前`;
}

// 头像颜色（用于姓名标签）
const NAME_COLORS = ['text-pop-pink', 'text-pop-cyan', 'text-pop-green', 'text-pop-yellow', 'text-purple-400'];
function getNameColor(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return NAME_COLORS[hash % NAME_COLORS.length];
}

export function PhoneMoments() {
  const { moments, isReady, refreshMoments, initMoments, likeMoment, commentMoment, config } = usePhoneContext();
  const { playerName, playerAvatar } = useGameContext();
  const [refreshing, setRefreshing] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 首次打开且无内容时自动批量生成
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (!isReady || moments.length > 0) return;
    initRef.current = true;
    setInitializing(true);
    initMoments().finally(() => setInitializing(false));
  }, [isReady, moments.length, initMoments]);

  const handleRefresh = useCallback(async () => {
    if (!isReady || refreshing) return;
    setRefreshing(true);
    try { await refreshMoments(true); } finally { setRefreshing(false); }
  }, [isReady, refreshing, refreshMoments]);

  const handleSubmitComment = useCallback(async (id: string) => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setCommentText('');
    setCommentingId(null);
    setReplyLoadingId(id);
    try {
      await commentMoment(id, trimmed);
    } finally {
      setReplyLoadingId(null);
    }
  }, [commentText, commentMoment]);

  // 点击外部关闭操作菜单
  useEffect(() => {
    if (!actionMenuId) return;
    const handler = () => setActionMenuId(null);
    const timer = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', handler); };
  }, [actionMenuId]);

  return (
    <div className="h-full flex flex-col bg-[#f0f0f0]">
      {/* 内容区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar">
        {/* 封面 + 玩家头像 — 黑底条纹波普风格 */}
        <div className="relative mb-14">
          {/* 封面背景（独立裁剪，不裁剪溢出的头像） */}
          <div className="h-32 bg-pop-black relative shadow-[0px_4px_0px_0px_#1a1a1a] overflow-hidden">
            <div className="absolute inset-0 bg-stripes opacity-30" />
            <div className="absolute inset-0 bg-halftone-white opacity-10" />
          </div>
          {/* 玩家头像 — 半溢出在封面下方，不被裁剪 */}
          <div className="absolute -bottom-7 right-3 w-14 h-14 border-4 border-pop-black flex items-center justify-center font-black text-white text-lg shadow-pop transform rotate-3 z-10 overflow-hidden bg-pop-pink">
            {playerAvatar ? (
              <img src={playerAvatar} alt="我" className="w-full h-full object-cover" />
            ) : (
              <span>我</span>
            )}
          </div>
          {/* 玩家名 — 在头像左侧，不被遮挡 */}
          <div className="absolute -bottom-4 right-20 bg-white text-pop-black px-2 py-0.5 border-2 border-pop-black font-black text-sm italic transform -skew-x-6 shadow-pop z-10">
            {playerName || '玩家'}
          </div>
        </div>

        {/* 动态列表 */}
        {moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-pop-black/30 p-8 text-center mt-4">
            {initializing ? (
              <>
                <Loader className="w-8 h-8 mb-3 animate-spin text-pop-black/40" />
                <p className="text-sm font-black italic transform -skew-x-6">正在生成朋友圈...</p>
                <p className="text-xs mt-1 font-bold">角色们正在发动态</p>
              </>
            ) : (
              <>
                <Camera className="w-10 h-10 mb-3 opacity-30" strokeWidth={2} />
                <p className="text-sm font-black italic transform -skew-x-6">还没有朋友圈动态</p>
                <p className="text-xs mt-1 font-bold">关联角色后，他们会在合适的时候自动发朋友圈</p>
                {isReady && (
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-pop-green text-pop-black text-xs font-black border-2 border-pop-black shadow-pop transform -skew-x-3 disabled:opacity-40 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} /> 生成一条
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="pb-4 px-4 space-y-5">
            {moments.map((moment) => {
              const charLink = config.characters.find((c) => c.name === moment.charName);
              return (
              <MomentItem
                key={moment.id}
                moment={moment}
                avatar={charLink?.avatar}
                isActionOpen={actionMenuId === moment.id}
                onToggleAction={() => setActionMenuId(actionMenuId === moment.id ? null : moment.id)}
                onLike={() => { likeMoment(moment.id); setActionMenuId(null); }}
                onComment={() => { setCommentingId(commentingId === moment.id ? null : moment.id); setActionMenuId(null); }}
                isCommenting={commentingId === moment.id}
                isReplyLoading={replyLoadingId === moment.id}
                commentText={commentText}
                setCommentText={setCommentText}
                onSubmitComment={() => handleSubmitComment(moment.id)}
              />
              );
            })}
            {refreshing && (
              <div className="flex items-center justify-center py-4 text-pop-black/40 text-xs font-bold">
                <Loader className="w-3 h-3 animate-spin mr-2" /> 生成中...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 单条朋友圈动态 — 波普风格 ──
function MomentItem({
  moment, avatar, isActionOpen, onToggleAction, onLike, onComment,
  isCommenting, isReplyLoading, commentText, setCommentText, onSubmitComment,
}: {
  moment: {
    id: string; charName: string; text: string; ts: number;
    likes: number; liked: boolean; comments: { username: string; content: string }[];
    location: string;
  };
  avatar?: string;
  isActionOpen: boolean;
  onToggleAction: () => void;
  onLike: () => void;
  onComment: () => void;
  isCommenting: boolean;
  isReplyLoading: boolean;
  commentText: string;
  setCommentText: (v: string) => void;
  onSubmitComment: () => void;
}) {
  const nameColor = getNameColor(moment.charName);

  return (
    <div className="flex gap-2.5">
      <CharAvatar name={moment.charName} avatar={avatar} size="md" />

      <div className="flex-1 min-w-0">
        {/* 角色名 — 黑底彩字 + 白边框 + 硬阴影 */}
        <h4 className={cn(
          'font-black text-xs uppercase italic transform -skew-x-3 bg-pop-black px-2 py-0.5 inline-block border-2 border-white shadow-pop',
          nameColor,
        )}>
          {moment.charName}
        </h4>

        {/* 正文 */}
        <p className="text-pop-black text-sm leading-relaxed whitespace-pre-wrap mt-1.5 font-bold">{moment.text}</p>

        {/* 定位 */}
        <div className="text-pop-black/50 text-[11px] mt-1.5 font-bold flex items-center gap-0.5">
          <MapPin className="w-2.5 h-2.5" />{moment.location}
        </div>

        {/* 图片占位（如果有） */}
        <div className="w-28 h-28 bg-pop-yellow border-4 border-pop-black mt-2 flex items-center justify-center shadow-pop transform -skew-x-2 hover:scale-105 transition-transform">
          <ImageIcon size={32} className="text-pop-black/30" />
        </div>

        {/* 时间 + 操作 */}
        <div className="flex justify-between items-center mt-2.5">
          <span className="text-[10px] text-pop-black/40 font-black">{formatMomentTime(moment.ts)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleAction(); }}
            className={cn(
              'flex items-center justify-center px-2 py-0.5 border-2 border-pop-black text-pop-black/60 text-xs transition-all font-black',
              isActionOpen ? 'bg-pop-black text-white' : 'bg-white hover:bg-pop-black/5',
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 操作弹出条 — 黑底波普按钮 */}
        <AnimatePresence>
          {isActionOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex items-center bg-pop-black border-2 border-pop-black overflow-hidden mt-2 w-fit shadow-pop"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onLike}
                className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-black hover:bg-pop-pink transition-colors"
              >
                <Heart className={cn('w-3.5 h-3.5', moment.liked && 'fill-pop-pink text-pop-pink')} strokeWidth={3} />
                {moment.liked ? '取消' : '赞'}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={onComment}
                className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-black hover:bg-pop-cyan hover:text-pop-black transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={3} />
                评论
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 点赞 + 评论区域 — 白底边框 + 小三角 */}
        {(moment.likes > 0 || moment.comments.length > 0) && (
          <div className="bg-white border-2 border-pop-black p-2 mt-2.5 space-y-1 shadow-pop relative">
            {/* 小三角 */}
            <div className="absolute -top-2 right-4 w-3 h-3 bg-white border-t-2 border-l-2 border-pop-black transform rotate-45" />

            {moment.likes > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Heart className="w-3 h-3 text-pop-pink fill-pop-pink shrink-0" strokeWidth={2} />
                <span className="text-pop-pink font-black italic transform -skew-x-3">{moment.likes}人觉得很赞</span>
              </div>
            )}
            {moment.likes > 0 && moment.comments.length > 0 && (
              <div className="w-full h-px bg-pop-black/10" />
            )}
            {moment.comments.map((c, i) => (
              <div key={i} className="text-xs leading-relaxed">
                <span className={cn('font-black italic transform -skew-x-3', getNameColor(c.username))}>{c.username}: </span>
                <span className="text-pop-black/70 font-bold">{c.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* 对方正在回复提示 */}
        {isReplyLoading && (
          <div className="flex items-center gap-1.5 mt-2 text-pop-black/40 text-xs font-bold">
            <Loader className="w-3 h-3 animate-spin" />
            <span>对方正在回复...</span>
          </div>
        )}

        {/* 评论输入 */}
        <AnimatePresence>
          {isCommenting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSubmitComment(); }}
                  placeholder="评论..."
                  autoFocus
                  className="flex-1 bg-white text-pop-black text-xs rounded-lg px-3 py-2 border-2 border-pop-black focus:outline-none placeholder:text-pop-black/30 font-bold shadow-sm"
                />
                <button
                  onClick={onSubmitComment}
                  disabled={!commentText.trim()}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-pop-green text-pop-black text-xs font-black border-2 border-pop-black shadow-pop disabled:opacity-40 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  发送
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
