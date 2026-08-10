const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REQUIRED_PROOF_TYPES,
  buildLiveStagingEvidencePlan,
  digestPayload,
  inspectLiveStagingEvidencePackage,
  verifyLiveStagingEvidencePlan,
} = require('../server/live-staging-evidence-aggregator.cjs');

const sha = '1'.repeat(40);
const preview = 'dpl_Preview123';
const production = 'dpl_Production456';
const digest = (char) => `sha256:${char.repeat(64)}`;

function plan() {
  return buildLiveStagingEvidencePlan({
    sourceSha: sha,
    previewDeploymentId: preview,
    productionBaselineDeploymentId: production,
    stagingReadinessDigest: digest('a'),
  });
}

function passingProof(type, proofDigest) {
  const common = {
    proof_type: type,
    digest: proofDigest,
    source_sha: sha,
    environment_id: 'staging-worldstage-01',
    target: 'staging',
    outcome: 'pass',
    production_access: false,
    confidential_data_used: false,
  };
  if (type === 'environment_binding') return { ...common, provider_bound: true };
  if (type === 'signed_user_policy') return { ...common, synthetic_only: true, cleanup_verified: true };
  if (type === 'backup_restore') return { ...common, synthetic_only: true, cleanup_verified: true, restore_target: 'staging', production_restore: false, post_restore_control: 'disabled' };
  return { ...common, cleanup_verified: true, disabled_state_verified: true, enable_requires_readiness: true, audit_transactional: true };
}

function packageFor(p = plan()) {
  const payload = {
    schema_version: 'worldstage.live-staging-evidence-package.v1',
    project_key: 'worldstage-cherry',
    target: 'staging',
    provider: 'provider_test',
    environment_id: 'staging-worldstage-01',
    source_sha: sha,
    preview_deployment_id: preview,
    production_baseline_deployment_id: production,
    staging_readiness_digest: digest('a'),
    evidence_plan_digest: p.digest,
    confidential_data_used: false,
    production_access: false,
    intake_control: 'disabled',
    cleanup_verified: true,
    activation_requested: false,
    production_release_authorized: false,
    proofs: {
      environment_binding: passingProof('environment_binding', digest('b')),
      signed_user_policy: passingProof('signed_user_policy', digest('c')),
      backup_restore: passingProof('backup_restore', digest('d')),
      kill_switch: passingProof('kill_switch', digest('e')),
    },
  };
  return { ...payload, digest: digestPayload(payload) };
}

test('plan is fail closed and tamper evident', () => {
  const p = plan();
  assert.equal(verifyLiveStagingEvidencePlan(p).valid, true);
  assert.equal(p.current_state.live_staging_created, false);
  assert.equal(p.activation.allowed, false);
  assert.equal(p.activation.production_release_authorized, false);
  const tampered = structuredClone(p);
  tampered.current_state.provider_bound = true;
  assert.equal(verifyLiveStagingEvidencePlan(tampered).valid, false);
});

test('complete candidate package validates structurally but cannot activate or release', () => {
  const p = plan();
  const result = inspectLiveStagingEvidencePackage(packageFor(p), p);
  assert.deepEqual(REQUIRED_PROOF_TYPES, ['environment_binding', 'signed_user_policy', 'backup_restore', 'kill_switch']);
  assert.equal(result.valid, true);
  assert.equal(result.staging_evidence_complete, true);
  assert.equal(result.activation_allowed, false);
  assert.equal(result.production_release_authorized, false);
});

test('source or environment drift fails closed', () => {
  const p = plan();
  const sourceDrift = packageFor(p);
  sourceDrift.source_sha = '2'.repeat(40);
  sourceDrift.digest = digestPayload(Object.fromEntries(Object.entries(sourceDrift).filter(([key]) => key !== 'digest')));
  assert.equal(inspectLiveStagingEvidencePackage(sourceDrift, p).valid, false);

  const environmentDrift = packageFor(p);
  environmentDrift.proofs.signed_user_policy.environment_id = 'other-staging';
  environmentDrift.digest = digestPayload(Object.fromEntries(Object.entries(environmentDrift).filter(([key]) => key !== 'digest')));
  assert.equal(inspectLiveStagingEvidencePackage(environmentDrift, p).valid, false);
});

test('missing proof, reused digest, or failed proof is rejected', () => {
  const p = plan();
  const missing = packageFor(p);
  delete missing.proofs.backup_restore;
  missing.digest = digestPayload(Object.fromEntries(Object.entries(missing).filter(([key]) => key !== 'digest')));
  assert.equal(inspectLiveStagingEvidencePackage(missing, p).valid, false);

  const reused = packageFor(p);
  reused.proofs.kill_switch.digest = reused.proofs.environment_binding.digest;
  reused.digest = digestPayload(Object.fromEntries(Object.entries(reused).filter(([key]) => key !== 'digest')));
  assert.equal(inspectLiveStagingEvidencePackage(reused, p).valid, false);

  const failed = packageFor(p);
  failed.proofs.kill_switch.outcome = 'fail';
  failed.digest = digestPayload(Object.fromEntries(Object.entries(failed).filter(([key]) => key !== 'digest')));
  assert.equal(inspectLiveStagingEvidencePackage(failed, p).valid, false);
});

test('unsafe production, confidential, activation, or incomplete recovery/control proof is rejected', () => {
  const p = plan();
  for (const mutate of [
    (x) => { x.production_access = true; },
    (x) => { x.confidential_data_used = true; },
    (x) => { x.activation_requested = true; },
    (x) => { x.production_release_authorized = true; },
    (x) => { x.proofs.backup_restore.production_restore = true; },
    (x) => { x.proofs.backup_restore.post_restore_control = 'enabled'; },
    (x) => { x.proofs.kill_switch.enable_requires_readiness = false; },
    (x) => { x.proofs.kill_switch.audit_transactional = false; },
  ]) {
    const candidate = packageFor(p);
    mutate(candidate);
    candidate.digest = digestPayload(Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== 'digest')));
    assert.equal(inspectLiveStagingEvidencePackage(candidate, p).valid, false);
  }
});

test('credential-shaped and free-form sensitive evidence fields are rejected', () => {
  const p = plan();
  const candidate = packageFor(p);
  candidate.proofs.environment_binding.api_key = 'not-a-real-key';
  candidate.digest = digestPayload(Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== 'digest')));
  const result = inspectLiveStagingEvidencePackage(candidate, p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.includes('sensitive_field')));
});

test('package digest is tamper evident', () => {
  const p = plan();
  const candidate = packageFor(p);
  candidate.cleanup_verified = false;
  const result = inspectLiveStagingEvidencePackage(candidate, p);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('live_staging_evidence_package_digest_mismatch'));
});
