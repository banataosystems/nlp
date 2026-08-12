import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('Review now focuses the deterministic priority judgment on the same phone surface without external writes', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.setItem('worldstage.cherry.daily.demo.v1', JSON.stringify({
      '01': 'prepared',
      '02': 'parked',
      '03': 'needs-cherry',
      injectedClientName: 'must not appear',
    }));
    localStorage.setItem('worldstage.cherry.daily.rationale.demo.v1', JSON.stringify({
      '01': 'can-wait',
      '02': 'ready',
      '03': 'not-allowlisted',
      privateReason: 'must not appear',
    }));
  });
  await page.reload();

  const reviewCard = page.locator('[data-cherry-review-now-card]');
  await expect(reviewCard).toBeVisible();
  await expect(page.locator('[data-cherry-review-now-item]')).toHaveText('Item 03');
  await expect(page.locator('[data-cherry-review-now-reason]')).toHaveText('Needs Cherry · Needs context');
  await expect(reviewCard).toContainText('same phone surface');
  await expect(reviewCard).not.toContainText('must not appear');
  await expect(reviewCard).not.toContainText('not-allowlisted');

  const reviewNow = page.locator('[data-cherry-review-now-open]');
  await reviewNow.click();

  const item03 = page.locator('[data-cherry-decision-state="03"]');
  const currentStateButton = item03.locator('[data-cherry-daily-set="needs-cherry"]');
  await expect(currentStateButton).toBeFocused();
  await expect(page.locator('[data-cherry-review-now-status]')).toHaveText('Reviewing item 03: Needs Cherry · Needs context. Local demo only.');
  await expect(page).toHaveURL(/#\/cockpit$/);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('Review now refreshes to the same-session priority and allowlisted rationale only', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.removeItem('worldstage.cherry.daily.demo.v1');
    localStorage.removeItem('worldstage.cherry.daily.rationale.demo.v1');
  });
  await page.reload();

  await expect(page.locator('[data-cherry-review-now-item]')).toHaveText('Item 01');
  await expect(page.locator('[data-cherry-review-now-reason]')).toHaveText('Needs Cherry · Needs context');

  const item01 = page.locator('[data-cherry-decision-state="01"]');
  await item01.locator('[data-cherry-rationale-set="ready"]').click();
  await expect(page.locator('[data-cherry-review-now-reason]')).toHaveText('Needs Cherry · Ready');

  await item01.locator('[data-cherry-daily-set="prepared"]').click();
  await expect(page.locator('[data-cherry-review-now-item]')).toHaveText('Item 02');
  await expect(page.locator('[data-cherry-review-now-reason]')).toHaveText('Needs Cherry · Needs context');

  await page.locator('[data-cherry-review-now-open]').click();
  await expect(page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="needs-cherry"]')).toBeFocused();
  await expect(page.locator('[data-cherry-review-now-status]')).toHaveText('Reviewing item 02: Needs Cherry · Needs context. Local demo only.');
  expect(networkWrites).toEqual([]);
});
