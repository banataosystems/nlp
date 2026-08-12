/* WorldStage / Cherry — bounded structural convergence for the synthetic continuity surface.
   If a trusted continuity strip acquires duplicate/missing critical owner-action or handoff markers,
   or a normal DOM rebuild exposes a stage that no longer matches sanitized local flow, remove the
   stale strip and request the existing renderer to rebuild from sanitized local flow. Direct stage
   attribute tampering remains owned by the dedicated semantic fail-closed boundary; this observer
   intentionally does not subscribe to that attribute. No persistence, provider access, analytics,
   spending, destructive production behavior, or release authority. */

const CHERRY_STRUCTURAL_REBUILD_EVENT = 'worldstage:synthetic-flow-state-changed';
const CHERRY_STRUCTURAL_REBUILD_REASON = 'continuity-structural-reconcile';
const CHERRY_STRUCTURAL_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_STRUCTURAL_FLOW_VERSION = 1;
const CHERRY_STRUCTURAL_REQUIRED_SELECTORS = Object.freeze([
  '[data-cherry-engagement-owner-action]',
  '[data-cherry-engagement-continuity-current]',
  '[data-cherry-engagement-continuity-detail]',
  '[data-cherry-engagement-continuity-resume]',
  '[data-cherry-engagement-continuity-handoff]',
  '[data-cherry-engagement-continuity-previous-label]',
  '[data-cherry-engagement-continuity-prepared]',
  '[data-cherry-engagement-continuity-next]',
  '[data-cherry-engagement-continuity-attention-cue]',
  '[data-cherry-engagement-continuity-attention-reason]',
]);

let cherryStructuralRebuildQueued = false;

function cherryStructuralExpectedStage() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(CHERRY_STRUCTURAL_FLOW_KEY) || 'null');
  } catch {
    stored = null;
  }
  if (!stored || stored.version !== CHERRY_STRUCTURAL_FLOW_VERSION) return 'discovery';
  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  if (!discoveryPrepared) return 'discovery';
  if (!ownerReviewed) return 'review';
  return 'record';
}

function cherryStructuralStripIsCanonical(strip) {
  if (!(strip instanceof HTMLElement)) return false;
  if (strip.dataset.cherryEngagementContinuityStage !== cherryStructuralExpectedStage()) return false;
  return CHERRY_STRUCTURAL_REQUIRED_SELECTORS.every((selector) => strip.querySelectorAll(selector).length === 1);
}

function repairCherryStructuralContinuity() {
  cherryStructuralRebuildQueued = false;
  const strips = Array.from(document.querySelectorAll('[data-cherry-engagement-continuity]'));
  if (strips.length === 0) return;

  const corrupted = strips.length !== 1 || strips.some((strip) => !cherryStructuralStripIsCanonical(strip));
  if (!corrupted) return;

  strips.forEach((strip) => strip.remove());
  window.dispatchEvent(new CustomEvent(CHERRY_STRUCTURAL_REBUILD_EVENT, {
    detail: { reason: CHERRY_STRUCTURAL_REBUILD_REASON },
  }));
}

function scheduleCherryStructuralRebuild() {
  if (cherryStructuralRebuildQueued) return;
  cherryStructuralRebuildQueued = true;
  queueMicrotask(repairCherryStructuralContinuity);
}

const cherryStructuralRebuildApp = document.getElementById('app');
if (cherryStructuralRebuildApp) {
  new MutationObserver(scheduleCherryStructuralRebuild).observe(cherryStructuralRebuildApp, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'data-cherry-engagement-continuity',
      'data-cherry-engagement-owner-action',
      'data-cherry-engagement-continuity-current',
      'data-cherry-engagement-continuity-detail',
      'data-cherry-engagement-continuity-resume',
      'data-cherry-engagement-continuity-handoff',
      'data-cherry-engagement-continuity-previous-label',
      'data-cherry-engagement-continuity-prepared',
      'data-cherry-engagement-continuity-next',
      'data-cherry-engagement-continuity-attention-cue',
      'data-cherry-engagement-continuity-attention-reason',
    ],
  });
}
queueMicrotask(repairCherryStructuralContinuity);
