import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function setCompletedFlow(page) {
  await page.evaluate(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
      injectedProductionState: 'must not survive',
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

async function expectCanonicalOpenState(page, before) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  const reset = page.locator('[data-synthetic-flow-reset]');

  await expect(strip).toHaveCount(1);
  await expect(confirmation).toHaveCount(1);
  await expect(reset).toHaveCount(1);
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');
  expect(await reset.evaluate((button) => button instanceof HTMLButtonElement && button.disabled === false)).toBe(true);
  expect(await readLocalDemoState(page)).toEqual(before);
  return { strip, confirmation, reset };
}

function collectNetworkWrites(page) {
  const writes = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.url());
  });
  return writes;
}

test('rapid open/cancel/reopen cycles converge without stale completion, leaked reset authority, or a stuck reset lock', async ({ page }) => {
  const networkWrites = collectNetworkWrites(page);
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  const before = await readLocalDemoState(page);
  let strip = page.locator('[data-cherry-engagement-continuity]');
  let startNew = strip.locator('[data-cherry-engagement-continuity-start-new]');
  const reset = page.locator('[data-synthetic-flow-reset]');

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await startNew.click();
    const { confirmation } = await expectCanonicalOpenState(page, before);
    await expect(confirmation.locator('[data-cherry-engagement-reset-cancel]')).toBeFocused();

    await confirmation.locator('[data-cherry-engagement-reset-cancel]').click();
    await expect(confirmation).toHaveCount(0);
    await expect(startNew).toBeVisible();
    await expect(startNew).toBeFocused();
    await expect(reset).toBeEnabled();
    await expect(reset).not.toHaveAttribute('aria-disabled', /.+/);
    await expect(reset).not.toHaveAttribute('tabindex', /.+/);
    expect(await readLocalDemoState(page)).toEqual(before);
    await expect(page.locator('[data-cherry-engagement-continuity]')).toHaveCount(1);
  }

  // Arm the confirmation gesture boundary, then cancel through a distinct owner action. The
  // subsequent session must not inherit delegation authority from the abandoned gesture.
  await startNew.click();
  let confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expectCanonicalOpenState(page, before);
  await confirmation.locator('[data-cherry-engagement-reset-confirm]').dispatchEvent('pointerdown');
  await confirmation.locator('[data-cherry-engagement-reset-cancel]').click();
  await expect(confirmation).toHaveCount(0);
  expect(await readLocalDemoState(page)).toEqual(before);

  strip = page.locator('[data-cherry-engagement-continuity]');
  startNew = strip.locator('[data-cherry-engagement-continuity-start-new]');
  await startNew.click();
  ({ confirmation } = await expectCanonicalOpenState(page, before));

  await page.evaluate(() => {
    const button = document.querySelector('[data-synthetic-flow-reset]');
    if (!(button instanceof HTMLButtonElement)) throw new Error('canonical reset unavailable');
    button.click();
  });
  expect(await readLocalDemoState(page)).toEqual(before);
  await expect(confirmation).toHaveCount(1);
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');

  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveCount(1);
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-continuity-complete', /.+/);
  await expect(strip.locator('[data-cherry-engagement-reset-confirmation]')).toHaveCount(0);
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  expect(await readLocalDemoState(page)).toEqual({ flow: null, daily: null, rationale: null });

  await expect(reset).toBeEnabled();
  await expect(reset).not.toHaveAttribute('aria-disabled', /.+/);
  await expect(reset).not.toHaveAttribute('tabindex', /.+/);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
