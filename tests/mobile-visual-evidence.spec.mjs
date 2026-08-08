import { test, expect } from '@playwright/test';

const routes = [
  ['home', 'homepage'],
  ['discovery', 'discovery'],
  ['cockpit', 'cherry-os'],
  ['client', 'transformation-record'],
];

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const [route, name] of routes) {
  test(`${name}: capture exact-branch mobile evidence`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:4173/#/${route}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#main')).toBeVisible();

    if (route === 'discovery') {
      await expect(page.locator('[data-brief-toggle]')).toBeVisible();
    }

    await page.screenshot({
      path: `artifacts/mobile-v2/${name}-390x844.png`,
      fullPage: true,
      animations: 'disabled',
    });
  });
}
