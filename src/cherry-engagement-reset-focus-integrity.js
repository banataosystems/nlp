/* WorldStage / Cherry — confirmation-open direct-reset and focus integrity.
   While the ephemeral local-demo confirmation is open, the pre-existing canonical `Reset demo`
   control is removed from sequential keyboard focus and marked unavailable to assistive technology.
   Capture guards block pointer/keyboard/programmatic bypass while preserving the existing synchronous
   local reset listener for the one canonical confirmation path. No provider access, analytics,
   spending, destructive production action, persistence expansion, or release authority is added. */

const CHERRY_RESET_FOCUS_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_RESET_FOCUS_FLOW_VERSION = 1;
const CHERRY_RESET_FOCUS_START_SELECTOR = '[data-cherry-engagement-continuity-start-new]';
const CHERRY_RESET_FOCUS_CONFIRMATION_SELECTOR = '[data-cherry-engagement-reset-confirmation]';
const CHERRY_RESET_FOCUS_CANCEL_SELECTOR = '[data-cherry-engagement-reset-cancel]';
const CHERRY_RESET_FOCUS_CONFIRM_SELECTOR = '[data-cherry-engagement-reset-confirm]';
const CHERRY_RESET_FOCUS_RESET_SELECTOR = '[data-synthetic-flow-reset], .synthetic-flow__reset';

let cherryResetFocusSessionOpen = false;
let cherryResetFocusPreLock = false;
let cherryResetFocusDelegationAllowed = false;
let cherryResetFocusLockedReset = null;
let cherryResetFocusRepairQueued = false;

function cherryResetFocusSafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryResetFocusCompleted() {
  const stored = cherryResetFocusSafeJson(CHERRY_RESET_FOCUS_FLOW_KEY);
  if (!stored || stored.version !== CHERRY_RESET_FOCUS_FLOW_VERSION) return false;
  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  return ownerReviewed && stored.recordPrepared === true;
}

function cherryResetFocusStrip() {
  const strips = Array.from(document.querySelectorAll('[data-cherry-engagement-continuity]'));
  if (strips.length !== 1 || !(strips[0] instanceof HTMLElement)) return null;
  return strips[0];
}

function cherryResetFocusConfirmation(strip = cherryResetFocusStrip()) {
  if (!(strip instanceof HTMLElement)) return null;
  const confirmations = Array.from(strip.querySelectorAll(CHERRY_RESET_FOCUS_CONFIRMATION_SELECTOR));
  if (confirmations.length === 0) return null;
  if (confirmations.length !== 1 || !(confirmations[0] instanceof HTMLElement)) return false;
  return confirmations[0];
}

function cherryResetFocusConfirmationParts(confirmation) {
  if (!(confirmation instanceof HTMLElement)) return null;
  const cancels = Array.from(confirmation.querySelectorAll(CHERRY_RESET_FOCUS_CANCEL_SELECTOR));
  const confirms = Array.from(confirmation.querySelectorAll(CHERRY_RESET_FOCUS_CONFIRM_SELECTOR));
  if (
    cancels.length !== 1 || !(cancels[0] instanceof HTMLButtonElement)
    || confirms.length !== 1 || !(confirms[0] instanceof HTMLButtonElement)
  ) return null;
  return { cancel: cancels[0], confirm: confirms[0] };
}

function cherryResetFocusCanonicalReset({ allowLocked = true } = {}) {
  const resets = Array.from(document.querySelectorAll('[data-synthetic-flow-reset]'));
  if (resets.length !== 1 || !(resets[0] instanceof HTMLButtonElement)) return null;
  const reset = resets[0];
  const panel = reset.closest('[data-synthetic-engagement-flow]');
  if (!(panel instanceof HTMLElement)) return null;
  if (!reset.classList.contains('synthetic-flow__reset')) return null;
  if (reset.textContent?.trim() !== 'Reset demo') return null;
  if (reset.getAttribute('type') !== 'button') return null;
  for (const attribute of ['form', 'formaction', 'formmethod', 'formenctype', 'formtarget', 'onclick', 'role', 'contenteditable', 'draggable']) {
    if (reset.hasAttribute(attribute)) return null;
  }

  const baseline = !reset.disabled && !reset.hasAttribute('aria-disabled') && !reset.hasAttribute('tabindex');
  const locked = !reset.disabled && reset.getAttribute('aria-disabled') === 'true' && reset.getAttribute('tabindex') === '-1';
  if (!baseline && !(allowLocked && locked)) return null;
  return reset;
}

