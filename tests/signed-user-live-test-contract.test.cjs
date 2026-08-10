const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CASES,
  buildSignedUserLiveTestPlan,
  inspectSignedUserLiveTestEvidence,
  verifySignedUserLiveTestPlan,
} = require('../server/signed-user-live-test-contract.cjs');

const sourceSha = 'a'.repeat(40);
const previewDeploymentId = 'dpl_PreviewSignedUser123';
const productionBaselineDeploymentId = 'dpl_ProductionBaseline456';
const policyBundleDigest = `sha256:${'b'.repeat(64)}`;

function proofDigest(index) {
  const chars = '0123456789abcdef';
  return `sha256:${chars[index % chars.length].repeat(64)}`;
}

function makePlan() {
  return buildSignedUserLiveTestPlan({
    sourceSha,
    previewDeploymentId,
    productionBaselineDeploymentId,
    policyBundleDigest,
  });
}

function makeEvidence(plan = makePlan()) {
  return {
    schema_version: 'worldstage.signed-user-live-test-evidence.v1',
    project_key: 'worldstage-cherry',
    target: 'staging',
    environment_id: 'staging-worldstage-synthetic-01',
    source_sha: plan.source_sha,
    preview_deployment_id: plan.preview_deployment_id,
    production_baseline_deployment_id: plan.production_baseline_deployment_id,
    policy_bundle_digest: plan.policy_bundle_digest,
    test_plan_digest: plan.digest,
    fixture_data_class: 'synthetic_only',
    real_person_data_used: false,
    confidential_data_used: false,
    production_access: false,
    intake_control: 'disabled',
    ephemeral_sessions: true,
    cleanup_verified: true,
    activation_requested: false,
    production_release_authorized: false,
    artifacts: {
      session_context_digest: proofDigest(1),
      database_policy_trace_digest: proofDigest(2),
      test_runner_artifact_digest: proofDigest(3),
    },
    results: plan.cases.map((entry, index) => ({
      case_id: entry.case_id,
      outcome: 'pass',
      observed_allowed: entry.expected_allowed,
      proof_digest: proofDigest(index + 4),
    })),
  };
}

test('signed-user live-test plan stays synthetic, staging-only and non-activating', () => {
  const plan = makePlan();
  const verification = verifySignedUserLiveTestPlan(plan);

  assert.equal(verification.valid, true);
  assert.deepEqual(verification.errors, []);
  assert.equal(plan.proof_level, 'implemented_not_live_executed');
  assert.equal(plan.fixture_data_class, 'synthetic_only');
  assert.equal(plan.live_execution, false);
  assert.equal(plan.production_access, false);
  assert.equal(plan.confidential_intake_active, false);
  assert.equal(plan.intake_control, 'disabled');
  assert.equal(plan.activation_allowed, false);
  assert.equal(plan.production_release_authorized, false);
  assert.equal(plan.cases.length, CASES.length);
});

test('plan tampering toward live execution or production access fails closed', () => {
  const plan = makePlan();

  const liveTamper = verifySignedUserLiveTestPlan({ ...plan, live_execution: true });
  assert.equal(liveTamper.valid, false);
  assert.ok(liveTamper.errors.includes('signed_user_live_test_live_execution_must_be_false'));

  const productionTamper = verifySignedUserLiveTestPlan({ ...plan, production_access: true });
  assert.equal(productionTamper.valid, false);
  assert.ok(productionTamper.errors.includes('signed_user_live_test_production_access_must_be_false'));
});

test('case matrix tampering is detected', () => {
  const plan = makePlan();
  const tamperedCases = plan.cases.map((entry) => ({ ...entry }));
  tamperedCases[0].expected_allowed = true;

  const verification = verifySignedUserLiveTestPlan({ ...plan, cases: tamperedCases });
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((error) => error.startsWith('signed_user_live_test_case_tampered:')));
});

test('complete future staging evidence can be shape-verified without granting activation', () => {
  const plan = makePlan();
  const evidence = makeEvidence(plan);
  const verification = inspectSignedUserLiveTestEvidence(evidence, plan);

  assert.equal(verification.valid, true);
  assert.equal(verification.activation_allowed, false);
  assert.deepEqual(verification.errors, []);
});

