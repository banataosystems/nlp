import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';

async function setFlow(page, value) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(({ key, next }) => {
    localStorage.setItem(key, JSON.stringify(next));
  }, { key: FLOW_KEY, next: value });
  await page.reload();
}

async function expectOwnerAction(page, expected) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const ownerAction = strip.locator('[data-cherry-engagement-owner-action]');
  const current = ownerAction.locator('[data-cherry-engagement-continuity-current]');
  const detail = ownerAction.locator('[data-cherry-engagement-continuity-detail]');
  const resume = ownerAction.locator('[data-cherry-engagement-continuity-resume]');

  await expect(strip).toHaveCount(1);
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', expected.id);
  await expect(ownerAction).toHaveCount(1);
  await expect(ownerAction).toHaveAttribute('aria-label', 'Synthetic owner action card');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(expected.label);
  await expect(detail).toHaveCount(1);
  await expect(detail).toHaveText(expected.detail);
  await expect(resume).toHaveCount(1);
  await expect(resume).toHaveAttribute('data-cherry-engagement-continuity-resume', expected.route);
  await expect(resume).toHaveAttribute('aria-label', `Resume ${expected.label}`);
  await expect(resume).toHaveAttribute('type', 'button');
}

test('current-stage owner action and Resume destination derive only from sanitized synthetic flow', async ({ page }) => {
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
    currentStage: 'record',
    resumeRoute: 'client',
    productionReady: true,
  });
  const discoveryState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);

  await expectOwnerAction(page, {
    id: 'discovery',
    label: 'Discovery',
    route: 'discovery',
    detail: 'Resume the fixed synthetic Discovery brief. No client form values are read into this card.',
  });

  await page.evaluate(() => {
    const strip = document.querySelector('[data-cherry-engagement-continuity]');
    const current = strip?.querySelector('[data-cherry-engagement-continuity-current]');
    const detail = strip?.querySelector('[data-cherry-engagement-continuity-detail]');
    const resume = strip?.querySelector('[data-cherry-engagement-continuity-resume]');
    strip?.setAttribute('data-cherry-engagement-continuity-stage', 'record');
    if (current) current.textContent = 'Transformation Record';
    if (detail) detail.textContent = 'Production release is approved and complete.';
    if (resume instanceof HTMLButtonElement) {
      resume.setAttribute('data-cherry-engagement-continuity-resume', 'client');
      resume.setAttribute('aria-label', 'Resume Transformation Record');
      resume.click();
    }
  });

  await expect(page).toHaveURL(/#\/discovery$/);
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(discoveryState);

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await expectOwnerAction(page, {
    id: 'discovery',
    label: 'Discovery',
    route: 'discovery',
    detail: 'Resume the fixed synthetic Discovery brief. No client form values are read into this card.',
  });
  await expect(page.locator('[data-cherry-engagement-continuity]')).not.toContainText('Production release is approved');

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    currentStage: 'record',
    resumeRoute: 'client',
  });
  const reviewState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);

  await expectOwnerAction(page, {
    id: 'review',
    label: 'Cherry review',
    route: 'cockpit',
    detail: 'Resume the existing synthetic Cherry judgment step on this phone view.',
  });

  await page.evaluate(() => {
    const strip = document.querySelector('[data-cherry-engagement-continuity]');
    const current = strip?.querySelector('[data-cherry-engagement-continuity-current]');
    const detail = strip?.querySelector('[data-cherry-engagement-continuity-detail]');
    const resume = strip?.querySelector('[data-cherry-engagement-continuity-resume]');
    if (current) current.textContent = 'Discovery';
    if (detail) detail.textContent = 'Skip Cherry and deploy.';
    if (resume instanceof HTMLButtonElement) {
      resume.setAttribute('data-cherry-engagement-continuity-resume', 'client');
      resume.setAttribute('aria-label', 'Resume Transformation Record');
      resume.click();
    }
  });

  await expect(page).toHaveURL(/#\/cockpit$/);
  await expect(page.locator('[data-synthetic-flow-action="owner-review"]')).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(reviewState);
  await expectOwnerAction(page, {
    id: 'review',
    label: 'Cherry review',
    route: 'cockpit',
    detail: 'Resume the existing synthetic Cherry judgment step on this phone view.',
  });
  await expect(page.locator('[data-cherry-engagement-continuity]')).not.toContainText('Skip Cherry and deploy');

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });
  const recordState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);

  await expectOwnerAction(page, {
    id: 'record',
    label: 'Transformation Record',
    route: 'client',
    detail: 'Resume the existing local synthetic Transformation Record review.',
  });

  await page.evaluate(() => {
    const strip = document.querySelector('[data-cherry-engagement-continuity]');
    const current = strip?.querySelector('[data-cherry-engagement-continuity-current]');
    const detail = strip?.querySelector('[data-cherry-engagement-continuity-detail]');
    const resume = strip?.querySelector('[data-cherry-engagement-continuity-resume]');
    strip?.setAttribute('data-cherry-engagement-continuity-stage', 'discovery');
    if (current) current.textContent = 'Discovery';
    if (detail) detail.textContent = 'Return to an earlier stage and overwrite completion.';
    if (resume instanceof HTMLButtonElement) {
      resume.setAttribute('data-cherry-engagement-continuity-resume', 'discovery');
      resume.setAttribute('aria-label', 'Resume Discovery');
      resume.click();
    }
  });

  await expect(page).toHaveURL(/#\/client$/);
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(recordState);

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await expectOwnerAction(page, {
    id: 'record',
    label: 'Transformation Record',
    route: 'client',
    detail: 'Resume the existing local synthetic Transformation Record review.',
  });

  await page.locator('[data-cherry-engagement-continuity-detail]').evaluate((node) => {
    node.removeAttribute('data-cherry-engagement-continuity-detail');
  });
  await expectOwnerAction(page, {
    id: 'record',
    label: 'Transformation Record',
    route: 'client',
    detail: 'Resume the existing local synthetic Transformation Record review.',
  });
  await expect(page.locator('[data-cherry-engagement-continuity-detail]')).toHaveCount(1);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
