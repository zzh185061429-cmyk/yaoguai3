import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, User, Heart, Maximize2, Minimize2, BookOpen,
  Clock, MapPin, Eye, BookText, Trash2, RefreshCw, Brain, Database, Layers, Menu,
  MessageSquare, Calendar, Users, Image as ImageIcon,
  MessageCircle, Music,
  History, ChevronLeft, ChevronRight, ChevronUp, Play, FastForward, Briefcase, Dices,
} from "lucide-react";
import { useGameContext } from "../../state/GameContext";
import { useToast } from "../ToastProvider";

interface WelcomeModalProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

/** 图标 + 文字 的说明行 */
function IconLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center bg-pop-black/5 border border-pop-black/10 clip-diagonal">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

/**
 * 欢迎弹窗 — 每个新聊天文件首次打开时出现一次
 *
 * 内容：
 * 1. 作者信息
 * 2. 说明书（界面按钮 + 侧边栏模块 + 注意事项）
 * 3. <user> 玩家名设置（用于场景标签匹配）
 *
 * 出现 5 秒后才能关闭
 */
export function WelcomeModal({ isFullscreen, onToggleFullscreen }: WelcomeModalProps) {
  const { showWelcome, setShowWelcome, playerName, setPlayerName } = useGameContext();
  const { showToast } = useToast();
  const [nameInput, setNameInput] = useState(playerName || "");
  const [countdown, setCountdown] = useState(5);
  const inputRef = useRef<HTMLInputElement>(null);

  // 5 秒倒计时
  useEffect(() => {
    if (!showWelcome) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          requestAnimationFrame(() => inputRef.current?.focus());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showWelcome]);

  const canClose = countdown === 0;

  const handleClose = () => {
    if (!canClose) return;
    const trimmed = nameInput.trim();
    if (trimmed) {
      setPlayerName(trimmed);
      showToast(`已设置玩家名: ${trimmed}`, 'normal');
    } else {
      showToast('未设置玩家名，部分场景背景图可能无法显示', 'alert');
    }
    setShowWelcome(false);
  };

  return (
    <AnimatePresence>
      {showWelcome && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-2 md:p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-pop-black/90 backdrop-blur-sm"
          />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: 60, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
            className="relative w-full max-w-lg bg-white pop-border shadow-[8px_8px_0_#ff3366] z-10 flex flex-col overflow-hidden clip-diagonal max-h-[95vh]"
          >
            {/* 顶部标题栏 */}
            <div className="bg-pop-pink text-white p-3 flex justify-between items-center border-b-4 border-pop-black shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 shrink-0 fill-white" />
                <h3 className="text-lg font-black italic">欢迎来到租借男友</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* 全屏按钮 */}
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 bg-pop-black text-white hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                  title={isFullscreen ? "退出全屏" : "全屏模式（推荐）"}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                {/* 关闭按钮 — 5秒后才能点 */}
                <button
                  onClick={handleClose}
                  disabled={!canClose}
                  className={`p-2 transition-all clip-diagonal shadow-[2px_2px_0_#1a1a1a] ${
                    canClose
                      ? 'bg-pop-black text-white hover:scale-110 active:scale-90 cursor-pointer'
                      : 'bg-gray-400 text-gray-300 cursor-not-allowed'
                  }`}
                  title={canClose ? '关闭' : `请等待 ${countdown} 秒`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 非全屏提示 */}
            {!isFullscreen && (
              <div className="bg-pop-yellow text-pop-black p-2 text-center border-b-2 border-pop-black shrink-0">
                <button
                  onClick={onToggleFullscreen}
                  className="font-black text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Maximize2 className="w-4 h-4" />
                  点击这里全屏查看（推荐）
                </button>
              </div>
            )}

            {/* 内容区 — 可滚动 */}
            <div className="p-3 md:p-4 bg-stripes relative overflow-y-auto hide-scrollbar flex-1 flex flex-col gap-3">
              {/* 1. 作者信息 */}
              <div className="bg-white border-4 border-pop-black p-3 clip-diagonal shadow-pop relative z-10">
                <span className="bg-pop-yellow text-pop-black font-black text-sm px-2 py-0.5 clip-diagonal -skew-x-6 inline-block mb-1">AUTHOR</span>
                <p className="text-base font-bold text-pop-black leading-relaxed">
                  作者 <span className="text-pop-pink font-black">Zzz</span>，类脑首发，偷卡死妈
                </p>
              </div>

              {/* 2. 说明书 */}
              <div className="bg-white border-4 border-pop-black p-4 clip-diagonal shadow-pop relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 shrink-0 text-pop-pink" />
                  <span className="font-black text-base text-pop-black">说明书</span>
                </div>

                {/* ── 顶部一排按钮 ── */}
                <p className="font-black text-sm text-pop-cyan mb-2">▸ 屏幕最上方一排按钮（从左到右）</p>
                <ul className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 mb-3 pl-2">
                  <IconLine icon={<Clock className="w-3.5 h-3.5 text-pop-cyan" />}>
                    日期时间，点一下打开日历，能看一整年的节日和纪念日
                  </IconLine>
                  <IconLine icon={<MapPin className="w-3.5 h-3.5 text-pop-yellow" />}>
                    当前地点，点一下打开地图，110 个地点随便选，选了会自动帮你写"我前往了XXX"
                  </IconLine>
                  <IconLine icon={<Eye className="w-3.5 h-3.5 text-gray-600" />}>
                    护眼模式开关，按一下画面变柔和，再按一下变回来
                  </IconLine>
                  <IconLine icon={<Maximize2 className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    全屏开关，推荐开全屏玩
                  </IconLine>
                  <IconLine icon={<BookText className="w-3.5 h-3.5 text-pop-cyan" />}>
                    剧情回顾，点开能直接看最近 5 楼的纯文字剧情，不用一句句点
                  </IconLine>
                  <IconLine icon={<Trash2 className="w-3.5 h-3.5 text-pop-pink" />}>
                    删除楼层，不想看的楼层可以删掉
                  </IconLine>
                  <IconLine icon={<RefreshCw className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    重新生成最后一楼（只有最后一楼是 AI 回复时才能用）
                  </IconLine>
                  <IconLine icon={<Brain className="w-3.5 h-3.5 text-pop-cyan" />}>
                    看 AI 的思维链，就是 AI 写剧情前先想了啥
                  </IconLine>
                  <IconLine icon={<Database className="w-3.5 h-3.5 text-pop-yellow" />}>
                    查看游戏变量，能看到后台存了啥数据
                  </IconLine>
                  <IconLine icon={<Layers className="w-3.5 h-3.5 text-pop-cyan" />}>
                    楼层切换，点开下拉列表能跳到其他楼层看之前的剧情
                  </IconLine>
                  <IconLine icon={<Menu className="w-3.5 h-3.5 text-pop-yellow" />}>
                    打开 / 收起左侧菜单
                  </IconLine>
                </ul>

                {/* ── 顶部中间和右边 ── */}
                <p className="font-black text-sm text-pop-cyan mb-2">▸ 顶部中间和右边</p>
                <ul className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 mb-3 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-6 h-3 bg-pop-black border border-pop-pink clip-diagonal" />
                    <span>黑色长条：你的剩余债务和还款进度条</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-3 h-3 rounded-full bg-green-500" />
                    <span>绿色"就绪"灯：AI 没在写，可以发消息</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-3 h-3 rounded-full bg-red-500" />
                    <span>红色"生成中"灯：AI 正在写剧情，等一下</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-6 h-3 bg-pop-pink border border-pop-black clip-diagonal" />
                    <span>粉色卡片：当前接取的任务，显示角色名和任务类型，没接任务就显示"无任务"</span>
                  </li>
                </ul>

                {/* ── 左侧菜单 ── */}
                <p className="font-black text-sm text-pop-cyan mb-2">▸ 左侧菜单（点菜单图标打开）5 个页面</p>
                <ol className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 mb-3 pl-4 list-decimal">
                  <li className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-pop-pink" />
                    <span><span className="font-black">剧情推进</span>：看剧情的主页面，默认就是这个</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-pop-pink" />
                    <span><span className="font-black">债务调度</span>（核心玩法！）：点 "Roll Dispatch" 随机摇一个角色来点单，会告诉你谁、什么时间、要什么服务。一天只能接一单，可能两个人同时点单（撞单），接了之后自动帮你写好文本填进输入框</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 shrink-0 mt-0.5 text-pop-pink" />
                    <span><span className="font-black">角色图鉴</span>：看角色介绍，先看一遍防止 AI 写崩（OOC）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 shrink-0 mt-0.5 text-pop-pink" />
                    <span><span className="font-black">画廊</span>：角色的立绘和 CG</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-pop-pink" />
                    <span><span className="font-black">地点图鉴</span>：110 个地点的背景图预览</span>
                  </li>
                </ol>

                {/* ── 底部两个角 ── */}
                <p className="font-black text-sm text-pop-cyan mb-2">▸ 屏幕底部两个角</p>
                <ul className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 mb-3 pl-2">
                  <IconLine icon={<MessageCircle className="w-3.5 h-3.5 text-pop-yellow" />}>
                    左下角：输入栏开关。打开后能输入剧情走向，回车发送（Shift+回车换行）。地图选地点、调度接单都会自动把文字填进来
                  </IconLine>
                  <IconLine icon={<Music className="w-3.5 h-3.5 text-pop-pink" />}>
                    右下角：BGM 播放器，39 首免费音乐，分日常/恋爱/搞笑三类，能播放暂停切歌调音量
                  </IconLine>
                </ul>

                {/* ── 剧情页面底部按钮 ── */}
                <p className="font-black text-sm text-pop-cyan mb-2">▸ 剧情页面底部对话框按钮</p>
                <ul className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 mb-3 pl-2">
                  <IconLine icon={<History className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    历史记录：打开左侧面板看之前看过的对话
                  </IconLine>
                  <IconLine icon={<ChevronLeft className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    上一句：回看上一句话
                  </IconLine>
                  <IconLine icon={<Play className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    Auto：自动播放，开了就不用自己点了，自动往下翻
                  </IconLine>
                  <IconLine icon={<FastForward className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    速度按钮：切换打字速度（普通 → 倍速 → 极速）
                  </IconLine>
                  <IconLine icon={<Heart className="w-3.5 h-3.5 text-white bg-red-500 rounded-sm p-0.5" />}>
                    红色爱心（CG）：特殊模式开关，只有画面上出现对应角色立绘 + 到了对应地点才会出现，哪个角色配哪个地点自己试，再按一次退出
                  </IconLine>
                </ul>

                {/* ── 新功能：楼层翻页 + 选项栏 ── */}
                <p className="font-black text-sm text-pop-pink mb-2">▸ 新增功能</p>
                <ul className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 mb-3 pl-2">
                  <IconLine icon={<ChevronUp className="w-3.5 h-3.5 text-white bg-pop-black rounded-sm p-0.5" />}>
                    <span className="font-black">上层 / 下层按钮</span>：在对话框右侧，不用展开顶部菜单就能快速翻楼层。上层=翻到上一楼层，下层=翻到下一楼层。AI 还没写完下一楼时下层按钮会变灰，写完才能点，跟 galgame 翻页一样
                  </IconLine>
                  <IconLine icon={<ChevronRight className="w-3.5 h-3.5 text-pop-yellow" />}>
                    <span className="font-black">选项栏</span>：当 AI 输出带选项的剧情时，剧本播完后屏幕会暗下来，中央弹出选项卡片（每个选项旁边带随机角色的 Q 版小人）。点一个选项会自动把文本填进输入框，也可以点右上角 × 关掉选项自己输入
                  </IconLine>
                </ul>

                {/* 注意事项 */}
                <p className="font-black text-sm text-pop-pink mb-2">▸ 注意</p>
                <ol className="text-sm font-bold text-gray-700 leading-relaxed space-y-1.5 pl-4 list-decimal">
                  <li>角色图鉴是用来对角色有一个大致了解的，防止出了OOC问题不清楚，但是推荐先看过世界书再玩。角色画廊，可以查看对应角色的SFW立绘和小人差分，每人10张一共110张，地点一共212张，对应角色的NSFW CG，每人14张一共154张</li>
                  <li>目前每个人的CG只做了第一轮事件，看后续加入新角色和新的全角色CG</li>
                  <li>删除世界书里的 <code className="bg-gray-100 px-0.5">&lt;user&gt;</code> 无情绪标签</li>
                  <li>不要开启自己预设里的任何前端渲染内容</li>
                  <li>预设只适配了 Izumi，正文提取标签是 content，思维链提取是 think、thinking、Izumi 的思维链，不要问为什么我的预设爆思维链了</li>
                  <li>世界书里的 cot 复制换到 Izumi 的自定义思维链，思维链包含了地点、年历节日检查，对应写卡方式的性格提取和总结，OOC 检测、纸片人检测、防情绪滑坡等，要用其他预设自己去改，有问题带上你用的是什么预设来提</li>
                </ol>
              </div>

              {/* 3. <user> 玩家名设置 */}
              <div className="bg-white border-4 border-pop-black p-3 clip-diagonal shadow-pop relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 shrink-0 text-pop-pink" />
                  <span className="font-black text-base text-pop-black">设置你的名字</span>
                </div>
                <p className="text-sm font-bold text-gray-600 leading-relaxed mb-2">
                  AI 会用你的名字写场景（如"二楼XXX卧室"）。输入名字后前端会自动匹配场景背景图，否则部分背景图无法显示。
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canClose) handleClose();
                  }}
                  placeholder="输入你在酒馆里设置的名字..."
                  maxLength={20}
                  className="w-full bg-pop-black text-white font-bold p-2 border-4 border-white resize-none
                             placeholder:text-gray-500 focus:outline-none focus:border-pop-yellow
                             transition-colors clip-diagonal text-base"
                />
                {playerName && (
                  <p className="text-sm text-gray-500 font-bold mt-1.5">
                    当前已设置: <span className="text-pop-pink">{playerName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 底部关闭栏 — 固定在底部 */}
            <div className="shrink-0 border-t-4 border-pop-black bg-pop-black p-2">
              {!canClose ? (
                <div className="text-center py-1">
                  <span className="font-black text-base text-white">
                    请稍候 <span className="text-pop-yellow text-lg">{countdown}</span> 秒后可关闭...
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-full bg-pop-yellow text-pop-black font-black italic text-lg p-2 border-4 border-white shadow-pop-pink hover:scale-105 active:scale-95 transition-all clip-diagonal flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5 fill-pop-pink text-pop-pink" />
                  确认并开始游戏
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
