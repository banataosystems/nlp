/* WorldStage / Cherry — read-only recap for the completed 3-minute synthetic owner review.
   This module reads only allowlisted browser-local demo values and performs navigation only.
   It does not persist recap state, write to providers, infer urgency/value, or grant authority. */

const CHERRY_REVIEW_RECAP_DAILY_KEY = 'worldstage.cherry.daily.demo.v1';
const CHERRY_REVIEW_RECAP_RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';
const CHERRY_REVIEW_RECAP_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const CHERRY_REVIEW_RECAP_FLOW_VERSION = 1;
const CHERRY_REVIEW_RECAP_IDS = Object.freeze(['01', '02', '03']);
const CHERRY_REVIEW_RECAP_STATES = new Set(['needs-cherry', 'prepared', 'parked']);
const CHERRY_REVIEW_RECAP_RATIONALES = new Set(['ready', 'needs-context', 'can-wait']);
const CHERRY_REVIEW_RECAP_STATE_LABELS = Object.freeze({
  'needs-cherry': 'Needs Cherry',
  prepared: 'Prepared',
  parked: 'Parked',
});
const CHERRY_REVIEW_RECAP_RATIONALE_LABELS = Object.freeze({
  ready: 'Ready',
  'needs-context': 'Needs context',
  'can-wait': 'Can wait',
});

function cherryReviewRecapSafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryReviewRecapSnapshot() {
  const storedDaily = cherryReviewRecapSafeJson(CHERRY_REVIEW_RECAP_DAILY_KEY) || {};
  const storedRationale = cherryReviewRecapSafeJson(CHERRY_REVIEW_RECAP_RATIONALE_KEY) || {};

  return CHERRY_REVIEW_RECAP_IDS.map((id) => {
    const decisionState = CHERRY_REVIEW_RECAP_STATES.has(storedDaily?.[id])
      ? storedDaily[id]
      : 'needs-cherry';
    const rationaleValue = CHERRY_REVIEW_RECAP_RATIONALES.has(storedRationale?.[id])
      ? storedRationale[id]
      : 'needs-context';
    return {
      id,
      decisionState,
      decisionLabel: CHERRY_REVIEW_RECAP_STATE_LABELS[decisionState] || 'Needs Cherry',
      rationaleValue,
      rationaleLabel: CHERRY_REVIEW_RECAP_RATIONALE_LABELS[rationaleValue] || 'Needs context',
    };
  });
}

function cherryReviewRecapFlowState() {
  const stored = cherryReviewRecapSafeJson(CHERRY_REVIEW_RECAP_FLOW_KEY);
  if (!stored || stored.version !== CHERRY_REVIEW_RECAP_FLOW_VERSION) {
    return { discoveryPrepared: false, ownerReviewed: false, recordPrepared: false };
  }

  const discoveryPrepared = stored.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && stored.ownerReviewed === true;
  const recordPrepared = ownerReviewed && stored.recordPrepared === true;
  return { discoveryPrepared, ownerReviewed, recordPrepared };
}

function cherryReviewRecapNextStep() {
  const state = cherryReviewRecapFlowState();
  if (!state.discoveryPrepared) {
    return {
      route: 'discovery',
      label: 'Continue with synthetic Discovery →',
      hint: 'Synthetic engagement next step: prepare the fixed Discovery brief.',
    };
  }
  if (!state.ownerReviewed) {
    return {
      route: 'cockpit',
      label: 'Continue synthetic engagement →',
      hint: 'Synthetic engagement next step: complete the existing Cherry judgment step.',
    };
  }
  return {
    route: 'client',
    label: state.recordPrepared ? 'View synthetic Transformation Record →' : 'Open synthetic Transformation Record →',
    hint: state.recordPrepared
      ? 'Synthetic engagement loop is complete; the local demo Transformation Record can be reviewed.'
      : 'Synthetic engagement next step: prepare the local demo Transformation Record.',
  };
}

function cherryReviewRecapMarkup() {
  const rows = cherryReviewRecapSnapshot();
  const next = cherryReviewRecapNextStep();

  return `<section class="cherry-owner-summary__next cherry-owner-review-recap" data-cherry-owner-review-recap aria-label="Completed synthetic owner review recap">
    <div>
      <span>OWNER REVIEW RECAP · READ ONLY · SYNTHETIC</span>
      <strong>Three final local-demo judgments, one safe next route.</strong>
      <p>This recap only reflects the three allowlisted browser-local demo states at this moment. It is not an approval, client record, task, recommendation, or production action.</p>
      <div class="cherry-owner-review-recap__list" role="list">
        ${rows.map((row) => `<article role="listitem" data-cherry-owner-review-recap-item="${row.id}">
          <span>ITEM ${row.id}</span>
          <strong>${row.decisionLabel}</strong>
          <small>${row.rationaleLabel}</small>
        </article>`).join('')}
      </div>
      <p data-cherry-owner-review-recap-next>${next.hint}</p>
    </div>
    <button type="button" data-cherry-owner-review-recap-route="${next.route}">${next.label}</button>
  </section>`;
}

function cherryReviewRecapRoute() {
  return location.hash.replace('#/', '').replace('#', '') || 'home';
}

function cherryReviewRecapIsComplete() {
  const session = document.querySelector('[data-cherry-review-session]');
  return Boolean(session?.querySelector('[data-cherry-review-session-restart]'));
}

function bindCherryReviewRecapRoute(recap) {
  const button = recap.querySelector('[data-cherry-owner-review-recap-route]');
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener('click', () => {
    const route = button.dataset.cherryOwnerReviewRecapRoute;
    if (!['discovery', 'cockpit', 'client'].includes(route)) return;

    if (route === 'cockpit') {
      const action = document.querySelector('[data-synthetic-flow-action="owner-review"]');
      if (action instanceof HTMLButtonElement) {
        action.scrollIntoView({ block: 'center', behavior: 'smooth' });
        requestAnimationFrame(() => action.focus({ preventScroll: true }));
        return;
      }
    }

    location.hash = `#/${route}`;
  });
}

function enhanceCherryOwnerReviewRecap() {
  const existing = document.querySelector('[data-cherry-owner-review-recap]');
  if (cherryReviewRecapRoute() !== 'cockpit' || !cherryReviewRecapIsComplete()) {
    existing?.remove();
    return;
  }

  const session = document.querySelector('[data-cherry-review-session]');
  if (!session) {
    existing?.remove();
    return;
  }

  const expected = cherryReviewRecapMarkup();
  if (existing?.outerHTML === expected) return;

  existing?.remove();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = expected;
  const recap = wrapper.firstElementChild;
  session.insertAdjacentElement('afterend', recap);
  bindCherryReviewRecapRoute(recap);
}

const cherryReviewRecapApp = document.getElementById('app');
if (cherryReviewRecapApp) {
  new MutationObserver(() => queueMicrotask(enhanceCherryOwnerReviewRecap))
    .observe(cherryReviewRecapApp, { childList: true, subtree: true, characterData: true });
}
window.addEventListener('hashchange', () => queueMicrotask(enhanceCherryOwnerReviewRecap));
window.addEventListener('storage', () => queueMicrotask(enhanceCherryOwnerReviewRecap));
enhanceCherryOwnerReviewRecap();