function cherryResetFocusLockElement(node) {
  if (!(node instanceof HTMLElement)) return;
  // Keep the native button enabled so the pre-existing canonical reset listener can receive the
  // one explicitly delegated programmatic click. Unavailability is enforced by capture guards,
  // aria-disabled, and removal from sequential focus rather than by native disabled semantics.
  if (node instanceof HTMLButtonElement && node.disabled) node.disabled = false;
  if (node.getAttribute('aria-disabled') !== 'true') node.setAttribute('aria-disabled', 'true');
  if (node.getAttribute('tabindex') !== '-1') node.setAttribute('tabindex', '-1');
}

function cherryResetFocusLockCanonicalReset() {
  const reset = cherryResetFocusCanonicalReset({ allowLocked: true });
  if (reset instanceof HTMLButtonElement) {
    if (cherryResetFocusLockedReset && cherryResetFocusLockedReset !== reset && cherryResetFocusLockedReset.isConnected) {
      cherryResetFocusLockElement(cherryResetFocusLockedReset);
      return null;
    }
    cherryResetFocusLockedReset = reset;
    cherryResetFocusLockElement(reset);
    return reset;
  }

  if (cherryResetFocusLockedReset instanceof HTMLElement && cherryResetFocusLockedReset.isConnected) {
    cherryResetFocusLockElement(cherryResetFocusLockedReset);
  }
  document.querySelectorAll(CHERRY_RESET_FOCUS_RESET_SELECTOR).forEach(cherryResetFocusLockElement);
  return null;
}

function cherryResetFocusRestoreLockedReset() {
  const reset = cherryResetFocusLockedReset;
  cherryResetFocusLockedReset = null;
  if (!(reset instanceof HTMLButtonElement) || !reset.isConnected) return;
  const markerMatches = reset.hasAttribute('data-synthetic-flow-reset');
  const panel = reset.closest('[data-synthetic-engagement-flow]');
  const structurallyCanonical = markerMatches
    && panel instanceof HTMLElement
    && reset.classList.contains('synthetic-flow__reset')
    && reset.textContent?.trim() === 'Reset demo'
    && reset.getAttribute('type') === 'button'
    && !['form', 'formaction', 'formmethod', 'formenctype', 'formtarget', 'onclick', 'role', 'contenteditable', 'draggable']
      .some((attribute) => reset.hasAttribute(attribute));
  if (!structurallyCanonical) return;
  if (reset.disabled) reset.disabled = false;
  if (reset.hasAttribute('aria-disabled')) reset.removeAttribute('aria-disabled');
  if (reset.hasAttribute('tabindex')) reset.removeAttribute('tabindex');
}

function cherryResetFocusFocusCancel(confirmation = cherryResetFocusConfirmation()) {
  if (!(confirmation instanceof HTMLElement) || !confirmation.isConnected) return;
  const parts = cherryResetFocusConfirmationParts(confirmation);
  if (!parts) return;
  if (document.activeElement !== parts.cancel) parts.cancel.focus({ preventScroll: true });
}

function cherryResetFocusIsLockedTarget(target) {
  if (!(target instanceof Element)) return false;
  if (cherryResetFocusLockedReset && (target === cherryResetFocusLockedReset || cherryResetFocusLockedReset.contains(target))) return true;
  return target.closest(CHERRY_RESET_FOCUS_RESET_SELECTOR) instanceof Element;
}

function repairCherryResetFocusIntegrity() {
  cherryResetFocusRepairQueued = false;
  const strip = cherryResetFocusStrip();
  const confirmation = cherryResetFocusConfirmation(strip);

  if (confirmation === false) {
    cherryResetFocusSessionOpen = true;
    cherryResetFocusPreLock = false;
    cherryResetFocusLockCanonicalReset();
    return;
  }

  if (confirmation instanceof HTMLElement) {
    cherryResetFocusSessionOpen = true;
    cherryResetFocusPreLock = false;
    cherryResetFocusLockCanonicalReset();
    if (!cherryResetFocusConfirmationParts(confirmation)) return;
    if (cherryResetFocusIsLockedTarget(document.activeElement)) {
      queueMicrotask(() => cherryResetFocusFocusCancel(confirmation));
    }
    return;
  }

  if (cherryResetFocusPreLock) cherryResetFocusPreLock = false;
  if (cherryResetFocusSessionOpen) {
    cherryResetFocusSessionOpen = false;
    cherryResetFocusDelegationAllowed = false;
    cherryResetFocusRestoreLockedReset();
  } else if (cherryResetFocusLockedReset) {
    cherryResetFocusRestoreLockedReset();
  }
}

function scheduleCherryResetFocusIntegrity() {
  if (cherryResetFocusRepairQueued) return;
  cherryResetFocusRepairQueued = true;
  queueMicrotask(repairCherryResetFocusIntegrity);
}

