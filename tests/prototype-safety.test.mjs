import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const safety = await readFile(new URL('../src/safety.js', import.meta.url), 'utf8');

test('loads the Discovery prototype safety guard after the application runtime', () => {
  const appIndex = index.indexOf('/src/app.js');
  const safetyIndex = index.indexOf('/src/safety.js');

  assert.ok(appIndex >= 0, 'app runtime must be loaded');
  assert.ok(safetyIndex > appIndex, 'safety guard must load after app runtime');
});

test('blocks Discovery interaction until the non-confidential boundary is acknowledged', () => {
  assert.match(safety, /data-prototype-safety-gate/);
  assert.match(safety, /setAttribute\('inert', ''\)/);
  assert.match(safety, /data-prototype-continue/);
  assert.match(safety, /sessionStorage\.setItem\(PROTOTYPE_ACK_KEY, 'acknowledged'\)/);
});

test('warns against sensitive data and keeps secure intake as a future gated workflow', () => {
  assert.match(safety, /Do not enter names, contact details, participant responses/);
  assert.match(safety, /payment information/);
  assert.match(safety, /health information/);
  assert.match(safety, /legal-privileged content/);
  assert.match(safety, /Secure WorldStage intake is a later gated workflow/);
});

test('does not introduce network submission or analytics behavior', () => {
  assert.doesNotMatch(safety, /\bfetch\s*\(/);
  assert.doesNotMatch(safety, /XMLHttpRequest/);
  assert.doesNotMatch(safety, /posthog|analytics|supabase/i);
});
