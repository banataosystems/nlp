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
    listHasContentEditable: node.hasAttribute('contenteditable'),
    listHasDraggable: node.hasAttribute('draggable'),
    stepTabIndexes: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => step.tabIndex),
    stepHasTabIndex: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => step.hasAttribute('tabindex')),
    stepHasContentEditable: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => step.hasAttribute('contenteditable')),
    stepHasDraggable: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => step.hasAttribute('draggable')),
    boundaryTabIndexes: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => item.tabIndex),
    boundaryHasTabIndex: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => item.hasAttribute('tabindex')),
    boundaryHasContentEditable: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => item.hasAttribute('contenteditable')),
    boundaryHasDraggable: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => item.hasAttribute('draggable')),
  }));

  expect(passivity).toEqual({
    listTabIndex: -1,
    listHasTabIndex: false,
    listHasContentEditable: false,
    listHasDraggable: false,
    stepTabIndexes: [-1, -1, -1],
    stepHasTabIndex: [false, false, false],
    stepHasContentEditable: [false, false, false],
    stepHasDraggable: [false, false, false],
    boundaryTabIndexes: [-1],
    boundaryHasTabIndex: [false],
    boundaryHasContentEditable: [false],
    boundaryHasDraggable: [false],
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

test('tabindex injection is stripped from the synthetic stage surface and fail-closed unexpected steps cannot enter keyboard order', async ({ page }) => {
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
  const reviewStep = strip.locator('[data-cherry-engagement-continuity-step="review"]');
  const boundary = strip.locator('[data-cherry-engagement-step-boundary]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');
  await expectPassiveStageSurface(page);

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    stageList?.setAttribute('tabindex', '0');
    stageList?.querySelector('[data-cherry-engagement-continuity-step="review"]')?.setAttribute('tabindex', '0');
    stageList?.querySelector('[data-cherry-engagement-step-boundary]')?.setAttribute('tabindex', '0');
  });

  await expect(strip).not.toHaveAttribute('tabindex', /.+/);
  await expect(reviewStep).not.toHaveAttribute('tabindex', /.+/);
  await expect(boundary).not.toHaveAttribute('tabindex', /.+/);
  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    const unexpectedStep = document.createElement('span');
    unexpectedStep.dataset.cherryEngagementContinuityStep = 'production';
    unexpectedStep.setAttribute('tabindex', '0');
    stageList?.appendChild(unexpectedStep);
  });

  const unexpectedStep = strip.locator('[data-cherry-engagement-continuity-step="production"]');
  await expect(unexpectedStep).toHaveCount(1);
  await expect(unexpectedStep).not.toHaveAttribute('tabindex', /.+/);
  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(strip.locator('[data-cherry-engagement-step-boundary]')).toHaveCount(0);
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  const renderedStepPassivity = await strip.locator('[data-cherry-engagement-continuity-step]').evaluateAll((nodes) => nodes.map((node) => ({
    id: node.getAttribute('data-cherry-engagement-continuity-step'),
    tabIndex: node.tabIndex,
    hasTabIndex: node.hasAttribute('tabindex'),
  })));
  expect(renderedStepPassivity).toEqual([
    { id: 'discovery', tabIndex: -1, hasTabIndex: false },
    { id: 'review', tabIndex: -1, hasTabIndex: false },
    { id: 'record', tabIndex: -1, hasTabIndex: false },
    { id: 'production', tabIndex: -1, hasTabIndex: false },
  ]);

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

test('contenteditable and draggable injection cannot turn synthetic stage semantics into owner actions', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
    contenteditable: 'true',
    draggable: 'true',
    privateInteractionTarget: 'production-release',
  });

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const reviewStep = strip.locator('[data-cherry-engagement-continuity-step="review"]');
  const boundary = strip.locator('[data-cherry-engagement-step-boundary]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');
  await expectPassiveStageSurface(page);

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    const review = stageList?.querySelector('[data-cherry-engagement-continuity-step="review"]');
    const description = stageList?.querySelector('[data-cherry-engagement-step-boundary]');
    [stageList, review, description].forEach((node) => {
      node?.setAttribute('contenteditable', 'true');
      node?.setAttribute('draggable', 'true');
    });
  });

  for (const node of [strip, reviewStep, boundary]) {
    await expect(node).not.toHaveAttribute('contenteditable', /.+/);
    await expect(node).not.toHaveAttribute('draggable', /.+/);
  }
  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(resume).toBeEnabled();

  const validInteractionState = await strip.evaluate((node) => ({
    listContentEditable: node.isContentEditable,
    listDraggable: node.draggable,
    stepStates: Array.from(node.querySelectorAll('[data-cherry-engagement-continuity-step]')).map((step) => ({
      contentEditable: step.isContentEditable,
      draggable: step.draggable,
    })),
    boundaryStates: Array.from(node.querySelectorAll('[data-cherry-engagement-step-boundary]')).map((item) => ({
      contentEditable: item.isContentEditable,
      draggable: item.draggable,
    })),
  }));
  expect(validInteractionState).toEqual({
    listContentEditable: false,
    listDraggable: false,
    stepStates: [
      { contentEditable: false, draggable: false },
      { contentEditable: false, draggable: false },
      { contentEditable: false, draggable: false },
    ],
    boundaryStates: [{ contentEditable: false, draggable: false }],
  });

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    const unexpectedStep = document.createElement('span');
    unexpectedStep.dataset.cherryEngagementContinuityStep = 'production';
    unexpectedStep.setAttribute('contenteditable', 'true');
    unexpectedStep.setAttribute('draggable', 'true');
    stageList?.appendChild(unexpectedStep);
  });

  const unexpectedStep = strip.locator('[data-cherry-engagement-continuity-step="production"]');
  await expect(unexpectedStep).toHaveCount(1);
  await expect(unexpectedStep).not.toHaveAttribute('contenteditable', /.+/);
  await expect(unexpectedStep).not.toHaveAttribute('draggable', /.+/);
  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(strip.locator('[data-cherry-engagement-step-boundary]')).toHaveCount(0);
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  const renderedInteractionState = await strip.locator('[data-cherry-engagement-continuity-step]').evaluateAll((nodes) => nodes.map((node) => ({
    id: node.getAttribute('data-cherry-engagement-continuity-step'),
    contentEditable: node.isContentEditable,
    draggable: node.draggable,
    hasContentEditable: node.hasAttribute('contenteditable'),
    hasDraggable: node.hasAttribute('draggable'),
  })));
  expect(renderedInteractionState).toEqual([
    { id: 'discovery', contentEditable: false, draggable: false, hasContentEditable: false, hasDraggable: false },
    { id: 'review', contentEditable: false, draggable: false, hasContentEditable: false, hasDraggable: false },
    { id: 'record', contentEditable: false, draggable: false, hasContentEditable: false, hasDraggable: false },
    { id: 'production', contentEditable: false, draggable: false, hasContentEditable: false, hasDraggable: false },
  ]);

  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