function cherryResetFocusPreLockForStart(startButton) {
  if (!(startButton instanceof HTMLButtonElement) || !cherryResetFocusCompleted()) return;
  const strip = startButton.closest('[data-cherry-engagement-continuity]');
  if (!(strip instanceof HTMLElement) || strip !== cherryResetFocusStrip()) return;
  cherryResetFocusPreLock = true;
  cherryResetFocusSessionOpen = true;
  cherryResetFocusLockCanonicalReset();
  queueMicrotask(() => {
    if (!(cherryResetFocusConfirmation() instanceof HTMLElement)) scheduleCherryResetFocusIntegrity();
  });
}

function cherryResetFocusArmCanonicalConfirm(confirmButton) {
  if (!(confirmButton instanceof HTMLButtonElement) || !cherryResetFocusSessionOpen) return;
  const confirmation = confirmButton.closest(CHERRY_RESET_FOCUS_CONFIRMATION_SELECTOR);
  const strip = confirmation instanceof HTMLElement ? confirmation.closest('[data-cherry-engagement-continuity]') : null;
  if (!(confirmation instanceof HTMLElement) || !(strip instanceof HTMLElement) || strip !== cherryResetFocusStrip()) return;
  if (cherryResetFocusConfirmation(strip) !== confirmation) return;
  const parts = cherryResetFocusConfirmationParts(confirmation);
  if (!parts || parts.confirm !== confirmButton) return;
  if (!cherryResetFocusCompleted()) return;

  const reset = cherryResetFocusCanonicalReset({ allowLocked: true });
  if (!(reset instanceof HTMLButtonElement) || (cherryResetFocusLockedReset && reset !== cherryResetFocusLockedReset)) return;

  // Keep the locked accessibility/focus state stable. aria-disabled does not suppress the DOM
  // click event, so the existing confirmation module can synchronously call reset.click(); the
  // capture guard permits exactly that one event without exposing a transient unlocked state.
  cherryResetFocusLockedReset = reset;
  cherryResetFocusDelegationAllowed = true;
  queueMicrotask(() => {
    cherryResetFocusDelegationAllowed = false;
    scheduleCherryResetFocusIntegrity();
  });
}

function cherryResetFocusBlockDirectInteraction(event) {
  if (!cherryResetFocusSessionOpen) return false;
  const target = event.target instanceof Element ? event.target : null;
  if (!target || !cherryResetFocusIsLockedTarget(target)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  cherryResetFocusLockCanonicalReset();
  queueMicrotask(() => cherryResetFocusFocusCancel());
  return true;
}

document.addEventListener('pointerdown', (event) => {
  cherryResetFocusBlockDirectInteraction(event);
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  cherryResetFocusBlockDirectInteraction(event);
}, true);

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const start = target.closest(CHERRY_RESET_FOCUS_START_SELECTOR);
  if (start instanceof HTMLButtonElement) {
    cherryResetFocusPreLockForStart(start);
    return;
  }

  const confirm = target.closest(CHERRY_RESET_FOCUS_CONFIRM_SELECTOR);
  if (confirm instanceof HTMLButtonElement) {
    cherryResetFocusArmCanonicalConfirm(confirm);
    return;
  }

  if (cherryResetFocusSessionOpen && cherryResetFocusIsLockedTarget(target)) {
    const exactReset = cherryResetFocusCanonicalReset({ allowLocked: true });
    const delegated = cherryResetFocusDelegationAllowed
      && exactReset instanceof HTMLButtonElement
      && (target === exactReset || exactReset.contains(target));
    if (delegated) {
      cherryResetFocusDelegationAllowed = false;
      return;
    }
    cherryResetFocusBlockDirectInteraction(event);
  }
}, true);

document.addEventListener('focusin', (event) => {
  if (!cherryResetFocusSessionOpen) return;
  const target = event.target instanceof Element ? event.target : null;
  if (!target || !cherryResetFocusIsLockedTarget(target)) return;
  cherryResetFocusLockCanonicalReset();
  queueMicrotask(() => cherryResetFocusFocusCancel());
}, true);

const cherryResetFocusApp = document.getElementById('app');
if (cherryResetFocusApp) {
  new MutationObserver(scheduleCherryResetFocusIntegrity).observe(cherryResetFocusApp, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'data-cherry-engagement-reset-confirmation',
      'data-cherry-engagement-reset-cancel',
      'data-cherry-engagement-reset-confirm',
      'data-synthetic-flow-reset',
      'class',
      'disabled',
      'aria-disabled',
      'tabindex',
      'type',
      'form',
      'formaction',
      'formmethod',
      'formenctype',
      'formtarget',
      'onclick',
      'role',
      'contenteditable',
      'draggable',
    ],
  });
}
window.addEventListener('hashchange', scheduleCherryResetFocusIntegrity);
window.addEventListener('storage', (event) => {
  if (event.key === CHERRY_RESET_FOCUS_FLOW_KEY) scheduleCherryResetFocusIntegrity();
});
queueMicrotask(repairCherryResetFocusIntegrity);
