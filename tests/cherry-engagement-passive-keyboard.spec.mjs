import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function openCockpitWithFlow(page, value) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

async function expectPassiveStageSurface(page) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const steps = strip.locator('[data-cherry-engagement-continuity-step]');
  const boundary = strip.locator('[data-cherry-engagement-step-boundary]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');

  await expect(strip).toBeVisible();
  await expect(steps).toHaveCount(3);
  await expect(boundary).toHaveCount(1);
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();

  const passivity = await strip.evaluate((node) => ({
    listTabIndex: node.tabIndex,
    listHasTabIndex: node.hasAttribute('tabindex'),
    stepTabIndexes: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => step.tabIndex),
    stepHasTabIndex: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => step.hasAttribute('tabindex')),
    boundaryTabIndexes: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => item.tabIndex),
    boundaryHasTabIndex: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => item.hasAttribute('tabindex')),
  }));

  expect(passivity).toEqual({
    listTabIndex: -1,
    listHasTabIndex: false,
    stepTabIndexes: [-1, -1, -1],
    stepHasTabIndex: [false, false, false],
    boundaryTabIndexes: [-1],
    boundaryHasTabIndex: [false],
  });

  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);
  await expect(resume).not.toHaveAttribute('tabindex', '-1');

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isPassiveStageSemantic: Boolean(document.activeElement?.matches?.(
        '[data-cherry-engagement-continuity], [data-cherry-engagement-continuity-step], [data-cherry-engagement-step-boundary]'
      )),
      isBoundary: Boolean(document.activeElement?.matches?.('[data-cherry-engagement-step-boundary]')),
      isResume: Boolean(document.activeElement?.matches?.('[data-cherry-engagement-continuity-resume]')),
    }));

    expect(focusState.isPassiveStageSemantic).toBe(false);
    expect(focusState.isBoundary).toBe(false);
    if (focusState.isResume) {
      reachedResume = true;
      break;
    }
  }

  expect(reachedResume).toBe(true);
  await expect(resume).toBeFocused();
}

test('synthetic stage semantics stay out of sequential keyboard focus while the existing Resume owner action remains reachable', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  const cases = [
    { version: 1, discoveryPrepared: false, ownerReviewed: false, recordPrepared: false },
    { version: 1, discoveryPrepared: true, ownerReviewed: false, recordPrepared: false },
    { version: 1, discoveryPrepared: true, ownerReviewed: true, recordPrepared: false },
  ];

  for (const flow of cases) {
    await openCockpitWithFlow(page, flow);
    const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
    await expectPassiveStageSurface(page);
    const storedAfter = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
    expect(storedAfter).toBe(storedBefore);
  }

  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});

test('fail-closed semantic removal cannot create a keyboard trap or displace the Resume owner action', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
    tabindex: '0',
    privateFocusTarget: 'production-approval',
  });

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');
  await expectPassiveStageSurface(page);

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    const unexpectedStep = document.createElement('span');
    unexpectedStep.dataset.cherryEngagementContinuityStep = 'production';
    unexpectedStep.setAttribute('tabindex', '0');
    stageList?.appendChild(unexpectedStep);
  });

  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(strip.locator('[data-cherry-engagement-step-boundary]')).toHaveCount(0);
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  const recognizedStepPassivity = await strip.locator('[data-cherry-engagement-continuity-step="discovery"], [data-cherry-engagement-continuity-step="review"], [data-cherry-engagement-continuity-step="record"]').evaluateAll((nodes) => nodes.map((node) => ({
    tabIndex: node.tabIndex,
    hasTabIndex: node.hasAttribute('tabindex'),
  })));
  expect(recognizedStepPassivity).toEqual([
    { tabIndex: -1, hasTabIndex: false },
    { tabIndex: -1, hasTabIndex: false },
    { tabIndex: -1, hasTabIndex: false },
  ]);

  await page.evaluate(() => {
    document.querySelector('[data-cherry-engagement-continuity-step="production"]')?.remove();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isPassiveStageSemantic: Boolean(document.activeElement?.matches?.(
        '[data-cherry-engagement-continuity], [data-cherry-engagement-continuity-step], [data-cherry-engagement-step-boundary]'
      )),
      isResume: Boolean(document.activeElement?.matches?.('[data-cherry-engagement-continuity-resume]')),
    }));
    expect(focusState.isPassiveStageSemantic).toBe(false);
    if (focusState.isResume) {
      reachedResume = true;
      break;
    }
  }

  expect(reachedResume).toBe(true);
  await expect(resume).toBeFocused();
  expect(networkWrites).toEqual([]);
});