test('source drift and deployment identity collapse are rejected', () => {
  const plan = makePlan();

  const sourceDrift = makeEvidence(plan);
  sourceDrift.source_sha = 'c'.repeat(40);
  const driftVerification = inspectSignedUserLiveTestEvidence(sourceDrift, plan);
  assert.equal(driftVerification.valid, false);
  assert.ok(driftVerification.errors.includes('signed_user_live_test_source_sha_mismatch'));

  const collapsed = makeEvidence(plan);
  collapsed.preview_deployment_id = collapsed.production_baseline_deployment_id;
  const collapseVerification = inspectSignedUserLiveTestEvidence(collapsed, plan);
  assert.equal(collapseVerification.valid, false);
  assert.ok(collapseVerification.errors.includes('signed_user_live_test_preview_deployment_mismatch'));
  assert.ok(collapseVerification.errors.includes('signed_user_live_test_deployments_must_differ'));
});

test('missing, duplicate or contradictory case results fail closed', () => {
  const plan = makePlan();

  const missing = makeEvidence(plan);
  missing.results = missing.results.slice(1);
  const missingVerification = inspectSignedUserLiveTestEvidence(missing, plan);
  assert.equal(missingVerification.valid, false);
  assert.ok(missingVerification.errors.includes('signed_user_live_test_result_set_invalid'));

  const contradictory = makeEvidence(plan);
  contradictory.results[0] = {
    ...contradictory.results[0],
    observed_allowed: !contradictory.results[0].observed_allowed,
  };
  const contradictoryVerification = inspectSignedUserLiveTestEvidence(contradictory, plan);
  assert.equal(contradictoryVerification.valid, false);
  assert.ok(contradictoryVerification.errors.some((error) => error.startsWith('signed_user_live_test_case_outcome_mismatch:')));

  const duplicate = makeEvidence(plan);
  duplicate.results[1] = { ...duplicate.results[0] };
  const duplicateVerification = inspectSignedUserLiveTestEvidence(duplicate, plan);
  assert.equal(duplicateVerification.valid, false);
  assert.ok(duplicateVerification.errors.includes('signed_user_live_test_result_set_invalid'));
});

test('real-person data, confidential data, production access or activation requests are rejected', () => {
  const plan = makePlan();

  for (const [field, value, expectedError] of [
    ['real_person_data_used', true, 'signed_user_live_test_real_person_data_must_be_false'],
    ['confidential_data_used', true, 'signed_user_live_test_confidential_data_must_be_false'],
    ['production_access', true, 'signed_user_live_test_production_access_must_be_false'],
    ['activation_requested', true, 'signed_user_live_test_activation_must_be_false'],
    ['production_release_authorized', true, 'signed_user_live_test_production_release_must_be_unauthorized'],
  ]) {
    const evidence = makeEvidence(plan);
    evidence[field] = value;
    const verification = inspectSignedUserLiveTestEvidence(evidence, plan);
    assert.equal(verification.valid, false);
    assert.ok(verification.errors.includes(expectedError));
    assert.equal(verification.activation_allowed, false);
  }
});

test('sensitive or free-form result fields are rejected from durable evidence', () => {
  const plan = makePlan();

  const sensitive = makeEvidence(plan);
  sensitive.session_token = 'must-never-be-recorded';
  const sensitiveVerification = inspectSignedUserLiveTestEvidence(sensitive, plan);
  assert.equal(sensitiveVerification.valid, false);
  assert.ok(sensitiveVerification.errors.some((error) => error.includes('signed_user_live_test_sensitive_field')));

  const pii = makeEvidence(plan);
  pii.user_email = 'synthetic@example.invalid';
  const piiVerification = inspectSignedUserLiveTestEvidence(pii, plan);
  assert.equal(piiVerification.valid, false);
  assert.ok(piiVerification.errors.some((error) => error.includes('signed_user_live_test_sensitive_field')));

  const freeForm = makeEvidence(plan);
  freeForm.results[0] = { ...freeForm.results[0], details: 'not allowed' };
  const freeFormVerification = inspectSignedUserLiveTestEvidence(freeForm, plan);
  assert.equal(freeFormVerification.valid, false);
  assert.ok(freeFormVerification.errors.includes('signed_user_live_test_result_field_not_allowed:details'));
});

test('proof digests and cleanup evidence are mandatory', () => {
  const plan = makePlan();

  const missingDigest = makeEvidence(plan);
  missingDigest.artifacts.database_policy_trace_digest = 'missing';
  const digestVerification = inspectSignedUserLiveTestEvidence(missingDigest, plan);
  assert.equal(digestVerification.valid, false);
  assert.ok(digestVerification.errors.includes('signed_user_live_test_database_policy_trace_digest_invalid'));

  const cleanupMissing = makeEvidence(plan);
  cleanupMissing.cleanup_verified = false;
  const cleanupVerification = inspectSignedUserLiveTestEvidence(cleanupMissing, plan);
  assert.equal(cleanupVerification.valid, false);
  assert.ok(cleanupVerification.errors.includes('signed_user_live_test_cleanup_must_be_verified'));
});
