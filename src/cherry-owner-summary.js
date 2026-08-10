/* WorldStage / Cherry — consolidated owner summary for the synthetic mobile prototype.
   Read-only local demo state only. No network writes, confidential data, evidence claims,
   production authority, scheduling, CRM, database, or client communication. */

const OWNER_SUMMARY_FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const OWNER_SUMMARY_DAILY_KEY = 'worldstage.cherry.daily.demo.v1';
const OWNER_SUMMARY_SUSTAINMENT_KEY = 'worldstage.synthetic.sustainment.plan.v1';
const OWNER_SUMMARY_RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';
const OWNER_SUMMARY_DAILY_ALLOWED = new Set(['needs-cherry', 'prepared', 'parked']);
const OWNER_SUMMARY_RATIONALE_ALLOWED = new Set(['ready', 'needs-context', 'can-wait']);
const OWNER_SUMMARY_RATIONALE_LABELS = Object.freeze({
  ready: 'Ready',
  'needs-context': 'Needs context',
  'can-wait': 'Can wait',
});
let ownerSummaryReturnFocus = null;

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
  return { ...counts, items: state };
}

function readOwnerSummaryRationale() {
  const value = safeLocalJson(OWNER_SUMMARY_RATIONALE_KEY) || {};
  const fallback = { '01': 'needs-context', '02': 'needs-context', '03': 'needs-context' };
  return Object.fromEntries(Object.entries(fallback).map(([id, initial]) => {
    const candidate = value?.[id];
    return [id, OWNER_SUMMARY_RATIONALE_ALLOWED.has(candidate) ? candidate : initial];
  }));
}

function ownerSummaryRationaleLabel(value) {
  return OWNER_SUMMARY_RATIONALE_LABELS[value] || OWNER_SUMMARY_RATIONALE_LABELS['needs-context'];
}

function ownerSummaryDailyLabel(value) {
  if (value === 'prepared') return 'Prepared';
  if (value === 'parked') return 'Parked';
  return 'Needs Cherry';
}

