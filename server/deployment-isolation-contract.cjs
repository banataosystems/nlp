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
    if (FORBIDDEN_SECRET_KEY_RE.test(key)) throw new Error(`deployment_isolation_secret_field:${path}.${key}`);
    assertNoSecretMaterial(item, `${path}.${key}`);
  }
}

function buildDeploymentIsolationCapsule({
  sourceSha,
  previewDeploymentId,
  previewGitSha = sourceSha,
  productionBaselineDeploymentId,
  stagingReadinessDigest,
  visualEvidenceDigest,
  previewTarget = null,
  previewSource = 'git',
  productionTarget = 'production',
  productionSource = 'redeploy',
  intakeControl = 'disabled',
  confidentialIntakeActive = false,
  productionPromotionPerformed = false,
  releaseAuthorized = false,
}) {
  if (!SHA_RE.test(sourceSha || '')) throw new Error('deployment_isolation_source_sha_invalid');
  if (!SHA_RE.test(previewGitSha || '')) throw new Error('deployment_isolation_preview_git_sha_invalid');
  if (sourceSha.toLowerCase() !== previewGitSha.toLowerCase()) throw new Error('deployment_isolation_preview_git_sha_mismatch');
  if (!DEPLOYMENT_RE.test(previewDeploymentId || '')) throw new Error('deployment_isolation_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(productionBaselineDeploymentId || '')) throw new Error('deployment_isolation_production_baseline_invalid');
  if (previewDeploymentId === productionBaselineDeploymentId) throw new Error('deployment_isolation_deployments_must_differ');
  if (!DIGEST_RE.test(stagingReadinessDigest || '')) throw new Error('deployment_isolation_staging_digest_invalid');
  if (!DIGEST_RE.test(visualEvidenceDigest || '')) throw new Error('deployment_isolation_visual_digest_invalid');
  if (previewTarget !== null) throw new Error('deployment_isolation_preview_target_must_be_null');
  if (previewSource !== 'git') throw new Error('deployment_isolation_preview_source_must_be_git');
  if (productionTarget !== 'production') throw new Error('deployment_isolation_production_target_invalid');
  if (productionSource !== 'redeploy') throw new Error('deployment_isolation_production_source_invalid');
  if (intakeControl !== 'disabled') throw new Error('deployment_isolation_intake_must_be_disabled');
  if (confidentialIntakeActive !== false) throw new Error('deployment_isolation_confidential_intake_must_be_inactive');
  if (productionPromotionPerformed !== false) throw new Error('deployment_isolation_production_promotion_must_be_false');
  if (releaseAuthorized !== false) throw new Error('deployment_isolation_release_authority_must_be_false');

  const payload = {
    schema_version: 'worldstage.deployment-isolation.v1',
    project_key: 'worldstage-cherry',
    proof_level: 'preview_deployed',
    candidate: {
      source_sha: sourceSha.toLowerCase(),
      deployment_id: previewDeploymentId,
      git_sha: previewGitSha.toLowerCase(),
      target: null,
      source: 'git',
    },
    production_baseline: {
      deployment_id: productionBaselineDeploymentId,
      target: 'production',
      source: 'redeploy',
      promotion_performed: false,
    },
    evidence_digests: {
      staging_readiness: stagingReadinessDigest.toLowerCase(),
      mobile_visual: visualEvidenceDigest.toLowerCase(),
    },
    fail_closed_state: {
      intake_control: 'disabled',
      confidential_intake_active: false,
      release_authorized: false,
    },
    ordered_checks: [
      'verify_candidate_source_sha_matches_preview_git_sha',
      'verify_candidate_is_nonproduction_preview',
      'verify_candidate_and_production_deployments_differ',
      'verify_preserved_production_baseline_is_production_target',
      'verify_no_production_promotion_performed',
      'verify_intake_and_confidential_data_remain_disabled',
      'verify_exact_head_artifact_digests',
    ],
  };

  assertNoSecretMaterial(payload);
  return Object.freeze({ ...payload, digest: digestPayload(payload) });
}

function verifyDeploymentIsolationCapsule(capsule) {
  const errors = [];
  if (!capsule || typeof capsule !== 'object') return { valid: false, errors: ['deployment_isolation_invalid'] };

  try { assertNoSecretMaterial(capsule); } catch (error) { errors.push(error.message); }

  const { digest, ...payload } = capsule;
  if (digest !== digestPayload(payload)) errors.push('deployment_isolation_digest_mismatch');
  if (payload.schema_version !== 'worldstage.deployment-isolation.v1') errors.push('deployment_isolation_schema_version_invalid');
  if (payload.project_key !== 'worldstage-cherry') errors.push('deployment_isolation_project_invalid');
  if (payload.proof_level !== 'preview_deployed') errors.push('deployment_isolation_proof_level_invalid');

  const candidate = payload.candidate || {};
  const production = payload.production_baseline || {};
  if (!SHA_RE.test(candidate.source_sha || '')) errors.push('deployment_isolation_source_sha_invalid');
  if (!SHA_RE.test(candidate.git_sha || '')) errors.push('deployment_isolation_preview_git_sha_invalid');
  if ((candidate.source_sha || '').toLowerCase() !== (candidate.git_sha || '').toLowerCase()) errors.push('deployment_isolation_preview_git_sha_mismatch');
  if (!DEPLOYMENT_RE.test(candidate.deployment_id || '')) errors.push('deployment_isolation_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(production.deployment_id || '')) errors.push('deployment_isolation_production_baseline_invalid');
  if (candidate.deployment_id && candidate.deployment_id === production.deployment_id) errors.push('deployment_isolation_deployments_must_differ');
  if (candidate.target !== null) errors.push('deployment_isolation_preview_target_must_be_null');
  if (candidate.source !== 'git') errors.push('deployment_isolation_preview_source_must_be_git');
  if (production.target !== 'production') errors.push('deployment_isolation_production_target_invalid');
  if (production.source !== 'redeploy') errors.push('deployment_isolation_production_source_invalid');
  if (production.promotion_performed !== false) errors.push('deployment_isolation_production_promotion_must_be_false');

  for (const key of ['staging_readiness', 'mobile_visual']) {
    if (!DIGEST_RE.test(payload.evidence_digests?.[key] || '')) errors.push(`deployment_isolation_${key}_digest_invalid`);
  }

  if (payload.fail_closed_state?.intake_control !== 'disabled') errors.push('deployment_isolation_intake_must_be_disabled');
  if (payload.fail_closed_state?.confidential_intake_active !== false) errors.push('deployment_isolation_confidential_intake_must_be_inactive');
  if (payload.fail_closed_state?.release_authorized !== false) errors.push('deployment_isolation_release_authority_must_be_false');

  return { valid: errors.length === 0, errors };
}

module.exports = {
  assertNoSecretMaterial,
  buildDeploymentIsolationCapsule,
  canonicalize,
  digestPayload,
  verifyDeploymentIsolationCapsule,
};
