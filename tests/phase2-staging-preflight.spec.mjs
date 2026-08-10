import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const gatePath = path.join(root, 'config/worldstage/phase2-staging-gate.json');
const scriptPath = path.join(root, 'scripts/worldstage-staging-preflight.mjs');
const reportPath = path.join(root, 'artifacts/staging-readiness/worldstage-phase2-staging-readiness.json');
const minimum = ['D1','D2','D3','D5','D6','D7','D8','D9','D10','D15','D16','D17','D18'];

test('machine-readable staging gate represents every minimum owner/security decision', () => {
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));
  expect(gate.lifecycle_gate).toBe('live_staging_creation');
  expect(gate.minimum_decisions).toEqual(minimum);
  expect(gate.fail_closed_defaults.live_staging_creation).toBe('blocked');
  expect(gate.fail_closed_defaults.confidential_intake).toBe('disabled');
  expect(gate.fail_closed_defaults.production_release).toBe('blocked');
});

test('preflight is report-only by default and generates a blocked readiness artifact', () => {
  fs.rmSync(path.dirname(reportPath), { recursive: true, force: true });
  const run = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      WORLDSTAGE_INTAKE_ENABLED: 'false',
      WORLDSTAGE_SOURCE_SHA: 'synthetic-ci-sha'
    }
  });
  expect(run.status).toBe(0);
  expect(fs.existsSync(reportPath)).toBe(true);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  expect(report.readiness).toBe('BLOCKED');
  expect(report.source_sha).toBe('synthetic-ci-sha');
  expect(report.blockers.some(({ code }) => code === 'OWNER_SECURITY_DECISIONS_OPEN')).toBe(true);
});

test('--require-ready fails closed while owner/security decisions remain open', () => {
  const run = spawnSync(process.execPath, [scriptPath, '--require-ready'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      WORLDSTAGE_INTAKE_ENABLED: 'false',
      WORLDSTAGE_SOURCE_SHA: 'synthetic-ci-sha'
    }
  });
  expect(run.status).toBe(2);
  expect(run.stdout).toContain('BLOCKED');
  expect(run.stdout).toContain('OWNER_SECURITY_DECISIONS_OPEN');
});

test('preflight rejects accidental confidential-intake enablement', () => {
  const run = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      WORLDSTAGE_INTAKE_ENABLED: 'true',
      WORLDSTAGE_SOURCE_SHA: 'synthetic-ci-sha'
    }
  });
  expect(run.status).toBe(0);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  expect(report.blockers.some(({ code }) => code === 'CONFIDENTIAL_INTAKE_MUST_REMAIN_DISABLED')).toBe(true);
});

test('preflight detects staging/production project identity collision', () => {
  spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      WORLDSTAGE_ENV: 'staging',
      WORLDSTAGE_INTAKE_ENABLED: 'false',
      WORLDSTAGE_STAGING_PROJECT_ID: 'same-project',
      WORLDSTAGE_PRODUCTION_PROJECT_ID: 'same-project',
      WORLDSTAGE_SOURCE_SHA: 'synthetic-ci-sha'
    }
  });
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  expect(report.blockers.some(({ code }) => code === 'STAGING_PRODUCTION_PROJECT_COLLISION')).toBe(true);
});

test('preflight records a content hash for the authoritative decision ledger', () => {
  spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, WORLDSTAGE_INTAKE_ENABLED: 'false', WORLDSTAGE_SOURCE_SHA: 'synthetic-ci-sha' }
  });
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  expect(report.ledger.path).toBe('docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md');
  expect(report.ledger.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(report.ledger.minimum_decisions.map(({ id }) => id)).toEqual(minimum);
});