function ownerSummaryPriority(daily, rationale) {
  const itemIds = ['01', '02', '03'];
  const stateOrder = ['needs-cherry', 'prepared', 'parked'];
  let id = '01';
  for (const state of stateOrder) {
    const match = itemIds.find((candidate) => daily.items?.[candidate] === state);
    if (match) {
      id = match;
      break;
    }
  }
  const decisionState = OWNER_SUMMARY_DAILY_ALLOWED.has(daily.items?.[id]) ? daily.items[id] : 'needs-cherry';
  const rationaleValue = OWNER_SUMMARY_RATIONALE_ALLOWED.has(rationale?.[id]) ? rationale[id] : 'needs-context';
  return {
    id,
    decisionState,
    decisionLabel: ownerSummaryDailyLabel(decisionState),
    rationaleValue,
    rationaleLabel: ownerSummaryRationaleLabel(rationaleValue),
  };
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

function ownerSummaryHandoff(state) {
  const { flow, daily, sustainment } = state;
  const queue = `${daily.needsCherry} need Cherry · ${daily.prepared} prepared · ${daily.parked} parked`;

  if (!flow.discoveryPrepared) {
    return {
      title: 'Open the synthetic Discovery brief',
      context: `The fixed demo engagement has not entered Discovery yet. Cherry Daily currently shows ${queue}.`,
      decision: 'Is the fixed demo engagement ready to enter Cherry’s judgment queue?',
      defer: 'If Cherry does nothing, the synthetic engagement remains before Discovery and no external system changes.',
      boundary: 'No Discovery form text, client identifier, contact detail, or private source is read into this briefing.',
    };
  }
  if (!flow.ownerReviewed) {
    return {
      title: 'Decide demo judgment item 01',
      context: `The synthetic Discovery brief is prepared. Cherry Daily currently shows ${queue}.`,
      decision: 'Should demo item 01 be prepared for the next step, parked, or remain with Cherry?',
      defer: 'If Cherry does nothing, item 01 remains in its current local demo state and the Transformation Record stays locked.',
      boundary: 'This is a local demo judgment state only; it does not approve, notify, schedule, or write to a client system.',
    };
  }
  if (!flow.recordPrepared) {
    return {
      title: 'Review the synthetic Transformation Record',
      context: `Demo judgment item 01 is prepared. Cherry Daily currently shows ${queue}.`,
      decision: 'Is the fixed synthetic outcome ready to be represented in the demo Transformation Record?',
      defer: 'If Cherry does nothing, the synthetic record remains unprepared and no sustainment checkpoint becomes available.',
      boundary: 'The record is prototype evidence only, not a verified client outcome or external record.',
    };
  }
  if (!sustainment.day7Prepared) {
    return {
      title: 'Set the 7-day ownership check',
      context: 'The synthetic Transformation Record is prepared; no sustainment checkpoint has been prepared yet.',
      decision: 'What ownership follow-through should the fixed demo review at the 7-day checkpoint?',
      defer: 'If Cherry does nothing, the synthetic loop remains complete through the Transformation Record and follow-through stays pending.',
      boundary: 'Preparing it stores one local boolean only; it creates no calendar event, task, reminder, or client commitment.',
    };
  }
  if (!sustainment.day30Prepared) {
    return {
      title: 'Review the 30-day pattern',
      context: 'The synthetic 7-day checkpoint is prepared locally; the 30-day pattern review is next.',
      decision: 'Does the fixed demo pattern suggest the operating rhythm should continue unchanged or be revisited?',
      defer: 'If Cherry does nothing, the synthetic 30-day checkpoint remains pending and the 90-day review stays locked.',
      boundary: 'This is a planning prompt over synthetic state, not a measured outcome, evidence claim, or business-system update.',
    };
  }
  if (!sustainment.day90Prepared) {
    return {
      title: 'Make the 90-day sustainment decision',
      context: 'The synthetic 7-day and 30-day checkpoints are prepared locally; the final demo checkpoint is next.',
      decision: 'Should the fixed demo operating rhythm be sustained, adjusted, or retired?',
      defer: 'If Cherry does nothing, the synthetic 90-day checkpoint remains pending and the demo loop stays open.',
      boundary: 'No real program commitment, contract, client communication, or production change is created by this view.',
    };
  }
  return {
    title: 'Review the completed synthetic loop',
    context: `All three synthetic sustainment checkpoints are prepared. Cherry Daily currently shows ${queue}.`,
    decision: 'Is there a useful operating pattern to carry into a future owner-validated design iteration?',
    defer: 'If Cherry does nothing, the completed local demo remains unchanged; nothing is promoted, released, or sent anywhere.',
    boundary: 'Completion here means demo-state completion only; it does not authorize live staging, confidential intake, or production release.',
  };
}

function ownerSummaryState() {
  const flow = readOwnerSummaryFlow();
  const daily = readOwnerSummaryDaily();
  const rationale = readOwnerSummaryRationale();
  const priority = ownerSummaryPriority(daily, rationale);
  const sustainment = readOwnerSummarySustainment(flow);
  const next = ownerSummaryNext(flow, sustainment);
  return { flow, daily, rationale, priority, sustainment, next };
}

function ownerSummaryCheckpoint(label, prepared, available) {
  const status = prepared ? 'Prepared' : available ? 'Next' : 'Locked';
  return `<article class="cherry-owner-summary__checkpoint ${prepared ? 'is-prepared' : ''} ${available && !prepared ? 'is-next' : ''}">
    <span>${label}</span><strong>${status}</strong>
  </article>`;
}

function ownerSummaryMarkup(state, signature) {
  const { flow, daily, priority, sustainment, next } = state;
  const handoff = ownerSummaryHandoff(state);
  const rationaleLabel = ownerSummaryRationaleLabel(state.rationale['01']);
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
      <div><span>NEXT OWNER ACTION</span><strong data-owner-summary-next>${next.action}</strong><p>${next.detail}</p><p data-owner-summary-rationale>Why surfaced: ${rationaleLabel} · fixed rationale for demo item 01.</p></div>
      <button type="button" data-owner-summary-nav="${next.route}">Open next step →</button>
    </div>

    <div class="cherry-owner-summary__next" data-owner-summary-priority>
      <div>
        <span>PRIORITY JUDGMENT · SYNTHETIC</span>
        <strong data-owner-summary-priority-item>Item ${priority.id}</strong>
        <p data-owner-summary-priority-state>${priority.decisionLabel} · ${priority.rationaleLabel}</p>
        <p>Priority uses only the fixed local demo states: Needs Cherry first, then Prepared, then Parked; ties use the lowest item number. No scoring model or private data is used.</p>
      </div>
    </div>

    <div class="cherry-owner-summary__next" data-owner-summary-brief>
      <div>
        <span>OWNER HANDOFF · 60-SECOND BRIEF</span>
        <strong data-owner-summary-brief-title>${handoff.title}</strong>
        <p data-owner-summary-brief-context>${handoff.context}</p>
        <p><b>Cherry decides:</b> <span data-owner-summary-brief-decision>${handoff.decision}</span></p>
        <p data-owner-summary-brief-rationale><b>Why surfaced:</b> ${rationaleLabel} · fixed rationale for demo item 01.</p>
        <p><b>Boundary:</b> <span data-owner-summary-brief-boundary>${handoff.boundary}</span></p>
      </div>
      <button type="button" data-owner-summary-open-brief>Open 60-second brief →</button>
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

function ownerSummaryBriefingMarkup(state) {
  const handoff = ownerSummaryHandoff(state);
  const rationaleLabel = ownerSummaryRationaleLabel(state.rationale['01']);
  return `<div class="cherry-owner-handoff" data-owner-summary-handoff role="dialog" aria-modal="true" aria-labelledby="cherry-owner-handoff-title">
    <div class="cherry-owner-handoff__top">
      <div><span>OWNER HANDOFF · LOCAL SYNTHETIC DEMO</span><h2 id="cherry-owner-handoff-title">${handoff.title}</h2></div>
      <button type="button" data-owner-summary-handoff-close aria-label="Close owner handoff">Close</button>
    </div>
    <div class="cherry-owner-handoff__grid">
      <article><span>SITUATION</span><p data-owner-summary-handoff-context>${handoff.context}</p></article>
      <article><span>CHERRY DECIDES</span><p data-owner-summary-handoff-decision>${handoff.decision}</p></article>
      <article><span>WHY THIS IS SURFACED</span><p data-owner-summary-handoff-rationale>${rationaleLabel} · fixed rationale for demo item 01.</p></article>
      <article><span>IF NO DECISION</span><p data-owner-summary-handoff-defer>${handoff.defer}</p></article>
      <article><span>BOUNDARY</span><p data-owner-summary-handoff-boundary>${handoff.boundary}</p></article>
    </div>
    <div class="cherry-owner-handoff__footer">
      <p>This briefing is generated only from sanitized local demo state. It cannot approve, send, schedule, store, release, or activate anything outside this browser.</p>
      <button type="button" data-owner-summary-handoff-next="${state.next.route}">Open ${state.next.phase} step →</button>
    </div>
  </div>`;
}

function currentOwnerSummaryRoute() {
  return location.hash.replace('#/', '').replace('#', '') || 'home';
}

function closeOwnerSummaryBriefing({ restoreFocus = true } = {}) {
  document.querySelector('[data-owner-summary-handoff-overlay]')?.remove();
  document.body.classList.remove('cherry-owner-handoff-open');
  if (restoreFocus && ownerSummaryReturnFocus instanceof HTMLElement) ownerSummaryReturnFocus.focus({ preventScroll: true });
  ownerSummaryReturnFocus = null;
}

function openOwnerSummaryBriefing(trigger) {
  closeOwnerSummaryBriefing({ restoreFocus: false });
  ownerSummaryReturnFocus = trigger;
  const state = ownerSummaryState();
  const overlay = document.createElement('div');
  overlay.className = 'cherry-owner-handoff-overlay';
  overlay.dataset.ownerSummaryHandoffOverlay = '';
  overlay.innerHTML = ownerSummaryBriefingMarkup(state);
  document.body.append(overlay);
  document.body.classList.add('cherry-owner-handoff-open');

  const close = overlay.querySelector('[data-owner-summary-handoff-close]');
  close?.addEventListener('click', () => closeOwnerSummaryBriefing());
  overlay.addEventListener('pointerdown', (event) => {
    if (event.target === overlay) closeOwnerSummaryBriefing();
  });
  overlay.querySelector('[data-owner-summary-handoff-next]')?.addEventListener('click', (event) => {
    const target = event.currentTarget.dataset.ownerSummaryHandoffNext;
    if (!new Set(['discovery', 'cockpit', 'client']).has(target)) return;
    closeOwnerSummaryBriefing({ restoreFocus: false });
    location.hash = `#/${target}`;
  });
  close?.focus({ preventScroll: true });
}

function bindOwnerSummary(summary) {
  summary.querySelector('[data-owner-summary-nav]')?.addEventListener('click', (event) => {
    const target = event.currentTarget.dataset.ownerSummaryNav;
    if (new Set(['discovery', 'cockpit', 'client']).has(target)) location.hash = `#/${target}`;
  });
  summary.querySelector('[data-owner-summary-open-brief]')?.addEventListener('click', (event) => {
    openOwnerSummaryBriefing(event.currentTarget);
  });
}

function enhanceOwnerSummary() {
  const existing = document.querySelector('[data-cherry-owner-summary]');
  if (currentOwnerSummaryRoute() !== 'cockpit') {
    existing?.remove();
    closeOwnerSummaryBriefing({ restoreFocus: false });
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

function trapOwnerSummaryBriefingFocus(event) {
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('[data-owner-summary-handoff]');
  if (!dialog) return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((node) => node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

new MutationObserver(() => queueMicrotask(enhanceOwnerSummary)).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => {
  closeOwnerSummaryBriefing({ restoreFocus: false });
  queueMicrotask(enhanceOwnerSummary);
});
window.addEventListener('storage', () => queueMicrotask(enhanceOwnerSummary));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('[data-owner-summary-handoff-overlay]')) {
    event.preventDefault();
    closeOwnerSummaryBriefing();
    return;
  }
  trapOwnerSummaryBriefingFocus(event);
});
enhanceOwnerSummary();