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

async function expectTrustedSemantics(page) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const stages = strip.locator('.cherry-engagement-continuity__steps > article');

  await expect(strip).toHaveAttribute('role', 'list');
  await expect(strip).toHaveAttribute('aria-label', 'Synthetic engagement stages');
  await expect(strip).toHaveAttribute('aria-describedby', 'cherry-engagement-step-boundary-description');
  await expect(strip.locator('[data-cherry-engagement-step-boundary]')).toHaveText(
    'Synthetic demo stages only. Not a verified real-client engagement status.',
  );

  await expect(stages).toHaveCount(3);
  await expect(stages.nth(0)).toHaveAttribute('data-cherry-engagement-continuity-step', 'discovery');
  await expect(stages.nth(0)).toHaveAttribute('role', 'listitem');
  await expect(stages.nth(0)).toHaveAttribute('aria-label', 'Discovery. Completed synthetic step.');
  await expect(stages.nth(0)).toHaveAttribute('aria-posinset', '1');
  await expect(stages.nth(0)).toHaveAttribute('aria-setsize', '3');
  await expect(stages.nth(0)).not.toHaveAttribute('aria-current', /.+/);

  await expect(stages.nth(1)).toHaveAttribute('data-cherry-engagement-continuity-step', 'review');
  await expect(stages.nth(1)).toHaveAttribute('role', 'listitem');
  await expect(stages.nth(1)).toHaveAttribute('aria-label', 'Cherry review. Current synthetic step.');
  await expect(stages.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(stages.nth(1)).toHaveAttribute('aria-posinset', '2');
  await expect(stages.nth(1)).toHaveAttribute('aria-setsize', '3');

  await expect(stages.nth(2)).toHaveAttribute('data-cherry-engagement-continuity-step', 'record');
  await expect(stages.nth(2)).toHaveAttribute('role', 'listitem');
  await expect(stages.nth(2)).toHaveAttribute('aria-label', 'Transformation Record. Upcoming synthetic step.');
  await expect(stages.nth(2)).toHaveAttribute('aria-posinset', '3');
  await expect(stages.nth(2)).toHaveAttribute('aria-setsize', '3');
  await expect(stages.nth(2)).not.toHaveAttribute('aria-current', /.+/);
}

async function expectFailClosedSemantics(page) {
  const strip = page.locator('[data-cherry-engagement-continuity]');
  const stages = strip.locator('.cherry-engagement-continuity__steps > article');

  await expect(strip).not.toHaveAttribute('role', /.+/);
  await expect(strip).not.toHaveAttribute('aria-label', /.+/);
  await expect(strip).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-step-list', /.+/);
  await expect(strip.locator('[data-cherry-engagement-step-boundary]')).toHaveCount(0);

  const count = await stages.count();
  for (let index = 0; index < count; index += 1) {
    const stage = stages.nth(index);
    for (const attribute of [
      'role',
      'aria-label',
      'aria-current',
      'aria-posinset',
      'aria-setsize',
      'data-cherry-engagement-step-orientation',
      'tabindex',
      'contenteditable',
      'draggable',
      'inert',
    ]) {
      await expect(stage).not.toHaveAttribute(attribute, /.+/);
    }
  }
}

test('canonical step identity, duplication, removal and ordering mutations fail closed until exact sequence returns', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await openCherryReview(page);
  await expectTrustedSemantics(page);

  const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
  const hashBefore = await page.evaluate(() => location.hash);
  const resume = page.locator('[data-cherry-engagement-owner-action] [data-cherry-engagement-continuity-resume]');

  await page.evaluate(() => {
    const stages = document.querySelectorAll('.cherry-engagement-continuity__steps > article');
    stages[1]?.setAttribute('data-cherry-engagement-continuity-step', 'production');
  });
  await expectFailClosedSemantics(page);

  await page.evaluate(() => {
    const stages = document.querySelectorAll('.cherry-engagement-continuity__steps > article');
    stages[1]?.setAttribute('data-cherry-engagement-continuity-step', 'review');
  });
  await expectTrustedSemantics(page);

  await page.evaluate(() => {
    const stages = document.querySelectorAll('.cherry-engagement-continuity__steps > article');
    stages[1]?.removeAttribute('data-cherry-engagement-continuity-step');
  });
  await expectFailClosedSemantics(page);

  await page.evaluate(() => {
    const stages = document.querySelectorAll('.cherry-engagement-continuity__steps > article');
    stages[1]?.setAttribute('data-cherry-engagement-continuity-step', 'review');
  });
  await expectTrustedSemantics(page);

  await page.evaluate(() => {
    const container = document.querySelector('.cherry-engagement-continuity__steps');
    const discovery = container?.querySelector('article[data-cherry-engagement-continuity-step="discovery"]');
    if (!(container instanceof HTMLElement) || !(discovery instanceof HTMLElement)) return;
    const duplicate = discovery.cloneNode(true);
    if (!(duplicate instanceof HTMLElement)) return;
    duplicate.dataset.cherryTestDuplicate = 'true';
    container.appendChild(duplicate);
  });
  await expectFailClosedSemantics(page);

  await page.evaluate(() => {
    document.querySelector('[data-cherry-test-duplicate="true"]')?.remove();
  });
  await expectTrustedSemantics(page);

  await page.evaluate(() => {
    const container = document.querySelector('.cherry-engagement-continuity__steps');
    if (!(container instanceof HTMLElement)) return;
    const discovery = container.querySelector('article[data-cherry-engagement-continuity-step="discovery"]');
    const record = container.querySelector('article[data-cherry-engagement-continuity-step="record"]');
    if (!(discovery instanceof HTMLElement) || !(record instanceof HTMLElement)) return;
    container.insertBefore(record, discovery);
  });
  await expectFailClosedSemantics(page);

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
    discovery.setAttribute('data-cherry-engagement-continuity-step', 'discovery');
    review.setAttribute('data-cherry-engagement-continuity-step', 'review');
    record.setAttribute('data-cherry-engagement-continuity-step', 'record');
    container.append(discovery, review, record);
  });
  await expectTrustedSemantics(page);

  await expect(resume).toHaveCount(1);
  await expect(resume).toBeEnabled();
  await expect(resume).not.toHaveAttribute('inert', /.+/);
  expect(await resume.evaluate((button) => button.tabIndex)).toBe(0);

  expect(await page.evaluate(() => location.hash)).toBe(hashBefore);
  expect(await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'))).toBe(storedBefore);
  expect(networkWrites).toEqual([]);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
});
