import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const apiContract = 'docs/worldstage/PHASE2_SECURE_INTAKE_API_CONTRACT_2026-08-10.md';
const threatModel = 'docs/worldstage/PHASE2_SECURE_INTAKE_THREAT_MODEL_2026-08-10.md';
const failureMatrix = 'docs/worldstage/PHASE2_SECURE_INTAKE_FAILURE_MATRIX_2026-08-10.md';
const routeFile = 'api/v1/intakes.js';
const runtimeContract = 'server/intake-contract.cjs';

const browserRuntimeFiles = [
  'index.html',
  'src/app.js',
  'src/prototype-safety.js',
  'src/mobile-v2.js',
  'src/phase2-mobile.js',
  'src/phase3-discovery.js',
  'src/phase4-cockpit.js',
  'src/phase5-record.js',
];

test('Phase 2 design artifacts and fail-closed runtime shell exist', () => {
  for (const rel of [apiContract, threatModel, failureMatrix, routeFile, runtimeContract]) {
    expect(fs.existsSync(path.join(root, rel))).toBe(true);
  }
  expect(read(routeFile)).toContain("require('../../server/intake-contract.cjs')");
  expect(read(runtimeContract)).toContain('WORLDSTAGE_SECURE_INTAKE_ENABLED');
  expect(read(runtimeContract)).toContain('WORLDSTAGE_SECURE_INTAKE_PERSISTENCE');
});

test('browser remains disconnected from the secure-intake route and privileged tables', () => {
  const source = browserRuntimeFiles.map(read).join('\n');
  expect(source).not.toContain('/api/v1/intakes');
  expect(source).not.toMatch(/fetch\s*\([^)]*intake/i);
  expect(source).not.toMatch(/supabase\s*\.\s*from\s*\(\s*['"]ws_/i);
  expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
});

test('runtime shell has no database/provider write adapter yet', () => {
  const source = [read(routeFile), read(runtimeContract)].join('\n').toLowerCase();
  expect(source).not.toContain('createclient(');
  expect(source).not.toContain('supabase');
  expect(source).not.toContain('postgres');
  expect(source).not.toContain('fetch(');
  expect(source).not.toContain('axios');
  expect(source).not.toContain('posthog');
  expect(source).not.toContain('openai');
});

test('API contract prevents the client from assigning authority', () => {
  const contract = read(apiContract);
  const required = [
    'The public/browser client may submit **content**, but it may never assign **authority**.',
    'assigned_reviewer_user_id', 'membership_role', 'visibility_scope',
    'sensitivity_class', 'required_authority', 'decided_by_user_id',
    'audit_actor', 'retention_class',
  ];
  for (const phrase of required) expect(contract).toContain(phrase);
});

test('runtime rejects client authority fields and unknown fields', () => {
  const runtime = read(runtimeContract);
  for (const phrase of [
    "'assigned_reviewer_user_id'",
    "'membership_role'",
    "'visibility_scope'",
    "'sensitivity_class'",
    "'required_authority'",
    "'decided_by_user_id'",
    "'retention_class'",
    'authority_field_rejected',
    'unknown_field',
  ]) expect(runtime).toContain(phrase);
});

test('kill switch and missing persistence adapter both fail closed', () => {
  const runtime = read(runtimeContract);
  expect(runtime).toContain("WORLDSTAGE_SECURE_INTAKE_ENABLED === 'true'");
  expect(runtime).toContain("WORLDSTAGE_SECURE_INTAKE_PERSISTENCE === 'staging'");
  expect(runtime).toContain("json(503, 'intake_disabled'");
  expect(runtime).toContain("json(503, 'persistence_not_configured'");
});

test('runtime constrains method, content type, idempotency and payload bytes', () => {
  const runtime = read(runtimeContract);
  expect(runtime).toContain("method !== 'POST'");
  expect(runtime).toContain("application/json");
  expect(runtime).toContain('IDEMPOTENCY_PATTERN');
  expect(runtime).toContain('MAX_BODY_BYTES = 32 * 1024');
  expect(runtime).toContain('payload_too_large');
});

test('route response is no-store and low-information', () => {
  const route = read(routeFile);
  expect(route).toContain("Cache-Control', 'no-store'");
  expect(route).toContain('Secure intake is temporarily unavailable.');
  expect(route).not.toContain('req.body)');
  expect(route).not.toContain('console.log');
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
    'Failure atomicity',
    'do not claim success to the caller',
    '## Quarantine behavior',
    'The intake API does not automatically send submitted content to an LLM.',
    'No file upload is allowed in the first live intake slice',
  ]) expect(contract).toContain(phrase);
});

test('threat model and failure matrix retain high-risk coverage', () => {
  const model = read(threatModel).toLowerCase();
  for (const phrase of [
    'spoofing identity', 'tampering', 'repudiation', 'information disclosure',
    'denial of service / abuse', 'elevation of privilege', 'prompt injection',
    'sensitive-data oversharing', 'formula/script/markup injection', 'incident threats',
  ]) expect(model).toContain(phrase);

  const matrix = read(failureMatrix).toLowerCase();
  for (const phrase of [
    'route disabled by kill switch', 'client supplies reviewer',
    'same idempotency key + different body', 'highly sensitive/prohibited content detected',
    'required aal2 missing/expired', 'malicious prompt-injection text submitted',
    'production release attempted through intake path',
  ]) expect(matrix).toContain(phrase);
});
