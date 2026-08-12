/* WorldStage / Cherry — local-only synthetic 7 / 30 / 90 sustainment plan.
   Fixed demo data only. No client form values, network writes, production authority,
   confidential data, scheduling, or evidence claims are created here. */

const SYNTHETIC_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const SUSTAINMENT_PLAN_KEY = 'worldstage.synthetic.sustainment.plan.v1';
const SUSTAINMENT_PLAN_VERSION = 1;

const SUSTAINMENT_HORIZONS = Object.freeze([
  Object.freeze({
    id: 'day7',
    label: '7 days',
    title: 'Ownership follow-through check',
    prompt: 'Review whether the synthetic decision owners are using the agreed decision rhythm and surface unresolved handoffs.',
    evidence: 'Synthetic owner follow-through snapshot',
  }),
  Object.freeze({
    id: 'day30',
    label: '30 days',
    title: 'Pattern and friction review',
    prompt: 'Compare the demo operating pattern for recurring decision friction, unclear ownership, and follow-through gaps.',
    evidence: 'Synthetic pattern review',
  }),
  Object.freeze({
    id: 'day90',
    label: '90 days',
    title: 'Sustainment decision',
    prompt: 'Decide whether the demo operating rhythm should be sustained, adjusted, or retired before any next intervention is proposed.',
    evidence: 'Synthetic sustainment review',
  }),
]);

function defaultSustainmentState() {
  return { version: SUSTAINMENT_PLAN_VERSION, day7Prepared: false, day30Prepared: false, day90Prepared: false };
}

let sustainmentFallback = defaultSustainmentState();

function syntheticRecordReady() {
  try {
    const value = JSON.parse(localStorage.getItem(SYNTHETIC_FLOW_KEY) || 'null');
    return value?.version === 1
      && value.discoveryPrepared === true
      && value.ownerReviewed === true
      && value.recordPrepared === true;
  } catch {
    return false;
  }
}

function sanitizeSustainmentState(value, ready = syntheticRecordReady()) {
  if (!ready || !value || value.version !== SUSTAINMENT_PLAN_VERSION) return defaultSustainmentState();
  const day7Prepared = value.day7Prepared === true;
  const day30Prepared = day7Prepared && value.day30Prepared === true;
  const day90Prepared = day30Prepared && value.day90Prepared === true;
  return { version: SUSTAINMENT_PLAN_VERSION, day7Prepared, day30Prepared, day90Prepared };
}

