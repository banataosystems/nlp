/* WorldStage / Cherry — consolidated owner summary for the synthetic mobile prototype.
   Read-only local demo state only. No network writes, confidential data, evidence claims,
   production authority, scheduling, CRM, database, or client communication. */

const OWNER_SUMMARY_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const OWNER_SUMMARY_DAILY_KEY = 'worldstage.cherry.daily.demo.v1';
const OWNER_SUMMARY_SUSTAINMENT_KEY = 'worldstage.synthetic.sustainment.plan.v1';
const OWNER_SUMMARY_DAILY_ALLOWED = new Set(['needs-cherry', 'prepared', 'parked']);

function safeLocalJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function readOwnerSummaryFlow() {
  const value = safeLocalJson(OWNER_SUMMARY_FLOW_KEY);
  if (!value || value.version !== 1) {
    return { discoveryPrepared: false, ownerReviewed: false, recordPrepared: false };
  }
  const discoveryPrepared = value.discoveryPrepared === true;
  const ownerReviewed = discoveryPrepared && value.ownerReviewed === true;
  const recordPrepared = ownerReviewed && value.recordPrepared === true;
  return { discoveryPrepared, ownerReviewed, recordPrepared };
}

function readOwnerSummaryDaily() {
  const value = safeLocalJson(OWNER_SUMMARY_DAILY_KEY) || {};
  const fallback = { '01': 'needs-cherry', '02': 'needs-cherry', '03': 'needs-cherry' };
  const state = Object.fromEntries(Object.entries(fallback).map(([id, initial]) => {
    const candidate = value?.[id];
    return [id, OWNER_SUMMARY_DAILY_ALLOWED.has(candidate) ? candidate : initial];
  }));
  const counts = { needsCherry: 0, prepared: 0, parked: 0 };
  Object.values(state).forEach((item) => {
    if (item === 'prepared') counts.prepared += 1;
    else if (item === 'parked') counts.parked += 1;
    else counts.needsCherry += 1;
  });
  return counts;
}

function readOwnerSummarySustainment(flow) {
  if (!flow.recordPrepared) {
    return { day7Prepared: false, day30Prepared: false, day90Prepared: false };
  }
  const value = safeLocalJson(OWNER_SUMMARY_SUSTAINMENT_KEY);
  if (!value || value.version !== 1) {
    return { day7Prepared: false, day30Prepared: false, day90Prepared: false };
  }
  const day7Prepared = value.day7Prepared === true;
  const day30Prepared = day7Prepared && value.day30Prepared === true;
  const day90Prepared = day30Prepared && value.day90Prepared === true;
  return { day7Prepared, day30Prepared, day90Prepared };
}

function ownerSummaryNext(flow, sustainment) {
  if (!flow.discoveryPrepared) {
    return { phase: 'Discovery', action: 'Prepare synthetic Discovery brief', route: 'discovery', detail: 'Start the fixed demo engagement without using client form values.' };
  }
  if (!flow.ownerReviewed) {
    return { phase: 'Cherry judgment', action: 'Prepare Cherry judgment item 01', route: 'cockpit', detail: 'The synthetic brief is ready; Cherry judgment is the next controlled step.' };
  }
  if (!flow.recordPrepared) {
    return { phase: 'Transformation Record', action: 'Prepare synthetic Transformation Record', route: 'client', detail: 'Owner judgment is prepared; the synthetic record is next.' };
  }
  if (!sustainment.day7Prepared) {
    return { phase: 'Sustainment', action: 'Prepare 7-day follow-through', route: 'client', detail: 'The synthetic record is complete; begin the sequential owner follow-through.' };
  }
  if (!sustainment.day30Prepared) {
    return { phase: 'Sustainment', action: 'Prepare 30-day review', route: 'client', detail: 'The 7-day checkpoint is prepared; review the 30-day pattern next.' };
  }
  if (!sustainment.day90Prepared) {
    return { phase: 'Sustainment', action: 'Prepare 90-day review', route: 'client', detail: 'The 30-day checkpoint is prepared; the 90-day sustainment decision is next.' };
  }
  return { phase: 'Sustainment complete', action: 'Review completed synthetic loop', route: 'client', detail: 'All demo checkpoints are prepared locally. Nothing has been released or written externally.' };
}

function ownerSummaryState() {
  const flow = readOwnerSummaryFlow();
  const daily = readOwnerSummaryDaily();
  const sustainment = readOwnerSummarySustainment(flow);
  const next = ownerSummaryNext(flow, sustainment);
  return { flow, daily, sustainment, next };
}

