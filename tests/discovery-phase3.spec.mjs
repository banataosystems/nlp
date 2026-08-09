import { test, expect } from '@playwright/test';

const answers = [
  'Our leadership team is growing quickly and alignment is starting to break down.',
  'People are escalating decisions upward and cross-team feedback is getting slower.',
  'Leaders resolve difficult issues directly and teams make decisions with more confidence.',
  'Senior managers and the department heads who work across functions.',
  'We need the conversation to feel developmental, not corrective, and timing is flexible.',
];

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function acknowledgePrototype(page) {
  const gate = page.locator('[data-prototype-safety-gate]');
  await expect(gate).toBeVisible();
  await gate.getByRole('button', { name: /continue with non-confidential Discovery/i }).click();
  await expect(gate).toHaveCount(0);
}

async function completeConceptDiscovery(page) {
  await page.goto('http://127.0.0.1:4173/#/discovery');
  await acknowledgePrototype(page);
  for (const answer of answers) {
    const input = page.locator('[data-discovery-input]');
    await expect(input).toBeVisible();
    await input.fill(answer);
    await page.locator('[data-discovery-form]').evaluate((form) => form.requestSubmit());
  }
  await expect(page.locator('[data-phase3-context]')).toBeVisible();
}

test('Phase 3 practical context appears only after What We Heard is complete', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/#/discovery');
  await expect(page.locator('[data-phase3-context]')).toHaveCount(0);
  await completeConceptDiscovery(page);
  await expect(page.locator('[data-phase3-context]')).toBeVisible();
});

test('required practical context gates handoff and saves locally', async ({ page }) => {
  await completeConceptDiscovery(page);
  const handoff = page.locator('[data-phase3-handoff]');
  await expect(handoff).toBeDisabled();

  await page.locator('[name="organization"]').fill('Example Organization');
  await page.locator('[name="contactName"]').fill('Ana Reyes');
  await page.locator('[name="email"]').fill('ana@example.org');
  await page.locator('[name="experience"]').selectOption('leadership');
  await page.locator('[name="timing"]').fill('October 2026');
  await page.locator('[name="consent"]').check();
  await expect(handoff).toBeEnabled();
  await expect(page.locator('[data-phase3-status]')).toContainText('Draft saved locally');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('worldstage.discovery.context.v2')));
  expect(stored.organization).toBe('Example Organization');
  expect(stored.contactName).toBe('Ana Reyes');
  expect(stored.email).toBe('ana@example.org');
  expect(stored.consent).toBe(true);
});

test('draft survives route re-render and returns when Discovery is completed again', async ({ page }) => {
  await completeConceptDiscovery(page);
  await page.locator('[name="organization"]').fill('Persistent Organization');
  await page.locator('[name="contactName"]').fill('Mara Santos');
  await page.locator('[name="email"]').fill('mara@example.org');
  await page.locator('[name="consent"]').check();
  await page.locator('[data-nav="home"]').first().click();
  await expect(page.locator('.stage-home')).toBeVisible();

  // App's concept discovery state remains complete in-session, so returning restores Phase 3 immediately.
  await page.evaluate(() => { location.hash = '/discovery'; });
  await expect(page.locator('[data-phase3-context]')).toBeVisible();
  await expect(page.locator('[name="organization"]')).toHaveValue('Persistent Organization');
  await expect(page.locator('[name="contactName"]')).toHaveValue('Mara Santos');
});