function readSustainmentState() {
  const ready = syntheticRecordReady();
  if (!ready) {
    sustainmentFallback = defaultSustainmentState();
    try { localStorage.removeItem(SUSTAINMENT_PLAN_KEY); } catch {}
    return { ...sustainmentFallback };
  }

  try {
    const raw = localStorage.getItem(SUSTAINMENT_PLAN_KEY);
    if (raw === null) {
      sustainmentFallback = defaultSustainmentState();
      return { ...sustainmentFallback };
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSustainmentState(parsed, true);
    sustainmentFallback = sanitized;
    localStorage.setItem(SUSTAINMENT_PLAN_KEY, JSON.stringify(sanitized));
    return { ...sanitized };
  } catch {
    return { ...sustainmentFallback };
  }
}

function writeSustainmentState(next) {
  if (!syntheticRecordReady()) return false;
  const sanitized = sanitizeSustainmentState(next, true);
  sustainmentFallback = sanitized;
  try {
    localStorage.setItem(SUSTAINMENT_PLAN_KEY, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

function resetSustainmentState() {
  sustainmentFallback = defaultSustainmentState();
  try {
    localStorage.removeItem(SUSTAINMENT_PLAN_KEY);
    return true;
  } catch {
    return false;
  }
}

function preparedCount(state) {
  return [state.day7Prepared, state.day30Prepared, state.day90Prepared].filter(Boolean).length;
}

function horizonPrepared(state, id) {
  return state[`${id}Prepared`] === true;
}

function horizonAvailable(state, id) {
  if (id === 'day7') return true;
  if (id === 'day30') return state.day7Prepared === true;
  if (id === 'day90') return state.day30Prepared === true;
  return false;
}

function horizonActionLabel(id) {
  if (id === 'day7') return 'Prepare 7-day check';
  if (id === 'day30') return 'Prepare 30-day review';
  return 'Prepare 90-day review';
}

function sustainmentCardMarkup(horizon, state, ready) {
  const prepared = horizonPrepared(state, horizon.id);
  const available = ready && horizonAvailable(state, horizon.id);
  let action = '<span class="sustainment-plan__gate">Complete the synthetic Transformation Record first</span>';

  if (ready && prepared) action = '<span class="sustainment-plan__prepared">Prepared locally</span>';
  else if (ready && available) action = `<button type="button" class="sustainment-plan__action" data-sustainment-action="${horizon.id}">${horizonActionLabel(horizon.id)}</button>`;
  else if (ready) action = '<span class="sustainment-plan__gate">Prepare the earlier checkpoint first</span>';

  return `<article class="sustainment-plan__card ${prepared ? 'is-prepared' : ''}" data-sustainment-horizon="${horizon.id}">
    <div class="sustainment-plan__card-top"><span>${horizon.label}</span><strong>${prepared ? 'Prepared' : 'Pending'}</strong></div>
    <h3>${horizon.title}</h3>
    <p>${horizon.prompt}</p>
    <dl>
      <div><dt>Evidence target</dt><dd>${horizon.evidence}</dd></div>
      <div><dt>Boundary</dt><dd>Fixed synthetic demo only</dd></div>
    </dl>
    <div class="sustainment-plan__card-action">${action}</div>
  </article>`;
}

function sustainmentSignature(ready, state) {
  return encodeURIComponent(JSON.stringify({
    ready,
    day7Prepared: state.day7Prepared,
    day30Prepared: state.day30Prepared,
    day90Prepared: state.day90Prepared,
  }));
}

function sustainmentPanelMarkup(state, ready, signature, message = '') {
  const count = preparedCount(state);
  return `<section class="sustainment-plan" data-sustainment-plan data-sustainment-signature="${signature}" aria-labelledby="sustainment-plan-title">
    <div class="sustainment-plan__eyebrow">TRANSFORMATION RECORD · SYNTHETIC SUSTAINMENT</div>
    <div class="sustainment-plan__header">
      <div>
        <h2 id="sustainment-plan-title">7 / 30 / 90-day owner follow-through.</h2>
        <p>Cherry can prepare a fixed synthetic follow-up sequence after the demo Transformation Record is complete. These are local planning states only—not calendar events, client promises, measured outcomes, or evidence claims.</p>
      </div>
      ${ready ? '<button type="button" class="sustainment-plan__reset" data-sustainment-reset>Reset follow-up</button>' : ''}
    </div>
    <div class="sustainment-plan__summary">
      <span>${count}/3 prepared locally</span>
      <small data-sustainment-status aria-live="polite">${message || (ready
        ? 'Only version + three sequential booleans are stored in this browser.'
        : 'Complete the fixed synthetic engagement loop before follow-up planning can advance.')}</small>
    </div>
    <div class="sustainment-plan__grid">
      ${SUSTAINMENT_HORIZONS.map((horizon) => sustainmentCardMarkup(horizon, state, ready)).join('')}
    </div>
  </section>`;
}

function sustainmentHost() {
  if (location.hash.replace('#/', '').replace('#', '') !== 'client') return null;
  return document.querySelector('.record-story');
}

function insertSustainmentPanel(panel, host) {
  const syntheticFlow = host.querySelector('[data-synthetic-engagement-flow]');
  if (syntheticFlow) {
    syntheticFlow.insertAdjacentElement('afterend', panel);
    return;
  }
  const top = host.querySelector('.record-story__top');
  if (top) top.insertAdjacentElement('afterend', panel);
  else host.insertAdjacentElement('afterbegin', panel);
}

function refreshSustainment(message = '') {
  document.querySelector('[data-sustainment-plan]')?.remove();
  enhanceSustainment(message);
}

function advanceHorizon(id) {
  const state = readSustainmentState();
  if (!syntheticRecordReady()) return { ok: false, message: 'Synthetic Transformation Record is not complete, so follow-up planning stayed locked.' };
  if (!horizonAvailable(state, id)) return { ok: false, message: 'Prepare the earlier follow-up checkpoint before advancing this one.' };

  state[`${id}Prepared`] = true;
  const saved = writeSustainmentState(state);
  if (!saved) return { ok: false, message: 'The local follow-up state could not be persisted, so the plan did not advance durably.' };
  return { ok: true, message: `${horizonActionLabel(id).replace('Prepare ', '')} prepared locally. No calendar, client, CRM, database, or production system changed.` };
}

function bindSustainmentPanel(panel) {
  panel.querySelector('[data-sustainment-reset]')?.addEventListener('click', () => {
    const cleared = resetSustainmentState();
    refreshSustainment(cleared
      ? 'Synthetic 7 / 30 / 90 follow-up state was reset locally. No external system changed.'
      : 'The in-memory follow-up reset, but browser storage could not be cleared. No external system changed.');
  });

  panel.querySelectorAll('[data-sustainment-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = advanceHorizon(button.dataset.sustainmentAction);
      refreshSustainment(result.message);
    });
  });
}

function enhanceSustainment(message = '') {
  const host = sustainmentHost();
  if (!host) return;

  const ready = syntheticRecordReady();
  const state = readSustainmentState();
  const signature = sustainmentSignature(ready, state);
  const existing = host.querySelector('[data-sustainment-plan]');

  // Keep the locked panel mounted. Replacing it on every child-list mutation
  // creates a self-triggering MutationObserver loop that can prevent window load.
  if (existing?.dataset.sustainmentSignature === signature) return;
  existing?.remove();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = sustainmentPanelMarkup(state, ready, signature, message);
  const panel = wrapper.firstElementChild;
  insertSustainmentPanel(panel, host);
  bindSustainmentPanel(panel);
}

new MutationObserver(() => queueMicrotask(() => enhanceSustainment()))
  .observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => queueMicrotask(() => enhanceSustainment()));
enhanceSustainment();
