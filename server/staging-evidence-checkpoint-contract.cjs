const {
  REQUIRED_PROOF_TYPES,
  assertNoSensitiveMaterial,
  canonicalize,
  digestPayload,
  inspectStagingEvidenceManifest,
} = require('./staging-evidence-manifest-contract.cjs');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const PROVIDER_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/i;
const ENV_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;

const CHECKPOINT_SCHEMA = 'worldstage.staging-evidence-checkpoint.v1';
const CONTINUITY_FIELDS = Object.freeze([
  'source_sha',
  'preview_deployment_id',
  'production_baseline_deployment_id',
  'provider',
  'environment_id',
  'manifest_plan_digest',
]);

const CHECKPOINT_KEYS = Object.freeze([
  'schema_version',
  'project_key',
  'proof_level',
  'target',
  'source_sha',
  'preview_deployment_id',
  'production_baseline_deployment_id',
  'provider',
  'environment_id',
  'manifest_plan_digest',
  'manifest_digest',
  'reference_digests',
  'reference_set_digest',
  'sequence',
  'parent_checkpoint_digest',
  'parent_manifest_digest',
  'continuity_mode',
  'reference_replacement_allowed',
  'confidential_data_used',
  'production_access',
  'activation_requested',
  'production_release_authorized',
  'authority',
  'digest',
]);

function referenceDigests(manifest) {
  const result = {};
  for (const type of REQUIRED_PROOF_TYPES) {
    result[type] = String(manifest?.references?.[type]?.digest || '').toLowerCase();
  }
  return result;
}

function sameValue(field, left, right) {
  if (field.endsWith('_digest') || field === 'source_sha') {
    return String(left || '').toLowerCase() === String(right || '').toLowerCase();
  }
  return left === right;
}

function inspectCheckpointShape(value, errors) {
  const keys = Object.keys(value).sort();
  if (canonicalize(keys) !== canonicalize([...CHECKPOINT_KEYS].sort())) {
    errors.push('staging_evidence_checkpoint_fields_invalid');
  }

  if (value.schema_version !== CHECKPOINT_SCHEMA) errors.push('staging_evidence_checkpoint_schema_invalid');
  if (value.project_key !== 'worldstage-cherry') errors.push('staging_evidence_checkpoint_project_invalid');
  if (value.proof_level !== 'reference_continuity_only') errors.push('staging_evidence_checkpoint_proof_level_invalid');
  if (value.target !== 'staging') errors.push('staging_evidence_checkpoint_target_invalid');
  if (!SHA_RE.test(value.source_sha || '')) errors.push('staging_evidence_checkpoint_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(value.preview_deployment_id || '')) errors.push('staging_evidence_checkpoint_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(value.production_baseline_deployment_id || '')) errors.push('staging_evidence_checkpoint_production_baseline_invalid');
  if (value.preview_deployment_id && value.preview_deployment_id === value.production_baseline_deployment_id) errors.push('staging_evidence_checkpoint_deployments_must_differ');
  if (!PROVIDER_RE.test(value.provider || '') || /^unbound$/i.test(value.provider || '')) errors.push('staging_evidence_checkpoint_provider_invalid');
  if (!ENV_ID_RE.test(value.environment_id || '') || /^unbound$/i.test(value.environment_id || '')) errors.push('staging_evidence_checkpoint_environment_invalid');
  if (!DIGEST_RE.test(value.manifest_plan_digest || '')) errors.push('staging_evidence_checkpoint_manifest_plan_digest_invalid');
  if (!DIGEST_RE.test(value.manifest_digest || '')) errors.push('staging_evidence_checkpoint_manifest_digest_invalid');
  if (!DIGEST_RE.test(value.reference_set_digest || '')) errors.push('staging_evidence_checkpoint_reference_set_digest_invalid');

  const refs = value.reference_digests;
  if (!refs || typeof refs !== 'object' || Array.isArray(refs)) {
    errors.push('staging_evidence_checkpoint_reference_digests_invalid');
  } else {
    const keys = Object.keys(refs).sort();
    if (canonicalize(keys) !== canonicalize([...REQUIRED_PROOF_TYPES].sort())) errors.push('staging_evidence_checkpoint_reference_digests_invalid');
    const digests = [];
    for (const type of REQUIRED_PROOF_TYPES) {
      const proofDigest = refs[type];
      if (!DIGEST_RE.test(proofDigest || '')) errors.push(`staging_evidence_checkpoint_reference_digest_invalid:${type}`);
      else digests.push(proofDigest.toLowerCase());
    }
    if (new Set(digests).size !== digests.length) errors.push('staging_evidence_checkpoint_reference_digests_must_be_distinct');
    if (value.reference_set_digest !== digestPayload(refs)) errors.push('staging_evidence_checkpoint_reference_set_digest_mismatch');
  }

  if (!Number.isInteger(value.sequence) || value.sequence < 1) errors.push('staging_evidence_checkpoint_sequence_invalid');
  if (value.sequence === 1) {
    if (value.parent_checkpoint_digest !== null) errors.push('staging_evidence_checkpoint_genesis_parent_checkpoint_must_be_null');
    if (value.parent_manifest_digest !== null) errors.push('staging_evidence_checkpoint_genesis_parent_manifest_must_be_null');
  } else {
    if (!DIGEST_RE.test(value.parent_checkpoint_digest || '')) errors.push('staging_evidence_checkpoint_parent_checkpoint_digest_invalid');
    if (!DIGEST_RE.test(value.parent_manifest_digest || '')) errors.push('staging_evidence_checkpoint_parent_manifest_digest_invalid');
  }

  if (value.continuity_mode !== 'immutable_reference_set') errors.push('staging_evidence_checkpoint_continuity_mode_invalid');
  if (value.reference_replacement_allowed !== false) errors.push('staging_evidence_checkpoint_reference_replacement_must_be_false');
  if (value.confidential_data_used !== false) errors.push('staging_evidence_checkpoint_confidential_data_forbidden');
  if (value.production_access !== false) errors.push('staging_evidence_checkpoint_production_access_forbidden');
  if (value.activation_requested !== false) errors.push('staging_evidence_checkpoint_activation_must_be_false');
  if (value.production_release_authorized !== false) errors.push('staging_evidence_checkpoint_production_release_must_be_unauthorized');

  const authority = value.authority;
  if (!authority || typeof authority !== 'object' || Array.isArray(authority)) {
    errors.push('staging_evidence_checkpoint_authority_invalid');
  } else {
    const authorityKeys = Object.keys(authority).sort();
    if (canonicalize(authorityKeys) !== canonicalize(['activation_allowed', 'production_release_authorized', 'separate_release_review_required'].sort())) errors.push('staging_evidence_checkpoint_authority_fields_invalid');
    if (authority.activation_allowed !== false) errors.push('staging_evidence_checkpoint_activation_authority_forbidden');
    if (authority.production_release_authorized !== false) errors.push('staging_evidence_checkpoint_release_authority_forbidden');
    if (authority.separate_release_review_required !== true) errors.push('staging_evidence_checkpoint_separate_release_review_required');
  }
}

