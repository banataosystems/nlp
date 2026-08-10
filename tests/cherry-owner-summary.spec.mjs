import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('Cherry owner summary consolidates phase, next action, fixed rationale, owner handoff, judgment counts, follow-up and privacy boundary', async ({ page }) => {
  const networkWrites = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      networkWrites.push({ method: request.method(), url: request.url() });
    }
  });

  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.removeItem('worldstage.synthetic.engagement.flow.v1');
    localStorage.removeItem('worldstage.cherry.daily.demo.v1');
    localStorage.removeItem('worldstage.cherry.daily.rationale.demo.v1');
    localStorage.removeItem('worldstage.synthetic.sustainment.plan.v1');
  });
  await page.reload();

  const summary = page.locator('[data-cherry-owner-summary]');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('CHERRY OWNER SUMMARY');
  await expect(page.locator('[data-owner-summary-phase]')).toHaveText('Discovery');
  await expect(page.locator('[data-owner-summary-next]')).toHaveText('Prepare synthetic Discovery brief');
  await expect(page.locator('[data-owner-summary-rationale]')).toHaveText('Why surfaced: Needs context · fixed rationale for demo item 01.');
  await expect(page.locator('[data-owner-summary-daily="needs"]')).toHaveText('3');
  await expect(summary).toContainText('7 days');
  await expect(summary).toContainText('Locked');
  await expect(page.locator('[data-owner-summary-boundary]')).toContainText('Local synthetic demo only');
  await expect(page.locator('[data-owner-summary-boundary]')).toContainText('No real client data');

  const item01 = page.locator('[data-cherry-decision-state="01"]');
  await item01.locator('[data-cherry-rationale-set="ready"]').click();
  await expect(page.locator('[data-owner-summary-rationale]')).toHaveText('Why surfaced: Ready · fixed rationale for demo item 01.');

  const handoff = page.locator('[data-owner-summary-brief]');
  await expect(handoff).toBeVisible();
  await expect(handoff).toContainText('OWNER HANDOFF · 60-SECOND BRIEF');
  await expect(page.locator('[data-owner-summary-brief-title]')).toHaveText('Open the synthetic Discovery brief');
  await expect(page.locator('[data-owner-summary-brief-decision]')).toContainText('ready to enter Cherry’s judgment queue');
  await expect(page.locator('[data-owner-summary-brief-rationale]')).toContainText('Why surfaced: Ready');
  await expect(page.locator('[data-owner-summary-brief-boundary]')).toContainText('No Discovery form text');

  const openBrief = page.locator('[data-owner-summary-open-brief]');
  await openBrief.click();
  const briefing = page.locator('[data-owner-summary-handoff]');
  await expect(briefing).toBeVisible();
  await expect(briefing).toContainText('OWNER HANDOFF · LOCAL SYNTHETIC DEMO');
  await expect(page.locator('[data-owner-summary-handoff-context]')).toContainText('has not entered Discovery yet');
  await expect(page.locator('[data-owner-summary-handoff-decision]')).toContainText('ready to enter Cherry’s judgment queue');
  await expect(page.locator('[data-owner-summary-handoff-rationale]')).toHaveText('Ready · fixed rationale for demo item 01.');
  await expect(page.locator('[data-owner-summary-handoff-defer]')).toContainText('no external system changes');
  await expect(page.locator('[data-owner-summary-handoff-boundary]')).toContainText('No Discovery form text');
  await expect(page.locator('[data-owner-summary-handoff-close]')).toBeFocused();
  await expect(page.locator('body')).toHaveClass(/cherry-owner-handoff-open/);

  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw + 1);
  expect(networkWrites).toEqual([]);

  await page.locator('[data-owner-summary-handoff-close]').click();
  await expect(page.locator('[data-owner-summary-handoff]')).toHaveCount(0);
  await expect(openBrief).toBeFocused();

  await openBrief.click();
  await page.locator('[data-owner-summary-handoff-next="discovery"]').click();
  await expect(page).toHaveURL(/#\/discovery$/);
  expect(networkWrites).toEqual([]);
});

