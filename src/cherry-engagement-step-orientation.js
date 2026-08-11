/* WorldStage / Cherry — accessibility-only semantic orientation for the fixed synthetic continuity steps.
   Derives solely from the sanitized continuity stage emitted by cherry-engagement-continuity.js.
   Exactly one allowlisted step is current. No focus movement, persistence, provider access, analytics,
   scoring, private data, spending, or release authority. */

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

let cherryStepOrientationQueued = false;

function clearCherryStepOrientation(strip) {
  strip.querySelectorAll('[data-cherry-engagement-continuity-step]').forEach((step) => {
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
  const validStepSet = steps.length === 3
    && new Set(stepIds).size === 3
    && stepIds.every((id) => Object.prototype.hasOwnProperty.call(CHERRY_STEP_LABELS, id));

  if (!orientation || !validStepSet) {
    clearCherryStepOrientation(strip);
    return;
  }

  steps.forEach((step) => {
    const id = step.dataset.cherryEngagementContinuityStep;
    const status = orientation[id];
    const label = CHERRY_STEP_LABELS[id];
    const statusLabel = CHERRY_STEP_STATUS_LABELS[status];

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
