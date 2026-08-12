const crypto = require('node:crypto');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const PROVIDER_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;
const ENV_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const FORBIDDEN_KEY_RE = /(secret|token|password|service[_-]?role|private[_-]?key|api[_-]?key|credential|email|phone|full[_-]?name|address|birth|narrative|payload|message|body|response|content|blob|raw|url|uri|path|query|header|cookie)/i;

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

function digestPayload(value) {
  return `sha256:${crypto.createHash('sha256').update(canonicalize(value)).digest('hex')}`;
}

function assertNoSensitiveMaterial(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveMaterial(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEY_RE.test(key)) throw new Error(`staging_evidence_manifest_sensitive_field:${path}.${key}`);
    assertNoSensitiveMaterial(item, `${path}.${key}`);
  }
}

function buildStagingEvidenceManifestPlan({
  sourceSha,
  previewDeploymentId,
  productionBaselineDeploymentId,
  stagingReadinessDigest,
  evidencePlanDigest,
}) {
  if (!SHA_RE.test(sourceSha || '')) throw new Error('staging_evidence_manifest_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(previewDeploymentId || '')) throw new Error('staging_evidence_manifest_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(productionBaselineDeploymentId || '')) throw new Error('staging_evidence_manifest_production_baseline_invalid');
  if (previewDeploymentId === productionBaselineDeploymentId) throw new Error('staging_evidence_manifest_deployments_must_differ');
  if (!DIGEST_RE.test(stagingReadinessDigest || '')) throw new Error('staging_evidence_manifest_readiness_digest_invalid');
  if (!DIGEST_RE.test(evidencePlanDigest || '')) throw new Error('staging_evidence_manifest_evidence_plan_digest_invalid');

  const plan = {
    schema_version: 'worldstage.staging-evidence-manifest-plan.v1',
    project_key: 'worldstage-cherry',
    proof_level: 'implemented_not_live_captured',
    target: 'staging',
    source_sha: sourceSha.toLowerCase(),
    preview_deployment_id: previewDeploymentId,
    production_baseline_deployment_id: productionBaselineDeploymentId,
    staging_readiness_digest: stagingReadinessDigest.toLowerCase(),
    evidence_plan_digest: evidencePlanDigest.toLowerCase(),
    required_proof_types: REQUIRED_PROOF_TYPES,
    capture_rules: {
      reference_only: true,
      inline_material_forbidden: true,
      digest_required: true,
      exact_source_required: true,
      single_environment_required: true,
      single_provider_required: true,
      confidential_data_forbidden: true,
      production_access_forbidden: true,
      activation_forbidden: true,
      production_release_forbidden: true,
    },
    current_state: {
      live_staging_created: false,
      provider_bound: false,
      evidence_captured: false,
      confidential_intake_active: false,
      production_access: false,
    },
    authority: {
      activation_allowed: false,
      production_release_authorized: false,
      separate_release_review_required: true,
    },
  };

  assertNoSensitiveMaterial(plan);
  return Object.freeze({ ...plan, digest: digestPayload(plan) });
}

function verifyStagingEvidenceManifestPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['staging_evidence_manifest_plan_invalid'] };
  try { assertNoSensitiveMaterial(plan); } catch (error) { errors.push(error.message); }

  const { digest, ...value } = plan;
  if (digest !== digestPayload(value)) errors.push('staging_evidence_manifest_plan_digest_mismatch');
  if (value.schema_version !== 'worldstage.staging-evidence-manifest-plan.v1') errors.push('staging_evidence_manifest_plan_schema_invalid');
  if (value.project_key !== 'worldstage-cherry') errors.push('staging_evidence_manifest_plan_project_invalid');
  if (value.proof_level !== 'implemented_not_live_captured') errors.push('staging_evidence_manifest_plan_proof_level_invalid');
  if (value.target !== 'staging') errors.push('staging_evidence_manifest_plan_target_invalid');
  if (!SHA_RE.test(value.source_sha || '')) errors.push('staging_evidence_manifest_plan_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(value.preview_deployment_id || '')) errors.push('staging_evidence_manifest_plan_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(value.production_baseline_deployment_id || '')) errors.push('staging_evidence_manifest_plan_production_baseline_invalid');
  if (value.preview_deployment_id && value.preview_deployment_id === value.production_baseline_deployment_id) errors.push('staging_evidence_manifest_plan_deployments_must_differ');
  if (!DIGEST_RE.test(value.staging_readiness_digest || '')) errors.push('staging_evidence_manifest_plan_readiness_digest_invalid');
  if (!DIGEST_RE.test(value.evidence_plan_digest || '')) errors.push('staging_evidence_manifest_plan_evidence_plan_digest_invalid');
  if (canonicalize(value.required_proof_types) !== canonicalize(REQUIRED_PROOF_TYPES)) errors.push('staging_evidence_manifest_plan_proof_types_invalid');

  for (const [key, expected] of Object.entries({
    reference_only: true,
    inline_material_forbidden: true,
    digest_required: true,
    exact_source_required: true,
    single_environment_required: true,
    single_provider_required: true,
    confidential_data_forbidden: true,
    production_access_forbidden: true,
    activation_forbidden: true,
    production_release_forbidden: true,
  })) {
    if (value.capture_rules?.[key] !== expected) errors.push(`staging_evidence_manifest_plan_rule_invalid:${key}`);
  }

  for (const field of ['live_staging_created', 'provider_bound', 'evidence_captured', 'confidential_intake_active', 'production_access']) {
    if (value.current_state?.[field] !== false) errors.push(`staging_evidence_manifest_plan_${field}_must_be_false`);
  }
  if (value.authority?.activation_allowed !== false) errors.push('staging_evidence_manifest_plan_activation_must_be_false');
  if (value.authority?.production_release_authorized !== false) errors.push('staging_evidence_manifest_plan_production_release_must_be_unauthorized');
  if (value.authority?.separate_release_review_required !== true) errors.push('staging_evidence_manifest_plan_separate_release_review_required');

  return { valid: errors.length === 0, errors };
}

function inspectReference(ref, type, manifest, errors) {
  if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
    errors.push(`staging_evidence_manifest_reference_missing:${type}`);
    return;
  }
  const allowed = new Set(['proof_type', 'digest', 'source_sha', 'environment_id', 'provider', 'target', 'outcome']);
  for (const key of Object.keys(ref)) {
    if (!allowed.has(key)) errors.push(`staging_evidence_manifest_reference_field_not_allowed:${type}:${key}`);
  }
  if (ref.proof_type !== type) errors.push(`staging_evidence_manifest_reference_type_mismatch:${type}`);
  if (!DIGEST_RE.test(ref.digest || '')) errors.push(`staging_evidence_manifest_reference_digest_invalid:${type}`);
  if ((ref.source_sha || '').toLowerCase() !== manifest.source_sha) errors.push(`staging_evidence_manifest_reference_source_mismatch:${type}`);
  if (ref.environment_id !== manifest.environment_id) errors.push(`staging_evidence_manifest_reference_environment_mismatch:${type}`);
  if (ref.provider !== manifest.provider) errors.push(`staging_evidence_manifest_reference_provider_mismatch:${type}`);
  if (ref.target !== 'staging') errors.push(`staging_evidence_manifest_reference_target_invalid:${type}`);
  if (ref.outcome !== 'pass') errors.push(`staging_evidence_manifest_reference_not_passed:${type}`);
}