test('Cherry owner summary and handoff read only sanitized sequential local demo state and allowlisted rationale', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/cockpit');
  await page.evaluate(() => {
    localStorage.setItem('worldstage.synthetic.engagement.flow.v1', JSON.stringify({
      version: 1,
      discoveryPrepared: true,
      ownerReviewed: true,
      recordPrepared: true,
      injectedClientText: 'must not appear',
    }));
    localStorage.setItem('worldstage.cherry.daily.demo.v1', JSON.stringify({
      '01': 'prepared',
      '02': 'parked',
      '03': 'needs-cherry',
      clientName: 'must not appear',
    }));
    localStorage.setItem('worldstage.cherry.daily.rationale.demo.v1', JSON.stringify({
      '01': 'can-wait',
      '02': 'ready',
      '03': 'not-allowlisted',
      privateReason: 'must not appear',
      approvalAuthority: 'must not appear',
    }));
    localStorage.setItem('worldstage.synthetic.sustainment.plan.v1', JSON.stringify({
      version: 1,
      day7Prepared: true,
      day30Prepared: false,
      day90Prepared: true,
      privateNote: 'must not appear',
    }));
  });
  await page.reload();

  const summary = page.locator('[data-cherry-owner-summary]');
  await expect(summary).toBeVisible();
  await expect(page.locator('[data-owner-summary-phase]')).toHaveText('Sustainment');
  await expect(page.locator('[data-owner-summary-next]')).toHaveText('Prepare 30-day review');
  await expect(page.locator('[data-owner-summary-rationale]')).toHaveText('Why surfaced: Can wait · fixed rationale for demo item 01.');
  await expect(page.locator('[data-owner-summary-daily="needs"]')).toHaveText('1');
  await expect(page.locator('[data-owner-summary-daily="prepared"]')).toHaveText('1');
  await expect(page.locator('[data-owner-summary-daily="parked"]')).toHaveText('1');

  const checkpoints = summary.locator('.cherry-owner-summary__checkpoint');
  await expect(checkpoints.nth(0)).toContainText('Prepared');
  await expect(checkpoints.nth(1)).toContainText('Next');
  await expect(checkpoints.nth(2)).toContainText('Locked');

  const handoff = page.locator('[data-owner-summary-brief]');
  await expect(page.locator('[data-owner-summary-brief-title]')).toHaveText('Review the 30-day pattern');
  await expect(page.locator('[data-owner-summary-brief-context]')).toContainText('7-day checkpoint is prepared locally');
  await expect(page.locator('[data-owner-summary-brief-rationale]')).toContainText('Why surfaced: Can wait');
  await expect(page.locator('[data-owner-summary-brief-boundary]')).toContainText('not a measured outcome');
  await expect(handoff).not.toContainText('must not appear');
  await expect(summary).not.toContainText('must not appear');
  await expect(summary).not.toContainText('not-allowlisted');

  const openBrief = page.locator('[data-owner-summary-open-brief]');
  await openBrief.click();
  const briefing = page.locator('[data-owner-summary-handoff]');
  await expect(briefing).toBeVisible();
  await expect(page.locator('[data-owner-summary-handoff-context]')).toContainText('7-day checkpoint is prepared locally');
  await expect(page.locator('[data-owner-summary-handoff-decision]')).toContainText('operating rhythm should continue unchanged or be revisited');
  await expect(page.locator('[data-owner-summary-handoff-rationale]')).toHaveText('Can wait · fixed rationale for demo item 01.');
  await expect(page.locator('[data-owner-summary-handoff-defer]')).toContainText('90-day review stays locked');
  await expect(page.locator('[data-owner-summary-handoff-boundary]')).toContainText('not a measured outcome');
  await expect(briefing).not.toContainText('must not appear');
  await expect(briefing).not.toContainText('not-allowlisted');

  await page.keyboard.press('Escape');
  await expect(briefing).toHaveCount(0);
  await expect(openBrief).toBeFocused();

  await page.locator('[data-owner-summary-nav="client"]').click();
  await expect(page).toHaveURL(/#\/client$/);
});