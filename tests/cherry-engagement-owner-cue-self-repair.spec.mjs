import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const FLOW_KEY = 'worldstage.synthetic.engagement.flow.v1';
const COMPLETION_TEXT = 'Completed local-demo state is preserved until Start a new synthetic engagement is deliberately tapped.';

async function setFlow(page, value) {
  await page.evaluate(({ key, next }) => {
    localStorage.setItem(key, JSON.stringify(next));
  }, { key: FLOW_KEY, next: value });
  await page.reload();
}

test('owner attention and completion cues self-repair from sanitized local synthetic flow only', async ({ page }) => {
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
    attention: 'needs-cherry',
    complete: true,
    releaseAuthority: 'production-approved',
  });

  let strip = page.locator('[data-cherry-engagement-continuity]');
  let cue = strip.locator('[data-cherry-engagement-continuity-attention-cue]');
  const beforeDiscovery = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);

  await strip.evaluate((node) => {
    node.setAttribute('data-cherry-engagement-continuity-attention', 'needs-cherry');
    node.setAttribute('data-cherry-engagement-continuity-complete', 'true');
    const cueNode = node.querySelector('[data-cherry-engagement-continuity-attention-cue]');
    cueNode?.setAttribute('data-cherry-engagement-continuity-attention-cue', 'needs-cherry');
    cueNode?.setAttribute('aria-label', 'Production approval');
    const label = cueNode?.querySelector('strong');
    if (label) label.textContent = 'Release production now';
    const reason = cueNode?.querySelector('[data-cherry-engagement-continuity-attention-reason]');
    if (reason) reason.textContent = 'Cherry approved production release';
  });

  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'prepared-flow');
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  cue = strip.locator('[data-cherry-engagement-continuity-attention-cue]');
  await expect(cue).toHaveAttribute('data-cherry-engagement-continuity-attention-cue', 'prepared-flow');
  await expect(cue).toHaveAttribute('aria-label', 'Fixed synthetic owner attention cue');
  await expect(cue.locator('strong')).toHaveText('Continue prepared flow');
  await expect(cue.locator('[data-cherry-engagement-continuity-attention-reason]'))
    .toHaveText('Current stage can continue through prepared synthetic flow');
  await expect(strip.locator('[data-cherry-engagement-continuity-completion]')).toHaveCount(0);
  await expect(strip).not.toContainText('Release production now');
  await expect(strip).not.toContainText('Cherry approved production release');

  await strip.locator('[data-cherry-engagement-continuity-handoff]').evaluate((handoff) => {
    const injected = document.createElement('p');
    injected.setAttribute('data-cherry-engagement-continuity-completion', '');
    injected.textContent = 'Production complete';
    handoff.appendChild(injected);
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'prepared-flow');
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-continuity-completion]')).toHaveCount(0);
  await expect(strip).not.toContainText('Production complete');
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(beforeDiscovery);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: true,
    attention: 'prepared-flow',
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  cue = strip.locator('[data-cherry-engagement-continuity-attention-cue]');
  const reviewState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'review');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'needs-cherry');

  await strip.evaluate((node) => {
    node.setAttribute('data-cherry-engagement-continuity-attention', 'prepared-flow');
    const cueNode = node.querySelector('[data-cherry-engagement-continuity-attention-cue]');
    cueNode?.setAttribute('data-cherry-engagement-continuity-attention-cue', 'prepared-flow');
    const label = cueNode?.querySelector('strong');
    if (label) label.textContent = 'Continue prepared flow';
    const reason = cueNode?.querySelector('[data-cherry-engagement-continuity-attention-reason]');
    reason?.removeAttribute('data-cherry-engagement-continuity-attention-reason');
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  cue = strip.locator('[data-cherry-engagement-continuity-attention-cue]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'needs-cherry');
  await expect(cue).toHaveAttribute('data-cherry-engagement-continuity-attention-cue', 'needs-cherry');
  await expect(cue.locator('strong')).toHaveText('Needs Cherry now');
  await expect(cue.locator('[data-cherry-engagement-continuity-attention-reason]'))
    .toHaveText('Current stage requires Cherry review');
  await expect(strip).not.toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-continuity-completion]')).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(reviewState);

  await setFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: true,
    recordPrepared: true,
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  const completedState = await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY);
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-stage', 'record');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'prepared-flow');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-continuity-completion]')).toHaveText(COMPLETION_TEXT);

  await strip.evaluate((node) => {
    node.removeAttribute('data-cherry-engagement-continuity-complete');
    node.setAttribute('data-cherry-engagement-continuity-attention', 'needs-cherry');
    node.querySelector('[data-cherry-engagement-continuity-completion]')?.remove();
  });

  strip = page.locator('[data-cherry-engagement-continuity]');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-attention', 'prepared-flow');
  await expect(strip).toHaveAttribute('data-cherry-engagement-continuity-complete', 'true');
  await expect(strip.locator('[data-cherry-engagement-continuity-completion]')).toHaveText(COMPLETION_TEXT);
  await expect(strip.locator('[data-cherry-engagement-continuity-start-new]')).toHaveCount(1);
  await expect(strip.locator('[data-cherry-engagement-owner-action] button')).toHaveCount(1);
  await expect(strip.locator('[data-cherry-engagement-continuity-resume]')).toHaveCount(1);
  expect(await page.evaluate((key) => localStorage.getItem(key), FLOW_KEY)).toBe(completedState);
  await expect(page).toHaveURL(/#\/cockpit$/);

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});
