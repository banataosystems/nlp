/* WorldStage / Cherry — accessibility-only semantic orientation for the fixed synthetic continuity steps.
   Derives solely from the sanitized continuity stage emitted by cherry-engagement-continuity.js.
   Exactly one allowlisted step is current. The fixed three-step sequence is exposed as one semantic list
   with deterministic position metadata, a fixed accessibility-only demo-status boundary description,
   and enforced passive keyboard/non-interactive semantics even if tabindex, contenteditable, draggable,
   inert, intrinsic interactive stage-marker elements, intrinsic interactive descendants, action-like
   semantic roles, spoofed accessibility names/action states, or direct canonical list/stage ARIA tampering
   is injected into the synthetic stage surface. Trusted canonical semantics are deterministically repaired.
   No focus movement, persistence, provider access, analytics, scoring, private data, spending, or release authority. */

const CHERRY_STEP_ORIENTATION = Object.freeze({
  discovery: Object.freeze({
    discovery: 'current',
    review: 'upcoming',
    record: 'upcoming',
  }),
  review: Object.freeze({
    discovery: 'completed',
    review: 'current',
    record: 'upcoming',
  }),
  record: Object.freeze({
    discovery: 'completed',
    review: 'completed',
    record: 'current',
  }),
});

const CHERRY_STEP_LABELS = Object.freeze({
  discovery: 'Discovery',
  review: 'Cherry review',
  record: 'Transformation Record',
});

const CHERRY_STEP_STATUS_LABELS = Object.freeze({
  current: 'Current synthetic step',
  completed: 'Completed synthetic step',
  upcoming: 'Upcoming synthetic step',
});

const CHERRY_STEP_SEQUENCE = Object.freeze(['discovery', 'review', 'record']);
const CHERRY_STEP_TRUSTED_ELEMENT = 'ARTICLE';
const CHERRY_STEP_INTRINSIC_ACTION_SELECTOR = 'button, input, select, textarea, summary, a, audio, video, iframe';
const CHERRY_STEP_ACTION_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'scrollbar',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
  'treeitem',
]);
const CHERRY_STEP_SPOOFED_ARIA_ATTRIBUTES = Object.freeze([
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-activedescendant',
  'aria-controls',
  'aria-checked',
  'aria-current',
  'aria-disabled',
  'aria-expanded',
  'aria-haspopup',
  'aria-pressed',
  'aria-selected',
  'aria-autocomplete',
  'aria-readonly',
  'aria-required',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
]);
const CHERRY_STEP_CANONICAL_ARIA_ATTRIBUTES = Object.freeze([
  ...CHERRY_STEP_SPOOFED_ARIA_ATTRIBUTES,
  'aria-posinset',
  'aria-setsize',
]);
const CHERRY_STEP_LIST_ALLOWED_ARIA_ATTRIBUTES = new Set(['aria-label', 'aria-describedby']);
const CHERRY_STEP_ITEM_ALLOWED_ARIA_ATTRIBUTES = new Set(['aria-label', 'aria-current', 'aria-posinset', 'aria-setsize']);
const CHERRY_STEP_LIST_LABEL = 'Synthetic engagement stages';
const CHERRY_STEP_SET_SIZE = String(CHERRY_STEP_SEQUENCE.length);
const CHERRY_STEP_BOUNDARY_ID = 'cherry-engagement-step-boundary-description';
const CHERRY_STEP_BOUNDARY_TEXT = 'Synthetic demo stages only. Not a verified real-client engagement status.';
const CHERRY_STEP_PASSIVE_ATTRIBUTES = Object.freeze(['tabindex', 'contenteditable', 'draggable']);

let cherryStepOrientationQueued = false;

function stripCherryStepInteractiveAttributes(node) {
  CHERRY_STEP_PASSIVE_ATTRIBUTES.forEach((attribute) => node.removeAttribute(attribute));
}

