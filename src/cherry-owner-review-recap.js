/* WorldStage / Cherry — read-only recap for the completed 3-minute synthetic owner review.
   This module reads only allowlisted browser-local demo values and performs navigation only.
   It does not persist recap/session-delta/recheck state, write to providers, infer urgency/value, or grant authority. */

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
let cherryReviewRecapRecheck = { ids: [], index: -1 };

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
  cherryReviewRecapRecheck = { ids: [], index: -1 };
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

function cherryReviewRecapCounts(delta) {
  const safeDelta = Array.isArray(delta) ? delta : [];
  const changedIds = CHERRY_REVIEW_RECAP_IDS.filter((id) => safeDelta.some((row) => row.id === id && row.status === 'changed'));
  const sameIds = CHERRY_REVIEW_RECAP_IDS.filter((id) => safeDelta.some((row) => row.id === id && row.status === 'same'));
  return {
    changedIds,
    changed: changedIds.length,
    same: sameIds.length,
    unavailable: CHERRY_REVIEW_RECAP_IDS.length - changedIds.length - sameIds.length,
  };
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
  const counts = cherryReviewRecapCounts(delta);
  const countLabel = counts.unavailable > 0
    ? `Changed: ${counts.changed} · Same: ${counts.same} · Comparison unavailable: ${counts.unavailable}`
    : `Changed: ${counts.changed} · Same: ${counts.same}`;
  const recheckButton = counts.changed > 0
    ? `<button type="button" data-cherry-owner-review-recap-recheck>Recheck changed (${counts.changed}) →</button>`
    : '';
  return `<section class="cherry-owner-summary__next cherry-owner-review-recap" data-cherry-owner-review-recap data-cherry-owner-review-recap-signature="${signature}" aria-label="Completed synthetic owner review recap">
    <div>
      <span>OWNER REVIEW RECAP · READ ONLY · SYNTHETIC</span>
      <strong>Three final local-demo judgments, plus what changed this review.</strong>
      <p>This recap only reflects the three allowlisted browser-local demo states at this moment. Change means only that the fixed state or fixed reason differs from this review session's in-memory starting snapshot. The snapshot is discarded on restart or navigation.</p>
      <p data-cherry-owner-review-recap-counts>${countLabel}</p>
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
      <p data-cherry-owner-review-recap-recheck-status aria-live="polite">${counts.changed > 0 ? 'Changed-item recheck is navigation only and does not alter the completed review.' : 'No changed items to recheck in this review.'}</p>
      <p data-cherry-owner-review-recap-next>${next.hint}</p>
    </div>
    <div class="cherry-owner-review-recap__actions">
      ${recheckButton}
      <button type="button" data-cherry-owner-review-recap-route="${next.route}">${next.label}</button>
    </div>
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

function cherryReviewRecapFocusChanged(id) {
  if (!CHERRY_REVIEW_RECAP_IDS.includes(id)) return false;
  const rows = cherryReviewRecapSnapshot();
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) return false;

  const controls = document.querySelector(`[data-cherry-decision-state="${id}"]`);
  const card = controls?.closest('.judgment-card');
  const button = controls?.querySelector(`[data-cherry-daily-set="${row.decisionState}"]`)
    || controls?.querySelector('[data-cherry-daily-set]');
  if (!(card instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) return false;

  document.querySelectorAll('[data-cherry-owner-review-recheck-target]')
    .forEach((node) => node.removeAttribute('data-cherry-owner-review-recheck-target'));
  card.dataset.cherryOwnerReviewRecheckTarget = id;
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  requestAnimationFrame(() => button.focus({ preventScroll: true }));
  window.setTimeout(() => {
    if (card.dataset.cherryOwnerReviewRecheckTarget === id) card.removeAttribute('data-cherry-owner-review-recheck-target');
  }, 1600);
  return true;
}

function bindCherryReviewRecapRecheck(recap, changedIds) {
  const button = recap.querySelector('[data-cherry-owner-review-recap-recheck]');
  const status = recap.querySelector('[data-cherry-owner-review-recap-recheck-status]');
  if (!(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || changedIds.length === 0) return;

  button.addEventListener('click', () => {
    if (cherryReviewRecapRecheck.ids.join('|') !== changedIds.join('|')) {
      cherryReviewRecapRecheck = { ids: [...changedIds], index: -1 };
    }
    cherryReviewRecapRecheck.index = (cherryReviewRecapRecheck.index + 1) % cherryReviewRecapRecheck.ids.length;
    const id = cherryReviewRecapRecheck.ids[cherryReviewRecapRecheck.index];
    if (!cherryReviewRecapFocusChanged(id)) {
      status.textContent = 'Changed-item recheck unavailable on this view.';
      return;
    }
    const position = cherryReviewRecapRecheck.index + 1;
    status.textContent = `Rechecking ${position} of ${cherryReviewRecapRecheck.ids.length} · Item ${id}. Navigation only; the completed review is unchanged.`;
    button.textContent = position >= cherryReviewRecapRecheck.ids.length
      ? 'Recheck from first changed →'
      : 'Next changed item →';
  });
}

function enhanceCherryOwnerReviewRecap() {
  const existing = document.querySelector('[data-cherry-owner-review-recap]');
  if (cherryReviewRecapRoute() !== 'cockpit' || !cherryReviewRecapIsComplete()) {
    existing?.remove();
    cherryReviewRecapRecheck = { ids: [], index: -1 };
    return;
  }

  const session = document.querySelector('[data-cherry-review-session]');
  if (!session) {
    existing?.remove();
    cherryReviewRecapRecheck = { ids: [], index: -1 };
    return;
  }

  const rows = cherryReviewRecapSnapshot();
  const delta = cherryReviewRecapSessionDelta(rows);
  const counts = cherryReviewRecapCounts(delta);
  if (cherryReviewRecapRecheck.ids.join('|') !== counts.changedIds.join('|')) {
    cherryReviewRecapRecheck = { ids: [...counts.changedIds], index: -1 };
  }
  const next = cherryReviewRecapNextStep();
  const signature = cherryReviewRecapSignature(rows, next, delta);
  if (existing?.dataset.cherryOwnerReviewRecapSignature === signature) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = cherryReviewRecapMarkup(rows, next, delta, signature);
  const recap = wrapper.firstElementChild;
  if (!(recap instanceof HTMLElement)) return;

  bindCherryReviewRecapRoute(recap);
  bindCherryReviewRecapRecheck(recap, counts.changedIds);
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
  if (cherryReviewRecapRoute() !== 'cockpit') {
    cherryReviewRecapSessionStart = null;
    cherryReviewRecapRecheck = { ids: [], index: -1 };
  }
  scheduleCherryReviewRecapRefresh();
});
window.addEventListener('storage', scheduleCherryReviewRecapRefresh);
queueMicrotask(enhanceCherryOwnerReviewRecap);
