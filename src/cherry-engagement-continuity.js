/* WorldStage / Cherry — compact synthetic engagement continuity strip.
   Reads only the existing allowlisted local demo engagement-flow state and performs navigation/focus only.
   No free text, new persistence, private-source access, scoring, provider writes, or release authority. */

const CHERRY_CONTINUITY_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_CONTINUITY_FLOW_VERSION = 1;
const CHERRY_CONTINUITY_ROUTES = new Set(['discovery', 'cockpit', 'client']);
const CHERRY_CONTINUITY_STAGES = Object.freeze([
  { id: 'discovery', label: 'Discovery', route: 'discovery' },
  { id: 'review', label: 'Cherry review', route: 'cockpit' },
  { id: 'record', label: 'Transformation Record', route: 'client' },
]);

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

function cherryContinuityCurrent(flow) {
  if (!flow.discoveryPrepared) {
    return {
      index: 0,
      id: 'discovery',
      label: 'Discovery',
      route: 'discovery',
      detail: 'Resume the fixed synthetic Discovery brief. No client form values are read into this strip.',
    };
  }
  if (!flow.ownerReviewed) {
    return {
      index: 1,
      id: 'review',
      label: 'Cherry review',
      route: 'cockpit',
      detail: 'Resume the existing synthetic Cherry judgment step on this phone view.',
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
  };
}

function cherryContinuityStepStatus(index, currentIndex, flow) {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return flow.recordPrepared && index === 2 ? 'complete-current' : 'current';
  return 'upcoming';
}

function cherryContinuitySignature(flow, current) {
  return [
    flow.discoveryPrepared ? 'd1' : 'd0',
    flow.ownerReviewed ? 'o1' : 'o0',
    flow.recordPrepared ? 'r1' : 'r0',
    current.id,
  ].join(':');
}

function cherryContinuityMarkup(flow, current, signature) {
  return `<section class="cherry-engagement-continuity" data-cherry-engagement-continuity data-cherry-engagement-continuity-signature="${signature}" data-cherry-engagement-continuity-stage="${current.id}" aria-label="Synthetic engagement continuity">
    <div class="cherry-engagement-continuity__copy">
      <span>ENGAGEMENT CONTINUITY · LOCAL SYNTHETIC DEMO</span>
      <strong data-cherry-engagement-continuity-current>${current.label}</strong>
      <p>${current.detail}</p>
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
    <button type="button" data-cherry-engagement-continuity-resume="${current.route}" aria-label="Resume ${current.label}">Resume →</button>
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
  const signature = cherryContinuitySignature(flow, current);
  if (existing?.dataset.cherryEngagementContinuitySignature === signature && existing.parentElement === summary) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = cherryContinuityMarkup(flow, current, signature);
  const strip = wrapper.firstElementChild;
  if (!(strip instanceof HTMLElement)) return;

  strip.querySelector('[data-cherry-engagement-continuity-resume]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    cherryContinuityResume(button.dataset.cherryEngagementContinuityResume);
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
