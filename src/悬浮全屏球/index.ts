/**
 * 悬浮全屏球脚本
 *
 * 脚本运行在酒馆助手的脚本 iframe 中（隐藏的），
 * 通过 window.parent 操作酒馆主页面。
 *
 * 功能：
 * - 在酒馆页面显示一个可拖动的悬浮球
 * - 点击悬浮球：找到最新含前端界面的楼层，将其全屏化
 *   与幻璃镜/租借男友全屏按钮效果完全一致：
 *   1) CSS 伪全屏 — 楼层 .mes fixed + z-index 99999 撑满视口
 *   2) 浏览器原生全屏 — parentDoc.documentElement.requestFullscreen()
 * - 再次点击：退出全屏，恢复原状
 * - 悬浮球 z-index 远高于全屏楼层，始终浮在最上层
 */

// ── 父页面引用 ──
const parentDoc = window.parent.document;
const parentWin = window.parent;
const parent$ = window.parent.$;

// ── 常量 ──
const BALL_ID = 'tavern-float-fullscreen-ball';
const HIDE_STYLE_ID = 'tavern-float-fs-hide-style';
const PROTECT_SCRIPT_ID = 'tavern-float-fs-protect';
const BALL_SIZE = 48;
const EDGE_MARGIN = 16;
const STORAGE_KEY = 'tavern-float-ball-pos';
// 悬浮球 z-index 必须高于全屏楼层的 99999
const BALL_Z_INDEX = 2147483647;

// ── 状态 ──
let isFullscreen = false;
let lockedFloorId: number | null = null;
let hideObserver: MutationObserver | null = null;
// 保存全屏前楼层的原始 inline style，退出时恢复
let savedMesStyle: string | null = null;
let savedIframeStyle: string | null = null;

// ═══════════════════════════════════════════
// 悬浮球创建
// ═══════════════════════════════════════════

function createBall(): HTMLElement {
  const ball = parentDoc.createElement('div');
  ball.id = BALL_ID;
  ball.style.cssText = `
    position: fixed;
    bottom: ${EDGE_MARGIN}px;
    right: ${EDGE_MARGIN}px;
    width: ${BALL_SIZE}px;
    height: ${BALL_SIZE}px;
    border-radius: 50%;
    background: rgba(20, 20, 20, 0.85);
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: grab;
    z-index: ${BALL_Z_INDEX};
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
    user-select: none;
    -webkit-user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, border-color 0.2s ease;
    touch-action: none;
    pointer-events: auto;
  `;
  ball.innerHTML = getFullscreenIconSvg(false);
  return ball;
}

function getFullscreenIconSvg(isFs: boolean): string {
  return isFs
    ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
        <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
        <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
        <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
        <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
      </svg>`
    : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
        <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
        <path d="M16 3h3a2 2 0 0 1 2 2v3"/>
        <path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
        <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
      </svg>`;
}

// ═══════════════════════════════════════════
// 拖拽逻辑（所有事件都在父页面监听）
// ═══════════════════════════════════════════

function setupDrag(ball: HTMLElement) {
  let dragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  // 从 localStorage 恢复位置
  try {
    const saved = parentWin.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const pos = JSON.parse(saved);
      ball.style.left = pos.left + 'px';
      ball.style.top = pos.top + 'px';
      ball.style.right = 'auto';
      ball.style.bottom = 'auto';
    }
  } catch {
    // 用默认位置
  }

  function savePosition(left: number, top: number) {
    try {
      parentWin.localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }));
    } catch {
      // 忽略存储错误
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;

    startLeft = parseFloat(parentWin.getComputedStyle(ball).left) || 0;
    startTop = parseFloat(parentWin.getComputedStyle(ball).top) || 0;

    ball.style.cursor = 'grabbing';
    ball.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    ball.style.transform = 'scale(0.95)';
    e.preventDefault();
    e.stopPropagation();
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved = true;

    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    const maxLeft = parentWin.innerWidth - BALL_SIZE - EDGE_MARGIN;
    const maxTop = parentWin.innerHeight - BALL_SIZE - EDGE_MARGIN;
    newLeft = Math.max(EDGE_MARGIN, Math.min(maxLeft, newLeft));
    newTop = Math.max(EDGE_MARGIN, Math.min(maxTop, newTop));

    ball.style.left = newLeft + 'px';
    ball.style.top = newTop + 'px';
  }

  function onPointerUp() {
    if (!dragging) return;
    ball.style.cursor = 'grab';
    ball.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    ball.style.transform = '';

    if (hasMoved) {
      let left = parseFloat(ball.style.left) || 0;
      let top = parseFloat(ball.style.top) || 0;
      const midX = parentWin.innerWidth / 2;
      left = left + BALL_SIZE / 2 < midX ? EDGE_MARGIN : parentWin.innerWidth - BALL_SIZE - EDGE_MARGIN;
      ball.style.left = left + 'px';
      savePosition(left, top);
    } else {
      toggleFullscreen();
    }

    dragging = false;
  }

  ball.addEventListener('pointerdown', onPointerDown);
  parentWin.addEventListener('pointermove', onPointerMove);
  parentWin.addEventListener('pointerup', onPointerUp);
  parentWin.addEventListener('pointercancel', onPointerUp);
}

