import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LayoutGrid, Smartphone, MessageSquareText, HelpCircle } from 'lucide-react';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ItemType = { key: string; desc: string };
type SubGroupType = { title: string; items: ItemType[] };
type SectionType = {
  icon: React.ReactNode;
  title: string;
  color: string;
  intro?: string;
  subGroups?: SubGroupType[];
  items?: ItemType[];
};

const SECTIONS: SectionType[] = [
  // ── HUD ──
  {
    icon: <LayoutGrid className="w-5 h-5" />,
    title: 'HUD 工具栏',
    color: 'bg-pop-pink text-white',
    intro: '正上方的 HUD 栏可以收起和展开，功能依次是：',
    items: [
      { key: '1. 重生成', desc: '重新生成最后一层 AI 楼层内容。最后一楼如果是用户消息则不可使用' },
      { key: '2. 楼层助手', desc: '方便地跳转查看其他楼层' },
      { key: '3. 剧情阅读器', desc: '查看最近五次 AI 回复的正文' },
      { key: '4. 思维链提取器', desc: '提取包括 think、thinking、draft、konatan_planning 一共四种思维链内容' },
      { key: '5. 变量查看', desc: '查看当前游戏变量状态' },
      { key: '6. 删除楼层', desc: '删除指定楼层' },
      { key: '7. 护眼模式', desc: '切换护眼滤镜' },
      { key: '8. 全屏', desc: '全屏和退出全屏' },
      { key: '9. 设置', desc: '调整文本速度、天气特效粒子、文本音量' },
      { key: '10. 说明书', desc: '忘记了功能？点击重新查看本说明' },
    ],
  },

  // ── 文本框 ──
  {
    icon: <MessageSquareText className="w-5 h-5" />,
    title: '文本框',
    color: 'bg-pop-cyan text-pop-black',
    items: [
      { key: '1. 历史记录', desc: '查看当前楼层的消息' },
      { key: '2. 上一句', desc: '回退到上一句台词' },
      { key: '3. 自动播放', desc: '自动推进台词' },
      { key: '4. 文本速度', desc: '三档：慢、正常、快' },
      { key: '5. 上层', desc: '只要非第零层，点击可以翻到上一楼' },
      { key: '6. 下层', desc: '只要非最后一层，点击可以翻到下一楼。新的楼层生成完毕后下一层会亮起' },
      { key: '7. ChatBar', desc: '左下角黄色按钮，点击后跳出输入框，输入后同步发给酒馆，完美适配数据库' },
      { key: '8. 选项框', desc: '需要打开预设选项栏，目前识别 choice 和 options 两种标签。如果没选但想重新选，点击上层再点击下层重新来一遍即可' },
      { key: '键盘', desc: 'D/→ 下一句，A/← 上一句，Ctrl 长按快进，滚轮上下翻页（等同方向键）' },
    ],
  },

  // ── 小手机 ──
  {
    icon: <Smartphone className="w-5 h-5" />,
    title: '小手机',
    color: 'bg-pop-yellow text-pop-black',
    subGroups: [
      {
        title: '微信',
        items: [
          { key: '联系人', desc: '会在各个时间段主动给你发消息，你也可以主动发消息，聊天内容同步写入聊天世界书' },
          { key: '右上角三点', desc: '压缩消息可将聊天和世界书内容压缩以解决 token 问题；查看压缩记录可看原文本；清空聊天记录会同步清空世界书内容' },
          { key: '群聊', desc: '点击＋可以添加群聊' },
        ],
      },
      {
        title: '朋友圈',
        items: [
          { key: '动态', desc: '关联角色会发朋友圈，你可以点赞和评论' },
          { key: '我', desc: '自己的名字和头像上传' },
        ],
      },
      {
        title: '论坛',
        items: [
          { key: '板块', desc: '分为不同板块，点击后开始加载帖子，可点进去查看完整内容' },
          { key: '关注', desc: '点击关注会将帖子写入世界书做跟随，可以当小任务玩' },
          { key: '回复', desc: '可以回复别人评论，别人也可能回复你' },
        ],
      },
      {
        title: '地图',
        items: [
          { key: '三级地点', desc: '点击后分为三级大地点，最小一级会有角色对应小人，点击角色显示动向' },
          { key: '偶遇', desc: '地点依靠随机池子和固定日程运转，随时可以在指定地点遇到对应角色' },
          { key: '前往', desc: '点击对应地点后，会在输入栏自动写入"我前往了XXX"' },
        ],
      },
      {
        title: '天气系统',
        items: [
          { key: '一周天气', desc: '可查看一周天气：晴天、多云、阴天、小雨、大雨、雪天、雷暴、雾' },
          { key: '影响', desc: '不同天气会导致不同的场景地点 CG 和角色行为逻辑，如周念安雨天带薪休假等' },
          { key: '特效', desc: '雨天和雪天会有动态特效粒子模拟雨和雪' },
        ],
      },
      {
        title: '日历',
        items: [
          { key: '节日纪念', desc: '查看一整年的各种节日和纪念日，不同角色在不同纪念日有不同行事风格，如情人节会等待你的邀约' },
        ],
      },
      {
        title: '图鉴',
        items: [
          { key: '角色信息', desc: '每个人点单时的单价和个人信息' },
        ],
      },
      {
        title: '画廊',
        items: [
          { key: '立绘与CG', desc: '每个角色九张立绘差分、十四张 NSFW CG、一个 Q 版小人' },
          { key: 'NSFW', desc: '需要解锁才能看到，会提示你解锁地点' },
        ],
      },
      {
        title: '地点',
        items: [
          { key: '地点CG', desc: '一共 115 个地点 CG 图片，可切换白天夜晚' },
        ],
      },
      {
        title: '租借',
        items: [
          { key: '核心应用', desc: '点击 Roll Dispatch 后会随机抽取三位客户，副API会为每位客户生成一段符合角色人设的下单描述，从中选一个接受即可' },
          { key: '接单', desc: '接单后服务信息写入变量，玩家可自由行动，到预约时间后服务自动开始' },
        ],
      },
      {
        title: '音乐',
        items: [
          { key: 'BGM', desc: '一共 39 首从 dova 找的免费素材音乐，分日常、恋爱和搞笑，单曲循环，播放后全局适用' },
        ],
      },
      {
        title: '设置',
        items: [
          { key: '副API', desc: '推荐 3.1P、V4P 这些模型，不推荐 3F 这种弱智模型（不读约束导致全知和 OOC）' },
          { key: '角色关联', desc: '将世界书内的角色关联，已做好可无视' },
          { key: '通用', desc: '决定角色会不会主动给你发消息' },
        ],
      },
    ],
  },

  // ── FAQ ──
  {
    icon: <HelpCircle className="w-5 h-5" />,
    title: 'FAQ',
    color: 'bg-pop-black text-white border-white',
    items: [
      { key: 'Q1', desc: '为什么其他卢克有立绘有 CG，我的没有？\n→ 检查你的小铅笔里是不是丢失了场景和情绪标签' },
      { key: 'Q2', desc: '为什么我的界面显示"正在生成剧情中"？\n→ 点开小铅笔，检查 <content> 与 </content> 是否完整包裹正文，如果有，检查是否空回' },
      { key: 'Q3', desc: '为什么界面里混了奇奇怪怪的代码文本？\n→ 检查是否开启了预设的前端渲染/前端生成，如果有则关闭。如果没有，检查是否自己开启了防空回、防截断、防429等' },
      { key: 'Q4', desc: 'NSFW 怎么解锁？\n→ 指定角色立绘出现 + 指定地点，此时文本框会有一个爱心，点击后 NSFW CG 会覆盖替换地点 CG' },
      { key: 'Q5', desc: '为什么老是掉格式？\n→ 看看自己是不是 DS，如果是，把格式和变量等修改为用户深度 1' },
      { key: 'Q6', desc: '手机端 UI 挤在一块？退出全屏后看不到全屏按钮？\n→ 首先检查是不是 TT 这类直装酒馆，如果是只能自己解决。如果是 termux 酒馆，横屏。手机端适配一直有问题' },
    ],
  },
];

