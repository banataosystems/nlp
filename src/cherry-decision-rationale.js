/* Phase 4 — Cherry Daily fixed-vocabulary decision rationale lens.
   This prototype stores only allowlisted local demo enums. It accepts no free text,
   reads no client records, performs no network writes, and grants no approval/release authority. */

const CHERRY_RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';
const CHERRY_RATIONALE_ITEMS = Object.freeze(['01', '02', '03']);
const CHERRY_RATIONALE_ALLOWED = new Set(['ready', 'needs-context', 'can-wait']);
const CHERRY_STATE_TO_RATIONALE = Object.freeze({
  'needs-cherry': 'needs-context',
  prepared: 'ready',
  parked: 'can-wait',
});

function defaultCherryRationaleState() {
  return { '01': 'needs-context', '02': 'needs-context', '03': 'needs-context' };
}

let cherryRationaleFallback = defaultCherryRationaleState();

function sanitizeCherryRationaleState(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(CHERRY_RATIONALE_ITEMS.map((id) => {
    const candidate = source[id];
    return [id, CHERRY_RATIONALE_ALLOWED.has(candidate) ? candidate : 'needs-context'];
  }));
}

function readCherryRationaleState() {
  try {
    const raw = localStorage.getItem(CHERRY_RATIONALE_KEY);
    if (!raw) return { ...cherryRationaleFallback };
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeCherryRationaleState(parsed);
    cherryRationaleFallback = sanitized;

    // Fail closed on arbitrary/invalid stored fields by replacing them with the exact allowlisted shape.
    if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
      localStorage.setItem(CHERRY_RATIONALE_KEY, JSON.stringify(sanitized));
    }
    return { ...sanitized };
  } catch {
    return { ...cherryRationaleFallback };
  }
}