// ═══════════════════════════════════════════
// 全屏 / 退出全屏
// ═══════════════════════════════════════════

/**
 * 找到最新含前端界面的楼层元素。
 *
 * 前端 iframe 的 name 属性格式为 `TH-message--楼层号--该楼层第几个界面`，
 * 通过 name 属性前缀匹配可以精确找到前端 iframe（排除脚本 iframe 等）。
 */
function findLatestIframeFloor(): HTMLElement | null {
  if (!parent$) return null;

  // 方法1：通过前端 iframe 的 name 属性匹配
  const $frontIframes = parent$('#chat iframe[name^="TH-message--"]');
  if ($frontIframes.length > 0) {
    // 取最后一个
    const $mes = $frontIframes.last().closest('.mes');
    if ($mes.length > 0) return $mes[0] as HTMLElement;
  }

  // 方法2：兜底——找所有 .mes 下的 iframe
  const $allIframes = parent$('#chat .mes iframe');
  if ($allIframes.length === 0) return null;

  for (let i = $allIframes.length - 1; i >= 0; i--) {
    const $mes = $allIframes.eq(i).closest('.mes');
    if ($mes.length > 0) return $mes[0] as HTMLElement;
  }
  return null;
}

/** 获取楼层的 mesid */
function getFloorId(mesEl: HTMLElement): number | null {
  const mesid = mesEl.getAttribute('mesid');
  if (!mesid) return null;
  const id = parseInt(mesid, 10);
  return isNaN(id) ? null : id;
}

/** 更新 CSS 隐藏样式 */
function updateHideStyle(keepFloorId: number | null) {
  const existing = parentDoc.getElementById(HIDE_STYLE_ID);
  if (existing) existing.remove();
  if (keepFloorId === null) return;

  const style = parentDoc.createElement('style');
  style.id = HIDE_STYLE_ID;
  style.textContent = `.mes:not([mesid="${keepFloorId}"]) { display: none !important; }`;
  parentDoc.head.appendChild(style);
}

