/**
 * 手机首次引导流程
 *
 * 玩家第一次打开手机时显示，引导：
 * 1. 介绍手机功能
 * 2. 提示配置副API
 * 3. 提示在世界书中创建角色人设条目
 * 4. 提示在设置中关联角色
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Server, BookOpen, Link, ArrowRight, Check } from 'lucide-react';
import { usePhoneContext } from '../../state/PhoneContext';
import { cn } from '../../utils';

const STEPS = [
  {
    icon: Smartphone,
    title: '欢迎使用手机',
    desc: '这是你的虚拟手机。角色会在微信上主动给你发消息，你也可以回复她们。还有匿名论坛可以浏览校园八卦。',
    color: 'from-pop-pink to-pop-cyan',
  },
  {
    icon: Server,
    title: '第 1 步：配置副 API',
    desc: '手机消息由独立的副API生成，不影响主剧情。请在设置中填入副API的地址、密钥和模型名。建议使用便宜快速的小模型（如 gpt-4o-mini、deepseek-chat）。',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BookOpen,
    title: '第 2 步：创建人设条目',
    desc: '在世界书编辑器中，为你想关联的角色创建一个人设条目（如果还没有的话）。这个条目的内容将作为副API生成消息时的角色设定。',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Link,
    title: '第 3 步：关联角色',
    desc: '在手机设置 → 角色关联中，输入角色名并选择对应的世界书条目。关联后系统会自动创建聊天记录条目，让主线AI知道手机里聊了什么。',
    color: 'from-green-500 to-emerald-500',
  },
];

export function PhoneGuide({ onComplete }: { onComplete: () => void }) {
  const { setGuideShown } = usePhoneContext();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setGuideShown(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    setGuideShown(true);
    onComplete();
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-pop-black/90 backdrop-blur-sm p-6"
    >
      <motion.div
        key={step}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-[320px] text-center"
      >
        {/* 图标 */}
        <div
          className={cn(
            'w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br shadow-lg',
            current.color,
          )}
        >
          <Icon className="w-10 h-10 text-white" />
        </div>

        {/* 标题 */}
        <h2 className="text-white font-black text-lg mb-2">{current.title}</h2>

        {/* 描述 */}
        <p className="text-white/60 text-xs leading-relaxed mb-6">{current.desc}</p>

        {/* 进度点 */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === step ? 'bg-pop-pink' : i < step ? 'bg-pop-pink/40' : 'bg-white/20',
              )}
            />
          ))}
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="px-3 py-2 text-white/40 text-xs font-bold hover:text-white/60"
          >
            跳过
          </button>
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-pop-pink text-white rounded-xl text-sm font-bold hover:bg-pop-pink/80"
          >
            {step === STEPS.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                开始使用
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
