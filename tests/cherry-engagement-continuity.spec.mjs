import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function setFlow(page, value) {
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

test('owner continuity strip derives only the three fixed synthetic stages, previous-stage handoff, and existing resume step', async ({ page }) => {
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
    privateClientContext: 'must not appear',
    productionRelease: true,
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'none');
  await expect(strip.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Discovery');
  await expect(strip.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: None.');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="discovery"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'current');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="review"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'upcoming');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'upcoming');
  await expect(strip.locator('[data-cherry-engagement-continuity-handoff]')).toBeVisible();
  await expect(strip.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: owner cockpit shell and fixed synthetic engagement flow only.');
  await expect(strip.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: prepare the fixed synthetic Discovery brief.');
  await expect(strip).not.toContainText('must not appear');
  await expect(strip).not.toContainText('productionRelease');
  await strip.locator('[data-cherry-engagement-continuity-resume="discovery"]').click();
  await expect(page).toHaveURL(/#\/discovery$/);

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    injectedRoute: 'production',
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'review');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'discovery');
  await expect(strip.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Cherry review');
  await expect(strip.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: Discovery.');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="discovery"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="review"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'current');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'upcoming');
  await expect(strip.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: fixed synthetic Discovery brief.');
  await expect(strip.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: complete the existing local-demo Cherry review.');
  await expect(strip).not.toContainText('production');

  const ownerReview = page.locator('[data-synthetic-flow-action="owner-review"]');
  await expect(ownerReview).toBeVisible();
  await strip.locator('[data-cherry-engagement-continuity-resume="cockpit"]').click();
  await expect(page).toHaveURL(/#\/cockpit$/);
  await expect(ownerReview).toBeFocused();

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: false,
  });
  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'review');
  await expect(strip.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Transformation Record');
  await expect(strip.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: Cherry review.');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="discovery"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="review"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'current');
  await expect(strip.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: Discovery brief and Cherry review.');
  await expect(strip.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: prepare the local synthetic Transformation Record.');
  await strip.locator('[data-cherry-engagement-continuity-resume="client"]').click();
  await expect(page).toHaveURL(/#\/client$/);

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });
  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'review');
  await expect(strip.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: Cherry review.');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete-current');
  await expect(strip.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: Discovery brief, Cherry review, and local synthetic Transformation Record.');
  await expect(strip.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: review the existing local synthetic Transformation Record.');

  expect(networkWrites).toEqual([]);
});

test('previous-stage indicator fails closed on malformed flow state and remains phone-safe without external writes', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setFlow(page, {
    version: 999,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    previousStage: 'Production release',
    privateClientName: 'secret client',
    releaseAuthority: 'yes',
  });

  const strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'none');
  await expect(strip.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Discovery');
  await expect(strip.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: None.');
  await expect(strip.locator('[data-cherry-engagement-continuity-step]')).toHaveCount(3);
  await expect(strip.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: owner cockpit shell and fixed synthetic engagement flow only.');
  await expect(strip.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: prepare the fixed synthetic Discovery brief.');
  await expect(strip).not.toContainText('Production release');
  await expect(strip).not.toContainText('secret client');
  await expect(strip).not.toContainText('releaseAuthority');
  await expect(strip.locator('[data-cherry-engagement-continuity-resume]')).toHaveAttribute('data-cherry-engagement-continuity-resume', 'discovery');

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
