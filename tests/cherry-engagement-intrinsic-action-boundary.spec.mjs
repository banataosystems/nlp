import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function openCherryReview(page) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: false,
      recordPrepared: false,
    }));
  });
  await page.reload();
}

test('intrinsic stage-marker controls fail closed while Resume remains the sole reachable stage action', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCherryReview(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');
  const canonicalSteps = strip.locator('article[data-cherry-engagement-continuity-step]');

  await expect(strip).toBeVisible();
  await expect(canonicalSteps).toHaveCount(3);
  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();

  const baselineInertState = await canonicalSteps.evaluateAll((nodes) => nodes.map((node) => node.hasAttribute('inert')));
  expect(baselineInertState).toEqual([false, false, false]);

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));

  await page.evaluate(() => {
    const stageList = document.querySelector('[data-cherry-engagement-continuity]');
    const review = stageList?.querySelector('[data-cherry-engagement-continuity-step="review"]');
    if (!(stageList instanceof HTMLElement) || !(review instanceof HTMLElement)) return;

    stageList.setAttribute('inert', '');

    const injected = document.createElement('button');
    injected.type = 'button';
    injected.dataset.cherryEngagementContinuityStep = 'review';
    injected.dataset.cherryEngagementContinuityStatus = 'current';
    injected.textContent = 'Injected stage control';
    window.__cherryIntrinsicStageClicks = 0;
    injected.addEventListener('click', () => {
      window.__cherryIntrinsicStageClicks += 1;
    });
    review.replaceWith(injected);
  });

  const injected = strip.locator('button[data-cherry-engagement-continuity-step="review"]');
  await expect(injected).toHaveCount(1);
  await expect(injected).toHaveAttribute('inert', '');
  await expect(strip).not.toHaveAttribute('inert', /.+/);
  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(strip.locator('[data-cherry-engagement-step-boundary]')).toHaveCount(0);
  await expect(injected).not.toHaveAttribute('role', /.+/);
  await expect(injected).not.toHaveAttribute('aria-current', /.+/);
  await expect(injected).not.toHaveAttribute('aria-posinset', /.+/);
  await expect(injected).not.toHaveAttribute('aria-setsize', /.+/);

  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  await expect(resume).not.toHaveAttribute('inert', /.+/);
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  const programmaticFocusReachedInjected = await injected.evaluate((button) => {
    button.focus();
    return document.activeElement === button;
  });
  expect(programmaticFocusReachedInjected).toBe(false);

  await injected.scrollIntoViewIfNeeded();
  const box = await injected.boundingBox();
  expect(box).not.toBeNull();
  if (box) await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
  expect(await page.evaluate(() => window.__cherryIntrinsicStageClicks)).toBe(0);

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isInjected: Boolean(document.activeElement?.matches?.('button[data-cherry-engagement-continuity-step="review"]')),
      isResume: Boolean(document.activeElement?.matches?.('[data-cherry-engagement-continuity-resume]')),
    }));
    expect(focusState.isInjected).toBe(false);
    if (focusState.isResume) {
      reachedResume = true;
      break;
    }
  }

  expect(reachedResume).toBe(true);
  await expect(resume).toBeFocused();

  const storedAfter = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(storedAfter).toBe(storedBefore);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
