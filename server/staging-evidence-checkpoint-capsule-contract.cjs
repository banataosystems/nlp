const {
  assertNoSensitiveMaterial,
  canonicalize,
  digestPayload,
} = require('./staging-evidence-manifest-contract.cjs');
const {
  verifyStagingEvidenceCheckpoint,
} = require('./staging-evidence-checkpoint-contract.cjs');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const PROVIDER_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;
const ENV_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;

const CHECKPOINT_CAPSULE_SCHEMA = 'worldstage.staging-evidence-checkpoint-capsule.v1';
const CHECKPOINT_CAPSULE_KEYS = Object.freeze([
  'schema_version',
  'project_key',
  'proof_level',
  'target',
  'transport_mode',
  'source_sha',
  'preview_deployment_id',
  'production_baseline_deployment_id',
  'provider',
  'environment_id',
  'manifest_plan_digest',
  'reference_set_digest',
  'checkpoint_count',
  'genesis_checkpoint_digest',
  'terminal_checkpoint_digest',
  'terminal_sequence',
  'checkpoints',
  'underlying_evidence_embedded',
  'confidential_data_used',
  'production_access',
  'activation_requested',
  'production_release_authorized',
  'authority',
  'digest',
]);

function sameDigest(left, right) {
  return String(left || '').toLowerCase() === String(right || '').toLowerCase();
}

function sameSha(left, right) {
  return String(left || '').toLowerCase() === String(right || '').toLowerCase();
}

function inspectCapsuleShape(value, errors) {
  const keys = Object.keys(value).sort();
  if (canonicalize(keys) !== canonicalize([...CHECKPOINT_CAPSULE_KEYS].sort())) {
    errors.push('staging_evidence_checkpoint_capsule_fields_invalid');
  }

  if (value.schema_version !== CHECKPOINT_CAPSULE_SCHEMA) errors.push('staging_evidence_checkpoint_capsule_schema_invalid');
  if (value.project_key !== 'worldstage-cherry') errors.push('staging_evidence_checkpoint_capsule_project_invalid');
  if (value.proof_level !== 'checkpoint_portability_only') errors.push('staging_evidence_checkpoint_capsule_proof_level_invalid');
  if (value.target !== 'staging') errors.push('staging_evidence_checkpoint_capsule_target_invalid');
  if (value.transport_mode !== 'self_contained_checkpoint_chain') errors.push('staging_evidence_checkpoint_capsule_transport_mode_invalid');
  if (!SHA_RE.test(value.source_sha || '')) errors.push('staging_evidence_checkpoint_capsule_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(value.preview_deployment_id || '')) errors.push('staging_evidence_checkpoint_capsule_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(value.production_baseline_deployment_id || '')) errors.push('staging_evidence_checkpoint_capsule_production_baseline_invalid');
  if (value.preview_deployment_id && value.preview_deployment_id === value.production_baseline_deployment_id) errors.push('staging_evidence_checkpoint_capsule_deployments_must_differ');
  if (!PROVIDER_RE.test(value.provider || '') || /^unbound$/i.test(value.provider || '')) errors.push('staging_evidence_checkpoint_capsule_provider_invalid');
  if (!ENV_ID_RE.test(value.environment_id || '') || /^unbound$/i.test(value.environment_id || '')) errors.push('staging_evidence_checkpoint_capsule_environment_invalid');
  if (!DIGEST_RE.test(value.manifest_plan_digest || '')) errors.push('staging_evidence_checkpoint_capsule_manifest_plan_digest_invalid');
  if (!DIGEST_RE.test(value.reference_set_digest || '')) errors.push('staging_evidence_checkpoint_capsule_reference_set_digest_invalid');
  if (!DIGEST_RE.test(value.genesis_checkpoint_digest || '')) errors.push('staging_evidence_checkpoint_capsule_genesis_digest_invalid');
  if (!DIGEST_RE.test(value.terminal_checkpoint_digest || '')) errors.push('staging_evidence_checkpoint_capsule_terminal_digest_invalid');
  if (!Number.isInteger(value.checkpoint_count) || value.checkpoint_count < 1) errors.push('staging_evidence_checkpoint_capsule_checkpoint_count_invalid');
  if (!Number.isInteger(value.terminal_sequence) || value.terminal_sequence < 1) errors.push('staging_evidence_checkpoint_capsule_terminal_sequence_invalid');
  if (value.underlying_evidence_embedded !== false) errors.push('staging_evidence_checkpoint_capsule_underlying_evidence_must_not_be_embedded');
  if (value.confidential_data_used !== false) errors.push('staging_evidence_checkpoint_capsule_confidential_data_forbidden');
  if (value.production_access !== false) errors.push('staging_evidence_checkpoint_capsule_production_access_forbidden');
  if (value.activation_requested !== false) errors.push('staging_evidence_checkpoint_capsule_activation_must_be_false');
  if (value.production_release_authorized !== false) errors.push('staging_evidence_checkpoint_capsule_production_release_must_be_unauthorized');

  const authority = value.authority;
  if (!authority || typeof authority !== 'object' || Array.isArray(authority)) {
    errors.push('staging_evidence_checkpoint_capsule_authority_invalid');
  } else {
    const authorityKeys = Object.keys(authority).sort();
    if (canonicalize(authorityKeys) !== canonicalize(['activation_allowed', 'production_release_authorized', 'separate_release_review_required'].sort())) {
      errors.push('staging_evidence_checkpoint_capsule_authority_fields_invalid');
    }
    if (authority.activation_allowed !== false) errors.push('staging_evidence_checkpoint_capsule_activation_authority_forbidden');
    if (authority.production_release_authorized !== false) errors.push('staging_evidence_checkpoint_capsule_release_authority_forbidden');
    if (authority.separate_release_review_required !== true) errors.push('staging_evidence_checkpoint_capsule_separate_release_review_required');
  }
}

