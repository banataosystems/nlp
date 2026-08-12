import { test, expect, devices } from '@playwright/test';

const { defaultBrowserType: _defaultBrowserType, ...iphone } = devices['iPhone 14'];
test.use({ ...iphone, browserName: 'webkit' });

const routes = ['home', 'discovery', 'cockpit', 'client'];

for (const route of routes) {
  test(`${route}: stays inside the iPhone viewport`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:4173/#/${route}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#main')).toBeVisible();

    const geometry = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      visualWidth: window.visualViewport?.width ?? window.innerWidth,
    }));

    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.visualWidth + 1);
  });
}

test('Discovery fails closed, then restores a usable iPhone composer after acknowledgement', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/discovery');

  const gate = page.locator('[data-prototype-safety-gate]');
  const conversation = page.locator('.conversation-pane');
  await expect(gate).toBeVisible();
  await expect(conversation).toHaveAttribute('inert', '');

  const continueButton = gate.getByRole('button', { name: /continue with non-confidential Discovery/i });
  const continueBox = await continueButton.boundingBox();
  expect(continueBox.height).toBeGreaterThanOrEqual(44);

  await continueButton.click();
  await expect(gate).toHaveCount(0);
  await expect(conversation).not.toHaveAttribute('inert', '');
  await expect(page.locator('[data-prototype-safety-banner]')).toBeVisible();

  const composer = page.locator('.conversation-input');
  await expect(composer).toBeVisible();
  const composerBox = await composer.boundingBox();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(composerBox.x).toBeGreaterThanOrEqual(0);
  expect(composerBox.x + composerBox.width).toBeLessThanOrEqual(viewportWidth + 1);
});

test('Cherry OS keeps exactly one iPhone judgment page active and readable', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');

  const cards = page.locator('.judgment-card');
  const active = page.locator('.judgment-card.is-active');
  await expect(cards).toHaveCount(3);
  await expect(active).toHaveCount(1);

  const layout = await page.evaluate(() => {
    const deckNode = document.querySelector('.judgment-deck');
    const cards = [...document.querySelectorAll('.judgment-card')];
    const active = document.querySelector('.judgment-card.is-active');
    const headline = active?.querySelector('h3');
    return {
      deckWidth: deckNode.clientWidth,
      cardWidths: cards.map((node) => node.offsetWidth),
      cardOffsets: cards.map((node) => node.offsetLeft),
      flexShrink: cards.map((node) => getComputedStyle(node).flexShrink),
      headlineWidth: headline?.getBoundingClientRect().width ?? 0,
    };
  });

  for (const cardWidth of layout.cardWidths) {
    expect(cardWidth).toBeGreaterThanOrEqual(layout.deckWidth - 2);
  }
  for (const shrink of layout.flexShrink) expect(shrink).toBe('0');
  for (let index = 1; index < layout.cardOffsets.length; index += 1) {
    expect(layout.cardOffsets[index] - layout.cardOffsets[index - 1]).toBeGreaterThanOrEqual(layout.deckWidth - 2);
  }
  expect(layout.headlineWidth).toBeGreaterThanOrEqual(layout.deckWidth * 0.70);

  const primary = active.locator('.judgment-card__primary');
  const primaryBox = await primary.boundingBox();
  expect(primaryBox.height).toBeGreaterThanOrEqual(44);
});

test('contracted iPhone viewport keeps Discovery composer reachable', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/discovery');
  await page.locator('[data-prototype-continue]').click();

  const initial = page.viewportSize();
  const contractedHeight = Math.max(500, Math.floor(initial.height * 0.68));
  await page.setViewportSize({ width: initial.width, height: contractedHeight });

  const composer = page.locator('.conversation-input');
  await expect(composer).toBeVisible();
  const box = await composer.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(contractedHeight + 2);
});