/** 注入保护脚本：拦截 iframe 删除 */
function injectProtection(floorId: number) {
  removeProtection();

  const script = parentDoc.createElement('script');
  script.id = PROTECT_SCRIPT_ID;
  script.textContent = `
    (function() {
      if (window.__tavernFloatFsCleanup) {
        try { window.__tavernFloatFsCleanup(); } catch (e) {}
      }

      var LOCKED_FLOOR_ID = ${floorId};

      var _origIframeRemove = HTMLIFrameElement.prototype.remove;
      HTMLIFrameElement.prototype.remove = function() {
        var mesEl = this.closest('[mesid]');
        if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
          console.warn('[悬浮全屏球] 拦截 remove()，保护楼层 #' + LOCKED_FLOOR_ID);
          return;
        }
        return _origIframeRemove.call(this);
      };

      var _origRemoveChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function(child) {
        if (child instanceof HTMLIFrameElement) {
          var mesEl = child.closest('[mesid]');
          if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
            console.warn('[悬浮全屏球] 拦截 removeChild()，保护楼层 #' + LOCKED_FLOOR_ID);
            return child;
          }
        }
        if (child && child.querySelectorAll) {
          var protectedIframes = child.querySelectorAll('.mes[mesid="' + LOCKED_FLOOR_ID + '"] iframe');
          if (protectedIframes.length > 0) {
            console.warn('[悬浮全屏球] 拦截 removeChild()（嵌套），保护楼层 #' + LOCKED_FLOOR_ID);
            return child;
          }
        }
        return _origRemoveChild.call(this, child);
      };

      if (window.$ && window.$.fn) {
        var _origJqRemove = window.$.fn.remove;
        window.$.fn.remove = function() {
          var self = this;
          for (var i = 0; i < self.length; i++) {
            var el = self[i];
            if (el instanceof HTMLIFrameElement) {
              var mesEl = el.closest('[mesid]');
              if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
                console.warn('[悬浮全屏球] 拦截 jQuery.remove()，保护楼层 #' + LOCKED_FLOOR_ID);
                self.splice(i, 1);
                i--;
              }
            }
          }
          if (self.length > 0) {
            return _origJqRemove.call(self);
          }
          return self;
        };
      }

      window.__tavernFloatFsCleanup = function() {
        HTMLIFrameElement.prototype.remove = _origIframeRemove;
        Node.prototype.removeChild = _origRemoveChild;
        if (window.$ && window.$.fn && _origJqRemove) {
          window.$.fn.remove = _origJqRemove;
        }
        delete window.__tavernFloatFsCleanup;
        console.info('[悬浮全屏球] 保护已解除');
      };

      console.info('[悬浮全屏球] 已激活对楼层 #' + LOCKED_FLOOR_ID + ' 的 iframe 保护');
    })();
  `;
  parentDoc.head.appendChild(script);
}

/** 移除保护脚本 */
function removeProtection() {
  if ((parentWin as any).__tavernFloatFsCleanup) {
    try {
      (parentWin as any).__tavernFloatFsCleanup();
    } catch (e) {
      console.warn('[悬浮全屏球] 清理保护时出错', e);
    }
  }
  parentDoc.getElementById(PROTECT_SCRIPT_ID)?.remove();
}

/**
 * 进入全屏 — 与幻璃镜/租借男友全屏按钮效果完全一致：
 * 1) CSS 伪全屏 — 楼层 .mes → position: fixed; z-index: 99999 撑满视口
 * 2) 浏览器原生全屏 — parentDoc.documentElement.requestFullscreen()
 */
async function enterFullscreen() {
  const mesEl = findLatestIframeFloor();
  if (!mesEl) {
    toastr.warning('未找到含前端界面的楼层', '无法全屏');
    console.warn('[悬浮全屏球] 未找到含前端界面的 iframe 楼层');
    return;
  }

  const floorId = getFloorId(mesEl);
  if (floorId === null) {
    toastr.warning('无法获取楼层 ID', '无法全屏');
    console.warn('[悬浮全屏球] 无法获取 mesid');
    return;
  }

  lockedFloorId = floorId;

  // 隐藏其他楼层
  updateHideStyle(floorId);

  // 保存原始 style，退出时恢复
  savedMesStyle = mesEl.getAttribute('style') || '';
  const iframe = mesEl.querySelector('iframe');
  if (iframe) {
    savedIframeStyle = iframe.getAttribute('style') || '';
  }

  // 让本楼层 fixed 撑满视口（z-index 99999，低于悬浮球）
  if (parent$) {
    const $mes = parent$(mesEl);
    $mes.css({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      'z-index': '99999',
      'max-width': 'none',
      'max-height': 'none',
      margin: '0',
      padding: '0',
    });

    // 让 iframe 自身也充满楼层
    $mes.find('iframe').css({
      width: '100%',
      height: '100%',
    });
  }

  // 注入保护脚本
  injectProtection(floorId);

  // 浏览器原生全屏（与幻璃镜/租借男友全屏按钮一致）
  // 调用父页面 documentElement.requestFullscreen() 让整个酒馆页面进入浏览器全屏模式
  // 悬浮球挂在父页面 body 上，在浏览器全屏中依然可见且可交互
  try {
    if (parentDoc.documentElement.requestFullscreen) {
      await parentDoc.documentElement.requestFullscreen();
    }
  } catch (e) {
    console.warn('[悬浮全屏球] 浏览器原生全屏失败，仅使用伪全屏', e);
  }

  // 监听新楼层并自动隐藏
  const chatContainer = parentDoc.getElementById('chat') || parentDoc.body;
  hideObserver = new MutationObserver((mutations) => {
    if (lockedFloorId === null) return;
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (
          node instanceof HTMLElement &&
          node.matches(`.mes:not([mesid="${lockedFloorId}"])`)
        ) {
          node.style.display = 'none';
        }
      }
    }
  });
  hideObserver.observe(chatContainer, { childList: true, subtree: true });

  isFullscreen = true;
  updateBallIcon(true);
  toastr.success(`已全屏楼层 #${floorId}`, '全屏');
  console.info(`[悬浮全屏球] === 楼层 #${floorId} 已全屏 ===`);
}

