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

function collectNetworkWrites(page) {
  const writes = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.url());
  });
  return writes;
}

test('confirmation removes Reset demo from owner interaction paths and repairs tampering until Cancel', async ({ page }) => {
  const networkWrites = collectNetworkWrites(page);
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const startNew = strip.locator('[data-cherry-engagement-continuity-start-new]');
  const reset = page.locator('[data-synthetic-flow-reset]');
  const before = await readLocalDemoState(page);

  await startNew.click();
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  const cancel = confirmation.locator('[data-cherry-engagement-reset-cancel]');

  await expect(confirmation).toBeVisible();
  await expect(reset).toBeEnabled();
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');
  await expect(cancel).toBeFocused();

  await reset.evaluate((button) => {
    button.disabled = true;
    button.removeAttribute('aria-disabled');
    button.removeAttribute('tabindex');
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  await expect(reset).toBeEnabled();
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');
  expect(await readLocalDemoState(page)).toEqual(before);

  await reset.evaluate((button) => {
    button.removeAttribute('aria-disabled');
    button.removeAttribute('tabindex');
    button.focus();
  });
  await expect(cancel).toBeFocused();
  await expect(reset).toBeEnabled();
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');
  expect(await readLocalDemoState(page)).toEqual(before);

  await reset.dispatchEvent('pointerdown');
  await reset.dispatchEvent('keydown', { key: 'Enter' });
  expect(await readLocalDemoState(page)).toEqual(before);

  await cancel.click();
  await expect(confirmation).toHaveCount(0);
  await expect(startNew).toBeVisible();
  await expect(startNew).toBeFocused();
  await expect(reset).toBeEnabled();
  await expect(reset).not.toHaveAttribute('aria-disabled', /.+/);
  await expect(reset).not.toHaveAttribute('tabindex', /.+/);
  expect(await readLocalDemoState(page)).toEqual(before);

  await reset.click();
  await expect(page.locator('[data-cherry-engagement-continuity]')).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  expect(await readLocalDemoState(page)).toEqual({ flow: null, daily: null, rationale: null });
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('canonical confirmation receives one synchronous reset delegation while every parallel direct-reset path remains blocked', async ({ page }) => {
  const networkWrites = collectNetworkWrites(page);
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  let strip = page.locator('[data-cherry-engagement-continuity]');
  await strip.locator('[data-cherry-engagement-continuity-start-new]').click();
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  const reset = page.locator('[data-synthetic-flow-reset]');
  await expect(reset).toBeEnabled();
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');

  const before = await readLocalDemoState(page);
  await page.evaluate(() => {
    const button = document.querySelector('[data-synthetic-flow-reset]');
    if (!(button instanceof HTMLButtonElement)) throw new Error('canonical reset unavailable');
    button.disabled = false;
    button.removeAttribute('aria-disabled');
    button.removeAttribute('tabindex');
    button.click();
  });
  expect(await readLocalDemoState(page)).toEqual(before);
  await expect(reset).toBeEnabled();
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toHaveAttribute('tabindex', '-1');

  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip.locator('[data-cherry-engagement-reset-confirmation]')).toHaveCount(0);
  expect(await readLocalDemoState(page)).toEqual({ flow: null, daily: null, rationale: null });
  expect(networkWrites).toEqual([]);
});

test('confirmation structure corruption fails closed before direct reset can clear the completed local state', async ({ page }) => {
  const networkWrites = collectNetworkWrites(page);
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);

  const before = await readLocalDemoState(page);
  const strip = page.locator('[data-cherry-engagement-continuity]');
  await strip.locator('[data-cherry-engagement-continuity-start-new]').click();
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();

  await page.evaluate(() => {
    const confirmationNode = document.querySelector('[data-cherry-engagement-reset-confirmation]');
    const reset = document.querySelector('[data-synthetic-flow-reset]');
    if (!(confirmationNode instanceof HTMLElement) || !(reset instanceof HTMLButtonElement)) {
      throw new Error('canonical confirmation/reset unavailable');
    }
    confirmationNode.querySelector('[data-cherry-engagement-reset-cancel]')?.remove();
    reset.disabled = false;
    reset.removeAttribute('aria-disabled');
    reset.removeAttribute('tabindex');
    reset.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  expect(await readLocalDemoState(page)).toEqual(before);
  await expect(page.locator('[data-synthetic-flow-reset]')).toBeEnabled();
  await expect(page.locator('[data-cherry-engagement-continuity]')).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  expect(networkWrites).toEqual([]);
});
