/* WorldStage / Cherry — compact 3-minute owner review session for the synthetic mobile prototype.
   Same-page, in-memory session only. No free text, private data, network/provider writes,
   scoring model, production authority, scheduling, CRM, database, or client communication. */

const CHERRY_REVIEW_SESSION_DAILY_KEY = 'worldstage.cherry.daily.demo.v1';
const CHERRY_REVIEW_SESSION_RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';
const CHERRY_REVIEW_SESSION_IDS = Object.freeze(['01', '02', '03']);
const CHERRY_REVIEW_SESSION_STATES = new Set(['needs-cherry', 'prepared', 'parked']);
const CHERRY_REVIEW_SESSION_RATIONALES = new Set(['ready', 'needs-context', 'can-wait']);
const CHERRY_REVIEW_SESSION_STATE_ORDER = Object.freeze(['needs-cherry', 'prepared', 'parked']);
const CHERRY_REVIEW_SESSION_STATE_LABELS = Object.freeze({
  'needs-cherry': 'Needs Cherry',
  prepared: 'Prepared',
  parked: 'Parked',
});
const CHERRY_REVIEW_SESSION_RATIONALE_LABELS = Object.freeze({
  ready: 'Ready',
  'needs-context': 'Needs context',
  'can-wait': 'Can wait',
});

let cherryReviewSession = { active: false, reviewed: [], currentId: null };

function cherryReviewSessionSafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryReviewSessionSnapshot() {
  const storedDaily = cherryReviewSessionSafeJson(CHERRY_REVIEW_SESSION_DAILY_KEY) || {};
  const storedRationale = cherryReviewSessionSafeJson(CHERRY_REVIEW_SESSION_RATIONALE_KEY) || {};
  const daily = Object.fromEntries(CHERRY_REVIEW_SESSION_IDS.map((id) => [
    id,
    CHERRY_REVIEW_SESSION_STATES.has(storedDaily?.[id]) ? storedDaily[id] : 'needs-cherry',
  ]));
  const rationale = Object.fromEntries(CHERRY_REVIEW_SESSION_IDS.map((id) => [
    id,
    CHERRY_REVIEW_SESSION_RATIONALES.has(storedRationale?.[id]) ? storedRationale[id] : 'needs-context',
  ]));
  return { daily, rationale };
}

function cherryReviewSessionNextId(reviewed = cherryReviewSession.reviewed) {
  const { daily } = cherryReviewSessionSnapshot();
  const unseen = CHERRY_REVIEW_SESSION_IDS.filter((id) => !reviewed.includes(id));
  for (const state of CHERRY_REVIEW_SESSION_STATE_ORDER) {
    const match = unseen.find((id) => daily[id] === state);
    if (match) return match;
  }
  return unseen[0] || null;
}

function cherryReviewSessionCurrent() {
  const { daily, rationale } = cherryReviewSessionSnapshot();
  const id = cherryReviewSession.currentId;
  if (!id || !CHERRY_REVIEW_SESSION_IDS.includes(id)) return null;
  const decisionState = CHERRY_REVIEW_SESSION_STATES.has(daily[id]) ? daily[id] : 'needs-cherry';
  const rationaleValue = CHERRY_REVIEW_SESSION_RATIONALES.has(rationale[id]) ? rationale[id] : 'needs-context';
  return {
    id,
    decisionState,
    decisionLabel: CHERRY_REVIEW_SESSION_STATE_LABELS[decisionState] || 'Needs Cherry',
    rationaleValue,
    rationaleLabel: CHERRY_REVIEW_SESSION_RATIONALE_LABELS[rationaleValue] || 'Needs context',
  };
}

function cherryReviewSessionRoute() {
  return location.hash.replace('#/', '').replace('#', '') || 'home';
}

function cherryReviewSessionMarkup(signature) {
  const reviewedCount = cherryReviewSession.reviewed.length;
  const complete = cherryReviewSession.active && reviewedCount >= CHERRY_REVIEW_SESSION_IDS.length;
  const current = cherryReviewSessionCurrent();

  if (!cherryReviewSession.active) {
    return `<div class="cherry-owner-summary__next" data-cherry-review-session data-cherry-review-session-signature="${signature}">
      <div>
        <span>3-MINUTE OWNER REVIEW · SYNTHETIC</span>
        <strong>Clear the three fixed demo judgments.</strong>
        <p>Starts with the same deterministic order: Needs Cherry → Prepared → Parked, ties by item number. Each marked item is reviewed once in this in-memory session.</p>
        <p data-cherry-review-session-progress aria-live="polite">Progress: 0 of 3. No external system is changed.</p>
      </div>
      <button type="button" data-cherry-review-session-start>Start review →</button>
    </div>`;
  }

  if (complete || !current) {
    return `<div class="cherry-owner-summary__next" data-cherry-review-session data-cherry-review-session-signature="${signature}">
      <div>
        <span>3-MINUTE OWNER REVIEW · SYNTHETIC</span>
        <strong>Three of three reviewed.</strong>
        <p>The session is complete on this phone view only. It did not approve, send, schedule, persist to a backend, or release anything.</p>
        <p data-cherry-review-session-progress aria-live="polite">Progress: 3 of 3. Local demo session complete.</p>
      </div>
      <button type="button" data-cherry-review-session-restart>Review again →</button>
    </div>`;
  }

  return `<div class="cherry-owner-summary__next" data-cherry-review-session data-cherry-review-session-signature="${signature}">
    <div>
      <span>3-MINUTE OWNER REVIEW · ${reviewedCount + 1} OF 3</span>
      <strong data-cherry-review-session-item>Item ${current.id}</strong>
      <p data-cherry-review-session-reason>${current.decisionLabel} · ${current.rationaleLabel}</p>
      <p>Mark this existing local-demo decision state; the next unseen deterministic priority will surface automatically.</p>
      <p data-cherry-review-session-progress aria-live="polite">Progress: ${reviewedCount} of 3 reviewed. Current: item ${current.id}.</p>
    </div>
    <button type="button" data-cherry-review-session-open>Open item ${current.id} →</button>
  </div>`;
}

