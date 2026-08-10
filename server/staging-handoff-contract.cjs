const crypto = require('node:crypto');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const FORBIDDEN_SECRET_KEY_RE = /(secret|token|password|service[_-]?role|private[_-]?key|api[_-]?key|credential)/i;

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digestPayload(payload) {
  return `sha256:${crypto.createHash('sha256').update(canonicalize(payload)).digest('hex')}`;
}

function assertNoSecretMaterial(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecretMaterial(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_SECRET_KEY_RE.test(key)) throw new Error(`staging_handoff_secret_field:${path}.${key}`);
    assertNoSecretMaterial(item, `${path}.${key}`);
  }
}

function buildStagingHandoffManifest({
  sourceSha,
  previewDeploymentId,
  productionBaselineDeploymentId,
  rollbackCapsuleDigest,
  schemaBundleDigest,
  policyBundleDigest,
}) {
  if (!SHA_RE.test(sourceSha || '')) throw new Error('staging_handoff_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(previewDeploymentId || '')) throw new Error('staging_handoff_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(productionBaselineDeploymentId || '')) throw new Error('staging_handoff_production_baseline_invalid');
  if (!DIGEST_RE.test(rollbackCapsuleDigest || '')) throw new Error('staging_handoff_rollback_digest_invalid');
  if (!DIGEST_RE.test(schemaBundleDigest || '')) throw new Error('staging_handoff_schema_digest_invalid');
  if (!DIGEST_RE.test(policyBundleDigest || '')) throw new Error('staging_handoff_policy_digest_invalid');

  const payload = {
    schema_version: 'worldstage.staging-handoff.v1',
    project_key: 'worldstage-cherry',
    source_sha: sourceSha.toLowerCase(),
    preview_deployment_id: previewDeploymentId,
    production_baseline_deployment_id: productionBaselineDeploymentId,
    artifact_digests: {
      rollback_capsule: rollbackCapsuleDigest.toLowerCase(),
      schema_bundle: schemaBundleDigest.toLowerCase(),
      policy_bundle: policyBundleDigest.toLowerCase(),
    },
    environment_contract: {
      provider: 'UNBOUND',
      environment_id: 'UNBOUND',
      auth_provider: 'UNBOUND',
      abuse_provider: 'UNBOUND',
      incident_provider: 'UNBOUND',
      data_class: 'synthetic_only',
      confidential_intake_enabled: false,
      intake_control: 'disabled',
      executable_migrations: false,
      production_access: false,
    },
    required_bind_sequence: [
      'resolve_owner_security_decisions',
      'authorize_billable_staging_environment',
      'create_isolated_nonproduction_environment',
      'record_provider_environment_id_without_credentials',
      'verify_source_and_artifact_digests',
      'apply_reviewed_staging_only_migrations',
      'configure_auth_without_browser_privileged_secrets',
      'run_signed_user_positive_and_negative_policy_tests',
      'run_backup_restore_and_kill_switch_drills',
      'record_exact_staging_evidence',
    ],
    activation: {
      allowed: false,
      blockers: [
        'OWNER_SECURITY_DECISIONS_OPEN',
        'BILLABLE_STAGING_ENVIRONMENT_NOT_AUTHORIZED',
        'REAL_PROVIDER_BINDINGS_ABSENT',
        'LIVE_RLS_SECURITY_PROOF_ABSENT',
      ],
    },
  };

  assertNoSecretMaterial(payload);
  return Object.freeze({ ...payload, digest: digestPayload(payload) });
}

function verifyStagingHandoffManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return { valid: false, errors: ['staging_handoff_invalid'] };

  try { assertNoSecretMaterial(manifest); } catch (error) { errors.push(error.message); }

  const { digest, ...payload } = manifest;
  if (digest !== digestPayload(payload)) errors.push('staging_handoff_digest_mismatch');
  if (payload.schema_version !== 'worldstage.staging-handoff.v1') errors.push('staging_handoff_schema_version_invalid');
  if (payload.project_key !== 'worldstage-cherry') errors.push('staging_handoff_project_invalid');
  if (!SHA_RE.test(payload.source_sha || '')) errors.push('staging_handoff_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(payload.preview_deployment_id || '')) errors.push('staging_handoff_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(payload.production_baseline_deployment_id || '')) errors.push('staging_handoff_production_baseline_invalid');
  for (const key of ['rollback_capsule', 'schema_bundle', 'policy_bundle']) {
    if (!DIGEST_RE.test(payload.artifact_digests?.[key] || '')) errors.push(`staging_handoff_${key}_digest_invalid`);
  }

  const env = payload.environment_contract || {};
  for (const field of ['provider', 'environment_id', 'auth_provider', 'abuse_provider', 'incident_provider']) {
    if (env[field] !== 'UNBOUND') errors.push(`staging_handoff_${field}_must_be_unbound`);
  }
  if (env.data_class !== 'synthetic_only') errors.push('staging_handoff_data_class_invalid');
  if (env.confidential_intake_enabled !== false) errors.push('staging_handoff_confidential_intake_must_be_disabled');
  if (env.intake_control !== 'disabled') errors.push('staging_handoff_intake_control_must_be_disabled');
  if (env.executable_migrations !== false) errors.push('staging_handoff_migrations_must_be_nonexecutable');
  if (env.production_access !== false) errors.push('staging_handoff_production_access_must_be_false');
  if (payload.activation?.allowed !== false) errors.push('staging_handoff_activation_must_be_false');

  return { valid: errors.length === 0, errors };
}

module.exports = {
  buildStagingHandoffManifest,
  verifyStagingHandoffManifest,
  digestPayload,
  assertNoSecretMaterial,
};
