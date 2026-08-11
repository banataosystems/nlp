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

test('interactive descendants are inert while the canonical stage semantics and Resume action remain intact', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCherryReview(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const review = strip.locator('article[data-cherry-engagement-continuity-step="review"]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');

  await expect(strip).toBeVisible();
  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(review).toHaveCount(1);
  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  const hashBefore = await page.evaluate(() => location.hash);

  await page.evaluate(() => {
    const stage = document.querySelector('article[data-cherry-engagement-continuity-step="review"]');
    if (!(stage instanceof HTMLElement)) return;

    window.__cherryDescendantButtonClicks = 0;
    window.__cherryDescendantLinkClicks = 0;

    const injectedButton = document.createElement('button');
    injectedButton.type = 'button';
    injectedButton.dataset.cherryInjectedStageAction = 'button';
    injectedButton.tabIndex = 0;
    injectedButton.setAttribute('contenteditable', 'true');
    injectedButton.setAttribute('draggable', 'true');
    injectedButton.textContent = 'Injected Cherry approval';
    injectedButton.addEventListener('click', () => {
      window.__cherryDescendantButtonClicks += 1;
    });

    const injectedLink = document.createElement('a');
    injectedLink.href = '#/injected-private-action';
    injectedLink.dataset.cherryInjectedStageAction = 'link';
    injectedLink.tabIndex = 0;
    injectedLink.setAttribute('contenteditable', 'true');
    injectedLink.setAttribute('draggable', 'true');
    injectedLink.textContent = 'Injected private-source action';
    injectedLink.addEventListener('click', () => {
      window.__cherryDescendantLinkClicks += 1;
    });

    stage.append(injectedButton, injectedLink);
  });

  const injectedButton = review.locator('[data-cherry-injected-stage-action="button"]');
  const injectedLink = review.locator('[data-cherry-injected-stage-action="link"]');

  await expect(injectedButton).toHaveCount(1);
  await expect(injectedLink).toHaveCount(1);
  await expect(injectedButton).toHaveAttribute('inert', '');
  await expect(injectedLink).toHaveAttribute('inert', '');
  await expect(injectedButton).not.toHaveAttribute('tabindex', /.+/);
  await expect(injectedLink).not.toHaveAttribute('tabindex', /.+/);
  await expect(injectedButton).not.toHaveAttribute('contenteditable', /.+/);
  await expect(injectedLink).not.toHaveAttribute('contenteditable', /.+/);
  await expect(injectedButton).not.toHaveAttribute('draggable', /.+/);
  await expect(injectedLink).not.toHaveAttribute('draggable', /.+/);

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');

  await page.evaluate(() => {
    const button = document.querySelector('[data-cherry-injected-stage-action="button"]');
    const link = document.querySelector('[data-cherry-injected-stage-action="link"]');
    for (const node of [button, link]) {
      if (!(node instanceof HTMLElement)) continue;
      node.removeAttribute('inert');
      node.setAttribute('tabindex', '0');
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('draggable', 'true');
    }
  });

  await expect(injectedButton).toHaveAttribute('inert', '');
  await expect(injectedLink).toHaveAttribute('inert', '');
  await expect(injectedButton).not.toHaveAttribute('tabindex', /.+/);
  await expect(injectedLink).not.toHaveAttribute('tabindex', /.+/);
  await expect(injectedButton).not.toHaveAttribute('contenteditable', /.+/);
  await expect(injectedLink).not.toHaveAttribute('contenteditable', /.+/);
  await expect(injectedButton).not.toHaveAttribute('draggable', /.+/);
  await expect(injectedLink).not.toHaveAttribute('draggable', /.+/);

  for (const injected of [injectedButton, injectedLink]) {
    const reachedByProgrammaticFocus = await injected.evaluate((node) => {
      node.focus();
      return document.activeElement === node;
    });
    expect(reachedByProgrammaticFocus).toBe(false);

    await injected.scrollIntoViewIfNeeded();
    const box = await injected.boundingBox();
    expect(box).not.toBeNull();
    if (box) await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
  }

  expect(await page.evaluate(() => ({
    button: window.__cherryDescendantButtonClicks,
    link: window.__cherryDescendantLinkClicks,
  }))).toEqual({ button: 0, link: 0 });
  expect(await page.evaluate(() => location.hash)).toBe(hashBefore);

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isInjected: Boolean(document.activeElement?.matches?.('[data-cherry-injected-stage-action]')),
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
  await expect(resume).toBeEnabled();
  await expect(resume).not.toHaveAttribute('inert', /.+/);
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  const storedAfter = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  expect(storedAfter).toBe(storedBefore);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
