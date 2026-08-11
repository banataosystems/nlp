import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function setFlow(page, value) {
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

test('owner continuity derives only the three fixed synthetic stages and consolidates the current action into one card', async ({ page }) => {
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
  let ownerAction = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toBeVisible();
  await expect(ownerAction).toBeVisible();
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'none');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Discovery');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: None.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: owner cockpit shell and fixed synthetic engagement flow only.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: prepare the fixed synthetic Discovery brief.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  await expect(strip.locator('[data-cherry-engagement-continuity-step="discovery"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'current');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="review"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'upcoming');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'upcoming');
  await expect(strip).not.toContainText('must not appear');
  await expect(strip).not.toContainText('productionRelease');
  await ownerAction.locator('[data-cherry-engagement-continuity-resume="discovery"]').click();
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
  ownerAction = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'review');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'discovery');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Cherry review');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: Discovery.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: fixed synthetic Discovery brief.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: complete the existing local-demo Cherry review.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  await expect(strip.locator('[data-cherry-engagement-continuity-step="discovery"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="review"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'current');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'upcoming');
  await expect(strip).not.toContainText('production');

  const ownerReview = page.locator('[data-synthetic-flow-action="owner-review"]');
  await expect(ownerReview).toBeVisible();
  await ownerAction.locator('[data-cherry-engagement-continuity-resume="cockpit"]').click();
  await expect(page).toHaveURL(/#\/cockpit$/);
  await expect(ownerReview).toBeFocused();

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: false,
  });
  strip = page.locator('[data-cherry-engagement-continuity]');
  ownerAction = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'review');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Transformation Record');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: Cherry review.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: Discovery brief and Cherry review.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: prepare the local synthetic Transformation Record.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  await expect(strip.locator('[data-cherry-engagement-continuity-step="discovery"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="review"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete');
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'current');
  await ownerAction.locator('[data-cherry-engagement-continuity-resume="client"]').click();
  await expect(page).toHaveURL(/#\/client$/);

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });
  strip = page.locator('[data-cherry-engagement-continuity]');
  ownerAction = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'review');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: Cherry review.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: Discovery brief, Cherry review, and local synthetic Transformation Record.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: review the existing local synthetic Transformation Record.');
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  await expect(ownerAction.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(1);
  await expect(strip.locator('[data-cherry-engagement-continuity-step="record"]')).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete-current');

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});

test('owner action card is read-only until its single allowlisted Resume action is deliberately used', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  const flow = {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
  };
  await setFlow(page, flow);

  const before = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  const card = page.locator('[data-cherry-engagement-owner-action]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Cherry review');
  await expect(card.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: fixed synthetic Discovery brief.');
  await expect(card.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: complete the existing local-demo Cherry review.');
  await expect(card.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  await expect(card.locator('button')).toHaveCount(1);

  const afterRender = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(afterRender).toBe(before);
  expect(networkWrites).toEqual([]);

  await card.locator('[data-cherry-engagement-continuity-resume="cockpit"]').click();
  await expect(page).toHaveURL(/#\/cockpit$/);
  const afterResume = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(afterResume).toBe(before);
  expect(networkWrites).toEqual([]);
});

test('owner action card fails closed on malformed flow state and remains phone-safe without external writes', async ({ page }) => {
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
  const card = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toBeVisible();
  await expect(card).toBeVisible();
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-previous', 'none');
  await expect(card.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Discovery');
  await expect(card.locator('[data-cherry-engagement-continuity-previous-label]')).toHaveText('Previous stage: None.');
  await expect(card.locator('[data-cherry-engagement-continuity-prepared]')).toHaveText('Prepared: owner cockpit shell and fixed synthetic engagement flow only.');
  await expect(card.locator('[data-cherry-engagement-continuity-next]')).toHaveText('Next: prepare the fixed synthetic Discovery brief.');
  await expect(card.locator('[data-cherry-engagement-continuity-resume]')).toHaveAttribute('data-cherry-engagement-continuity-resume', 'discovery');
  await expect(card.locator('button')).toHaveCount(1);
  await expect(strip.locator('[data-cherry-engagement-continuity-step]')).toHaveCount(3);
  await expect(strip).not.toContainText('Production release');
  await expect(strip).not.toContainText('secret client');
  await expect(strip).not.toContainText('releaseAuthority');

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
