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
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: false,
      privateClientContext: 'must not appear',
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

  const recap = page.locator('[data-cherry-owner-review-recap]');
  await expect(recap).toBeVisible();
  await expect(recap).toContainText('OWNER REVIEW RECAP · READ ONLY · SYNTHETIC');
  await expect(recap).toContainText('what changed this review');
  await expect(recap.locator('[data-cherry-owner-review-recap-item="01"]')).toContainText('Parked');
  await expect(recap.locator('[data-cherry-owner-review-recap-item="02"]')).toContainText('Prepared');
  await expect(recap.locator('[data-cherry-owner-review-recap-item="03"]')).toContainText('Prepared');
  await expect(recap.locator('[data-cherry-owner-review-recap-delta="changed"]')).toHaveCount(3);
  await expect(recap).toContainText('Changed this review');
  await expect(recap.locator('[data-cherry-owner-review-recap-counts]')).toHaveText('Changed: 3 · Same: 0');
  await expect(recap).not.toContainText('must not appear');
  await expect(recap).not.toContainText('privateClientContext');
  await expect(recap.locator('[data-cherry-owner-review-recap-next]')).toContainText('Transformation Record');
  await expect(recap.locator('[data-cherry-owner-review-recap-route="client"]')).toHaveText('Open synthetic Transformation Record →');

  const recheck = recap.locator('[data-cherry-owner-review-recap-recheck]');
  const recheckStatus = recap.locator('[data-cherry-owner-review-recap-recheck-status]');
  await expect(recheck).toHaveText('Recheck changed (3) →');
  await recheck.click();
  await expect(recheckStatus).toHaveText('Rechecking 1 of 3 · Item 01. Navigation only; the completed review is unchanged.');
  await expect(page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="parked"]')).toBeFocused();
  await expect(page).toHaveURL(/#\/cockpit$/);

  await recheck.click();
  await expect(recheckStatus).toContainText('Rechecking 2 of 3 · Item 02.');
  await expect(page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="prepared"]')).toBeFocused();

  await recheck.click();
  await expect(page.locator('[data-cherry-decision-state="03"] [data-cherry-daily-set="prepared"]')).toBeFocused();
  await expect(recap).toHaveAttribute('data-cherry-owner-review-recheck-complete', 'true');
  await expect(recheckStatus).toHaveAttribute('data-cherry-owner-review-recheck-complete-status', 'true');
  await expect(recheckStatus).toContainText('Recheck complete · 3 changed items revisited.');
  await expect(recheck).toBeHidden();
  await expect(recap.locator('[data-cherry-owner-review-recap-route="client"]')).toHaveText('Continue to existing synthetic next step →');

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);

  await recap.locator('[data-cherry-owner-review-recap-route="client"]').click();
  await expect(page).toHaveURL(/#\/client$/);
  expect(networkWrites).toEqual([]);
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
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 999,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
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

  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="needs-cherry"]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 02');
  await page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="prepared"]').click();
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 03');
  await page.locator('[data-cherry-decision-state="03"] [data-cherry-daily-set="needs-cherry"]').click();
  await expect(session).toContainText('Three of three reviewed.');

  const recap = page.locator('[data-cherry-owner-review-recap]');
  await expect(recap).toBeVisible();
  await expect(recap.locator('[data-cherry-owner-review-recap-item]')).toHaveCount(3);
  await expect(recap.locator('[data-cherry-owner-review-recap-item="01"] [data-cherry-owner-review-recap-delta="same"]')).toHaveText('Stayed the same');
  await expect(recap.locator('[data-cherry-owner-review-recap-item="02"] [data-cherry-owner-review-recap-delta="changed"]')).toHaveText('Changed this review');
  await expect(recap.locator('[data-cherry-owner-review-recap-item="03"] [data-cherry-owner-review-recap-delta="same"]')).toHaveText('Stayed the same');
  await expect(recap.locator('[data-cherry-owner-review-recap-delta="unavailable"]')).toHaveCount(0);
  await expect(recap.locator('[data-cherry-owner-review-recap-counts]')).toHaveText('Changed: 1 · Same: 2');
  await expect(recap).not.toContainText('secret reason');
  await expect(recap).not.toContainText('releaseAuthority');
  await expect(recap).not.toContainText('productionRelease');
  await expect(recap.locator('[data-cherry-owner-review-recap-route="discovery"]')).toHaveText('Continue with synthetic Discovery →');

  const recheck = recap.locator('[data-cherry-owner-review-recap-recheck]');
  const recheckStatus = recap.locator('[data-cherry-owner-review-recap-recheck-status]');
  await expect(recheck).toHaveText('Recheck changed (1) →');
  await recheck.click();
  await expect(page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="prepared"]')).toBeFocused();
  await expect(recap).toHaveAttribute('data-cherry-owner-review-recheck-complete', 'true');
  await expect(recheckStatus).toHaveAttribute('data-cherry-owner-review-recheck-complete-status', 'true');
  await expect(recheckStatus).toContainText('Recheck complete · 1 changed item revisited.');
  await expect(recheck).toBeHidden();
  expect(networkWrites).toEqual([]);

  await page.locator('[data-cherry-review-session-restart]').click();
  await expect(page.locator('[data-cherry-owner-review-session-item]')).toHaveCount(0);
  await expect(page.locator('[data-cherry-review-session-item]')).toHaveText('Item 01');
  await expect(page.locator('[data-cherry-review-session-progress]')).toContainText('Progress: 0 of 3 reviewed');
  await expect(page.locator('[data-cherry-owner-review-recap]')).toHaveCount(0);
  expect(networkWrites).toEqual([]);
});
