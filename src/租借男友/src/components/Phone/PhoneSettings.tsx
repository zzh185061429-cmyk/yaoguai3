/**
 * 手机设置 — 关联角色条目 + 副API配置
 *
 * 玩家在这里：
 * 1. 配置副API（地址、密钥 → 自动拉取可用模型下拉、源）
 * 2. 关联角色：输入角色名 + 从所有世界书中选择条目作为人设来源
 *    系统自动创建"手机聊天记录-角色名"绿灯条目
 * 3. 管理/删除已关联的角色
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Link, Check, Server, RefreshCw, Loader, Bell } from 'lucide-react';
import { AppHeader } from './PhoneShared';
import { usePhoneContext } from '../../state/PhoneContext';
import type { SubApiConfig, WbEntryRef } from '../../utils/phoneApi';
import { fetchModelList } from '../../utils/phoneApi';
import { cn } from '../../utils';

export function PhoneSettings({ onExit }: { onExit: () => void }) {
  const { config, isReady, saveSubApi, addCharacter, removeCharacter, toggleCharacter, setAutoMessageEnabled, getEntryList } = usePhoneContext();
  const [activeTab, setActiveTab] = useState<'api' | 'characters' | 'general'>('api');

  return (
    <div className="h-full flex flex-col bg-pop-black">
      <AppHeader title="设置" color="bg-pop-cyan" onBack={onExit} />

      {/* Tab 切换 */}
      <div className="shrink-0 flex gap-1 p-2 bg-gray-800 border-b border-gray-700 overflow-x-auto hide-scrollbar">
        <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')} icon={<Server className="w-3 h-3" />} label="副API" />
        <TabButton active={activeTab === 'characters'} onClick={() => setActiveTab('characters')} icon={<Link className="w-3 h-3" />} label="角色关联" />
        <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Bell className="w-3 h-3" />} label="通用" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'api' ? (
          <SubApiSettings config={config.subApi} isReady={isReady} onSave={saveSubApi} />
        ) : activeTab === 'characters' ? (
          <CharacterSettings
            characters={config.characters}
            onAdd={addCharacter}
            onRemove={removeCharacter}
            onToggle={toggleCharacter}
            getEntryList={getEntryList}
          />
        ) : (
          <GeneralSettings autoMessageEnabled={config.autoMessageEnabled} onToggleAutoMessage={setAutoMessageEnabled} />
        )}
      </div>
    </div>
  );
}

// ── Tab 按钮 ──
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap',
        active ? 'bg-pop-pink text-white' : 'bg-gray-700 text-white/50 hover:text-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ── 副API设置 ──