function stripCherryStepActionRole(node) {
  const role = node.getAttribute('role');
  if (!role) return false;
  const tokens = role.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!tokens.some((token) => CHERRY_STEP_ACTION_ROLES.has(token))) return false;
  node.removeAttribute('role');
  return true;
}

function stripCherryStepSpoofedAriaAttributes(node) {
  let stripped = false;
  CHERRY_STEP_SPOOFED_ARIA_ATTRIBUTES.forEach((attribute) => {
    if (!node.hasAttribute(attribute)) return;
    node.removeAttribute(attribute);
    stripped = true;
  });
  return stripped;
}

function stripCherryStepCanonicalAriaTampering(node, allowedAttributes = new Set()) {
  CHERRY_STEP_CANONICAL_ARIA_ATTRIBUTES.forEach((attribute) => {
    if (allowedAttributes.has(attribute) || !node.hasAttribute(attribute)) return;
    node.removeAttribute(attribute);
  });
}

function enforceCherryStepNodePassivity(node) {
  stripCherryStepInteractiveAttributes(node);
  if (node.matches(CHERRY_STEP_INTRINSIC_ACTION_SELECTOR)) {
    if (!node.hasAttribute('inert')) node.setAttribute('inert', '');
  } else {
    node.removeAttribute('inert');
  }
}

function enforceCherryStepDescendantPassivity(step) {
  if (!(step instanceof HTMLElement) || step.tagName !== CHERRY_STEP_TRUSTED_ELEMENT) return;

  step.querySelectorAll('*').forEach((node) => {
    stripCherryStepInteractiveAttributes(node);
    const spoofedActionRole = stripCherryStepActionRole(node);
    const spoofedAriaState = stripCherryStepSpoofedAriaAttributes(node);
    if ((spoofedActionRole || spoofedAriaState || node.matches(CHERRY_STEP_INTRINSIC_ACTION_SELECTOR)) && !node.hasAttribute('inert')) {
      node.setAttribute('inert', '');
    }
  });
}

function enforceCherryStepPassivity(strip) {
  stripCherryStepInteractiveAttributes(strip);
  strip.removeAttribute('inert');
  strip.querySelectorAll('[data-cherry-engagement-continuity-step], [data-cherry-engagement-step-boundary]').forEach((node) => {
    enforceCherryStepNodePassivity(node);
    if (node.matches('[data-cherry-engagement-continuity-step]')) {
      enforceCherryStepDescendantPassivity(node);
    }
  });
}

function clearCherryStepBoundary(strip) {
  strip.removeAttribute('aria-describedby');
  strip.querySelectorAll('[data-cherry-engagement-step-boundary]').forEach((node) => node.remove());
}

function ensureCherryStepBoundary(strip) {
  const existing = Array.from(strip.querySelectorAll('[data-cherry-engagement-step-boundary]'));
  let description = existing.shift();
  existing.forEach((node) => node.remove());

  if (!(description instanceof HTMLElement)) {
    description = document.createElement('span');
    description.dataset.cherryEngagementStepBoundary = 'synthetic-demo-only';
    strip.appendChild(description);
  }

  description.id = CHERRY_STEP_BOUNDARY_ID;
  description.hidden = true;
  enforceCherryStepNodePassivity(description);
  description.textContent = CHERRY_STEP_BOUNDARY_TEXT;
  if (strip.getAttribute('aria-describedby') !== CHERRY_STEP_BOUNDARY_ID) {
    strip.setAttribute('aria-describedby', CHERRY_STEP_BOUNDARY_ID);
  }
}

function clearCherryStepOrientation(strip) {
  enforceCherryStepPassivity(strip);
  stripCherryStepCanonicalAriaTampering(strip);
  strip.removeAttribute('role');
  strip.removeAttribute('aria-label');
  strip.removeAttribute('data-cherry-engagement-step-list');
  clearCherryStepBoundary(strip);

  strip.querySelectorAll('[data-cherry-engagement-continuity-step]').forEach((step) => {
    stripCherryStepCanonicalAriaTampering(step);
    step.removeAttribute('role');
    step.removeAttribute('aria-current');
    step.removeAttribute('aria-label');
    step.removeAttribute('aria-posinset');
    step.removeAttribute('aria-setsize');
    step.removeAttribute('data-cherry-engagement-step-orientation');
  });
}

