import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function openCockpitWithFlow(page, value) {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate((next) => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify(next));
  }, value);
  await page.reload();
}

test('Resume consequence is fixed by allowlisted route, announced by the Resume control, and remains read-only before navigation', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  const cases = [
    {
      flow: { version: 1, discoveryPrepared: false, ownerReviewed: false, recordPrepared: false },
      route: 'discovery',
      text: 'Resume only opens the existing synthetic Discovery step. It does not submit, send, approve, persist, or release anything.',
    },
    {
      flow: { version: 1, discoveryPrepared: true, ownerReviewed: false, recordPrepared: false },
      route: 'cockpit',
      text: 'Resume only focuses the existing synthetic Cherry review step. It does not submit, send, approve, persist, or release anything.',
    },
    {
      flow: { version: 1, discoveryPrepared: true, ownerReviewed: true, recordPrepared: false },
      route: 'client',
      text: 'Resume only opens the existing synthetic Transformation Record step. It does not submit, send, approve, persist, or release anything.',
    },
  ];

  for (const scenario of cases) {
    await openCockpitWithFlow(page, scenario.flow);
    const card = page.locator('[data-cherry-engagement-owner-action]');
    const resume = card.locator(`[data-cherry-engagement-continuity-resume="${scenario.route}"]`);
    const consequence = card.locator(`[data-cherry-engagement-resume-consequence="${scenario.route}"]`);

    await expect(card).toBeVisible();
    await expect(resume).toHaveCount(1);
    await expect(consequence).toHaveText(scenario.text);
    await expect(consequence).toHaveAttribute('id', 'cherry-engagement-resume-consequence');
    await expect(consequence).toHaveAttribute('aria-label', 'Resume consequence, read only');
    await expect(resume).toHaveAttribute('aria-describedby', 'cherry-engagement-resume-consequence');
    await expect(card.locator('button')).toHaveCount(1);

    const storedBefore = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
    await page.waitForTimeout(50);
    const storedAfter = await page.evaluate(() => localStorage.getItem('worldstage.synthetic.engagement.flow.v1'));
    expect(storedAfter).toBe(storedBefore);
    expect(networkWrites).toEqual([]);
  }

  const sizes = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);
});

test('Resume consequence fails closed on an unexpected route and cannot become authority text', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) networkWrites.push(request.url());
  });

  await openCockpitWithFlow(page, {
    version: 1,
    discoveryPrepared: true,
    ownerReviewed: false,
    recordPrepared: false,
    resumeConsequence: 'Production release approved',
    releaseAuthority: 'yes',
    privateClientContext: 'must not appear',
  });

  const card = page.locator('[data-cherry-engagement-owner-action]');
  const resume = card.locator('[data-cherry-engagement-continuity-resume]');
  const consequence = card.locator('[data-cherry-engagement-resume-consequence]');

  await expect(consequence).toHaveText('Resume only focuses the existing synthetic Cherry review step. It does not submit, send, approve, persist, or release anything.');
  await expect(resume).toHaveAttribute('aria-describedby', 'cherry-engagement-resume-consequence');
  await expect(card).not.toContainText('Production release approved');
  await expect(card).not.toContainText('releaseAuthority');
  await expect(card).not.toContainText('must not appear');

  await resume.evaluate((button) => {
    button.dataset.cherryEngagementContinuityResume = 'production';
  });

  await expect(card.locator('[data-cherry-engagement-resume-consequence]')).toHaveCount(0);
  await expect(resume).toHaveAttribute('data-cherry-engagement-continuity-resume', 'production');
  await expect(resume).not.toHaveAttribute('aria-describedby', /.+/);
  expect(networkWrites).toEqual([]);
});
