import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const ledger = fs.readFileSync('docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md', 'utf8');

const minimum = ['D1','D2','D3','D5','D6','D7','D8','D9','D10','D15','D16','D17','D18'];

for (const id of minimum) {
  test(`${id} remains represented in live staging gate`, () => {
    expect(ledger).toContain(id);
  });
}

test('resolved decisions require complete evidence', () => {
  for (const field of [
    'Decision value',
    'Approved by',
    'Approval date',
    'Evidence/source',
    'Rationale',
    'Exceptions',
    'Implementation impact'
  ]) expect(ledger).toContain(field);
});

test('live staging remains blocked while required decisions are open', () => {
  expect(ledger).toContain('LIVE STAGING CREATION = BLOCKED');
  expect(ledger).toContain('All 24 decisions remain OPEN');
  expect(ledger).toContain('authorizes no infrastructure creation');
});

test('checkbox or public inference is not approval', () => {
  expect(ledger).toContain('Do not treat a GitHub checkbox as approval without the evidence-entry fields');
  expect(ledger).toContain('Do not convert `OPEN` to `RESOLVED` from a public website statement alone');
});

test('production authorization remains independent', () => {
  expect(ledger).toContain('STAGING PASS DOES NOT AUTHORIZE PRODUCTION');
  expect(ledger).toContain('Do not treat a successful CI run, preview deployment, or staging PASS as production authorization');
});

test('high-risk policy remains fail closed', () => {
  expect(ledger).toContain('Do not invent retention/deletion durations');
  expect(ledger).toContain('Do not infer sponsor access from organization membership');
  expect(ledger).toContain('Do not infer AI/analytics eligibility from general consent language');
  expect(ledger).toContain('Do not claim Pandora Memory synchronization without direct proof');
});
