const crypto = require('node:crypto');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digestPayload(payload) {
  return `sha256:${crypto.createHash('sha256').update(canonicalize(payload)).digest('hex')}`;
}

function requireDeploymentId(value, field) {
  if (typeof value !== 'string' || !DEPLOYMENT_RE.test(value)) throw new Error(`${field}_invalid`);
  return value;
}

function buildRollbackCapsule({
  sourceSha,
  previewDeploymentId,
  restoreDeploymentId,
  intakeControlState = 'disabled',
  providerBindings = 'unbound',
  confidentialIntakeActive = false,
}) {
  if (typeof sourceSha !== 'string' || !SHA_RE.test(sourceSha)) throw new Error('rollback_source_sha_invalid');
  requireDeploymentId(previewDeploymentId, 'rollback_preview_deployment');
  requireDeploymentId(restoreDeploymentId, 'rollback_restore_deployment');
  if (intakeControlState !== 'disabled') throw new Error('rollback_intake_must_be_disabled');
  if (providerBindings !== 'unbound') throw new Error('rollback_provider_bindings_must_be_unbound');
  if (confidentialIntakeActive !== false) throw new Error('rollback_confidential_intake_must_be_inactive');

  const payload = {
    schema_version: 'worldstage.rollback.v1',
    scope: 'secure_intake',
    source_sha: sourceSha.toLowerCase(),
    preview_deployment_id: previewDeploymentId,
    restore_baseline: {
      deployment_id: restoreDeploymentId,
      target: 'production',
    },
    fail_closed_preconditions: {
      intake_control: 'disabled',
      provider_bindings: 'unbound',
      confidential_intake: false,
    },
    ordered_steps: [
      'verify_restore_baseline_ready',
      'keep_secure_intake_disabled',
      'verify_no_provider_binding',
      'verify_no_confidential_intake',
      'restore_only_under_separate_release_authority',
      'verify_production_health_after_authorized_restore',
    ],
    execution: {
      authorized: false,
      requires: [
        'owner_security_decisions',
        'live_staging_security_proof',
        'physical_device_validation',
        'exact_source_release_provenance',
        'pandora_sync_or_governance_exception',
        'production_release_authority',
      ],
    },
  };

  return Object.freeze({ ...payload, digest: digestPayload(payload) });
}

function verifyRollbackCapsule(capsule) {
  const errors = [];
  if (!capsule || typeof capsule !== 'object') return { valid: false, errors: ['rollback_capsule_invalid'] };

  const { digest, ...payload } = capsule;
  if (digest !== digestPayload(payload)) errors.push('rollback_digest_mismatch');
  if (payload.schema_version !== 'worldstage.rollback.v1') errors.push('rollback_schema_invalid');
  if (payload.scope !== 'secure_intake') errors.push('rollback_scope_invalid');
  if (!SHA_RE.test(payload.source_sha || '')) errors.push('rollback_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(payload.preview_deployment_id || '')) errors.push('rollback_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(payload.restore_baseline?.deployment_id || '')) errors.push('rollback_restore_deployment_invalid');
  if (payload.restore_baseline?.target !== 'production') errors.push('rollback_restore_target_invalid');
  if (payload.fail_closed_preconditions?.intake_control !== 'disabled') errors.push('rollback_intake_not_disabled');
  if (payload.fail_closed_preconditions?.provider_bindings !== 'unbound') errors.push('rollback_provider_binding_present');
  if (payload.fail_closed_preconditions?.confidential_intake !== false) errors.push('rollback_confidential_intake_active');
  if (payload.execution?.authorized !== false) errors.push('rollback_execution_must_remain_unauthorized');

  const required = new Set(payload.execution?.requires || []);
  for (const gate of ['owner_security_decisions', 'live_staging_security_proof', 'exact_source_release_provenance', 'production_release_authority']) {
    if (!required.has(gate)) errors.push(`rollback_missing_gate:${gate}`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  buildRollbackCapsule,
  canonicalize,
  digestPayload,
  verifyRollbackCapsule,
};
