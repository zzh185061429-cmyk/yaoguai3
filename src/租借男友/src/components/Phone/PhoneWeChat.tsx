/**
 * 微信 — 一个完整应用，含底部 Tab 导航
 *
 * 参照 rent-a-boyfriend-pop-ui 波普风格：
 * - AppHeader: 绿色底 + border-b-4 + 半调覆盖 + 斜体倾斜标题
 * - 聊天列表: 每条都是独立卡片 border-4 border-pop-black + shadow-pop
 * - 底部导航: 白底 + border-t-4 + 激活态倾斜 + 硬阴影
 * - 消息气泡: 厚边框 + 硬阴影 + 三角箭头
 * - 朋友圈: 点击「发现」直接进入（右侧滑入）
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader, Search, Plus, MessageCircle, Compass, User, Users,
  Trash2, Check, RefreshCw, Archive, MoreVertical, History,
} from 'lucide-react';
import { usePhoneContext } from '../../state/PhoneContext';
import { useGameContext } from '../../state/GameContext';
import type { PhoneMessage, GroupMessage } from '../../utils/phoneApi';
import { cn } from '../../utils';
import { sfx } from '../../audio/sfxPlayer';
import { AppHeader, BottomNav, type NavTab } from './PhoneShared';

// 懒加载朋友圈
const PhoneMoments = lazy(() => import('./PhoneMoments').then((m) => ({ default: m.PhoneMoments })));

// ── Tab 类型 ──
type WeChatTab = 'chats' | 'discover' | 'me';

// ── 头像颜色池 ──
const AVATAR_COLORS = [
  'from-pop-pink to-rose-500',
  'from-pop-cyan to-blue-500',
  'from-pop-yellow to-amber-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-violet-500',
];

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const TABS: NavTab[] = [
  { id: 'chats', label: '微信', icon: MessageCircle },
  { id: 'discover', label: '发现', icon: Compass },
  { id: 'me', label: '我', icon: User },
];

// ── 长按删除 hook ──
function useLongPress(callback: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => callbackRef.current(), delay);
  }, [delay]);
  const clear = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);
  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}

// ── 确认弹窗 ──
function ConfirmDialog({
  open, title, message, confirmText, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-4 border-pop-black p-4 max-w-[260px] w-full shadow-2xl"
          >
            <h3 className="text-pop-black font-black text-sm mb-2">{title}</h3>
            <p className="text-pop-black/60 text-xs mb-4 leading-relaxed">{message}</p>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2 bg-gray-200 text-pop-black/60 text-xs font-black rounded border-2 border-pop-black/10"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 bg-pop-pink text-white text-xs font-black rounded border-2 border-pop-black shadow-pop"
              >
                {confirmText || '确认'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── 聊天操作菜单按钮（仅按钮，放在头部） ──
function ChatActionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 bg-pop-black text-white rounded-lg flex items-center justify-center transform -skew-x-6 hover:scale-110 border-2 border-pop-black transition-transform"
    >
      <MoreVertical size={16} />
    </button>
  );
}

// ── 聊天操作下拉菜单（渲染在 ChatDetail 根容器中，避免被 overflow-hidden 裁剪） ──
function ChatActionDropdown({ onClearHistory, onCompress, onViewArchives, onClose }: { onClearHistory: () => void; onCompress: () => void; onViewArchives: () => void; onClose: () => void }) {
  return (
    <AnimatePresence>
      <>
        <div className="absolute inset-0 z-40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-2 top-14 z-50 bg-white border-4 border-pop-black shadow-pop min-w-[140px]"
        >
          <button
            onClick={() => { onClose(); onCompress(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-pop-black text-xs font-black hover:bg-pop-cyan/10 transition-colors border-b-2 border-pop-black/10"
          >
            <Archive className="w-3.5 h-3.5 text-pop-cyan" />
            压缩消息
          </button>
          <button
            onClick={() => { onClose(); onViewArchives(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-pop-black text-xs font-black hover:bg-pop-yellow/10 transition-colors border-b-2 border-pop-black/10"
          >
            <History className="w-3.5 h-3.5 text-pop-yellow" />
            查看压缩记录
          </button>
          <button
            onClick={() => { onClose(); onClearHistory(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-pop-black text-xs font-black hover:bg-pop-pink/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-pop-pink" />
            清空聊天记录
          </button>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

// ── 压缩记录查看面板 ──
function ArchiveViewer({ messages, charName, playerName, onBack }: { messages: (PhoneMessage | GroupMessage)[]; charName: string; playerName: string; onBack: () => void }) {
  // 收集所有摘要消息及其原始消息
  const archives = messages.filter(m => m.isSummary && m.originalMessages) as (PhoneMessage & { originalMessages: PhoneMessage[] })[];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#e0e0e0]">
      <AppHeader title="压缩记录" color="bg-pop-yellow" onBack={onBack} />
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3">
        {archives.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-pop-black/30">
            <Archive className="w-12 h-12 mb-3 opacity-30" strokeWidth={2} />
            <p className="text-sm font-black italic transform -skew-x-6">暂无压缩记录</p>
          </div>
        ) : (
          archives.map((archive) => (
            <div key={archive.id} className="bg-white border-4 border-pop-black p-3 shadow-pop">
              {/* 摘要文本 */}
              <div className="mb-2 pb-2 border-b-2 border-pop-black/10">
                <div className="flex items-center gap-1.5 mb-1 text-pop-cyan font-black text-xs">
                  <Archive className="w-3 h-3" />
                  <span>摘要</span>
                </div>
                <p className="text-xs text-pop-black/70 leading-relaxed whitespace-pre-wrap">{archive.text}</p>
              </div>
              {/* 原始消息列表 */}
              <div className="text-pop-black/40 text-[10px] font-black uppercase italic transform -skew-x-3 mb-1.5">
                包含的原始消息 ({archive.originalMessages.length} 条)
              </div>
              <div className="space-y-1.5">
                {archive.originalMessages.map((m) => {
                  const sender = m.from === 'player' ? playerName : m.from === 'system' ? '系统' : charName;
                  const timeLabel = m.gameTs ? `[${m.gameTs}] ` : '';
                  return (
                    <div key={m.id} className="text-xs text-pop-black/60 bg-pop-black/5 px-2 py-1.5 rounded border border-pop-black/5">
                      <span className="font-bold text-pop-black/80">{timeLabel}{sender}：</span>
                      {m.text}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  主组件
// ═══════════════════════════════════════

export function PhoneWeChat({ onExit }: { onExit: () => void }) {
  const { refreshMoments, isReady, createGroupChat, ensureChatLogEntries } = usePhoneContext();
  const [activeTab, setActiveTab] = useState<WeChatTab>('chats');
  const [view, setView] = useState<'main' | 'moments'>('main');
  const [selectedChat, setSelectedChat] = useState<{ type: 'private' | 'group'; id: string } | null>(null);
  const [momentsRefreshing, setMomentsRefreshing] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // 进入微信时自动检查/注入所有联系人和群聊的世界书条目
  useEffect(() => {
    ensureChatLogEntries();
  }, [ensureChatLogEntries]);

// 朋友圈刷新（手动刷新绕过冷却）
const handleRefreshMoments = useCallback(async () => {
if (!isReady || momentsRefreshing) return;
setMomentsRefreshing(true);
try { await refreshMoments(true); } finally { setMomentsRefreshing(false); }
}, [isReady, momentsRefreshing, refreshMoments]);

  // 点击「发现」Tab → 直接进朋友圈
  const handleTabChange = useCallback((id: string) => {
    if (id === 'discover') {
      setView('moments');
    } else {
      setActiveTab(id as WeChatTab);
    }
  }, []);

  // 选中了某个聊天 → 进入聊天详情（全屏，无 Tab）
  if (selectedChat) {
    return (
      <ChatDetail
        chatType={selectedChat.type}
        chatId={selectedChat.id}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  // 新建群聊 → 全屏覆盖
  if (showCreateGroup) {
    return (
      <CreateGroupView
        onBack={() => setShowCreateGroup(false)}
        onCreate={createGroupChat}
      />
    );
  }

  const title = view === 'moments' ? '朋友圈' : activeTab === 'chats' ? '微信' : '我';

  return (
    <div className="absolute inset-0 bg-[#e0e0e0] flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'moments' ? (
          <motion.div
            key="moments"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="absolute inset-0 flex flex-col z-20 bg-[#f0f0f0]"
          >
            <AppHeader
              title="朋友圈"
              color="bg-pop-green"
              onBack={() => setView('main')}
              rightIcon={
                <button
                  onClick={handleRefreshMoments}
                  disabled={!isReady || momentsRefreshing}
                  className="w-8 h-8 bg-pop-black text-pop-green rounded-lg flex items-center justify-center transform -skew-x-6 hover:scale-110 border-2 border-pop-black disabled:opacity-40 transition-transform"
                >
                  <RefreshCw size={16} className={cn(momentsRefreshing && 'animate-spin')} />
                </button>
              }
            />
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<LoadingSpinner />}>
                <PhoneMoments />
              </Suspense>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ x: '-50%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="absolute inset-0 flex flex-col z-10"
          >
            <AppHeader
              title={title}
              color="bg-pop-green"
              onBack={onExit}
              rightIcon={activeTab === 'chats' ? (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-8 h-8 bg-pop-black text-white rounded-lg flex items-center justify-center transform -skew-x-6 hover:scale-110 border-2 border-pop-black transition-transform"
                >
                  <Plus size={18} />
                </button>
              ) : undefined}
            />

            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'chats' && (
                  <motion.div key="chats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <ChatListTab onSelectChat={(type, id) => setSelectedChat({ type, id })} />
                  </motion.div>
                )}
                {activeTab === 'me' && (
                  <motion.div key="me" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <MeTab />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <BottomNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} activeBgColor="bg-pop-green" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════
//  Tab 1: 微信 — 聊天列表（1对1 + 群聊混合）
// ═══════════════════════════════════════

type ChatListItem = {
  type: 'private' | 'group';
  id: string;
  name: string;
  avatar?: string;
  lastMsg?: { text: string; ts: number; from: string };
  unread: number;
};

function ChatListTab({ onSelectChat }: { onSelectChat: (type: 'private' | 'group', id: string) => void }) {
  const { config, messages, groupChats, groupMessages, markRead, markGroupRead, removeGroupChat } = usePhoneContext();
  const [searchText, setSearchText] = useState('');

  // 合并 1对1 聊天和群聊到一个列表
  const allChats: ChatListItem[] = useMemo(() => {
    const items: ChatListItem[] = [];

    for (const char of config.characters) {
      const charMsgs = messages[char.name] || [];
      const lastMsg = charMsgs[charMsgs.length - 1];
      const unread = charMsgs.filter((m) => m.from === 'char' && !m.read).length;
      items.push({
        type: 'private',
        id: char.name,
        name: char.name,
        avatar: char.avatar,
        lastMsg: lastMsg ? { text: lastMsg.text, ts: lastMsg.ts, from: lastMsg.from } : undefined,
        unread,
      });
    }

    for (const group of groupChats) {
      const msgs = groupMessages[group.id] || [];
      const lastMsg = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.from !== 'player' && !m.read).length;
      items.push({
        type: 'group',
        id: group.id,
        name: group.name,
        lastMsg: lastMsg ? { text: lastMsg.text, ts: lastMsg.ts, from: lastMsg.from } : undefined,
        unread,
      });
    }

    items.sort((a, b) => (b.lastMsg?.ts || 0) - (a.lastMsg?.ts || 0));
    return items;
  }, [config.characters, messages, groupChats, groupMessages]);

  const filteredChats = allChats.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  // 空状态
  if (allChats.length === 0) {
    return (
      <div className="h-full flex flex-col bg-[#e0e0e0]">
        <div className="flex-1 flex flex-col items-center justify-center text-pop-black/30 p-6 text-center">
          <MessageCircle className="w-12 h-12 mb-3 opacity-30" strokeWidth={2} />
          <p className="text-base font-black italic transform -skew-x-6">还没有聊天</p>
          <p className="text-xs mt-1 font-bold">在设置中关联角色后即可聊天</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#e0e0e0]">
      {/* 搜索栏 — 卡片式 */}
      <div className="shrink-0 p-3 pb-2">
        <div className="bg-white border-4 border-pop-black p-2 flex items-center shadow-pop transform -skew-x-2">
          <Search size={16} className="text-pop-black/50 mx-2 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索..."
            className="flex-1 outline-none font-bold text-sm placeholder:text-pop-black/30 bg-transparent"
          />
        </div>
      </div>

      {/* 聊天列表 — 每条都是独立卡片 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 space-y-2.5">
        {filteredChats.map((chat) => (
          <motion.button
            key={`${chat.type}-${chat.id}`}
            onClick={() => {
              if (chat.type === 'private') markRead(chat.id);
              else markGroupRead(chat.id);
              onSelectChat(chat.type, chat.id);
            }}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-4 border-pop-black p-2.5 flex items-center shadow-pop relative text-left"
          >
            {/* 头像 — 方形 */}
            <div className="shrink-0 w-11 h-11 rounded-xl border-2 border-pop-black overflow-hidden flex items-center justify-center text-white font-black text-base shadow-sm">
              {chat.type === 'private' && chat.avatar ? (
                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              ) : chat.type === 'group' ? (
                <div className="w-full h-full bg-gradient-to-br from-pop-cyan to-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              ) : (
                <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', getAvatarColor(chat.name))}>
                  {chat.name.slice(-1)}
                </div>
              )}
            </div>

            {/* 消息预览 */}
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-pop-black font-black text-[15px] truncate">{chat.name}</span>
                {chat.lastMsg && (
                  <span className="text-pop-black/40 text-[10px] shrink-0 ml-2 font-bold">
                    {formatChatTime(chat.lastMsg.ts)}
                  </span>
                )}
              </div>
              <p className="text-pop-black/50 text-xs truncate mt-0.5 font-bold">
                {chat.lastMsg
                  ? `${chat.lastMsg.from === 'player' ? '我: ' : chat.type === 'group' ? chat.lastMsg.from + ': ' : ''}${chat.lastMsg.text}`
                  : chat.type === 'group'
                    ? '群聊已创建'
                    : '暂无消息'}
              </p>
            </div>

            {/* 未读红点 — 波普风格 */}
            {chat.unread > 0 && (
              <div className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-pop-pink text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-pop-black shadow-pop animate-bounce">
                {chat.unread > 99 ? '99+' : chat.unread}
              </div>
            )}

            {/* 群聊删除按钮 */}
            {chat.type === 'group' && (
              <button
                onClick={(e) => { e.stopPropagation(); removeGroupChat(chat.id); }}
                className="shrink-0 ml-2 p-1 text-pop-pink/30 hover:text-pop-pink transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  新建群聊视图 — 全屏覆盖
// ═══════════════════════════════════════

function CreateGroupView({ onBack, onCreate }: { onBack: () => void; onCreate: (name: string, members: string[]) => void }) {
  const { config } = usePhoneContext();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreate = useCallback(() => {
    if (!groupName.trim() || selectedMembers.length < 2) return;
    onCreate(groupName.trim(), selectedMembers);
    onBack();
  }, [groupName, selectedMembers, onCreate, onBack]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#e0e0e0] z-30">
      <AppHeader title="选择群成员" color="bg-pop-green" onBack={onBack} rightIcon={
        <button
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedMembers.length < 2}
          className="px-3 py-1 bg-pop-green text-pop-black text-xs font-black border-2 border-pop-black shadow-pop transform -skew-x-3 disabled:opacity-30 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          完成
        </button>
      } />

      {/* 群名输入 */}
      <div className="shrink-0 p-3">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="群聊名称"
          className="w-full bg-white text-pop-black text-sm font-bold rounded-lg px-3 py-2.5 border-4 border-pop-black shadow-pop focus:outline-none placeholder:text-pop-black/30"
        />
      </div>

      <div className="shrink-0 px-3 pb-1 text-pop-black/40 text-[11px] font-black uppercase italic transform -skew-x-3">
        选择群成员（至少2人）
      </div>

      {/* 成员选择列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 space-y-2">
        {config.characters.map((char) => {
          const selected = selectedMembers.includes(char.name);
          return (
            <motion.button
              key={char.name}
              onClick={() => {
                setSelectedMembers(
                  selected
                    ? selectedMembers.filter((n) => n !== char.name)
                    : [...selectedMembers, char.name],
                );
              }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 border-4 shadow-pop text-left transition-colors',
                selected ? 'bg-pop-green border-pop-black' : 'bg-white border-pop-black',
              )}
            >
              <div className={cn(
                'shrink-0 w-5 h-5 border-2 border-pop-black flex items-center justify-center transition-colors',
                selected ? 'bg-pop-black' : 'bg-white',
              )}>
                {selected && <Check className="w-3 h-3 text-pop-green" strokeWidth={3} />}
              </div>
              <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden border-2 border-pop-black flex items-center justify-center text-white font-bold text-sm">
                {char.avatar ? (
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', getAvatarColor(char.name))}>
                    {char.name.slice(-1)}
                  </div>
                )}
              </div>
              <span className="text-pop-black text-sm font-black">{char.name}</span>
            </motion.button>
          );
        })}
        {config.characters.length === 0 && (
          <div className="text-center text-pop-black/30 text-xs py-8 font-black italic transform -skew-x-6">
            暂无关联角色，请先在设置中关联
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  聊天详情 — 1对1 和 群聊共用
// ═══════════════════════════════════════

function ChatDetail({ chatType, chatId, onBack }: { chatType: 'private' | 'group'; chatId: string; onBack: () => void }) {
  if (chatType === 'private') {
    return <PrivateChatDetail charName={chatId} onBack={onBack} />;
  }
  return <GroupChatDetail groupId={chatId} onBack={onBack} />;
}

// ── 1对1 聊天详情 ──
function PrivateChatDetail({ charName, onBack }: { charName: string; onBack: () => void }) {
  const { messages, sendMessage, isReady, config, clearChatHistory, deleteMessage, compressSelectedMessages } = usePhoneContext();
  const { playerAvatar, playerName } = useGameContext();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [pendingDeleteMsg, setPendingDeleteMsg] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCompressing, setIsCompressing] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charMsgs = messages[charName] || [];
  const charLink = config.characters.find((c) => c.name === charName);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [charMsgs.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || !isReady) return;
    setText('');
    setIsSending(true);
    sfx.play('send');
    try {
      await sendMessage(charName, trimmed);
    } catch (err) {
      console.error('[PhoneWeChat] 发送失败:', err);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [text, isSending, isReady, charName, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearHistory = useCallback(async () => {
    setShowClearConfirm(false);
    await clearChatHistory(charName);
  }, [clearChatHistory, charName]);

  const handleDeleteMsg = useCallback(async () => {
    if (!pendingDeleteMsg) return;
    const msgId = pendingDeleteMsg;
    setPendingDeleteMsg(null);
    await deleteMessage(charName, msgId);
  }, [pendingDeleteMsg, deleteMessage, charName]);

  const handleEnterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelect = useCallback((msgId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  const handleCompressSelected = useCallback(async () => {
    if (selectedIds.size === 0 || isCompressing) return;
    setIsCompressing(true);
    try {
      const ok = await compressSelectedMessages(charName, Array.from(selectedIds));
      if (ok) {
        setSelectMode(false);
        setSelectedIds(new Set());
      }
    } finally {
      setIsCompressing(false);
    }
  }, [selectedIds, isCompressing, compressSelectedMessages, charName]);

  return (
    <div className="h-full flex flex-col bg-[#e0e0e0] relative">
      <AppHeader
        title={charName}
        color="bg-pop-green"
        onBack={onBack}
        rightIcon={
          <ChatActionButton onClick={() => setShowActionMenu(!showActionMenu)} />
        }
      />

      {/* 操作菜单下拉 */}
      {showActionMenu && (
        <ChatActionDropdown
          onClearHistory={() => setShowClearConfirm(true)}
          onCompress={handleEnterSelectMode}
          onViewArchives={() => setShowArchive(true)}
          onClose={() => setShowActionMenu(false)}
        />
      )}

      {showArchive && (
        <ArchiveViewer messages={charMsgs} charName={charName} playerName={playerName} onBack={() => setShowArchive(false)} />
      )}

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar px-2.5 py-3 space-y-3">
        {charMsgs.length === 0 && (
          <div className="text-center text-pop-black/30 text-xs mt-8">
            <div className="inline-block bg-white border-2 border-pop-black/10 px-3 py-1.5 font-bold rounded-lg">
              你已添加了{charName}，现在可以开始聊天了
            </div>
          </div>
        )}
        {selectMode && (
          <div className="text-center text-pop-cyan text-[11px] font-black mb-2 italic transform -skew-x-3">
            点击消息选择要压缩的内容（可选中普通消息和摘要卡片）
          </div>
        )}
        {charMsgs.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            avatar={charLink?.avatar}
            name={charName}
            playerAvatar={playerAvatar}
            onDelete={() => setPendingDeleteMsg(msg.id)}
            selectMode={selectMode}
            isSelected={selectedIds.has(msg.id)}
            onToggleSelect={() => handleToggleSelect(msg.id)}
          />
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-pop-black/40 text-xs pl-12 font-bold">
            <Loader className="w-3 h-3 animate-spin" />
            <span>对方正在输入...</span>
          </div>
        )}
      </div>

      {/* 多选模式底部操作栏 */}
      {selectMode ? (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white border-t-4 border-pop-black">
          <button
            onClick={handleCancelSelect}
            className="flex-1 py-2 bg-gray-200 text-pop-black/60 text-xs font-black rounded border-2 border-pop-black/10"
          >
            取消
          </button>
          <button
            onClick={handleCompressSelected}
            disabled={selectedIds.size === 0 || isCompressing}
            className="flex-1 py-2 bg-pop-cyan text-pop-black text-xs font-black rounded border-2 border-pop-black shadow-pop disabled:opacity-40 flex items-center justify-center gap-1"
          >
            {isCompressing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : `压缩选中(${selectedIds.size})`}
          </button>
        </div>
      ) : (
        <ChatInputBar
          text={text}
          setText={setText}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          isReady={isReady}
          isSending={isSending}
          textareaRef={textareaRef}
        />
      )}

      {/* 清空记录确认 */}
      <ConfirmDialog
        open={showClearConfirm}
        title="清空聊天记录"
        message={`确定要清空与${charName}的所有聊天记录吗？此操作不可撤销，角色关联将保留。`}
        confirmText="清空"
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* 删除单条消息确认 */}
      <ConfirmDialog
        open={!!pendingDeleteMsg}
        title="删除消息"
        message="确定要删除这条消息吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDeleteMsg}
        onCancel={() => setPendingDeleteMsg(null)}
      />
    </div>
  );
}

// ── 群聊详情 ──
function GroupChatDetail({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { groupChats, groupMessages, sendGroupMessage, isReady, config, clearGroupChatHistory, deleteGroupMessage, compressSelectedGroupMessages } = usePhoneContext();
  const { playerAvatar, playerName } = useGameContext();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [pendingDeleteMsg, setPendingDeleteMsg] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCompressing, setIsCompressing] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const group = groupChats.find((g) => g.id === groupId);
  const msgs = groupMessages[groupId] || [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || !isReady || !group) return;
    setText('');
    setIsSending(true);
    sfx.play('send');
    try {
      await sendGroupMessage(groupId, trimmed);
    } catch (err) {
      console.error('[PhoneGroupChat] 发送失败:', err);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [text, isSending, isReady, group, groupId, sendGroupMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearHistory = useCallback(async () => {
    setShowClearConfirm(false);
    await clearGroupChatHistory(groupId);
  }, [clearGroupChatHistory, groupId]);

  const handleDeleteMsg = useCallback(async () => {
    if (!pendingDeleteMsg) return;
    const msgId = pendingDeleteMsg;
    setPendingDeleteMsg(null);
    await deleteGroupMessage(groupId, msgId);
  }, [pendingDeleteMsg, deleteGroupMessage, groupId]);

  const handleEnterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelect = useCallback((msgId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  const handleCompressSelected = useCallback(async () => {
    if (selectedIds.size === 0 || isCompressing) return;
    setIsCompressing(true);
    try {
      const ok = await compressSelectedGroupMessages(groupId, Array.from(selectedIds));
      if (ok) {
        setSelectMode(false);
        setSelectedIds(new Set());
      }
    } finally {
      setIsCompressing(false);
    }
  }, [selectedIds, isCompressing, compressSelectedGroupMessages, groupId]);

  if (!group) return (
    <div className="h-full flex items-center justify-center bg-[#e0e0e0]">
      <span className="text-pop-black/40 text-sm font-black italic transform -skew-x-6">群聊不存在</span>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#e0e0e0] relative">
      <AppHeader
        title={group.name}
        color="bg-pop-green"
        onBack={onBack}
        rightIcon={
          <ChatActionButton onClick={() => setShowActionMenu(!showActionMenu)} />
        }
      />

      {/* 操作菜单下拉 */}
      {showActionMenu && (
        <ChatActionDropdown
          onClearHistory={() => setShowClearConfirm(true)}
          onCompress={handleEnterSelectMode}
          onViewArchives={() => setShowArchive(true)}
          onClose={() => setShowActionMenu(false)}
        />
      )}

      {showArchive && (
        <ArchiveViewer messages={msgs} charName={group.name} playerName={playerName} onBack={() => setShowArchive(false)} />
      )}

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar px-2.5 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center text-pop-black/30 text-xs mt-8">
            <div className="inline-block bg-white border-2 border-pop-black/10 px-3 py-1.5 font-bold rounded-lg">
              你已加入群聊，开始聊天吧
            </div>
          </div>
        )}
        {selectMode && (
          <div className="text-center text-pop-cyan text-[11px] font-black mb-2 italic transform -skew-x-3">
            点击消息选择要压缩的内容（可选中普通消息和摘要卡片）
          </div>
        )}
        {msgs.map((msg) => (
          <GroupMessageBubble
            key={msg.id}
            msg={msg}
            config={config}
            playerAvatar={playerAvatar}
            onDelete={() => setPendingDeleteMsg(msg.id)}
            selectMode={selectMode}
            isSelected={selectedIds.has(msg.id)}
            onToggleSelect={() => handleToggleSelect(msg.id)}
          />
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-pop-black/40 text-xs pl-12 font-bold">
            <Loader className="w-3 h-3 animate-spin" />
            <span>群成员正在输入...</span>
          </div>
        )}
      </div>

      {/* 多选模式底部操作栏 */}
      {selectMode ? (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white border-t-4 border-pop-black">
          <button
            onClick={handleCancelSelect}
            className="flex-1 py-2 bg-gray-200 text-pop-black/60 text-xs font-black rounded border-2 border-pop-black/10"
          >
            取消
          </button>
          <button
            onClick={handleCompressSelected}
            disabled={selectedIds.size === 0 || isCompressing}
            className="flex-1 py-2 bg-pop-cyan text-pop-black text-xs font-black rounded border-2 border-pop-black shadow-pop disabled:opacity-40 flex items-center justify-center gap-1"
          >
            {isCompressing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : `压缩选中(${selectedIds.size})`}
          </button>
        </div>
      ) : (
        <ChatInputBar
          text={text}
          setText={setText}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          isReady={isReady}
          isSending={isSending}
          textareaRef={textareaRef}
        />
      )}

      {/* 清空记录确认 */}
      <ConfirmDialog
        open={showClearConfirm}
        title="清空群聊记录"
        message={`确定要清空群聊「${group.name}」的所有聊天记录吗？此操作不可撤销，群聊本身将保留。`}
        confirmText="清空"
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* 删除单条消息确认 */}
      <ConfirmDialog
        open={!!pendingDeleteMsg}
        title="删除消息"
        message="确定要删除这条消息吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDeleteMsg}
        onCancel={() => setPendingDeleteMsg(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════
//  共用组件
// ═══════════════════════════════════════

// ── 输入栏 — 波普风格 ──
function ChatInputBar({
  text, setText, onSend, onKeyDown, isReady, isSending, textareaRef,
}: {
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isReady: boolean;
  isSending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="shrink-0 flex items-end gap-2 px-2.5 py-2 bg-white border-t-4 border-pop-black">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={isReady ? '' : '请先配置副API'}
        rows={1}
        disabled={!isReady || isSending}
        className="flex-1 bg-pop-black/5 text-pop-black text-[15px] rounded-lg px-3 py-2 resize-none focus:outline-none placeholder:text-pop-black/30 disabled:opacity-50 border-2 border-pop-black/10 focus:border-pop-black font-medium"
        style={{ maxHeight: '100px' }}
      />
      <button
        onClick={onSend}
        disabled={!text.trim() || !isReady || isSending}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-pop-green text-pop-black text-sm font-black border-2 border-pop-black shadow-pop disabled:opacity-40 disabled:bg-gray-300 transition-colors active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        {isSending ? <Loader className="w-4 h-4 animate-spin" /> : '发送'}
      </button>
    </div>
  );
}

// ── 1对1 消息气泡 — 波普风格 ──
function MessageBubble({ msg, avatar, name, playerAvatar, onDelete, selectMode, isSelected, onToggleSelect }: { msg: PhoneMessage; avatar?: string; name: string; playerAvatar?: string; onDelete?: () => void; selectMode?: boolean; isSelected?: boolean; onToggleSelect?: () => void }) {
  const isChar = msg.from === 'char';
  const longPress = useLongPress(() => onDelete?.(), 500);
  const canSelect = true;

  // 摘要消息 — 居中灰色卡片（可选中/删除）
  if (msg.isSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center my-2 select-none relative"
        onClick={selectMode ? onToggleSelect : undefined}
      >
        <div className={cn(
          'max-w-[85%] bg-gray-200 text-gray-600 rounded-lg px-3 py-2 text-xs leading-relaxed border-2 transition-all',
          selectMode && isSelected ? 'border-pop-cyan ring-2 ring-pop-cyan/30' : 'border-gray-300',
        )}>
          <div className="flex items-center gap-1.5 mb-1 text-gray-500 font-bold">
            <Archive className="w-3 h-3" />
            <span>聊天记录摘要</span>
            {msg.gameTs && <span className="text-gray-400 text-[10px]">[{msg.gameTs}]</span>}
            {msg.originalMessages && <span className="text-gray-400 text-[10px]">（{msg.originalMessages.length}条原始消息）</span>}
          </div>
          <p className="whitespace-pre-wrap">{msg.text.replace(/^【聊天记录摘要】/, '')}</p>
        </div>
        {!selectMode && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-pop-black rounded-full flex items-center justify-center text-pop-pink hover:bg-pop-pink hover:text-white transition-colors shadow-sm"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </motion.div>
    );
  }

  // 多选模式：复选框替代删除按钮
  const selectCheckbox = selectMode && (
    <div
      className={cn(
        'shrink-0 self-end mb-1 w-5 h-5 border-2 border-pop-black flex items-center justify-center transition-colors',
        isSelected ? 'bg-pop-cyan' : 'bg-white',
        !canSelect && 'opacity-30',
      )}
    >
      {isSelected && canSelect && <Check className="w-3 h-3 text-pop-black" strokeWidth={3} />}
    </div>
  );

  // 普通模式：删除按钮
  const deleteBtn = !selectMode && onDelete && (
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="shrink-0 self-end mb-1 p-1 text-pop-pink/40 hover:text-pop-pink transition-colors"
      title="删除"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-start gap-1.5 select-none',
        isChar ? 'justify-start' : 'justify-end',
      )}
      onClick={selectMode && canSelect ? onToggleSelect : undefined}
    >
      {isChar && (
        <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden border-2 border-pop-black flex items-center justify-center text-white font-black text-sm shadow-sm">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', getAvatarColor(name))}>
              {name.slice(-1)}
            </div>
          )}
        </div>
      )}
      {!isChar && selectCheckbox}
      {!isChar && deleteBtn}
      <div className={cn(
        'relative max-w-[65%] px-3 py-2 text-[15px] leading-relaxed break-words font-medium',
        isChar
          ? 'bg-white text-pop-black rounded-2xl rounded-tl-md border-2 border-pop-black shadow-pop'
          : 'bg-pop-yellow text-pop-black rounded-2xl rounded-tr-md border-2 border-pop-black shadow-pop',
      )}>
        <div
          className={cn(
            'absolute top-3 w-0 h-0',
            isChar
              ? 'left-[-8px] border-t-[5px] border-t-transparent border-r-[8px] border-r-pop-black border-b-[5px] border-b-transparent'
              : 'right-[-8px] border-t-[5px] border-t-transparent border-l-[8px] border-l-pop-black border-b-[5px] border-b-transparent',
          )}
        />
        {msg.text}
      </div>
      {isChar && selectCheckbox}
      {isChar && deleteBtn}
      {!isChar && (
        <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden border-2 border-pop-black flex items-center justify-center text-pop-black font-black text-sm shadow-sm">
          {playerAvatar ? (
            <img src={playerAvatar} alt="我" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-pop-yellow flex items-center justify-center">我</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── 群聊消息气泡 — 波普风格 ──
function GroupMessageBubble({ msg, config, playerAvatar, onDelete, selectMode, isSelected, onToggleSelect }: { msg: GroupMessage; config: { characters: { name: string; avatar?: string }[] }; playerAvatar?: string; onDelete?: () => void; selectMode?: boolean; isSelected?: boolean; onToggleSelect?: () => void }) {
  const isPlayer = msg.from === 'player';
  const charLink = config.characters.find((c) => c.name === msg.from);
  const longPress = useLongPress(() => onDelete?.(), 500);
  const canSelect = true;

  // 摘要消息 — 居中灰色卡片（可选中/删除）
  if (msg.isSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center my-2 select-none relative"
        onClick={selectMode ? onToggleSelect : undefined}
      >
        <div className={cn(
          'max-w-[85%] bg-gray-200 text-gray-600 rounded-lg px-3 py-2 text-xs leading-relaxed border-2 transition-all',
          selectMode && isSelected ? 'border-pop-cyan ring-2 ring-pop-cyan/30' : 'border-gray-300',
        )}>
          <div className="flex items-center gap-1.5 mb-1 text-gray-500 font-bold">
            <Archive className="w-3 h-3" />
            <span>群聊记录摘要</span>
            {msg.gameTs && <span className="text-gray-400 text-[10px]">[{msg.gameTs}]</span>}
            {msg.originalMessages && <span className="text-gray-400 text-[10px]">（{msg.originalMessages.length}条原始消息）</span>}
          </div>
          <p className="whitespace-pre-wrap">{msg.text.replace(/^【群聊记录摘要】/, '')}</p>
        </div>
        {!selectMode && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-pop-black rounded-full flex items-center justify-center text-pop-pink hover:bg-pop-pink hover:text-white transition-colors shadow-sm"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </motion.div>
    );
  }

  // 多选模式：复选框替代删除按钮
  const selectCheckbox = selectMode && (
    <div
      className={cn(
        'shrink-0 self-end mb-1 w-5 h-5 border-2 border-pop-black flex items-center justify-center transition-colors',
        isSelected ? 'bg-pop-cyan' : 'bg-white',
        !canSelect && 'opacity-30',
      )}
    >
      {isSelected && canSelect && <Check className="w-3 h-3 text-pop-black" strokeWidth={3} />}
    </div>
  );

  // 普通模式：删除按钮
  const deleteBtn = !selectMode && onDelete && (
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="shrink-0 self-end mb-1 p-1 text-pop-pink/40 hover:text-pop-pink transition-colors"
      title="删除"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-start gap-1.5 select-none',
        isPlayer ? 'justify-end' : 'justify-start',
      )}
      onClick={selectMode && canSelect ? onToggleSelect : undefined}
    >
      {!isPlayer && (
        <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden border-2 border-pop-black flex items-center justify-center text-white text-[10px] font-black shadow-sm">
          {charLink?.avatar ? (
            <img src={charLink.avatar} alt={msg.from} className="w-full h-full object-cover" />
          ) : (
            <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', getAvatarColor(msg.from))}>
              {msg.from.slice(-1)}
            </div>
          )}
        </div>
      )}
      {isPlayer && selectCheckbox}
      {isPlayer && deleteBtn}
      <div className={cn('flex flex-col max-w-[65%]', isPlayer ? 'items-end' : 'items-start')}>
        {!isPlayer && (
          <span className="text-pop-cyan text-[11px] font-black mb-0.5 ml-1 italic transform -skew-x-3">{msg.from}</span>
        )}
        <div className={cn(
          'relative px-3 py-2 text-[15px] leading-relaxed break-words font-medium',
          isPlayer
            ? 'bg-pop-yellow text-pop-black rounded-2xl rounded-tr-md border-2 border-pop-black shadow-pop'
            : 'bg-white text-pop-black rounded-2xl rounded-tl-md border-2 border-pop-black shadow-pop',
        )}>
          <div
            className={cn(
              'absolute top-3 w-0 h-0',
              isPlayer
                ? 'right-[-8px] border-t-[5px] border-t-transparent border-l-[8px] border-l-pop-black border-b-[5px] border-b-transparent'
                : 'left-[-8px] border-t-[5px] border-t-transparent border-r-[8px] border-r-pop-black border-b-[5px] border-b-transparent',
            )}
          />
          {msg.text}
        </div>
      </div>
      {!isPlayer && selectCheckbox}
      {!isPlayer && deleteBtn}
      {isPlayer && (
        <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden border-2 border-pop-black flex items-center justify-center text-pop-black font-black text-sm shadow-sm">
          {playerAvatar ? (
            <img src={playerAvatar} alt="我" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-pop-yellow flex items-center justify-center">我</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════
//  Tab 4: 我 — 玩家名字 + 头像设置
// ═══════════════════════════════════════

function MeTab() {
  const { playerName, setPlayerName, playerAvatar, setPlayerAvatar } = useGameContext();
  const [nameInput, setNameInput] = useState(playerName || '');
  const [avatarInput, setAvatarInput] = useState(playerAvatar || '');
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    setPlayerName(nameInput);
    setPlayerAvatar(avatarInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [nameInput, avatarInput, setPlayerName, setPlayerAvatar]);

  return (
    <div className="h-full overflow-y-auto hide-scrollbar bg-[#e0e0e0] p-3 space-y-3">
      {/* 头像预览 */}
      <div className="bg-white border-4 border-pop-black p-4 shadow-pop flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-halftone-white opacity-10 pointer-events-none" />
        <div className="w-20 h-20 bg-pop-green border-4 border-pop-black overflow-hidden flex items-center justify-center mb-3 shadow-pop transform -skew-x-6">
          {avatarInput ? (
            <img src={avatarInput} alt="头像" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-pop-black" strokeWidth={2.5} />
          )}
        </div>
        <h2 className="font-black text-xl italic transform -skew-x-6 relative z-10">
          {nameInput || '玩家'}
        </h2>
      </div>

      {/* 名字输入 */}
      <div className="bg-white border-4 border-pop-black p-3 shadow-pop relative overflow-hidden">
        <label className="text-pop-black/50 text-[11px] font-black uppercase italic transform -skew-x-3 block mb-1.5">
          玩家名字
        </label>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="输入你的名字..."
          className="w-full bg-pop-black/5 text-pop-black text-sm font-bold rounded-lg px-3 py-2.5 border-2 border-pop-black focus:outline-none placeholder:text-pop-black/30"
        />
      </div>

      {/* 头像 URL 输入 */}
      <div className="bg-white border-4 border-pop-black p-3 shadow-pop relative overflow-hidden">
        <label className="text-pop-black/50 text-[11px] font-black uppercase italic transform -skew-x-3 block mb-1.5">
          头像 URL
        </label>
        <input
          type="text"
          value={avatarInput}
          onChange={(e) => setAvatarInput(e.target.value)}
          placeholder="粘贴头像图片链接..."
          className="w-full bg-pop-black/5 text-pop-black text-sm font-bold rounded-lg px-3 py-2.5 border-2 border-pop-black focus:outline-none placeholder:text-pop-black/30"
        />
      </div>

      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        className={cn(
          'w-full p-3 border-4 border-pop-black shadow-pop font-black text-sm transform -skew-x-3 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
          saved ? 'bg-pop-green text-pop-black' : 'bg-pop-yellow text-pop-black',
        )}
      >
        {saved ? '✓ 已保存' : '保存'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════

function formatChatTime(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  if (isYesterday) return '昨天';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function LoadingSpinner() {
  return (
    <div className="h-full flex items-center justify-center">
      <Loader className="w-5 h-5 animate-spin text-pop-black/30" />
    </div>
  );
}
