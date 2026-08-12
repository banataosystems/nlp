const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStagingEvidenceManifestPlan,
  digestPayload,
  inspectStagingEvidenceManifest,
} = require('../server/staging-evidence-manifest-contract.cjs');
const {
  CHECKPOINT_SCHEMA,
  buildStagingEvidenceCheckpoint,
  verifyStagingEvidenceCheckpoint,
} = require('../server/staging-evidence-checkpoint-contract.cjs');

const sha = '1'.repeat(40);
const preview = 'dpl_Preview123';
const production = 'dpl_Production456';
const digest = (char) => `sha256:${char.repeat(64)}`;

function plan() {
  return buildStagingEvidenceManifestPlan({
    sourceSha: sha,
    previewDeploymentId: preview,
    productionBaselineDeploymentId: production,
    stagingReadinessDigest: digest('a'),
    evidencePlanDigest: digest('b'),
  });
}

function reference(proofType, proofDigest, environmentId = 'staging-worldstage-01') {
  return {
    proof_type: proofType,
    digest: proofDigest,
    source_sha: sha,
    environment_id: environmentId,
    provider: 'provider_test',
    target: 'staging',
    outcome: 'pass',
  };
}

function manifestFor(p = plan(), environmentId = 'staging-worldstage-01') {
  const value = {
    schema_version: 'worldstage.staging-evidence-manifest.v1',
    project_key: 'worldstage-cherry',
    target: 'staging',
    provider: 'provider_test',
    environment_id: environmentId,
    source_sha: sha,
    preview_deployment_id: preview,
    production_baseline_deployment_id: production,
    staging_readiness_digest: digest('a'),
    evidence_plan_digest: digest('b'),
    manifest_plan_digest: p.digest,
    reference_only: true,
    inline_material_present: false,
    confidential_data_used: false,
    production_access: false,
    intake_control: 'disabled',
    activation_requested: false,
    production_release_authorized: false,
    references: {
      environment_binding: reference('environment_binding', digest('c'), environmentId),
      signed_user_policy: reference('signed_user_policy', digest('d'), environmentId),
      backup_restore: reference('backup_restore', digest('e'), environmentId),
      kill_switch: reference('kill_switch', digest('f'), environmentId),
    },
  };
  return { ...value, digest: digestPayload(value) };
}

function redigest(candidate) {
  const { digest: _old, ...value } = candidate;
  candidate.digest = digestPayload(value);
  return candidate;
}

test('genesis checkpoint is content-addressed, reference-only, and never grants authority', () => {
  const p = plan();
  const manifest = manifestFor(p);
  const checkpoint = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p });
  const result = verifyStagingEvidenceCheckpoint(checkpoint, { manifest, manifestPlan: p });

  assert.equal(checkpoint.schema_version, CHECKPOINT_SCHEMA);
  assert.equal(checkpoint.sequence, 1);
  assert.equal(checkpoint.parent_checkpoint_digest, null);
  assert.equal(checkpoint.parent_manifest_digest, null);
  assert.equal(checkpoint.reference_replacement_allowed, false);
  assert.equal(result.valid, true);
  assert.equal(result.continuity_verified, true);
  assert.equal(result.activation_allowed, false);
  assert.equal(result.production_release_authorized, false);
});

test('a child checkpoint links exactly to its parent and preserves the manifest reference set', () => {
  const p = plan();
  const manifest = manifestFor(p);
  const parent = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p });
  const child = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p, parentCheckpoint: parent });
  const result = verifyStagingEvidenceCheckpoint(child, { manifest, manifestPlan: p, parentCheckpoint: parent });

  assert.equal(child.sequence, 2);
  assert.equal(child.parent_checkpoint_digest, parent.digest);
  assert.equal(child.parent_manifest_digest, parent.manifest_digest);
  assert.equal(child.reference_set_digest, parent.reference_set_digest);
  assert.equal(result.valid, true);
});

test('proof-reference replacement is detected even when the replacement manifest is internally valid', () => {
  const p = plan();
  const manifest = manifestFor(p);
  const parent = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p });
  const replaced = manifestFor(p);
  replaced.references.kill_switch.digest = digest('9');
  redigest(replaced);

  assert.equal(inspectStagingEvidenceManifest(replaced, p).valid, true);
  assert.throws(
    () => buildStagingEvidenceCheckpoint({ manifest: replaced, manifestPlan: p, parentCheckpoint: parent }),
    /staging_evidence_checkpoint_reference_replacement_detected:kill_switch/,
  );
});

test('environment continuity drift is rejected even when all manifest references drift together', () => {
  const p = plan();
  const manifest = manifestFor(p);
  const parent = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p });
  const moved = manifestFor(p, 'staging-worldstage-02');

  assert.equal(inspectStagingEvidenceManifest(moved, p).valid, true);
  assert.throws(
    () => buildStagingEvidenceCheckpoint({ manifest: moved, manifestPlan: p, parentCheckpoint: parent }),
    /staging_evidence_checkpoint_continuity_field_changed:environment_id/,
  );
});

test('checkpoint digest tampering fails closed', () => {
  const p = plan();
  const manifest = manifestFor(p);
  const checkpoint = structuredClone(buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p }));
  checkpoint.sequence = 2;

  const result = verifyStagingEvidenceCheckpoint(checkpoint, { manifest, manifestPlan: p });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('staging_evidence_checkpoint_digest_mismatch'));
});

test('a redigested child cannot forge parent linkage or sequence continuity', () => {
  const p = plan();
  const manifest = manifestFor(p);
  const parent = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p });
  const child = structuredClone(buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p, parentCheckpoint: parent }));
  child.sequence = 9;
  child.parent_checkpoint_digest = digest('8');
  redigest(child);

  const result = verifyStagingEvidenceCheckpoint(child, { manifest, manifestPlan: p, parentCheckpoint: parent });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('staging_evidence_checkpoint_sequence_discontinuity'));
  assert.ok(result.errors.includes('staging_evidence_checkpoint_parent_checkpoint_mismatch'));
});

test('extra material, credential-shaped fields, and authority escalation are rejected', () => {
  const p = plan();
  const manifest = manifestFor(p);

  const extra = structuredClone(buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p }));
  extra.notes = 'not durable evidence';
  redigest(extra);
  assert.equal(verifyStagingEvidenceCheckpoint(extra).valid, false);

  const sensitive = structuredClone(buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p }));
  sensitive.artifact_url = 'https://example.invalid/evidence';
  redigest(sensitive);
  const sensitiveResult = verifyStagingEvidenceCheckpoint(sensitive);
  assert.equal(sensitiveResult.valid, false);
  assert.ok(sensitiveResult.errors.some((entry) => entry.includes('sensitive_field')));

  const authority = structuredClone(buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p }));
  authority.authority.activation_allowed = true;
  redigest(authority);
  assert.equal(verifyStagingEvidenceCheckpoint(authority).valid, false);
});
