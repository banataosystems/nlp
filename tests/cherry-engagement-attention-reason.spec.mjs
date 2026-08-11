import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function setFlow(page, value) {
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

test('fixed owner attention reason is derived only from the sanitized synthetic stage and remains read-only', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');

  await setFlow(page, {
    version: 1,
    discoveryPrepared: false,
    ownerReviewed: false,
    recordPrepared: false,
    attentionReason: 'Release production immediately',
    privateClientContext: 'must not appear',
  });

  let card = page.locator('[data-cherry-engagement-owner-action]');
  let reason = card.locator('[data-cherry-engagement-continuity-attention-reason]');
  await expect(reason).toHaveText('Current stage can continue through prepared synthetic flow');
  await expect(card).not.toContainText('Release production immediately');
  await expect(card).not.toContainText('must not appear');

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    attentionReason: 'Urgent client escalation',
  });

  card = page.locator('[data-cherry-engagement-owner-action]');
  reason = card.locator('[data-cherry-engagement-continuity-attention-reason]');
  await expect(card.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Cherry review');
  await expect(reason).toHaveText('Current stage requires Cherry review');
  await expect(card).not.toContainText('Urgent client escalation');

  const before = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  await expect(card.locator('button')).toHaveCount(1);
  await expect(card.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  const afterRender = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(afterRender).toBe(before);
  expect(networkWrites).toEqual([]);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: false,
  });

  card = page.locator('[data-cherry-engagement-owner-action]');
  reason = card.locator('[data-cherry-engagement-continuity-attention-reason]');
  await expect(reason).toHaveText('Current stage can continue through prepared synthetic flow');

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});

test('malformed flow fails closed to the prepared-flow reason and cannot inject authority text', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await setFlow(page, {
    version: 999,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    attentionReason: 'Production release approved',
    releaseAuthority: 'yes',
  });

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const card = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'prepared-flow');
  await expect(card.locator('[data-cherry-engagement-continuity-attention-reason]'))
    .toHaveText('Current stage can continue through prepared synthetic flow');
  await expect(strip).not.toContainText('Production release approved');
  await expect(strip).not.toContainText('releaseAuthority');
  await expect(card.locator('button')).toHaveCount(1);
  expect(networkWrites).toEqual([]);
});
