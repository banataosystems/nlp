/* WorldStage / Cherry — ephemeral close state for the changed-item recheck.
   This enhancement only reacts to the existing local/synthetic recap controls.
   It does not read private sources, create persistence, write to providers, infer significance, or grant authority. */

const CHERRY_RECHECK_CLOSE_IDS = new Set(['01', '02', '03']);
const CHERRY_RECHECK_CLOSE_ROUTES = new Set(['discovery', 'cockpit', 'client']);

function cherryRecheckCloseParseStatus(statusText) {
  const match = /^Rechecking (\d+) of (\d+) · Item (01|02|03)\./.exec(String(statusText || '').trim());
  if (!match) return null;

  const position = Number(match[1]);
  const total = Number(match[2]);
  const id = match[3];
  if (!Number.isInteger(position) || !Number.isInteger(total) || position < 1 || total < 1 || position > total) return null;
  if (!CHERRY_RECHECK_CLOSE_IDS.has(id)) return null;
  return { position, total, id };
}

function cherryRecheckCloseComplete(recap, completion) {
  if (!(recap instanceof HTMLElement) || recap.dataset.cherryOwnerReviewRecheckComplete === 'true') return;
  if (!completion || completion.position !== completion.total) return;

  const status = recap.querySelector('[data-cherry-owner-review-recap-recheck-status]');
  const recheck = recap.querySelector('[data-cherry-owner-review-recap-recheck]');
  const next = recap.querySelector('[data-cherry-owner-review-recap-route]');
  if (!(status instanceof HTMLElement) || !(recheck instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)) return;

  const route = next.dataset.cherryOwnerReviewRecapRoute;
  if (!CHERRY_RECHECK_CLOSE_ROUTES.has(route)) return;

  recap.dataset.cherryOwnerReviewRecheckComplete = 'true';
  status.dataset.cherryOwnerReviewRecheckCompleteStatus = 'true';
  status.textContent = `Recheck complete · ${completion.total} changed item${completion.total === 1 ? '' : 's'} revisited. Navigation only; completed review unchanged.`;

  recheck.hidden = true;
  recheck.setAttribute('aria-hidden', 'true');

  next.dataset.cherryOwnerReviewCloseNext = 'true';
  next.textContent = 'Continue to existing synthetic next step →';
  next.setAttribute('aria-label', 'Continue to the existing synthetic next step');
}

/* The existing recap button handler updates its progress first. This document-level
   listener then inspects only the allowlisted progress string on the next animation
   frame and enters a close state if the last changed item was reached. */
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element
    ? event.target.closest('[data-cherry-owner-review-recap-recheck]')
    : null;
  if (!(target instanceof HTMLButtonElement)) return;

  const recap = target.closest('[data-cherry-owner-review-recap]');
  if (!(recap instanceof HTMLElement)) return;

  requestAnimationFrame(() => {
    const status = recap.querySelector('[data-cherry-owner-review-recap-recheck-status]');
    if (!(status instanceof HTMLElement)) return;
    const completion = cherryRecheckCloseParseStatus(status.textContent);
    if (!completion || completion.position !== completion.total) return;
    cherryRecheckCloseComplete(recap, completion);
  });
});
