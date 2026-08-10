const crypto = require('node:crypto');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const PROVIDER_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;
const ENV_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const FORBIDDEN_KEY_RE = /(secret|token|password|service[_-]?role|private[_-]?key|api[_-]?key|credential|email|phone|full[_-]?name|address|birth|narrative|payload|message|body|response)/i;

const REQUIRED_PROOF_TYPES = Object.freeze([
  'environment_binding',
  'signed_user_policy',
  'backup_restore',
  'kill_switch',
]);

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

function assertNoSensitiveMaterial(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveMaterial(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEY_RE.test(key)) throw new Error(`live_staging_evidence_sensitive_field:${path}.${key}`);
    assertNoSensitiveMaterial(item, `${path}.${key}`);
  }
}

function buildLiveStagingEvidencePlan({
  sourceSha,
  previewDeploymentId,
  productionBaselineDeploymentId,
  stagingReadinessDigest,
}) {
  if (!SHA_RE.test(sourceSha || '')) throw new Error('live_staging_evidence_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(previewDeploymentId || '')) throw new Error('live_staging_evidence_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(productionBaselineDeploymentId || '')) throw new Error('live_staging_evidence_production_baseline_invalid');
  if (previewDeploymentId === productionBaselineDeploymentId) throw new Error('live_staging_evidence_deployments_must_differ');
  if (!DIGEST_RE.test(stagingReadinessDigest || '')) throw new Error('live_staging_evidence_readiness_digest_invalid');

  const payload = {
    schema_version: 'worldstage.live-staging-evidence-plan.v1',
    project_key: 'worldstage-cherry',
    proof_level: 'implemented_not_live_executed',
    target: 'staging',
    source_sha: sourceSha.toLowerCase(),
    preview_deployment_id: previewDeploymentId,
    production_baseline_deployment_id: productionBaselineDeploymentId,
    staging_readiness_digest: stagingReadinessDigest.toLowerCase(),
    required_proof_types: REQUIRED_PROOF_TYPES,
    evidence_rules: {
      exact_source_required: true,
      one_environment_required: true,
      digest_bound_proofs_required: true,
      synthetic_identity_data_only: true,
      confidential_data_forbidden: true,
      production_access_forbidden: true,
      intake_must_finish_disabled: true,
      cleanup_required: true,
    },
    current_state: {
      live_staging_created: false,
      provider_bound: false,
      signed_user_policy_verified: false,
      backup_restore_verified: false,
      kill_switch_verified: false,
      confidential_intake_active: false,
      production_access: false,
    },
    activation: {
      allowed: false,
      production_release_authorized: false,
      separate_release_review_required: true,
    },
  };

  assertNoSensitiveMaterial(payload);
  return Object.freeze({ ...payload, digest: digestPayload(payload) });
}

function verifyLiveStagingEvidencePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['live_staging_evidence_plan_invalid'] };
  try { assertNoSensitiveMaterial(plan); } catch (error) { errors.push(error.message); }

  const { digest, ...payload } = plan;
  if (digest !== digestPayload(payload)) errors.push('live_staging_evidence_plan_digest_mismatch');
  if (payload.schema_version !== 'worldstage.live-staging-evidence-plan.v1') errors.push('live_staging_evidence_plan_schema_invalid');
  if (payload.project_key !== 'worldstage-cherry') errors.push('live_staging_evidence_plan_project_invalid');
  if (payload.proof_level !== 'implemented_not_live_executed') errors.push('live_staging_evidence_plan_proof_level_invalid');
  if (payload.target !== 'staging') errors.push('live_staging_evidence_plan_target_invalid');
  if (!SHA_RE.test(payload.source_sha || '')) errors.push('live_staging_evidence_plan_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(payload.preview_deployment_id || '')) errors.push('live_staging_evidence_plan_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(payload.production_baseline_deployment_id || '')) errors.push('live_staging_evidence_plan_production_baseline_invalid');
  if (payload.preview_deployment_id && payload.preview_deployment_id === payload.production_baseline_deployment_id) errors.push('live_staging_evidence_plan_deployments_must_differ');
  if (!DIGEST_RE.test(payload.staging_readiness_digest || '')) errors.push('live_staging_evidence_plan_readiness_digest_invalid');

  if (canonicalize(payload.required_proof_types) !== canonicalize(REQUIRED_PROOF_TYPES)) errors.push('live_staging_evidence_plan_proof_types_invalid');
  const state = payload.current_state || {};
  for (const field of ['live_staging_created', 'provider_bound', 'signed_user_policy_verified', 'backup_restore_verified', 'kill_switch_verified', 'confidential_intake_active', 'production_access']) {
    if (state[field] !== false) errors.push(`live_staging_evidence_plan_${field}_must_be_false`);
  }
  if (payload.activation?.allowed !== false) errors.push('live_staging_evidence_plan_activation_must_be_false');
  if (payload.activation?.production_release_authorized !== false) errors.push('live_staging_evidence_plan_production_release_must_be_unauthorized');
  if (payload.activation?.separate_release_review_required !== true) errors.push('live_staging_evidence_plan_separate_release_review_required');

  return { valid: errors.length === 0, errors };
}

