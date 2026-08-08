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
