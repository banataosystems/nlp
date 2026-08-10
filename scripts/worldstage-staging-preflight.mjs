import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const ledgerPath = path.join(root, 'docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md');
const gatePath = path.join(root, 'config/worldstage/phase2-staging-gate.json');
const outDir = path.join(root, 'artifacts/staging-readiness');
const outPath = path.join(outDir, 'worldstage-phase2-staging-readiness.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseDecisionRows(markdown) {
  const rows = new Map();
  for (const line of markdown.split('\n')) {
    const match = line.match(/^\|\s*(D\d+)\s*\|[^|]*\|\s*(OPEN|RESOLVED)\s*\|/);
    if (match) rows.set(match[1], match[2]);
  }
  return rows;
}

function hasRemotePhase2Implementation() {
  const candidates = [
    'api/v1/intakes.js',
    'api/v1/intakes.mjs',
    'api/v1/intakes.ts',
    'api/v1/intakes/index.js',
    'api/v1/intakes/index.ts',
    'supabase/migrations',
    'migrations'
  ];
  return candidates.filter((rel) => fs.existsSync(path.join(root, rel)));
}

function envFact(name, value) {
  return { name, value: value ?? null, present: value != null && value !== '' };
}

const gate = readJson(gatePath);
const ledgerText = fs.readFileSync(ledgerPath, 'utf8');
const decisions = parseDecisionRows(ledgerText);
const minimum = gate.minimum_decisions.map((id) => ({ id, status: decisions.get(id) || 'MISSING' }));
const unresolved = minimum.filter(({ status }) => status !== 'RESOLVED').map(({ id, status }) => ({ id, status }));
const unexpectedRemoteImplementation = hasRemotePhase2Implementation();

const environment = {
  WORLDSTAGE_ENV: envFact('WORLDSTAGE_ENV', process.env.WORLDSTAGE_ENV),
  WORLDSTAGE_INTAKE_ENABLED: envFact('WORLDSTAGE_INTAKE_ENABLED', process.env.WORLDSTAGE_INTAKE_ENABLED),
  WORLDSTAGE_STAGING_PROJECT_ID: envFact('WORLDSTAGE_STAGING_PROJECT_ID', process.env.WORLDSTAGE_STAGING_PROJECT_ID),
  WORLDSTAGE_PRODUCTION_PROJECT_ID: envFact('WORLDSTAGE_PRODUCTION_PROJECT_ID', process.env.WORLDSTAGE_PRODUCTION_PROJECT_ID),
  WORLDSTAGE_SOURCE_SHA: envFact('WORLDSTAGE_SOURCE_SHA', process.env.WORLDSTAGE_SOURCE_SHA || process.env.GITHUB_SHA)
};

const intakeEnabled = String(process.env.WORLDSTAGE_INTAKE_ENABLED || '').toLowerCase() === 'true';
const environmentClaimsStaging = process.env.WORLDSTAGE_ENV === 'staging';
const stagingId = process.env.WORLDSTAGE_STAGING_PROJECT_ID || '';
const productionId = process.env.WORLDSTAGE_PRODUCTION_PROJECT_ID || '';
const projectCollision = Boolean(stagingId && productionId && stagingId === productionId);

const blockers = [];
if (unresolved.length) blockers.push({ code: 'OWNER_SECURITY_DECISIONS_OPEN', details: unresolved });
if (intakeEnabled) blockers.push({ code: 'CONFIDENTIAL_INTAKE_MUST_REMAIN_DISABLED' });
if (unexpectedRemoteImplementation.length) blockers.push({ code: 'REMOTE_PHASE2_IMPLEMENTATION_PRESENT_BEFORE_GATE', details: unexpectedRemoteImplementation });
if (projectCollision) blockers.push({ code: 'STAGING_PRODUCTION_PROJECT_COLLISION' });

const readiness = blockers.length === 0 && environmentClaimsStaging && stagingId && productionId
  ? 'READY_FOR_ISOLATED_STAGING_EXECUTION'
  : 'BLOCKED';

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  project_key: gate.project_key,
  lifecycle_gate: gate.lifecycle_gate,
  readiness,
  authoritative_issue: gate.authoritative_issue,
  source_sha: environment.WORLDSTAGE_SOURCE_SHA.value,
  ledger: {
    path: path.relative(root, ledgerPath),
    sha256: sha256(ledgerText),
    minimum_decisions: minimum
  },
  fail_closed_defaults: gate.fail_closed_defaults,
  environment,
  unexpected_remote_phase2_paths: unexpectedRemoteImplementation,
  blockers
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`[worldstage-staging-preflight] ${readiness}`);
console.log(`[worldstage-staging-preflight] report=${path.relative(root, outPath)}`);
if (blockers.length) {
  for (const blocker of blockers) console.log(`[blocker] ${blocker.code}`);
}

if (process.argv.includes('--require-ready') && readiness !== 'READY_FOR_ISOLATED_STAGING_EXECUTION') {
  process.exitCode = 2;
}
