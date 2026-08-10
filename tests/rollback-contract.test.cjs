const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRollbackCapsule,
  verifyRollbackCapsule,
} = require('../server/intake-rollback-contract.cjs');

const base = {
  sourceSha: 'd740991bfbe0a05abcd4a350bfedaa380ade56d2',
  previewDeploymentId: 'dpl_GyVU44NNvsHcHECArjU3eYgshNHV',
  restoreDeploymentId: 'dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1',
};

test('rollback capsule is deterministic, content-addressed, and execution-disabled', () => {
  const first = buildRollbackCapsule(base);
  const second = buildRollbackCapsule(base);
  assert.equal(first.digest, second.digest);
  assert.match(first.digest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(first.execution.authorized, false);
  assert.equal(first.fail_closed_preconditions.intake_control, 'disabled');
  assert.equal(first.fail_closed_preconditions.provider_bindings, 'unbound');
  assert.equal(first.fail_closed_preconditions.confidential_intake, false);
  assert.equal(verifyRollbackCapsule(first).valid, true);
});

test('capsule construction fails closed when intake, provider, or confidential-data gates are open', () => {
  assert.throws(() => buildRollbackCapsule({ ...base, intakeControlState: 'enabled' }), /rollback_intake_must_be_disabled/);
  assert.throws(() => buildRollbackCapsule({ ...base, providerBindings: 'bound' }), /rollback_provider_bindings_must_be_unbound/);
  assert.throws(() => buildRollbackCapsule({ ...base, confidentialIntakeActive: true }), /rollback_confidential_intake_must_be_inactive/);
});

test('capsule construction rejects malformed provenance identifiers', () => {
  assert.throws(() => buildRollbackCapsule({ ...base, sourceSha: 'not-a-sha' }), /rollback_source_sha_invalid/);
  assert.throws(() => buildRollbackCapsule({ ...base, previewDeploymentId: 'preview-1' }), /rollback_preview_deployment_invalid/);
  assert.throws(() => buildRollbackCapsule({ ...base, restoreDeploymentId: 'production-1' }), /rollback_restore_deployment_invalid/);
});

test('verification detects provenance or authorization tampering', () => {
  const capsule = buildRollbackCapsule(base);
  const tamperedSource = { ...capsule, source_sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
  const sourceCheck = verifyRollbackCapsule(tamperedSource);
  assert.equal(sourceCheck.valid, false);
  assert.ok(sourceCheck.errors.includes('rollback_digest_mismatch'));

  const tamperedExecution = {
    ...capsule,
    execution: { ...capsule.execution, authorized: true },
  };
  const executionCheck = verifyRollbackCapsule(tamperedExecution);
  assert.equal(executionCheck.valid, false);
  assert.ok(executionCheck.errors.includes('rollback_execution_must_remain_unauthorized'));
});

test('production restore remains behind explicit release and evidence gates', () => {
  const capsule = buildRollbackCapsule(base);
  const gates = new Set(capsule.execution.requires);
  for (const gate of [
    'owner_security_decisions',
    'live_staging_security_proof',
    'physical_device_validation',
    'exact_source_release_provenance',
    'pandora_sync_or_governance_exception',
    'production_release_authority',
  ]) {
    assert.equal(gates.has(gate), true, `missing gate ${gate}`);
  }
  assert.equal(capsule.ordered_steps.includes('restore_only_under_separate_release_authority'), true);
});
