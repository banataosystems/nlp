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

    test('live transformation brief opens as a bounded mobile sheet', async ({ page }) => {
      await page.goto('http://127.0.0.1:4173/#/discovery');
      const trigger = page.locator('[data-brief-toggle]');
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(page.locator('body')).toHaveClass(/brief-open/);
      const sheet = page.locator('.brief-pane');
      await expect(sheet).toBeVisible();
      const box = await sheet.boundingBox();
      expect(box.x).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThanOrEqual(width - 1);
      expect(box.height).toBeLessThanOrEqual(760);
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toHaveClass(/brief-open/);
    });

    test('homepage exposes all five WorldStage solution paths without overflow', async ({ page }) => {
      await page.goto('http://127.0.0.1:4173/#/home');
      const paths = page.locator('.solution-path');
      await expect(paths).toHaveCount(5);
      const section = page.locator('.solution-paths');
      await expect(section).toBeVisible();
      const box = await section.boundingBox();
      expect(box.width).toBeLessThanOrEqual(width + 1);
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
