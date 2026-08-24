/**
 * 成就 App — 波普风格
 *
 * 展示债务成就系统：
 * - 基础还款成就
 * - 特殊遭遇成就
 * 已解锁高亮 + 配色，未解锁灰色但显示名称、描述和触发条件
 * 每个成就带有编号，AI 可通过 <achievement>编号</achievement> 触发
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import {
  ACHIEVEMENTS,
  TIER_COLORS,
  getAchievementsByCategory,
  type AchievementCategory,
} from '../../data/achievementData';
import { useAchievementContext } from '../../state/AchievementContext';
import { AppHeader } from './PhoneShared';
import { cn } from '../../utils';

const CATEGORY_ORDER: AchievementCategory[] = ['还款', '遭遇'];

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  '还款': '基础还款成就',
  '遭遇': '特殊遭遇成就',
};

export function PhoneAchievements({ onExit }: { onExit: () => void }) {
  const { unlocked, unlockedCount, totalCount } = useAchievementContext();

  const unlockedIds = unlocked.map(u => u.id);
  const byCategory = getAchievementsByCategory(unlockedIds);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="absolute inset-0 bg-pop-black flex flex-col z-10"
    >
      <div className="absolute inset-0 bg-halftone-pink opacity-10 pointer-events-none" />
      <AppHeader
        title="成就"
        color="bg-pop-yellow"
        textColor="text-pop-black"
        onBack={onExit}
        rightIcon={
          <div className="bg-pop-black text-pop-yellow px-3 py-1 font-black text-xs border-2 border-pop-black transform -skew-x-3 shadow-pop">
            {unlockedCount} / {totalCount}
          </div>
        }
      />

      {/* 进度条 */}
      <div className="shrink-0 bg-pop-black/50 border-b-2 border-pop-black/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-pop-yellow" />
          <div className="flex-1 h-3 bg-white/10 border border-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="h-full bg-pop-yellow border-r-2 border-pop-black"
            />
          </div>
          <span className="text-pop-yellow font-black text-xs">
            {Math.round(totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0)}%
          </span>
        </div>
      </div>

      {/* 成就列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-5">
        {CATEGORY_ORDER.map(category => {
          const achievements = byCategory[category];
          if (!achievements || achievements.length === 0) return null;

          const catUnlocked = achievements.filter(a => unlockedIds.includes(a.id)).length;

          return (
            <div key={category}>
              {/* 类别标题 */}
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-white font-black text-sm tracking-wide transform -skew-x-3">
                  {CATEGORY_LABELS[category]}
                </h2>
                <span className="text-white/30 text-[10px] font-bold">
                  {catUnlocked} / {achievements.length}
                </span>
              </div>

              {/* 成就卡片 */}
              <div className="space-y-2">
                {achievements.map(def => {
                  const isUnlocked = unlockedIds.includes(def.id);
                  const record = unlocked.find(u => u.id === def.id);
                  const tierColor = TIER_COLORS[def.tier];

                  return (
                    <motion.div
                      key={def.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'border-2 p-3 relative overflow-hidden flex items-center gap-3',
                        isUnlocked
                          ? `${tierColor.bg} ${tierColor.text} ${tierColor.border} shadow-[3px_3px_0px_0px_#1a1a1a]`
                          : 'bg-white/5 text-white/30 border-white/10',
                      )}
                    >
                      {/* 半调装饰 */}
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-halftone-white opacity-15 pointer-events-none mix-blend-overlay" />
                      )}

                      {/* 奖杯图标 */}
                      <div className={cn(
                        'relative z-10 shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center',
                        isUnlocked ? 'bg-pop-black border-pop-black' : 'bg-white/5 border-white/10',
                      )}>
                        {isUnlocked ? (
                          <Trophy className="w-5 h-5 text-pop-yellow" strokeWidth={2.5} />
                        ) : (
                          <span className="text-white/40 font-black text-sm">{def.no}</span>
                        )}
                      </div>

                      {/* 文字 */}
                      <div className="relative z-10 flex-1 min-w-0">
                        {isUnlocked ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm italic -skew-x-3 truncate">
                                {def.name}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold opacity-80 leading-snug mt-0.5 line-clamp-2">
                              {def.description}
                            </div>
                            <div className="text-[9px] font-bold opacity-60 mt-1">
                              触发条件：{def.condition}
                            </div>
                            {record && (
                              <div className="text-[9px] font-bold opacity-50 mt-0.5">
                                解锁于 {record.unlockedAt}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm italic -skew-x-3">
                                {def.name}
                              </span>
                            </div>
                            <div className="text-[10px] font-bold opacity-50 leading-snug mt-0.5 line-clamp-2">
                              {def.description}
                            </div>
                            <div className="text-[9px] font-bold opacity-40 mt-1">
                              触发条件：{def.condition}
                            </div>
                          </>
                        )}
                      </div>

                      {/* 编号（解锁后显示奖杯） */}
                      <div className="relative z-10 shrink-0">
                        {!isUnlocked && (
                          <span className="text-white/30 font-black text-xs">#{def.no}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 如果没有成就 */}
        {ACHIEVEMENTS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Trophy className="w-12 h-12 mb-3 opacity-20" />
            <span className="font-black text-sm">暂无成就</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
