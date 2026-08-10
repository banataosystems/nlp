import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('Transformation Record exposes a bounded mobile summary', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/client');
  const summary = page.locator('.record-summary');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Demo organization');
  await expect(summary).toContainText('Demo only');
  const widths = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(widths.sw).toBeLessThanOrEqual(widths.cw + 1);
});

test('Evidence drawer preserves explicit evidence states and demo boundary', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/client');
  await page.locator('[data-record-evidence]').click();
  const drawer = page.locator('[data-record-overlay="evidence"]');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Anecdotal');
  await expect(drawer).toContainText('Measured');
  await expect(drawer).toContainText('Client-confirmed');
  await expect(drawer).toContainText('Publicly approved');
  await expect(drawer).toContainText('DEMO DATA');
  await page.keyboard.press('Escape');
  await expect(page.locator('.record-governance-overlay')).toHaveCount(0);
});

test('Privacy drawer fails closed before real client or participant data', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/client');
  await page.locator('[data-record-privacy]').click();
  const drawer = page.locator('[data-record-overlay="privacy"]');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('Participant responses');
  await expect(drawer).toContainText('FAIL CLOSED');
  await expect(drawer).toContainText('authentication, organization isolation, role-based authorization');
});

test('governance close control meets touch target', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/client');
  await page.locator('[data-record-evidence]').click();
  const box = await page.locator('[data-record-close]').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('7 / 30 / 90 sustainment plan stays locked until the synthetic record is complete', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/client');
  const plan = page.locator('[data-sustainment-plan]');
  await expect(plan).toBeVisible();
  await expect(plan).toContainText('7 / 30 / 90-day owner follow-through');
  await expect(plan).toContainText('Complete the fixed synthetic engagement loop before follow-up planning can advance');
  await expect(page.locator('[data-sustainment-action]')).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.sustainment.plan.v1'));
  expect(stored).toBeNull();
});

test('owner can prepare the fixed synthetic 7 / 30 / 90 sequence locally and reset it', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
    }));
  });
  await page.goto('http://127.0.0.1:4173/#/client');

  const plan = page.locator('[data-sustainment-plan]');
  await expect(plan).toContainText('0/3 prepared locally');
  await page.locator('[data-sustainment-action="day7"]').click();
  await expect(page.locator('[data-sustainment-horizon="day7"]')).toContainText('Prepared locally');
  await page.locator('[data-sustainment-action="day30"]').click();
  await expect(page.locator('[data-sustainment-horizon="day30"]')).toContainText('Prepared locally');
  await page.locator('[data-sustainment-action="day90"]').click();
  await expect(page.locator('[data-sustainment-horizon="day90"]')).toContainText('Prepared locally');
  await expect(plan).toContainText('3/3 prepared locally');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.synthetic.sustainment.plan.v1')));
  expect(stored).toEqual({ version: 1, day7Prepared: true, day30Prepared: true, day90Prepared: true });

  await page.locator('[data-sustainment-reset]').click();
  await expect(page.locator('[data-sustainment-plan]')).toContainText('0/3 prepared locally');
  const afterReset = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.sustainment.plan.v1'));
  expect(afterReset).toBeNull();
});

test('sustainment state fails closed on skipped prerequisites and strips extra stored material', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
    }));
    localStorage.setItem('worldstage.synthetic.sustainment.plan.v1', JSON.stringify({
      version: 1,
      day7Prepared: false,
      day30Prepared: true,
      day90Prepared: true,
      injectedNote: 'must not survive sanitization',
    }));
  });
  await page.goto('http://127.0.0.1:4173/#/client');

  await expect(page.locator('[data-sustainment-action="day7"]')).toBeVisible();
  await expect(page.locator('[data-sustainment-action="day30"]')).toHaveCount(0);
  await expect(page.locator('[data-sustainment-action="day90"]')).toHaveCount(0);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.synthetic.sustainment.plan.v1')));
  expect(stored).toEqual({ version: 1, day7Prepared: false, day30Prepared: false, day90Prepared: false });
  expect(JSON.stringify(stored)).not.toContain('injectedNote');
});
