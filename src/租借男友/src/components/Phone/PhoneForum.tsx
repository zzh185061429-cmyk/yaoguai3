/**
 * 手机论坛 — 板块切换 + 帖子列表 + 帖子详情
 *
 * 首页：综合热门帖子（自动加载）
 * 切换板块：手动点击后才加载
 * 点击帖子：进入详情页
 * 关注帖子 → 写入聊天世界书条目（桥接主线AI）
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw, Pin, PinOff, Loader, MessageSquare, Eye, Reply, Send, Archive } from 'lucide-react';
import { AppHeader } from './PhoneShared';
import { usePhoneContext } from '../../state/PhoneContext';
import { useGameContext } from '../../state/GameContext';
import { FORUM_BOARDS, type ForumBoard, type ForumPost } from '../../utils/phoneApi';
import { cn } from '../../utils';
import { sfx } from '../../audio/sfxPlayer';

// ── 头像 ──
const AVATAR_COLORS = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-amber-500',
  'from-purple-500 to-violet-500',
  'from-red-500 to-orange-500',
  'from-indigo-500 to-blue-500',
  'from-teal-500 to-green-500',
];

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const initial = name.slice(0, 2);
  const sizes = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-[11px]', lg: 'w-10 h-10 text-xs' };
  return (
    <div className={cn('shrink-0 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br', color, sizes[size])}>
      {initial}
    </div>
  );
}

// ── 主组件 ──
export function PhoneForum({ onExit }: { onExit: () => void }) {
  const { refreshForum, followPost, unfollowPost, followedPosts, isReady, replyForumPost } = usePhoneContext();
  const [activeBoard, setActiveBoard] = useState<ForumBoard>('首页');
  const [postsByBoard, setPostsByBoard] = useState<Record<string, ForumPost[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const isMounted = useRef(true);
  const refreshRef = useRef(refreshForum);
  refreshRef.current = refreshForum;

  const loadBoard = useCallback(async (board: ForumBoard) => {
    if (!isReady) return;
    setLoading(true);
    setLoadError(null);
    try {
      const newPosts = await refreshRef.current(board);
      if (isMounted.current) {
        setPostsByBoard((prev) => ({ ...prev, [board]: newPosts }));
        if (newPosts.length === 0) {
          setLoadError('生成失败，请重试');
          console.warn(`[PhoneForum] 板块 ${board} 返回空帖子列表`);
        }
      }
    } catch (err) {
      console.error(`[PhoneForum] 板块 ${board} 加载失败:`, err);
      if (isMounted.current) setLoadError('加载失败，请重试');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    isMounted.current = true;
    if (isReady) loadBoard('首页');
    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const handleSwitchBoard = useCallback((board: ForumBoard) => {
    setActiveBoard(board);
    setSelectedPost(null);
    // 如果该板块未加载过、或上次加载结果为空，则重新加载
    const cached = postsByBoard[board];
    if (!cached || cached.length === 0) loadBoard(board);
  }, [postsByBoard, loadBoard]);

  const isFollowed = useCallback((id: string) => followedPosts.some((p) => p.id === id), [followedPosts]);

  // Sync selectedPost with latest followedPosts data (so replies update in real-time)
  useEffect(() => {
    if (selectedPost) {
      const updated = followedPosts.find((p) => p.id === selectedPost.id);
      if (updated && updated.replies.length !== selectedPost.replies.length) {
        setSelectedPost(updated);
      }
    }
  }, [followedPosts, selectedPost]);

  const handleFollow = useCallback(async (post: ForumPost) => {
    if (isFollowed(post.id)) await unfollowPost(post.id);
    else await followPost(post);
  }, [isFollowed, followPost, unfollowPost]);

  // 回复帖子：直接用返回的更新后的帖子刷新 UI
  const handleReply = useCallback(async (post: ForumPost, text: string, replyTarget?: { username: string; content: string } | null) => {
    const updatedPost = await replyForumPost(post, text, replyTarget);
    if (updatedPost) setSelectedPost(updatedPost);
  }, [replyForumPost]);

  if (!isReady) {
    return (
      <div className="h-full flex flex-col bg-pop-black">
        <AppHeader title="论坛" color="bg-pop-pink" textColor="text-white" onBack={onExit} />
        <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-6 text-center">
          <MessageSquare className="w-10 h-10 mb-3 opacity-20" strokeWidth={2} />
          <p className="text-sm font-black italic transform -skew-x-6">副API未配置</p>
          <p className="text-xs mt-1 font-bold">请在设置中配置副API后使用论坛</p>
        </div>
      </div>
    );
  }

  if (selectedPost) {
    return <PostDetail post={selectedPost} isFollowed={isFollowed(selectedPost.id)} onBack={() => setSelectedPost(null)} onToggleFollow={() => handleFollow(selectedPost)} onReply={(text, replyTarget) => handleReply(selectedPost, text, replyTarget)} isReady={isReady} />;
  }

  const currentPosts = postsByBoard[activeBoard] || [];
  const showFollowed = followedPosts.length > 0;

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* 顶部栏 — 波普风格 */}
      <AppHeader
        title="论坛"
        color="bg-pop-pink"
        textColor="text-white"
        onBack={onExit}
        rightIcon={
          <button
            onClick={() => loadBoard(activeBoard)}
            disabled={loading}
            className="w-8 h-8 bg-pop-black text-white rounded-lg flex items-center justify-center transform -skew-x-6 hover:scale-110 border-2 border-white/20 disabled:opacity-40 transition-transform"
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
        }
      />

      {/* 板块导航 — 网格按钮 */}
      <div className="shrink-0 grid grid-cols-3 gap-1 px-2 py-2 bg-[#1e1e1e] border-b border-[#333]">
        {FORUM_BOARDS.map((board) => {
          const active = activeBoard === board.key;
          return (
            <button key={board.key} onClick={() => handleSwitchBoard(board.key)}
              className={cn(
                'py-1.5 rounded-md text-xs font-bold transition-all border',
                active
                  ? 'bg-[#333] text-white border-[#555]'
                  : cn('bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]', board.color),
              )}>
              {board.label}
            </button>
          );
        })}
      </div>

      {/* 帖子列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading && currentPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader className="w-5 h-5 animate-spin mb-2" />
            <span className="text-xs">加载中...</span>
          </div>
        )}

        {!loading && currentPosts.length === 0 && !showFollowed && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 p-6 text-center">
            <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-bold">{loadError || '暂无帖子'}</p>
            <button
              onClick={() => loadBoard(activeBoard)}
              className="mt-3 px-4 py-1.5 bg-pop-pink text-white text-xs font-bold rounded-lg transform -skew-x-6 hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" /> 重新加载
            </button>
          </div>
        )}

        {/* 关注的帖子（固定显示在所有板块顶部） */}
        {showFollowed && (
          <div className="bg-amber-900/10 border-b border-amber-700/20">
            <div className="px-3 py-1 text-amber-500/60 text-[10px] font-bold flex items-center gap-1">
              <Pin className="w-2.5 h-2.5" /> 关注 · 固定
            </div>
            {followedPosts.map((post) => (
              <PostListItem key={post.id} post={post} isFollowed={true}
                onClick={() => setSelectedPost(post)} onToggleFollow={() => handleFollow(post)} />
            ))}
          </div>
        )}

        {/* 分隔标题 */}
        {currentPosts.length > 0 && (
          <div className="px-3 py-1 text-gray-600 text-[10px] font-bold">
            {activeBoard === '首页' ? '最新帖子' : `${activeBoard}板块`}
          </div>
        )}

        {/* 帖子列表 */}
        {currentPosts.map((post) => (
          <PostListItem key={post.id} post={post} isFollowed={isFollowed(post.id)}
            onClick={() => setSelectedPost(post)} onToggleFollow={() => handleFollow(post)} />
        ))}
      </div>
    </div>
  );
}

