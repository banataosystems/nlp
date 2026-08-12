import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { validateLedger } from './worldstage-decision-evidence-check.mjs';

const root = process.cwd();
const ledgerPath = path.join(root, 'docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md');
const gatePath = path.join(root, 'config/worldstage/phase2-staging-gate.json');
const outDir = path.join(root, 'artifacts/staging-readiness');
const outPath = path.join(outDir, 'worldstage-phase2-staging-readiness.json');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function existingPaths(candidates) { return candidates.filter((rel) => fs.existsSync(path.join(root, rel))); }
function phase2ImplementationState() {
  const inertShellPaths = existingPaths([
    'api/v1/intakes.js','server/intake-contract.cjs','server/intake-persistence.cjs','server/synthetic-identity.cjs','server/synthetic-authorization.cjs','server/staging-adapter-contract.cjs',
  ]);
  const boundPersistencePaths = existingPaths([
    'supabase/migrations','migrations','server/supabase-intake-adapter.cjs','server/postgres-intake-adapter.cjs','server/production-intake-adapter.cjs',
  ]);
  return { inertShellPaths, boundPersistencePaths };
}
function envFact(name, value) { return { name, value: value ?? null, present: value != null && value !== '' }; }

const gate = readJson(gatePath);
const ledgerText = fs.readFileSync(ledgerPath, 'utf8');
const ledgerValidation = validateLedger(ledgerText);
const decisions = ledgerValidation.rows;
const minimum = gate.minimum_decisions.map((id) => ({ id, status: decisions.get(id) || 'MISSING' }));
const unresolved = minimum.filter(({ status }) => status !== 'RESOLVED').map(({ id, status }) => ({ id, status }));
const implementation = phase2ImplementationState();
const environment = {
  WORLDSTAGE_ENV: envFact('WORLDSTAGE_ENV', process.env.WORLDSTAGE_ENV),
  WORLDSTAGE_INTAKE_ENABLED: envFact('WORLDSTAGE_INTAKE_ENABLED', process.env.WORLDSTAGE_INTAKE_ENABLED),
  WORLDSTAGE_SECURE_INTAKE_ENABLED: envFact('WORLDSTAGE_SECURE_INTAKE_ENABLED', process.env.WORLDSTAGE_SECURE_INTAKE_ENABLED),
  WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: envFact('WORLDSTAGE_SECURE_INTAKE_PERSISTENCE', process.env.WORLDSTAGE_SECURE_INTAKE_PERSISTENCE),
  WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND: envFact('WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND', process.env.WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND),
  WORLDSTAGE_STAGING_PROJECT_ID: envFact('WORLDSTAGE_STAGING_PROJECT_ID', process.env.WORLDSTAGE_STAGING_PROJECT_ID),
  WORLDSTAGE_PRODUCTION_PROJECT_ID: envFact('WORLDSTAGE_PRODUCTION_PROJECT_ID', process.env.WORLDSTAGE_PRODUCTION_PROJECT_ID),
  WORLDSTAGE_SOURCE_SHA: envFact('WORLDSTAGE_SOURCE_SHA', process.env.WORLDSTAGE_SOURCE_SHA || process.env.GITHUB_SHA)
};
const legacyIntakeEnabled = String(process.env.WORLDSTAGE_INTAKE_ENABLED || '').toLowerCase() === 'true';
const runtimeIntakeEnabled = String(process.env.WORLDSTAGE_SECURE_INTAKE_ENABLED || '').toLowerCase() === 'true';
const runtimePersistenceSelected = String(process.env.WORLDSTAGE_SECURE_INTAKE_PERSISTENCE || '').toLowerCase() === 'staging';
const runtimeAdapterBound = String(process.env.WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND || '').toLowerCase() === 'true';
const environmentClaimsStaging = process.env.WORLDSTAGE_ENV === 'staging';
const stagingId = process.env.WORLDSTAGE_STAGING_PROJECT_ID || '';
const productionId = process.env.WORLDSTAGE_PRODUCTION_PROJECT_ID || '';
const projectCollision = Boolean(stagingId && productionId && stagingId === productionId);
const blockers = [];
if (ledgerValidation.errors.length) blockers.push({ code: 'OWNER_SECURITY_DECISION_EVIDENCE_INVALID', details: ledgerValidation.errors });
if (unresolved.length) blockers.push({ code: 'OWNER_SECURITY_DECISIONS_OPEN', details: unresolved });
if (legacyIntakeEnabled || runtimeIntakeEnabled) blockers.push({ code: 'CONFIDENTIAL_INTAKE_MUST_REMAIN_DISABLED' });
if (runtimePersistenceSelected || runtimeAdapterBound || implementation.boundPersistencePaths.length) blockers.push({ code: 'BOUND_PHASE2_PERSISTENCE_PRESENT_BEFORE_GATE', details: { persistence_selected: runtimePersistenceSelected, adapter_bound: runtimeAdapterBound, paths: implementation.boundPersistencePaths } });
if (projectCollision) blockers.push({ code: 'STAGING_PRODUCTION_PROJECT_COLLISION' });
const readiness = blockers.length === 0 && environmentClaimsStaging && stagingId && productionId ? 'READY_FOR_ISOLATED_STAGING_EXECUTION' : 'BLOCKED';
const report = {
  schema_version: 3,
  generated_at: new Date().toISOString(), project_key: gate.project_key, lifecycle_gate: gate.lifecycle_gate, readiness,
  authoritative_issue: gate.authoritative_issue, source_sha: environment.WORLDSTAGE_SOURCE_SHA.value,
  ledger: { path: path.relative(root, ledgerPath), sha256: sha256(ledgerText), minimum_decisions: minimum, validation_errors: ledgerValidation.errors },
  fail_closed_defaults: gate.fail_closed_defaults, environment,
  inert_phase2_shell_paths: implementation.inertShellPaths, bound_phase2_persistence_paths: implementation.boundPersistencePaths, blockers
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`[worldstage-staging-preflight] ${readiness}`);
console.log(`[worldstage-staging-preflight] report=${path.relative(root, outPath)}`);
for (const blocker of blockers) console.log(`[blocker] ${blocker.code}`);
if (process.argv.includes('--require-ready') && readiness !== 'READY_FOR_ISOLATED_STAGING_EXECUTION') process.exitCode = 2;