function inspectStagingEvidenceManifest(manifest, plan) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return { valid: false, evidence_capture_complete: false, activation_allowed: false, production_release_authorized: false, errors: ['staging_evidence_manifest_invalid'] };
  if (!plan || verifyStagingEvidenceManifestPlan(plan).valid !== true) return { valid: false, evidence_capture_complete: false, activation_allowed: false, production_release_authorized: false, errors: ['staging_evidence_manifest_plan_not_valid'] };

  try { assertNoSensitiveMaterial(manifest); } catch (error) { errors.push(error.message); }
  const { digest, ...value } = manifest;
  if (digest !== digestPayload(value)) errors.push('staging_evidence_manifest_digest_mismatch');
  if (value.schema_version !== 'worldstage.staging-evidence-manifest.v1') errors.push('staging_evidence_manifest_schema_invalid');
  if (value.project_key !== 'worldstage-cherry') errors.push('staging_evidence_manifest_project_invalid');
  if (value.target !== 'staging') errors.push('staging_evidence_manifest_target_invalid');
  if (!PROVIDER_RE.test(value.provider || '') || /^unbound$/i.test(value.provider || '')) errors.push('staging_evidence_manifest_provider_invalid');
  if (!ENV_ID_RE.test(value.environment_id || '') || /^unbound$/i.test(value.environment_id || '')) errors.push('staging_evidence_manifest_environment_invalid');
  if ((value.source_sha || '').toLowerCase() !== plan.source_sha) errors.push('staging_evidence_manifest_source_mismatch');
  if (value.preview_deployment_id !== plan.preview_deployment_id) errors.push('staging_evidence_manifest_preview_deployment_mismatch');
  if (value.production_baseline_deployment_id !== plan.production_baseline_deployment_id) errors.push('staging_evidence_manifest_production_baseline_mismatch');
  if (value.preview_deployment_id && value.preview_deployment_id === value.production_baseline_deployment_id) errors.push('staging_evidence_manifest_deployments_must_differ');
  if ((value.staging_readiness_digest || '').toLowerCase() !== plan.staging_readiness_digest) errors.push('staging_evidence_manifest_readiness_digest_mismatch');
  if ((value.evidence_plan_digest || '').toLowerCase() !== plan.evidence_plan_digest) errors.push('staging_evidence_manifest_evidence_plan_digest_mismatch');
  if ((value.manifest_plan_digest || '').toLowerCase() !== plan.digest) errors.push('staging_evidence_manifest_plan_digest_mismatch');
  if (value.reference_only !== true) errors.push('staging_evidence_manifest_reference_only_required');
  if (value.inline_material_present !== false) errors.push('staging_evidence_manifest_inline_material_forbidden');
  if (value.confidential_data_used !== false) errors.push('staging_evidence_manifest_confidential_data_forbidden');
  if (value.production_access !== false) errors.push('staging_evidence_manifest_production_access_forbidden');
  if (value.intake_control !== 'disabled') errors.push('staging_evidence_manifest_intake_must_be_disabled');
  if (value.activation_requested !== false) errors.push('staging_evidence_manifest_activation_must_be_false');
  if (value.production_release_authorized !== false) errors.push('staging_evidence_manifest_production_release_must_be_unauthorized');

  const refs = value.references;
  if (!refs || typeof refs !== 'object' || Array.isArray(refs)) {
    errors.push('staging_evidence_manifest_reference_set_invalid');
  } else {
    const keys = Object.keys(refs).sort();
    if (canonicalize(keys) !== canonicalize([...REQUIRED_PROOF_TYPES].sort())) errors.push('staging_evidence_manifest_reference_set_invalid');
    for (const type of REQUIRED_PROOF_TYPES) inspectReference(refs[type], type, value, errors);
    const digests = REQUIRED_PROOF_TYPES.map((type) => refs[type]?.digest).filter(Boolean).map((item) => item.toLowerCase());
    if (new Set(digests).size !== digests.length) errors.push('staging_evidence_manifest_reference_digests_must_be_distinct');
  }

  return {
    valid: errors.length === 0,
    evidence_capture_complete: errors.length === 0,
    activation_allowed: false,
    production_release_authorized: false,
    errors,
  };
}

module.exports = {
  REQUIRED_PROOF_TYPES,
  assertNoSensitiveMaterial,
  buildStagingEvidenceManifestPlan,
  canonicalize,
  digestPayload,
  inspectStagingEvidenceManifest,
  verifyStagingEvidenceManifestPlan,
};
