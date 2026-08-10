import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function completeThreeChangedReview(page) {
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

  await page.locator('[data-cherry-review-session-start]').click();
  await page.locator('[data-cherry-decision-state="03"] [data-cherry-daily-set="prepared"]').click();
  await page.locator('[data-cherry-decision-state="01"] [data-cherry-daily-set="parked"]').click();
  await page.locator('[data-cherry-decision-state="02"] [data-cherry-daily-set="prepared"]').click();
  await expect(page.locator('[data-cherry-owner-review-recap]')).toBeVisible();
}

test('final changed-item recheck enters an ephemeral close state with one existing synthetic next step', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await completeThreeChangedReview(page);

  const recap = page.locator('[data-cherry-owner-review-recap]');
  const recheck = recap.locator('[data-cherry-owner-review-recap-recheck]');
  const status = recap.locator('[data-cherry-owner-review-recap-recheck-status]');
  const next = recap.locator('[data-cherry-owner-review-recap-route="client"]');

  await expect(recap.locator('[data-cherry-owner-review-recap-counts]')).toHaveText('Changed: 3 · Same: 0');
  await recheck.click();
  await expect(status).toContainText('Rechecking 1 of 3 · Item 01.');
  await recheck.click();
  await expect(status).toContainText('Rechecking 2 of 3 · Item 02.');
  await recheck.click();

  await expect(recap).toHaveAttribute('data-cherry-owner-review-recheck-complete', 'true');
  await expect(status).toHaveAttribute('data-cherry-owner-review-recheck-complete-status', 'true');
  await expect(status).toHaveText('Recheck complete · 3 changed items revisited. Navigation only; completed review unchanged.');
  await expect(recheck).toBeHidden();
  await expect(next).toHaveAttribute('data-cherry-owner-review-close-next', 'true');
  await expect(next).toHaveText('Continue to existing synthetic next step →');
  await expect(recap).not.toContainText('must not appear');

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);

  await next.click();
  await expect(page).toHaveURL(/#\/client$/);
  expect(networkWrites).toEqual([]);
});

test('recheck close refuses an unexpected route and does not create authority or writes', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await completeThreeChangedReview(page);

  const recap = page.locator('[data-cherry-owner-review-recap]');
  const recheck = recap.locator('[data-cherry-owner-review-recap-recheck]');
  const status = recap.locator('[data-cherry-owner-review-recap-recheck-status]');
  const next = recap.locator('[data-cherry-owner-review-recap-route]');

  await next.evaluate((button) => {
    button.dataset.cherryOwnerReviewRecapRoute = 'production';
    button.textContent = 'Injected production action';
  });

  await recheck.click();
  await recheck.click();
  await recheck.click();

  await expect(status).toContainText('Rechecking 3 of 3 · Item 03.');
  await expect(recap).not.toHaveAttribute('data-cherry-owner-review-recheck-complete', 'true');
  await expect(recheck).toBeVisible();
  await expect(next).not.toHaveAttribute('data-cherry-owner-review-close-next', 'true');
  expect(networkWrites).toEqual([]);
});
