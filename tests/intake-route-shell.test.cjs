const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/v1/intakes.js');

const validBody = {
  organization: { name: 'Synthetic Organization' },
  contact: { name: 'Synthetic Contact', role: null, email: 'synthetic@example.org', phone: null },
  context: { current_reality: 'Synthetic context.', desired_reality: null, timing: null, delivery_mode: null, location: null, notes: null },
  notice_version: 'synthetic-v1',
  consent_version: null,
  questionnaire_version: 'synthetic-q1',
};

function makeResponse() {
  const state = { status: null, body: null, headers: {} };
  return {
    state,
    setHeader(name, value) { state.headers[String(name).toLowerCase()] = value; },
    status(code) { state.status = code; return this; },
    json(body) { state.body = body; return this; },
  };
}

async function callRoute({ method = 'POST', headers = {}, body = validBody, env = {} } = {}) {
  const previous = {};
  const keys = [
    'WORLDSTAGE_SECURE_INTAKE_ENABLED',
    'WORLDSTAGE_SECURE_INTAKE_PERSISTENCE',
    'WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND',
  ];
  for (const key of keys) {
    previous[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, env);

  try {
    const res = makeResponse();
    await handler({ method, headers, body }, res);
    return res.state;
  } finally {
    for (const key of keys) {
      if (previous[key] == null) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('route is disabled by default', async () => {
  const result = await callRoute();
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'intake_disabled');
  assert.equal(result.headers['cache-control'], 'no-store');
});

test('unsupported method remains rejected before runtime dependency gate', async () => {
  const result = await callRoute({ method: 'GET' });
  assert.equal(result.status, 405);
  assert.equal(result.body.error, 'method_not_allowed');
});

test('even with every low-level environment gate enabled, route never returns 2xx until orchestrator dependencies are wired', async () => {
  const result = await callRoute({
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'route-shell-key-0001',
    },
    env: {
      WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true',
      WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging',
      WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND: 'true',
    },
  });
  assert.equal(result.status, 503);
  assert.equal(result.body.error, 'runtime_dependencies_not_bound');
  assert.deepEqual(result.body, {
    error: 'runtime_dependencies_not_bound',
    message: 'Secure intake is not available yet.',
  });
});

test('route does not echo intake body, contact email, organization or authorization header in a fail-closed response', async () => {
  const result = await callRoute({
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'route-shell-key-0002',
      authorization: 'Bearer synthetic-secret-token',
    },
    env: {
      WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true',
      WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging',
      WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND: 'true',
    },
  });
  const encoded = JSON.stringify(result.body);
  assert.equal(encoded.includes('synthetic@example.org'), false);
  assert.equal(encoded.includes('Synthetic Organization'), false);
  assert.equal(encoded.includes('Synthetic context.'), false);
  assert.equal(encoded.includes('synthetic-secret-token'), false);
});

test('no tested route state returns a 2xx response', async () => {
  const cases = [
    {},
    { method: 'GET' },
    { env: { WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true' } },
    { env: { WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true', WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging' } },
    {
      headers: { 'content-type': 'application/json', 'idempotency-key': 'route-shell-key-0003' },
      env: {
        WORLDSTAGE_SECURE_INTAKE_ENABLED: 'true',
        WORLDSTAGE_SECURE_INTAKE_PERSISTENCE: 'staging',
        WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND: 'true',
      },
    },
  ];
  for (const input of cases) {
    const result = await callRoute(input);
    assert.equal(result.status >= 200 && result.status < 300, false, JSON.stringify(input));
  }
});

test('public route source remains an inert shell and cannot silently bind private runtime dependencies', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'api', 'v1', 'intakes.js'), 'utf8');
  const forbiddenBindings = [
    'intake-orchestrator',
    'synthetic-staging-adapter',
    'synthetic-control-adapter',
    'receipt-status-contract',
    'processSecureIntake',
  ];
  for (const binding of forbiddenBindings) {
    assert.equal(source.includes(binding), false, `public route unexpectedly references ${binding}`);
  }
});
