/* WorldStage mobile-first recovery runtime — Phase 1 */

const root = document.documentElement;
let previousOverflow = '';

function setViewportUnit() {
  const visibleHeight = window.visualViewport?.height || window.innerHeight;
  root.style.setProperty('--app-vh', `${visibleHeight * 0.01}px`);
}

function syncMenuState() {
  const menu = document.querySelector('.mobile-nav');
  const isOpen = Boolean(menu);
  document.body.classList.toggle('menu-open', isOpen);

  if (isOpen) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = previousOverflow;
  }
}

function assertNoUnexpectedDocumentOverflow() {
  if (window.innerWidth > 900) return;
  const width = document.documentElement.getBoundingClientRect().width;
  const scrollWidth = document.documentElement.scrollWidth;
  if (scrollWidth > Math.ceil(width) + 1) {
    const offenders = [...document.querySelectorAll('body *')]
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (style.position === 'fixed') return false;
        return rect.right > width + 1 || rect.left < -1;
      })
      .slice(0, 8)
      .map((node) => `${node.tagName.toLowerCase()}.${[...node.classList].join('.')}`);

    console.error('[WorldStage mobile contract] Unexpected horizontal overflow', {
      viewportWidth: width,
      scrollWidth,
      offenders,
    });
  }
}

function syncAfterRender() {
  syncMenuState();
  requestAnimationFrame(assertNoUnexpectedDocumentOverflow);
}

setViewportUnit();
window.addEventListener('resize', () => {
  setViewportUnit();
  requestAnimationFrame(assertNoUnexpectedDocumentOverflow);
}, { passive: true });

window.visualViewport?.addEventListener('resize', setViewportUnit, { passive: true });
window.visualViewport?.addEventListener('scroll', setViewportUnit, { passive: true });

new MutationObserver(syncAfterRender).observe(document.getElementById('app'), {
  childList: true,
  subtree: true,
});

window.addEventListener('hashchange', syncAfterRender);
window.addEventListener('load', syncAfterRender);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const menu = document.querySelector('.mobile-nav');
  const toggle = document.querySelector('[data-menu]');
  if (!menu || !toggle) return;
  toggle.click();
  toggle.focus();
});

syncAfterRender();
