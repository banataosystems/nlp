const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildSyntheticBackup,
  verifySyntheticBackup,
  runSyntheticRestoreDrill,
} = require('../server/synthetic-backup-restore-contract.cjs');

const sourceSha = 'd740991bfbe0a05abcd4a350bfedaa380ade56d2';

function backup() {
  return buildSyntheticBackup({
    sourceSha,
    intakes: [
      { id: 'synthetic-intake-1', synthetic: true, sensitivity_class: 'synthetic_only', state: 'pending_human_review' },
    ],
    audit: [
      { id: 'synthetic-audit-1', synthetic: true, sensitivity_class: 'synthetic_only', action: 'secure_intake_received' },
    ],
  });
}

function target({ seeded = false, corrupt = false } = {}) {
  const state = {
    intakes: seeded ? [{ id: 'existing' }] : [],
    audit: [],
    control_state: 'disabled',
    confidential_intake_active: false,
  };
  return {
    environment: 'staging',
    allowsProduction: false,
    containsRealData: false,
    snapshot() { return structuredClone(state); },
    async restoreSyntheticBackup(candidate) {
      state.intakes = structuredClone(candidate.tables.intakes);
      state.audit = structuredClone(candidate.tables.audit);
      if (corrupt) state.intakes[0].state = 'corrupted';
      state.control_state = 'disabled';
      state.confidential_intake_active = false;
    },
  };
}

test('backup is synthetic-only, disabled, tamper-evident and staging-only', () => {
  const capsule = backup();
  const result = verifySyntheticBackup(capsule);
  assert.equal(result.valid, true, result.errors.join(','));
  assert.equal(capsule.data_class, 'synthetic_only');
  assert.equal(capsule.control_state, 'disabled');
  assert.equal(capsule.restore_contract.production_restore_forbidden, true);
});

test('backup creation rejects real data and enabled intake state', () => {
  assert.throws(() => buildSyntheticBackup({ sourceSha, intakes: [{ synthetic: false }] }), /real_data_forbidden/);
  assert.throws(() => buildSyntheticBackup({ sourceSha, controlState: 'enabled' }), /control_must_be_disabled/);
});

test('tampering invalidates backup digest', () => {
  const capsule = structuredClone(backup());
  capsule.tables.intakes[0].state = 'tampered';
  const result = verifySyntheticBackup(capsule);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('backup_digest_mismatch'));
});

test('restore drill succeeds only into empty isolated staging and preserves disabled state', async () => {
  const result = await runSyntheticRestoreDrill({ backup: backup(), targetAdapter: target() });
  assert.equal(result.ok, true, result.errors?.join(','));
  assert.equal(result.source_sha, sourceSha);
  assert.equal(result.control_state, 'disabled');
  assert.equal(result.confidential_intake_active, false);
  assert.match(result.restored_digest, /^sha256:[0-9a-f]{64}$/);
});

test('restore drill rejects nonempty, production-capable, and real-data targets', async () => {
  assert.deepEqual(
    await runSyntheticRestoreDrill({ backup: backup(), targetAdapter: target({ seeded: true }) }),
    { ok: false, errors: ['restore_target_not_empty'] }
  );

  const prod = target();
  prod.allowsProduction = true;
  assert.deepEqual(
    await runSyntheticRestoreDrill({ backup: backup(), targetAdapter: prod }),
    { ok: false, errors: ['restore_target_invalid'] }
  );

  const real = target();
  real.containsRealData = true;
  assert.deepEqual(
    await runSyntheticRestoreDrill({ backup: backup(), targetAdapter: real }),
    { ok: false, errors: ['restore_target_real_data_forbidden'] }
  );
});

test('restore integrity mismatch fails instead of accepting corrupted restored state', async () => {
  const result = await runSyntheticRestoreDrill({ backup: backup(), targetAdapter: target({ corrupt: true }) });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('restore_integrity_mismatch'));
});
