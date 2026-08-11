/* WorldStage / Cherry — fixed pre-resume consequence cue for the synthetic owner action card.
   Derived only from the existing allowlisted Resume route. Navigation/focus semantics stay owned by
   cherry-engagement-continuity.js. Also surfaces a read-only The Room availability cue only for the
   sanitized Cherry-review stage, with a fixed synthetic source status, source-connection boundary,
   readiness mini-check and non-authority boundary note. A persistent accessibility-only live region
   announces sanitized stage/attention changes while the cockpit remains active. No persistence,
   provider writes, analytics, scoring or authority. */

const CHERRY_RESUME_CONSEQUENCE_ID = 'cherry-engagement-resume-consequence';
const CHERRY_RESUME_CONSEQUENCE = Object.freeze({
  discovery: 'Resume only opens the existing synthetic Discovery step. It does not submit, send, approve, persist, or release anything.',
  cockpit: 'Resume only focuses the existing synthetic Cherry review step. It does not submit, send, approve, persist, or release anything.',
  client: 'Resume only opens the existing synthetic Transformation Record step. It does not submit, send, approve, persist, or release anything.',
});
const CHERRY_ROOM_SOURCE_STATUS_TEXT = 'Sources · synthetic demo only';
const CHERRY_ROOM_SOURCE_BOUNDARY_TEXT = 'External/private sources are not queried by this demo.';
const CHERRY_ROOM_AVAILABILITY_TEXT = 'The Room briefing pattern is available from the active judgment card. Demo-only structure; no verified private client facts are connected.';
const CHERRY_ROOM_READINESS_ITEMS = Object.freeze([
  'Briefing structure available',
  'Verified private sources not connected',
  'Human review required',
]);
const CHERRY_ROOM_BOUNDARY_TEXT = 'Synthetic organization only. The Room cannot contact participants, access private systems, make commitments, approve outcomes, publish, or send anything.';
const CHERRY_OWNER_LIVE_REGION_ID = 'cherry-engagement-owner-live-region';
const CHERRY_OWNER_LIVE_REGION_STATE = Object.freeze({
  discovery: Object.freeze({
    route: 'discovery',
    attentionId: 'prepared-flow',
    message: 'Synthetic engagement stage changed to Discovery. Owner attention: Continue prepared flow.',
  }),
  review: Object.freeze({
    route: 'cockpit',
    attentionId: 'needs-cherry',
    message: 'Synthetic engagement stage changed to Cherry review. Owner attention: Needs Cherry now.',
  }),
  record: Object.freeze({
    route: 'client',
    attentionId: 'prepared-flow',
    message: 'Synthetic engagement stage changed to Transformation Record. Owner attention: Continue prepared flow.',
  }),
});

let cherryResumeConsequenceQueued = false;
let cherryOwnerLiveRegionState = null;

function cherryResumeConsequenceText(route) {
  return Object.prototype.hasOwnProperty.call(CHERRY_RESUME_CONSEQUENCE, route)
    ? CHERRY_RESUME_CONSEQUENCE[route]
    : null;
}

function clearCherryOwnerLiveRegion() {
  document.getElementById(CHERRY_OWNER_LIVE_REGION_ID)?.remove();
  cherryOwnerLiveRegionState = null;
}

function ensureCherryOwnerLiveRegion() {
  const current = document.getElementById(CHERRY_OWNER_LIVE_REGION_ID);
  if (current instanceof HTMLElement) return current;

  const region = document.createElement('span');
  region.id = CHERRY_OWNER_LIVE_REGION_ID;
  region.dataset.cherryEngagementOwnerLiveRegion = '';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('aria-label', 'Synthetic engagement stage and owner attention updates');
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
  document.body.append(region);
  return region;
}

function syncCherryOwnerLiveRegion(card, route) {
  const strip = card.closest('[data-cherry-engagement-continuity]');
  const stage = strip?.dataset.cherryEngagementContinuityStage;
  const config = Object.prototype.hasOwnProperty.call(CHERRY_OWNER_LIVE_REGION_STATE, stage)
    ? CHERRY_OWNER_LIVE_REGION_STATE[stage]
    : null;

  if (!config || route !== config.route) {
    clearCherryOwnerLiveRegion();
    return;
  }

  const key = `${stage}:${config.attentionId}`;
  const region = ensureCherryOwnerLiveRegion();

  if (cherryOwnerLiveRegionState === null) {
    cherryOwnerLiveRegionState = key;
    region.dataset.cherryEngagementOwnerLiveRegionState = key;
    region.textContent = '';
    return;
  }

  if (cherryOwnerLiveRegionState === key) return;

  cherryOwnerLiveRegionState = key;
  region.dataset.cherryEngagementOwnerLiveRegionState = key;
  region.textContent = '';
  requestAnimationFrame(() => {
    const current = document.getElementById(CHERRY_OWNER_LIVE_REGION_ID);
    if (current instanceof HTMLElement
      && current.dataset.cherryEngagementOwnerLiveRegionState === key) {
      current.textContent = config.message;
    }
  });
}

