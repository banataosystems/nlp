/* Phase 4 — Cherry OS review surfaces.
   Everything remains DEMO DATA until authenticated, source-linked WorldStage systems are connected. */

let cockpitReturnFocus = null;

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

new MutationObserver(() => queueMicrotask(decorateCockpitActions)).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => { closeCockpitDrawer({ restoreFocus: false }); queueMicrotask(decorateCockpitActions); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('.cockpit-overlay')) {
    event.preventDefault(); closeCockpitDrawer(); return;
  }
  trapCockpitFocus(event);
});
decorateCockpitActions();
