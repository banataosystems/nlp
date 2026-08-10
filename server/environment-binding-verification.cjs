const crypto = require('node:crypto');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const PROVIDER_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;
const ENV_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
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
    if (FORBIDDEN_SECRET_KEY_RE.test(key)) throw new Error(`environment_binding_secret_field:${path}.${key}`);
    assertNoSecretMaterial(item, `${path}.${key}`);
  }
}

function buildEnvironmentBindingPlan({
  sourceSha,
  previewDeploymentId,
  productionBaselineDeploymentId,
  stagingReadinessDigest,
  schemaBundleDigest,
  policyBundleDigest,
}) {
  if (!SHA_RE.test(sourceSha || '')) throw new Error('environment_binding_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(previewDeploymentId || '')) throw new Error('environment_binding_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(productionBaselineDeploymentId || '')) throw new Error('environment_binding_production_baseline_invalid');
  if (previewDeploymentId === productionBaselineDeploymentId) throw new Error('environment_binding_deployments_must_differ');
  for (const [name, value] of Object.entries({ stagingReadinessDigest, schemaBundleDigest, policyBundleDigest })) {
    if (!DIGEST_RE.test(value || '')) throw new Error(`environment_binding_${name}_invalid`);
  }

  const payload = {
    schema_version: 'worldstage.environment-binding-plan.v1',
    project_key: 'worldstage-cherry',
    proof_level: 'implemented_not_live_bound',
    source_sha: sourceSha.toLowerCase(),
    preview_deployment_id: previewDeploymentId,
    production_baseline_deployment_id: productionBaselineDeploymentId,
    expected_artifacts: {
      staging_readiness: stagingReadinessDigest.toLowerCase(),
      schema_bundle: schemaBundleDigest.toLowerCase(),
      policy_bundle: policyBundleDigest.toLowerCase(),
    },
    current_binding: {
      provider: 'UNBOUND',
      environment_id: 'UNBOUND',
      target: 'staging',
      environment_created: false,
      provider_bound: false,
      migrations_applied: false,
      signed_user_policy_verified: false,
      backup_restore_verified: false,
      kill_switch_verified: false,
      confidential_intake_active: false,
      production_access: false,
    },
    required_public_evidence: [
      'provider_name',
      'environment_id',
      'environment_target_staging',
      'source_sha',
      'preview_deployment_id',
      'production_baseline_deployment_id',
      'staging_readiness_digest',
      'schema_bundle_digest',
      'policy_bundle_digest',
      'signed_user_policy_test_digest',
      'backup_restore_test_digest',
      'kill_switch_test_digest',
    ],
    required_sequence: [
      'resolve_owner_security_decisions',
      'authorize_billable_staging_environment',
      'create_isolated_nonproduction_environment',
      'record_nonsecret_provider_metadata',
      'verify_exact_source_and_artifact_digests',
      'apply_reviewed_staging_only_migrations',
      'run_signed_user_positive_and_negative_policy_tests',
      'run_backup_restore_drill',
      'run_kill_switch_drill',
      'record_exact_live_staging_evidence',
      'separate_release_review_if_production_is_ever_considered',
    ],
    activation: {
      allowed: false,
      production_release_authorized: false,
      blockers: [
        'OWNER_SECURITY_DECISIONS_OPEN',
        'BILLABLE_STAGING_ENVIRONMENT_NOT_AUTHORIZED',
        'REAL_PROVIDER_BINDING_ABSENT',
        'LIVE_SIGNED_USER_POLICY_PROOF_ABSENT',
        'REAL_BACKUP_RESTORE_PROOF_ABSENT',
        'PRODUCTION_RELEASE_UNAUTHORIZED',
      ],
    },
  };

  assertNoSecretMaterial(payload);
  return Object.freeze({ ...payload, digest: digestPayload(payload) });
}

function verifyEnvironmentBindingPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['environment_binding_plan_invalid'] };

  try { assertNoSecretMaterial(plan); } catch (error) { errors.push(error.message); }
  const { digest, ...payload } = plan;
  if (digest !== digestPayload(payload)) errors.push('environment_binding_digest_mismatch');
  if (payload.schema_version !== 'worldstage.environment-binding-plan.v1') errors.push('environment_binding_schema_invalid');
  if (payload.project_key !== 'worldstage-cherry') errors.push('environment_binding_project_invalid');
  if (payload.proof_level !== 'implemented_not_live_bound') errors.push('environment_binding_proof_level_invalid');
  if (!SHA_RE.test(payload.source_sha || '')) errors.push('environment_binding_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(payload.preview_deployment_id || '')) errors.push('environment_binding_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(payload.production_baseline_deployment_id || '')) errors.push('environment_binding_production_baseline_invalid');
  if (payload.preview_deployment_id && payload.preview_deployment_id === payload.production_baseline_deployment_id) errors.push('environment_binding_deployments_must_differ');

  for (const key of ['staging_readiness', 'schema_bundle', 'policy_bundle']) {
    if (!DIGEST_RE.test(payload.expected_artifacts?.[key] || '')) errors.push(`environment_binding_${key}_digest_invalid`);
  }

  const binding = payload.current_binding || {};
  if (binding.provider !== 'UNBOUND') errors.push('environment_binding_provider_must_be_unbound');
  if (binding.environment_id !== 'UNBOUND') errors.push('environment_binding_environment_id_must_be_unbound');
  if (binding.target !== 'staging') errors.push('environment_binding_target_must_be_staging');
  for (const field of ['environment_created', 'provider_bound', 'migrations_applied', 'signed_user_policy_verified', 'backup_restore_verified', 'kill_switch_verified', 'confidential_intake_active', 'production_access']) {
    if (binding[field] !== false) errors.push(`environment_binding_${field}_must_be_false`);
  }
  if (payload.activation?.allowed !== false) errors.push('environment_binding_activation_must_be_false');
  if (payload.activation?.production_release_authorized !== false) errors.push('environment_binding_production_release_must_be_unauthorized');

  return { valid: errors.length === 0, errors };
}

function inspectCandidateBindingEvidence(evidence, plan) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') return { valid: false, activation_allowed: false, errors: ['environment_binding_candidate_invalid'] };
  if (!plan || verifyEnvironmentBindingPlan(plan).valid !== true) return { valid: false, activation_allowed: false, errors: ['environment_binding_plan_not_valid'] };

  try { assertNoSecretMaterial(evidence); } catch (error) { errors.push(error.message); }

  if (!PROVIDER_RE.test(evidence.provider || '') || evidence.provider === 'UNBOUND') errors.push('environment_binding_candidate_provider_invalid');
  if (!ENV_ID_RE.test(evidence.environment_id || '') || evidence.environment_id === 'UNBOUND') errors.push('environment_binding_candidate_environment_id_invalid');
  if (evidence.target !== 'staging') errors.push('environment_binding_candidate_target_must_be_staging');
  if ((evidence.source_sha || '').toLowerCase() !== plan.source_sha) errors.push('environment_binding_candidate_source_sha_mismatch');
  if (evidence.preview_deployment_id !== plan.preview_deployment_id) errors.push('environment_binding_candidate_preview_deployment_mismatch');
  if (evidence.production_baseline_deployment_id !== plan.production_baseline_deployment_id) errors.push('environment_binding_candidate_production_baseline_mismatch');
  if (evidence.preview_deployment_id && evidence.preview_deployment_id === evidence.production_baseline_deployment_id) errors.push('environment_binding_candidate_deployments_must_differ');

  for (const [field, planKey] of [
    ['staging_readiness_digest', 'staging_readiness'],
    ['schema_bundle_digest', 'schema_bundle'],
    ['policy_bundle_digest', 'policy_bundle'],
  ]) {
    if ((evidence[field] || '').toLowerCase() !== plan.expected_artifacts?.[planKey]) errors.push(`environment_binding_candidate_${field}_mismatch`);
  }

  for (const field of ['signed_user_policy_test_digest', 'backup_restore_test_digest', 'kill_switch_test_digest']) {
    if (!DIGEST_RE.test(evidence[field] || '')) errors.push(`environment_binding_candidate_${field}_invalid`);
  }

  if (evidence.confidential_intake_active !== false) errors.push('environment_binding_candidate_confidential_intake_must_be_inactive');
  if (evidence.intake_control !== 'disabled') errors.push('environment_binding_candidate_intake_must_be_disabled');
  if (evidence.production_access !== false) errors.push('environment_binding_candidate_production_access_must_be_false');
  if (evidence.activation_requested !== false) errors.push('environment_binding_candidate_activation_must_be_false');

  return {
    valid: errors.length === 0,
    activation_allowed: false,
    errors,
  };
}

module.exports = {
  assertNoSecretMaterial,
  buildEnvironmentBindingPlan,
  canonicalize,
  digestPayload,
  inspectCandidateBindingEvidence,
  verifyEnvironmentBindingPlan,
};
