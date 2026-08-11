import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function setFlow(page, value) {
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

async function expectOrientation(page, expected) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const steps = strip.locator('[data-cherry-engagement-continuity-step]');
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-label', 'Synthetic engagement stages');
  await expect(strip).toHaveAttribute('data-cherry-engagement-step-list', 'synthetic');
  await expect(steps).toHaveCount(3);
  await expect(strip.locator('[data-cherry-engagement-continuity-step][role="listitem"]')).toHaveCount(3);
  await expect(strip.locator('[data-cherry-engagement-continuity-step][aria-current="step"]')).toHaveCount(1);

  const orderedIds = await steps.evaluateAll((nodes) => nodes.map((node) => node.dataset.cherryEngagementContinuityStep));
  expect(orderedIds).toEqual(['discovery', 'review', 'record']);

  for (const [id, config] of Object.entries(expected)) {
    const step = strip.locator(`[data-cherry-engagement-continuity-step="${id}"]`);
    await expect(step).toHaveAttribute('role', 'listitem');
    await expect(step).toHaveAttribute('data-cherry-engagement-step-orientation', config.status);
    await expect(step).toHaveAttribute('aria-label', config.label);
    if (config.status === 'current') await expect(step).toHaveAttribute('aria-current', 'step');
    else await expect(step).not.toHaveAttribute('aria-current', /.+/);
  }
}

const DISCOVERY_ORIENTATION = {
  discovery: { status: 'current', label: 'Discovery. Current synthetic step.' },
  review: { status: 'upcoming', label: 'Cherry review. Upcoming synthetic step.' },
  record: { status: 'upcoming', label: 'Transformation Record. Upcoming synthetic step.' },
};

const REVIEW_ORIENTATION = {
  discovery: { status: 'completed', label: 'Discovery. Completed synthetic step.' },
  review: { status: 'current', label: 'Cherry review. Current synthetic step.' },
  record: { status: 'upcoming', label: 'Transformation Record. Upcoming synthetic step.' },
};

const RECORD_ORIENTATION = {
  discovery: { status: 'completed', label: 'Discovery. Completed synthetic step.' },
  review: { status: 'completed', label: 'Cherry review. Completed synthetic step.' },
  record: { status: 'current', label: 'Transformation Record. Current synthetic step.' },
};

test('semantic continuity exposes one ordered synthetic stage list with exactly one aria-current step', async ({ page }) => {
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
    ariaCurrent: 'production',
    privateClientName: 'must not appear',
  });
  await expectOrientation(page, DISCOVERY_ORIENTATION);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    currentStep: 'production',
    releaseAuthority: 'yes',
  });
  await expectOrientation(page, REVIEW_ORIENTATION);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: false,
    injectedStatus: 'approved',
  });
  await expectOrientation(page, RECORD_ORIENTATION);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    injectedStatus: 'released',
  });
  await expectOrientation(page, RECORD_ORIENTATION);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).not.toContainText('must not appear');
  await expect(strip).not.toContainText('production');
  await expect(strip).not.toContainText('released');

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    const unexpectedStep = document.createElement('span');
    unexpectedStep.dataset.cherryEngagementContinuityStep = 'production';
    stageList?.appendChild(unexpectedStep);
  });
  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('aria-label', /.+/);
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-step-list', /.+/);
  await expect(strip.locator('[role="listitem"]')).toHaveCount(0);
  await expect(strip.locator('[aria-current="step"]')).toHaveCount(0);

  const persisted = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(JSON.parse(persisted)).toMatchObject({
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
    injectedStatus: 'released',
  });
  expect(networkWrites).toEqual([]);

  const focusedStep = await page.evaluate(() => Boolean(document.activeElement?.closest?.('[data-cherry-engagement-continuity-step]')));
  expect(focusedStep).toBe(false);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('malformed flow fails closed to sanitized Discovery list semantics and leaving cockpit removes the synthetic step surface', async ({ page }) => {
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
    currentStep: 'Production release',
    privateClientContext: 'secret',
  });

  await expectOrientation(page, DISCOVERY_ORIENTATION);
  const strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).not.toContainText('Production release');
  await expect(strip).not.toContainText('secret');

  await page.goto('http://127.0.0.1:4173/#/home');
  await expect(page.locator('[data-cherry-engagement-continuity]')).toHaveCount(0);
  await expect(page.locator('[role="list"][data-cherry-engagement-step-list="synthetic"]')).toHaveCount(0);
  await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
  expect(networkWrites).toEqual([]);
});
