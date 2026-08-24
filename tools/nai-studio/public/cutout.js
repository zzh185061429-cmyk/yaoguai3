/**
 * 去白边算法（纯函数，浏览器与 Node 共享）
 *
 * 原理: NAI 出图自带 alpha 通道。白边 = 轮廓外的半透明窄环（前景色与白色背景的混合）。
 *  1) 低于 alpha 阈值的噪点清零
 *  2) 对实体 mask 腐蚀 shrink 轮，被腐蚀的边缘环按层数衰减 alpha
 *  3) defringe: 半透明像素做去白色合成 c' = (c - (1-a)·255) / a
 *  4) 内侧白晕: 实心边缘像素与更内侧像素颜色混合
 * 白袍/白尾巴/鼻尖阴影都是 alpha=255 的实心区域 → 判定依据是透明度结构而非颜色，原理上不会被误删。
 */
function processCutoutDataNAI(src, { shrink = 1, threshold = 24, defringe = true } = {}) {
  const W = src.width, H = src.height;
  const d = src.data;
  const out = new Uint8ClampedArray(d);
  const N = W * H;

  // 1) alpha 噪点清理
  for (let p = 0; p < N; p++) if (d[p * 4 + 3] < threshold) out[p * 4 + 3] = 0;

  // 2) 二值实体 mask + 逐轮腐蚀，记录每像素被腐蚀的轮数
  const mask = new Uint8Array(N);
  for (let p = 0; p < N; p++) mask[p] = out[p * 4 + 3] > 0 ? 1 : 0;
  const round = new Uint8Array(N);
  let cur = Uint8Array.from(mask);
  for (let k = 1; k <= shrink; k++) {
    const next = new Uint8Array(N);
    for (let y = 1; y < H - 1; y++) {
      const row = y * W;
      for (let x = 1; x < W - 1; x++) {
        const p = row + x;
        if (!cur[p]) continue;
        if (cur[p - 1] && cur[p + 1] && cur[p - W] && cur[p + W]) next[p] = 1;
        else round[p] = k;
      }
    }
    cur = next;
  }
  for (let p = 0; p < N; p++) {
    if (!round[p]) continue;
    const keep = 1 - round[p] / (shrink + 1);
    out[p * 4 + 3] = Math.round(out[p * 4 + 3] * keep * keep);
  }

  // 3+4) defringe
  if (defringe) {
    for (let p = 0; p < N; p++) {
      const i = p * 4, a = out[i + 3];
      if (a > 0 && a < 255) {
        const af = a / 255;
        if (af > 0.05) {
          out[i] = Math.max(0, Math.min(255, (out[i] - (1 - af) * 255) / af));
          out[i + 1] = Math.max(0, Math.min(255, (out[i + 1] - (1 - af) * 255) / af));
          out[i + 2] = Math.max(0, Math.min(255, (out[i + 2] - (1 - af) * 255) / af));
        }
      }
    }
    const core = cur;
    if (shrink >= 1) {
      for (let y = 1; y < H - 1; y++) {
        const row = y * W;
        for (let x = 1; x < W - 1; x++) {
          const p = row + x;
          if (!(mask[p] && !core[p])) continue;
          const i = p * 4;
          let r = 0, g = 0, b = 0, n = 0;
          for (const q of [p - 1, p + 1, p - W, p + W]) {
            if (core[q]) { r += d[q * 4]; g += d[q * 4 + 1]; b += d[q * 4 + 2]; n++; }
          }
          if (n > 0) {
            out[i] = Math.round(out[i] * 0.4 + (r / n) * 0.6);
            out[i + 1] = Math.round(out[i + 1] * 0.4 + (g / n) * 0.6);
            out[i + 2] = Math.round(out[i + 2] * 0.4 + (b / n) * 0.6);
          }
        }
      }
    }
  }
  return { data: out, width: W, height: H };
}

if (typeof window !== 'undefined') window.processCutoutDataNAI = processCutoutDataNAI;
if (typeof module !== 'undefined' && module.exports) module.exports = { processCutoutDataNAI };
