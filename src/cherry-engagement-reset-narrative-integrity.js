/* WorldStage / Cherry — fail-closed integrity for the local synthetic reset confirmation narrative.
   The confirmation can describe only local-demo reset behavior. Narrative, control labels, and live status
   are derived from sanitized local state and the existing canonical local reset target. No persistence,
   provider access, analytics, spending, destructive production behavior, or release authority is added. */

const CHERRY_RESET_NARRATIVE_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_RESET_NARRATIVE_FLOW_VERSION = 1;
const CHERRY_RESET_NARRATIVE_HEADING = 'RESET CONFIRMATION · LOCAL DEMO ONLY';
const CHERRY_RESET_NARRATIVE_EXPLANATION = 'Only the local synthetic engagement and demo review state will be cleared. No real client record, provider data, or production system is changed.';
const CHERRY_RESET_NARRATIVE_GROUP_LABEL = 'Confirm new synthetic engagement';
const CHERRY_RESET_NARRATIVE_CANCEL = 'Cancel';
const CHERRY_RESET_NARRATIVE_CONFIRM = 'Start new synthetic engagement →';
const CHERRY_RESET_NARRATIVE_STATUS_PRESERVED = 'Completed local-demo state is still preserved.';
const CHERRY_RESET_NARRATIVE_STATUS_UNVERIFIED = 'Reset unavailable. Completed local-demo state could not be verified.';
const CHERRY_RESET_NARRATIVE_STATUS_UNAVAILABLE = 'Reset unavailable. Completed local-demo state preserved.';
const CHERRY_RESET_NARRATIVE_ROOT_CLASS = 'cherry-engagement-continuity__handoff';

const CHERRY_RESET_NARRATIVE_ATTRIBUTES = Object.freeze([
  'class',
  'style',
  'hidden',
  'disabled',
  'type',
  'role',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-live',
  'aria-atomic',
  'aria-hidden',
  'tabindex',
  'contenteditable',
  'draggable',
  'form',
  'formaction',
  'formmethod',
  'formenctype',
  'formtarget',
  'onclick',
  'autofocus',
  'popovertarget',
  'data-cherry-engagement-reset-confirmation',
  'data-cherry-engagement-reset-confirmation-status',
  'data-cherry-engagement-reset-cancel',
  'data-cherry-engagement-reset-confirm',
  'data-synthetic-flow-reset',
]);

let cherryResetNarrativeRepairQueued = false;

function cherryResetNarrativeSafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryResetNarrativeCompleted() {
  const stored = cherryResetNarrativeSafeJson(CHERRY_RESET_NARRATIVE_FLOW_KEY);
  if (!stored || stored.version !== CHERRY_RESET_NARRATIVE_FLOW_VERSION) return false;
  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  return ownerReviewed && stored.recordPrepared === true;
}

function cherryResetNarrativeCanonicalLocalReset() {
  const resets = Array.from(document.querySelectorAll('[data-synthetic-flow-reset]'));
  if (resets.length !== 1 || !(resets[0] instanceof HTMLButtonElement)) return null;
  const reset = resets[0];
  const panel = reset.closest('[data-synthetic-engagement-flow]');
  if (!(panel instanceof HTMLElement)) return null;
  if (!reset.classList.contains('synthetic-flow__reset')) return null;
  if (reset.textContent?.trim() !== 'Reset demo') return null;
  if (reset.getAttribute('type') !== 'button') return null;
  for (const attribute of ['form', 'formaction', 'formmethod', 'formenctype', 'formtarget', 'onclick']) {
    if (reset.hasAttribute(attribute)) return null;
  }
  return reset;
}

function cherryResetNarrativeExpectedStatus() {
  if (!cherryResetNarrativeCompleted()) return CHERRY_RESET_NARRATIVE_STATUS_UNVERIFIED;
  return cherryResetNarrativeCanonicalLocalReset() instanceof HTMLButtonElement
    ? CHERRY_RESET_NARRATIVE_STATUS_PRESERVED
    : CHERRY_RESET_NARRATIVE_STATUS_UNAVAILABLE;
}

function cherryResetNarrativeStrip() {
  const strips = Array.from(document.querySelectorAll('[data-cherry-engagement-continuity]'));
  if (strips.length !== 1 || !(strips[0] instanceof HTMLElement)) return null;
  return strips[0];
}

function cherryResetNarrativeInvalidate(strip) {
  if (strip instanceof HTMLElement && strip.isConnected) strip.remove();
}

function cherryResetNarrativeConfirmation(strip) {
  if (!(strip instanceof HTMLElement)) return null;
  const confirmations = Array.from(strip.querySelectorAll('[data-cherry-engagement-reset-confirmation]'));
  if (confirmations.length === 0) return null;
  if (confirmations.length !== 1 || !(confirmations[0] instanceof HTMLElement)) return false;
  return confirmations[0];
}

