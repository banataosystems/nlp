/* WorldStage / Cherry — compact synthetic engagement continuity strip.
   Reads only the existing allowlisted local demo engagement-flow state and performs navigation/focus only.
   The completion boundary delegates only to the existing local synthetic reset control.
   No free text, new persistence, private-source access, scoring, provider writes, or release authority. */

const CHERRY_CONTINUITY_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_CONTINUITY_FLOW_VERSION = 1;
const CHERRY_CONTINUITY_FLOW_CHANGED_EVENT = 'worldstage:synthetic-flow-state-changed';
const CHERRY_CONTINUITY_ROUTES = new Set(['discovery', 'cockpit', 'client']);
const CHERRY_CONTINUITY_STAGES = Object.freeze([
  { id: 'discovery', label: 'Discovery', route: 'discovery' },
  { id: 'review', label: 'Cherry review', route: 'cockpit' },
  { id: 'record', label: 'Transformation Record', route: 'client' },
]);
const CHERRY_CONTINUITY_PREVIOUS = Object.freeze({
  none: 'None',
  discovery: 'Discovery',
  review: 'Cherry review',
});
const CHERRY_CONTINUITY_ATTENTION = Object.freeze({
  needsCherry: Object.freeze({
    id: 'needs-cherry',
    label: 'Needs Cherry now',
    reason: 'Current stage requires Cherry review',
  }),
  preparedFlow: Object.freeze({
    id: 'prepared-flow',
    label: 'Continue prepared flow',
    reason: 'Current stage can continue through prepared synthetic flow',
  }),
});

let cherryContinuityRefreshQueued = false;

function cherryContinuitySafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryContinuityFlowState() {
  const stored = cherryContinuitySafeJson(CHERRY_CONTINUITY_FLOW_KEY);
  if (!stored || stored.version !== CHERRY_CONTINUITY_FLOW_VERSION) {
    return { discoveryPrepared: false, ownerReviewed: false, recordPrepared: false };
  }

  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  const recordPrepared = ownerReviewed && stored.recordPrepared === true;
  return { discoveryPrepared, ownerReviewed, recordPrepared };
}

function cherryContinuityPrevious(flow) {
  if (!flow.discoveryPrepared) return { id: 'none', label: CHERRY_CONTINUITY_PREVIOUS.none };
  if (!flow.ownerReviewed) return { id: 'discovery', label: CHERRY_CONTINUITY_PREVIOUS.discovery };
  return { id: 'review', label: CHERRY_CONTINUITY_PREVIOUS.review };
}