function verifyStagingEvidenceCheckpointCapsule(capsule) {
  const errors = [];
  if (!capsule || typeof capsule !== 'object' || Array.isArray(capsule)) {
    return {
      valid: false,
      portability_verified: false,
      activation_allowed: false,
      production_release_authorized: false,
      errors: ['staging_evidence_checkpoint_capsule_invalid'],
    };
  }

  try { assertNoSensitiveMaterial(capsule); } catch (error) { errors.push(error.message); }

  const { digest, ...value } = capsule;
  inspectCapsuleShape({ ...value, digest }, errors);
  if (!DIGEST_RE.test(digest || '') || !sameDigest(digest, digestPayload(value))) {
    errors.push('staging_evidence_checkpoint_capsule_digest_mismatch');
  }

  const checkpoints = value.checkpoints;
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
    errors.push('staging_evidence_checkpoint_capsule_checkpoints_invalid');
  } else {
    if (value.checkpoint_count !== checkpoints.length) errors.push('staging_evidence_checkpoint_capsule_checkpoint_count_mismatch');
    const seen = new Set();
    let previous = null;

    for (let index = 0; index < checkpoints.length; index += 1) {
      const checkpoint = checkpoints[index];
      const checkpointResult = previous
        ? verifyStagingEvidenceCheckpoint(checkpoint, { parentCheckpoint: previous })
        : verifyStagingEvidenceCheckpoint(checkpoint);

      if (checkpointResult.valid !== true) {
        errors.push(`staging_evidence_checkpoint_capsule_checkpoint_invalid:${index}:${checkpointResult.errors[0] || 'unknown'}`);
      }

      const checkpointDigest = String(checkpoint?.digest || '').toLowerCase();
      if (!DIGEST_RE.test(checkpointDigest)) {
        errors.push(`staging_evidence_checkpoint_capsule_checkpoint_digest_invalid:${index}`);
      } else if (seen.has(checkpointDigest)) {
        errors.push('staging_evidence_checkpoint_capsule_checkpoint_digest_reused');
      } else {
        seen.add(checkpointDigest);
      }
      previous = checkpoint;
    }

    const genesis = checkpoints[0];
    const terminal = checkpoints[checkpoints.length - 1];
    if (genesis?.sequence !== 1 || genesis?.parent_checkpoint_digest !== null || genesis?.parent_manifest_digest !== null) {
      errors.push('staging_evidence_checkpoint_capsule_genesis_invalid');
    }
    if (!sameDigest(value.genesis_checkpoint_digest, genesis?.digest)) errors.push('staging_evidence_checkpoint_capsule_genesis_digest_mismatch');
    if (!sameDigest(value.terminal_checkpoint_digest, terminal?.digest)) errors.push('staging_evidence_checkpoint_capsule_terminal_digest_mismatch');
    if (value.terminal_sequence !== terminal?.sequence) errors.push('staging_evidence_checkpoint_capsule_terminal_sequence_mismatch');

    for (const checkpoint of checkpoints) {
      if (!sameSha(value.source_sha, checkpoint?.source_sha)) errors.push('staging_evidence_checkpoint_capsule_source_sha_mismatch');
      if (value.preview_deployment_id !== checkpoint?.preview_deployment_id) errors.push('staging_evidence_checkpoint_capsule_preview_deployment_mismatch');
      if (value.production_baseline_deployment_id !== checkpoint?.production_baseline_deployment_id) errors.push('staging_evidence_checkpoint_capsule_production_baseline_mismatch');
      if (value.provider !== checkpoint?.provider) errors.push('staging_evidence_checkpoint_capsule_provider_mismatch');
      if (value.environment_id !== checkpoint?.environment_id) errors.push('staging_evidence_checkpoint_capsule_environment_mismatch');
      if (!sameDigest(value.manifest_plan_digest, checkpoint?.manifest_plan_digest)) errors.push('staging_evidence_checkpoint_capsule_manifest_plan_digest_mismatch');
      if (!sameDigest(value.reference_set_digest, checkpoint?.reference_set_digest)) errors.push('staging_evidence_checkpoint_capsule_reference_set_digest_mismatch');
    }
  }

  return {
    valid: errors.length === 0,
    portability_verified: errors.length === 0,
    activation_allowed: false,
    production_release_authorized: false,
    errors,
  };
}

