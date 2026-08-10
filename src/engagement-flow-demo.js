/* WorldStage / Cherry — synthetic end-to-end engagement loop.
   This file intentionally uses fixed demo data only. It never reads Discovery form values,
   never performs network writes, and cannot authorize production or confidential-data use. */

const SYNTHETIC_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const SYNTHETIC_FLOW_VERSION = 1;
const CHERRY_DAILY_DEMO_KEY = 'worldstage.cherry.daily.demo.v1';

const SYNTHETIC_ENGAGEMENT = Object.freeze({
  id: 'WS-SYN-001',
  organization: 'WorldStage Synthetic Account 001',
  signal: 'A demo leadership team is experiencing slow cross-team decisions and unclear ownership.',
  desired: 'A shared decision rhythm with clearer ownership and a measurable follow-through pattern.',
  intervention: 'Demo leadership alignment experience',
  evidenceState: 'Anecdotal demo only',
});

const FLOW_ROUTES = new Set(['discovery', 'cockpit', 'client']);

function defaultSyntheticFlowState() {
  return {
    version: SYNTHETIC_FLOW_VERSION,
    discoveryPrepared: false,
    ownerReviewed: false,
    recordPrepared: false,
  };
}

let syntheticFlowFallback = defaultSyntheticFlowState();

function sanitizeSyntheticFlowState(value) {
  if (!value || value.version !== SYNTHETIC_FLOW_VERSION) return defaultSyntheticFlowState();
  const discoveryPrepared = value.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && value.ownerReviewed === true;
  const recordPrepared = ownerReviewed && value.recordPrepared === true;
  return {
    version: SYNTHETIC_FLOW_VERSION,
    discoveryPrepared,
    ownerReviewed,
    recordPrepared,
  };
}

function readSyntheticFlowState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYNTHETIC_FLOW_KEY) || 'null');
    const sanitized = sanitizeSyntheticFlowState(parsed);
    syntheticFlowFallback = sanitized;
    return sanitized;
  } catch {
    return { ...syntheticFlowFallback };
  }
}

