/* Phase 2 progressive enhancement — no canonical business mutation. */

const solutionPaths = [
  ['01', 'Team Building', 'When the room needs alignment, trust and stronger ways of working together.'],
  ['02', 'Culture Development', 'When behavior, leadership signals and the lived culture need to move together.'],
  ['03', 'Learning & Development', 'When capability must change in a way people can actually use back at work.'],
  ['04', 'Keynotes & Motivation', 'When an audience needs a focused intervention designed for this specific room.'],
  ['05', 'Fire University', 'When learning needs a longer journey, cohort structure and sustained development.'],
];

function arrowIcon() {
  return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
}

function closeIcon() {
  return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></span>';
}

function enhanceHome() {
  if (!document.querySelector('.stage-home') || document.querySelector('.solution-paths')) return;
  const finale = document.querySelector('.finale-stage');
  if (!finale) return;

  const section = document.createElement('section');
  section.className = 'solution-paths';
  section.innerHTML = `
    <div class="solution-paths__intro">
      <div class="chapter-index chapter-index--dark">06 / WHERE THE CONVERSATION CAN GO</div>
      <h2>The solution comes after the reality is understood.</h2>
      <p>These are WorldStage's public solution paths—not a diagnosis of what any organization needs. Discovery comes first.</p>
    </div>
    <div class="solution-paths__list">
      ${solutionPaths.map(([index, title, description]) => `
        <button class="solution-path" data-solution-path="${title}">
          <span class="solution-path__index">${index}</span>
          <span><strong>${title}</strong><small>${description}</small></span>
          ${arrowIcon()}
        </button>
      `).join('')}
    </div>`;
  finale.before(section);

  section.querySelectorAll('[data-solution-path]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.hash = '/discovery';
    });
  });
}

function closeBrief() {
  document.body.classList.remove('brief-open');
  const trigger = document.querySelector('[data-brief-toggle]');
  trigger?.setAttribute('aria-expanded', 'false');
  trigger?.focus({ preventScroll: true });
}

function enhanceDiscovery() {
  const shell = document.querySelector('.discovery-shell');
  const pane = shell?.querySelector('.conversation-pane');
  const brief = shell?.querySelector('.brief-pane');
  if (!shell || !pane || !brief) {
    document.body.classList.remove('brief-open');
    return;
  }

  if (!pane.querySelector('[data-brief-toggle]')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'brief-toggle';
    toggle.dataset.briefToggle = '';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'worldstage-live-brief');
    toggle.textContent = 'What we heard';
    pane.append(toggle);

    toggle.addEventListener('click', () => {
      const open = !document.body.classList.contains('brief-open');
      document.body.classList.toggle('brief-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) brief.querySelector('[data-brief-close]')?.focus({ preventScroll: true });
    });
  }

  brief.id = 'worldstage-live-brief';
  brief.setAttribute('role', 'dialog');
  brief.setAttribute('aria-modal', 'true');
  brief.setAttribute('aria-label', 'Live transformation brief');

  if (!brief.querySelector('[data-brief-close]')) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'brief-sheet-close';
    close.dataset.briefClose = '';
    close.setAttribute('aria-label', 'Close transformation brief');
    close.innerHTML = closeIcon();
    brief.prepend(close);
    close.addEventListener('click', closeBrief);
  }
}

function enhanceMobileMenu() {
  const menu = document.querySelector('.mobile-nav');
  if (!menu || menu.dataset.enhanced === 'true') return;
  menu.dataset.enhanced = 'true';
  menu.setAttribute('aria-modal', 'true');

  const focusable = [...menu.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')];
  focusable[0]?.focus({ preventScroll: true });
}

function trapModalFocus(event) {
  if (event.key !== 'Tab') return;
  const modal = document.body.classList.contains('brief-open')
    ? document.querySelector('.brief-pane')
    : document.querySelector('.mobile-nav');
  if (!modal) return;

  const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((node) => node.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function enhance() {
  enhanceHome();
  enhanceDiscovery();
  enhanceMobileMenu();
}

new MutationObserver(() => queueMicrotask(enhance)).observe(document.getElementById('app'), {
  childList: true,
  subtree: true,
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('brief-open')) {
    event.preventDefault();
    closeBrief();
    return;
  }
  trapModalFocus(event);
});

window.addEventListener('hashchange', () => {
  document.body.classList.remove('brief-open');
  queueMicrotask(enhance);
});

enhance();
