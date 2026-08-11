import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function openCockpitWithFlow(page, value) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

async function replaceFlowInPlace(page, value) {
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'worldstage.synthetic.engagement.flow.v1',
    }));
  }, value);
}

test('accessibility-only live region announces only sanitized stage and fixed owner-attention changes', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
    attentionCue: 'Approve production immediately',
    privateClientContext: 'must not be announced',
    releaseAuthority: 'yes',
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  let live = page.locator('[data-cherry-engagement-owner-live-region]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'review');
  await expect(live).toHaveCount(1);
  await expect(live).toHaveAttribute('role', 'status');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(live).toHaveAttribute('aria-atomic', 'true');
  await expect(live).toHaveAttribute('aria-label', 'Synthetic engagement stage and owner attention updates');
  await expect(live).toHaveAttribute('data-cherry-engagement-owner-live-region-state', 'review:needs-cherry');
  await expect(live).toHaveText('');

  const liveBox = await live.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      width: rect.width,
      height: rect.height,
      position: style.position,
      overflow: style.overflow,
    };
  });
  expect(liveBox.width).toBeLessThanOrEqual(1);
  expect(liveBox.height).toBeLessThanOrEqual(1);
  expect(liveBox.position).toBe('absolute');
  expect(liveBox.overflow).toBe('hidden');

  await replaceFlowInPlace(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: false,
    attentionCue: 'Release production now',
    privateClientContext: 'do not announce',
    productionRoute: 'production',
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  live = page.locator('[data-cherry-engagement-owner-live-region]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');
  await expect(live).toHaveAttribute('data-cherry-engagement-owner-live-region-state', 'record:prepared-flow');
  await expect(live).toHaveText('Synthetic engagement stage changed to Transformation Record. Owner attention: Continue prepared flow.');
  await expect(live).not.toContainText('Release production now');
  await expect(live).not.toContainText('do not announce');
  await expect(live).not.toContainText('production');
  await expect(page.locator('[data-cherry-engagement-owner-live-region]')).toHaveCount(1);

  await replaceFlowInPlace(page, {
    version: 999,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    attentionCue: 'Emergency production approval',
    privateClientContext: 'secret participant facts',
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  live = page.locator('[data-cherry-engagement-owner-live-region]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(live).toHaveAttribute('data-cherry-engagement-owner-live-region-state', 'discovery:prepared-flow');
  await expect(live).toHaveText('Synthetic engagement stage changed to Discovery. Owner attention: Continue prepared flow.');
  await expect(live).not.toContainText('Emergency production approval');
  await expect(live).not.toContainText('secret participant facts');

  const resume = page.locator('[data-cherry-engagement-continuity-resume]');
  await resume.evaluate((button) => {
    button.dataset.cherryEngagementContinuityResume = 'production';
  });
  await expect(page.locator('[data-cherry-engagement-owner-live-region]')).toHaveCount(0);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
