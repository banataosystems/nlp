/* WorldStage / Cherry — canonical local-reset transition integrity.
   When the existing local synthetic reset emits its allowlisted reset event, any stale completed
   continuity surface is invalidated only after the sanitized local flow proves the reset occurred.
   The existing continuity renderer then rebuilds from that sanitized flow. This module adds no
   persistence, provider access, analytics, spending, destructive production behavior, or release authority. */

const CHERRY_RESET_TRANSITION_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_RESET_TRANSITION_FLOW_VERSION = 1;
const CHERRY_RESET_TRANSITION_EVENT = 'worldstage:synthetic-flow-state-changed';

let cherryResetTransitionRepairQueued = false;

function cherryResetTransitionSafeJson() {
  try {
    return JSON.parse(localStorage.getItem(CHERRY_RESET_TRANSITION_FLOW_KEY) || 'null');
  } catch {
    return null;
  }
}

function cherryResetTransitionIsCanonicalEmptyFlow() {
  const stored = cherryResetTransitionSafeJson();
  if (stored === null) return true;
  if (!stored || stored.version !== CHERRY_RESET_TRANSITION_FLOW_VERSION) return false;
  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  const recordPrepared = ownerReviewed && stored.recordPrepared === true;
  return !discoveryPrepared && !ownerReviewed && !recordPrepared;
}

function repairCherryResetTransition() {
  cherryResetTransitionRepairQueued = false;
  if (!cherryResetTransitionIsCanonicalEmptyFlow()) return;

  const strips = Array.from(document.querySelectorAll('[data-cherry-engagement-continuity]'));
  if (strips.length === 0) return;
  if (strips.length !== 1 || !(strips[0] instanceof HTMLElement)) {
    strips.forEach((strip) => strip.remove());
    return;
  }

  const strip = strips[0];
  const staleCompletedSurface = strip.dataset.cherryEngagementContinuityStage !== 'discovery'
    || strip.hasAttribute('data-cherry-engagement-continuity-complete')
    || strip.querySelector('[data-cherry-engagement-continuity-start-new]') instanceof Element
    || strip.querySelector('[data-cherry-engagement-reset-confirmation]') instanceof Element;
  if (staleCompletedSurface) strip.remove();
}

function scheduleCherryResetTransitionRepair() {
  if (cherryResetTransitionRepairQueued) return;
  cherryResetTransitionRepairQueued = true;
  queueMicrotask(() => {
    repairCherryResetTransition();
    requestAnimationFrame(repairCherryResetTransition);
  });
}

window.addEventListener(CHERRY_RESET_TRANSITION_EVENT, (event) => {
  const detail = event instanceof CustomEvent ? event.detail : null;
  if (detail?.reason !== 'reset') return;
  scheduleCherryResetTransitionRepair();
});
