/**
 * 推演副API配置 — 角色卡变量持久化
 *
 * 供「红线连结」生成三条推论候选使用：
 * 配置后走独立 API（generateRaw custom_api，不带主聊天上下文）；
 * 未配置时回退主连接 generate()。
 */

export interface SubApiConfig {
  apiurl: string;
  key: string;
  model: string;
  source: string;
}

const DEFAULT_SUB_API: SubApiConfig = {
  apiurl: '',
  key: '',
  model: '',
  source: 'openai',
};

/** 从角色卡变量读取配置（跨聊天文件共享） */
export function loadSubApi(): SubApiConfig {
  try {
    const vars = getVariables({ type: 'character' }) as any;
    if (vars?.mirageSubApi) {
      return { ...DEFAULT_SUB_API, ...vars.mirageSubApi };
    }
  } catch (e) {
    console.warn('[幻璃镜] 无法读取推演副API配置', e);
  }
  return { ...DEFAULT_SUB_API };
}

/** 保存配置到角色卡变量 */
export function saveSubApi(config: SubApiConfig): void {
  try {
    updateVariablesWith(
      vars => ({ ...vars, mirageSubApi: config }),
      { type: 'character' },
    );
  } catch (e) {
    console.warn('[幻璃镜] 无法保存推演副API配置', e);
  }
}

/** 副API是否已配置可用 */
export function isSubApiReady(config: SubApiConfig): boolean {
  return !!(config.apiurl && config.model);
}
