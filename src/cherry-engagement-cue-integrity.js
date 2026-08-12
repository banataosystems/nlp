/* WorldStage / Cherry — fail-closed integrity for synthetic owner-action, attention, completion, and handoff provenance cues.
   Derives only from the sanitized local synthetic engagement-flow state already used by the continuity renderer.
   Direct DOM mutation can neither redirect Resume to another allowlisted stage, spoof the current owner-action stage, create Cherry urgency, claim synthetic completion, nor spoof prior/prepared/next handoff provenance unsupported by that state.
   Unexpected/non-allowlisted Resume routes are deliberately left fail-closed for the dedicated read-only consequence/live-region/Room guards; the Resume click handler independently derives its destination from sanitized flow at activation time.
   Structural cue corruption removes the continuity strip so the existing renderer can restore the canonical surface.
   No persistence, provider access, analytics, scoring, private data, spending, or release authority. */

const CHERRY_CUE_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_CUE_FLOW_VERSION = 1;
const CHERRY_CUE_RESUME_ROUTES = new Set(['discovery', 'cockpit', 'client']);
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
const CHERRY_CUE_PREVIOUS = Object.freeze({
  none: 'None',
  discovery: 'Discovery',
  review: 'Cherry review',
});
const CHERRY_CUE_HANDOFF_ARIA_LABEL = 'Synthetic engagement handoff cue';
const CHERRY_CUE_ATTENTION_ARIA_LABEL = 'Fixed synthetic owner attention cue';
const CHERRY_CUE_OWNER_ACTION_ARIA_LABEL = 'Synthetic owner action card';
const CHERRY_CUE_COMPLETION_TEXT = 'Completed local-demo state is preserved until Start a new synthetic engagement is deliberately tapped.';
const CHERRY_CUE_TRACKED_ATTRIBUTES = Object.freeze([
  'data-cherry-engagement-continuity-signature',
  'data-cherry-engagement-continuity-stage',
  'data-cherry-engagement-continuity-previous',
  'data-cherry-engagement-continuity-attention',
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
  'data-cherry-engagement-continuity-complete',
  'data-cherry-engagement-continuity-completion',
  'aria-label',
  'type',
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

function cherryCueExpectedPrevious(flow) {
  if (!flow.discoveryPrepared) return { id: 'none', label: CHERRY_CUE_PREVIOUS.none };
  if (!flow.ownerReviewed) return { id: 'discovery', label: CHERRY_CUE_PREVIOUS.discovery };
  return { id: 'review', label: CHERRY_CUE_PREVIOUS.review };
}

function cherryCueExpectedCurrent(flow) {
  if (!flow.discoveryPrepared) {
    return {
      id: 'discovery',
      label: 'Discovery',
      route: 'discovery',
      detail: 'Resume the fixed synthetic Discovery brief. No client form values are read into this card.',
      prepared: 'Prepared: owner cockpit shell and fixed synthetic engagement flow only.',
      next: 'Next: prepare the fixed synthetic Discovery brief.',
    };
  }

  if (!flow.ownerReviewed) {
    return {
      id: 'review',
      label: 'Cherry review',
      route: 'cockpit',
      detail: 'Resume the existing synthetic Cherry judgment step on this phone view.',
      prepared: 'Prepared: fixed synthetic Discovery brief.',
      next: 'Next: complete the existing local-demo Cherry review.',
    };
  }

  return {
    id: 'record',
    label: 'Transformation Record',
    route: 'client',
    detail: flow.recordPrepared
      ? 'Resume the existing local synthetic Transformation Record review.'
      : 'Resume preparation of the existing local synthetic Transformation Record.',
    prepared: flow.recordPrepared
      ? 'Prepared: Discovery brief, Cherry review, and local synthetic Transformation Record.'
      : 'Prepared: Discovery brief and Cherry review.',
    next: flow.recordPrepared
      ? 'Next: review the existing local synthetic Transformation Record.'
      : 'Next: prepare the local synthetic Transformation Record.',
  };
}

function cherryCueExpectedSignature(flow, current, previous, attention) {
  return [
    flow.discoveryPrepared ? 'd1' : 'd0',
    flow.ownerReviewed ? 'o1' : 'o0',
    flow.recordPrepared ? 'r1' : 'r0',
    current.id,
    previous.id,
    attention.id,
  ].join(':');
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
  const previous = cherryCueExpectedPrevious(flow);
  const current = cherryCueExpectedCurrent(flow);
  const signature = cherryCueExpectedSignature(flow, current, previous, attention);

  if (strip.dataset.cherryEngagementContinuitySignature !== signature) {
    strip.dataset.cherryEngagementContinuitySignature = signature;
  }
  // The root current-stage marker is owned by the existing stage/visual integrity guards.
  // Do not eagerly repair it here: a flow-inconsistent mutation must remain observable long
  // enough for those guards to clear trusted list/current/visual semantics fail-closed.
  if (strip.dataset.cherryEngagementContinuityPrevious !== previous.id) {
    strip.dataset.cherryEngagementContinuityPrevious = previous.id;
  }
  if (strip.dataset.cherryEngagementContinuityAttention !== attention.id) {
    strip.dataset.cherryEngagementContinuityAttention = attention.id;
  }

  const ownerActions = Array.from(strip.querySelectorAll('[data-cherry-engagement-owner-action]'));
  if (ownerActions.length !== 1 || !(ownerActions[0] instanceof HTMLElement)) {
    invalidateCherryCueSurface(strip);
    return;
  }

  const ownerAction = ownerActions[0];
  const currentLabels = Array.from(ownerAction.querySelectorAll('[data-cherry-engagement-continuity-current]'));
  const details = Array.from(ownerAction.querySelectorAll('[data-cherry-engagement-continuity-detail]'));
  const resumes = Array.from(ownerAction.querySelectorAll('[data-cherry-engagement-continuity-resume]'));
  if (
    currentLabels.length !== 1 || !(currentLabels[0] instanceof HTMLElement)
    || details.length !== 1 || !(details[0] instanceof HTMLElement)
    || resumes.length !== 1 || !(resumes[0] instanceof HTMLButtonElement)
  ) {
    invalidateCherryCueSurface(strip);
    return;
  }

  const resume = resumes[0];
  if (ownerAction.getAttribute('aria-label') !== CHERRY_CUE_OWNER_ACTION_ARIA_LABEL) {
    ownerAction.setAttribute('aria-label', CHERRY_CUE_OWNER_ACTION_ARIA_LABEL);
  }
  if (currentLabels[0].textContent !== current.label) currentLabels[0].textContent = current.label;
  if (details[0].textContent !== current.detail) details[0].textContent = current.detail;

  const resumeRoute = resume.dataset.cherryEngagementContinuityResume;
  if (!resumeRoute) {
    invalidateCherryCueSurface(strip);
    return;
  }
  // A wrong but allowlisted destination is ordinary spoofing and is repaired. A non-allowlisted
  // route is intentionally left untouched so the existing consequence/live-region/Room guards
  // can observe it and fail closed. Activation remains safe because the click listener does not
  // trust this dataset; it re-derives the route from sanitized flow immediately before navigation.
  if (CHERRY_CUE_RESUME_ROUTES.has(resumeRoute) && resumeRoute !== current.route) {
    resume.dataset.cherryEngagementContinuityResume = current.route;
  }
  if (resume.getAttribute('aria-label') !== `Resume ${current.label}`) {
    resume.setAttribute('aria-label', `Resume ${current.label}`);
  }
  if (resume.getAttribute('type') !== 'button') resume.setAttribute('type', 'button');

  const handoffs = Array.from(strip.querySelectorAll('[data-cherry-engagement-continuity-handoff]'));
  if (handoffs.length !== 1 || !(handoffs[0] instanceof HTMLElement)) {
    invalidateCherryCueSurface(strip);
    return;
  }

  const handoff = handoffs[0];
  const previousLabels = Array.from(handoff.querySelectorAll('[data-cherry-engagement-continuity-previous-label]'));
  const preparedLabels = Array.from(handoff.querySelectorAll('[data-cherry-engagement-continuity-prepared]'));
  const nextLabels = Array.from(handoff.querySelectorAll('[data-cherry-engagement-continuity-next]'));
  if (
    previousLabels.length !== 1 || !(previousLabels[0] instanceof HTMLElement)
    || preparedLabels.length !== 1 || !(preparedLabels[0] instanceof HTMLElement)
    || nextLabels.length !== 1 || !(nextLabels[0] instanceof HTMLElement)
  ) {
    invalidateCherryCueSurface(strip);
    return;
  }

  const expectedPreviousText = `Previous stage: ${previous.label}.`;
  if (handoff.getAttribute('aria-label') !== CHERRY_CUE_HANDOFF_ARIA_LABEL) {
    handoff.setAttribute('aria-label', CHERRY_CUE_HANDOFF_ARIA_LABEL);
  }
  if (previousLabels[0].textContent !== expectedPreviousText) previousLabels[0].textContent = expectedPreviousText;
  if (preparedLabels[0].textContent !== current.prepared) preparedLabels[0].textContent = current.prepared;
  if (nextLabels[0].textContent !== current.next) nextLabels[0].textContent = current.next;

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
