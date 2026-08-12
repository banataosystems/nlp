/* WorldStage / Cherry — ephemeral confirmation before the existing local synthetic reset.
   Confirmation exists only in the current page DOM and delegates only to the pre-existing canonical local reset control.
   Start-new visibility, identity, and confirmation integrity derive only from sanitized completed synthetic state.
   It does not persist confirmation state, delete external data, call providers, emit analytics, or grant authority. */

const CHERRY_RESET_CONFIRM_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_RESET_CONFIRM_FLOW_VERSION = 1;
const CHERRY_RESET_CONFIRM_ACTIONS_SELECTOR = '.cherry-engagement-continuity__completion-actions, .cherry-engagement-continuity__actions';
const CHERRY_RESET_START_LABEL = 'Start a new synthetic engagement →';
const CHERRY_RESET_START_ARIA_LABEL = 'Start a new synthetic engagement, local demo only';
const CHERRY_RESET_CONFIRM_ARIA_LABEL = 'Confirm new synthetic engagement';
const CHERRY_RESET_CONFIRM_STATUS_PRESERVED = 'Completed local-demo state is still preserved.';
const CHERRY_RESET_CONFIRM_TRACKED_ATTRIBUTES = Object.freeze([
  'data-cherry-engagement-continuity-start-new',
  'data-cherry-engagement-reset-confirmation',
  'data-cherry-engagement-reset-cancel',
  'data-cherry-engagement-reset-confirm',
  'data-cherry-engagement-reset-confirmation-status',
  'data-synthetic-flow-reset',
  'aria-label',
  'aria-hidden',
  'hidden',
  'type',
  'role',
  'form',
  'formaction',
  'formmethod',
  'formenctype',
  'formtarget',
  'onclick',
  'tabindex',
  'contenteditable',
  'draggable',
]);

let cherryResetIntegrityQueued = false;

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
  return `<div class="cherry-engagement-continuity__handoff" data-cherry-engagement-reset-confirmation role="group" aria-label="${CHERRY_RESET_CONFIRM_ARIA_LABEL}">
    <span>RESET CONFIRMATION · LOCAL DEMO ONLY</span>
    <p>Only the local synthetic engagement and demo review state will be cleared. No real client record, provider data, or production system is changed.</p>
    <p data-cherry-engagement-reset-confirmation-status aria-live="polite">${CHERRY_RESET_CONFIRM_STATUS_PRESERVED}</p>
    <button type="button" data-cherry-engagement-reset-cancel>Cancel</button>
    <button type="button" data-cherry-engagement-reset-confirm>Start new synthetic engagement →</button>
  </div>`;
}

function cherryResetConfirmActions(node) {
  if (!(node instanceof Element)) return null;
  const actions = node.closest(CHERRY_RESET_CONFIRM_ACTIONS_SELECTOR);
  return actions instanceof HTMLElement ? actions : null;
}

function cherryResetStrip() {
  const strip = document.querySelector('[data-cherry-engagement-continuity]');
  return strip instanceof HTMLElement ? strip : null;
}

function cherryResetInvalidateStrip(strip) {
  if (strip instanceof HTMLElement && strip.isConnected) strip.remove();
}

function cherryResetStripStartButton(strip) {
  if (!(strip instanceof HTMLElement)) return null;
  const starts = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-start-new]'));
  if (starts.length !== 1 || !(starts[0] instanceof HTMLButtonElement)) return null;
  return starts[0];
}

function cherryResetCompletionActions(strip) {
  if (!(strip instanceof HTMLElement)) return null;
  const actions = Array.from(strip.querySelectorAll('.cherry-engagement-continuity__completion-actions'));
  if (actions.length !== 1 || !(actions[0] instanceof HTMLElement)) return null;
  return actions[0];
}

function cherryResetConfirmation(actions) {
  if (!(actions instanceof HTMLElement)) return null;
  const confirmations = Array.from(actions.querySelectorAll('[data-cherry-engagement-reset-confirmation]'));
  if (confirmations.length === 0) return null;
  if (confirmations.length !== 1 || !(confirmations[0] instanceof HTMLElement)) return false;
  return confirmations[0];
}

function cherryResetStripCanonicalStart(strip) {
  if (!(strip instanceof HTMLElement) || !cherryResetConfirmIsCompleted()) return null;
  const actions = cherryResetCompletionActions(strip);
  const start = cherryResetStripStartButton(strip);
  if (!(actions instanceof HTMLElement) || !(start instanceof HTMLButtonElement) || start.parentElement !== actions) return null;
  return start;
}

