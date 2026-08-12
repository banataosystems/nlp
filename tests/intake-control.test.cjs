const test = require('node:test');
const assert = require('node:assert/strict');
const { buildIncidentSignal, changeIntakeState, intakeIsEnabled } = require('../server/intake-control.cjs');
const { createSyntheticControlAdapter } = require('../server/synthetic-control-adapter.cjs');

const actor = { id: 'authorized-controller', type: 'user' };
const base = {
  actor,
  reason: 'Synthetic security control exercise.',
  correlationId: 'control-correlation-1',
};

async function allowControl({ action }) {
  return {
    allowed: true,
    decision_id: `decision-${action}`,
    policy_ref: 'external-owner-security-policy-to-validate',
    reason_code: 'synthetic_authorized_test',
  };
}

async function ready() {
  return { ready: true, evidence_ref: 'synthetic-readiness-evidence' };
}

test('unknown/missing control state fails closed when reading availability', async () => {
  assert.equal(await intakeIsEnabled({ controlAdapter: null }), false);
  assert.equal(await intakeIsEnabled({ controlAdapter: { async readState() { throw new Error('down'); } } }), false);
  assert.equal(await intakeIsEnabled({ controlAdapter: { async readState() { return { state: 'unknown' }; } } }), false);
});

test('disabled is the safe initial synthetic state', async () => {
  const adapter = createSyntheticControlAdapter();
  assert.equal(await intakeIsEnabled({ controlAdapter: adapter }), false);
  assert.equal(adapter.snapshot().state, 'disabled');
});

test('control changes require an external authorization decision; no role is hard-coded', async () => {
  const adapter = createSyntheticControlAdapter();
  await assert.rejects(
    () => changeIntakeState({ ...base, desiredState: 'disabled', controlAdapter: adapter }),
    /control_authorization_not_configured/
  );
  await assert.rejects(
    () => changeIntakeState({ ...base, desiredState: 'disabled', controlAdapter: adapter, authorizeControl: async () => ({ allowed: false }) }),
    (error) => error.code === 'control_not_authorized'
  );
  assert.equal(adapter.snapshot().audit.length, 0);
});

test('disabling requires authorization and is atomically audited', async () => {
  const adapter = createSyntheticControlAdapter({ initialState: 'enabled' });
  const result = await changeIntakeState({
    ...base,
    desiredState: 'disabled',
    authorizeControl: allowControl,
    controlAdapter: adapter,
  });
  assert.equal(result.state, 'disabled');
  assert.equal(await intakeIsEnabled({ controlAdapter: adapter }), false);
  const snapshot = adapter.snapshot();
  assert.equal(snapshot.audit.length, 1);
  assert.equal(snapshot.audit[0].action, 'secure_intake:disable');
  assert.equal(snapshot.audit[0].change_summary.from, 'enabled');
  assert.equal(snapshot.audit[0].change_summary.to, 'disabled');
  assert.equal('reason' in snapshot.audit[0].change_summary, false);
});

test('enabling additionally requires explicit readiness evidence', async () => {
  const adapter = createSyntheticControlAdapter();
  await assert.rejects(
    () => changeIntakeState({ ...base, desiredState: 'enabled', authorizeControl: allowControl, controlAdapter: adapter }),
    /enable_readiness_not_configured/
  );
  await assert.rejects(
    () => changeIntakeState({ ...base, desiredState: 'enabled', authorizeControl: allowControl, verifyReadiness: async () => ({ ready: false }), controlAdapter: adapter }),
    (error) => error.code === 'enable_readiness_not_proven'
  );
  assert.equal(await intakeIsEnabled({ controlAdapter: adapter }), false);
});

test('authorized + readiness-proven enable is atomically audited', async () => {
  const adapter = createSyntheticControlAdapter();
  const result = await changeIntakeState({
    ...base,
    desiredState: 'enabled',
    authorizeControl: allowControl,
    verifyReadiness: ready,
    controlAdapter: adapter,
  });
  assert.equal(result.state, 'enabled');
  assert.equal(await intakeIsEnabled({ controlAdapter: adapter }), true);
  const audit = adapter.snapshot().audit[0];
  assert.equal(audit.action, 'secure_intake:enable');
  assert.equal(audit.readiness_evidence_ref, 'synthetic-readiness-evidence');
});

test('audit failure rolls state change back', async () => {
  const adapter = createSyntheticControlAdapter({ initialState: 'disabled', failAudit: true });
  await assert.rejects(
    () => changeIntakeState({ ...base, desiredState: 'enabled', authorizeControl: allowControl, verifyReadiness: ready, controlAdapter: adapter }),
    /control_audit_failed/
  );
  assert.equal(adapter.snapshot().state, 'disabled');
  assert.equal(adapter.snapshot().audit.length, 0);
});

test('reason and correlation are required but raw reason is not copied into audit summary', async () => {
  const adapter = createSyntheticControlAdapter({ initialState: 'enabled' });
  await assert.rejects(
    () => changeIntakeState({ ...base, reason: 'short', desiredState: 'disabled', authorizeControl: allowControl, controlAdapter: adapter }),
    /control_reason_invalid/
  );
  await assert.rejects(
    () => changeIntakeState({ ...base, correlationId: '', desiredState: 'disabled', authorizeControl: allowControl, controlAdapter: adapter }),
    /control_correlation_required/
  );
});

test('incident signals are structured and cannot carry arbitrary narrative fields', () => {
  const event = buildIncidentSignal({
    category: 'authorization',
    severity: 'high',
    correlationId: 'incident-correlation-1',
    source: 'secure-intake',
    errorClass: 'authorization_failure',
  });
  assert.deepEqual(Object.keys(event).sort(), ['category', 'correlation_id', 'error_class', 'severity', 'source']);
  assert.throws(() => buildIncidentSignal({ category: 'unknown', severity: 'high', correlationId: 'x', source: 's' }), /category/);
  assert.throws(() => buildIncidentSignal({ category: 'authorization', severity: 'extreme', correlationId: 'x', source: 's' }), /severity/);
});
