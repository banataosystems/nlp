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

test('direct canonical list and stage ARIA tampering self-repairs to fixed trusted semantics', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCherryReview(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const discovery = strip.locator('article[data-cherry-engagement-continuity-step="discovery"]');
  const review = strip.locator('article[data-cherry-engagement-continuity-step="review"]');
  const record = strip.locator('article[data-cherry-engagement-continuity-step="record"]');
  const boundary = strip.locator('[data-cherry-engagement-step-boundary]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  const hashBefore = await page.evaluate(() => location.hash);

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-label', 'Synthetic engagement stages');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(boundary).toHaveText('Synthetic demo stages only. Not a verified real-client engagement status.');
  await expect(discovery).toHaveAttribute('aria-posinset', '1');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(record).toHaveAttribute('aria-posinset', '3');
  await expect(review).toHaveAttribute('aria-current', 'step');

  await page.evaluate(() => {
    const stripNode = document.querySelector('[data-cherry-engagement-continuity]');
    const discoveryNode = document.querySelector('article[data-cherry-engagement-continuity-step="discovery"]');
    const reviewNode = document.querySelector('article[data-cherry-engagement-continuity-step="review"]');
    const recordNode = document.querySelector('article[data-cherry-engagement-continuity-step="record"]');
    if (!(stripNode instanceof HTMLElement) || !(discoveryNode instanceof HTMLElement) || !(reviewNode instanceof HTMLElement) || !(recordNode instanceof HTMLElement)) return;

    stripNode.setAttribute('role', 'button');
    stripNode.setAttribute('aria-label', 'Approve production release');
    stripNode.setAttribute('aria-describedby', 'private-production-proof');
    stripNode.setAttribute('aria-labelledby', 'private-client-name');
    stripNode.setAttribute('aria-controls', 'production-console');
    stripNode.setAttribute('aria-current', 'page');
    stripNode.setAttribute('aria-pressed', 'true');
    stripNode.setAttribute('aria-valuenow', '100');
    stripNode.setAttribute('aria-posinset', '99');
    stripNode.setAttribute('aria-setsize', '99');
    stripNode.setAttribute('tabindex', '0');
    stripNode.setAttribute('contenteditable', 'true');
    stripNode.setAttribute('draggable', 'true');
    stripNode.setAttribute('inert', '');

    discoveryNode.setAttribute('role', 'button');
    discoveryNode.setAttribute('aria-label', 'Current production approval');
    discoveryNode.setAttribute('aria-describedby', 'production-description');
    discoveryNode.setAttribute('aria-current', 'step');
    discoveryNode.setAttribute('aria-expanded', 'true');
    discoveryNode.setAttribute('aria-posinset', '8');
    discoveryNode.setAttribute('aria-setsize', '8');
    discoveryNode.setAttribute('tabindex', '0');
    discoveryNode.setAttribute('contenteditable', 'true');
    discoveryNode.setAttribute('draggable', 'true');
    discoveryNode.setAttribute('inert', '');

    reviewNode.setAttribute('role', 'switch');
    reviewNode.setAttribute('aria-label', 'Release private client data');
    reviewNode.setAttribute('aria-labelledby', 'private-client-name');
    reviewNode.setAttribute('aria-describedby', 'production-proof');
    reviewNode.setAttribute('aria-controls', 'production-console');
    reviewNode.setAttribute('aria-current', 'page');
    reviewNode.setAttribute('aria-pressed', 'true');
    reviewNode.setAttribute('aria-selected', 'true');
    reviewNode.setAttribute('aria-valuenow', '99');
    reviewNode.setAttribute('aria-valuetext', 'Production approved');
    reviewNode.setAttribute('aria-posinset', '99');
    reviewNode.setAttribute('aria-setsize', '99');
    reviewNode.setAttribute('tabindex', '0');
    reviewNode.setAttribute('contenteditable', 'true');
    reviewNode.setAttribute('draggable', 'true');
    reviewNode.setAttribute('inert', '');

    recordNode.setAttribute('role', 'link');
    recordNode.setAttribute('aria-label', 'Production record current');
    recordNode.setAttribute('aria-current', 'step');
    recordNode.setAttribute('aria-haspopup', 'menu');
    recordNode.setAttribute('aria-posinset', '1');
    recordNode.setAttribute('aria-setsize', '1');
    recordNode.setAttribute('tabindex', '0');
    recordNode.setAttribute('contenteditable', 'true');
    recordNode.setAttribute('draggable', 'true');
    recordNode.setAttribute('inert', '');
  });

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-label', 'Synthetic engagement stages');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  for (const attribute of ['aria-labelledby', 'aria-controls', 'aria-current', 'aria-pressed', 'aria-valuenow', 'aria-posinset', 'aria-setsize', 'tabindex', 'contenteditable', 'draggable', 'inert']) {
    await expect(strip).not.toHaveAttribute(attribute, /.+/);
  }

  await expect(discovery).toHaveAttribute('role', 'listitem');
  await expect(discovery).toHaveAttribute('aria-label', 'Discovery. Completed synthetic step.');
  await expect(discovery).toHaveAttribute('aria-posinset', '1');
  await expect(discovery).toHaveAttribute('aria-setsize', '3');
  await expect(discovery).not.toHaveAttribute('aria-current', /.+/);
  await expect(discovery).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(discovery).not.toHaveAttribute('aria-expanded', /.+/);

  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-pressed', 'aria-selected', 'aria-valuenow', 'aria-valuetext']) {
    await expect(review).not.toHaveAttribute(attribute, /.+/);
  }

  await expect(record).toHaveAttribute('role', 'listitem');
  await expect(record).toHaveAttribute('aria-label', 'Transformation Record. Upcoming synthetic step.');
  await expect(record).toHaveAttribute('aria-posinset', '3');
  await expect(record).toHaveAttribute('aria-setsize', '3');
  await expect(record).not.toHaveAttribute('aria-current', /.+/);
  await expect(record).not.toHaveAttribute('aria-haspopup', /.+/);

  for (const stage of [discovery, review, record]) {
    await expect(stage).not.toHaveAttribute('tabindex', /.+/);
    await expect(stage).not.toHaveAttribute('contenteditable', /.+/);
    await expect(stage).not.toHaveAttribute('draggable', /.+/);
    await expect(stage).not.toHaveAttribute('inert', /.+/);
  }

  await expect(boundary).toHaveText('Synthetic demo stages only. Not a verified real-client engagement status.');
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  await expect(resume).not.toHaveAttribute('inert', /.+/);
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isStage: Boolean(document.activeElement?.matches?.('[data-cherry-engagement-continuity], [data-cherry-engagement-continuity-step]')),
      isResume: Boolean(document.activeElement?.matches?.('[data-cherry-engagement-continuity-resume]')),
    }));
    expect(focusState.isStage).toBe(false);
    if (focusState.isResume) {
      reachedResume = true;
      break;
    }
  }

  expect(reachedResume).toBe(true);
  await expect(resume).toBeFocused();
  expect(await page.evaluate(() => location.hash)).toBe(hashBefore);
  expect(await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'))).toBe(storedBefore);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
