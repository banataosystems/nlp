/* WorldStage / Cherry — fixed pre-resume consequence cue for the synthetic owner action card.
   Derived only from the existing allowlisted Resume route. Navigation/focus semantics stay owned by
   cherry-engagement-continuity.js. Also surfaces a read-only The Room availability cue only for the
   sanitized Cherry-review stage, with a fixed synthetic readiness mini-check and boundary note. No
   persistence, provider writes, analytics, scoring or authority. */

const CHERRY_RESUME_CONSEQUENCE_ID = 'cherry-engagement-resume-consequence';
const CHERRY_RESUME_CONSEQUENCE = Object.freeze({
  discovery: 'Resume only opens the existing synthetic Discovery step. It does not submit, send, approve, persist, or release anything.',
  cockpit: 'Resume only focuses the existing synthetic Cherry review step. It does not submit, send, approve, persist, or release anything.',
  client: 'Resume only opens the existing synthetic Transformation Record step. It does not submit, send, approve, persist, or release anything.',
});
const CHERRY_ROOM_AVAILABILITY_TEXT = 'The Room briefing pattern is available from the active judgment card. Demo-only structure; no verified private client facts are connected.';
const CHERRY_ROOM_READINESS_ITEMS = Object.freeze([
  'Briefing structure available',
  'Verified private sources not connected',
  'Human review required',
]);
const CHERRY_ROOM_BOUNDARY_TEXT = 'Synthetic organization only. The Room cannot contact participants, access private systems, make commitments, approve outcomes, publish, or send anything.';

let cherryResumeConsequenceQueued = false;

function cherryResumeConsequenceText(route) {
  return Object.prototype.hasOwnProperty.call(CHERRY_RESUME_CONSEQUENCE, route)
    ? CHERRY_RESUME_CONSEQUENCE[route]
    : null;
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
    && existing.querySelector('p')?.textContent === CHERRY_ROOM_AVAILABILITY_TEXT
    && Array.from(existing.querySelectorAll('[data-cherry-engagement-room-readiness] li')).map((item) => item.textContent).join('|') === CHERRY_ROOM_READINESS_ITEMS.join('|')
    && existing.querySelector('[data-cherry-engagement-room-boundary]')?.textContent === CHERRY_ROOM_BOUNDARY_TEXT) return;

  existing?.remove();
  const cue = document.createElement('div');
  cue.className = 'cherry-engagement-continuity__handoff cherry-engagement-continuity__room-availability';
  cue.dataset.cherryEngagementRoomAvailability = 'review';
  cue.setAttribute('aria-label', 'The Room briefing pattern availability, readiness, and boundary, read only');
  cue.innerHTML = `<span>THE ROOM · DEMO BRIEFING PATTERN · READ ONLY</span><p>${CHERRY_ROOM_AVAILABILITY_TEXT}</p><ul data-cherry-engagement-room-readiness aria-label="The Room readiness, read only">${readinessMarkup}</ul><p data-cherry-engagement-room-boundary aria-label="The Room boundary, read only">${CHERRY_ROOM_BOUNDARY_TEXT}</p>`;

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
    return;
  }

  const route = resume.dataset.cherryEngagementContinuityResume;
  const text = cherryResumeConsequenceText(route);
  if (!text) {
    resume.removeAttribute('aria-describedby');
    existing?.remove();
    syncCherryRoomAvailability(card, route);
    return;
  }

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
