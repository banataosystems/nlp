const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assertNoSecretMaterial,
  buildDeploymentIsolationCapsule,
  verifyDeploymentIsolationCapsule,
} = require('../server/deployment-isolation-contract.cjs');

const stagingDigest = `sha256:${'a'.repeat(64)}`;
const visualDigest = `sha256:${'b'.repeat(64)}`;
const sourceSha = 'dd56fd151df6bc64126d0850fced7112d3922b9e';

function build(overrides = {}) {
  return buildDeploymentIsolationCapsule({
    sourceSha,
    previewDeploymentId: 'dpl_preview123',
    previewGitSha: sourceSha,
    productionBaselineDeploymentId: 'dpl_production123',
    stagingReadinessDigest: stagingDigest,
    visualEvidenceDigest: visualDigest,
    ...overrides,
  });
}

test('capsule proves preview-only deployment isolation without authorizing release', () => {
  const capsule = build();
  const verification = verifyDeploymentIsolationCapsule(capsule);
  assert.equal(verification.valid, true, verification.errors.join(','));
  assert.equal(capsule.proof_level, 'preview_deployed');
  assert.equal(capsule.candidate.target, null);
  assert.equal(capsule.candidate.source_sha, capsule.candidate.git_sha);
  assert.equal(capsule.production_baseline.target, 'production');
  assert.equal(capsule.production_baseline.promotion_performed, false);
  assert.equal(capsule.fail_closed_state.release_authorized, false);
  assert.equal(capsule.fail_closed_state.intake_control, 'disabled');
});

test('candidate SHA must exactly match the preview Git SHA', () => {
  assert.throws(() => build({ previewGitSha: '11defe4b82422d91cec4f729b8c9e0a6e80e5c9d' }), /preview_git_sha_mismatch/);
});

test('candidate and production deployment IDs must remain distinct', () => {
  assert.throws(() => build({
    previewDeploymentId: 'dpl_same123',
    productionBaselineDeploymentId: 'dpl_same123',
  }), /deployments_must_differ/);
});

test('production targeting or promotion cannot be represented as preview proof', () => {
  assert.throws(() => build({ previewTarget: 'production' }), /preview_target_must_be_null/);
  assert.throws(() => build({ productionPromotionPerformed: true }), /production_promotion_must_be_false/);
  assert.throws(() => build({ releaseAuthorized: true }), /release_authority_must_be_false/);
});

test('fail-closed intake and confidential-data state are mandatory', () => {
  assert.throws(() => build({ intakeControl: 'enabled' }), /intake_must_be_disabled/);
  assert.throws(() => build({ confidentialIntakeActive: true }), /confidential_intake_must_be_inactive/);
});

test('tampering invalidates the digest and isolation checks', () => {
  const capsule = structuredClone(build());
  capsule.production_baseline.promotion_performed = true;
  const verification = verifyDeploymentIsolationCapsule(capsule);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('deployment_isolation_digest_mismatch'));
  assert.ok(verification.errors.includes('deployment_isolation_production_promotion_must_be_false'));
});

test('exact-head evidence digests must be content-addressed', () => {
  assert.throws(() => build({ stagingReadinessDigest: 'latest' }), /staging_digest_invalid/);
  assert.throws(() => build({ visualEvidenceDigest: 'sha256:broken' }), /visual_digest_invalid/);
});

test('secret-shaped fields are rejected anywhere in deployment evidence', () => {
  assert.throws(() => assertNoSecretMaterial({ provider: { api_key: 'x' } }), /secret_field/);
  assert.throws(() => assertNoSecretMaterial({ auth: { accessToken: 'x' } }), /secret_field/);
  assert.doesNotThrow(() => assertNoSecretMaterial({ deployment_id: 'dpl_preview123', target: null }));
});

test('verification rejects a validly-shaped but production-capable mutation', () => {
  const capsule = structuredClone(build());
  capsule.candidate.target = 'production';
  capsule.fail_closed_state.intake_control = 'enabled';
  const verification = verifyDeploymentIsolationCapsule(capsule);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('deployment_isolation_digest_mismatch'));
  assert.ok(verification.errors.includes('deployment_isolation_preview_target_must_be_null'));
  assert.ok(verification.errors.includes('deployment_isolation_intake_must_be_disabled'));
});
