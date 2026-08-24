/**
 * 交互流程核心模块 — 移植自租借男友，适配幻璃镜
 *
 * 封装 "创建 user → generate → 过滤思维链 → 提取 maintext → 解析变量 → 创建 assistant" 的完整链路
 * 包含错误回退机制：generate 失败时自动删除已创建的 user 楼层
 */

// ── 思维链过滤 ──

/** 剥离 <thinking>、⋘ 标签及其中内容，以及 </konatan_planning~> 上方所有内容（大小写不敏感） */
function stripThinking(raw: string): string {
  return raw
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/⋘[\s\S]*?<\/think>/gi, '')
    .replace(/[\s\S]*?<\/konatan_planning~>/i, '');
}

// ── 提取业务标签 ──

type ParsedResponse = {
  maintext: string;  // 主体剧情文本（供 StoryView 解析为 ScriptLine[]）
  raw: string;       // 过滤思维链后的完整文本（供变量解析）
};

/**
 * 从 AI 回复中提取 <maintext> 标签内容
 * 若不存在 <maintext> 标签，则将过滤后的全文视为 maintext
 */
function extractContent(raw: string): ParsedResponse {
  const maintextMatch = raw.match(/<maintext>([\s\S]*?)<\/maintext>/i);
  if (maintextMatch) {
    return {
      maintext: maintextMatch[1].trim(),
      raw: raw,
    };
  }
  return {
    maintext: raw.trim(),
    raw,
  };
}

// ── 完整交互流程 ──

type SendResult =
  | { success: true; message: string; mvuData: Mvu.MvuData }
  | { success: false; error: string };

/**
 * 执行一次完整的玩家输入 → AI 回复流程
 *
 * 步骤：
 * 1. 记录当前 lastMessageId（用于回退）
 * 2. createChatMessages 创建 user 楼层（refresh: 'none'）
 * 3. generate 请求 AI 回复
 * 4. 失败 → deleteChatMessages 回退 user 楼层
 * 5. 过滤 <thinking>/⋘ 标签
 * 6. 提取 <maintext> 标签（或使用全文）
 * 7. Mvu.parseMessage 解析变量命令
 * 8. createChatMessages 创建 assistant 楼层
 * 9. eventEmit('mirage_story_updated') 通知前端刷新
 *
 * @param userText 玩家输入文本
 * @returns 成功时返回 assistant 消息文本和更新后的 MVU 数据；失败时返回错误信息
 */
export async function sendUserMessage(userText: string): Promise<SendResult> {
  const trimmed = userText.trim();
  if (!trimmed) return { success: false, error: '输入为空' };

  let userMsgId: number | null = null;

  try {
    // ── 步骤 1: 记录当前楼层号 ──
    const lastId = getLastMessageId();
    userMsgId = lastId + 1;

    // ── 步骤 2: 创建 user 楼层 ──
    await createChatMessages(
      [{ role: 'user', message: trimmed }],
      { refresh: 'none' },
    );
    console.info('[interaction] user 楼层已创建, id:', userMsgId);

    // ── 步骤 3: 请求 AI 生成 ──
    const rawResponse = await generate({
      user_input: trimmed,
      should_stream: false,
    });

    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('AI 返回了空响应或非文本内容');
    }

    console.info('[interaction] AI 回复长度:', rawResponse.length);

    // ── 步骤 5: 过滤思维链 ──
    const filtered = stripThinking(rawResponse);

    // ── 步骤 6: 提取业务内容 ──
    const { maintext, raw: parsedWithVars } = extractContent(filtered);

    // ── 步骤 7: 解析变量命令 ──
    let mvuData: Mvu.MvuData;
    try {
      await waitGlobalInitialized('Mvu');
      const msgId = getCurrentMessageId();
      const oldData = msgId != null
        ? Mvu.getMvuData({ type: 'message', message_id: msgId })
        : Mvu.getMvuData({ type: 'message' });
      mvuData = await Mvu.parseMessage(parsedWithVars, oldData);
      console.info('[interaction] 变量解析完成');
    } catch {
      console.warn('[interaction] 变量解析失败，使用当前 MVU 数据');
      const msgId = getCurrentMessageId();
      mvuData = msgId != null
        ? Mvu.getMvuData({ type: 'message', message_id: msgId })
        : Mvu.getMvuData({ type: 'message' });
    }

    // ── 步骤 8: 创建 assistant 楼层 ──
    await createChatMessages(
      [{ role: 'assistant', message: maintext }],
      { refresh: 'none' },
    );
    console.info('[interaction] assistant 楼层已创建');

    // ── 步骤 9: 通知前端刷新 ──
    eventEmit('mirage_story_updated');

    return { success: true, message: maintext, mvuData };

  } catch (err: any) {
    console.error('[interaction] 流程失败:', err?.message || err);

    // ── 回退: 删除已创建的 user 楼层 ──
    if (userMsgId !== null) {
      try {
        await deleteChatMessages([userMsgId], { refresh: 'none' });
        console.info('[interaction] 已回退 user 楼层, id:', userMsgId);
      } catch (rollbackErr) {
        console.error('[interaction] 回退失败:', rollbackErr);
      }
    }

    return { success: false, error: err?.message || '未知错误' };
  }
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
 *
 * @param currentFloorId 当前所在的楼层号（在其他楼层执行时传入）
 */
export async function regenerateCurrentFloor(currentFloorId?: number | null): Promise<RegenResult> {
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

    console.info('[regen] 目标楼层 #' + lastFloorId + '，当前所在楼层 #' + (currentFloorId ?? 'null'));

    // ── 步骤 2：找到上一层的 user 消息 ──
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
    const allMessages = getChatMessages('0-' + userFloorId);
    const historyPrompts: RolePrompt[] = allMessages.map(msg => ({
      role: msg.role as 'system' | 'assistant' | 'user',
      content: msg.message || '',
    }));

    console.info('[regen] 截断历史到楼层 #' + userFloorId + '，共 ' + historyPrompts.length + ' 条消息');

    // ── 步骤 4：静默生成（覆盖聊天历史，让 AI 基于 user 重新生成）──
    console.info('[regen] 开始调用 generate...');
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
    console.info('[regen] generate 返回:', rawResponse ? '有内容' : '空');

    console.info('[regen] AI 重新生成完成，长度:', rawResponse.length);

    // ── 步骤 5：过滤 + 提取 ──
    const filtered = stripThinking(rawResponse);
    const { maintext, raw: parsedWithVars } = extractContent(filtered);

    // ── 步骤 6：解析变量 ──
    try {
      await waitGlobalInitialized('Mvu');
      const oldData = Mvu.getMvuData({ type: 'message', message_id: lastFloorId });
      await Mvu.parseMessage(parsedWithVars, oldData);
      console.info('[regen] 变量解析完成');
    } catch {
      console.warn('[regen] 变量解析失败，使用当前 MVU 数据');
    }

    // ── 步骤 7：直接替换最后一楼层的内容（关键：不删除，直接替换）──
    await setChatMessages(
      [{ message_id: lastFloorId, message: maintext }],
      { refresh: 'none' },
    );

    console.info('[regen] 楼层 #' + lastFloorId + ' 内容已替换');

    // ── 步骤 8：手动通知前端刷新（不触发全屏退出）──
    eventEmit('mirage_story_updated');

    return { success: true };

  } catch (err: any) {
    console.error('[regen] 失败:', err?.message || err);
    return { success: false, error: err?.message || '重新生成失败' };
  }
}
