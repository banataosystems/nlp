import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const register = fs.readFileSync('docs/worldstage/PHASE2_OWNER_SECURITY_DECISION_REGISTER_2026-08-10.md', 'utf8');

const minimumLiveStagingDecisions = ['D1','D2','D3','D5','D6','D7','D8','D9','D10','D15','D16','D17','D18'];

for (const id of minimumLiveStagingDecisions) {
  test(`${id} remains explicitly represented before live staging`, () => {
    expect(register).toContain(`## ${id} —`);
  });
}

test('live staging creation remains blocked while minimum decisions are unresolved', () => {
  expect(register).toContain('LIVE STAGING CREATION = BLOCKED');
  for (const id of minimumLiveStagingDecisions) expect(register).toContain(id);
});

test('decision register does not self-approve business or security policy', () => {
  expect(register).toContain('All decision entries remain OPEN unless separately evidenced and recorded');
  expect(register).toContain('does not itself approve any business/security policy or authorize infrastructure creation');
});

test('retention durations are not invented', () => {
  expect(register).toContain('No durations are proposed automatically');
  expect(register).toContain('retention/deletion');
});

test('anonymous intake remains default denied', () => {
  expect(register).toContain('anonymous public intake');
  expect(register).toContain('Default denied');
});

test('first production scope remains bounded and non-autonomous', () => {
  expect(register).toContain('no automatic messaging');
  expect(register).toContain('no semantic memory');
  expect(register).toContain('no autonomous AI decisions');
});

test('production release remains separately authorized', () => {
  expect(register).toContain('separate from staging PASS');
  expect(register).toContain('exact source SHA');
  expect(register).toContain('rollback candidate');
});

test('Pandora Memory state is not falsely claimed synchronized', () => {
  expect(register).toContain('does not prove canonical Memory synchronization');
  expect(register).toContain('SYNC / EXCEPTION / OPEN');
});
