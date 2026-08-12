import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const SPOOFED_ARIA_ATTRIBUTES = [
  ['aria-label', 'Approve production'],
  ['aria-labelledby', 'private-client-label'],
  ['aria-describedby', 'private-client-description'],
  ['aria-activedescendant', 'production-control'],
  ['aria-controls', 'production-panel'],
  ['aria-checked', 'true'],
  ['aria-current', 'step'],
  ['aria-disabled', 'false'],
  ['aria-expanded', 'true'],
  ['aria-haspopup', 'menu'],
  ['aria-pressed', 'true'],
  ['aria-selected', 'true'],
  ['aria-autocomplete', 'list'],
  ['aria-readonly', 'false'],
  ['aria-required', 'true'],
  ['aria-valuemax', '100'],
  ['aria-valuemin', '0'],
  ['aria-valuenow', '99'],
  ['aria-valuetext', 'Production approved'],
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

test('accessibility-name and action-state spoofing inside canonical stages fails closed while trusted stage semantics remain fixed', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCherryReview(page);

  const strip = page.locator('[data-cherry-engagement-continuity]');
  const review = strip.locator('article[data-cherry-engagement-continuity-step="review"]');
  const boundary = strip.locator('[data-cherry-engagement-step-boundary]');
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-label', 'Synthetic engagement stages');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(boundary).toHaveText('Synthetic demo stages only. Not a verified real-client engagement status.');
  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');
  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  const hashBefore = await page.evaluate(() => location.hash);

  await page.evaluate((attributes) => {
    const stage = document.querySelector('article[data-cherry-engagement-continuity-step="review"]');
    if (!(stage instanceof HTMLElement)) return;

    window.__cherryAriaSpoofClicks = 0;
    attributes.forEach(([attribute, value], index) => {
      const node = document.createElement(index % 2 === 0 ? 'span' : 'div');
      node.dataset.cherryInjectedAriaSpoof = attribute;
      node.setAttribute(attribute, value);
      node.setAttribute('tabindex', '0');
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('draggable', 'true');
      node.textContent = `Injected ${attribute} semantic`;
      node.addEventListener('click', () => {
        window.__cherryAriaSpoofClicks += 1;
      });
      stage.appendChild(node);
    });
  }, SPOOFED_ARIA_ATTRIBUTES);

  const injected = review.locator('[data-cherry-injected-aria-spoof]');
  await expect(injected).toHaveCount(SPOOFED_ARIA_ATTRIBUTES.length);

  for (const [attribute] of SPOOFED_ARIA_ATTRIBUTES) {
    const node = review.locator(`[data-cherry-injected-aria-spoof="${attribute}"]`);
    await expect(node).toHaveCount(1);
    await expect(node).not.toHaveAttribute(attribute, /.+/);
    await expect(node).not.toHaveAttribute('tabindex', /.+/);
    await expect(node).not.toHaveAttribute('contenteditable', /.+/);
    await expect(node).not.toHaveAttribute('draggable', /.+/);
    await expect(node).toHaveAttribute('inert', '');
  }

  await expect(review.locator('[data-cherry-injected-aria-spoof="aria-label"]')).toHaveText('Injected aria-label semantic');
  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-label', 'Synthetic engagement stages');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(review).toHaveAttribute('role', 'listitem');
  await expect(review).toHaveAttribute('aria-current', 'step');
  await expect(review).toHaveAttribute('aria-posinset', '2');
  await expect(review).toHaveAttribute('aria-setsize', '3');
  await expect(review).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');

  const repaired = review.locator('[data-cherry-injected-aria-spoof="aria-label"]');
  await page.evaluate(() => {
    const node = document.querySelector('[data-cherry-injected-aria-spoof="aria-label"]');
    if (!(node instanceof HTMLElement)) return;
    node.removeAttribute('inert');
    node.setAttribute('aria-label', 'Ship private client data to production');
    node.setAttribute('aria-describedby', 'production-proof');
    node.setAttribute('aria-pressed', 'true');
    node.setAttribute('aria-valuenow', '100');
    node.setAttribute('tabindex', '0');
    node.setAttribute('contenteditable', 'true');
    node.setAttribute('draggable', 'true');
  });

  await expect(repaired).not.toHaveAttribute('aria-label', /.+/);
  await expect(repaired).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(repaired).not.toHaveAttribute('aria-pressed', /.+/);
  await expect(repaired).not.toHaveAttribute('aria-valuenow', /.+/);
  await expect(repaired).not.toHaveAttribute('tabindex', /.+/);
  await expect(repaired).not.toHaveAttribute('contenteditable', /.+/);
  await expect(repaired).not.toHaveAttribute('draggable', /.+/);
  await expect(repaired).toHaveAttribute('inert', '');

  for (const attribute of ['aria-label', 'aria-pressed']) {
    const node = review.locator(`[data-cherry-injected-aria-spoof="${attribute}"]`);
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

  expect(await page.evaluate(() => window.__cherryAriaSpoofClicks)).toBe(0);
  expect(await page.evaluate(() => location.hash)).toBe(hashBefore);

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });

  let reachedResume = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => ({
      isInjected: Boolean(document.activeElement?.matches?.('[data-cherry-injected-aria-spoof]')),
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