function SubApiSettings({
  config,
  isReady,
  onSave,
}: {
  config: SubApiConfig;
  isReady: boolean;
  onSave: (config: SubApiConfig) => void;
}) {
  const [apiurl, setApiurl] = useState(config.apiurl);
  const [key, setKey] = useState(config.key);
  const [model, setModel] = useState(config.model);
  const [source, setSource] = useState(config.source);
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');

  // 拉取模型列表
  const handleFetchModels = useCallback(async () => {
    if (!apiurl.trim()) {
      setModelError('请先输入API地址');
      return;
    }
    setLoadingModels(true);
    setModelError('');
    try {
      const list = await fetchModelList(apiurl.trim(), key.trim());
      if (list.length === 0) {
        setModelError('未获取到可用模型');
      } else {
        setModels(list);
        // 如果当前 model 不在列表中，自动选第一个
        if (!list.includes(model)) {
          setModel(list[0]);
        }
      }
    } catch (err) {
      setModelError('获取模型列表失败: ' + (err as Error).message);
    } finally {
      setLoadingModels(false);
    }
  }, [apiurl, key, model]);

  const handleSave = useCallback(() => {
    onSave({ apiurl: apiurl.trim(), key: key.trim(), model: model.trim(), source });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [apiurl, key, model, source, onSave]);

  return (
    <div className="p-4 space-y-4">
      {/* 状态指示 */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold',
          isReady ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400',
        )}
      >
        <div className={cn('w-2 h-2 rounded-full', isReady ? 'bg-green-400' : 'bg-red-400')} />
        {isReady ? '副API 已配置' : '副API 未配置'}
      </div>

      {/* API 地址 */}
      <div className="space-y-1">
        <label className="text-white/60 text-xs font-bold">API 地址</label>
        <input
          type="text"
          value={apiurl}
          onChange={(e) => setApiurl(e.target.value)}
          placeholder="https://api.example.com/v1"
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
        />
      </div>

      {/* 密钥 */}
      <div className="space-y-1">
        <label className="text-white/60 text-xs font-bold">API 密钥</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
        />
      </div>

      {/* 拉取模型按钮 */}
      <button
        onClick={handleFetchModels}
        disabled={loadingModels || !apiurl.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-gray-600 disabled:opacity-40"
      >
        {loadingModels ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {loadingModels ? '获取中...' : '获取可用模型'}
      </button>

      {modelError && <p className="text-red-400 text-[10px] font-bold">{modelError}</p>}

      {/* 模型选择（下拉） */}
      <div className="space-y-1">
        <label className="text-white/60 text-xs font-bold">模型</label>
        {models.length > 0 ? (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="点击上方按钮获取，或手动输入模型名"
            className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
          />
        )}
      </div>

      {/* API 源 */}
      <div className="space-y-1">
        <label className="text-white/60 text-xs font-bold">API 源</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
        >
          <option value="openai">OpenAI</option>
          <option value="custom">Custom</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google</option>
          <option value="cohere">Cohere</option>
        </select>
      </div>

      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors',
          saved ? 'bg-green-500 text-white' : 'bg-pop-pink text-white hover:bg-pop-pink/80',
        )}
      >
        {saved ? <Check className="w-4 h-4" /> : null}
        {saved ? '已保存' : '保存配置'}
      </button>

      <p className="text-white/30 text-[10px] leading-relaxed">
        副API用于生成手机消息和论坛帖子，不影响主剧情的AI生成。建议使用便宜快速的小模型。
        配置存储在角色卡变量中，切换聊天文件不会丢失。
      </p>
    </div>
  );
}

