import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('3-minute owner review advances through each unseen deterministic priority on the same phone surface', async ({ page }) => {
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
      '01': 'ready',
      '02': 'can-wait',
      '03': 'needs-context',
      privateReason: 'must not appear',
    }));
  });
  await page.reload();

  const session = page.locator('[data-cherry-review-session]');
  await expect(session).toBeVisible();
  await expect(session).toContainText('Progress: 0 of 3');
  await expect(session).not.toContainText('must not appear');

  await page.locator('[data-cherry-review-session-start]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 03');
  await expect(page.locator('[data-cherry-review-session-reason]')).toHaveText('Needs Cherry · Needs context');
  await expect(page.locator('[data-cherry-decision-state="03"] [data-cherry-daily-set="needs-cherry"]')).toBeFocused();

  await page.locator('[data-cherry-decision-state="03"] [data-cherry-daily-set="prepared"]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 01');
  await expect(page.locator('[data-cherry-review-session-progress]')).toContainText('Progress: 1 of 3 reviewed');
  await expect(page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="prepared"]')).toBeFocused();

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="parked"]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 02');
  await expect(page.locator('[data-cherry-review-session-progress]')).toContainText('Progress: 2 of 3 reviewed');
  await expect(page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="parked"]')).toBeFocused();

  await page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="prepared"]').click();
  await expect(session).toContainText('Three of three reviewed.');
  await expect(page.locator('[data-cherry-review-session-progress]')).toHaveText('Progress: 3 of 3. Local demo session complete.');
  await expect(page).toHaveURL(/#\/cockpit$/);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('3-minute owner review stays fixed-vocabulary, restartable, and non-authoritative', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.setItem('worldstage.cherry.daily.demo.v1', JSON.stringify({
      '01': 'not-allowed',
      '02': 'not-allowed',
      '03': 'not-allowed',
      productionRelease: true,
    }));
    localStorage.setItem('worldstage.cherry.daily.rationale.demo.v1', JSON.stringify({
      '01': 'secret reason',
      '02': 'secret reason',
      '03': 'secret reason',
      releaseAuthority: 'yes',
    }));
  });
  await page.reload();

  const session = page.locator('[data-cherry-review-session]');
  await expect(session).toContainText('No external system is changed.');
  await expect(session).not.toContainText('secret reason');
  await expect(session).not.toContainText('releaseAuthority');
  await expect(session).not.toContainText('productionRelease');

  await page.locator('[data-cherry-review-session-start]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 01');
  await expect(page.locator('[data-cherry-review-session-reason]')).toHaveText('Needs Cherry · Needs context');

  for (const id of ['01', '02', '03']) {
    await page.locator(`[data-cherry-decision-state="${id}"] [data-cherry-daily-set="prepared"]`).click();
  }
  await expect(session).toContainText('Three of three reviewed.');
  await page.locator('[data-cherry-review-session-restart]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 01');
  await expect(page.locator('[data-cherry-review-session-progress]')).toContainText('Progress: 0 of 3 reviewed');
  expect(networkWrites).toEqual([]);
});
