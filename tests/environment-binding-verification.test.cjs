const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assertNoSecretMaterial,
  buildEnvironmentBindingPlan,
  inspectCandidateBindingEvidence,
  verifyEnvironmentBindingPlan,
} = require('../server/environment-binding-verification.cjs');

const sha = '28c3b7adec16722f9b0f04e899e63340bfb80051';
const digestA = `sha256:${'a'.repeat(64)}`;
const digestB = `sha256:${'b'.repeat(64)}`;
const digestC = `sha256:${'c'.repeat(64)}`;
const digestD = `sha256:${'d'.repeat(64)}`;
const digestE = `sha256:${'e'.repeat(64)}`;
const digestF = `sha256:${'f'.repeat(64)}`;

function build(overrides = {}) {
  return buildEnvironmentBindingPlan({
    sourceSha: sha,
    previewDeploymentId: 'dpl_preview123',
    productionBaselineDeploymentId: 'dpl_production123',
    stagingReadinessDigest: digestA,
    schemaBundleDigest: digestB,
    policyBundleDigest: digestC,
    ...overrides,
  });
}

function candidate(overrides = {}) {
  return {
    provider: 'provider-neutral-example',
    environment_id: 'staging-project-001',
    target: 'staging',
    source_sha: sha,
    preview_deployment_id: 'dpl_preview123',
    production_baseline_deployment_id: 'dpl_production123',
    staging_readiness_digest: digestA,
    schema_bundle_digest: digestB,
    policy_bundle_digest: digestC,
    signed_user_policy_test_digest: digestD,
    backup_restore_test_digest: digestE,
    kill_switch_test_digest: digestF,
    confidential_intake_active: false,
    intake_control: 'disabled',
    production_access: false,
    activation_requested: false,
    ...overrides,
  };
}

test('environment binding plan is valid only while live binding remains absent', () => {
  const plan = build();
  const verification = verifyEnvironmentBindingPlan(plan);
  assert.equal(verification.valid, true, verification.errors.join(','));
  assert.equal(plan.current_binding.provider, 'UNBOUND');
  assert.equal(plan.current_binding.environment_created, false);
  assert.equal(plan.current_binding.provider_bound, false);
  assert.equal(plan.current_binding.production_access, false);
  assert.equal(plan.activation.allowed, false);
  assert.equal(plan.activation.production_release_authorized, false);
});

test('tampering a plan into a live or production-capable state invalidates it', () => {
  const plan = structuredClone(build());
  plan.current_binding.provider = 'example';
  plan.current_binding.environment_id = 'live-project';
  plan.current_binding.environment_created = true;
  plan.current_binding.provider_bound = true;
  plan.current_binding.production_access = true;
  plan.activation.allowed = true;
  const verification = verifyEnvironmentBindingPlan(plan);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('environment_binding_digest_mismatch'));
  assert.ok(verification.errors.includes('environment_binding_provider_must_be_unbound'));
  assert.ok(verification.errors.includes('environment_binding_environment_id_must_be_unbound'));
  assert.ok(verification.errors.includes('environment_binding_environment_created_must_be_false'));
  assert.ok(verification.errors.includes('environment_binding_provider_bound_must_be_false'));
  assert.ok(verification.errors.includes('environment_binding_production_access_must_be_false'));
  assert.ok(verification.errors.includes('environment_binding_activation_must_be_false'));
});

test('candidate nonsecret staging evidence can be shape-verified without granting activation authority', () => {
  const result = inspectCandidateBindingEvidence(candidate(), build());
  assert.equal(result.valid, true, result.errors.join(','));
  assert.equal(result.activation_allowed, false);
});

test('candidate evidence rejects source drift, production access, activation and missing live-test digests', () => {
  const result = inspectCandidateBindingEvidence(candidate({
    source_sha: '0'.repeat(40),
    production_access: true,
    activation_requested: true,
    signed_user_policy_test_digest: 'missing',
  }), build());
  assert.equal(result.valid, false);
  assert.equal(result.activation_allowed, false);
  assert.ok(result.errors.includes('environment_binding_candidate_source_sha_mismatch'));
  assert.ok(result.errors.includes('environment_binding_candidate_production_access_must_be_false'));
  assert.ok(result.errors.includes('environment_binding_candidate_activation_must_be_false'));
  assert.ok(result.errors.includes('environment_binding_candidate_signed_user_policy_test_digest_invalid'));
});

test('candidate evidence rejects preview/production identity collapse', () => {
  const result = inspectCandidateBindingEvidence(candidate({
    production_baseline_deployment_id: 'dpl_preview123',
  }), build());
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('environment_binding_candidate_production_baseline_mismatch'));
  assert.ok(result.errors.includes('environment_binding_candidate_deployments_must_differ'));
});

test('secret-shaped fields are forbidden in plans and candidate evidence', () => {
  assert.throws(() => assertNoSecretMaterial({ auth: { api_key: 'x' } }), /secret_field/);
  assert.throws(() => assertNoSecretMaterial({ provider: { serviceRoleToken: 'x' } }), /secret_field/);
  const result = inspectCandidateBindingEvidence(candidate({ metadata: { password: 'x' } }), build());
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('environment_binding_secret_field')));
});

test('required sequence keeps provider creation and live proof behind authorization, and production behind a separate review', () => {
  const sequence = build().required_sequence;
  assert.ok(sequence.indexOf('resolve_owner_security_decisions') < sequence.indexOf('authorize_billable_staging_environment'));
  assert.ok(sequence.indexOf('authorize_billable_staging_environment') < sequence.indexOf('create_isolated_nonproduction_environment'));
  assert.ok(sequence.indexOf('create_isolated_nonproduction_environment') < sequence.indexOf('apply_reviewed_staging_only_migrations'));
  assert.ok(sequence.indexOf('apply_reviewed_staging_only_migrations') < sequence.indexOf('run_signed_user_positive_and_negative_policy_tests'));
  assert.ok(sequence.indexOf('run_signed_user_positive_and_negative_policy_tests') < sequence.indexOf('run_backup_restore_drill'));
  assert.ok(sequence.indexOf('run_kill_switch_drill') < sequence.indexOf('record_exact_live_staging_evidence'));
  assert.ok(sequence.indexOf('record_exact_live_staging_evidence') < sequence.indexOf('separate_release_review_if_production_is_ever_considered'));
});
