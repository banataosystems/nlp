import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';

async function openFlow(page, flow) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: FLOW_KEY, state: flow });
  await page.reload();
}

async function expectStatuses(page, expected) {
  const stages = page.locator('.cherry-engagement-continuity__steps > article');
  await expect(stages).toHaveCount(3);
  for (let index = 0; index < expected.length; index += 1) {
    await expect(stages.nth(index)).toHaveAttribute('data-cherry-engagement-continuity-status', expected[index]);
  }
}

async function visualSnapshot(page) {
  return page.locator('.cherry-engagement-continuity__steps > article').evaluateAll((articles) => articles.map((article) => ({
    borderColor: getComputedStyle(article).borderColor,
    textColor: getComputedStyle(article.querySelector('strong')).color,
  })));
}

async function expectFailClosedVisualState(page) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const stages = strip.locator('.cherry-engagement-continuity__steps > article');
  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-step-list', /.+/);
  const count = await stages.count();
  for (let index = 0; index < count; index += 1) {
    await expect(stages.nth(index)).not.toHaveAttribute('data-cherry-engagement-continuity-status', /.+/);
    await expect(stages.nth(index)).not.toHaveAttribute('data-cherry-engagement-step-orientation', /.+/);
    await expect(stages.nth(index)).not.toHaveAttribute('aria-current', /.+/);
  }
}

test('visual stage status markers self-repair and fail closed against local DOM spoofing', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
  });

  await expectStatuses(page, ['complete', 'current', 'upcoming']);
  const trustedVisuals = await visualSnapshot(page);
  const storedBefore = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);
  const hashBefore = await page.evaluate(() => location.hash);

  await page.evaluate(() => {
    const stages = document.querySelectorAll('.cherry-engagement-continuity__steps > article');
    stages[0]?.setAttribute('data-cherry-engagement-continuity-status', 'current');
    stages[1]?.setAttribute('data-cherry-engagement-continuity-status', 'complete-current');
    stages[2]?.setAttribute('data-cherry-engagement-continuity-status', 'complete');
  });
  await expectStatuses(page, ['complete', 'current', 'upcoming']);
  expect(await visualSnapshot(page)).toEqual(trustedVisuals);

  await page.evaluate(() => {
    document.querySelectorAll('.cherry-engagement-continuity__steps > article').forEach((stage) => {
      stage.removeAttribute('data-cherry-engagement-continuity-status');
    });
  });
  await expectStatuses(page, ['complete', 'current', 'upcoming']);
  expect(await visualSnapshot(page)).toEqual(trustedVisuals);

  await page.evaluate(() => {
    document.querySelector('[data-cherry-engagement-continuity]')
      ?.setAttribute('data-cherry-engagement-continuity-stage', 'record');
  });
  await expectFailClosedVisualState(page);

  await page.evaluate(() => {
    document.querySelector('[data-cherry-engagement-continuity]')
      ?.setAttribute('data-cherry-engagement-continuity-stage', 'review');
  });
  await expectStatuses(page, ['complete', 'current', 'upcoming']);
  await expect(page.locator('[data-cherry-engagement-continuity]')).toHaveAttribute('role', 'list');
  expect(await visualSnapshot(page)).toEqual(trustedVisuals);

  await page.evaluate(() => {
    const container = document.querySelector('.cherry-engagement-continuity__steps');
    const discovery = container?.querySelector('article[data-cherry-engagement-continuity-step="discovery"]');
    const record = container?.querySelector('article[data-cherry-engagement-continuity-step="record"]');
    if (!(container instanceof HTMLElement) || !(discovery instanceof HTMLElement) || !(record instanceof HTMLElement)) return;
    container.insertBefore(record, discovery);
    container.querySelectorAll('article').forEach((stage) => {
      stage.setAttribute('data-cherry-engagement-continuity-status', 'complete-current');
    });
  });
  await expectFailClosedVisualState(page);

  await page.evaluate(() => {
    const container = document.querySelector('.cherry-engagement-continuity__steps');
    if (!(container instanceof HTMLElement)) return;
    const byLabel = (label) => Array.from(container.querySelectorAll('article')).find(
      (article) => article.querySelector('strong')?.textContent?.trim() === label,
    );
    const discovery = byLabel('Discovery');
    const review = byLabel('Cherry review');
    const record = byLabel('Transformation Record');
    if (!(discovery instanceof HTMLElement) || !(review instanceof HTMLElement) || !(record instanceof HTMLElement)) return;
    discovery.dataset.cherryEngagementContinuityStep = 'discovery';
    review.dataset.cherryEngagementContinuityStep = 'review';
    record.dataset.cherryEngagementContinuityStep = 'record';
    container.append(discovery, review, record);
  });
  await expectStatuses(page, ['complete', 'current', 'upcoming']);
  expect(await visualSnapshot(page)).toEqual(trustedVisuals);

  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  await expect(resume).not.toHaveAttribute('inert', /.+/);
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  expect(await page.evaluate(() => location.hash)).toBe(hashBefore);
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(storedBefore);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('completed record visual status is derived from sanitized synthetic flow state', async ({ page }) => {
  await openFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });

  await expectStatuses(page, ['complete', 'complete', 'complete-current']);
  await expect(page.locator('[data-cherry-engagement-continuity]')).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');

  await page.evaluate(() => {
    const stages = document.querySelectorAll('.cherry-engagement-continuity__steps > article');
    stages[0]?.setAttribute('data-cherry-engagement-continuity-status', 'upcoming');
    stages[1]?.removeAttribute('data-cherry-engagement-continuity-status');
    stages[2]?.setAttribute('data-cherry-engagement-continuity-status', 'current');
  });
  await expectStatuses(page, ['complete', 'complete', 'complete-current']);

  const current = page.locator('.cherry-engagement-continuity__steps > article[aria-current="step"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveAttribute('data-cherry-engagement-continuity-step', 'record');
  await expect(current).toHaveAttribute('data-cherry-engagement-continuity-status', 'complete-current');
});