function validateProofCommon(proof, type, evidence, errors) {
  if (!proof || typeof proof !== 'object') {
    errors.push(`live_staging_evidence_proof_missing:${type}`);
    return;
  }
  const allowedKeys = new Set([
    'proof_type', 'digest', 'source_sha', 'environment_id', 'target', 'outcome',
    'synthetic_only', 'cleanup_verified', 'production_access', 'confidential_data_used',
    'provider_bound', 'restore_target', 'production_restore', 'post_restore_control',
    'disabled_state_verified', 'enable_requires_readiness', 'audit_transactional',
  ]);
  for (const key of Object.keys(proof)) {
    if (!allowedKeys.has(key)) errors.push(`live_staging_evidence_proof_field_not_allowed:${type}:${key}`);
  }
  if (proof.proof_type !== type) errors.push(`live_staging_evidence_proof_type_mismatch:${type}`);
  if (!DIGEST_RE.test(proof.digest || '')) errors.push(`live_staging_evidence_proof_digest_invalid:${type}`);
  if ((proof.source_sha || '').toLowerCase() !== (evidence.source_sha || '').toLowerCase()) errors.push(`live_staging_evidence_proof_source_mismatch:${type}`);
  if (proof.environment_id !== evidence.environment_id) errors.push(`live_staging_evidence_proof_environment_mismatch:${type}`);
  if (proof.target !== 'staging') errors.push(`live_staging_evidence_proof_target_invalid:${type}`);
  if (proof.outcome !== 'pass') errors.push(`live_staging_evidence_proof_not_passed:${type}`);
  if (proof.production_access !== false) errors.push(`live_staging_evidence_proof_production_access_forbidden:${type}`);
}