function cherryContinuityCurrent(flow) {
  if (!flow.discoveryPrepared) {
    return {
      index: 0,
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
      index: 1,
      id: 'review',
      label: 'Cherry review',
      route: 'cockpit',
      detail: 'Resume the existing synthetic Cherry judgment step on this phone view.',
      prepared: 'Prepared: fixed synthetic Discovery brief.',
      next: 'Next: complete the existing local-demo Cherry review.',
    };
  }
  return {
    index: 2,
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

function cherryContinuityAttention(current) {
  return current.id === 'review'
    ? CHERRY_CONTINUITY_ATTENTION.needsCherry
    : CHERRY_CONTINUITY_ATTENTION.preparedFlow;
}

function cherryContinuityStepStatus(index, currentIndex, flow) {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return flow.recordPrepared && index === 2 ? 'complete-current' : 'current';
  return 'upcoming';
}

function cherryContinuitySignature(flow, current, previous, attention) {
  return [
    flow.discoveryPrepared ? 'd1' : 'd0',
    flow.ownerReviewed ? 'o1' : 'o0',
    flow.recordPrepared ? 'r1' : 'r0',
    current.id,
    previous.id,
    attention.id,
  ].join(':');
}

function cherryContinuityMarkup(flow, current, previous, attention, signature) {
  const completionCue = flow.recordPrepared
    ? '<p data-cherry-engagement-continuity-completion>Completed local-demo state is preserved until Start a new synthetic engagement is deliberately tapped.</p>'
    : '';
  const startNew = flow.recordPrepared
    ? '<div class="cherry-engagement-continuity__completion-actions"><button type="button" data-cherry-engagement-continuity-start-new>Start a new synthetic engagement →</button></div>'
    : '';

  return `<section class="cherry-engagement-continuity" data-cherry-engagement-continuity data-cherry-engagement-continuity-signature="${signature}" data-cherry-engagement-continuity-stage="${current.id}" data-cherry-engagement-continuity-previous="${previous.id}" data-cherry-engagement-continuity-attention="${attention.id}"${flow.recordPrepared ? ' data-cherry-engagement-continuity-complete="true"' : ''} aria-label="Synthetic engagement continuity">
    <div class="cherry-engagement-continuity__owner-action" data-cherry-engagement-owner-action aria-label="Synthetic owner action card">
      <div class="cherry-engagement-continuity__copy">
        <span>OWNER ACTION · LOCAL SYNTHETIC DEMO</span>
        <strong data-cherry-engagement-continuity-current>${current.label}</strong>
        <div class="cherry-engagement-continuity__attention" data-cherry-engagement-continuity-attention-cue="${attention.id}" aria-label="Fixed synthetic owner attention cue">
          <span>OWNER ATTENTION · READ ONLY</span>
          <strong>${attention.label}</strong>
          <small data-cherry-engagement-continuity-attention-reason>${attention.reason}</small>
        </div>
        <p data-cherry-engagement-continuity-detail>${current.detail}</p>
        <div class="cherry-engagement-continuity__handoff" data-cherry-engagement-continuity-handoff aria-label="Synthetic engagement handoff cue">
          <span>WHAT'S READY / WHAT'S NEXT · READ ONLY</span>
          <p data-cherry-engagement-continuity-previous-label>Previous stage: ${previous.label}.</p>
          <p data-cherry-engagement-continuity-prepared>${current.prepared}</p>
          <p data-cherry-engagement-continuity-next>${current.next}</p>
          ${completionCue}
        </div>
      </div>
      <div class="cherry-engagement-continuity__actions">
        <button type="button" data-cherry-engagement-continuity-resume="${current.route}" aria-label="Resume ${current.label}">Resume →</button>
      </div>
    </div>
    <div class="cherry-engagement-continuity__steps" aria-label="Discovery, Cherry review, Transformation Record">
      ${CHERRY_CONTINUITY_STAGES.map((stage, index) => {
        const status = cherryContinuityStepStatus(index, current.index, flow);
        return `<article data-cherry-engagement-continuity-step="${stage.id}" data-cherry-engagement-continuity-status="${status}">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <strong>${stage.label}</strong>
        </article>`;
      }).join('')}
    </div>
    ${startNew}
  </section>`;
}

function cherryContinuityRoute() {
  return location.hash.replace('#/', '').replace('#', '') || 'home';
}

function cherryContinuityResume(route) {
  if (!CHERRY_CONTINUITY_ROUTES.has(route)) return;

  if (route === 'cockpit' && cherryContinuityRoute() === 'cockpit') {
    const action = document.querySelector('[data-synthetic-flow-action="owner-review"]');
    if (action instanceof HTMLButtonElement) {
      action.scrollIntoView({ block: 'center', behavior: 'smooth' });
      requestAnimationFrame(() => action.focus({ preventScroll: true }));
      return;
    }
  }

  location.hash = `#/${route}`;
}

function cherryContinuityStartNewSynthetic() {
  const reset = document.querySelector('[data-synthetic-flow-reset]');
  if (!(reset instanceof HTMLButtonElement)) return false;
  reset.click();
  return true;
}

function enhanceCherryEngagementContinuity() {
  cherryContinuityRefreshQueued = false;
  const existing = document.querySelector('[data-cherry-engagement-continuity]');
  if (cherryContinuityRoute() !== 'cockpit') {
    existing?.remove();
    return;
  }

  const summary = document.querySelector('[data-cherry-owner-summary]');
  const header = summary?.querySelector('.cherry-owner-summary__header');
  if (!(summary instanceof HTMLElement) || !(header instanceof HTMLElement)) {
    existing?.remove();
    return;
  }

  const flow = cherryContinuityFlowState();
  const current = cherryContinuityCurrent(flow);
  const previous = cherryContinuityPrevious(flow);
  const attention = cherryContinuityAttention(current);
  const signature = cherryContinuitySignature(flow, current, previous, attention);
  if (existing?.dataset.cherryEngagementContinuitySignature === signature && existing.parentElement === summary) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = cherryContinuityMarkup(flow, current, previous, attention, signature);
  const strip = wrapper.firstElementChild;
  if (!(strip instanceof HTMLElement)) return;

  strip.querySelector('[data-cherry-engagement-continuity-resume]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    const currentAtActivation = cherryContinuityCurrent(cherryContinuityFlowState());
    cherryContinuityResume(currentAtActivation.route);
  });

  strip.querySelector('[data-cherry-engagement-continuity-start-new]')?.addEventListener('click', () => {
    if (!cherryContinuityFlowState().recordPrepared) return;
    cherryContinuityStartNewSynthetic();
  });

  if (existing) existing.replaceWith(strip);
  else header.insertAdjacentElement('afterend', strip);
}

function scheduleCherryEngagementContinuity() {
  if (cherryContinuityRefreshQueued) return;
  cherryContinuityRefreshQueued = true;
  requestAnimationFrame(enhanceCherryEngagementContinuity);
}

const cherryContinuityApp = document.getElementById('app');
if (cherryContinuityApp) {
  new MutationObserver(scheduleCherryEngagementContinuity)
    .observe(cherryContinuityApp, { childList: true, subtree: true });
}
window.addEventListener('hashchange', scheduleCherryEngagementContinuity);
window.addEventListener(CHERRY_CONTINUITY_FLOW_CHANGED_EVENT, scheduleCherryEngagementContinuity);
window.addEventListener('storage', (event) => {
  if (event.key === CHERRY_CONTINUITY_FLOW_KEY) scheduleCherryEngagementContinuity();
});
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element
    ? event.target.closest('[data-synthetic-flow-action], [data-synthetic-flow-reset]')
    : null;
  if (target) queueMicrotask(scheduleCherryEngagementContinuity);
});
queueMicrotask(enhanceCherryEngagementContinuity);