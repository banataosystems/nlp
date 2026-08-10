import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('Cherry owner summary consolidates phase, next action, judgment counts, follow-up and privacy boundary', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.removeItem('worldstage.synthetic.engagement.flow.v1');
    localStorage.removeItem('worldstage.cherry.daily.demo.v1');
    localStorage.removeItem('worldstage.synthetic.sustainment.plan.v1');
  });
  await page.reload();

  const summary = page.locator('[data-cherry-owner-summary]');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('CHERRY OWNER SUMMARY');
  await expect(page.locator('[data-owner-summary-phase]')).toHaveText('Discovery');
  await expect(page.locator('[data-owner-summary-next]')).toHaveText('Prepare synthetic Discovery brief');
  await expect(page.locator('[data-owner-summary-daily="needs"]')).toHaveText('3');
  await expect(summary).toContainText('7 days');
  await expect(summary).toContainText('Locked');
  await expect(page.locator('[data-owner-summary-boundary]')).toContainText('Local synthetic demo only');
  await expect(page.locator('[data-owner-summary-boundary]')).toContainText('No real client data');

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);

  await page.locator('[data-owner-summary-nav="discovery"]').click();
  await expect(page).toHaveURL(/#\/discovery$/);
});

test('Cherry owner summary reads only sanitized sequential local demo state', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
      injectedClientText: 'must not appear',
    }));
    localStorage.setItem('worldstage.cherry.daily.demo.v1', JSON.stringify({
      '01': 'prepared',
      '02': 'parked',
      '03': 'needs-cherry',
      clientName: 'must not appear',
    }));
    localStorage.setItem('worldstage.synthetic.sustainment.plan.v1', JSON.stringify({
      version: 1,
      day7Prepared: true,
      day30Prepared: false,
      day90Prepared: true,
      privateNote: 'must not appear',
    }));
  });
  await page.reload();

  const summary = page.locator('[data-cherry-owner-summary]');
  await expect(summary).toBeVisible();
  await expect(page.locator('[data-owner-summary-phase]')).toHaveText('Sustainment');
  await expect(page.locator('[data-owner-summary-next]')).toHaveText('Prepare 30-day review');
  await expect(page.locator('[data-owner-summary-daily="needs"]')).toHaveText('1');
  await expect(page.locator('[data-owner-summary-daily="prepared"]')).toHaveText('1');
  await expect(page.locator('[data-owner-summary-daily="parked"]')).toHaveText('1');

  const checkpoints = summary.locator('.cherry-owner-summary__checkpoint');
  await expect(checkpoints.nth(0)).toContainText('Prepared');
  await expect(checkpoints.nth(1)).toContainText('Next');
  await expect(checkpoints.nth(2)).toContainText('Locked');
  await expect(summary).not.toContainText('must not appear');

  await page.locator('[data-owner-summary-nav="client"]').click();
  await expect(page).toHaveURL(/#\/client$/);
});