function inspectLiveStagingEvidencePackage(evidence, plan) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') return { valid: false, staging_evidence_complete: false, activation_allowed: false, errors: ['live_staging_evidence_package_invalid'] };
  if (!plan || verifyLiveStagingEvidencePlan(plan).valid !== true) return { valid: false, staging_evidence_complete: false, activation_allowed: false, errors: ['live_staging_evidence_plan_not_valid'] };

  try { assertNoSensitiveMaterial(evidence); } catch (error) { errors.push(error.message); }
  const { digest, ...payload } = evidence;
  if (digest !== digestPayload(payload)) errors.push('live_staging_evidence_package_digest_mismatch');
  if (payload.schema_version !== 'worldstage.live-staging-evidence-package.v1') errors.push('live_staging_evidence_package_schema_invalid');
  if (payload.project_key !== 'worldstage-cherry') errors.push('live_staging_evidence_package_project_invalid');
  if (payload.target !== 'staging') errors.push('live_staging_evidence_package_target_invalid');
  if (!PROVIDER_RE.test(payload.provider || '') || payload.provider === 'UNBOUND') errors.push('live_staging_evidence_package_provider_invalid');
  if (!ENV_ID_RE.test(payload.environment_id || '') || payload.environment_id === 'UNBOUND') errors.push('live_staging_evidence_package_environment_invalid');
  if ((payload.source_sha || '').toLowerCase() !== plan.source_sha) errors.push('live_staging_evidence_package_source_mismatch');
  if (payload.preview_deployment_id !== plan.preview_deployment_id) errors.push('live_staging_evidence_package_preview_deployment_mismatch');
  if (payload.production_baseline_deployment_id !== plan.production_baseline_deployment_id) errors.push('live_staging_evidence_package_production_baseline_mismatch');
  if (payload.preview_deployment_id && payload.preview_deployment_id === payload.production_baseline_deployment_id) errors.push('live_staging_evidence_package_deployments_must_differ');
  if ((payload.staging_readiness_digest || '').toLowerCase() !== plan.staging_readiness_digest) errors.push('live_staging_evidence_package_readiness_digest_mismatch');
  if ((payload.evidence_plan_digest || '').toLowerCase() !== plan.digest) errors.push('live_staging_evidence_package_plan_digest_mismatch');
  if (payload.confidential_data_used !== false) errors.push('live_staging_evidence_package_confidential_data_forbidden');
  if (payload.production_access !== false) errors.push('live_staging_evidence_package_production_access_forbidden');
  if (payload.intake_control !== 'disabled') errors.push('live_staging_evidence_package_intake_must_be_disabled');
  if (payload.cleanup_verified !== true) errors.push('live_staging_evidence_package_cleanup_required');
  if (payload.activation_requested !== false) errors.push('live_staging_evidence_package_activation_must_be_false');
  if (payload.production_release_authorized !== false) errors.push('live_staging_evidence_package_production_release_must_be_unauthorized');

  const proofs = payload.proofs;
  if (!proofs || typeof proofs !== 'object' || Array.isArray(proofs)) {
    errors.push('live_staging_evidence_proof_set_invalid');
  } else {
    const proofKeys = Object.keys(proofs).sort();
    const expectedKeys = [...REQUIRED_PROOF_TYPES].sort();
    if (canonicalize(proofKeys) !== canonicalize(expectedKeys)) errors.push('live_staging_evidence_proof_set_invalid');
    for (const type of REQUIRED_PROOF_TYPES) validateProofCommon(proofs[type], type, payload, errors);

    const environmentBinding = proofs.environment_binding || {};
    if (environmentBinding.provider_bound !== true) errors.push('live_staging_evidence_environment_binding_not_verified');
    if (environmentBinding.confidential_data_used !== false) errors.push('live_staging_evidence_environment_binding_confidential_data_forbidden');

    const signedUser = proofs.signed_user_policy || {};
    if (signedUser.synthetic_only !== true) errors.push('live_staging_evidence_signed_user_must_be_synthetic_only');
    if (signedUser.cleanup_verified !== true) errors.push('live_staging_evidence_signed_user_cleanup_required');
    if (signedUser.confidential_data_used !== false) errors.push('live_staging_evidence_signed_user_confidential_data_forbidden');

    const backupRestore = proofs.backup_restore || {};
    if (backupRestore.synthetic_only !== true) errors.push('live_staging_evidence_backup_restore_must_be_synthetic_only');
    if (backupRestore.restore_target !== 'staging') errors.push('live_staging_evidence_backup_restore_target_invalid');
    if (backupRestore.production_restore !== false) errors.push('live_staging_evidence_backup_restore_production_forbidden');
    if (backupRestore.post_restore_control !== 'disabled') errors.push('live_staging_evidence_backup_restore_control_must_be_disabled');
    if (backupRestore.cleanup_verified !== true) errors.push('live_staging_evidence_backup_restore_cleanup_required');
    if (backupRestore.confidential_data_used !== false) errors.push('live_staging_evidence_backup_restore_confidential_data_forbidden');

    const killSwitch = proofs.kill_switch || {};
    if (killSwitch.disabled_state_verified !== true) errors.push('live_staging_evidence_kill_switch_disabled_state_not_verified');
    if (killSwitch.enable_requires_readiness !== true) errors.push('live_staging_evidence_kill_switch_readiness_gate_missing');
    if (killSwitch.audit_transactional !== true) errors.push('live_staging_evidence_kill_switch_audit_not_transactional');
    if (killSwitch.cleanup_verified !== true) errors.push('live_staging_evidence_kill_switch_cleanup_required');
    if (killSwitch.confidential_data_used !== false) errors.push('live_staging_evidence_kill_switch_confidential_data_forbidden');

    const proofDigests = REQUIRED_PROOF_TYPES.map((type) => proofs[type]?.digest).filter(Boolean);
    if (new Set(proofDigests.map((value) => value.toLowerCase())).size !== proofDigests.length) errors.push('live_staging_evidence_proof_digests_must_be_distinct');
  }

  return {
    valid: errors.length === 0,
    staging_evidence_complete: errors.length === 0,
    activation_allowed: false,
    production_release_authorized: false,
    errors,
  };
}

module.exports = {
  REQUIRED_PROOF_TYPES,
  assertNoSensitiveMaterial,
  buildLiveStagingEvidencePlan,
  canonicalize,
  digestPayload,
  inspectLiveStagingEvidencePackage,
  verifyLiveStagingEvidencePlan,
};