function syncCherryRoomAvailability(card, route) {
  const existing = card.querySelector('[data-cherry-engagement-room-availability]');
  const strip = card.closest('[data-cherry-engagement-continuity]');
  const stage = strip?.dataset.cherryEngagementContinuityStage;
  const copy = card.querySelector('.cherry-engagement-continuity__copy');
  const available = stage === 'review' && route === 'cockpit';

  if (!available || !(copy instanceof HTMLElement)) {
    existing?.remove();
    return;
  }

  const readinessMarkup = CHERRY_ROOM_READINESS_ITEMS
    .map((item) => `<li>${item}</li>`)
    .join('');

  if (existing instanceof HTMLElement
    && existing.parentElement === copy
    && existing.dataset.cherryEngagementRoomAvailability === 'review'
    && existing.querySelector('[data-cherry-engagement-room-source-status]')?.textContent === CHERRY_ROOM_SOURCE_STATUS_TEXT
    && existing.querySelector('[data-cherry-engagement-room-source-boundary]')?.textContent === CHERRY_ROOM_SOURCE_BOUNDARY_TEXT
    && existing.querySelector('[data-cherry-engagement-room-availability-copy]')?.textContent === CHERRY_ROOM_AVAILABILITY_TEXT
    && Array.from(existing.querySelectorAll('[data-cherry-engagement-room-readiness] li')).map((item) => item.textContent).join('|') === CHERRY_ROOM_READINESS_ITEMS.join('|')
    && existing.querySelector('[data-cherry-engagement-room-boundary]')?.textContent === CHERRY_ROOM_BOUNDARY_TEXT) return;

  existing?.remove();
  const cue = document.createElement('div');
  cue.className = 'cherry-engagement-continuity__handoff cherry-engagement-continuity__room-availability';
  cue.dataset.cherryEngagementRoomAvailability = 'review';
  cue.setAttribute('aria-label', 'The Room briefing pattern source status, source connection boundary, availability, readiness, and boundary, read only');
  cue.innerHTML = `<span>THE ROOM · DEMO BRIEFING PATTERN · READ ONLY</span><p data-cherry-engagement-room-source-status aria-label="The Room source status, read only">${CHERRY_ROOM_SOURCE_STATUS_TEXT}</p><p data-cherry-engagement-room-source-boundary aria-label="The Room source connection boundary, read only">${CHERRY_ROOM_SOURCE_BOUNDARY_TEXT}</p><p data-cherry-engagement-room-availability-copy>${CHERRY_ROOM_AVAILABILITY_TEXT}</p><ul data-cherry-engagement-room-readiness aria-label="The Room readiness, read only">${readinessMarkup}</ul><p data-cherry-engagement-room-boundary aria-label="The Room boundary, read only">${CHERRY_ROOM_BOUNDARY_TEXT}</p>`;

  const attention = copy.querySelector('[data-cherry-engagement-continuity-attention-cue]');
  if (attention instanceof HTMLElement) attention.insertAdjacentElement('afterend', cue);
  else copy.append(cue);
}

function enhanceCherryResumeConsequence() {
  cherryResumeConsequenceQueued = false;
  const existing = document.querySelector('[data-cherry-engagement-resume-consequence]');
  const existingRoom = document.querySelector('[data-cherry-engagement-room-availability]');
  const card = document.querySelector('[data-cherry-engagement-owner-action]');
  const actions = card?.querySelector('.cherry-engagement-continuity__actions');
  const resume = actions?.querySelector('[data-cherry-engagement-continuity-resume]');

  if (!(card instanceof HTMLElement)
    || !(actions instanceof HTMLElement)
    || !(resume instanceof HTMLButtonElement)) {
    existing?.remove();
    existingRoom?.remove();
    clearCherryOwnerLiveRegion();
    return;
  }

  const route = resume.dataset.cherryEngagementContinuityResume;
  const text = cherryResumeConsequenceText(route);
  if (!text) {
    resume.removeAttribute('aria-describedby');
    existing?.remove();
    syncCherryOwnerLiveRegion(card, route);
    syncCherryRoomAvailability(card, route);
    return;
  }

  syncCherryOwnerLiveRegion(card, route);
  syncCherryRoomAvailability(card, route);
  resume.setAttribute('aria-describedby', CHERRY_RESUME_CONSEQUENCE_ID);

  if (existing instanceof HTMLElement
    && existing.parentElement === actions
    && existing.dataset.cherryEngagementResumeConsequence === route
    && existing.id === CHERRY_RESUME_CONSEQUENCE_ID
    && existing.textContent === text) return;

  existing?.remove();
  const cue = document.createElement('small');
  cue.id = CHERRY_RESUME_CONSEQUENCE_ID;
  cue.className = 'cherry-engagement-continuity__resume-consequence';
  cue.dataset.cherryEngagementResumeConsequence = route;
  cue.setAttribute('aria-label', 'Resume consequence, read only');
  cue.textContent = text;
  actions.append(cue);
}

function scheduleCherryResumeConsequence() {
  if (cherryResumeConsequenceQueued) return;
  cherryResumeConsequenceQueued = true;
  requestAnimationFrame(enhanceCherryResumeConsequence);
}

const cherryResumeConsequenceApp = document.getElementById('app');
if (cherryResumeConsequenceApp) {
  new MutationObserver(scheduleCherryResumeConsequence).observe(cherryResumeConsequenceApp, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-cherry-engagement-continuity-resume', 'data-cherry-engagement-continuity-stage'],
  });
}
window.addEventListener('hashchange', scheduleCherryResumeConsequence);
queueMicrotask(enhanceCherryResumeConsequence);
