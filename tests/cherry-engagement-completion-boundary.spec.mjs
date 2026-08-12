import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function setCompletedFlow(page) {
  await page.evaluate(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
      injectedResetRoute: 'production',
      privateClientContext: 'must not appear',
    }));
    localStorage.setItem('worldstage.cherry.daily.demo.v1', JSON.stringify({ '01': 'prepared' }));
    localStorage.setItem('worldstage.cherry.daily.rationale.demo.v1', JSON.stringify({ '01': 'ready' }));
  });
  await page.reload();
}

test('completed synthetic engagement is preserved through confirmation and delegates only to existing local reset', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  let strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-continuity-completion]')).toHaveText(
    'Completed local-demo state is preserved until Start a new synthetic engagement is deliberately tapped.',
  );
  await expect(strip.locator('[data-cherry-engagement-continuity-resume="client"]')).toHaveText('Resume →');
  const startNew = strip.locator('[data-cherry-engagement-continuity-start-new]');
  await expect(startNew).toHaveText('Start a new synthetic engagement →');
  await expect(strip).not.toContainText('must not appear');
  await expect(strip).not.toContainText('production');

  const beforeRestart = await page.evaluate(() => ({
    flow: JSON.parse(localStorage.getItem('worldstage.synthetic.engagement.flow.v1') || 'null'),
    daily: localStorage.getItem('worldstage.cherry.daily.demo.v1'),
    rationale: localStorage.getItem('worldstage.cherry.daily.rationale.demo.v1'),
  }));
  expect(beforeRestart.flow).toEqual({
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    injectedResetRoute: 'production',
    privateClientContext: 'must not appear',
  });
  expect(beforeRestart.daily).not.toBeNull();
  expect(beforeRestart.rationale).not.toBeNull();

  await startNew.click();
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();
  await expect(startNew).toBeHidden();

  const duringConfirmation = await page.evaluate(() => ({
    flow: JSON.parse(localStorage.getItem('worldstage.synthetic.engagement.flow.v1') || 'null'),
    daily: localStorage.getItem('worldstage.cherry.daily.demo.v1'),
    rationale: localStorage.getItem('worldstage.cherry.daily.rationale.demo.v1'),
  }));
  expect(duringConfirmation).toEqual(beforeRestart);

  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();
  await expect(page).toHaveURL(/#\/cockpit$/);

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  await expect(strip.locator('[data-cherry-engagement-continuity-resume]')).toHaveAttribute(
    'data-cherry-engagement-continuity-resume',
    'discovery',
  );

  // The confirmed boundary must inherit the existing synthetic reset semantics exactly.
  // The current reset stack clears the engagement flow plus both local review-demo keys.
  const afterRestart = await page.evaluate(() => ({
    flow: localStorage.getItem('worldstage.synthetic.engagement.flow.v1'),
    daily: localStorage.getItem('worldstage.cherry.daily.demo.v1'),
    rationale: localStorage.getItem('worldstage.cherry.daily.rationale.demo.v1'),
  }));
  expect(afterRestart.flow).toBeNull();
  expect(afterRestart.daily).toBeNull();
  expect(afterRestart.rationale).toBeNull();

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});

test('completion confirmation fails closed when the existing local reset control is unavailable', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const startNew = strip.locator('[data-cherry-engagement-continuity-start-new]');
  await expect(startNew).toBeVisible();
  await startNew.click();

  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();
  await expect(startNew).toBeHidden();
  await page.locator('[data-synthetic-flow-reset]').evaluate((button) => button.remove());
  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();

  const preserved = await page.evaluate(() => ({
    flow: JSON.parse(localStorage.getItem('worldstage.synthetic.engagement.flow.v1') || 'null'),
    daily: localStorage.getItem('worldstage.cherry.daily.demo.v1'),
    rationale: localStorage.getItem('worldstage.cherry.daily.rationale.demo.v1'),
  }));
  expect(preserved.flow?.recordPrepared).toBe(true);
  expect(preserved.daily).not.toBeNull();
  expect(preserved.rationale).not.toBeNull();
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(confirmation.locator('[data-cherry-engagement-reset-confirmation-status]')).toHaveText(
    'Reset unavailable. Completed local-demo state preserved.',
  );
  await expect(confirmation).toBeVisible();
  await expect(startNew).toBeHidden();
  expect(networkWrites).toEqual([]);
});
