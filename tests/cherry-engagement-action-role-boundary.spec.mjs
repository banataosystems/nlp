import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const ACTION_ROLES = [
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'scrollbar',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
  'treeitem',
];

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

test('action-like semantic roles injected inside canonical stages fail closed while Resume remains the sole owner action', async ({ page }) => {
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

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  const hashBefore = await page.evaluate(() => location.hash);

  await page.evaluate((roles) => {
    const stage = document.querySelector('article[data-cherry-engagement-continuity-step="review"]');
    if (!(stage instanceof HTMLElement)) return;

    window.__cherryRoleSpoofClicks = 0;
    roles.forEach((role, index) => {
      const node = document.createElement(index % 2 === 0 ? 'span' : 'div');
      node.dataset.cherryInjectedActionRole = role;
      node.setAttribute('role', role);
      node.setAttribute('tabindex', '0');
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('draggable', 'true');
      node.textContent = `Injected ${role} action`;
      node.addEventListener('click', () => {
        window.__cherryRoleSpoofClicks += 1;
      });
      stage.appendChild(node);
    });
  }, ACTION_ROLES);

  const injected = review.locator('[data-cherry-injected-action-role]');
  await expect(injected).toHaveCount(ACTION_ROLES.length);

  for (const role of ACTION_ROLES) {
    const node = review.locator(`[data-cherry-injected-action-role="${role}"]`);
    await expect(node).toHaveCount(1);
    await expect(node).not.toHaveAttribute('role', /.+/);
    await expect(node).not.toHaveAttribute('tabindex', /.+/);
    await expect(node).not.toHaveAttribute('contenteditable', /.+/);
    await expect(node).not.toHaveAttribute('draggable', /.+/);
    await expect(node).toHaveAttribute('inert', '');
  }

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');

  const repaired = review.locator('[data-cherry-injected-action-role="button"]');
  await page.evaluate(() => {
    const node = document.querySelector('[data-cherry-injected-action-role="button"]');
    if (!(node instanceof HTMLElement)) return;
    node.removeAttribute('inert');
    node.setAttribute('role', 'button link');
    node.setAttribute('tabindex', '0');
    node.setAttribute('contenteditable', 'true');
    node.setAttribute('draggable', 'true');
  });

  await expect(repaired).not.toHaveAttribute('role', /.+/);
  await expect(repaired).not.toHaveAttribute('tabindex', /.+/);
  await expect(repaired).not.toHaveAttribute('contenteditable', /.+/);
  await expect(repaired).not.toHaveAttribute('draggable', /.+/);
  await expect(repaired).toHaveAttribute('inert', '');

  for (const role of ['button', 'treeitem']) {
    const node = review.locator(`[data-cherry-injected-action-role="${role}"]`);
    const reachedByProgrammaticFocus = await node.evaluate((element) => {
      element.focus();
      return document.activeElement === element;
    });
    expect(reachedByProgrammaticFocus).toBe(false);

    await node.scrollIntoViewIfNeeded();
    const box = await node.boundingBox();
    expect(box).not.toBeNull();
    if (box) await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
  }

  expect(await page.evaluate(() => window.__cherryRoleSpoofClicks)).toBe(0);
  expect(await page.evaluate(() => location.hash)).toBe(hashBefore);

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isInjected: Boolean(document.activeElement?.matches?.('[data-cherry-injected-action-role]')),
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
