const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStagingEvidenceManifestPlan,
  digestPayload,
} = require('../server/staging-evidence-manifest-contract.cjs');
const {
  buildStagingEvidenceCheckpoint,
} = require('../server/staging-evidence-checkpoint-contract.cjs');
const {
  CHECKPOINT_CAPSULE_SCHEMA,
  buildStagingEvidenceCheckpointCapsule,
  verifyStagingEvidenceCheckpointCapsule,
} = require('../server/staging-evidence-checkpoint-capsule-contract.cjs');

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

function manifestFor(p = plan()) {
  const value = {
    schema_version: 'worldstage.staging-evidence-manifest.v1',
    project_key: 'worldstage-cherry',
    target: 'staging',
    provider: 'provider_test',
    environment_id: 'staging-worldstage-01',
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
      environment_binding: reference('environment_binding', digest('c')),
      signed_user_policy: reference('signed_user_policy', digest('d')),
      backup_restore: reference('backup_restore', digest('e')),
      kill_switch: reference('kill_switch', digest('f')),
    },
  };
  return { ...value, digest: digestPayload(value) };
}

function lineage() {
  const p = plan();
  const manifest = manifestFor(p);
  const genesis = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p });
  const child = buildStagingEvidenceCheckpoint({ manifest, manifestPlan: p, parentCheckpoint: genesis });
  return { p, manifest, genesis, child };
}

function redigest(candidate) {
  const { digest: _old, ...value } = candidate;
  candidate.digest = digestPayload(value);
  return candidate;
}

test('a complete checkpoint lineage exports as a deterministic self-contained portability capsule', () => {
  const { genesis, child } = lineage();
  const capsule = buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, child] });
  const result = verifyStagingEvidenceCheckpointCapsule(capsule);

  assert.equal(capsule.schema_version, CHECKPOINT_CAPSULE_SCHEMA);
  assert.equal(capsule.checkpoint_count, 2);
  assert.equal(capsule.genesis_checkpoint_digest, genesis.digest);
  assert.equal(capsule.terminal_checkpoint_digest, child.digest);
  assert.equal(capsule.terminal_sequence, 2);
  assert.equal(capsule.underlying_evidence_embedded, false);
  assert.equal(result.valid, true);
  assert.equal(result.portability_verified, true);
  assert.equal(result.activation_allowed, false);
  assert.equal(result.production_release_authorized, false);
});

test('capsule digest tampering fails closed', () => {
  const { genesis, child } = lineage();
  const capsule = structuredClone(buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, child] }));
  capsule.terminal_sequence = 9;

  const result = verifyStagingEvidenceCheckpointCapsule(capsule);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('staging_evidence_checkpoint_capsule_digest_mismatch'));
  assert.ok(result.errors.includes('staging_evidence_checkpoint_capsule_terminal_sequence_mismatch'));
});

test('a missing ancestor cannot be exported as a valid chain', () => {
  const { child } = lineage();
  assert.throws(
    () => buildStagingEvidenceCheckpointCapsule({ checkpoints: [child] }),
    /staging_evidence_checkpoint_capsule_checkpoint_invalid:0/,
  );
});

test('reordered checkpoints fail continuity verification', () => {
  const { genesis, child } = lineage();
  assert.throws(
    () => buildStagingEvidenceCheckpointCapsule({ checkpoints: [child, genesis] }),
    /staging_evidence_checkpoint_capsule_checkpoint_invalid:0/,
  );
});

test('a redigested replacement checkpoint cannot forge a transported lineage', () => {
  const { genesis, child } = lineage();
  const replaced = structuredClone(child);
  replaced.sequence = 3;
  redigest(replaced);

  assert.throws(
    () => buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, replaced] }),
    /staging_evidence_checkpoint_capsule_checkpoint_invalid:1/,
  );
});

test('extra material and authority escalation are rejected even when the capsule is redigested', () => {
  const { genesis, child } = lineage();

  const extra = structuredClone(buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, child] }));
  extra.notes = 'not part of the portability contract';
  redigest(extra);
  assert.equal(verifyStagingEvidenceCheckpointCapsule(extra).valid, false);

  const sensitive = structuredClone(buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, child] }));
  sensitive.artifact_url = 'https://example.invalid/evidence';
  redigest(sensitive);
  const sensitiveResult = verifyStagingEvidenceCheckpointCapsule(sensitive);
  assert.equal(sensitiveResult.valid, false);
  assert.ok(sensitiveResult.errors.some((entry) => entry.includes('sensitive_field')));

  const authority = structuredClone(buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, child] }));
  authority.authority.activation_allowed = true;
  redigest(authority);
  assert.equal(verifyStagingEvidenceCheckpointCapsule(authority).valid, false);
});

test('capsule metadata cannot drift away from the embedded checkpoint lineage', () => {
  const { genesis, child } = lineage();
  const capsule = structuredClone(buildStagingEvidenceCheckpointCapsule({ checkpoints: [genesis, child] }));
  capsule.environment_id = 'staging-worldstage-99';
  redigest(capsule);

  const result = verifyStagingEvidenceCheckpointCapsule(capsule);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('staging_evidence_checkpoint_capsule_environment_mismatch'));
});
