/**
 * 线索卷宗 ↔ 聊天世界书同步模块
 *
 * 每个案件在聊天世界书中是一个条目：
 * - 进行中：蓝灯（constant），插入 at_depth 深度0 system，AI 每次都能看到
 * - 结案后：绿灯（selective），带关键词，插入 after_character_definition，只在相关话题激活
 */

import type { Clue } from '../store/GameContext';

/** 聊天世界书条目名称前缀 */
const CASE_ENTRY_PREFIX = '案件_';

/** 蓝灯条目配置（进行中） */
const ACTIVE_ENTRY_TEMPLATE = {
  enabled: true,
  strategy: {
    type: 'constant' as const,
    keys: [] as (string | RegExp)[],
    keys_secondary: { logic: 'and_any' as const, keys: [] as (string | RegExp)[] },
    scan_depth: 'same_as_global' as const,
  },
  position: {
    type: 'at_depth' as const,
    role: 'system' as const,
    depth: 0,
    order: 200,
  },
  probability: 100,
  recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
};

/** 绿灯条目配置（已结案） */
const CLOSED_ENTRY_TEMPLATE = {
  enabled: true,
  strategy: {
    type: 'selective' as const,
    keys: [] as (string | RegExp)[],
    keys_secondary: { logic: 'and_any' as const, keys: [] as (string | RegExp)[] },
    scan_depth: 'same_as_global' as const,
  },
  position: {
    type: 'after_character_definition' as const,
    role: 'system' as const,
    depth: 0,
    order: 200,
  },
  probability: 100,
  recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
};

/** 获取或创建聊天世界书，返回世界书名称 */
async function ensureChatWorldbook(): Promise<string | null> {
  try {
    const name = await getOrCreateChatWorldbook('current');
    return name;
  } catch (e) {
    console.warn('[幻璃镜] 无法获取聊天世界书', e);
    return null;
  }
}

/** 根据案件 ID 构造世界书条目名称 */
export function caseEntryName(caseId: string): string {
  return `${CASE_ENTRY_PREFIX}${caseId}`;
}

/** 根据条目名称提取案件 ID */
export function extractCaseId(entryName: string): string | null {
  if (entryName.startsWith(CASE_ENTRY_PREFIX)) {
    return entryName.slice(CASE_ENTRY_PREFIX.length);
  }
  return null;
}

/** 截断文本用于推论的源线索回显 */
function shorten(text: string, max = 18): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * 将线索和推论列表渲染为世界书条目的 content 文本
 *
 * 分区结构（AI 视角）：
 * - 线索：已确立事实
 * - 已证推论（truth=true）：视为已确立事实
 * - 待验推论（truth=half/false/undefined）：尚未证实的推理方向
 * - AI专属·玩家不可见：half/false 的隐藏判定及处理指令，防止污染正典并制造戏剧反讽
 */
