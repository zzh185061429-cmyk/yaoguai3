/**
 * 楼层导航工具 — 扫描所有 assistant 楼层
 */

/** 扫描所有 assistant 楼层（供下拉列表使用） */
export function getAssistantFloors(): number[] {
  try {
    const messages = getChatMessages('0-{{lastMessageId}}', { role: 'assistant' });
    return messages.map((m) => m.message_id).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** 获取当前楼层 ID */
export function getCurrentFloorId(): number | null {
  try {
    return getCurrentMessageId();
  } catch {
    return null;
  }
}