export function ManualModal({ isOpen, onClose }: ManualModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[88dvh] md:max-h-[85vh] bg-white pop-border shadow-pop-lg flex flex-col overflow-hidden"
          >
            {/* 标题栏 */}
            <div className="shrink-0 bg-pop-black text-white p-4 pop-border border-b-4 border-pop-pink flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-pop-yellow" />
                <h2 className="text-base md:text-lg font-black">操作说明书</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-pop-pink hover:bg-pop-yellow hover:text-pop-black transition-colors pop-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 引言 — 开场白强调 */}
            <div className="shrink-0 px-4 py-3 bg-pop-black border-b-2 border-pop-pink">
              <p className="text-base md:text-lg font-black italic text-center leading-relaxed">
                <span className="text-pop-yellow">"Zzz牢师，你的前端好碍事啊！"</span>
                <span className="text-white/40 mx-2">—</span>
                <span className="text-pop-pink">"真拿你没办法，坐好咯！"</span>
              </p>
            </div>

            {/* 内容区 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pt-2 space-y-4">
              {SECTIONS.map((section, idx) => (
                <div key={idx} className="border-2 border-pop-black pop-border overflow-hidden">
                  {/* 章节标题 */}
                  <div className={`flex items-center gap-2 px-3 py-2 ${section.color} font-black text-sm`}>
                    {section.icon}
                    {section.title}
                  </div>

                  {/* 章节介绍 */}
                  {section.intro && (
                    <div className="px-3 py-1.5 bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                      {section.intro}
                    </div>
                  )}

                  {/* 子分组（小手机用） */}
                  {section.subGroups && (
                    <div className="divide-y divide-gray-200">
                      {section.subGroups.map((sub, si) => (
                        <div key={si}>
                          <div className="px-3 py-1 bg-pop-black/5 text-xs font-bold text-pop-black border-b border-gray-100">
                            {sub.title}
                          </div>
                          <div className="divide-y divide-gray-100">
                            {sub.items.map((item, i) => (
                              <div key={i} className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
                                <span className="shrink-0 min-w-16 text-xs font-bold bg-pop-black text-white px-2 py-0.5 rounded text-center">
                                  {item.key}
                                </span>
                                <span className="text-sm text-gray-700 leading-snug flex-1 whitespace-pre-line">{item.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 普通列表 */}
                  {section.items && (
                    <div className="divide-y divide-gray-100">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
                          <span className="shrink-0 min-w-16 text-xs font-bold bg-pop-black text-white px-2 py-0.5 rounded text-center">
                            {item.key}
                          </span>
                          <span className="text-sm text-gray-700 leading-snug flex-1 whitespace-pre-line">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 底部 — 魂环警告强调 + 关闭按钮 */}
            <div className="shrink-0 border-t-4 border-pop-black bg-pop-pink/10 p-3">
              <p className="text-center text-sm md:text-base font-black text-red-600 mb-3 leading-relaxed">
                ⚠️ 如果不看说明书反复问问题不回答，可能还会变成帖子里的魂环
              </p>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-1.5 bg-pop-black text-white text-sm font-bold hover:bg-pop-pink transition-colors pop-border"
                >
                  知道了
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
