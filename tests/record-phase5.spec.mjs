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