export function renderCaseContent(
  caseName: string,
  clues: Clue[],
  isClosed: boolean,
  closingStatement?: string,
): string {
  const lines: string[] = [];
  lines.push(`【案件：${caseName}】`);
  lines.push('状态：' + (isClosed ? '已结案' : '调查中'));
  lines.push('');

  if (isClosed && closingStatement) {
    lines.push('结案陈词：');
    lines.push(closingStatement);
    lines.push('');
  }

  const deductions = clues.filter(c => c.type === 'deduction');
  const standaloneClues = clues.filter(c => c.type === 'clue');
  const clueTextById = new Map(clues.map(c => [c.id, c.text]));

  if (standaloneClues.length > 0) {
    lines.push('线索（已确立事实）：');
    for (const clue of standaloneClues) {
      lines.push(`- ${clue.text}`);
    }
    lines.push('');
  }

  const proven = deductions.filter(d => d.truth === 'true');
  const pending = deductions.filter(d => d.truth !== 'true');

  const renderDeduction = (ded: Clue) => {
    const sources = (ded.sourceClueIds ?? [])
      .map(id => clueTextById.get(id))
      .filter(Boolean)
      .map(t => `「${shorten(t as string)}」`)
      .join('+');
    return sources ? `${ded.text}（由${sources}推出）` : ded.text;
  };

  if (proven.length > 0) {
    lines.push('已证推论（视为已确立事实）：');
    for (const ded of proven) {
      lines.push(`- ${renderDeduction(ded)}`);
    }
    lines.push('');
  }

  if (pending.length > 0) {
    lines.push('待验推论（尚未证实，不得当作事实使用）：');
    for (const ded of pending) {
      lines.push(`- ${renderDeduction(ded)}`);
    }
    lines.push('');
  }

  const hidden = pending.filter(d => d.truth === 'false' || d.truth === 'half');
  if (hidden.length > 0) {
    lines.push('【AI专属·玩家不可见，严禁向玩家透露本区内容】');
    for (const ded of hidden) {
      if (ded.truth === 'false') {
        lines.push(`- 推论「${ded.text}」判定为误导（假）：它并非事实。不得直接宣布其为假，不得让NPC无证据地否认；应在剧情中渐进安排可被玩家发现的新线索作为反证，待玩家自行推翻。推翻本身应产出新的剧情与线索。`);
      } else {
        lines.push(`- 推论「${ded.text}」判定为半真：部分成立、另有隐情。可安排部分印证，但必须保留反转空间，不得完全坐实。`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 为新案件创建一个蓝灯条目
 */
export async function createCaseEntry(caseId: string, caseName: string, clues: Clue[]): Promise<boolean> {
  const wbName = await ensureChatWorldbook();
  if (!wbName) return false;

  const content = renderCaseContent(caseName, clues, false);

  try {
    await createWorldbookEntries(wbName, [{
      name: caseEntryName(caseId),
      content,
      ...ACTIVE_ENTRY_TEMPLATE,
    }]);
    console.info(`[幻璃镜] 案件条目已创建: ${caseEntryName(caseId)}`);
    return true;
  } catch (e) {
    console.warn(`[幻璃镜] 创建案件条目失败`, e);
    return false;
  }
}

/**
 * 更新案件条目的 content（线索/推论变化时）
 */
export async function updateCaseEntry(caseId: string, caseName: string, clues: Clue[], isClosed: boolean, closingStatement?: string): Promise<void> {
  const wbName = await ensureChatWorldbook();
  if (!wbName) return;

  const entryName = caseEntryName(caseId);
  const content = renderCaseContent(caseName, clues, isClosed, closingStatement);

  try {
    await updateWorldbookWith(wbName, (wb) => {
      return wb.map(entry => {
        if (entry.name === entryName) {
          return { ...entry, content };
        }
        return entry;
      });
    });
  } catch (e) {
    console.warn(`[幻璃镜] 更新案件条目失败`, e);
  }
}

/**
 * 结案：将蓝灯条目改为绿灯，设置关键词，移到角色定义之后
 */
export async function closeCaseEntry(caseId: string, caseName: string, keywords: string[], clues: Clue[], closingStatement: string): Promise<boolean> {
  const wbName = await ensureChatWorldbook();
  if (!wbName) return false;

  const entryName = caseEntryName(caseId);
  const content = renderCaseContent(caseName, clues, true, closingStatement);

  try {
    await updateWorldbookWith(wbName, (wb) => {
      return wb.map(entry => {
        if (entry.name === entryName) {
          return {
            ...entry,
            content,
            strategy: {
              ...entry.strategy,
              type: 'selective' as const,
              keys: keywords,
            },
            position: {
              ...entry.position,
              type: 'after_character_definition' as const,
              role: 'system' as const,
              depth: 0,
              order: 200,
            },
          };
        }
        return entry;
      });
    });
    console.info(`[幻璃镜] 案件已结案: ${entryName}`);
    return true;
  } catch (e) {
    console.warn(`[幻璃镜] 结案条目失败`, e);
    return false;
  }
}

/**
 * 删除案件条目
 */
export async function deleteCaseEntry(caseId: string): Promise<void> {
  const wbName = await ensureChatWorldbook();
  if (!wbName) return;

  const entryName = caseEntryName(caseId);

  try {
    await deleteWorldbookEntries(wbName, entry => entry.name === entryName);
    console.info(`[幻璃镜] 案件条目已删除: ${entryName}`);
  } catch (e) {
    console.warn(`[幻璃镜] 删除案件条目失败`, e);
  }
}