function cherryResetRepairButton(button, label, ariaLabel = null) {
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.textContent !== label) button.textContent = label;
  if (button.getAttribute('type') !== 'button') button.setAttribute('type', 'button');
  if (ariaLabel && button.getAttribute('aria-label') !== ariaLabel) button.setAttribute('aria-label', ariaLabel);
  for (const attribute of ['form', 'formaction', 'formmethod', 'formenctype', 'formtarget', 'onclick', 'role', 'tabindex', 'contenteditable', 'draggable']) {
    if (button.hasAttribute(attribute)) button.removeAttribute(attribute);
  }
  if (button.disabled) button.disabled = false;
}

function cherryResetRepairConfirmation(confirmation, start) {
  if (!(confirmation instanceof HTMLElement) || !(start instanceof HTMLButtonElement)) return false;
  const cancels = Array.from(confirmation.querySelectorAll('[data-cherry-engagement-reset-cancel]'));
  const confirms = Array.from(confirmation.querySelectorAll('[data-cherry-engagement-reset-confirm]'));
  const statuses = Array.from(confirmation.querySelectorAll('[data-cherry-engagement-reset-confirmation-status]'));
  if (
    cancels.length !== 1 || !(cancels[0] instanceof HTMLButtonElement)
    || confirms.length !== 1 || !(confirms[0] instanceof HTMLButtonElement)
    || statuses.length !== 1 || !(statuses[0] instanceof HTMLElement)
  ) return false;

  if (confirmation.getAttribute('role') !== 'group') confirmation.setAttribute('role', 'group');
  if (confirmation.getAttribute('aria-label') !== CHERRY_RESET_CONFIRM_ARIA_LABEL) {
    confirmation.setAttribute('aria-label', CHERRY_RESET_CONFIRM_ARIA_LABEL);
  }
  cherryResetRepairButton(cancels[0], 'Cancel');
  cherryResetRepairButton(confirms[0], 'Start new synthetic engagement →');
  if (!statuses[0].getAttribute('aria-live')) statuses[0].setAttribute('aria-live', 'polite');
  start.hidden = true;
  start.setAttribute('aria-hidden', 'true');
  return true;
}

function repairCherryResetBoundary() {
  cherryResetIntegrityQueued = false;
  const strip = cherryResetStrip();
  if (!(strip instanceof HTMLElement)) return;

  const completed = cherryResetConfirmIsCompleted();
  const starts = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-start-new]'));
  const completionActionContainers = Array.from(strip.querySelectorAll('.cherry-engagement-continuity__completion-actions'));

  if (!completed) {
    starts.forEach((start) => start.remove());
    completionActionContainers.forEach((actions) => actions.remove());
    const strayConfirmation = strip.querySelector('[data-cherry-engagement-reset-confirmation]');
    if (strayConfirmation instanceof HTMLElement) strayConfirmation.remove();
    return;
  }

  const start = cherryResetStripCanonicalStart(strip);
  const actions = cherryResetCompletionActions(strip);
  if (!(start instanceof HTMLButtonElement) || !(actions instanceof HTMLElement)) {
    cherryResetInvalidateStrip(strip);
    return;
  }

  cherryResetRepairButton(start, CHERRY_RESET_START_LABEL, CHERRY_RESET_START_ARIA_LABEL);

  const confirmation = cherryResetConfirmation(actions);
  if (confirmation === false) {
    cherryResetInvalidateStrip(strip);
    return;
  }
  if (confirmation instanceof HTMLElement) {
    if (!cherryResetRepairConfirmation(confirmation, start)) {
      cherryResetInvalidateStrip(strip);
    }
    return;
  }

  start.hidden = false;
  start.removeAttribute('aria-hidden');
}

function scheduleCherryResetBoundaryRepair() {
  if (cherryResetIntegrityQueued) return;
  cherryResetIntegrityQueued = true;
  requestAnimationFrame(repairCherryResetBoundary);
}

function cherryResetConfirmOpen(startButton) {
  if (!(startButton instanceof HTMLButtonElement) || !cherryResetConfirmIsCompleted()) return;
  const strip = startButton.closest('[data-cherry-engagement-continuity]');
  const canonicalStart = strip instanceof HTMLElement ? cherryResetStripCanonicalStart(strip) : null;
  if (canonicalStart !== startButton) {
    if (strip instanceof HTMLElement) cherryResetInvalidateStrip(strip);
    return;
  }

  const actions = cherryResetConfirmActions(startButton);
  if (!(actions instanceof HTMLElement) || actions !== cherryResetCompletionActions(strip)) return;

  const existing = cherryResetConfirmation(actions);
  if (existing === false) {
    cherryResetInvalidateStrip(strip);
    return;
  }
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
  const strip = confirmation.closest('[data-cherry-engagement-continuity]');
  const actions = cherryResetConfirmActions(confirmation);
  const canonical = actions instanceof HTMLElement ? cherryResetConfirmation(actions) : null;
  if (!(strip instanceof HTMLElement) || canonical !== confirmation) {
    if (strip instanceof HTMLElement) cherryResetInvalidateStrip(strip);
    return;
  }

  const startButton = cherryResetStripCanonicalStart(strip);
  confirmation.remove();
  if (startButton instanceof HTMLButtonElement) {
    startButton.hidden = false;
    startButton.removeAttribute('aria-hidden');
    requestAnimationFrame(() => startButton.focus({ preventScroll: true }));
  }
}

