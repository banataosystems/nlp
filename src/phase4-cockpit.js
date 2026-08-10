/* Phase 4 — Cherry OS review surfaces.
   Everything remains DEMO DATA until authenticated, source-linked WorldStage systems are connected. */

let cockpitReturnFocus = null;

const CHERRY_DAILY_DEMO_KEY = 'worldstage.cherry.daily.demo.v1';
const cherryDailyAllowedStates = new Set(['needs-cherry', 'prepared', 'parked']);

const sourceItems = [
  ['Relationship timeline', 'DEMO DATA', 'Future production evidence should preserve the source system, record owner, timestamp, confidence, and access restriction.'],
  ['Program / engagement record', 'DEMO DATA', 'A real record must be tied to an approved engagement and must not be reconstructed from memory or generated text.'],
  ['Approved human note', 'NOT CONNECTED', 'Human judgment and sensitive context require explicit provenance and role-based access before being surfaced to Cherry.'],
];

const roomItems = [
  ['Who is in the room?', 'The production briefing should identify only the people and roles Cherry genuinely needs for the engagement.'],
  ['Why now?', 'The briefing should connect the engagement to an approved business objective, not an AI-invented narrative.'],
  ['What matters?', 'Surface the client-approved desired outcome, current transformation context, and any unresolved question.'],
  ['What should not be forgotten?', 'Show verified commitments, sensitivities, accessibility or delivery constraints only when the viewer is authorized to see them.'],
  ['What should Cherry ask?', 'Suggestions may be generated, but they must be visibly separated from verified facts and remain optional.'],
];

function phase4CloseIcon() {
  return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></span>';
}

function readCherryDailyDemoState() {
  const fallback = { '01': 'needs-cherry', '02': 'needs-cherry', '03': 'needs-cherry' };
  try {
    const parsed = JSON.parse(localStorage.getItem(CHERRY_DAILY_DEMO_KEY) || '{}');
    return Object.fromEntries(Object.entries(fallback).map(([id, initial]) => {
      const candidate = parsed?.[id];
      return [id, cherryDailyAllowedStates.has(candidate) ? candidate : initial];
    }));
  } catch {
    return fallback;
  }
}

