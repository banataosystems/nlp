/* WorldStage / Cherry — bounded structural convergence for the synthetic continuity surface.
   If a trusted continuity strip acquires duplicate/missing critical owner-action or handoff markers,
   remove the corrupted strip and request the existing renderer to rebuild from sanitized local flow.
   This module does not persist data, call providers, emit analytics, spend money, or grant release authority. */

const CHERRY_STRUCTURAL_REBUILD_EVENT = 'worldstage:synthetic-flow-state-changed';
const CHERRY_STRUCTURAL_REBUILD_REASON = 'continuity-structural-reconcile';
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

function cherryStructuralStripIsCanonical(strip) {
  if (!(strip instanceof HTMLElement)) return false;
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