// ── 帖子列表项 ──
function PostListItem({ post, isFollowed, onClick, onToggleFollow }: {
  post: ForumPost; isFollowed: boolean; onClick: () => void; onToggleFollow: () => void;
}) {
  return (
    <div onClick={onClick} className="flex items-start gap-2.5 px-3 py-2.5 border-b border-[#2a2a2a] hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors cursor-pointer">
      {/* 左侧头像 */}
      <UserAvatar name={post.username} size="sm" />

      {/* 右侧内容 */}
      <div className="flex-1 min-w-0">
        {/* 用户名行 */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-gray-400 text-[11px] font-bold">{post.username}</span>
          {post.board !== '首页' && (
            <span className={cn('text-[8px] px-1 py-0.5 rounded font-bold bg-[#333]',
              FORUM_BOARDS.find((b) => b.key === post.board)?.color || 'text-gray-400')}>
              {post.board}
            </span>
          )}
          {/* 关注按钮 */}
          <button onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
            className={cn('ml-auto shrink-0 p-1 rounded transition-colors',
              isFollowed ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400')}>
            {isFollowed ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>
        </div>

        {/* 标题 */}
        <h3 className="text-white text-sm font-bold leading-snug mb-0.5 truncate">{post.title}</h3>

        {/* 内容预览 */}
        <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 mb-1">{post.content}</p>

        {/* 底部统计 */}
        <div className="flex items-center gap-3 text-gray-600 text-[10px]">
          <span className="flex items-center gap-0.5">
            <Reply className="w-2.5 h-2.5" />
            {post.replies.length}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            详情
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 帖子详情页 ──
function PostDetail({ post, isFollowed, onBack, onToggleFollow, onReply, isReady }: {
  post: ForumPost; isFollowed: boolean; onBack: () => void; onToggleFollow: () => void; onReply: (text: string, replyTarget?: { username: string; content: string } | null) => Promise<void>; isReady: boolean;
}) {
  const { playerName } = useGameContext();
  const pName = playerName || '玩家';
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ username: string; content: string } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // 保存 replyTarget 到 ref，避免闭包问题
  const replyTargetRef = useRef<{ username: string; content: string } | null>(null);
  replyTargetRef.current = replyTarget;

  const handleReply = useCallback(async () => {
    const trimmed = replyText.trim();
    if (!trimmed || isReplying || !isReady) return;
    const target = replyTargetRef.current;
    setReplyText(''); setIsReplying(true); setReplyTarget(null); sfx.play('send');
    try { await onReply(trimmed, target); } catch (err) { console.error('[PhoneForum] 回复失败:', err); } finally { setIsReplying(false); }
  }, [replyText, isReplying, isReady, onReply]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } };

  const handleReplyToFloor = useCallback((username: string, content: string) => {
    setReplyTarget({ username, content });
    // 聚焦输入框
    setTimeout(() => replyInputRef.current?.focus(), 0);
  }, []);

  const cancelReplyTarget = useCallback(() => {
    setReplyTarget(null);
  }, []);

  return (
    <div className="h-full flex flex-col bg-pop-black">
      {/* 顶部导航 — 波普风格 */}
      <AppHeader
        title="帖子详情"
        color="bg-pop-pink"
        textColor="text-white"
        onBack={onBack}
        rightIcon={
          <span className={cn('text-[10px] px-2 py-0.5 font-black bg-pop-black text-white border-2 border-white/20 transform -skew-x-3')}>
            {post.board}
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* 帖子主体 */}
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <UserAvatar name={post.username} size="lg" />
            <div className="flex-1">
              <div className="text-white font-bold text-sm">{post.username}</div>
              <div className="text-white/30 text-[10px]">楼主</div>
            </div>
            <button onClick={onToggleFollow}
              className={cn('flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors border-2',
                isFollowed ? 'bg-pop-pink/20 text-pop-pink border-pop-pink/40' : 'bg-gray-800 text-white/50 hover:text-white border-gray-700')}>
              {isFollowed ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              {isFollowed ? '已关注' : '关注'}
            </button>
          </div>
          <h2 className="text-white font-bold text-base mb-2 leading-tight">{post.title}</h2>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
        </div>

        {/* 回复区 */}
        <div className="px-3 py-3">
          <div className="text-white/50 text-xs font-bold mb-3 flex items-center gap-1">
            <Reply className="w-3 h-3" />
            {post.replies.length > 0 ? `全部回复 ${post.replies.length} 条` : '暂无回复'}
          </div>
          <div className="space-y-4">
            {post.replies.map((reply, i) => {
              // 摘要回复 — 居中灰色卡片
              if (reply.username === '系统摘要') {
                return (
                  <div key={i} className="flex justify-center">
                    <div className="max-w-[90%] bg-gray-800/60 text-gray-400 rounded-lg px-3 py-2 text-xs leading-relaxed border border-gray-700">
                      <div className="flex items-center gap-1.5 mb-1 text-gray-500 font-bold">
                        <Archive className="w-3 h-3" />
                        <span>回复摘要</span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.content.replace(/^【回复摘要】/, '')}</p>
                    </div>
                  </div>
                );
              }
              return (
              <div key={i} className="flex items-start gap-2">
                <UserAvatar name={reply.username} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn('text-xs font-bold', reply.username === pName ? 'text-pop-yellow' : 'text-white/80')}>{reply.username}</span>
                    <span className="text-white/30 text-[10px]">{i + 1}楼</span>
                    {reply.replyTo && (
                      <span className="text-white/30 text-[10px]">回复 {reply.replyTo}</span>
                    )}
                    {/* 回复按钮 */}
                    <button
                      onClick={() => handleReplyToFloor(reply.username, reply.content)}
                      className="ml-auto shrink-0 text-white/30 hover:text-pop-pink transition-colors text-[10px] flex items-center gap-0.5"
                    >
                      <Reply className="w-2.5 h-2.5" />
                      回复
                    </button>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">{reply.content}</p>
                </div>
              </div>
              );
            })}
          </div>
          {isReplying && <div className="flex items-center gap-2 text-white/40 text-xs mt-3"><Loader className="w-3 h-3 animate-spin" /> 网友正在回复...</div>}
          <div className="h-2" />
        </div>
      </div>

      {/* 回复目标提示 */}
      {replyTarget && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 border-t border-gray-700 text-xs">
          <span className="text-white/50">回复</span>
          <span className="text-pop-pink font-bold">{replyTarget.username}</span>
          <span className="text-white/40 truncate flex-1">{replyTarget.content.slice(0, 30)}{replyTarget.content.length > 30 ? '...' : ''}</span>
          <button onClick={cancelReplyTarget} className="text-white/40 hover:text-white/80 shrink-0">✕</button>
        </div>
      )}

      {/* 回复输入栏 */}
      <div className="shrink-0 flex items-end gap-2 p-2 bg-gray-900 border-t border-gray-800">
        <textarea
          ref={replyInputRef}
          value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={isReady ? (replyTarget ? `回复 ${replyTarget.username}... (Enter发送)` : '回复帖子... (Enter发送)') : '请先配置副API'} rows={1} disabled={!isReady || isReplying}
          className="flex-1 bg-gray-800 text-white text-sm rounded-2xl px-3 py-2 resize-none focus:outline-none placeholder:text-white/30 disabled:opacity-50 border border-gray-700"
          style={{ maxHeight: '100px' }}
        />
        <button onClick={handleReply} disabled={!replyText.trim() || !isReady || isReplying}
          className="shrink-0 w-9 h-9 rounded-full bg-pop-pink text-white flex items-center justify-center disabled:opacity-40 disabled:bg-gray-600">
          {isReplying ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