function ownerSummaryCheckpoint(label, prepared, available) {
  const status = prepared ? 'Prepared' : available ? 'Next' : 'Locked';
  return `<article class="cherry-owner-summary__checkpoint ${prepared ? 'is-prepared' : ''} ${available && !prepared ? 'is-next' : ''}">
    <span>${label}</span><strong>${status}</strong>
  </article>`;
}

function ownerSummaryMarkup(state, signature) {
  const { flow, daily, sustainment, next } = state;
  const day7Available = flow.recordPrepared;
  const day30Available = sustainment.day7Prepared;
  const day90Available = sustainment.day30Prepared;
  return `<section class="cherry-owner-summary" data-cherry-owner-summary data-owner-summary-signature='${signature}' aria-labelledby="cherry-owner-summary-title">
    <div class="cherry-owner-summary__eyebrow">CHERRY OWNER SUMMARY · LOCAL SYNTHETIC DEMO</div>
    <div class="cherry-owner-summary__header">
      <div>
        <h2 id="cherry-owner-summary-title">What needs Cherry next?</h2>
        <p>One phone view of the synthetic engagement phase, next owner action, judgment queue, and 7 / 30 / 90 follow-through.</p>
      </div>
      <span class="cherry-owner-summary__phase" data-owner-summary-phase>${next.phase}</span>
    </div>

    <div class="cherry-owner-summary__next">
      <div><span>NEXT OWNER ACTION</span><strong data-owner-summary-next>${next.action}</strong><p>${next.detail}</p></div>
      <button type="button" data-owner-summary-nav="${next.route}">Open next step →</button>
    </div>

    <div class="cherry-owner-summary__metrics" aria-label="Cherry Daily local demo summary">
      <article><span>Needs Cherry</span><strong data-owner-summary-daily="needs">${daily.needsCherry}</strong></article>
      <article><span>Prepared</span><strong data-owner-summary-daily="prepared">${daily.prepared}</strong></article>
      <article><span>Parked</span><strong data-owner-summary-daily="parked">${daily.parked}</strong></article>
    </div>

    <div class="cherry-owner-summary__followup" aria-label="Synthetic 7 30 90 follow-up status">
      ${ownerSummaryCheckpoint('7 days', sustainment.day7Prepared, day7Available)}
      ${ownerSummaryCheckpoint('30 days', sustainment.day30Prepared, day30Available)}
      ${ownerSummaryCheckpoint('90 days', sustainment.day90Prepared, day90Available)}
    </div>

    <div class="cherry-owner-summary__boundary" data-owner-summary-boundary>
      <strong>Evidence & privacy boundary</strong>
      <p>Local synthetic demo only. No real client data, database write, CRM action, email, calendar event, evidence claim, confidential intake, production access, or release authority is created here.</p>
    </div>
  </section>`;
}

function currentOwnerSummaryRoute() {
  return location.hash.replace('#/', '').replace('#', '') || 'home';
}

function bindOwnerSummary(summary) {
  summary.querySelector('[data-owner-summary-nav]')?.addEventListener('click', (event) => {
    const target = event.currentTarget.dataset.ownerSummaryNav;
    if (new Set(['discovery', 'cockpit', 'client']).has(target)) location.hash = `#/${target}`;
  });
}

function enhanceOwnerSummary() {
  const existing = document.querySelector('[data-cherry-owner-summary]');
  if (currentOwnerSummaryRoute() !== 'cockpit') {
    existing?.remove();
    return;
  }

  const host = document.querySelector('.cockpit-shell');
  if (!host) return;
  const state = ownerSummaryState();
  const signature = encodeURIComponent(JSON.stringify(state));
  if (existing?.dataset.ownerSummarySignature === signature) return;

  existing?.remove();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = ownerSummaryMarkup(state, signature);
  const summary = wrapper.firstElementChild;
  const anchor = host.querySelector('[data-synthetic-engagement-flow]')
    || host.querySelector('[data-cherry-daily]')
    || host.querySelector('.cockpit-header');
  if (anchor) anchor.insertAdjacentElement('afterend', summary);
  else host.insertAdjacentElement('afterbegin', summary);
  bindOwnerSummary(summary);
}

new MutationObserver(() => queueMicrotask(enhanceOwnerSummary)).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => queueMicrotask(enhanceOwnerSummary));
window.addEventListener('storage', () => queueMicrotask(enhanceOwnerSummary));
enhanceOwnerSummary();
