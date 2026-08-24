import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { BookOpen, Compass, Feather, Network } from 'lucide-react';
import { cn } from '../../utils';

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'world' | 'gameplay' | 'deduction' | 'controls'>('world');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="大 雍 异 闻 通 鉴 · 卷 宗 指 南" id="manual-modal">
      <div className="flex flex-col gap-5 text-paper-100">
        {/* 顶部选项卡 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-[#3a2e1e] pb-2 shrink-0">
          {[
            { id: 'world', label: '时代风貌', icon: Compass },
            { id: 'gameplay', label: '侦勘推演', icon: BookOpen },
            { id: 'deduction', label: '红线连结', icon: Network },
            { id: 'controls', label: '符节法度', icon: Feather },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                id={`btn-manual-tab-${item.id}`}
                onClick={() => setTab(item.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-serif rounded-xs border transition-all cursor-pointer whitespace-nowrap shrink-0",
                  active
                    ? "bg-[#382b18] text-gold-300 border-gold-500 font-bold shadow-sm"
                    : "bg-[#1e1812] text-paper-500 border-[#3a2e1e] hover:text-paper-50 hover:bg-[#282118]"
                )}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 内容展示 */}
        <div className="bg-[#181410] border border-[#6b583e] p-4 sm:p-6 rounded-xs space-y-4 font-serif text-xs leading-relaxed text-paper-400">
          {tab === 'world' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gold-300 tracking-widest border-b border-[#3a2e1e] pb-2">
                【时代风貌 · 架空明制·大雍朝】
              </h4>
              <p>
                国朝大雍定鼎应天府已历三世，天下升平，然暗流未止。朝中北镇抚司缇骑监察四海，钦天监夜察星斗，专司天下阴阳异兆。
              </p>
              <p>
                坊间相传，上古九尾天狐一脉曾与大雍先祖立下灵枢契约。近年「荧惑守心」异象频现，封印松动，京畿各地灵怪魅影渐显。
              </p>
              <div className="bg-[#24100c] border border-vermilion-700/40 p-3 rounded-xs text-vermilion-400">
                ◆ 戒饬条律：锦衣缇骑断案，须讲求人证物证确凿，切不可听信风闻妄断神妖。
              </div>
            </div>
          )}

          {tab === 'gameplay' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gold-300 tracking-widest border-b border-[#3a2e1e] pb-2">
                【侦勘推演 · 案卷流程】
              </h4>
              <p>
                一、<strong>案情对话</strong>：于主界面与嫌犯、证人或缇骑同僚对谈，文字中出现的关键线索将由司天灵枢自动收录至「密札」。
              </p>
              <p>
                二、<strong>勘查舆图</strong>：点击右上角【舆图】即可俯瞰应天府疆域，移步不同案发现场搜寻物证拓本。
              </p>
              <p>
                三、<strong>命盘造化</strong>：对谈中的言行举止将影响主要角色对你的信任与羁绊好感，从而解锁更深层的机密案情。
              </p>
            </div>
          )}

          {tab === 'deduction' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gold-300 tracking-widest border-b border-[#3a2e1e] pb-2">
                【红线连结 · 案台合券】
              </h4>
              <p>
                进入【密札 / 案卷】界面的「红线推演」模式：
              </p>
              <ul className="list-disc pl-4 space-y-2 text-paper-200">
                <li>勾选两条或以上关联线索（如【染血蟠龙玉玦】与【更夫张老汉证词】）。</li>
                <li>点击【红线合券·案台推演】，灵境将自动演算出数条推论候选。</li>
                <li>选定最佳推论定谳，即可生成确凿的「案卷定论」，推动大雍疑案昭雪！</li>
              </ul>
            </div>
          )}

          {tab === 'controls' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gold-300 tracking-widest border-b border-[#3a2e1e] pb-2">
                【符节法度 · 快捷操作】
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-[#1f1912] border border-[#423522] rounded-xs">
                  <span className="text-gold-300 font-bold">Space / 鼠标点击</span>
                  <p className="text-paper-500 mt-0.5">继续下一句对话</p>
                </div>
                <div className="p-2.5 bg-[#1f1912] border border-[#423522] rounded-xs">
                  <span className="text-gold-300 font-bold">Auto 键</span>
                  <p className="text-paper-500 mt-0.5">自动放映剧情</p>
                </div>
                <div className="p-2.5 bg-[#1f1912] border border-[#423522] rounded-xs">
                  <span className="text-gold-300 font-bold">密札 / 舆图</span>
                  <p className="text-paper-500 mt-0.5">顶部与底部快捷呼出</p>
                </div>
                <div className="p-2.5 bg-[#1f1912] border border-[#423522] rounded-xs">
                  <span className="text-gold-300 font-bold">音律雅乐</span>
                  <p className="text-paper-500 mt-0.5">右下角随时调律与静音</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