function writeSyntheticFlowState(next) {
  const sanitized = sanitizeSyntheticFlowState(next);
  syntheticFlowFallback = sanitized;
  try {
    localStorage.setItem(SYNTHETIC_FLOW_KEY, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

function resetSyntheticFlowState() {
  syntheticFlowFallback = defaultSyntheticFlowState();
  try {
    localStorage.removeItem(SYNTHETIC_FLOW_KEY);
    localStorage.removeItem(CHERRY_DAILY_DEMO_KEY);
    return true;
  } catch {
    return false;
  }
}

function routeFromSyntheticFlowHash() {
  const raw = location.hash.replace('#/', '').replace('#', '');
  return FLOW_ROUTES.has(raw) ? raw : null;
}

function syntheticFlowStep(state) {
  if (state.recordPrepared) return 3;
  if (state.ownerReviewed) return 2;
  if (state.discoveryPrepared) return 1;
  return 0;
}

function syntheticFlowProgressMarkup(state) {
  const current = syntheticFlowStep(state);
  const steps = [
    ['Discovery brief', 1],
    ['Cherry judgment', 2],
    ['Transformation record', 3],
  ];
  return `<div class="synthetic-flow__progress" aria-label="Synthetic engagement progress">
    ${steps.map(([label, threshold], index) => {
      const complete = current >= threshold;
      const active = current === threshold - 1;
      return `<div class="synthetic-flow__step ${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''}">
        <span>${String(index + 1).padStart(2, '0')}</span><strong>${label}</strong>
      </div>`;
    }).join('')}
  </div>`;
}

function syntheticFlowRouteActions(route, state) {
  if (route === 'discovery') {
    if (!state.discoveryPrepared) {
      return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-action="prepare-discovery">Prepare fixed synthetic brief</button>`;
    }
    return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-nav="cockpit">Open Cherry OS judgment →</button>`;
  }

  if (route === 'cockpit') {
    if (!state.discoveryPrepared) {
      return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-nav="discovery">Start at synthetic Discovery →</button>`;
    }
    if (!state.ownerReviewed) {
      return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-action="owner-review">Mark synthetic item prepared</button>`;
    }
    return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-nav="client">Open Transformation Record →</button>`;
  }

  if (!state.ownerReviewed) {
    return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-nav="cockpit">Complete Cherry judgment first →</button>`;
  }
  if (!state.recordPrepared) {
    return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-action="prepare-record">Prepare synthetic record</button>`;
  }
  return `<button type="button" class="synthetic-flow__primary" data-synthetic-flow-nav="discovery">Run the loop again →</button>`;
}

function syntheticFlowStatusCopy(state) {
  if (state.recordPrepared) return 'Loop complete · local synthetic record prepared';
  if (state.ownerReviewed) return 'Cherry judgment complete · Transformation Record is next';
  if (state.discoveryPrepared) return 'Synthetic discovery prepared · Cherry judgment is next';
  return 'Ready to begin · no real client data is used';
}

function syntheticFlowPanelMarkup(route, state, message = '') {
  return `<section class="synthetic-flow" data-synthetic-engagement-flow aria-labelledby="synthetic-flow-title">
    <div class="synthetic-flow__eyebrow">SYNTHETIC ENGAGEMENT LOOP · LOCAL DEMO</div>
    <div class="synthetic-flow__header">
      <div>
        <h2 id="synthetic-flow-title">One WorldStage engagement, end to end.</h2>
        <p>This walkthrough connects Discovery → Cherry judgment → Transformation Record using fixed synthetic data only. It does not read the Discovery form, contact a client, send email, call a CRM, write to a database, or touch production.</p>
      </div>
      <button type="button" class="synthetic-flow__reset" data-synthetic-flow-reset>Reset demo</button>
    </div>
    ${syntheticFlowProgressMarkup(state)}
    <div class="synthetic-flow__account" aria-label="Synthetic engagement details">
      <div><span>ENGAGEMENT</span><strong>${SYNTHETIC_ENGAGEMENT.id}</strong></div>
      <div><span>ORGANIZATION</span><strong>${SYNTHETIC_ENGAGEMENT.organization}</strong></div>
      <div><span>INTERVENTION</span><strong>${SYNTHETIC_ENGAGEMENT.intervention}</strong></div>
      <div><span>EVIDENCE</span><strong>${SYNTHETIC_ENGAGEMENT.evidenceState}</strong></div>
    </div>
    <div class="synthetic-flow__story">
      <article><span>SYNTHETIC SIGNAL</span><p>${SYNTHETIC_ENGAGEMENT.signal}</p></article>
      <article><span>SYNTHETIC DESIRED REALITY</span><p>${SYNTHETIC_ENGAGEMENT.desired}</p></article>
    </div>
    <div class="synthetic-flow__footer">
      <div>
        <span class="synthetic-flow__status">${syntheticFlowStatusCopy(state)}</span>
        <small data-synthetic-flow-status aria-live="polite">${message || 'Only version + three booleans are persisted for this walkthrough.'}</small>
      </div>
      ${syntheticFlowRouteActions(route, state)}
    </div>
  </section>`;
}

function syntheticFlowHost(route) {
  if (route === 'discovery') return document.querySelector('.discovery-shell');
  if (route === 'cockpit') return document.querySelector('.cockpit-shell');
  if (route === 'client') return document.querySelector('.record-story');
  return null;
}

function insertSyntheticFlowPanel(route, panel, host) {
  if (route === 'discovery') {
    host.insertAdjacentElement('afterbegin', panel);
    return;
  }
  if (route === 'cockpit') {
    const header = host.querySelector('.cockpit-header');
    if (header) header.insertAdjacentElement('afterend', panel);
    else host.insertAdjacentElement('afterbegin', panel);
    return;
  }
  const top = host.querySelector('.record-story__top');
  if (top) top.insertAdjacentElement('afterend', panel);
  else host.insertAdjacentElement('afterbegin', panel);
}

function readCherryPreparedState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHERRY_DAILY_DEMO_KEY) || '{}');
    return parsed?.['01'] === 'prepared';
  } catch {
    return false;
  }
}

function refreshSyntheticFlow(message = '') {
  document.querySelector('[data-synthetic-engagement-flow]')?.remove();
  enhanceSyntheticFlow(message);
}

function bindSyntheticFlowPanel(panel, route) {
  panel.querySelectorAll('[data-synthetic-flow-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.syntheticFlowNav;
      if (FLOW_ROUTES.has(target)) location.hash = `#/${target}`;
    });
  });

  panel.querySelector('[data-synthetic-flow-reset]')?.addEventListener('click', () => {
    const cleared = resetSyntheticFlowState();
    refreshSyntheticFlow(cleared
      ? 'Synthetic engagement and Cherry Daily demo states were reset locally. No external system changed.'
      : 'The in-memory demo reset, but browser storage could not be cleared. No external system changed.');
  });

  panel.querySelector('[data-synthetic-flow-action="prepare-discovery"]')?.addEventListener('click', () => {
    if (route !== 'discovery') return;
    const state = readSyntheticFlowState();
    state.discoveryPrepared = true;
    const saved = writeSyntheticFlowState(state);
    refreshSyntheticFlow(saved
      ? 'Fixed synthetic Discovery brief prepared locally. No form values were read or copied.'
      : 'Synthetic Discovery is prepared for this view, but browser storage is unavailable.');
  });

  panel.querySelector('[data-synthetic-flow-action="owner-review"]')?.addEventListener('click', () => {
    if (route !== 'cockpit') return;
    const state = readSyntheticFlowState();
    if (!state.discoveryPrepared) {
      refreshSyntheticFlow('Discovery must be prepared before Cherry judgment can advance.');
      return;
    }

    const preparedButton = document.querySelector('[data-cherry-decision-state="01"] [data-cherry-daily-set="prepared"]');
    if (!(preparedButton instanceof HTMLButtonElement)) {
      refreshSyntheticFlow('Cherry Daily item 01 is unavailable, so the synthetic loop did not advance.');
      return;
    }

    preparedButton.click();
    if (!readCherryPreparedState()) {
      refreshSyntheticFlow('Cherry Daily did not persist the prepared state, so the synthetic loop failed closed.');
      return;
    }

    state.ownerReviewed = true;
    const saved = writeSyntheticFlowState(state);
    refreshSyntheticFlow(saved
      ? 'Cherry Daily item 01 is prepared locally. No approval, client communication, or external write occurred.'
      : 'Cherry judgment changed in the local view, but the synthetic loop could not persist and did not advance durably.');
  });

  panel.querySelector('[data-synthetic-flow-action="prepare-record"]')?.addEventListener('click', () => {
    if (route !== 'client') return;
    const state = readSyntheticFlowState();
    if (!state.ownerReviewed) {
      refreshSyntheticFlow('Cherry judgment must be completed before the synthetic Transformation Record can be prepared.');
      return;
    }
    state.recordPrepared = true;
    const saved = writeSyntheticFlowState(state);
    refreshSyntheticFlow(saved
      ? 'Synthetic Transformation Record prepared locally. It is demo evidence, not a real client outcome.'
      : 'Synthetic record is prepared for this view, but browser storage is unavailable.');
  });
}

function enhanceSyntheticFlow(message = '') {
  const route = routeFromSyntheticFlowHash();
  if (!route) return;
  const host = syntheticFlowHost(route);
  if (!host || host.querySelector('[data-synthetic-engagement-flow]')) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = syntheticFlowPanelMarkup(route, readSyntheticFlowState(), message);
  const panel = wrapper.firstElementChild;
  insertSyntheticFlowPanel(route, panel, host);
  bindSyntheticFlowPanel(panel, route);
}

new MutationObserver(() => queueMicrotask(() => enhanceSyntheticFlow())).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => queueMicrotask(() => enhanceSyntheticFlow()));
enhanceSyntheticFlow();