function enhanceCherryStepOrientation() {
  cherryStepOrientationQueued = false;
  const strip = document.querySelector('[data-cherry-engagement-continuity]');
  if (!(strip instanceof HTMLElement)) return;

  enforceCherryStepPassivity(strip);

  const stage = strip.dataset.cherryEngagementContinuityStage;
  const orientation = Object.prototype.hasOwnProperty.call(CHERRY_STEP_ORIENTATION, stage)
    ? CHERRY_STEP_ORIENTATION[stage]
    : null;
  const steps = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-step]'));

  const stepIds = steps.map((step) => step.dataset.cherryEngagementContinuityStep);
  const validStepSet = steps.length === CHERRY_STEP_SEQUENCE.length
    && stepIds.every((id, index) => id === CHERRY_STEP_SEQUENCE[index])
    && steps.every((step) => step instanceof HTMLElement && step.tagName === CHERRY_STEP_TRUSTED_ELEMENT);

  if (!orientation || !validStepSet) {
    clearCherryStepOrientation(strip);
    return;
  }

  stripCherryStepCanonicalAriaTampering(strip, CHERRY_STEP_LIST_ALLOWED_ARIA_ATTRIBUTES);
  if (strip.getAttribute('role') !== 'list') strip.setAttribute('role', 'list');
  if (strip.getAttribute('aria-label') !== CHERRY_STEP_LIST_LABEL) strip.setAttribute('aria-label', CHERRY_STEP_LIST_LABEL);
  strip.dataset.cherryEngagementStepList = 'synthetic';
  ensureCherryStepBoundary(strip);
  enforceCherryStepPassivity(strip);

  steps.forEach((step, index) => {
    const id = step.dataset.cherryEngagementContinuityStep;
    const status = orientation[id];
    const label = CHERRY_STEP_LABELS[id];
    const statusLabel = CHERRY_STEP_STATUS_LABELS[status];
    const accessibleLabel = `${label}. ${statusLabel}.`;

    stripCherryStepCanonicalAriaTampering(step, CHERRY_STEP_ITEM_ALLOWED_ARIA_ATTRIBUTES);
    if (step.getAttribute('role') !== 'listitem') step.setAttribute('role', 'listitem');
    if (step.getAttribute('aria-posinset') !== String(index + 1)) step.setAttribute('aria-posinset', String(index + 1));
    if (step.getAttribute('aria-setsize') !== CHERRY_STEP_SET_SIZE) step.setAttribute('aria-setsize', CHERRY_STEP_SET_SIZE);
    step.dataset.cherryEngagementStepOrientation = status;
    if (step.getAttribute('aria-label') !== accessibleLabel) step.setAttribute('aria-label', accessibleLabel);
    if (status === 'current') {
      if (step.getAttribute('aria-current') !== 'step') step.setAttribute('aria-current', 'step');
    } else if (step.hasAttribute('aria-current')) {
      step.removeAttribute('aria-current');
    }
  });
}

function scheduleCherryStepOrientation() {
  if (cherryStepOrientationQueued) return;
  cherryStepOrientationQueued = true;
  requestAnimationFrame(enhanceCherryStepOrientation);
}

const cherryStepOrientationApp = document.getElementById('app');
if (cherryStepOrientationApp) {
  new MutationObserver(scheduleCherryStepOrientation).observe(cherryStepOrientationApp, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'data-cherry-engagement-continuity-stage',
      'tabindex',
      'contenteditable',
      'draggable',
      'inert',
      'role',
      ...CHERRY_STEP_CANONICAL_ARIA_ATTRIBUTES,
    ],
  });
}
window.addEventListener('hashchange', scheduleCherryStepOrientation);
queueMicrotask(enhanceCherryStepOrientation);
