/* WorldStage / Cherry — fail-closed integrity for synthetic owner-attention and completion cues.
   Derives only from the sanitized local synthetic engagement-flow state already used by the continuity renderer.
   Direct DOM mutation can neither create Cherry urgency nor claim synthetic completion unsupported by that state.
   Structural cue corruption removes the continuity strip so the existing renderer can restore the canonical surface.
   No persistence, provider access, analytics, scoring, private data, spending, or release authority. */

const CHERRY_CUE_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_CUE_FLOW_VERSION = 1;
const CHERRY_CUE_ATTENTION = Object.freeze({
  preparedFlow: Object.freeze({
    id: 'prepared-flow',
    label: 'Continue prepared flow',
    reason: 'Current stage can continue through prepared synthetic flow',
  }),
  needsCherry: Object.freeze({
    id: 'needs-cherry',
    label: 'Needs Cherry now',
    reason: 'Current stage requires Cherry review',
  }),
});
const CHERRY_CUE_ATTENTION_ARIA_LABEL = 'Fixed synthetic owner attention cue';
const CHERRY_CUE_COMPLETION_TEXT = 'Completed local-demo state is preserved until Start a new synthetic engagement is deliberately tapped.';
const CHERRY_CUE_TRACKED_ATTRIBUTES = Object.freeze([
  'data-cherry-engagement-continuity-attention',
  'data-cherry-engagement-continuity-attention-cue',
  'data-cherry-engagement-continuity-attention-reason',
  'data-cherry-engagement-continuity-complete',
  'data-cherry-engagement-continuity-completion',
  'aria-label',
]);

let cherryCueIntegrityQueued = false;

function cherryCueFlowState() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(CHERRY_CUE_FLOW_KEY) || 'null');
  } catch {
    stored = null;
  }

  if (!stored || stored.version !== CHERRY_CUE_FLOW_VERSION) {
    return { discoveryPrepared: false, ownerReviewed: false, recordPrepared: false };
  }

  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  const recordPrepared = ownerReviewed && stored.recordPrepared === true;
  return { discoveryPrepared, ownerReviewed, recordPrepared };
}

function cherryCueExpectedAttention(flow) {
  return flow.discoveryPrepared && !flow.ownerReviewed
    ? CHERRY_CUE_ATTENTION.needsCherry
    : CHERRY_CUE_ATTENTION.preparedFlow;
}

function invalidateCherryCueSurface(strip) {
  if (strip instanceof HTMLElement && strip.isConnected) strip.remove();
}

function repairCherryCueIntegrity() {
  cherryCueIntegrityQueued = false;
  const strip = document.querySelector('[data-cherry-engagement-continuity]');
  if (!(strip instanceof HTMLElement)) return;

  const flow = cherryCueFlowState();
  const attention = cherryCueExpectedAttention(flow);

  if (strip.dataset.cherryEngagementContinuityAttention !== attention.id) {
    strip.dataset.cherryEngagementContinuityAttention = attention.id;
  }

  const attentionCues = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-attention-cue]'));
  if (attentionCues.length !== 1 || !(attentionCues[0] instanceof HTMLElement)) {
    invalidateCherryCueSurface(strip);
    return;
  }

  const cue = attentionCues[0];
  const cueLabel = cue.querySelector('strong');
  const cueReason = cue.querySelector('[data-cherry-engagement-continuity-attention-reason]');
  if (!(cueLabel instanceof HTMLElement) || !(cueReason instanceof HTMLElement)) {
    invalidateCherryCueSurface(strip);
    return;
  }

  if (cue.dataset.cherryEngagementContinuityAttentionCue !== attention.id) {
    cue.dataset.cherryEngagementContinuityAttentionCue = attention.id;
  }
  if (cue.getAttribute('aria-label') !== CHERRY_CUE_ATTENTION_ARIA_LABEL) {
    cue.setAttribute('aria-label', CHERRY_CUE_ATTENTION_ARIA_LABEL);
  }
  if (cueLabel.textContent !== attention.label) cueLabel.textContent = attention.label;
  if (cueReason.textContent !== attention.reason) cueReason.textContent = attention.reason;

  const completionCues = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-completion]'));
  if (flow.recordPrepared) {
    if (strip.getAttribute('data-cherry-engagement-continuity-complete') !== 'true') {
      strip.setAttribute('data-cherry-engagement-continuity-complete', 'true');
    }
    if (completionCues.length !== 1 || !(completionCues[0] instanceof HTMLElement)) {
      invalidateCherryCueSurface(strip);
      return;
    }
    if (completionCues[0].textContent !== CHERRY_CUE_COMPLETION_TEXT) {
      completionCues[0].textContent = CHERRY_CUE_COMPLETION_TEXT;
    }
  } else {
    if (strip.hasAttribute('data-cherry-engagement-continuity-complete')) {
      strip.removeAttribute('data-cherry-engagement-continuity-complete');
    }
    if (completionCues.length !== 0) {
      invalidateCherryCueSurface(strip);
    }
  }
}

function scheduleCherryCueIntegrity() {
  if (cherryCueIntegrityQueued) return;
  cherryCueIntegrityQueued = true;
  requestAnimationFrame(repairCherryCueIntegrity);
}

const cherryCueIntegrityApp = document.getElementById('app');
if (cherryCueIntegrityApp) {
  new MutationObserver(scheduleCherryCueIntegrity).observe(cherryCueIntegrityApp, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: CHERRY_CUE_TRACKED_ATTRIBUTES,
  });
}
window.addEventListener('hashchange', scheduleCherryCueIntegrity);
window.addEventListener('storage', (event) => {
  if (event.key === CHERRY_CUE_FLOW_KEY) scheduleCherryCueIntegrity();
});
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element
    ? event.target.closest('[data-synthetic-flow-action], [data-synthetic-flow-reset]')
    : null;
  if (target) queueMicrotask(scheduleCherryCueIntegrity);
});
queueMicrotask(repairCherryCueIntegrity);