/** 退出全屏 */
async function exitFullscreen() {
  // 先退出浏览器原生全屏
  try {
    if (parentDoc.fullscreenElement && parentDoc.exitFullscreen) {
      await parentDoc.exitFullscreen();
    }
  } catch (e) {
    console.warn('[悬浮全屏球] 退出浏览器原生全屏失败', e);
  }

  // 恢复 DOM
  if (lockedFloorId !== null && parent$) {
    const $mes = parent$(`.mes[mesid="${lockedFloorId}"]`);
    // 恢复原始 inline style
    if (savedMesStyle !== null) {
      if (savedMesStyle === '') {
        $mes.removeAttr('style');
      } else {
        $mes.attr('style', savedMesStyle);
      }
    } else {
      $mes.css({
        position: '',
        top: '',
        left: '',
        width: '',
        height: '',
        'z-index': '',
        'max-width': '',
        'max-height': '',
        margin: '',
        padding: '',
      });
    }

    const $iframe = $mes.find('iframe');
    if (savedIframeStyle !== null) {
      if (savedIframeStyle === '') {
        $iframe.removeAttr('style');
      } else {
        $iframe.attr('style', savedIframeStyle);
      }
    } else {
      $iframe.css({ width: '', height: '' });
    }
  }

  savedMesStyle = null;
  savedIframeStyle = null;

  removeProtection();
  updateHideStyle(null);

  hideObserver?.disconnect();
  hideObserver = null;

  const wasId = lockedFloorId;
  lockedFloorId = null;
  isFullscreen = false;
  updateBallIcon(false);

  if (wasId !== null) {
    console.info(`[悬浮全屏球] === 楼层 #${wasId} 已退出全屏 ===`);
  }
}

/** 切换全屏 */
async function toggleFullscreen() {
  if (isFullscreen) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
}

/** 更新悬浮球图标 */
function updateBallIcon(fullscreen: boolean) {
  const ball = parentDoc.getElementById(BALL_ID);
  if (!ball) return;
  ball.innerHTML = getFullscreenIconSvg(fullscreen);
}

// ═══════════════════════════════════════════
// 初始化
// ═══════════════════════════════════════════

// 监听父页面浏览器全屏状态变化（用户按 Esc 退出等）
function onFullscreenChange() {
  // 如果浏览器退出了全屏但脚本仍认为全屏中，则同步退出
  if (isFullscreen && !parentDoc.fullscreenElement) {
    console.info('[悬浮全屏球] 检测到浏览器全屏已退出（Esc），同步退出');
    exitFullscreen();
  }
}

function init() {
  parentDoc.getElementById(BALL_ID)?.remove();

  const ball = createBall();
  // 挂载到 body 下
  parentDoc.body.appendChild(ball);

  setupDrag(ball);

  // 监听父页面全屏状态变化
  parentDoc.addEventListener('fullscreenchange', onFullscreenChange);

  console.info('[悬浮全屏球] 脚本已启动');
}

// 加载时执行
$(errorCatched(init));

// 卸载时清理
$(window).on('pagehide', () => {
  if (isFullscreen) exitFullscreen();
  parentDoc.getElementById(BALL_ID)?.remove();
  console.info('[悬浮全屏球] 脚本已卸载');
});
