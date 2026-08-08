/* Phase 5 — Transformation Record governance. Demo-only until authorized client records exist. */

let recordReturnFocus = null;

const evidenceStates = [
  ['Anecdotal', 'A facilitator/client comment with no formal measurement baseline.'],
  ['Observed', 'Structured observation exists, but no formal baseline/follow-up metric is established.'],
  ['Measured', 'A defined baseline and follow-up measure exist with reproducible calculation.'],
  ['Client-confirmed', 'An authorized client sponsor has reviewed the result.'],
  ['Externally verified', 'Independent evidence supports the claim.'],
  ['Publicly approved', 'The client/contract permits the claim to be used publicly.'],
];

const privacyRules = [
  ['Participant responses', 'Prefer anonymous or pseudonymous cohort-level reporting. Individual responses remain restricted unless a lawful, explicit purpose and permission allow otherwise.'],
  ['Discovery artifacts', 'FGDs, transcripts, voice notes and sensitive organizational context require role-specific access and retention controls.'],
  ['Client sponsor view', 'Sponsors should receive approved aggregate outcomes, not raw employee comments by default.'],
  ['AI access', 'AI agents should receive only the minimum authorized data for the task; sensitive participant content is excluded from generic analytics and content systems.'],
  ['Public content', 'No case study, logo, quote or outcome flows into public marketing until usage permission and evidence state are recorded.'],
];

function recordCloseIcon() {
  return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></span>';
}

function recordSummaryMarkup() {
  return `<section class="record-summary" aria-label="Transformation record summary">
    <div class="record-summary__item"><span>ORGANIZATION</span><strong>Demo organization</strong></div>
    <div class="record-summary__item"><span>CURRENT STAGE</span><strong>Discovery structure</strong></div>
    <div class="record-summary__item"><span>RELATIONSHIP OWNER</span><strong>Not connected</strong></div>
    <div class="record-summary__item"><span>PRIVACY STATE</span><strong>Demo only</strong></div>
  </section>`;
}

function closeRecordDrawer({ restoreFocus = true } = {}) {
  document.querySelector('.record-governance-overlay')?.remove();
  document.body.classList.remove('record-modal-open');
  if (restoreFocus && recordReturnFocus instanceof HTMLElement) recordReturnFocus.focus({ preventScroll: true });
  recordReturnFocus = null;
}

function drawerMarkup(mode) {
  if (mode === 'evidence') {
    return `<div class="record-governance-drawer__eyebrow">EVIDENCE GOVERNANCE · DEMO STRUCTURE</div>
      <h2>What kind of proof supports this claim?</h2>
      <p class="record-governance-drawer__lede">WorldStage should be able to tell the difference between a powerful story and a defensible outcome. These evidence states prevent an AI or marketer from silently upgrading one into the other.</p>
      <div class="record-governance-list">${evidenceStates.map(([title, body]) => `<article class="record-governance-item"><div class="record-governance-item__meta"><span>EVIDENCE STATE</span><span>REQUIRES SOURCE</span></div><h3>${title}</h3><p>${body}</p></article>`).join('')}</div>
      <div class="record-governance-notice"><strong>Current record:</strong> DEMO DATA only. No real WorldStage client outcome is represented or approved for public use in this prototype.</div>`;
  }

  return `<div class="record-governance-drawer__eyebrow">PRIVACY GATE · DEMO STRUCTURE</div>
    <h2>Who actually needs to see this?</h2>
    <p class="record-governance-drawer__lede">The Transformation Record should preserve institutional memory without turning participant or client information into unrestricted organizational surveillance.</p>
    <div class="record-governance-list">${privacyRules.map(([title, body]) => `<article class="record-governance-item"><div class="record-governance-item__meta"><span>ACCESS RULE</span><span>FAIL CLOSED</span></div><h3>${title}</h3><p>${body}</p></article>`).join('')}</div>
    <div class="record-governance-notice"><strong>Production gate:</strong> authentication, organization isolation, role-based authorization, audit logging, retention rules, and approved privacy notices are required before this record contains real client or participant information.</div>`;
}

function openRecordDrawer(mode, trigger) {
  closeRecordDrawer({ restoreFocus: false });
  recordReturnFocus = trigger;
  const overlay = document.createElement('div');
  overlay.className = 'record-governance-overlay';
  overlay.dataset.recordOverlay = mode;
  overlay.innerHTML = `<section class="record-governance-drawer" role="dialog" aria-modal="true" aria-label="${mode === 'evidence' ? 'Evidence governance' : 'Privacy governance'}">
    <button type="button" class="record-governance-close" data-record-close aria-label="Close">${recordCloseIcon()}</button>
    ${drawerMarkup(mode)}
  </section>`;
  document.body.append(overlay);
  document.body.classList.add('record-modal-open');
  overlay.addEventListener('pointerdown', (event) => { if (event.target === overlay) closeRecordDrawer(); });
  overlay.querySelector('[data-record-close]')?.addEventListener('click', () => closeRecordDrawer());
  overlay.querySelector('[data-record-close]')?.focus({ preventScroll: true });
}

function enhanceRecord() {
  const story = document.querySelector('.record-story');
  if (!story) {
    closeRecordDrawer({ restoreFocus: false });
    return;
  }

  if (!story.querySelector('.record-summary')) {
    const top = story.querySelector('.record-story__top');
    top?.insertAdjacentHTML('afterend', recordSummaryMarkup());
  }

  if (!story.querySelector('.record-governance-actions')) {
    const summary = story.querySelector('.record-summary');
    const actions = document.createElement('div');
    actions.className = 'record-governance-actions';
    actions.innerHTML = `<button type="button" data-record-evidence>Inspect evidence states</button><button type="button" data-record-privacy>Inspect privacy gate</button>`;
    summary?.insertAdjacentElement('afterend', actions);
    actions.querySelector('[data-record-evidence]')?.addEventListener('click', (event) => openRecordDrawer('evidence', event.currentTarget));
    actions.querySelector('[data-record-privacy]')?.addEventListener('click', (event) => openRecordDrawer('privacy', event.currentTarget));
  }
}

function trapRecordFocus(event) {
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('.record-governance-drawer');
  if (!dialog) return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((node) => node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

new MutationObserver(() => queueMicrotask(enhanceRecord)).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => { closeRecordDrawer({ restoreFocus: false }); queueMicrotask(enhanceRecord); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('.record-governance-overlay')) { event.preventDefault(); closeRecordDrawer(); return; }
  trapRecordFocus(event);
});
enhanceRecord();
