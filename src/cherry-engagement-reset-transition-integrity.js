/* WorldStage / Cherry — canonical local-reset transition integrity.
   When the existing local synthetic reset emits its allowlisted reset event, stale completed
   continuity is invalidated only after sanitized local flow proves the reset occurred. A bounded
   reconciliation event then asks the existing continuity renderer to rebuild from sanitized flow.
   No persistence, provider access, analytics, spending, destructive production behavior, or release authority. */

const CHERRY_RESET_TRANSITION_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_RESET_TRANSITION_FLOW_VERSION = 1;
const CHERRY_RESET_TRANSITION_EVENT = 'worldstage:synthetic-flow-state-changed';
const CHERRY_RESET_TRANSITION_RECONCILE_REASON = 'reset-transition-reconcile';

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

function cherryResetTransitionStale(strip) {
  if (!(strip instanceof HTMLElement)) return true;
  return strip.dataset.cherryEngagementContinuityStage !== 'discovery'
    || strip.hasAttribute('data-cherry-engagement-continuity-complete')
    || strip.querySelector('[data-cherry-engagement-continuity-start-new]') instanceof Element
    || strip.querySelector('[data-cherry-engagement-reset-confirmation]') instanceof Element;
}

function repairCherryResetTransition() {
  if (!cherryResetTransitionIsCanonicalEmptyFlow()) return false;

  const strips = Array.from(document.querySelectorAll('[data-cherry-engagement-continuity]'));
  if (strips.length === 0) return true;
  if (strips.length !== 1 || strips.some((strip) => cherryResetTransitionStale(strip))) {
    strips.forEach((strip) => strip.remove());
    return true;
  }
  return false;
}

function requestCherryResetTransitionReconcile() {
  window.dispatchEvent(new CustomEvent(CHERRY_RESET_TRANSITION_EVENT, {
    detail: { reason: CHERRY_RESET_TRANSITION_RECONCILE_REASON },
  }));
}

function reconcileCherryResetTransition() {
  if (!cherryResetTransitionIsCanonicalEmptyFlow()) return;
  repairCherryResetTransition();
  requestCherryResetTransitionReconcile();
}

function scheduleCherryResetTransitionRepair() {
  if (cherryResetTransitionRepairQueued) return;
  cherryResetTransitionRepairQueued = true;
  queueMicrotask(() => {
    reconcileCherryResetTransition();
    requestAnimationFrame(() => {
      reconcileCherryResetTransition();
      requestAnimationFrame(() => {
        reconcileCherryResetTransition();
        cherryResetTransitionRepairQueued = false;
      });
    });
  });
}

window.addEventListener(CHERRY_RESET_TRANSITION_EVENT, (event) => {
  const detail = event instanceof CustomEvent ? event.detail : null;
  if (detail?.reason !== 'reset') return;
  scheduleCherryResetTransitionRepair();
});
