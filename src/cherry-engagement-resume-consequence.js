/* WorldStage / Cherry — fixed pre-resume consequence cue for the synthetic owner action card.
   Derived only from the existing allowlisted Resume route. Navigation/focus semantics stay owned by
   cherry-engagement-continuity.js. No persistence, provider writes, analytics, scoring or authority. */

const CHERRY_RESUME_CONSEQUENCE_ID = 'cherry-engagement-resume-consequence';
const CHERRY_RESUME_CONSEQUENCE = Object.freeze({
  discovery: 'Resume only opens the existing synthetic Discovery step. It does not submit, send, approve, persist, or release anything.',
  cockpit: 'Resume only focuses the existing synthetic Cherry review step. It does not submit, send, approve, persist, or release anything.',
  client: 'Resume only opens the existing synthetic Transformation Record step. It does not submit, send, approve, persist, or release anything.',
});

let cherryResumeConsequenceQueued = false;

function cherryResumeConsequenceText(route) {
  return Object.prototype.hasOwnProperty.call(CHERRY_RESUME_CONSEQUENCE, route)
    ? CHERRY_RESUME_CONSEQUENCE[route]
    : null;
}

function enhanceCherryResumeConsequence() {
  cherryResumeConsequenceQueued = false;
  const existing = document.querySelector('[data-cherry-engagement-resume-consequence]');
  const card = document.querySelector('[data-cherry-engagement-owner-action]');
  const actions = card?.querySelector('.cherry-engagement-continuity__actions');
  const resume = actions?.querySelector('[data-cherry-engagement-continuity-resume]');

  if (!(card instanceof HTMLElement)
    || !(actions instanceof HTMLElement)
    || !(resume instanceof HTMLButtonElement)) {
    existing?.remove();
    return;
  }

  const route = resume.dataset.cherryEngagementContinuityResume;
  const text = cherryResumeConsequenceText(route);
  if (!text) {
    resume.removeAttribute('aria-describedby');
    existing?.remove();
    return;
  }

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
    attributeFilter: ['data-cherry-engagement-continuity-resume'],
  });
}
window.addEventListener('hashchange', scheduleCherryResumeConsequence);
queueMicrotask(enhanceCherryResumeConsequence);
