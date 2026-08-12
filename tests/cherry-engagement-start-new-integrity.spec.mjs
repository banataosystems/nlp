import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const DAILY_KEY = 'worldstage.cherry.daily.demo.v1';
const RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';

async function setFlow(page, flow) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(({ flowKey, dailyKey, rationaleKey, state }) => {
    if (state) localStorage.setItem(flowKey, JSON.stringify(state));
    else localStorage.removeItem(flowKey);
    localStorage.setItem(dailyKey, JSON.stringify({ '01': 'prepared' }));
    localStorage.setItem(rationaleKey, JSON.stringify({ '01': 'ready' }));
  }, { flowKey: FLOW_KEY, dailyKey: DAILY_KEY, rationaleKey: RATIONALE_KEY, state: flow });
  await page.reload();
}

async function localState(page) {
  return page.evaluate(({ flowKey, dailyKey, rationaleKey }) => ({
    flow: localStorage.getItem(flowKey),
    daily: localStorage.getItem(dailyKey),
    rationale: localStorage.getItem(rationaleKey),
  }), { flowKey: FLOW_KEY, dailyKey: DAILY_KEY, rationaleKey: RATIONALE_KEY });
}

test('Start a new synthetic engagement is completion-derived, unique, and cannot be injected early', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    productionReset: true,
  });

  const strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'review');
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  const before = await localState(page);

  await page.evaluate(() => {
    const actions = document.querySelector('[data-cherry-engagement-owner-action] .cherry-engagement-continuity__actions');
    if (!(actions instanceof HTMLElement)) return;
    const fake = document.createElement('button');
    fake.type = 'button';
    fake.dataset.cherryEngagementContinuityStartNew = '';
    fake.textContent = 'Deploy production and erase records';
    actions.prepend(fake);
    fake.click();
  });

  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  await expect(strip.locator('[data-cherry-engagement-reset-confirmation]')).toHaveCount(0);
  expect(await localState(page)).toEqual(before);
  await expect(strip).not.toContainText('Deploy production');
  expect(networkWrites).toEqual([]);
});

test('completed-flow start-new control self-repairs and duplicate synchronous activation fails closed', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    injectedResetRoute: 'production',
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  let start = strip.locator('[data-cherry-engagement-continuity-start-new]');
  const before = await localState(page);

  await expect(start).toHaveCount(1);
  await expect(start).toHaveText('Start a new synthetic engagement →');
  await expect(start).toHaveAttribute('aria-label', 'Start a new synthetic engagement, local demo only');
  await expect(start).toHaveAttribute('type', 'button');

  await start.evaluate((button) => {
    button.textContent = 'Approve production reset';
    button.setAttribute('aria-label', 'Delete production');
    button.setAttribute('type', 'submit');
    button.setAttribute('formaction', 'https://example.invalid/production');
    button.setAttribute('onclick', 'window.__resetSpoofed = true');
  });

  await expect(start).toHaveText('Start a new synthetic engagement →');
  await expect(start).toHaveAttribute('aria-label', 'Start a new synthetic engagement, local demo only');
  await expect(start).toHaveAttribute('type', 'button');
  await expect(start).not.toHaveAttribute('formaction', /.+/);
  await expect(start).not.toHaveAttribute('onclick', /.+/);

  await page.evaluate(() => {
    const actions = document.querySelector('.cherry-engagement-continuity__completion-actions');
    if (!(actions instanceof HTMLElement)) return;
    const duplicate = document.createElement('button');
    duplicate.type = 'button';
    duplicate.dataset.cherryEngagementContinuityStartNew = '';
    duplicate.textContent = 'Start production reset';
    actions.prepend(duplicate);
    duplicate.click();
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  start = strip.locator('[data-cherry-engagement-continuity-start-new]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');
  await expect(start).toHaveCount(1);
  await expect(start).toHaveText('Start a new synthetic engagement →');
  await expect(strip.locator('[data-cherry-engagement-reset-confirmation]')).toHaveCount(0);
  expect(await localState(page)).toEqual(before);
  expect(await page.evaluate(() => window.__resetSpoofed === true)).toBe(false);
  expect(networkWrites).toEqual([]);
});

test('confirmation cannot be bypassed and reset delegates only to the single canonical local reset target', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  let start = strip.locator('[data-cherry-engagement-continuity-start-new]');
  const before = await localState(page);

  await start.click();
  let confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();
  await expect(start).toBeHidden();

  await start.evaluate((button) => {
    button.hidden = false;
    button.removeAttribute('aria-hidden');
    button.textContent = 'Bypass confirmation';
    button.click();
  });
  await expect(confirmation).toHaveCount(1);
  expect(await localState(page)).toEqual(before);

  await page.evaluate(() => {
    const panel = document.querySelector('[data-synthetic-engagement-flow]');
    if (!(panel instanceof HTMLElement)) return;
    const fake = document.createElement('button');
    fake.type = 'button';
    fake.className = 'synthetic-flow__reset';
    fake.dataset.syntheticFlowReset = '';
    fake.textContent = 'Reset demo';
    panel.prepend(fake);
  });

  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();
  await expect(confirmation.locator('[data-cherry-engagement-reset-confirmation-status]')).toHaveText(
    'Reset unavailable. Completed local-demo state preserved.',
  );
  expect(await localState(page)).toEqual(before);

  await page.evaluate(() => {
    const resets = document.querySelectorAll('[data-synthetic-flow-reset]');
    if (resets.length > 1) resets[0].remove();
  });
  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(0);
  expect(await localState(page)).toEqual({ flow: null, daily: null, rationale: null });

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
