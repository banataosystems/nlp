/* WorldStage / Cherry — ephemeral confirmation before the existing local synthetic reset.
   Confirmation exists only in the current page DOM and delegates only to the pre-existing reset control.
   It does not persist confirmation state, delete external data, call providers, emit analytics, or grant authority. */

const CHERRY_RESET_CONFIRM_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_RESET_CONFIRM_FLOW_VERSION = 1;

function cherryResetConfirmSafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryResetConfirmIsCompleted() {
  const stored = cherryResetConfirmSafeJson(CHERRY_RESET_CONFIRM_FLOW_KEY);
  if (!stored || stored.version !== CHERRY_RESET_CONFIRM_FLOW_VERSION) return false;
  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  const recordPrepared = ownerReviewed && stored.recordPrepared === true;
  return recordPrepared;
}

function cherryResetConfirmMarkup() {
  return `<div class="cherry-engagement-continuity__handoff" data-cherry-engagement-reset-confirmation role="group" aria-label="Confirm new synthetic engagement">
    <span>RESET CONFIRMATION · LOCAL DEMO ONLY</span>
    <p>Only the local synthetic engagement and demo review state will be cleared. No real client record, provider data, or production system is changed.</p>
    <p data-cherry-engagement-reset-confirmation-status aria-live="polite">Completed local-demo state is still preserved.</p>
    <button type="button" data-cherry-engagement-reset-cancel>Cancel</button>
    <button type="button" data-cherry-engagement-reset-confirm>Start new synthetic engagement →</button>
  </div>`;
}

function cherryResetConfirmOpen(startButton) {
  if (!(startButton instanceof HTMLButtonElement) || !cherryResetConfirmIsCompleted()) return;
  const strip = startButton.closest('[data-cherry-engagement-continuity]');
  const actions = startButton.closest('.cherry-engagement-continuity__actions');
  if (!(strip instanceof HTMLElement) || !(actions instanceof HTMLElement)) return;

  const existing = actions.querySelector('[data-cherry-engagement-reset-confirmation]');
  if (existing instanceof HTMLElement) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = cherryResetConfirmMarkup();
  const confirmation = wrapper.firstElementChild;
  if (!(confirmation instanceof HTMLElement)) return;

  startButton.hidden = true;
  startButton.setAttribute('aria-hidden', 'true');
  actions.append(confirmation);
  const cancel = confirmation.querySelector('[data-cherry-engagement-reset-cancel]');
  requestAnimationFrame(() => {
    if (cancel instanceof HTMLButtonElement) cancel.focus({ preventScroll: true });
  });
}

function cherryResetConfirmClose(confirmation) {
  if (!(confirmation instanceof HTMLElement)) return;
  const actions = confirmation.closest('.cherry-engagement-continuity__actions');
  const startButton = actions?.querySelector('[data-cherry-engagement-continuity-start-new]');
  confirmation.remove();
  if (startButton instanceof HTMLButtonElement) {
    startButton.hidden = false;
    startButton.removeAttribute('aria-hidden');
    requestAnimationFrame(() => startButton.focus({ preventScroll: true }));
  }
}

function cherryResetConfirmProceed(confirmation) {
  if (!(confirmation instanceof HTMLElement)) return;
  const status = confirmation.querySelector('[data-cherry-engagement-reset-confirmation-status]');
  if (!(status instanceof HTMLElement)) return;

  if (!cherryResetConfirmIsCompleted()) {
    status.textContent = 'Reset unavailable. Completed local-demo state could not be verified.';
    return;
  }

  const reset = document.querySelector('[data-synthetic-flow-reset]');
  if (!(reset instanceof HTMLButtonElement)) {
    status.textContent = 'Reset unavailable. Completed local-demo state preserved.';
    return;
  }

  reset.click();
}

/* Capture the existing start-new click before its direct-reset listener runs. This turns
   that one local action into a two-step, page-memory-only confirmation without modifying
   or duplicating the established reset implementation. */
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const startButton = target.closest('[data-cherry-engagement-continuity-start-new]');
  if (startButton instanceof HTMLButtonElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    cherryResetConfirmOpen(startButton);
    return;
  }

  const cancel = target.closest('[data-cherry-engagement-reset-cancel]');
  if (cancel instanceof HTMLButtonElement) {
    const confirmation = cancel.closest('[data-cherry-engagement-reset-confirmation]');
    if (confirmation instanceof HTMLElement) cherryResetConfirmClose(confirmation);
    return;
  }

  const proceed = target.closest('[data-cherry-engagement-reset-confirm]');
  if (proceed instanceof HTMLButtonElement) {
    const confirmation = proceed.closest('[data-cherry-engagement-reset-confirmation]');
    if (confirmation instanceof HTMLElement) cherryResetConfirmProceed(confirmation);
  }
}, true);