function verifyStagingEvidenceCheckpoint(checkpoint, options = {}) {
  const errors = [];
  if (!checkpoint || typeof checkpoint !== 'object' || Array.isArray(checkpoint)) {
    return { valid: false, continuity_verified: false, activation_allowed: false, production_release_authorized: false, errors: ['staging_evidence_checkpoint_invalid'] };
  }

  try { assertNoSensitiveMaterial(checkpoint); } catch (error) { errors.push(error.message); }

  const { digest, ...value } = checkpoint;
  const shapeValue = { ...value, digest };
  inspectCheckpointShape(shapeValue, errors);
  if (!DIGEST_RE.test(digest || '') || digest !== digestPayload(value)) errors.push('staging_evidence_checkpoint_digest_mismatch');

  const hasManifest = options.manifest !== undefined;
  const hasPlan = options.manifestPlan !== undefined;
  if (hasManifest !== hasPlan) {
    errors.push('staging_evidence_checkpoint_manifest_and_plan_required_together');
  } else if (hasManifest && hasPlan) {
    const manifestResult = inspectStagingEvidenceManifest(options.manifest, options.manifestPlan);
    if (manifestResult.valid !== true) {
      errors.push('staging_evidence_checkpoint_manifest_invalid');
    } else {
      const manifest = options.manifest;
      const refs = referenceDigests(manifest);
      for (const field of CONTINUITY_FIELDS) {
        const manifestField = field === 'manifest_plan_digest' ? manifest.manifest_plan_digest : manifest[field];
        if (!sameValue(field, value[field], manifestField)) errors.push(`staging_evidence_checkpoint_manifest_field_mismatch:${field}`);
      }
      if (String(value.manifest_digest || '').toLowerCase() !== String(manifest.digest || '').toLowerCase()) errors.push('staging_evidence_checkpoint_manifest_digest_mismatch');
      if (canonicalize(value.reference_digests) !== canonicalize(refs)) errors.push('staging_evidence_checkpoint_reference_set_mismatch');
      if (value.reference_set_digest !== digestPayload(refs)) errors.push('staging_evidence_checkpoint_reference_set_digest_mismatch');
    }
  }

  if (options.parentCheckpoint !== undefined && options.parentCheckpoint !== null) {
    const parent = options.parentCheckpoint;
    const parentResult = verifyStagingEvidenceCheckpoint(parent);
    if (parentResult.valid !== true) {
      errors.push('staging_evidence_checkpoint_parent_invalid');
    } else {
      if (value.sequence !== parent.sequence + 1) errors.push('staging_evidence_checkpoint_sequence_discontinuity');
      if (String(value.parent_checkpoint_digest || '').toLowerCase() !== String(parent.digest || '').toLowerCase()) errors.push('staging_evidence_checkpoint_parent_checkpoint_mismatch');
      if (String(value.parent_manifest_digest || '').toLowerCase() !== String(parent.manifest_digest || '').toLowerCase()) errors.push('staging_evidence_checkpoint_parent_manifest_mismatch');
      for (const field of CONTINUITY_FIELDS) {
        if (!sameValue(field, value[field], parent[field])) errors.push(`staging_evidence_checkpoint_continuity_field_changed:${field}`);
      }
      for (const type of REQUIRED_PROOF_TYPES) {
        if (String(value.reference_digests?.[type] || '').toLowerCase() !== String(parent.reference_digests?.[type] || '').toLowerCase()) errors.push(`staging_evidence_checkpoint_reference_replacement_detected:${type}`);
      }
      if (String(value.reference_set_digest || '').toLowerCase() !== String(parent.reference_set_digest || '').toLowerCase()) errors.push('staging_evidence_checkpoint_reference_set_replacement_detected');
      if (String(value.manifest_digest || '').toLowerCase() !== String(parent.manifest_digest || '').toLowerCase()) errors.push('staging_evidence_checkpoint_manifest_replacement_detected');
    }
  }

  return {
    valid: errors.length === 0,
    continuity_verified: errors.length === 0,
    activation_allowed: false,
    production_release_authorized: false,
    errors,
  };
}