function cherryReviewSessionSignature() {
  const current = cherryReviewSessionCurrent();
  return [
    cherryReviewSession.active ? 'active' : 'idle',
    cherryReviewSession.reviewed.join(','),
    current?.id || 'none',
    current?.decisionState || 'none',
    current?.rationaleValue || 'none',
  ].join(':');
}

function cherryReviewSessionFocusCurrent() {
  if (!cherryReviewSession.active) return;
  const current = cherryReviewSessionCurrent();
  if (!current) return;
  const controls = document.querySelector(`[data-cherry-decision-state="${current.id}"]`);
  const card = controls?.closest('.judgment-card');
  const button = controls?.querySelector(`[data-cherry-daily-set="${current.decisionState}"]`)
    || controls?.querySelector('[data-cherry-daily-set]');
  if (!controls || !card || !button) return;

  document.querySelectorAll('[data-cherry-review-session-target]').forEach((node) => node.removeAttribute('data-cherry-review-session-target'));
  card.dataset.cherryReviewSessionTarget = current.id;
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  requestAnimationFrame(() => button.focus({ preventScroll: true }));
  window.setTimeout(() => {
    if (card.dataset.cherryReviewSessionTarget === current.id) card.removeAttribute('data-cherry-review-session-target');
  }, 1600);
}

function cherryReviewSessionStart() {
  cherryReviewSession = { active: true, reviewed: [], currentId: null };
  cherryReviewSession.currentId = cherryReviewSessionNextId([]);
  enhanceCherryOwnerReviewSession();
  cherryReviewSessionFocusCurrent();
}

function cherryReviewSessionAdvance(id) {
  if (!cherryReviewSession.active || cherryReviewSession.currentId !== id) return;
  if (!cherryReviewSession.reviewed.includes(id)) cherryReviewSession.reviewed.push(id);
  cherryReviewSession.currentId = cherryReviewSessionNextId(cherryReviewSession.reviewed);
  enhanceCherryOwnerReviewSession();
  if (cherryReviewSession.currentId) cherryReviewSessionFocusCurrent();
}

function bindCherryReviewSessionDecisionButtons() {
  document.querySelectorAll('[data-cherry-decision-state]').forEach((controls) => {
    const id = controls.dataset.cherryDecisionState;
    if (!CHERRY_REVIEW_SESSION_IDS.includes(id)) return;
    controls.querySelectorAll('[data-cherry-daily-set]').forEach((button) => {
      if (button.dataset.cherryReviewSessionBound === 'true') return;
      button.dataset.cherryReviewSessionBound = 'true';
      button.addEventListener('click', () => {
        if (!cherryReviewSession.active || cherryReviewSession.currentId !== id) return;
        queueMicrotask(() => cherryReviewSessionAdvance(id));
      });
    });
  });
}

function enhanceCherryOwnerReviewSession() {
  const existing = document.querySelector('[data-cherry-review-session]');
  if (cherryReviewSessionRoute() !== 'cockpit') {
    existing?.remove();
    return;
  }

  const summary = document.querySelector('[data-cherry-owner-summary]');
  const reviewNow = summary?.querySelector('[data-cherry-review-now-card]');
  const fallbackHost = summary?.querySelector('[data-owner-summary-priority]');
  if (!summary || (!reviewNow && !fallbackHost)) {
    bindCherryReviewSessionDecisionButtons();
    return;
  }

  if (cherryReviewSession.active && !cherryReviewSession.currentId && cherryReviewSession.reviewed.length < CHERRY_REVIEW_SESSION_IDS.length) {
    cherryReviewSession.currentId = cherryReviewSessionNextId(cherryReviewSession.reviewed);
  }

  const signature = cherryReviewSessionSignature();
  if (existing?.dataset.cherryReviewSessionSignature !== signature || existing.parentElement !== summary) {
    existing?.remove();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = cherryReviewSessionMarkup(signature);
    const card = wrapper.firstElementChild;
    (reviewNow || fallbackHost).insertAdjacentElement('afterend', card);
    card.querySelector('[data-cherry-review-session-start]')?.addEventListener('click', cherryReviewSessionStart);
    card.querySelector('[data-cherry-review-session-restart]')?.addEventListener('click', cherryReviewSessionStart);
    card.querySelector('[data-cherry-review-session-open]')?.addEventListener('click', cherryReviewSessionFocusCurrent);
  }

  bindCherryReviewSessionDecisionButtons();
}

const cherryReviewSessionApp = document.getElementById('app');
if (cherryReviewSessionApp) {
  new MutationObserver(() => queueMicrotask(enhanceCherryOwnerReviewSession))
    .observe(cherryReviewSessionApp, { childList: true, subtree: true, characterData: true });
}
window.addEventListener('hashchange', () => queueMicrotask(enhanceCherryOwnerReviewSession));
enhanceCherryOwnerReviewSession();
