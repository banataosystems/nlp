const test = require('node:test');
const assert = require('node:assert/strict');
const { persistValidatedIntake } = require('../server/intake-persistence.cjs');

function makeAdapter({ existing = null, failAudit = false } = {}) {
  const calls = [];
  const state = { calls };
  const tx = {
    async findIdempotency(key, actorScope) { calls.push(['findIdempotency', key, actorScope]); return existing?.actor_scope === actorScope ? existing : null; },
    async insertIntake(record) { calls.push(['insertIntake', record]); return { id: 'intake-1' }; },
    async insertIdempotency(record) { calls.push(['insertIdempotency', record]); },
    async insertAudit(record) { calls.push(['insertAudit', record]); if (failAudit) throw new Error('audit_failed'); },
    async commit() { calls.push(['commit']); },
    async rollback() { calls.push(['rollback']); },
  };
  return {
    state,
    adapter: { async begin() { calls.push(['begin']); return tx; } },
  };
}

const body = {
  organization: { name: 'Example Organization' },
  contact: { name: 'Ana Reyes', email: 'ana@example.org' },
  context: { current_reality: 'Generalized non-confidential context.' },
  notice_version: 'v2',
  consent_version: null,
  questionnaire_version: 'v2',
};

const base = {
  idempotencyKey: '0123456789abcdef',
  body,
  actor: { id: 'user-1', type: 'user' },
  correlationId: 'req-1',
};

test('actor identity is required before persistence', async () => {
  const { adapter } = makeAdapter();
  await assert.rejects(() => persistValidatedIntake({ adapter, ...base, actor: null }), /actor_identity_required/);
});

test('new intake commits only after intake, idempotency, and audit records succeed', async () => {
  const { adapter, state } = makeAdapter();
  const result = await persistValidatedIntake({ adapter, ...base });
  assert.equal(result.status, 'created');
  assert.equal(result.intake_id, 'intake-1');
  assert.match(result.receipt_code, /^WS-/);
  assert.deepEqual(state.calls.map(([name]) => name), [
    'begin', 'findIdempotency', 'insertIntake', 'insertIdempotency', 'insertAudit', 'commit'
  ]);
  const idempotency = state.calls.find(([name]) => name === 'insertIdempotency')[1];
  assert.equal(idempotency.actor_scope, 'user:user-1');
});

test('audit failure rolls the transaction back and never commits', async () => {
  const { adapter, state } = makeAdapter({ failAudit: true });
  await assert.rejects(() => persistValidatedIntake({ adapter, ...base }), /audit_failed/);
  const names = state.calls.map(([name]) => name);
  assert.equal(names.includes('commit'), false);
  assert.equal(names.at(-1), 'rollback');
});

test('same actor + idempotency key + same body returns existing receipt without new writes', async () => {
  const first = makeAdapter();
  const created = await persistValidatedIntake({ adapter: first.adapter, ...base });
  const idempotency = first.state.calls.find(([name]) => name === 'insertIdempotency')[1];

  const second = makeAdapter({ existing: idempotency });
  const duplicate = await persistValidatedIntake({ adapter: second.adapter, ...base });
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(duplicate.receipt_code, created.receipt_code);
  assert.deepEqual(second.state.calls.map(([name]) => name), ['begin', 'findIdempotency', 'rollback']);
});

test('same actor and key with different body fails closed and rolls back', async () => {
  const first = makeAdapter();
  await persistValidatedIntake({ adapter: first.adapter, ...base });
  const idempotency = first.state.calls.find(([name]) => name === 'insertIdempotency')[1];

  const second = makeAdapter({ existing: idempotency });
  await assert.rejects(
    () => persistValidatedIntake({ adapter: second.adapter, ...base, body: { ...body, questionnaire_version: 'different' } }),
    (error) => error.code === 'idempotency_conflict'
  );
  assert.equal(second.state.calls.at(-1)[0], 'rollback');
});

test('same idempotency key used by a different actor does not reveal the first receipt', async () => {
  const first = makeAdapter();
  const created = await persistValidatedIntake({ adapter: first.adapter, ...base });
  const idempotency = first.state.calls.find(([name]) => name === 'insertIdempotency')[1];

  const second = makeAdapter({ existing: idempotency });
  const differentActor = await persistValidatedIntake({
    adapter: second.adapter,
    ...base,
    actor: { id: 'user-2', type: 'user' },
    correlationId: 'req-2',
  });
  assert.equal(differentActor.status, 'created');
  assert.notEqual(differentActor.receipt_code, created.receipt_code);
  const lookup = second.state.calls.find(([name]) => name === 'findIdempotency');
  assert.equal(lookup[2], 'user:user-2');
});

test('audit change summary contains no submitted narrative or contact body', async () => {
  const { adapter, state } = makeAdapter();
  await persistValidatedIntake({ adapter, ...base });
  const audit = state.calls.find(([name]) => name === 'insertAudit')[1];
  const encoded = JSON.stringify(audit);
  assert.equal(encoded.includes('Generalized non-confidential context.'), false);
  assert.equal(encoded.includes('ana@example.org'), false);
  assert.equal(encoded.includes('Example Organization'), false);
  assert.equal(audit.change_summary.state, 'pending_human_review');
});