function cherryResetCanonicalLocalTarget() {
  const resets = Array.from(document.querySelectorAll('[data-synthetic-flow-reset]'));
  if (resets.length !== 1 || !(resets[0] instanceof HTMLButtonElement)) return null;
  const reset = resets[0];
  const panel = reset.closest('[data-synthetic-engagement-flow]');
  if (!(panel instanceof HTMLElement)) return null;
  if (!reset.classList.contains('synthetic-flow__reset')) return null;
  if (reset.textContent?.trim() !== 'Reset demo') return null;
  if (reset.getAttribute('type') !== 'button') return null;
  if (reset.hasAttribute('form') || reset.hasAttribute('formaction') || reset.hasAttribute('formmethod') || reset.hasAttribute('onclick')) return null;
  return reset;
}

function cherryResetConfirmProceed(confirmation) {
  if (!(confirmation instanceof HTMLElement)) return;
  const strip = confirmation.closest('[data-cherry-engagement-continuity]');
  const actions = cherryResetConfirmActions(confirmation);
  if (!(strip instanceof HTMLElement) || !(actions instanceof HTMLElement) || cherryResetConfirmation(actions) !== confirmation) return;

  const status = confirmation.querySelector('[data-cherry-engagement-reset-confirmation-status]');
  if (!(status instanceof HTMLElement)) return;

  if (!cherryResetConfirmIsCompleted()) {
    status.textContent = 'Reset unavailable. Completed local-demo state could not be verified.';
    return;
  }

  const canonicalStart = cherryResetStripCanonicalStart(strip);
  if (!(canonicalStart instanceof HTMLButtonElement)) {
    status.textContent = 'Reset unavailable. Completed local-demo state preserved.';
    return;
  }

  const reset = cherryResetCanonicalLocalTarget();
  if (!(reset instanceof HTMLButtonElement)) {
    status.textContent = 'Reset unavailable. Completed local-demo state preserved.';
    return;
  }

  reset.click();
}

/* Capture the start-new click before its direct-reset listener runs. Only the single canonical
   completed-flow control may open confirmation; spoofed/duplicate/pre-completion controls are
   stopped before any direct listener can execute. The confirmation then delegates only to the
   single canonical local synthetic reset control. */
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const startButton = target.closest('[data-cherry-engagement-continuity-start-new]');
  if (startButton instanceof HTMLButtonElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const strip = startButton.closest('[data-cherry-engagement-continuity]');
    if (!(strip instanceof HTMLElement) || cherryResetStripCanonicalStart(strip) !== startButton) {
      if (strip instanceof HTMLElement) cherryResetInvalidateStrip(strip);
      return;
    }
    cherryResetConfirmOpen(startButton);
    return;
  }

  const cancel = target.closest('[data-cherry-engagement-reset-cancel]');
  if (cancel instanceof HTMLButtonElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const confirmation = cancel.closest('[data-cherry-engagement-reset-confirmation]');
    if (confirmation instanceof HTMLElement) cherryResetConfirmClose(confirmation);
    return;
  }

  const proceed = target.closest('[data-cherry-engagement-reset-confirm]');
  if (proceed instanceof HTMLButtonElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const confirmation = proceed.closest('[data-cherry-engagement-reset-confirmation]');
    if (confirmation instanceof HTMLElement) cherryResetConfirmProceed(confirmation);
  }
}, true);

const cherryResetIntegrityApp = document.getElementById('app');
if (cherryResetIntegrityApp) {
  new MutationObserver(scheduleCherryResetBoundaryRepair).observe(cherryResetIntegrityApp, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: CHERRY_RESET_CONFIRM_TRACKED_ATTRIBUTES,
  });
}
window.addEventListener('hashchange', scheduleCherryResetBoundaryRepair);
window.addEventListener('storage', (event) => {
  if (event.key === CHERRY_RESET_CONFIRM_FLOW_KEY) scheduleCherryResetBoundaryRepair();
});
queueMicrotask(repairCherryResetBoundary);
