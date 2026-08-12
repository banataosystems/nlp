import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const RATIONALE_KEY = 'worldstage.cherry.daily.rationale.demo.v1';

test('Cherry Daily rationale lens stays fixed-vocabulary, local-only, and mobile safe', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  const guide = page.locator('[data-cherry-rationale-guide]');
  await expect(guide).toBeVisible();
  await expect(guide).toContainText('Decision rationale lens');
  await expect(guide).toContainText('Ready · Needs context · Can wait');
  await expect(guide).toContainText('no free-text reason field');

  const first = page.locator('[data-cherry-rationale-state="01"]');
  await expect(first).toBeVisible();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Needs context');
  await expect(first.locator('input, textarea, [contenteditable="true"]')).toHaveCount(0);

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="prepared"]').click();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Ready');

  let stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), RATIONALE_KEY);
  expect(stored).toEqual({ '01': 'ready', '02': 'needs-context', '03': 'needs-context' });

  await first.locator('[data-cherry-rationale-set="can-wait"]').click();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Can wait');
  stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), RATIONALE_KEY);
  expect(stored).toEqual({ '01': 'can-wait', '02': 'needs-context', '03': 'needs-context' });
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);

  await page.locator('[data-cherry-daily-reset]').click();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Needs context');
  await expect(page.locator('[data-cherry-daily-status]')).toContainText('fixed rationales reset locally');
  expect(await page.evaluate((key) => localStorage.getItem(key), RATIONALE_KEY)).toBeNull();
});

test('rationale storage fails closed on arbitrary fields and invalid values', async ({ page }) => {
  const sentinel = 'PRIVATE-CLIENT-NOTE-MUST-NOT-RENDER-OR-PERSIST';
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(({ key, sentinel }) => {
    localStorage.setItem(key, JSON.stringify({
      '01': 'ready',
      '02': 'invented-free-text-reason',
      '03': 'can-wait',
      clientNote: sentinel,
      authority: 'approve-production',
    }));
  }, { key: RATIONALE_KEY, sentinel });
  await page.reload();

  await expect(page.locator('[data-cherry-rationale-state="01"] [data-cherry-rationale-label]')).toHaveText('Ready');
  await expect(page.locator('[data-cherry-rationale-state="02"] [data-cherry-rationale-label]')).toHaveText('Needs context');
  await expect(page.locator('[data-cherry-rationale-state="03"] [data-cherry-rationale-label]')).toHaveText('Can wait');
  await expect(page.locator('body')).not.toContainText(sentinel);

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), RATIONALE_KEY);
  expect(stored).toEqual({ '01': 'ready', '02': 'needs-context', '03': 'can-wait' });
  expect(JSON.stringify(stored)).not.toContain(sentinel);
  expect(JSON.stringify(stored)).not.toContain('approve-production');
});

test('decision-state changes map to a deterministic safe rationale without free text', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  const first = page.locator('[data-cherry-rationale-state="01"]');

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="parked"]').click();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Can wait');

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="needs-cherry"]').click();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Needs context');

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="prepared"]').click();
  await expect(first.locator('[data-cherry-rationale-label]')).toHaveText('Ready');

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), RATIONALE_KEY);
  expect(stored['01']).toBe('ready');
  expect(Object.keys(stored).sort()).toEqual(['01', '02', '03']);
});
