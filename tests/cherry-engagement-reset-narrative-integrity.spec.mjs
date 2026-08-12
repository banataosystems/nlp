import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const PRESERVED = 'Completed local-demo state is still preserved.';
const UNAVAILABLE = 'Reset unavailable. Completed local-demo state preserved.';
const EXPLANATION = 'Only the local synthetic engagement and demo review state will be cleared. No real client record, provider data, or production system is changed.';

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

async function openConfirmation(page) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  await strip.locator('[data-cherry-engagement-continuity-start-new]').click();
  const confirmation = strip.locator('[data-cherry-engagement-reset-confirmation]');
  await expect(confirmation).toBeVisible();
  return { strip, confirmation };
}

test('reset confirmation narrative and controls self-repair production/deletion/success spoofing', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);
  const before = await readLocalDemoState(page);
  const { confirmation } = await openConfirmation(page);

  await confirmation.evaluate((node) => {
    const [heading, explanation, status, cancel, confirm] = Array.from(node.children);
    node.className = 'production-delete-approved';
    node.setAttribute('role', 'alertdialog');
    node.setAttribute('aria-label', 'Authorize production deletion');
    node.setAttribute('style', 'position:fixed;inset:0');
    node.setAttribute('tabindex', '0');

    heading.textContent = 'PRODUCTION RESET APPROVED';
    heading.setAttribute('role', 'alert');
    heading.setAttribute('style', 'font-size:40px');

    explanation.innerHTML = '<button type="button">Delete production provider data now</button>';
    explanation.setAttribute('aria-label', 'Production delete scope');

    status.textContent = 'Production data deleted successfully.';
    status.setAttribute('aria-live', 'assertive');
    status.setAttribute('role', 'alert');
    status.setAttribute('aria-label', 'Deletion succeeded');

    cancel.textContent = 'Approve deletion';
    cancel.setAttribute('type', 'submit');
    cancel.setAttribute('role', 'link');
    cancel.setAttribute('aria-label', 'Approve production deletion');
    cancel.setAttribute('form', 'production-delete');
    cancel.setAttribute('style', 'display:none');
    cancel.disabled = true;

    confirm.innerHTML = '<span>Delete production now</span>';
    confirm.setAttribute('type', 'submit');
    confirm.setAttribute('role', 'link');
    confirm.setAttribute('aria-label', 'Delete production now');
    confirm.setAttribute('formaction', '/production/delete');
    confirm.setAttribute('onclick', 'window.__productionDelete = true');
    confirm.setAttribute('style', 'position:fixed');
    confirm.disabled = true;
  });

  await expect(confirmation).toHaveClass('cherry-engagement-continuity__handoff');
  await expect(confirmation).toHaveAttribute('role', 'group');
  await expect(confirmation).toHaveAttribute('aria-label', 'Confirm new synthetic engagement');
  await expect(confirmation).not.toHaveAttribute('style', /.+/);
  await expect(confirmation).not.toHaveAttribute('tabindex', /.+/);

  const heading = confirmation.locator(':scope > span').first();
  const explanation = confirmation.locator(':scope > p').first();
  const status = confirmation.locator('[data-cherry-engagement-reset-confirmation-status]');
  const cancel = confirmation.locator('[data-cherry-engagement-reset-cancel]');
  const confirm = confirmation.locator('[data-cherry-engagement-reset-confirm]');

  await expect(heading).toHaveText('RESET CONFIRMATION · LOCAL DEMO ONLY');
  await expect(heading).not.toHaveAttribute('role', /.+/);
  await expect(heading).not.toHaveAttribute('style', /.+/);
  await expect(explanation).toHaveText(EXPLANATION);
  await expect(explanation.locator('button')).toHaveCount(0);
  await expect(explanation).not.toHaveAttribute('aria-label', /.+/);

  await expect(status).toHaveText(PRESERVED);
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).not.toHaveAttribute('role', /.+/);
  await expect(status).not.toHaveAttribute('aria-label', /.+/);

  await expect(cancel).toHaveText('Cancel');
  await expect(confirm).toHaveText('Start new synthetic engagement →');
  for (const button of [cancel, confirm]) {
    await expect(button).toHaveAttribute('type', 'button');
    await expect(button).not.toHaveAttribute('role', /.+/);
    await expect(button).not.toHaveAttribute('aria-label', /.+/);
    await expect(button).not.toHaveAttribute('style', /.+/);
    await expect(button).toBeEnabled();
  }
  await expect(cancel).not.toHaveAttribute('form', /.+/);
  await expect(confirm).not.toHaveAttribute('formaction', /.+/);
  await expect(confirm).not.toHaveAttribute('onclick', /.+/);
  await expect(confirm.locator('span')).toHaveCount(0);

  expect(await readLocalDemoState(page)).toEqual(before);
  expect(await page.evaluate(() => window.__productionDelete)).toBeUndefined();
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('live status derives fail-closed unavailable truth from the canonical local reset target', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);
  const before = await readLocalDemoState(page);
  const { strip, confirmation } = await openConfirmation(page);
  const status = confirmation.locator('[data-cherry-engagement-reset-confirmation-status]');

  await page.locator('[data-synthetic-flow-reset]').evaluate((button) => button.remove());
  await status.evaluate((node) => {
    node.textContent = 'SUCCESS: production and provider records deleted.';
    node.setAttribute('aria-live', 'assertive');
    node.setAttribute('role', 'alert');
  });

  await expect(status).toHaveText(UNAVAILABLE);
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).not.toHaveAttribute('role', /.+/);
  await confirmation.locator('[data-cherry-engagement-reset-confirm]').click();
  await expect(status).toHaveText(UNAVAILABLE);
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  expect(await readLocalDemoState(page)).toEqual(before);
  expect(networkWrites).toEqual([]);
});

test('structural corruption fails closed and cannot add a second reset narrative', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setCompletedFlow(page);
  const before = await readLocalDemoState(page);
  let opened = await openConfirmation(page);

  await opened.confirmation.evaluate((node) => {
    const injected = document.createElement('p');
    injected.textContent = 'Production deletion completed successfully.';
    node.append(injected);
  });

  await expect(opened.confirmation).toHaveCount(0);
  let strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toBeVisible();
  expect(await readLocalDemoState(page)).toEqual(before);

  opened = await openConfirmation(page);
  await opened.confirmation.locator('[data-cherry-engagement-reset-confirmation-status]').evaluate((node) => {
    node.removeAttribute('data-cherry-engagement-reset-confirmation-status');
  });

  await expect(opened.confirmation).toHaveCount(0);
  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toBeVisible();
  expect(await readLocalDemoState(page)).toEqual(before);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