function buildStagingEvidenceCheckpoint({ manifest, manifestPlan, parentCheckpoint = null }) {
  const manifestResult = inspectStagingEvidenceManifest(manifest, manifestPlan);
  if (manifestResult.valid !== true) {
    throw new Error(`staging_evidence_checkpoint_manifest_invalid:${manifestResult.errors[0] || 'unknown'}`);
  }

  if (parentCheckpoint !== null) {
    const parentResult = verifyStagingEvidenceCheckpoint(parentCheckpoint);
    if (parentResult.valid !== true) throw new Error(`staging_evidence_checkpoint_parent_invalid:${parentResult.errors[0] || 'unknown'}`);

    const refs = referenceDigests(manifest);
    for (const type of REQUIRED_PROOF_TYPES) {
      if (String(parentCheckpoint.reference_digests?.[type] || '').toLowerCase() !== refs[type]) {
        throw new Error(`staging_evidence_checkpoint_reference_replacement_detected:${type}`);
      }
    }
    for (const field of CONTINUITY_FIELDS) {
      const manifestField = field === 'manifest_plan_digest' ? manifest.manifest_plan_digest : manifest[field];
      if (!sameValue(field, parentCheckpoint[field], manifestField)) {
        throw new Error(`staging_evidence_checkpoint_continuity_field_changed:${field}`);
      }
    }
    if (String(parentCheckpoint.manifest_digest || '').toLowerCase() !== String(manifest.digest || '').toLowerCase()) {
      throw new Error('staging_evidence_checkpoint_manifest_replacement_detected');
    }
  }

  const refs = referenceDigests(manifest);
  const value = {
    schema_version: CHECKPOINT_SCHEMA,
    project_key: 'worldstage-cherry',
    proof_level: 'reference_continuity_only',
    target: 'staging',
    source_sha: manifest.source_sha.toLowerCase(),
    preview_deployment_id: manifest.preview_deployment_id,
    production_baseline_deployment_id: manifest.production_baseline_deployment_id,
    provider: manifest.provider,
    environment_id: manifest.environment_id,
    manifest_plan_digest: manifest.manifest_plan_digest.toLowerCase(),
    manifest_digest: manifest.digest.toLowerCase(),
    reference_digests: refs,
    reference_set_digest: digestPayload(refs),
    sequence: parentCheckpoint ? parentCheckpoint.sequence + 1 : 1,
    parent_checkpoint_digest: parentCheckpoint ? parentCheckpoint.digest.toLowerCase() : null,
    parent_manifest_digest: parentCheckpoint ? parentCheckpoint.manifest_digest.toLowerCase() : null,
    continuity_mode: 'immutable_reference_set',
    reference_replacement_allowed: false,
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
  const checkpoint = Object.freeze({ ...value, digest: digestPayload(value) });
  const verification = verifyStagingEvidenceCheckpoint(checkpoint, { manifest, manifestPlan, parentCheckpoint });
  if (verification.valid !== true) throw new Error(`staging_evidence_checkpoint_build_failed:${verification.errors[0] || 'unknown'}`);
  return checkpoint;
}

module.exports = {
  CHECKPOINT_SCHEMA,
  buildStagingEvidenceCheckpoint,
  referenceDigests,
  verifyStagingEvidenceCheckpoint,
};