// ── 角色关联设置 ──
function CharacterSettings({
  characters,
  onAdd,
  onRemove,
  onToggle,
  getEntryList,
}: {
  characters: { name: string; personaEntryName: string; personaWorldbookName: string; chatLogEntryName: string; enabled: boolean; avatar?: string }[];
  onAdd: (name: string, personaEntryName: string, worldbookName: string, avatar?: string) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
  onToggle: (name: string) => void;
  getEntryList: () => Promise<WbEntryRef[]>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEntryIdx, setNewEntryIdx] = useState(-1);
  const [newAvatar, setNewAvatar] = useState('');
  const [entryList, setEntryList] = useState<WbEntryRef[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [adding, setAdding] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const list = await getEntryList();
      setEntryList(list);
    } catch {
      console.warn('[PhoneSettings] 无法加载世界书条目列表');
    } finally {
      setLoadingEntries(false);
    }
  }, [getEntryList]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAdd = useCallback(async () => {
    if (!newName.trim() || newEntryIdx < 0) return;
    const entry = entryList[newEntryIdx];
    if (!entry) return;
    setAdding(true);
    try {
      await onAdd(newName.trim(), entry.name, entry.worldbookName, newAvatar.trim() || undefined);
      setNewName('');
      setNewEntryIdx(-1);
      setNewAvatar('');
      setShowAddForm(false);
    } catch (err) {
      console.error('[PhoneSettings] 关联角色失败:', err);
    } finally {
      setAdding(false);
    }
  }, [newName, newEntryIdx, entryList, newAvatar, onAdd]);

  return (
    <div className="p-4 space-y-3">
      {/* 已关联角色列表 */}
      {characters.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/60 text-xs font-bold uppercase tracking-wide">已关联角色</p>
          {characters.map((char) => (
            <div key={char.name} className="flex items-center gap-2 p-2.5 bg-gray-800 rounded-lg border border-gray-700">
              <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-pop-pink to-pop-cyan flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {char.avatar ? (
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  char.name.slice(-1)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold">{char.name}</div>
                <div className="text-white/40 text-[10px] truncate">人设: {char.personaEntryName}</div>
                <div className="text-white/30 text-[10px] truncate">来源: {char.personaWorldbookName}</div>
                <div className="text-green-400/60 text-[10px] truncate">记录: {char.chatLogEntryName}</div>
              </div>
              <button
                onClick={() => onToggle(char.name)}
                className={cn('shrink-0 w-9 h-5 rounded-full transition-colors relative', char.enabled ? 'bg-green-500' : 'bg-gray-600')}
                title={char.enabled ? '已启用' : '已禁用'}
              >
                <motion.div
                  animate={{ x: char.enabled ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full"
                />
              </button>
              <button
                onClick={() => onRemove(char.name)}
                className="shrink-0 p-1.5 text-red-400/60 hover:text-red-400 transition-colors"
                title="移除关联"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 添加新角色 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2.5">
              <div className="space-y-1">
                <label className="text-white/60 text-xs font-bold">角色名</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="如：周念安"
                  className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-white/60 text-xs font-bold">关联人设条目</label>
                  <button
                    onClick={loadEntries}
                    disabled={loadingEntries}
                    className="text-white/40 hover:text-white text-[10px] font-bold flex items-center gap-1"
                  >
                    {loadingEntries ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    刷新
                  </button>
                </div>
                <select
                  value={newEntryIdx}
                  onChange={(e) => setNewEntryIdx(parseInt(e.target.value))}
                  className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
                >
                  <option value={-1}>选择条目...</option>
                  {entryList.map((entry, i) => (
                    <option key={`${entry.worldbookName}::${entry.name}`} value={i}>
                      [{entry.worldbookName}] {entry.name}
                    </option>
                  ))}
                </select>
                {entryList.length === 0 && !loadingEntries && (
                  <p className="text-white/30 text-[10px]">
                    未找到世界书条目，请先在世界书编辑器中创建角色人设条目
                  </p>
                )}
                {newEntryIdx >= 0 && entryList[newEntryIdx] && (
                  <p className="text-white/40 text-[10px] truncate">
                    📖 来源世界书: {entryList[newEntryIdx].worldbookName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-white/60 text-xs font-bold">头像 URL（可选）</label>
                <input
                  type="text"
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-pop-pink"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim() || newEntryIdx < 0 || adding}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-pop-pink text-white rounded-lg text-sm font-bold disabled:opacity-40"
                >
                  {adding ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  确认关联
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 bg-gray-700 text-white/60 rounded-lg text-sm font-bold"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-800 text-white/60 rounded-lg text-sm font-bold hover:bg-gray-700 border border-dashed border-gray-600"
        >
          <Plus className="w-4 h-4" />
          添加新角色
        </button>
      )}

      <p className="text-white/30 text-[10px] leading-relaxed">
        关联角色后，系统会自动在角色卡世界书中创建“手机聊天记录-角色名”绿灯条目。
        当主剧情AI写到该角色时，条目自动激活，主线AI就能知道手机里聊了什么。
        角色关联存储在角色卡变量中，切换聊天文件不会丢失。开新聊天时聊天记录条目内容会自动清空。
      </p>
    </div>
  );
}

// ── 通用设置 ──
function GeneralSettings({
  autoMessageEnabled,
  onToggleAutoMessage,
}: {
  autoMessageEnabled: boolean;
  onToggleAutoMessage: (enabled: boolean) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      {/* 角色主动发消息开关 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-pop-cyan shrink-0" />
              <span className="text-white text-sm font-bold">角色主动发消息</span>
            </div>
            <p className="text-white/40 text-[10px] leading-relaxed">
              开启后，角色会在收到主线消息后主动给你发微信消息和朋友圈。关闭后，角色不会主动发消息，但你仍然可以主动给角色发消息。
            </p>
          </div>
          <button
            onClick={() => onToggleAutoMessage(!autoMessageEnabled)}
            className={cn('shrink-0 ml-3 w-11 h-6 rounded-full transition-colors relative', autoMessageEnabled ? 'bg-green-500' : 'bg-gray-600')}
            title={autoMessageEnabled ? '已开启' : '已关闭'}
          >
            <motion.div
              animate={{ x: autoMessageEnabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
            />
          </button>
        </div>
      </div>

      <p className="text-white/30 text-[10px] leading-relaxed">
        设置存储在角色卡变量中，切换聊天文件不会丢失。
      </p>
    </div>
  );
}
