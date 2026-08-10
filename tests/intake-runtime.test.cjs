const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateRequest, validateBody, MAX_BODY_BYTES } = require('../server/intake-contract.cjs');

const validBody = {
  organization: { name: 'Example Organization', website: 'https://example.org' },
  contact: { name: 'Ana Reyes', role: 'People Leader', email: 'ana@example.org', phone: '+63 917 000 0000' },
  context: {
    current_reality: 'Leadership alignment is under strain.',
    desired_reality: 'Leaders resolve issues directly.',
    timing: 'Q4 2026',
    delivery_mode: 'in-person',
    location: 'Metro Manila',
    notes: 'Generalized, non-confidential context only.'
  },
  notice_version: 'prototype-nonconfidential-v2',
  consent_version: null,
  questionnaire_version: 'discovery-v2'
};

function request(overrides = {}) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': '0123456789abcdef'
    },
    rawBody: JSON.stringify(validBody),
    parsedBody: validBody,
    env: {},
    ...overrides,
  };
}

const fullyBoundEnv = {
  WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true',
  WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging',
  WORLDSTAGE_SECURE_INTAKE_ADAPTER: 'bound'
};

test('kill switch fails closed before parsing/persistence concerns', () => {
  const result = evaluateRequest(request());
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'intake_disabled');
});

test('enabled route still fails closed when staging persistence is not configured', () => {
  const result = evaluateRequest(request({ env: { WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true' } }));
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'persistence_not_configured');
});

test('configured staging flag still fails closed until an adapter is explicitly bound', () => {
  const env = {
    WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true',
    WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging'
  };
  const result = evaluateRequest(request({ env }));
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'persistence_adapter_not_bound');
});

test('method is constrained to POST', () => {
  const result = evaluateRequest(request({ method: 'GET' }));
  assert.equal(result.status, 405);
});

test('runtime rejects authority injection recursively', () => {
  const body = structuredClone(validBody);
  body.context.visibility_scope = 'public';
  const result = validateBody(body);
  assert.equal(result.status, 422);
  assert.equal(result.body.error, 'authority_field_rejected');
});

test('runtime rejects unknown top-level fields', () => {
  const body = { ...validBody, debug: true };
  const result = validateBody(body);
  assert.equal(result.status, 422);
  assert.equal(result.body.error, 'unknown_field');
});

test('runtime requires valid email and required version fields', () => {
  const body = structuredClone(validBody);
  body.contact.email = 'not-an-email';
  assert.equal(validateBody(body).body.error, 'invalid_email');
  body.contact.email = 'ana@example.org';
  body.notice_version = '';
  assert.equal(validateBody(body).body.error, 'required_field_invalid');
});

test('fully bound validation shell enforces content type and idempotency', () => {
  assert.equal(evaluateRequest(request({ env: fullyBoundEnv, headers: { 'idempotency-key': '0123456789abcdef' } })).status, 415);
  assert.equal(evaluateRequest(request({ env: fullyBoundEnv, headers: { 'content-type': 'application/json' } })).body.error, 'invalid_idempotency_key');
  assert.equal(evaluateRequest(request({ env: fullyBoundEnv })).status, 200);
});

test('payload limit is enforced only after all activation gates are explicitly satisfied', () => {
  const result = evaluateRequest(request({ env: fullyBoundEnv, rawBody: 'x'.repeat(MAX_BODY_BYTES + 1) }));
  assert.equal(result.status, 413);
});
