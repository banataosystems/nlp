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
const routeFile = 'api/v1/intakes.js';
const runtimeContract = 'server/intake-contract.cjs';

const browserFiles = [
  'index.html',
  'src/app.js',
  'src/prototype-safety.js',
  'src/mobile-v2.js',
  'src/phase2-mobile.js',
  'src/phase3-discovery.js',
  'src/phase4-cockpit.js',
  'src/phase5-record.js',
];

test('Phase 2 API design artifacts remain documentation while fail-closed runtime shell exists separately', () => {
  for (const rel of [apiContract, threatModel, failureMatrix, routeFile, runtimeContract]) {
    expect(fs.existsSync(path.join(root, rel))).toBe(true);
  }
  const contract = read(apiContract);
  expect(contract).toContain('NON-DEPLOYED DRAFT');
  expect(contract).toContain('disabled / nonexistent');
  expect(contract).toContain('This is a contract draft, not an endpoint implementation');
});

test('browser application still does not call secure-intake API or privileged WorldStage tables', () => {
  const source = browserFiles.map(read).join('\n');
  expect(source).not.toContain('/api/v1/intakes');
  expect(source).not.toMatch(/fetch\s*\([^)]*intake/i);
  expect(source).not.toMatch(/supabase\s*\.\s*from\s*\(\s*['"]ws_/i);
  expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
});

test('runtime rejects client-controlled authority fields recursively', () => {
  const runtime = read(runtimeContract);
  for (const field of [
    'assigned_reviewer_user_id',
    'membership_role',
    'permissions',
    'scopes',
    'visibility_scope',
    'sensitivity_class',
    'retention_class',
    'required_authority',
    'decided_by_user_id',
    'audit_actor',
  ]) expect(runtime).toContain(`'${field}'`);
  expect(runtime).toContain('hasForbiddenKey');
  expect(runtime).toContain('authority_field_rejected');
});

test('runtime uses explicit field allowlists rather than arbitrary body persistence', () => {
  const runtime = read(runtimeContract);
  expect(runtime).toContain('TOP_LEVEL_KEYS');
  expect(runtime).toContain('ORGANIZATION_KEYS');
  expect(runtime).toContain('CONTACT_KEYS');
  expect(runtime).toContain('CONTEXT_KEYS');
  expect(runtime).toContain('unknown_field');
});

test('runtime defaults fail closed behind independent enablement, persistence and adapter gates', () => {
  const runtime = read(runtimeContract);
  expect(runtime).toContain("WORLDSTAGE_SECURE_INTAKE_ENABLED === 'true'");
  expect(runtime).toContain("WORLDSTAGE_SECURE_INTAKE_PERSISTENCE === 'staging'");
  expect(runtime).toContain("WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND === 'true'");
  expect(runtime).toContain("json(503, 'intake_disabled'");
  expect(runtime).toContain("json(503, 'persistence_not_configured'");
  expect(runtime).toContain("json(503, 'persistence_adapter_not_bound'");
});

test('runtime constrains method, content type, idempotency and payload bytes', () => {
  const runtime = read(runtimeContract);
  expect(runtime).toContain("method !== 'POST'");
  expect(runtime).toContain('application/json');
  expect(runtime).toContain('IDEMPOTENCY_PATTERN');
  expect(runtime).toContain('MAX_BODY_BYTES = 32 * 1024');
  expect(runtime).toContain('payload_too_large');
});

test('route response is no-store, low-information, and never echoes the parsed request body', () => {
  const route = read(routeFile);
  expect(route).toContain("Cache-Control', 'no-store'");
  expect(route).toContain('Secure intake is temporarily unavailable.');
  expect(route).toContain('runtime_dependencies_not_bound');
  expect(route).not.toMatch(/\.json\s*\(\s*req\.body\s*\)/);
  expect(route).not.toMatch(/body\s*:\s*req\.body/);
  expect(route).not.toContain('console.log');
});

test('public route shell has no successful response branch before orchestrator wiring', () => {
  const route = read(routeFile);
  expect(route).toContain('if (result.status === 200)');
  expect(route).toContain('res.status(503)');
  expect(route).not.toMatch(/res\.status\(20[0-9]\)/);
});

test('contract keeps privileged tables behind internal authorization', () => {
  const contract = read(apiContract);
  for (const table of ['ws_transformations', 'ws_transformation_memberships', 'ws_decisions', 'ws_audit_events']) {
    expect(contract).toContain(table);
  }
  expect(contract).toContain('No public route is allowed to write directly');
  expect(contract).toContain('privileged service credentials never reach the browser');
});

test('idempotency, failure atomicity, quarantine and AI boundaries remain mandatory', () => {
  const contract = read(apiContract);
  for (const phrase of [
    'Idempotency-Key',
    'must not create duplicate intake records',
    'reusing a key with materially different body must fail',
    'Failure atomicity',
    'do not claim success to the caller',
    '## Quarantine behavior',
    'The intake API does not automatically send submitted content to an LLM.',
  ]) expect(contract).toContain(phrase);
});

test('anonymous mode, files and privileged automation remain denied', () => {
  const contract = read(apiContract);
  expect(contract).toContain('### Mode C — anonymous public intake');
  expect(contract).toContain('**Default: DENIED.**');
  expect(contract).toContain('No file upload is allowed in the first live intake slice');
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

test('privacy-safe logging excludes bodies, tokens and participant narratives', () => {
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
