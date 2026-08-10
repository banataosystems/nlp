/* WorldStage / Cherry — compact Review now owner focus for the synthetic mobile prototype.
   Local demo state only. No free text, network writes, confidential data, evidence claims,
   production authority, scheduling, CRM, database, or client communication. */

const CHERRY_REVIEW_NOW_DAILY_KEY = 'worldstage.cherry.daily.demo.v1';
const CHERRY_REVIEW_NOW_RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';
const CHERRY_REVIEW_NOW_DAILY_ALLOWED = new Set(['needs-cherry', 'prepared', 'parked']);
const CHERRY_REVIEW_NOW_RATIONALE_ALLOWED = new Set(['ready', 'needs-context', 'can-wait']);
const CHERRY_REVIEW_NOW_DAILY_LABELS = Object.freeze({
  'needs-cherry': 'Needs Cherry',
  prepared: 'Prepared',
  parked: 'Parked',
});
const CHERRY_REVIEW_NOW_RATIONALE_LABELS = Object.freeze({
  ready: 'Ready',
  'needs-context': 'Needs context',
  'can-wait': 'Can wait',
});

function cherryReviewNowSafeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cherryReviewNowState() {
  const storedDaily = cherryReviewNowSafeJson(CHERRY_REVIEW_NOW_DAILY_KEY) || {};
  const storedRationale = cherryReviewNowSafeJson(CHERRY_REVIEW_NOW_RATIONALE_KEY) || {};
  const ids = ['01', '02', '03'];
  const daily = Object.fromEntries(ids.map((id) => {
    const value = storedDaily?.[id];
    return [id, CHERRY_REVIEW_NOW_DAILY_ALLOWED.has(value) ? value : 'needs-cherry'];
  }));
  const rationale = Object.fromEntries(ids.map((id) => {
    const value = storedRationale?.[id];
    return [id, CHERRY_REVIEW_NOW_RATIONALE_ALLOWED.has(value) ? value : 'needs-context'];
  }));
  return { daily, rationale };
}

function cherryReviewNowPriority() {
  const { daily, rationale } = cherryReviewNowState();
  const ids = ['01', '02', '03'];
  const stateOrder = ['needs-cherry', 'prepared', 'parked'];
  let id = '01';

  for (const state of stateOrder) {
    const match = ids.find((candidate) => daily[candidate] === state);
    if (match) {
      id = match;
      break;
    }
  }

  const decisionState = CHERRY_REVIEW_NOW_DAILY_ALLOWED.has(daily[id]) ? daily[id] : 'needs-cherry';
  const rationaleValue = CHERRY_REVIEW_NOW_RATIONALE_ALLOWED.has(rationale[id]) ? rationale[id] : 'needs-context';
  return {
    id,
    decisionState,
    decisionLabel: CHERRY_REVIEW_NOW_DAILY_LABELS[decisionState] || 'Needs Cherry',
    rationaleValue,
    rationaleLabel: CHERRY_REVIEW_NOW_RATIONALE_LABELS[rationaleValue] || 'Needs context',
  };
}

function cherryReviewNowMarkup(priority, signature) {
  return `<div class="cherry-owner-summary__next" data-cherry-review-now-card data-cherry-review-now-signature="${signature}">
    <div>
      <span>REVIEW NOW · SYNTHETIC OWNER FOCUS</span>
      <strong data-cherry-review-now-item>Item ${priority.id}</strong>
      <p data-cherry-review-now-reason>${priority.decisionLabel} · ${priority.rationaleLabel}</p>
      <p>Opens the existing local-demo judgment context on this same phone surface. No ranking model, private lookup, free text, or external action is added.</p>
      <p data-cherry-review-now-status aria-live="polite"></p>
    </div>
    <button type="button" data-cherry-review-now-open aria-label="Review synthetic judgment item ${priority.id} now">Review now →</button>
  </div>`;
}

function cherryReviewNowOpen(button) {
  const priority = cherryReviewNowPriority();
  const controls = document.querySelector(`[data-cherry-decision-state="${priority.id}"]`);
  const card = controls?.closest('.judgment-card');
  const status = document.querySelector('[data-cherry-review-now-status]');

  if (!controls || !card) {
    if (status) status.textContent = 'Local demo judgment context is unavailable on this view. Nothing was changed.';
    return;
  }

  document.querySelectorAll('[data-cherry-review-now-target]').forEach((node) => node.removeAttribute('data-cherry-review-now-target'));
  card.dataset.cherryReviewNowTarget = priority.id;
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });

  if (status) {
    status.textContent = `Reviewing item ${priority.id}: ${priority.decisionLabel} · ${priority.rationaleLabel}. Local demo only.`;
  }

  const currentButton = controls.querySelector(`[data-cherry-daily-set="${priority.decisionState}"]`)
    || controls.querySelector('[data-cherry-daily-set]');
  requestAnimationFrame(() => currentButton?.focus({ preventScroll: true }));

  window.setTimeout(() => {
    if (card.dataset.cherryReviewNowTarget === priority.id) card.removeAttribute('data-cherry-review-now-target');
  }, 1600);
}

function cherryReviewNowRoute() {
  return location.hash.replace('#/', '').replace('#', '') || 'home';
}

function enhanceCherryReviewNow() {
  const existing = document.querySelector('[data-cherry-review-now-card]');
  if (cherryReviewNowRoute() !== 'cockpit') {
    existing?.remove();
    return;
  }

  const summary = document.querySelector('[data-cherry-owner-summary]');
  const priorityHost = summary?.querySelector('[data-owner-summary-priority]');
  if (!summary || !priorityHost) return;

  const priority = cherryReviewNowPriority();
  const signature = `${priority.id}:${priority.decisionState}:${priority.rationaleValue}`;
  if (existing?.dataset.cherryReviewNowSignature === signature && existing.parentElement === summary) return;

  existing?.remove();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = cherryReviewNowMarkup(priority, signature);
  const card = wrapper.firstElementChild;
  priorityHost.insertAdjacentElement('afterend', card);
  card.querySelector('[data-cherry-review-now-open]')?.addEventListener('click', (event) => {
    cherryReviewNowOpen(event.currentTarget);
  });
}

new MutationObserver(() => queueMicrotask(enhanceCherryReviewNow))
  .observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });
window.addEventListener('hashchange', () => queueMicrotask(enhanceCherryReviewNow));
window.addEventListener('storage', () => queueMicrotask(enhanceCherryReviewNow));
enhanceCherryReviewNow();
