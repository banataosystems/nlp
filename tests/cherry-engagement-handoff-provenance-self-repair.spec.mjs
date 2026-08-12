import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';

async function setFlow(page, value) {
  await page.evaluate(({ key, next }) => {
    localStorage.setItem(key, JSON.stringify(next));
  }, { key: FLOW_KEY, next: value });
  await page.reload();
}

async function expectHandoff(page, expected) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const handoff = strip.locator('[data-cherry-engagement-continuity-handoff]');

  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-signature', expected.signature);
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', expected.previousId);
  await expect(handoff).toHaveCount(1);
  await expect(handoff).toHaveAttribute('aria-label', 'Synthetic engagement handoff cue');
  await expect(handoff.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText(expected.previousText);
  await expect(handoff.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText(expected.prepared);
  await expect(handoff.locator('[data-cherry-engagement-continuity-next]')).toHaveText(expected.next);
}

test('handoff provenance and root signature self-repair from sanitized synthetic flow only', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setFlow(page, {
    version: 1,
    discoveryPrepared: false,
    ownerReviewed: false,
    recordPrepared: false,
    previous: 'production',
    prepared: 'approved',
    next: 'release',
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  const discoveryState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);

  await strip.evaluate((node) => {
    node.setAttribute('data-cherry-engagement-continuity-signature', 'production:approved:ready');
    node.setAttribute('data-cherry-engagement-continuity-previous', 'review');
    const handoff = node.querySelector('[data-cherry-engagement-continuity-handoff]');
    handoff?.setAttribute('aria-label', 'Production release handoff');
    const previous = handoff?.querySelector('[data-cherry-engagement-continuity-previous-label]');
    const prepared = handoff?.querySelector('[data-cherry-engagement-continuity-prepared]');
    const next = handoff?.querySelector('[data-cherry-engagement-continuity-next]');
    if (previous) previous.textContent = 'Previous stage: Production approval.';
    if (prepared) prepared.textContent = 'Prepared: production release is approved.';
    if (next) next.textContent = 'Next: release to production now.';
  });

  await expectHandoff(page, {
    signature: 'd0:o0:r0:discovery:none:prepared-flow',
    previousId: 'none',
    previousText: 'Previous stage: None.',
    prepared: 'Prepared: owner cockpit shell and fixed synthetic engagement flow only.',
    next: 'Next: prepare the fixed synthetic Discovery brief.',
  });
  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).not.toContainText('Production approval');
  await expect(strip).not.toContainText('production release is approved');
  await expect(strip).not.toContainText('release to production now');
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(discoveryState);

  await strip.locator('[data-cherry-engagement-continuity-handoff]').evaluate((handoff) => {
    const duplicate = document.createElement('p');
    duplicate.setAttribute('data-cherry-engagement-continuity-prepared', '');
    duplicate.textContent = 'Prepared: signed production release.';
    handoff.appendChild(duplicate);
  });

  await expectHandoff(page, {
    signature: 'd0:o0:r0:discovery:none:prepared-flow',
    previousId: 'none',
    previousText: 'Previous stage: None.',
    prepared: 'Prepared: owner cockpit shell and fixed synthetic engagement flow only.',
    next: 'Next: prepare the fixed synthetic Discovery brief.',
  });
  await expect(page.locator('[data-cherry-engagement-continuity-prepared]')).toHaveCount(1);
  await expect(page.locator('[data-cherry-engagement-continuity]')).not.toContainText('signed production release');

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    previous: 'record',
    releaseAuthority: 'production-approved',
  });

  const reviewState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);
  await expectHandoff(page, {
    signature: 'd1:o0:r0:review:discovery:needs-cherry',
    previousId: 'discovery',
    previousText: 'Previous stage: Discovery.',
    prepared: 'Prepared: fixed synthetic Discovery brief.',
    next: 'Next: complete the existing local-demo Cherry review.',
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  await strip.locator('[data-cherry-engagement-continuity-handoff]').evaluate((handoff) => {
    handoff.querySelector('[data-cherry-engagement-continuity-next]')?.removeAttribute('data-cherry-engagement-continuity-next');
  });

  await expectHandoff(page, {
    signature: 'd1:o0:r0:review:discovery:needs-cherry',
    previousId: 'discovery',
    previousText: 'Previous stage: Discovery.',
    prepared: 'Prepared: fixed synthetic Discovery brief.',
    next: 'Next: complete the existing local-demo Cherry review.',
  });
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(reviewState);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });

  const completedState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);
  await expectHandoff(page, {
    signature: 'd1:o1:r1:record:review:prepared-flow',
    previousId: 'review',
    previousText: 'Previous stage: Cherry review.',
    prepared: 'Prepared: Discovery brief, Cherry review, and local synthetic Transformation Record.',
    next: 'Next: review the existing local synthetic Transformation Record.',
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  await strip.evaluate((node) => {
    node.removeAttribute('data-cherry-engagement-continuity-signature');
    node.setAttribute('data-cherry-engagement-continuity-previous', 'production');
    const handoff = node.querySelector('[data-cherry-engagement-continuity-handoff]');
    const previous = handoff?.querySelector('[data-cherry-engagement-continuity-previous-label]');
    const prepared = handoff?.querySelector('[data-cherry-engagement-continuity-prepared]');
    const next = handoff?.querySelector('[data-cherry-engagement-continuity-next]');
    if (previous) previous.textContent = 'Previous stage: Production release.';
    if (prepared) prepared.textContent = 'Prepared: legally committed outcome.';
    if (next) next.textContent = 'Next: client deployment complete.';
  });

  await expectHandoff(page, {
    signature: 'd1:o1:r1:record:review:prepared-flow',
    previousId: 'review',
    previousText: 'Previous stage: Cherry review.',
    prepared: 'Prepared: Discovery brief, Cherry review, and local synthetic Transformation Record.',
    next: 'Next: review the existing local synthetic Transformation Record.',
  });
  await expect(page.locator('[data-cherry-engagement-continuity]')).not.toContainText('Production release');
  await expect(page.locator('[data-cherry-engagement-continuity]')).not.toContainText('legally committed outcome');
  await expect(page.locator('[data-cherry-engagement-continuity]')).not.toContainText('client deployment complete');
  await expect(page.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(completedState);
  await expect(page).toHaveURL(/#\/cockpit$/);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
