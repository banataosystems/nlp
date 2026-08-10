import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const apiContract = 'docs/worldstage/PHASE2_SECURE_INTAKE_API_CONTRACT_2026-08-10.md';
const threatModel = 'docs/worldstage/PHASE2_SECURE_INTAKE_THREAT_MODEL_2026-08-10.md';
const failureMatrix = 'docs/worldstage/PHASE2_SECURE_INTAKE_FAILURE_MATRIX_2026-08-10.md';

const runtimeFiles = [
  'index.html',
  'src/app.js',
  'src/prototype-safety.js',
  'src/mobile-v2.js',
  'src/phase2-mobile.js',
  'src/phase3-discovery.js',
  'src/phase4-cockpit.js',
  'src/phase5-record.js',
];

test('Phase 2 API artifacts exist and remain explicitly non-deployed', () => {
  for (const rel of [apiContract, threatModel, failureMatrix]) {
    expect(fs.existsSync(path.join(root, rel))).toBe(true);
    expect(rel).toMatch(/^docs\/worldstage\//);
  }
  const contract = read(apiContract);
  expect(contract).toContain('NON-DEPLOYED DRAFT');
  expect(contract).toContain('disabled / nonexistent');
  expect(contract).toContain('This is a contract draft, not an endpoint implementation');
});

test('current prototype contains no live secure-intake API route or direct privileged-table client path', () => {
  const source = runtimeFiles.map(read).join('\n');
  expect(source).not.toContain('/api/v1/intakes');
  expect(source).not.toMatch(/fetch\s*\([^)]*intake/i);
  expect(source).not.toMatch(/supabase\s*\.\s*from\s*\(\s*['"]ws_/i);
  expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
});

test('API contract prevents the client from assigning authority', () => {
  const contract = read(apiContract);
  const required = [
    'The public/browser client may submit **content**, but it may never assign **authority**.',
    'assigned_reviewer_user_id',
    'membership_role',
    'visibility_scope',
    'sensitivity_class',
    'required_authority',
    'decided_by_user_id',
    'audit_actor',
    'retention_class',
  ];
  for (const phrase of required) expect(contract).toContain(phrase);
  expect(contract).toContain('Unknown top-level or nested fields should be rejected');
});

test('public route cannot write privileged business tables directly', () => {
  const contract = read(apiContract);
  for (const table of ['ws_transformations', 'ws_transformation_memberships', 'ws_decisions', 'ws_audit_events']) {
    expect(contract).toContain(table);
  }
  expect(contract).toContain('No public route is allowed to write directly');
  expect(contract).toContain('privileged service credentials never reach the browser');
});

test('submission response is minimal and non-enumerating', () => {
  const contract = read(apiContract);
  expect(contract).toContain('202 Accepted');
  expect(contract).toContain('public-safe receipt code');
  expect(contract).toContain('Do not return:');
  for (const forbidden of [
    'internal intake UUID',
    'organization/transformation IDs',
    'reviewer identity',
    'internal sensitivity/visibility labels',
    'whether a named person/client already exists',
  ]) expect(contract).toContain(forbidden);
});

test('idempotency and failure atomicity are mandatory', () => {
  const contract = read(apiContract);
  expect(contract).toContain('Idempotency-Key');
  expect(contract).toContain('must not create duplicate intake records');
  expect(contract).toContain('reusing a key with materially different body must fail');
  expect(contract).toContain('Failure atomicity');
  expect(contract).toContain('do not claim success to the caller');
  expect(contract).toContain('never create a transformation membership or approved decision as a side effect of intake submission');
});

test('anonymous mode, AI forwarding, files, and privileged automation fail closed', () => {
  const contract = read(apiContract);
  expect(contract).toContain('### Mode C — anonymous public intake');
  expect(contract).toContain('**Default: DENIED.**');
  expect(contract).toContain('No file upload is allowed in the first live intake slice');
  expect(contract).toContain('The intake API does not automatically send submitted content to an LLM.');
  for (const excluded of [
    'automated proposal generation/sending',
    'automated relationship messages',
    'semantic-memory/vector ingestion',
    'AI-generated decision approval',
    'automatic membership grants',
    'production release actions',
  ]) expect(contract).toContain(excluded);
});

test('kill switch denies persistence and downstream action', () => {
  const contract = read(apiContract);
  expect(contract).toContain('## Kill switch');
  expect(contract).toContain('submission returns a generic unavailable response such as `503`');
  expect(contract).toContain('no body is persisted');
  expect(contract).toContain('no downstream queue/event/AI action fires');
});

test('privacy-safe logging excludes bodies, tokens, and participant narratives', () => {
  const contract = read(apiContract);
  expect(contract).toContain('## Privacy-safe logging');
  for (const phrase of [
    'full intake bodies',
    'bearer tokens',
    'cookies',
    'secret invitation tokens',
    'participant narratives',
  ]) expect(contract).toContain(phrase);
  expect(contract).toContain('Never put raw confidential narrative');
});

test('threat model covers identity, tampering, disclosure, abuse, privilege and prompt injection', () => {
  const model = read(threatModel).toLowerCase();
  for (const phrase of [
    'spoofing identity',
    'tampering',
    'repudiation',
    'information disclosure',
    'denial of service / abuse',
    'elevation of privilege',
    'prompt injection',
    'sensitive-data oversharing',
    'formula/script/markup injection',
    'incident threats',
  ]) expect(model).toContain(phrase);
});

test('failure matrix preserves fail-closed behavior across high-risk scenarios', () => {
  const matrix = read(failureMatrix).toLowerCase();
  for (const phrase of [
    'route disabled by kill switch',
    'client supplies reviewer',
    'client supplies state/approval/visibility/sensitivity',
    'same idempotency key + different body',
    'highly sensitive/prohibited content detected',
    'revoked reviewer tries read/review',
    'required aal2 missing/expired',
    'malicious prompt-injection text submitted',
    'cross-origin request to secure endpoint',
    'production release attempted through intake path',
  ]) expect(matrix).toContain(phrase);
  const rows = matrix.split('\n').filter((line) => line.startsWith('| ') && !line.includes('---'));
  expect(rows.length).toBeGreaterThanOrEqual(35);
});

test('AAL2 is required only for privileged actions, not invented as public intake identity policy', () => {
  const contract = read(apiContract);
  expect(contract).toContain('required role plus AAL2/step-up where policy requires');
  expect(contract).toContain('If AAL2/step-up is required and absent/expired, the action fails closed.');
  expect(contract).toContain('The project must choose one mode before activation');
});