function cherryResetNarrativeParts(confirmation) {
  if (!(confirmation instanceof HTMLElement)) return null;
  const visibleLooseText = Array.from(confirmation.childNodes).some((node) => (
    node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
  ));
  if (visibleLooseText) return null;

  const children = Array.from(confirmation.children);
  if (children.length !== 5) return null;
  const [heading, explanation, status, cancel, confirm] = children;
  if (!(heading instanceof HTMLSpanElement)) return null;
  if (!(explanation instanceof HTMLParagraphElement)) return null;
  if (!(status instanceof HTMLParagraphElement) || !status.hasAttribute('data-cherry-engagement-reset-confirmation-status')) return null;
  if (!(cancel instanceof HTMLButtonElement) || !cancel.hasAttribute('data-cherry-engagement-reset-cancel')) return null;
  if (!(confirm instanceof HTMLButtonElement) || !confirm.hasAttribute('data-cherry-engagement-reset-confirm')) return null;
  return { heading, explanation, status, cancel, confirm };
}

function cherryResetNarrativeRepairText(node, text, live = false) {
  if (!(node instanceof HTMLElement)) return;
  if (node.childElementCount > 0 || node.textContent !== text) node.textContent = text;
  for (const attribute of ['class', 'style', 'hidden', 'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'tabindex', 'contenteditable', 'draggable', 'onclick']) {
    if (node.hasAttribute(attribute)) node.removeAttribute(attribute);
  }
  if (live) {
    if (node.getAttribute('aria-live') !== 'polite') node.setAttribute('aria-live', 'polite');
    if (node.hasAttribute('aria-atomic')) node.removeAttribute('aria-atomic');
  } else if (node.hasAttribute('aria-live')) {
    node.removeAttribute('aria-live');
  }
}

function cherryResetNarrativeRepairButton(button, text) {
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.childElementCount > 0 || button.textContent !== text) button.textContent = text;
  if (button.getAttribute('type') !== 'button') button.setAttribute('type', 'button');
  for (const attribute of [
    'class', 'style', 'hidden', 'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-live', 'aria-atomic',
    'aria-hidden', 'tabindex', 'contenteditable', 'draggable', 'form', 'formaction', 'formmethod', 'formenctype',
    'formtarget', 'onclick', 'autofocus', 'popovertarget',
  ]) {
    if (button.hasAttribute(attribute)) button.removeAttribute(attribute);
  }
  if (button.disabled) button.disabled = false;
}

function repairCherryResetNarrativeIntegrity() {
  cherryResetNarrativeRepairQueued = false;
  const strip = cherryResetNarrativeStrip();
  if (!(strip instanceof HTMLElement)) return;

  const confirmation = cherryResetNarrativeConfirmation(strip);
  if (confirmation === null) return;
  if (confirmation === false) {
    cherryResetNarrativeInvalidate(strip);
    return;
  }

  const parts = cherryResetNarrativeParts(confirmation);
  if (!parts) {
    cherryResetNarrativeInvalidate(strip);
    return;
  }

  if (confirmation.className !== CHERRY_RESET_NARRATIVE_ROOT_CLASS) confirmation.className = CHERRY_RESET_NARRATIVE_ROOT_CLASS;
  if (confirmation.getAttribute('role') !== 'group') confirmation.setAttribute('role', 'group');
  if (confirmation.getAttribute('aria-label') !== CHERRY_RESET_NARRATIVE_GROUP_LABEL) {
    confirmation.setAttribute('aria-label', CHERRY_RESET_NARRATIVE_GROUP_LABEL);
  }
  for (const attribute of ['style', 'hidden', 'aria-hidden', 'aria-labelledby', 'aria-describedby', 'aria-live', 'aria-atomic', 'tabindex', 'contenteditable', 'draggable', 'onclick']) {
    if (confirmation.hasAttribute(attribute)) confirmation.removeAttribute(attribute);
  }

  cherryResetNarrativeRepairText(parts.heading, CHERRY_RESET_NARRATIVE_HEADING);
  cherryResetNarrativeRepairText(parts.explanation, CHERRY_RESET_NARRATIVE_EXPLANATION);
  cherryResetNarrativeRepairText(parts.status, cherryResetNarrativeExpectedStatus(), true);
  cherryResetNarrativeRepairButton(parts.cancel, CHERRY_RESET_NARRATIVE_CANCEL);
  cherryResetNarrativeRepairButton(parts.confirm, CHERRY_RESET_NARRATIVE_CONFIRM);
}

function scheduleCherryResetNarrativeIntegrity() {
  if (cherryResetNarrativeRepairQueued) return;
  cherryResetNarrativeRepairQueued = true;
  queueMicrotask(repairCherryResetNarrativeIntegrity);
}

const cherryResetNarrativeApp = document.getElementById('app');
if (cherryResetNarrativeApp) {
  new MutationObserver(scheduleCherryResetNarrativeIntegrity).observe(cherryResetNarrativeApp, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: CHERRY_RESET_NARRATIVE_ATTRIBUTES,
  });
}
window.addEventListener('hashchange', scheduleCherryResetNarrativeIntegrity);
window.addEventListener('storage', (event) => {
  if (event.key === CHERRY_RESET_NARRATIVE_FLOW_KEY) scheduleCherryResetNarrativeIntegrity();
});
queueMicrotask(repairCherryResetNarrativeIntegrity);
