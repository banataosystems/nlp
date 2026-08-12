import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function openCockpitWithFlow(page, value) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

test('The Room source status, source connection boundary, availability, readiness, and boundary cues appear only for sanitized Cherry review and remain read-only', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: false,
    ownerReviewed: false,
    recordPrepared: false,
    roomSourceStatus: 'Verified private sources connected',
    roomSourceBoundary: 'External/private sources are queried by production',
    roomAvailability: 'Expose private client briefing',
    roomBoundary: 'Contact participants now',
  });

  let card = page.locator('[data-cherry-engagement-owner-action]');
  await expect(card.locator('[data-cherry-engagement-room-availability]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-status]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-boundary]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-readiness]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-boundary]')).toHaveCount(0);
  await expect(card).not.toContainText('Verified private sources connected');
  await expect(card).not.toContainText('External/private sources are queried by production');
  await expect(card).not.toContainText('Expose private client briefing');
  await expect(card).not.toContainText('Contact participants now');

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    roomSourceStatus: 'Sources · production private systems connected',
    roomSourceBoundary: 'External/private sources are actively queried',
    roomAvailability: 'Production room approved',
    privateClientContext: 'must not appear',
    readiness: ['Private sources connected', 'Automated approval enabled'],
    roomBoundary: 'Publish and send to all participants',
    releaseAuthority: 'yes',
  });

  card = page.locator('[data-cherry-engagement-owner-action]');
  const roomCue = card.locator('[data-cherry-engagement-room-availability="review"]');
  const sourceStatus = roomCue.locator('[data-cherry-engagement-room-source-status]');
  const sourceBoundary = roomCue.locator('[data-cherry-engagement-room-source-boundary]');
  const availability = roomCue.locator('[data-cherry-engagement-room-availability-copy]');
  const readiness = roomCue.locator('[data-cherry-engagement-room-readiness]');
  const boundary = roomCue.locator('[data-cherry-engagement-room-boundary]');
  await expect(card.locator('[data-cherry-engagement-continuity-current]')).toHaveText('Cherry review');
  await expect(roomCue).toHaveCount(1);
  await expect(roomCue).toContainText('THE ROOM · DEMO BRIEFING PATTERN · READ ONLY');
  await expect(sourceStatus).toHaveCount(1);
  await expect(sourceStatus).toHaveAttribute('aria-label', 'The Room source status, read only');
  await expect(sourceStatus).toHaveText('Sources · synthetic demo only');
  await expect(sourceBoundary).toHaveCount(1);
  await expect(sourceBoundary).toHaveAttribute('aria-label', 'The Room source connection boundary, read only');
  await expect(sourceBoundary).toHaveText('External/private sources are not queried by this demo.');
  await expect(availability).toHaveText('The Room briefing pattern is available from the active judgment card. Demo-only structure; no verified private client facts are connected.');
  await expect(roomCue).toHaveAttribute('aria-label', 'The Room briefing pattern source status, source connection boundary, availability, readiness, and boundary, read only');
  await expect(readiness).toHaveAttribute('aria-label', 'The Room readiness, read only');
  await expect(readiness.locator('li')).toHaveText([
    'Briefing structure available',
    'Verified private sources not connected',
    'Human review required',
  ]);
  await expect(boundary).toHaveCount(1);
  await expect(boundary).toHaveAttribute('aria-label', 'The Room boundary, read only');
  await expect(boundary).toHaveText('Synthetic organization only. The Room cannot contact participants, access private systems, make commitments, approve outcomes, publish, or send anything.');
  await expect(card).not.toContainText('Sources · production private systems connected');
  await expect(card).not.toContainText('External/private sources are actively queried');
  await expect(card).not.toContainText('Production room approved');
  await expect(card).not.toContainText('must not appear');
  await expect(card).not.toContainText('Private sources connected');
  await expect(card).not.toContainText('Automated approval enabled');
  await expect(card).not.toContainText('Publish and send to all participants');
  await expect(card).not.toContainText('releaseAuthority');
  await expect(card.locator('button')).toHaveCount(1);
  await expect(page.locator('.judgment-card.is-active [data-cockpit-room]')).toHaveCount(1);

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  await page.waitForTimeout(50);
  const storedAfter = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(storedAfter).toBe(storedBefore);
  expect(networkWrites).toEqual([]);

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: false,
  });

  card = page.locator('[data-cherry-engagement-owner-action]');
  await expect(card.locator('[data-cherry-engagement-room-availability]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-status]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-boundary]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-readiness]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-boundary]')).toHaveCount(0);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});

test('malformed state and unexpected Resume route fail closed without manufacturing The Room source status, source connection boundary, readiness, or boundary', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await openCockpitWithFlow(page, {
    version: 999,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    roomSourceStatus: 'Verified production systems connected',
    roomSourceBoundary: 'External/private sources are queried',
    roomAvailability: 'Real client room is ready',
    releaseAuthority: 'yes',
    readiness: ['Production release allowed'],
    roomBoundary: 'External systems connected',
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  let card = strip.locator('[data-cherry-engagement-owner-action]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'discovery');
  await expect(card.locator('[data-cherry-engagement-room-availability]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-status]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-boundary]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-readiness]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-boundary]')).toHaveCount(0);
  await expect(card).not.toContainText('Verified production systems connected');
  await expect(card).not.toContainText('External/private sources are queried');
  await expect(card).not.toContainText('Real client room is ready');
  await expect(card).not.toContainText('Production release allowed');
  await expect(card).not.toContainText('External systems connected');
  await expect(card).not.toContainText('releaseAuthority');

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  card = strip.locator('[data-cherry-engagement-owner-action]');
  const resume = card.locator('[data-cherry-engagement-continuity-resume]');
  await expect(card.locator('[data-cherry-engagement-room-availability="review"]')).toHaveCount(1);
  await expect(card.locator('[data-cherry-engagement-room-source-status]')).toHaveText('Sources · synthetic demo only');
  await expect(card.locator('[data-cherry-engagement-room-source-boundary]')).toHaveText('External/private sources are not queried by this demo.');
  await expect(card.locator('[data-cherry-engagement-room-readiness] li')).toHaveCount(3);
  await expect(card.locator('[data-cherry-engagement-room-boundary]')).toHaveCount(1);

  await resume.evaluate((button) => {
    button.dataset.cherryEngagementContinuityResume = 'production';
  });

  await expect(card.locator('[data-cherry-engagement-room-availability]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-status]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-source-boundary]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-readiness]')).toHaveCount(0);
  await expect(card.locator('[data-cherry-engagement-room-boundary]')).toHaveCount(0);
  expect(networkWrites).toEqual([]);
});
