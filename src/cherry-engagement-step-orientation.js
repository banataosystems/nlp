/* WorldStage / Cherry — accessibility-only semantic orientation for the fixed synthetic continuity steps.
   Derives solely from the sanitized continuity stage emitted by cherry-engagement-continuity.js.
   Exactly one allowlisted step is current. The fixed three-step sequence is exposed as one semantic list.
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
const CHERRY_STEP_LIST_LABEL = 'Synthetic engagement stages';

let cherryStepOrientationQueued = false;

function clearCherryStepOrientation(strip) {
  strip.removeAttribute('role');
  strip.removeAttribute('aria-label');
  strip.removeAttribute('data-cherry-engagement-step-list');

  strip.querySelectorAll('[data-cherry-engagement-continuity-step]').forEach((step) => {
    step.removeAttribute('role');
    step.removeAttribute('aria-current');
    step.removeAttribute('aria-label');
    step.removeAttribute('data-cherry-engagement-step-orientation');
  });
}

function enhanceCherryStepOrientation() {
  cherryStepOrientationQueued = false;
  const strip = document.querySelector('[data-cherry-engagement-continuity]');
  if (!(strip instanceof HTMLElement)) return;

  const stage = strip.dataset.cherryEngagementContinuityStage;
  const orientation = Object.prototype.hasOwnProperty.call(CHERRY_STEP_ORIENTATION, stage)
    ? CHERRY_STEP_ORIENTATION[stage]
    : null;
  const steps = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-step]'));

  const stepIds = steps.map((step) => step.dataset.cherryEngagementContinuityStep);
  const validStepSet = steps.length === CHERRY_STEP_SEQUENCE.length
    && stepIds.every((id, index) => id === CHERRY_STEP_SEQUENCE[index]);

  if (!orientation || !validStepSet) {
    clearCherryStepOrientation(strip);
    return;
  }

  strip.setAttribute('role', 'list');
  strip.setAttribute('aria-label', CHERRY_STEP_LIST_LABEL);
  strip.dataset.cherryEngagementStepList = 'synthetic';

  steps.forEach((step) => {
    const id = step.dataset.cherryEngagementContinuityStep;
    const status = orientation[id];
    const label = CHERRY_STEP_LABELS[id];
    const statusLabel = CHERRY_STEP_STATUS_LABELS[status];

    step.setAttribute('role', 'listitem');
    step.dataset.cherryEngagementStepOrientation = status;
    step.setAttribute('aria-label', `${label}. ${statusLabel}.`);
    if (status === 'current') step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
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
    attributeFilter: ['data-cherry-engagement-continuity-stage'],
  });
}
window.addEventListener('hashchange', scheduleCherryStepOrientation);
queueMicrotask(enhanceCherryStepOrientation);