function writeCherryRationaleState(next) {
  const sanitized = sanitizeCherryRationaleState(next);
  cherryRationaleFallback = sanitized;
  try {
    localStorage.setItem(CHERRY_RATIONALE_KEY, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

function clearCherryRationaleState() {
  cherryRationaleFallback = defaultCherryRationaleState();
  try {
    localStorage.removeItem(CHERRY_RATIONALE_KEY);
    return true;
  } catch {
    return false;
  }
}

function cherryRationaleLabel(value) {
  if (value === 'ready') return 'Ready';
  if (value === 'can-wait') return 'Can wait';
  return 'Needs context';
}

function setCherryRationaleStatus(message) {
  const status = document.querySelector('[data-cherry-daily-status]');
  if (status && message && status.textContent !== message) status.textContent = message;
}

function updateCherryRationaleUI(message = '') {
  const state = readCherryRationaleState();
  document.querySelectorAll('[data-cherry-rationale-state]').forEach((node) => {
    const id = node.dataset.cherryRationaleState;
    const value = state[id] || 'needs-context';
    const label = node.querySelector('[data-cherry-rationale-label]');
    const nextLabel = cherryRationaleLabel(value);
    if (label && label.textContent !== nextLabel) label.textContent = nextLabel;

    node.querySelectorAll('[data-cherry-rationale-set]').forEach((button) => {
      const isCurrent = button.dataset.cherryRationaleSet === value;
      button.classList.toggle('is-current', isCurrent);
      button.setAttribute('aria-pressed', String(isCurrent));
    });
  });
  if (message) setCherryRationaleStatus(message);
}

function rationaleMarkup(id) {
  return `<div class="cherry-decision-rationale" data-cherry-rationale-state="${id}">
    <div class="cherry-decision-rationale__meta">
      <span>WHY THIS STATE · FIXED DEMO VOCABULARY</span>
      <strong data-cherry-rationale-label>Needs context</strong>
    </div>
    <div class="cherry-decision-rationale__actions" role="group" aria-label="Fixed decision rationale for demo item ${id}">
      <button type="button" data-cherry-rationale-set="ready" aria-pressed="false">Ready</button>
      <button type="button" data-cherry-rationale-set="needs-context" aria-pressed="false">Needs context</button>
      <button type="button" data-cherry-rationale-set="can-wait" aria-pressed="false">Can wait</button>
    </div>
    <small>No free text. No client data. Local demo state only.</small>
  </div>`;
}

function bindRationaleChoice(button, id) {
  if (button.dataset.cherryRationaleBound === 'true') return;
  button.dataset.cherryRationaleBound = 'true';
  button.addEventListener('click', () => {
    const candidate = button.dataset.cherryRationaleSet;
    if (!CHERRY_RATIONALE_ALLOWED.has(candidate)) return;
    const state = readCherryRationaleState();
    state[id] = candidate;
    const saved = writeCherryRationaleState(state);
    updateCherryRationaleUI(saved
      ? `${id} rationale marked ${cherryRationaleLabel(candidate).toLowerCase()} with fixed local vocabulary only. No external system changed.`
      : `${id} rationale changed for this view, but local browser storage was unavailable.`);
  });
}

function bindDecisionStateSync(button, id) {
  if (button.dataset.cherryRationaleSyncBound === 'true') return;
  button.dataset.cherryRationaleSyncBound = 'true';
  button.addEventListener('click', () => {
    const mapped = CHERRY_STATE_TO_RATIONALE[button.dataset.cherryDailySet];
    if (!mapped) return;
    const state = readCherryRationaleState();
    state[id] = mapped;
    writeCherryRationaleState(state);
    updateCherryRationaleUI();
  });
}

function bindRationaleReset() {
  const reset = document.querySelector('[data-cherry-daily-reset]');
  if (reset && reset.dataset.cherryRationaleResetBound !== 'true') {
    reset.dataset.cherryRationaleResetBound = 'true';
    reset.addEventListener('click', () => {
      clearCherryRationaleState();
      updateCherryRationaleUI('Decision states and fixed rationales reset locally. No external system was changed.');
    });
  }

  document.querySelectorAll('[data-synthetic-flow-reset]').forEach((button) => {
    if (button.dataset.cherryRationaleResetBound === 'true') return;
    button.dataset.cherryRationaleResetBound = 'true';
    button.addEventListener('click', () => clearCherryRationaleState());
  });
}

function enhanceCherryDecisionRationale() {
  const daily = document.querySelector('[data-cherry-daily]');
  if (!daily) return;

  if (!daily.querySelector('[data-cherry-rationale-guide]')) {
    const lede = daily.querySelector('.cherry-daily__lede');
    lede?.insertAdjacentHTML('afterend', `<div class="cherry-rationale-guide" data-cherry-rationale-guide>
      <strong>Decision rationale lens</strong>
      <span>Use only Ready · Needs context · Can wait. This demo intentionally has no free-text reason field.</span>
    </div>`);
  }

  document.querySelectorAll('[data-cherry-decision-state]').forEach((controls) => {
    const id = controls.dataset.cherryDecisionState;
    if (!CHERRY_RATIONALE_ITEMS.includes(id)) return;

    if (!controls.querySelector('[data-cherry-rationale-state]')) {
      controls.insertAdjacentHTML('beforeend', rationaleMarkup(id));
    }

    controls.querySelectorAll('[data-cherry-rationale-set]').forEach((button) => bindRationaleChoice(button, id));
    controls.querySelectorAll('[data-cherry-daily-set]').forEach((button) => bindDecisionStateSync(button, id));
  });

  bindRationaleReset();
  updateCherryRationaleUI();
}

const app = document.getElementById('app');
if (app) {
  new MutationObserver(() => queueMicrotask(enhanceCherryDecisionRationale))
    .observe(app, { childList: true, subtree: true });
}
window.addEventListener('hashchange', () => queueMicrotask(enhanceCherryDecisionRationale));
enhanceCherryDecisionRationale();
