import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('Cherry OS source map is explicit demo-only provenance and closes safely', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  const source = page.locator('[data-cockpit-sources]').first();
  await expect(source).toBeVisible();
  await source.click();
  await expect(page.locator('body')).toHaveClass(/cockpit-modal-open/);
  const overlay = page.locator('[data-cockpit-overlay="sources"]');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('DEMO ONLY');
  await expect(overlay).toContainText('no private client source is connected');

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);

  await page.keyboard.press('Escape');
  await expect(page.locator('.cockpit-overlay')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/cockpit-modal-open/);
});

test('Review context opens The Room briefing pattern without pretending facts are verified', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  const review = page.locator('[data-cockpit-room]').first();
  await expect(review).toBeVisible();
  await review.click();
  const overlay = page.locator('[data-cockpit-overlay="room"]');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('THE ROOM');
  await expect(overlay).toContainText('60-SECOND BRIEFING');
  await expect(overlay).toContainText('Demo only');
  await expect(overlay).toContainText('REQUIRES VERIFIED SOURCE');
  await expect(overlay).toContainText('authentication, authorization, auditability');
});

test('Phase 4 modal preserves a minimum close touch target', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.locator('[data-cockpit-sources]').first().click();
  const box = await page.locator('[data-cockpit-close]').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('Cherry Daily turns the demo judgment queue into a local-only owner workflow', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  const daily = page.locator('[data-cherry-daily]');
  await expect(daily).toBeVisible();
  await expect(daily).toContainText('CHERRY DAILY');
  await expect(daily).toContainText('Nothing is sent to a client, CRM, email, calendar, or production system.');
  await expect(page.locator('[data-cherry-daily-count="needs-cherry"]')).toHaveText('3');
  await expect(page.locator('[data-cherry-daily-count="prepared"]')).toHaveText('0');

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="prepared"]').click();
  await expect(page.locator('[data-cherry-daily-count="needs-cherry"]')).toHaveText('2');
  await expect(page.locator('[data-cherry-daily-count="prepared"]')).toHaveText('1');
  await expect(page.locator('[data-cherry-decision-state="01"] [data-cherry-decision-label]')).toHaveText('Prepared');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.cherry.daily.demo.v1')));
  expect(stored).toEqual({ '01': 'prepared', '02': 'needs-cherry', '03': 'needs-cherry' });

  await page.reload();
  await expect(page.locator('[data-cherry-daily-count="prepared"]')).toHaveText('1');
  await expect(page.locator('[data-cherry-decision-state="01"] [data-cherry-decision-label]')).toHaveText('Prepared');

  await page.locator('[data-cherry-daily-reset]').click();
  await expect(page.locator('[data-cherry-daily-count="needs-cherry"]')).toHaveText('3');
  await expect(page.locator('[data-cherry-daily-count="prepared"]')).toHaveText('0');
  await expect(page.locator('[data-cherry-daily-status]')).toContainText('No external system was changed');

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('synthetic engagement loop connects Discovery, Cherry judgment, and Transformation Record without external writes', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/discovery');
  await page.evaluate(() => {
    localStorage.removeItem('worldstage.synthetic.engagement.flow.v1');
    localStorage.removeItem('worldstage.cherry.daily.demo.v1');
  });
  await page.reload();

  const discoveryFlow = page.locator('[data-synthetic-engagement-flow]');
  await expect(discoveryFlow).toBeVisible();
  await expect(discoveryFlow).toContainText('SYNTHETIC ENGAGEMENT LOOP');
  await expect(discoveryFlow).toContainText('does not read the Discovery form');
  await page.locator('[data-synthetic-flow-action="prepare-discovery"]').click();
  await expect(page.locator('[data-synthetic-flow-status]')).toContainText('No form values were read or copied');

  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.synthetic.engagement.flow.v1')));
  expect(stored).toEqual({ version: 1, discoveryPrepared: true, ownerReviewed: false, recordPrepared: false });

  await page.locator('[data-synthetic-flow-nav="cockpit"]').click();
  await expect(page).toHaveURL(/#\/cockpit$/);
  await expect(page.locator('[data-synthetic-engagement-flow]')).toContainText('Cherry judgment is next');
  await page.locator('[data-synthetic-flow-action="owner-review"]').click();
  await expect(page.locator('[data-cherry-decision-state="01"] [data-cherry-decision-label]')).toHaveText('Prepared');
  await expect(page.locator('[data-synthetic-flow-status]')).toContainText('No approval, client communication, or external write occurred');

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.synthetic.engagement.flow.v1')));
  expect(stored).toEqual({ version: 1, discoveryPrepared: true, ownerReviewed: true, recordPrepared: false });

  await page.locator('[data-synthetic-flow-nav="client"]').click();
  await expect(page).toHaveURL(/#\/client$/);
  await expect(page.locator('[data-synthetic-engagement-flow]')).toContainText('Transformation Record is next');
  await page.locator('[data-synthetic-flow-action="prepare-record"]').click();
  await expect(page.locator('[data-synthetic-engagement-flow]')).toContainText('Loop complete');
  await expect(page.locator('[data-synthetic-flow-status]')).toContainText('demo evidence, not a real client outcome');

  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.synthetic.engagement.flow.v1')));
  expect(stored).toEqual({ version: 1, discoveryPrepared: true, ownerReviewed: true, recordPrepared: true });
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);

  await page.locator('[data-synthetic-flow-reset]').click();
  await expect(page.locator('[data-synthetic-engagement-flow]')).toContainText('Ready to begin');
  const afterReset = await page.evaluate(() => ({
    flow: localStorage.getItem('worldstage.synthetic.engagement.flow.v1'),
    daily: localStorage.getItem('worldstage.cherry.daily.demo.v1'),
  }));
  expect(afterReset).toEqual({ flow: null, daily: null });
});
