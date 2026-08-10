const test = require('node:test');
const assert = require('node:assert/strict');
const { assertStagingTransactionShape, validateStagingAdapter } = require('../server/staging-adapter-contract.cjs');

function makeTx() {
  return {
    async findIdempotency() {},
    async insertIntake() {},
    async insertIdempotency() {},
    async insertAudit() {},
    async commit() {},
    async rollback() {},
  };
}

function makeAdapter(overrides = {}) {
  return {
    environment: 'staging',
    projectKey: 'worldstage-cherry',
    provider: 'synthetic',
    environmentId: 'synthetic-staging-1',
    sourceSha: 'sha-123',
    allowsProduction: false,
    containsRealData: false,
    async begin() { return makeTx(); },
    ...overrides,
  };
}

test('valid staging adapter requires exact project and source provenance', () => {
  const result = validateStagingAdapter(makeAdapter(), { expectedSourceSha: 'sha-123' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('production-capable or production-named adapters are rejected', () => {
  assert.deepEqual(validateStagingAdapter(makeAdapter({ environment: 'production' })).errors, ['environment_must_be_staging']);
  assert.deepEqual(validateStagingAdapter(makeAdapter({ allowsProduction: true })).errors, ['production_capability_forbidden']);
});

test('real-data staging harness is rejected', () => {
  const result = validateStagingAdapter(makeAdapter({ containsRealData: true }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('real_data_forbidden_in_synthetic_staging_harness'));
});

test('source SHA mismatch fails closed', () => {
  const result = validateStagingAdapter(makeAdapter(), { expectedSourceSha: 'other-sha' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('source_sha_mismatch'));
});

test('transaction contract requires every atomic persistence method', async () => {
  await assert.doesNotReject(() => assertStagingTransactionShape(makeAdapter(), { expectedSourceSha: 'sha-123' }));

  const broken = makeAdapter({
    async begin() {
      const tx = makeTx();
      delete tx.insertAudit;
      return tx;
    }
  });
  await assert.rejects(
    () => assertStagingTransactionShape(broken, { expectedSourceSha: 'sha-123' }),
    (error) => error.message === 'staging_transaction_invalid' && error.details.includes('insertAudit')
  );
});
