const test = require('node:test');
const assert = require('node:assert/strict');
const { lookupReceiptStatus, validateReceiptCode } = require('../server/receipt-status-contract.cjs');
const { createSyntheticStagingAdapter } = require('../server/synthetic-staging-adapter.cjs');
const { persistValidatedIntake } = require('../server/intake-persistence.cjs');

const body = {
  organization: { name: 'Synthetic Organization' },
  contact: { name: 'Synthetic Contact', email: 'synthetic@example.org' },
  context: { current_reality: 'Synthetic context.' },
  notice_version: 'v1',
  consent_version: null,
  questionnaire_version: 'v1',
};

async function createReceipt(adapter, actor = { type: 'user', id: 'user-1' }) {
  return persistValidatedIntake({
    adapter,
    idempotencyKey: `receipt-key-${actor.id}-0001`,
    body,
    actor,
    correlationId: `correlation-${actor.id}`,
  });
}

test('receipt format is narrow and opaque', () => {
  assert.equal(validateReceiptCode('WS-abcdefghijkl'), true);
  assert.equal(validateReceiptCode('synthetic-intake-1'), false);
  assert.equal(validateReceiptCode('WS-short'), false);
  assert.equal(validateReceiptCode('../WS-abcdefghijkl'), false);
});

test('missing identity, adapter or malformed receipt uses the same unavailable response', async () => {
  const unavailable = { status: 404, body: { error: 'receipt_unavailable', message: 'Receipt status is unavailable.' } };
  assert.deepEqual(await lookupReceiptStatus({ receiptCode: 'bad', actor: { id: 'u' }, adapter: {} }), unavailable);
  assert.deepEqual(await lookupReceiptStatus({ receiptCode: 'WS-abcdefghijkl', actor: null, adapter: {} }), unavailable);
  assert.deepEqual(await lookupReceiptStatus({ receiptCode: 'WS-abcdefghijkl', actor: { id: 'u' }, adapter: null }), unavailable);
});

test('creator can retrieve only a coarse public status', async () => {
  const adapter = createSyntheticStagingAdapter();
  const created = await createReceipt(adapter);
  const result = await lookupReceiptStatus({
    receiptCode: created.receipt_code,
    actor: { type: 'user', id: 'user-1' },
    adapter,
  });
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body).sort(), ['message', 'receipt_code', 'status']);
  assert.equal(result.body.receipt_code, created.receipt_code);
  assert.equal(result.body.status, 'received');
  const encoded = JSON.stringify(result.body);
  assert.equal(encoded.includes('synthetic-intake-1'), false);
  assert.equal(encoded.includes('confidential_client_unclassified'), false);
  assert.equal(encoded.includes('worldstage_internal_only'), false);
});

test('different actor cannot enumerate or retrieve another actor receipt', async () => {
  const adapter = createSyntheticStagingAdapter();
  const created = await createReceipt(adapter, { type: 'user', id: 'user-1' });
  const result = await lookupReceiptStatus({
    receiptCode: created.receipt_code,
    actor: { type: 'user', id: 'user-2' },
    adapter,
  });
  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'receipt_unavailable', message: 'Receipt status is unavailable.' });
});

test('same actor id with different identity type cannot retrieve receipt', async () => {
  const adapter = createSyntheticStagingAdapter();
  const created = await createReceipt(adapter, { type: 'invitation', id: 'shared-id' });
  const result = await lookupReceiptStatus({
    receiptCode: created.receipt_code,
    actor: { type: 'user', id: 'shared-id' },
    adapter,
  });
  assert.equal(result.status, 404);
});

test('unknown internal state fails closed instead of leaking it', async () => {
  const adapter = {
    async findReceiptForActor() {
      return { receipt_code: 'WS-abcdefghijkl', state: 'secret_internal_state' };
    },
  };
  const result = await lookupReceiptStatus({
    receiptCode: 'WS-abcdefghijkl', actor: { id: 'u' }, adapter,
  });
  assert.equal(result.status, 404);
  assert.equal(JSON.stringify(result.body).includes('secret_internal_state'), false);
});

test('adapter failures are indistinguishable from unavailable receipts', async () => {
  const adapter = { async findReceiptForActor() { throw new Error('db failure'); } };
  const result = await lookupReceiptStatus({
    receiptCode: 'WS-abcdefghijkl', actor: { id: 'u' }, adapter,
  });
  assert.equal(result.status, 404);
  assert.deepEqual(result.body, { error: 'receipt_unavailable', message: 'Receipt status is unavailable.' });
});
