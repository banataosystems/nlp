import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { validateLedger } from '../scripts/worldstage-decision-evidence-check.mjs';

const canonical = fs.readFileSync('docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md', 'utf8');

test('current canonical ledger passes evidence enforcement while all decisions are OPEN', () => {
  const result = validateLedger(canonical);
  expect(result.rows.size).toBe(24);
  expect(result.errors).toEqual([]);
});

test('a row cannot be changed to RESOLVED without a complete evidence block', () => {
  const synthetic = canonical.replace('| D1 | Canonical workflow | OPEN |', '| D1 | Canonical workflow | RESOLVED |');
  const result = validateLedger(synthetic);
  expect(result.errors).toContain('D1: RESOLVED row has no evidence block');
});

test('placeholder approval evidence fails closed', () => {
  const synthetic = `${canonical.replace('| D1 | Canonical workflow | OPEN |', '| D1 | Canonical workflow | RESOLVED |')}\n\nDecision ID: D1\nStatus: RESOLVED\nDecision value: APPROVE\nApproved by: TBD\nApproval date: 2026-08-10\nEvidence/source: <link>\nRationale: —\nExceptions: NONE\nImplementation impact: enable staging workflow conversion\n`;
  const result = validateLedger(synthetic);
  expect(result.errors.some((value) => value.includes('Approved by'))).toBe(true);
  expect(result.errors.some((value) => value.includes('Evidence/source'))).toBe(true);
  expect(result.errors.some((value) => value.includes('Rationale'))).toBe(true);
});

test('complete non-placeholder evidence can support a RESOLVED row structurally', () => {
  const synthetic = `${canonical.replace('| D1 | Canonical workflow | OPEN |', '| D1 | Canonical workflow | RESOLVED |')}\n\nDecision ID: D1\nStatus: RESOLVED\nDecision value: APPROVE Secure Discovery Intake → Human Review → Transformation → Cherry Judgment Queue\nApproved by: Authorized Owner\nApproval date: 2026-08-10\nEvidence/source: owner-review-record-001\nRationale: Matches the approved first workflow.\nExceptions: NONE\nImplementation impact: Allows workflow-specific staging conversion after every other minimum gate is resolved.\n`;
  const result = validateLedger(synthetic);
  expect(result.errors).toEqual([]);
});
