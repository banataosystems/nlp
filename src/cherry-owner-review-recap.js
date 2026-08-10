/* WorldStage / Cherry — read-only recap for the completed 3-minute synthetic owner review.
   This module reads only allowlisted browser-local demo values and performs navigation only.
   It does not persist recap/session-delta state, write to providers, infer urgency/value, or grant authority. */

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

let cherryReviewRecapSessionStart = null;

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

function cherryReviewRecapCaptureSessionStart() {
  cherryReviewRecapSessionStart = cherryReviewRecapSnapshot().map((row) => Object.freeze({
    id: row.id,
    decisionState: row.decisionState,
    rationaleValue: row.rationaleValue,
  }));
}

function cherryReviewRecapSessionDelta(rows) {
  if (!Array.isArray(cherryReviewRecapSessionStart)
    || cherryReviewRecapSessionStart.length !== CHERRY_REVIEW_RECAP_IDS.length) return null;

  const startById = Object.fromEntries(cherryReviewRecapSessionStart.map((row) => [row.id, row]));
  return rows.map((row) => {
    const start = startById[row.id];
    if (!start
      || !CHERRY_REVIEW_RECAP_STATES.has(start.decisionState)
      || !CHERRY_REVIEW_RECAP_RATIONALES.has(start.rationaleValue)) {
      return { id: row.id, status: 'unavailable', label: 'Session comparison unavailable' };
    }
    const changed = start.decisionState !== row.decisionState || start.rationaleValue !== row.rationaleValue;
    return {
      id: row.id,
      status: changed ? 'changed' : 'same',
      label: changed ? 'Changed this review' : 'Stayed the same',
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
      action: 'continue-discovery',
      label: 'Continue with synthetic Discovery →',
      hint: 'Synthetic engagement next step: prepare the fixed Discovery brief.',
    };
  }
  if (!state.ownerReviewed) {
    return {
      route: 'cockpit',
      action: 'continue-owner-review',
      label: 'Continue synthetic engagement →',
      hint: 'Synthetic engagement next step: complete the existing Cherry judgment step.',
    };
  }
  return {
    route: 'client',
    action: state.recordPrepared ? 'view-record' : 'open-record',
    label: state.recordPrepared ? 'View synthetic Transformation Record →' : 'Open synthetic Transformation Record →',
    hint: state.recordPrepared
      ? 'Synthetic engagement loop is complete; the local demo Transformation Record can be reviewed.'
      : 'Synthetic engagement next step: prepare the local demo Transformation Record.',
  };
}

function cherryReviewRecapSignature(rows, next, delta) {
  const rowSignature = rows
    .map((row) => `${row.id}:${row.decisionState}:${row.rationaleValue}`)
    .join('|');
  const deltaSignature = Array.isArray(delta)
    ? delta.map((row) => `${row.id}:${row.status}`).join('|')
    : 'delta-unavailable';
  return `${rowSignature}|${deltaSignature}|${next.action}`;
}

function cherryReviewRecapMarkup(rows, next, delta, signature) {
  const deltaById = Object.fromEntries((delta || []).map((row) => [row.id, row]));
  return `<section class="cherry-owner-summary__next cherry-owner-review-recap" data-cherry-owner-review-recap data-cherry-owner-review-recap-signature="${signature}" aria-label="Completed synthetic owner review recap">
    <div>
      <span>OWNER REVIEW RECAP · READ ONLY · SYNTHETIC</span>
      <strong>Three final local-demo judgments, plus what changed this review.</strong>
      <p>This recap only reflects the three allowlisted browser-local demo states at this moment. Change means only that the fixed state or fixed reason differs from this review session's in-memory starting snapshot. The snapshot is discarded on restart or navigation.</p>
      <div class="cherry-owner-review-recap__list" role="list">
        ${rows.map((row) => {
          const change = deltaById[row.id] || { status: 'unavailable', label: 'Session comparison unavailable' };
          return `<article role="listitem" data-cherry-owner-review-recap-item="${row.id}">
          <span>ITEM ${row.id}</span>
          <strong>${row.decisionLabel}</strong>
          <small>${row.rationaleLabel}</small>
          <small data-cherry-owner-review-recap-delta="${change.status}">${change.label}</small>
        </article>`;
        }).join('')}
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

  const rows = cherryReviewRecapSnapshot();
  const delta = cherryReviewRecapSessionDelta(rows);
  const next = cherryReviewRecapNextStep();
  const signature = cherryReviewRecapSignature(rows, next, delta);
  if (existing?.dataset.cherryOwnerReviewRecapSignature === signature) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = cherryReviewRecapMarkup(rows, next, delta, signature);
  const recap = wrapper.firstElementChild;
  if (!(recap instanceof HTMLElement)) return;

  bindCherryReviewRecapRoute(recap);
  if (existing) existing.replaceWith(recap);
  else session.insertAdjacentElement('afterend', recap);
}

function scheduleCherryReviewRecapRefresh() {
  requestAnimationFrame(enhanceCherryOwnerReviewRecap);
}

/* Capture the sanitized starting state before the review-session button handler runs.
   This exists only in this page's JavaScript memory and is replaced on every restart. */
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element
    ? event.target.closest('[data-cherry-review-session-start], [data-cherry-review-session-restart]')
    : null;
  if (target) cherryReviewRecapCaptureSessionStart();
}, true);

/* Event-driven refresh intentionally replaces a broad app MutationObserver. The recap
   only depends on review-session controls, route changes, and cross-tab storage changes;
   observing every DOM mutation caused decision controls to be repeatedly destabilized. */
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element
    ? event.target.closest('[data-cherry-daily-set], [data-cherry-review-session-start], [data-cherry-review-session-restart]')
    : null;
  if (target) scheduleCherryReviewRecapRefresh();
});
window.addEventListener('hashchange', () => {
  if (cherryReviewRecapRoute() !== 'cockpit') cherryReviewRecapSessionStart = null;
  scheduleCherryReviewRecapRefresh();
});
window.addEventListener('storage', scheduleCherryReviewRecapRefresh);
queueMicrotask(enhanceCherryOwnerReviewRecap);
