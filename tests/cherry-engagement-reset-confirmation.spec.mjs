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

async function readLocalDemoState(page) {
  return page.evaluate(() => ({
    flow: localStorage.getItem('worldstage.synthetic.engagement.flow.v1'),
    daily: localStorage.getItem('worldstage.cherry.daily.demo.v1'),
    rationale: localStorage.getItem('worldstage.cherry.daily.rationale.demo.v1'),
  }));
}

test('reset confirmation is page-memory-only and Cancel preserves the completed synthetic engagement', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const startNew = strip.locator('[data-cherry-engagement-continuity-start-new]');
  const before = await readLocalDemoState(page);

  await startNew.click();

  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();
  await expect(startNew).toBeHidden();
  await expect(confirmation).toContainText('RESET CONFIRMATION · LOCAL DEMO ONLY');
  await expect(confirmation).toContainText('Only the local synthetic engagement and demo review state will be cleared.');
  await expect(confirmation).toContainText('No real client record, provider data, or production system is changed.');
  await expect(confirmation.locator('[data-cherry-engagement-reset-confirmation-status]')).toHaveText(
    'Completed local-demo state is still preserved.',
  );
  await expect(confirmation).not.toContainText('must not appear');
  await expect(confirmation).not.toContainText('injectedResetRoute');

  expect(await readLocalDemoState(page)).toEqual(before);
  expect(networkWrites).toEqual([]);

  await confirmation.locator('[data-cherry-engagement-reset-cancel]').click();
  await expect(confirmation).toHaveCount(0);
  await expect(startNew).toBeVisible();
  expect(await readLocalDemoState(page)).toEqual(before);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});

test('confirmed reset delegates only to the existing local reset and returns the continuity strip to Discovery', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  let strip = page.locator('[data-cherry-engagement-continuity]');
  await strip.locator('[data-cherry-engagement-continuity-start-new]').click();
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();

  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-reset-confirmation]')).toHaveCount(0);
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);

  expect(await readLocalDemoState(page)).toEqual({ flow: null, daily: null, rationale: null });
  expect(networkWrites).toEqual([]);
});

test('confirmation fails closed and preserves completed local state when the existing reset is unavailable', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const before = await readLocalDemoState(page);
  await strip.locator('[data-cherry-engagement-continuity-start-new]').click();

  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();
  await page.locator('[data-synthetic-flow-reset]').evaluate((button) => button.remove());
  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();

  await expect(confirmation.locator('[data-cherry-engagement-reset-confirmation-status]')).toHaveText(
    'Reset unavailable. Completed local-demo state preserved.',
  );
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(confirmation).toBeVisible();
  expect(await readLocalDemoState(page)).toEqual(before);
  expect(networkWrites).toEqual([]);
});
