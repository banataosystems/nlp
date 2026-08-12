const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REQUIRED_PROOF_TYPES,
  buildStagingEvidenceManifestPlan,
  digestPayload,
  inspectStagingEvidenceManifest,
  verifyStagingEvidenceManifestPlan,
} = require('../server/staging-evidence-manifest-contract.cjs');

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

function reference(proofType, proofDigest) {
  return {
    proof_type: proofType,
    digest: proofDigest,
    source_sha: sha,
    environment_id: 'staging-worldstage-01',
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

function redigest(candidate) {
  const { digest: _old, ...value } = candidate;
  candidate.digest = digestPayload(value);
  return candidate;
}

test('manifest plan is fail closed and tamper evident', () => {
  const p = plan();
  assert.equal(verifyStagingEvidenceManifestPlan(p).valid, true);
  assert.deepEqual(REQUIRED_PROOF_TYPES, ['environment_binding', 'signed_user_policy', 'backup_restore', 'kill_switch']);
  assert.equal(p.current_state.live_staging_created, false);
  assert.equal(p.current_state.evidence_captured, false);
  assert.equal(p.authority.activation_allowed, false);
  assert.equal(p.authority.production_release_authorized, false);

  const tampered = structuredClone(p);
  tampered.authority.activation_allowed = true;
  assert.equal(verifyStagingEvidenceManifestPlan(tampered).valid, false);
});

test('complete reference-only manifest validates structurally but never authorizes activation', () => {
  const result = inspectStagingEvidenceManifest(manifestFor(), plan());
  assert.equal(result.valid, true);
  assert.equal(result.evidence_capture_complete, true);
  assert.equal(result.activation_allowed, false);
  assert.equal(result.production_release_authorized, false);
});

test('missing, duplicated, or reused proof references fail closed', () => {
  const p = plan();

  const missing = manifestFor(p);
  delete missing.references.backup_restore;
  redigest(missing);
  assert.equal(inspectStagingEvidenceManifest(missing, p).valid, false);

  const reused = manifestFor(p);
  reused.references.kill_switch.digest = reused.references.environment_binding.digest;
  redigest(reused);
  assert.equal(inspectStagingEvidenceManifest(reused, p).valid, false);

  const extra = manifestFor(p);
  extra.references.extra = reference('extra', digest('9'));
  redigest(extra);
  assert.equal(inspectStagingEvidenceManifest(extra, p).valid, false);
});

test('source, environment, provider, and outcome drift are rejected', () => {
  const p = plan();
  for (const mutate of [
    (x) => { x.source_sha = '2'.repeat(40); },
    (x) => { x.references.signed_user_policy.environment_id = 'other-staging'; },
    (x) => { x.references.backup_restore.provider = 'other_provider'; },
    (x) => { x.references.kill_switch.outcome = 'fail'; },
  ]) {
    const candidate = manifestFor(p);
    mutate(candidate);
    redigest(candidate);
    assert.equal(inspectStagingEvidenceManifest(candidate, p).valid, false);
  }
});

test('production, confidential-data, inline-material, and authority claims are rejected', () => {
  const p = plan();
  for (const mutate of [
    (x) => { x.production_access = true; },
    (x) => { x.confidential_data_used = true; },
    (x) => { x.inline_material_present = true; },
    (x) => { x.intake_control = 'enabled'; },
    (x) => { x.activation_requested = true; },
    (x) => { x.production_release_authorized = true; },
  ]) {
    const candidate = manifestFor(p);
    mutate(candidate);
    redigest(candidate);
    assert.equal(inspectStagingEvidenceManifest(candidate, p).valid, false);
  }
});

test('credential-shaped, location, or raw evidence fields are rejected', () => {
  const p = plan();
  for (const field of ['api_key', 'artifact_url', 'raw_blob']) {
    const candidate = manifestFor(p);
    candidate.references.environment_binding[field] = 'not-real-evidence';
    redigest(candidate);
    const result = inspectStagingEvidenceManifest(candidate, p);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((entry) => entry.includes('sensitive_field')));
  }
});

test('manifest digest is tamper evident', () => {
  const p = plan();
  const candidate = manifestFor(p);
  candidate.reference_only = false;
  const result = inspectStagingEvidenceManifest(candidate, p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('staging_evidence_manifest_digest_mismatch'));
});
