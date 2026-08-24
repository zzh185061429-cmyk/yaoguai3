/**
 * 交互流程核心模块 — 移植自租借男友，适配幻璃镜（暂无 MVU，变量解析待接入）
 *
 * 重新生成采用"静默生成 + 原地替换"策略：
 * 不删除楼层（删除会导致楼层 iframe 被酒馆销毁、前端退出全屏），
 * 而是 should_silence 静默生成后用 setChatMessages 直接替换最后一层内容。
 */

// ── 思维链过滤 ──

/** 剥离思维/规划标签对及其内容（与 scriptParser 的 STRIP_PAIRS 保持一致） */
function stripThinking(raw: string): string {
  let text = raw;
  const pairs: [string, string][] = [
    ['<Chain_of_Thought>', '</Chain_of_Thought>'],
    ['<draft>', '</draft>'],
    ['<think>', '</think>'],
    ['<thinking>', '</thinking>'],
    ['<simple_thinking>', '</simple_thinking>'],
  ];
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [open, close] of pairs) {
    const re = new RegExp(escapeRegExp(open) + '[\\s\\S]*?' + escapeRegExp(close), 'gi');
    text = text.replace(re, '');
  }
  return text;
}

// ── 重新生成最后一楼层 ──

type RegenResult =
  | { success: true }
  | { success: false; error: string };

/**
 * 重新生成最后一楼层（assistant）
 *
 * 原理：
 * 1. 获取最后一楼层（必须是 assistant）
 * 2. 找到上一层的 user 消息作为输入
 * 3. 使用 should_silence: true 静默生成，不创建新楼层
 * 4. 用 setChatMessages 直接替换最后一楼层的内容
 *
 * 这样避免了删除再创建导致的"楼层消失"问题。
 */
export async function regenerateCurrentFloor(): Promise<RegenResult> {
  try {
    // ── 步骤 1：获取最后一楼层 ──
    const lastFloorId = getLastMessageId();
    const lastFloor = getChatMessages(-1)[0];

    if (!lastFloor) {
      return { success: false, error: '未找到最后一楼层' };
    }

    if (lastFloor.role !== 'assistant') {
      return { success: false, error: '最后一楼层不是 assistant，无法重新生成' };
    }

    console.info('[regen] 目标楼层 #' + lastFloorId);

    // ── 步骤 2：找到上一层的 user 消息 ──
    // 从最后一楼层往前找，找到最近的一个 user 楼层
    let userText = '';
    let userFloorId = -1;

    for (let i = lastFloorId - 1; i >= 0; i--) {
      const msgs = getChatMessages(i);
      if (msgs && msgs.length > 0 && msgs[0].role === 'user') {
        userText = msgs[0].message || '';
        userFloorId = i;
        break;
      }
    }

    if (!userText) {
      return { success: false, error: '未找到上一层的用户输入' };
    }

    console.info('[regen] 找到 user 楼层 #' + userFloorId + '，输入长度:', userText.length);

    // ── 步骤 3：获取当前聊天历史，截断到 user 楼层 ──
    // 覆盖 chat_history，让 AI 基于 user 输入重新生成（而不是接着已有回复续写）
    const allMessages = getChatMessages('0-' + userFloorId);
    const historyPrompts: RolePrompt[] = allMessages.map(msg => ({
      role: msg.role as 'system' | 'assistant' | 'user',
      content: msg.message || '',
    }));

    console.info('[regen] 截断历史到楼层 #' + userFloorId + '，共 ' + historyPrompts.length + ' 条消息');

    // ── 步骤 4：静默生成（不创建新楼层）──
    const rawResponse = await generate({
      user_input: userText,
      should_stream: false,
      should_silence: true,
      overrides: {
        chat_history: {
          prompts: historyPrompts,
        },
      },
    });

    if (!rawResponse || typeof rawResponse !== 'string') {
      return { success: false, error: 'AI 返回了空响应' };
    }

    console.info('[regen] AI 重新生成完成，长度:', rawResponse.length);

    // ── 步骤 5：过滤思维链（剧本标签保留原样，前端 scriptParser 负责解析）──
    const filtered = stripThinking(rawResponse).trim();
    if (!filtered) {
      return { success: false, error: '重新生成的内容为空' };
    }

    // ── 步骤 6：直接替换最后一楼层的内容（关键：不删除，直接替换）──
    await setChatMessages(
      [{ message_id: lastFloorId, message: filtered }],
      { refresh: 'none' }, // 不触发页面重新渲染，避免退出全屏
    );

    console.info('[regen] 楼层 #' + lastFloorId + ' 内容已替换');

    // ── 步骤 7：通知前端刷新 ──
    eventEmit('mirage_story_updated');

    return { success: true };

  } catch (err: any) {
    console.error('[regen] 失败:', err?.message || err);
    return { success: false, error: err?.message || '重新生成失败' };
  }
}
