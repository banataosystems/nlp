import { test, expect } from '@playwright/test';

const widths = [320, 360, 375, 390, 412, 430];
const routes = ['home', 'discovery', 'cockpit', 'client'];

for (const width of widths) {
  test.describe(`mobile contract ${width}px`, () => {
    test.use({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });

    for (const route of routes) {
      test(`${route}: no unexpected document overflow`, async ({ page }) => {
        await page.goto(`http://127.0.0.1:4173/#/${route}`);
        await page.waitForLoadState('networkidle');
        const sizes = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
      });
    }

    test('mobile menu fully occludes underlying content and locks page', async ({ page }) => {
      await page.goto('http://127.0.0.1:4173/#/home');
      const toggle = page.locator('[data-menu]');
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(page.locator('.mobile-nav')).toBeVisible();
      await expect(page.locator('body')).toHaveClass(/menu-open/);

      const menuBox = await page.locator('.mobile-nav').boundingBox();
      expect(menuBox.x).toBeLessThanOrEqual(1);
      expect(menuBox.width).toBeGreaterThanOrEqual(width - 1);
      expect(menuBox.height).toBeGreaterThanOrEqual(800);
    });

    test('menu closes with Escape', async ({ page }) => {
      await page.goto('http://127.0.0.1:4173/#/home');
      await page.locator('[data-menu]').click();
      await page.keyboard.press('Escape');
      await expect(page.locator('.mobile-nav')).toHaveCount(0);
    });

    test('discovery composer remains visible after viewport contraction', async ({ page }) => {
      await page.goto('http://127.0.0.1:4173/#/discovery');
      await page.setViewportSize({ width, height: 560 });
      const composer = page.locator('.conversation-input');
      await expect(composer).toBeVisible();
      const box = await composer.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(560 + 2);
    });

    test('critical primary controls meet 44px touch target', async ({ page }) => {
      await page.goto('http://127.0.0.1:4173/#/home');
      const targets = ['[data-menu]', '.quiet-cta'];
      for (const selector of targets) {
        const box = await page.locator(selector).boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  });
}
