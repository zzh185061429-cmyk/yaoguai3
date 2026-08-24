/**
 * 幻璃镜-锁定前端 — 独立脚本
 *
 * 策略：向酒馆父页面注入 <script>，在父页面的 JS 引擎里直接
 * 拦截 HTMLIFrameElement.prototype.remove 和 Node.prototype.removeChild。
 * 碰到锁定楼层的 iframe 时跳过删除，从源头阻止酒馆销毁它。
 */

$(() => {
  const STYLE_ID = 'tavern-lock-floor-style';
  const PROTECT_SCRIPT_ID = 'tavern-lock-protect-script';
  const parentDoc = window.parent.document;
  const parentWin = window.parent;

  let lockedFloorId: number | null = null;
  let hideObserver: MutationObserver | null = null;

  // ═══════════════════════════════════════════
  // CSS 隐藏其他楼层（视觉清爽）
  // ═══════════════════════════════════════════

  function updateHideStyle(keepFloorId: number | null) {
    parentDoc.getElementById(STYLE_ID)?.remove();
    if (keepFloorId === null) return;

    const style = parentDoc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `.mes:not([mesid="${keepFloorId}"]) { display: none !important; }`;
    parentDoc.head.appendChild(style);
  }

  // ═══════════════════════════════════════════
  // 核心：向父页面注入脚本，拦截 iframe 删除
  // ═══════════════════════════════════════════

  function injectProtection(floorId: number) {
    // 先清除旧注入
    removeProtection();

    const script = parentDoc.createElement('script');
    script.id = PROTECT_SCRIPT_ID;
    script.textContent = `
      (function() {
        if (window.__tavernLockCleanup) {
          window.__tavernLockCleanup();
        }

        var LOCKED_FLOOR_ID = ${floorId};

        // ── 拦截 HTMLIFrameElement.prototype.remove ──
        var _origIframeRemove = HTMLIFrameElement.prototype.remove;
        HTMLIFrameElement.prototype.remove = function() {
          var mesEl = this.closest('[mesid]');
          if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
            console.warn('[锁定前端·父页面] 拦截 remove()，保护楼层 #' + LOCKED_FLOOR_ID);
            return;
          }
          return _origIframeRemove.call(this);
        };

        // ── 拦截 Node.prototype.removeChild ──
        var _origRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function(child) {
          if (child instanceof HTMLIFrameElement) {
            var mesEl = child.closest('[mesid]');
            if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
              console.warn('[锁定前端·父页面] 拦截 removeChild()，保护楼层 #' + LOCKED_FLOOR_ID);
              return child;
            }
          }
          // 也检查被移除的节点内部是否包含要保护的 iframe
          if (child && child.querySelectorAll) {
            var protectedIframes = child.querySelectorAll('.mes[mesid="' + LOCKED_FLOOR_ID + '"] iframe');
            if (protectedIframes.length > 0) {
              console.warn('[锁定前端·父页面] 拦截 removeChild()（嵌套），保护楼层 #' + LOCKED_FLOOR_ID);
              return child;
            }
          }
          return _origRemoveChild.call(this, child);
        };

        // ── 拦截 jQuery.fn.remove（酒馆大量使用 jQuery） ──
        if (window.$ && window.$.fn) {
          var _origJqRemove = window.$.fn.remove;
          window.$.fn.remove = function() {
            var self = this;
            for (var i = 0; i < self.length; i++) {
              var el = self[i];
              if (el instanceof HTMLIFrameElement) {
                var mesEl = el.closest('[mesid]');
                if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
                  console.warn('[锁定前端·父页面] 拦截 jQuery.remove()，保护楼层 #' + LOCKED_FLOOR_ID);
                  // 把受保护的 iframe 从 jQuery 集合里排除
                  self.splice(i, 1);
                  i--;
                }
              }
            }
            // 对剩余的调用原始 remove
            if (self.length > 0) {
              return _origJqRemove.call(self);
            }
            return self;
          };
        }

        // ── 存储清理函数 ──
        window.__tavernLockCleanup = function() {
          HTMLIFrameElement.prototype.remove = _origIframeRemove;
          Node.prototype.removeChild = _origRemoveChild;
          if (window.$ && window.$.fn && _origJqRemove) {
            window.$.fn.remove = _origJqRemove;
          }
          delete window.__tavernLockCleanup;
          console.info('[锁定前端·父页面] 保护已解除');
        };

        console.info('[锁定前端·父页面] 已激活对楼层 #' + LOCKED_FLOOR_ID + ' 的 iframe 保护');
      })();
    `;

    parentDoc.head.appendChild(script);
    console.info(`[幻璃镜·锁定前端] 已向父页面注入保护脚本，锁定楼层 #${floorId}`);
  }

  function removeProtection() {
    // 调用父页面中的清理函数
    if (parentWin.__tavernLockCleanup) {
      try {
        parentWin.__tavernLockCleanup();
      } catch (e) {
        console.warn('[幻璃镜·锁定前端] 清理父页面保护时出错', e);
      }
    }
    parentDoc.getElementById(PROTECT_SCRIPT_ID)?.remove();
  }

  // ═══════════════════════════════════════════
  // 综合锁定 / 解锁
  // ═══════════════════════════════════════════

  function lockFloor(floorId: number) {
    if (lockedFloorId === floorId) return;
    if (lockedFloorId !== null) unlockFloor();

    lockedFloorId = floorId;
    updateHideStyle(floorId);       // CSS 隐藏
    injectProtection(floorId);      // 注入拦截脚本

    console.info(`[幻璃镜·锁定前端] === 楼层 #${floorId} 已锁定 ===`);
  }

  function unlockFloor() {
    const wasLocked = lockedFloorId;
    removeProtection();             // 清除注入脚本
    updateHideStyle(null);          // 清除 CSS
    lockedFloorId = null;

    if (wasLocked !== null) {
      console.info(`[幻璃镜·锁定前端] === 楼层 #${wasLocked} 已解锁 ===`);
    }
  }

  // ═══════════════════════════════════════════
  // 全屏事件监听
  // ═══════════════════════════════════════════

  function getFloorIdFromFullscreenElement(el: Element): number | null {
    const mesEl = el.closest('[mesid]');
    if (!mesEl) return null;
    const id = parseInt(mesEl.getAttribute('mesid')!, 10);
    return isNaN(id) ? null : id;
  }

  $(parentDoc).on('fullscreenchange', () => {
    const fsEl = parentDoc.fullscreenElement;
    if (!fsEl) { unlockFloor(); return; }

    const floorId = getFloorIdFromFullscreenElement(fsEl);
    if (floorId !== null) lockFloor(floorId);
  });

  // 脚本后加载时，如果已经全屏了也处理
  const currentFs = parentDoc.fullscreenElement;
  if (currentFs) {
    const floorId = getFloorIdFromFullscreenElement(currentFs);
    if (floorId !== null) lockFloor(floorId);
  }

  // ═══════════════════════════════════════════
  // 新楼层自动隐藏
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // 清理
  // ═══════════════════════════════════════════

  $(window).on('pagehide', () => {
    unlockFloor();
    hideObserver?.disconnect();
    console.info('[幻璃镜·锁定前端] 脚本已卸载');
  });

  console.info('[幻璃镜·锁定前端] 脚本已启动（CSS隐藏 + 父页面原型拦截）');
});
