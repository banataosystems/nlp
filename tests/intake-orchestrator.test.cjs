const test = require('node:test');
const assert = require('node:assert/strict');
const { processSecureIntake } = require('../server/intake-orchestrator.cjs');
const { createSyntheticStagingAdapter } = require('../server/synthetic-staging-adapter.cjs');
const { issueSyntheticToken, verifySyntheticToken } = require('../server/synthetic-identity.cjs');

const sourceSha = 'synthetic-e2e-source-sha';
const secret = 'worldstage-orchestrator-synthetic-secret-value-32bytes';
const now = 1_800_200_000;
const token = issueSyntheticToken({ actorId: 'submitter-1', aal: 'aal1', memberships: [], now, ttlSeconds: 300 }, secret);

const env = {
  WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true',
  WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging',
  WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND: 'true',
};

const body = {
  organization: { name: 'Synthetic Organization' },
  contact: { name: 'Synthetic Contact', role: 'People Lead', email: 'synthetic@example.org', phone: null },
  context: { current_reality: 'Synthetic context.', desired_reality: 'Synthetic desired state.', timing: null, delivery_mode: null, location: null, notes: null },
  notice_version: 'synthetic-v1',
  consent_version: null,
  questionnaire_version: 'synthetic-q1',
};

function request(overrides = {}) {
  const parsedBody = overrides.parsedBody || body;
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'orchestrator-key-0001',
      authorization: `Bearer ${token}`,
      ...(overrides.headers || {}),
    },
    rawBody: JSON.stringify(parsedBody),
    parsedBody,
  };
}

async function authenticate(req) {
  const value = String(req.headers.authorization || '');
  if (!value.startsWith('Bearer ')) throw new Error('missing_bearer');
  return verifySyntheticToken(value.slice(7), secret, { now: now + 1 });
}

async function allowSyntheticSubmission({ identity }) {
  return { allowed: identity.synthetic === true };
}

test('pipeline remains unavailable without an authentication adapter', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const result = await processSecureIntake({ request: request(), env, adapter, authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'authentication_not_configured');
  assert.equal(adapter.snapshot().intakes.length, 0);
});

test('pipeline remains unavailable without a submission policy', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const result = await processSecureIntake({ request: request(), env, adapter, authenticate, expectedSourceSha: sourceSha });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'submission_policy_not_configured');
  assert.equal(adapter.snapshot().intakes.length, 0);
});

test('invalid or missing identity fails before persistence', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const bad = request({ headers: { authorization: 'Bearer broken-token' } });
  const result = await processSecureIntake({ request: bad, env, adapter, authenticate, authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha });
  assert.equal(result.status, 401);
  assert.equal(adapter.snapshot().intakes.length, 0);
});

test('explicit submission denial fails before persistence', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const result = await processSecureIntake({
    request: request(), env, adapter, authenticate,
    authorizeSubmission: async () => ({ allowed: false }),
    expectedSourceSha: sourceSha,
  });
  assert.equal(result.status, 403);
  assert.equal(adapter.snapshot().intakes.length, 0);
});

test('adapter source mismatch fails closed before persistence', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha: 'wrong-sha' });
  const result = await processSecureIntake({ request: request(), env, adapter, authenticate, authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'staging_adapter_invalid');
  assert.equal(adapter.snapshot().intakes.length, 0);
});

test('authorized synthetic request persists atomically and returns only a public receipt', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const result = await processSecureIntake({
    request: request(), env, adapter, authenticate, authorizeSubmission: allowSyntheticSubmission,
    expectedSourceSha: sourceSha, correlationId: 'synthetic-correlation-1',
  });
  assert.equal(result.status, 202);
  assert.equal(result.body.status, 'received');
  assert.match(result.body.receipt_code, /^WS-/);
  assert.equal('intake_id' in result.body, false);

  const snapshot = adapter.snapshot();
  assert.equal(snapshot.intakes.length, 1);
  assert.equal(snapshot.idempotency.length, 1);
  assert.equal(snapshot.audit.length, 1);
  assert.equal(snapshot.intakes[0].actor.id, 'submitter-1');
  assert.equal(snapshot.intakes[0].state, 'pending_human_review');
  assert.equal(snapshot.audit[0].actor_id, 'submitter-1');
  assert.equal(JSON.stringify(snapshot.audit[0]).includes('synthetic@example.org'), false);
});

test('same idempotency key and same body returns same public receipt without duplicate rows', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const first = await processSecureIntake({ request: request(), env, adapter, authenticate, authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha, correlationId: 'c-1' });
  const second = await processSecureIntake({ request: request(), env, adapter, authenticate, authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha, correlationId: 'c-2' });
  assert.equal(first.status, 202);
  assert.equal(second.status, 202);
  assert.equal(second.body.receipt_code, first.body.receipt_code);
  const snapshot = adapter.snapshot();
  assert.equal(snapshot.intakes.length, 1);
  assert.equal(snapshot.idempotency.length, 1);
  assert.equal(snapshot.audit.length, 1);
});

test('same idempotency key with materially different body returns 409 and preserves first state', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const first = await processSecureIntake({ request: request(), env, adapter, authenticate, authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha, correlationId: 'c-1' });
  assert.equal(first.status, 202);

  const changedBody = { ...body, questionnaire_version: 'synthetic-q2' };
  const conflict = await processSecureIntake({
    request: request({ parsedBody: changedBody }), env, adapter, authenticate,
    authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha, correlationId: 'c-2',
  });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.error, 'idempotency_conflict');
  const snapshot = adapter.snapshot();
  assert.equal(snapshot.intakes.length, 1);
  assert.equal(snapshot.audit.length, 1);
});

test('outer kill switch still prevents the composed pipeline even when all adapters are present', async () => {
  const adapter = createSyntheticStagingAdapter({ sourceSha });
  const result = await processSecureIntake({
    request: request(), env: { ...env, WORLDSTAGE_SECURE_INTAKE_ENABLED: 'false' }, adapter, authenticate,
    authorizeSubmission: allowSyntheticSubmission, expectedSourceSha: sourceSha,
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'intake_disabled');
  assert.equal(adapter.snapshot().intakes.length, 0);
});