function copyCheckpoint(checkpoint) {
  return {
    ...checkpoint,
    reference_digests: { ...checkpoint.reference_digests },
    authority: { ...checkpoint.authority },
  };
}

function buildStagingEvidenceCheckpointCapsule({ checkpoints }) {
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
    throw new Error('staging_evidence_checkpoint_capsule_checkpoints_invalid');
  }

  const copies = checkpoints.map(copyCheckpoint);
  let previous = null;
  for (let index = 0; index < copies.length; index += 1) {
    const checkpoint = copies[index];
    const result = previous
      ? verifyStagingEvidenceCheckpoint(checkpoint, { parentCheckpoint: previous })
      : verifyStagingEvidenceCheckpoint(checkpoint);
    if (result.valid !== true) {
      throw new Error(`staging_evidence_checkpoint_capsule_checkpoint_invalid:${index}:${result.errors[0] || 'unknown'}`);
    }
    previous = checkpoint;
  }

  const genesis = copies[0];
  const terminal = copies[copies.length - 1];
  if (genesis.sequence !== 1 || genesis.parent_checkpoint_digest !== null || genesis.parent_manifest_digest !== null) {
    throw new Error('staging_evidence_checkpoint_capsule_genesis_invalid');
  }

  const value = {
    schema_version: CHECKPOINT_CAPSULE_SCHEMA,
    project_key: 'worldstage-cherry',
    proof_level: 'checkpoint_portability_only',
    target: 'staging',
    transport_mode: 'self_contained_checkpoint_chain',
    source_sha: genesis.source_sha.toLowerCase(),
    preview_deployment_id: genesis.preview_deployment_id,
    production_baseline_deployment_id: genesis.production_baseline_deployment_id,
    provider: genesis.provider,
    environment_id: genesis.environment_id,
    manifest_plan_digest: genesis.manifest_plan_digest.toLowerCase(),
    reference_set_digest: genesis.reference_set_digest.toLowerCase(),
    checkpoint_count: copies.length,
    genesis_checkpoint_digest: genesis.digest.toLowerCase(),
    terminal_checkpoint_digest: terminal.digest.toLowerCase(),
    terminal_sequence: terminal.sequence,
    checkpoints: copies,
    underlying_evidence_embedded: false,
    confidential_data_used: false,
    production_access: false,
    activation_requested: false,
    production_release_authorized: false,
    authority: {
      activation_allowed: false,
      production_release_authorized: false,
      separate_release_review_required: true,
    },
  };

  assertNoSensitiveMaterial(value);
  const capsule = Object.freeze({ ...value, digest: digestPayload(value) });
  const verification = verifyStagingEvidenceCheckpointCapsule(capsule);
  if (verification.valid !== true) {
    throw new Error(`staging_evidence_checkpoint_capsule_build_failed:${verification.errors[0] || 'unknown'}`);
  }
  return capsule;
}

module.exports = {
  CHECKPOINT_CAPSULE_SCHEMA,
  buildStagingEvidenceCheckpointCapsule,
  verifyStagingEvidenceCheckpointCapsule,
};
