const crypto = require('node:crypto');

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return `sha256:${crypto.createHash('sha256').update(canonicalize(value)).digest('hex')}`;
}

function assertSyntheticRecord(record) {
  if (!record || typeof record !== 'object') throw new Error('backup_record_invalid');
  if (record.synthetic !== true) throw new Error('backup_real_data_forbidden');
  if (record.sensitivity_class && record.sensitivity_class !== 'synthetic_only') throw new Error('backup_sensitivity_invalid');
}

function buildSyntheticBackup({ sourceSha, intakes = [], audit = [], controlState = 'disabled' }) {
  if (!/^[0-9a-f]{40}$/i.test(sourceSha || '')) throw new Error('backup_source_sha_invalid');
  if (controlState !== 'disabled') throw new Error('backup_control_must_be_disabled');
  intakes.forEach(assertSyntheticRecord);
  audit.forEach(assertSyntheticRecord);

  const payload = {
    schema_version: 'worldstage.synthetic-backup.v1',
    source_sha: sourceSha.toLowerCase(),
    data_class: 'synthetic_only',
    control_state: 'disabled',
    tables: {
      intakes: structuredClone(intakes),
      audit: structuredClone(audit),
    },
    restore_contract: {
      target_environment: 'staging',
      target_must_be_empty: true,
      production_restore_forbidden: true,
      provider_bindings_required: false,
      intake_control_after_restore: 'disabled',
      confidential_intake_after_restore: false,
    },
  };

  return Object.freeze({ ...payload, digest: digest(payload) });
}

function verifySyntheticBackup(backup) {
  const errors = [];
  if (!backup || typeof backup !== 'object') return { valid: false, errors: ['backup_invalid'] };
  const { digest: recorded, ...payload } = backup;
  if (recorded !== digest(payload)) errors.push('backup_digest_mismatch');
  if (payload.schema_version !== 'worldstage.synthetic-backup.v1') errors.push('backup_schema_invalid');
  if (!/^[0-9a-f]{40}$/i.test(payload.source_sha || '')) errors.push('backup_source_sha_invalid');
  if (payload.data_class !== 'synthetic_only') errors.push('backup_data_class_invalid');
  if (payload.control_state !== 'disabled') errors.push('backup_control_not_disabled');
  for (const record of [...(payload.tables?.intakes || []), ...(payload.tables?.audit || [])]) {
    try { assertSyntheticRecord(record); } catch (error) { errors.push(error.message); }
  }
  const restore = payload.restore_contract || {};
  if (restore.target_environment !== 'staging') errors.push('backup_restore_target_invalid');
  if (restore.target_must_be_empty !== true) errors.push('backup_restore_target_must_be_empty');
  if (restore.production_restore_forbidden !== true) errors.push('backup_production_restore_must_be_forbidden');
  if (restore.intake_control_after_restore !== 'disabled') errors.push('backup_restore_control_must_be_disabled');
  if (restore.confidential_intake_after_restore !== false) errors.push('backup_restore_confidential_intake_must_be_false');
  return { valid: errors.length === 0, errors };
}

async function runSyntheticRestoreDrill({ backup, targetAdapter }) {
  const verification = verifySyntheticBackup(backup);
  if (!verification.valid) return { ok: false, errors: verification.errors };
  if (!targetAdapter || targetAdapter.environment !== 'staging' || targetAdapter.allowsProduction !== false) {
    return { ok: false, errors: ['restore_target_invalid'] };
  }
  if (targetAdapter.containsRealData !== false) return { ok: false, errors: ['restore_target_real_data_forbidden'] };
  if (typeof targetAdapter.snapshot !== 'function' || typeof targetAdapter.restoreSyntheticBackup !== 'function') {
    return { ok: false, errors: ['restore_adapter_contract_invalid'] };
  }

  const before = targetAdapter.snapshot();
  if ((before.intakes?.length || 0) !== 0 || (before.audit?.length || 0) !== 0) {
    return { ok: false, errors: ['restore_target_not_empty'] };
  }

  await targetAdapter.restoreSyntheticBackup(backup);
  const after = targetAdapter.snapshot();
  const restored = {
    intakes: after.intakes || [],
    audit: after.audit || [],
  };
  const expected = {
    intakes: backup.tables.intakes,
    audit: backup.tables.audit,
  };
  if (digest(restored) !== digest(expected)) return { ok: false, errors: ['restore_integrity_mismatch'] };
  if (after.control_state !== 'disabled') return { ok: false, errors: ['restore_control_not_disabled'] };
  if (after.confidential_intake_active !== false) return { ok: false, errors: ['restore_confidential_intake_active'] };

  return {
    ok: true,
    source_sha: backup.source_sha,
    restored_digest: digest(restored),
    control_state: after.control_state,
    confidential_intake_active: after.confidential_intake_active,
  };
}

module.exports = {
  buildSyntheticBackup,
  verifySyntheticBackup,
  runSyntheticRestoreDrill,
  digest,
};