function writeCherryDailyDemoState(state) {
  try {
    localStorage.setItem(CHERRY_DAILY_DEMO_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function cherryDailyLabel(state) {
  if (state === 'prepared') return 'Prepared';
  if (state === 'parked') return 'Parked';
  return 'Needs Cherry';
}

function cherryDailySummaryMarkup() {
  return `<section class="cherry-daily" data-cherry-daily aria-labelledby="cherry-daily-title">
    <div class="cherry-daily__top">
      <div><span>CHERRY DAILY · LOCAL DEMO</span><h2 id="cherry-daily-title">Make the next decision obvious.</h2></div>
      <button type="button" data-cherry-daily-reset>Reset demo states</button>
    </div>
    <p class="cherry-daily__lede">This is the owner workflow pattern: see only what needs judgment, prepare what is ready, and park what can wait. These states stay in this browser only. Nothing is sent to a client, CRM, email, calendar, or production system.</p>
    <div class="cherry-daily__metrics" aria-label="Demo judgment state summary">
      <article><strong data-cherry-daily-count="needs-cherry">3</strong><span>Need Cherry</span></article>
      <article><strong data-cherry-daily-count="prepared">0</strong><span>Prepared</span></article>
      <article><strong data-cherry-daily-count="parked">0</strong><span>Parked</span></article>
    </div>
    <div class="cherry-daily__notice" data-cherry-daily-status aria-live="polite">Demo state is stored only on this device.</div>
  </section>`;
}

function updateCherryDailyUI(message = '') {
  const state = readCherryDailyDemoState();
  const counts = { 'needs-cherry': 0, prepared: 0, parked: 0 };
  Object.values(state).forEach((value) => { counts[value] += 1; });

  Object.entries(counts).forEach(([name, count]) => {
    const node = document.querySelector(`[data-cherry-daily-count="${name}"]`);
    const nextText = String(count);
    if (node && node.textContent !== nextText) node.textContent = nextText;
  });

  document.querySelectorAll('[data-cherry-decision-state]').forEach((node) => {
    const id = node.dataset.cherryDecisionState;
    const value = state[id] || 'needs-cherry';
    const label = node.querySelector('[data-cherry-decision-label]');
    const nextLabel = cherryDailyLabel(value);
    if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
    node.querySelectorAll('[data-cherry-daily-set]').forEach((button) => {
      const isCurrent = button.dataset.cherryDailySet === value;
      button.classList.toggle('is-current', isCurrent);
      button.setAttribute('aria-pressed', String(isCurrent));
    });
  });

  const status = document.querySelector('[data-cherry-daily-status]');
  if (status && message && status.textContent !== message) status.textContent = message;
}

function enhanceCherryDaily() {
  const shell = document.querySelector('.cockpit-shell');
  if (!shell) return;

  if (!shell.querySelector('[data-cherry-daily]')) {
    const header = shell.querySelector('.cockpit-header');
    header?.insertAdjacentHTML('afterend', cherryDailySummaryMarkup());
    shell.querySelector('[data-cherry-daily-reset]')?.addEventListener('click', () => {
      try { localStorage.removeItem(CHERRY_DAILY_DEMO_KEY); } catch { /* local demo remains best-effort */ }
      updateCherryDailyUI('Demo states reset. No external system was changed.');
    });
  }

  shell.querySelectorAll('.judgment-card').forEach((card, index) => {
    const id = String(index + 1).padStart(2, '0');
    if (card.querySelector('[data-cherry-decision-state]')) return;
    const actions = card.querySelector('.judgment-card__actions');
    if (!actions) return;

    const controls = document.createElement('div');
    controls.className = 'cherry-decision-state';
    controls.dataset.cherryDecisionState = id;
    controls.innerHTML = `<div class="cherry-decision-state__meta"><span>DEMO DECISION STATE</span><strong data-cherry-decision-label>Needs Cherry</strong></div>
      <div class="cherry-decision-state__actions" role="group" aria-label="Demo decision state for item ${id}">
        <button type="button" data-cherry-daily-set="needs-cherry" aria-pressed="false">Needs me</button>
        <button type="button" data-cherry-daily-set="prepared" aria-pressed="false">Prepared</button>
        <button type="button" data-cherry-daily-set="parked" aria-pressed="false">Park</button>
      </div>`;
    actions.before(controls);

    controls.querySelectorAll('[data-cherry-daily-set]').forEach((button) => {
      button.addEventListener('click', () => {
        const state = readCherryDailyDemoState();
        state[id] = button.dataset.cherryDailySet;
        const saved = writeCherryDailyDemoState(state);
        updateCherryDailyUI(saved
          ? `${id} marked ${cherryDailyLabel(state[id]).toLowerCase()} on this device only.`
          : `${id} changed for this view, but local browser storage was unavailable.`);
      });
    });
  });

  updateCherryDailyUI();
}

function getActiveCardSnapshot() {
  const card = document.querySelector('.judgment-card.is-active');
  if (!card) return null;
  return {
    number: card.querySelector('.judgment-card__number')?.textContent?.trim() || '—',
    title: card.querySelector('h3')?.textContent?.trim() || 'Judgment item',
    client: card.querySelector('.judgment-card__client')?.textContent?.trim() || 'Demo context',
    known: card.querySelector('.judgment-card__grid > div:first-child p')?.textContent?.trim() || '',
    suggestion: card.querySelector('.judgment-card__grid > div:nth-child(2) p')?.textContent?.trim() || '',
  };
}

function closeCockpitDrawer({ restoreFocus = true } = {}) {
  document.querySelector('.cockpit-overlay')?.remove();
  document.body.classList.remove('cockpit-modal-open');
  if (restoreFocus && cockpitReturnFocus instanceof HTMLElement) cockpitReturnFocus.focus({ preventScroll: true });
  cockpitReturnFocus = null;
}

function sourceDrawerMarkup(snapshot) {
  return `
    <div class="cockpit-drawer__eyebrow">SOURCE MAP · DEMO ONLY</div>
    <h2>Where should this intelligence come from?</h2>
    <p class="cockpit-drawer__lede">This prototype does not have access to WorldStage CRM, calendar, email, Pandora, or private engagement records. The drawer demonstrates the provenance standard the real Cherry OS must enforce before presenting a fact.</p>
    <div class="cockpit-proof-list">
      ${sourceItems.map(([title, status, body]) => `
        <article class="cockpit-proof-item">
          <div class="cockpit-proof-item__meta"><span>${status}</span><span>ITEM ${snapshot.number}</span></div>
          <h3>${title}</h3><p>${body}</p>
        </article>`).join('')}
    </div>
    <div class="cockpit-drawer__notice"><strong>Current status:</strong> no private client source is connected. The card underneath is deliberately marked DEMO DATA and must never be mistaken for a verified WorldStage record.</div>`;
}

function roomDrawerMarkup(snapshot) {
  return `
    <div class="cockpit-drawer__eyebrow">THE ROOM · 60-SECOND BRIEFING PATTERN</div>
    <h2>${snapshot.title}</h2>
    <p class="cockpit-drawer__lede">${snapshot.client}. This is a structural demonstration of the briefing Cherry should receive before an engagement. It contains no verified private client facts.</p>
    <div class="room-brief-header">
      <div class="room-brief-stat"><span>PURPOSE</span><strong>Decision-ready context</strong></div>
      <div class="room-brief-stat"><span>DATA STATE</span><strong>Demo only</strong></div>
      <div class="room-brief-stat"><span>ACTION STATE</span><strong>Human review</strong></div>
    </div>
    <div class="room-brief-list">
      <article class="room-brief-item"><div class="room-brief-item__meta"><span>WHAT THE CARD SAYS</span><span>DEMO DATA</span></div><h3>${snapshot.known || 'No verified fact connected.'}</h3><p>This line exists only to demonstrate placement. A production briefing must cite the source that supports it.</p></article>
      <article class="room-brief-item"><div class="room-brief-item__meta"><span>SYSTEM SUGGESTION</span><span>NOT A FACT</span></div><h3>${snapshot.suggestion || 'No suggestion available.'}</h3><p>Recommendations must remain visibly separate from source-derived facts and require Cherry or an authorized owner to act on them.</p></article>
      ${roomItems.map(([title, body]) => `<article class="room-brief-item"><div class="room-brief-item__meta"><span>BRIEFING QUESTION</span><span>REQUIRES VERIFIED SOURCE</span></div><h3>${title}</h3><p>${body}</p></article>`).join('')}
    </div>
    <div class="cockpit-drawer__notice"><strong>Production gate:</strong> authentication, authorization, auditability, and source-level privacy restrictions are required before The Room can contain real WorldStage client intelligence.</div>`;
}

function openCockpitDrawer(mode, trigger) {
  const snapshot = getActiveCardSnapshot();
  if (!snapshot) return;
  closeCockpitDrawer({ restoreFocus: false });
  cockpitReturnFocus = trigger;

  const overlay = document.createElement('div');
  overlay.className = 'cockpit-overlay';
  overlay.dataset.cockpitOverlay = mode;
  overlay.innerHTML = `<section class="cockpit-drawer" role="dialog" aria-modal="true" aria-label="${mode === 'sources' ? 'Source map' : 'The Room briefing'}">
      <button type="button" class="cockpit-drawer__close" data-cockpit-close aria-label="Close">${phase4CloseIcon()}</button>
      ${mode === 'sources' ? sourceDrawerMarkup(snapshot) : roomDrawerMarkup(snapshot)}
    </section>`;
  document.body.append(overlay);
  document.body.classList.add('cockpit-modal-open');

  overlay.addEventListener('pointerdown', (event) => {
    if (event.target === overlay) closeCockpitDrawer();
  });
  overlay.querySelector('[data-cockpit-close]')?.addEventListener('click', () => closeCockpitDrawer());
  overlay.querySelector('[data-cockpit-close]')?.focus({ preventScroll: true });
}

function decorateCockpitActions() {
  const shell = document.querySelector('.cockpit-shell');
  if (!shell) {
    closeCockpitDrawer({ restoreFocus: false });
    return;
  }

  document.querySelectorAll('.judgment-card__actions').forEach((actions) => {
    const buttons = actions.querySelectorAll('button');
    const sourceButton = buttons[0];
    const reviewButton = buttons[1];

    if (sourceButton && !sourceButton.dataset.phase4Bound) {
      sourceButton.dataset.phase4Bound = 'true';
      sourceButton.dataset.cockpitSources = '';
      sourceButton.addEventListener('click', () => openCockpitDrawer('sources', sourceButton));
    }

    if (reviewButton && !reviewButton.dataset.phase4Bound) {
      reviewButton.dataset.phase4Bound = 'true';
      reviewButton.dataset.cockpitRoom = '';
      reviewButton.addEventListener('click', () => openCockpitDrawer('room', reviewButton));
    }
  });
}

function enhanceCockpit() {
  decorateCockpitActions();
  enhanceCherryDaily();
}

function trapCockpitFocus(event) {
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('.cockpit-drawer');
  if (!dialog) return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((node) => node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}

new MutationObserver(() => queueMicrotask(enhanceCockpit)).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => { closeCockpitDrawer({ restoreFocus: false }); queueMicrotask(enhanceCockpit); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('.cockpit-overlay')) {
    event.preventDefault(); closeCockpitDrawer(); return;
  }
  trapCockpitFocus(event);
});
enhanceCockpit();
