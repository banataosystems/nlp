const crypto = require('node:crypto');

const SHA_RE = /^[0-9a-f]{40}$/i;
const DEPLOYMENT_RE = /^dpl_[A-Za-z0-9]+$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/i;
const ENV_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const FORBIDDEN_EVIDENCE_KEY_RE = /(secret|token|password|service[_-]?role|private[_-]?key|api[_-]?key|credential|email|phone|full[_-]?name|address|birth|narrative|payload|message|body|response)/i;

const CASES = Object.freeze([
  { case_id: 'AUTH-ANONYMOUS-DENY', surface: 'intake_auth', expected_allowed: false, assertion: 'anonymous_actor_denied' },
  { case_id: 'AUTH-EXPIRED-DENY', surface: 'intake_auth', expected_allowed: false, assertion: 'expired_authentication_denied' },
  { case_id: 'AUTH-AAL1-ACCEPT', surface: 'intake_auth', expected_allowed: true, assertion: 'valid_authenticated_user_accepted' },
  { case_id: 'POLICY-MEMBER-READ-ALLOW', surface: 'authorization', expected_allowed: true, assertion: 'active_member_reads_own_transformation' },
  { case_id: 'POLICY-CROSS-TRANSFORMATION-DENY', surface: 'authorization', expected_allowed: false, assertion: 'cross_transformation_access_denied' },
  { case_id: 'POLICY-REVOKED-MEMBERSHIP-DENY', surface: 'authorization', expected_allowed: false, assertion: 'revoked_membership_denied' },
  { case_id: 'POLICY-ASSIGNED-REVIEWER-ALLOW', surface: 'authorization', expected_allowed: true, assertion: 'assigned_reviewer_access_allowed' },
  { case_id: 'POLICY-UNASSIGNED-INTAKE-DENY', surface: 'authorization', expected_allowed: false, assertion: 'unassigned_intake_access_denied' },
  { case_id: 'POLICY-DECISION-AAL1-DENY', surface: 'authorization', expected_allowed: false, assertion: 'sensitive_decision_requires_aal2' },
  { case_id: 'POLICY-DECISION-AAL2-ALLOW', surface: 'authorization', expected_allowed: true, assertion: 'authorized_aal2_decision_allowed' },
  { case_id: 'POLICY-RESTRICTED-VISIBILITY-DENY', surface: 'authorization', expected_allowed: false, assertion: 'restricted_visibility_denied' },
  { case_id: 'POLICY-OWNER-ONLY-DENY', surface: 'authorization', expected_allowed: false, assertion: 'non_owner_cannot_read_owner_only_decision' },
]);

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

function assertNoSensitiveEvidence(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveEvidence(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_EVIDENCE_KEY_RE.test(key)) throw new Error(`signed_user_live_test_sensitive_field:${path}.${key}`);
    assertNoSensitiveEvidence(item, `${path}.${key}`);
  }
}

function buildSignedUserLiveTestPlan({ sourceSha, previewDeploymentId, productionBaselineDeploymentId, policyBundleDigest }) {
  if (!SHA_RE.test(sourceSha || '')) throw new Error('signed_user_live_test_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(previewDeploymentId || '')) throw new Error('signed_user_live_test_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(productionBaselineDeploymentId || '')) throw new Error('signed_user_live_test_production_baseline_invalid');
  if (previewDeploymentId === productionBaselineDeploymentId) throw new Error('signed_user_live_test_deployments_must_differ');
  if (!DIGEST_RE.test(policyBundleDigest || '')) throw new Error('signed_user_live_test_policy_bundle_digest_invalid');

  const payload = {
    schema_version: 'worldstage.signed-user-live-test-plan.v1',
    project_key: 'worldstage-cherry',
    proof_level: 'implemented_not_live_executed',
    target: 'staging',
    source_sha: sourceSha.toLowerCase(),
    preview_deployment_id: previewDeploymentId,
    production_baseline_deployment_id: productionBaselineDeploymentId,
    policy_bundle_digest: policyBundleDigest.toLowerCase(),
    fixture_data_class: 'synthetic_only',
    live_execution: false,
    production_access: false,
    confidential_intake_active: false,
    intake_control: 'disabled',
    activation_allowed: false,
    production_release_authorized: false,
    required_artifacts: [
      'session_context_digest',
      'database_policy_trace_digest',
      'test_runner_artifact_digest',
    ],
    cases: CASES,
    execution_sequence: [
      'verify_exact_source_and_preview_provenance',
      'verify_isolated_staging_target',
      'create_synthetic_ephemeral_identities_only',
      'run_authentication_negative_and_positive_cases',
      'run_authorization_cross_scope_and_revocation_cases',
      'run_aal1_and_aal2_sensitive_decision_cases',
      'record_content_addressed_nonsecret_evidence',
      'verify_cleanup_and_disabled_intake_state',
      'retain_activation_false_for_separate_release_review',
    ],
  };

  assertNoSensitiveEvidence(payload);
  return Object.freeze({ ...payload, digest: digestPayload(payload) });
}

function verifySignedUserLiveTestPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return { valid: false, errors: ['signed_user_live_test_plan_invalid'] };
  try { assertNoSensitiveEvidence(plan); } catch (error) { errors.push(error.message); }

  const { digest, ...payload } = plan;
  if (digest !== digestPayload(payload)) errors.push('signed_user_live_test_digest_mismatch');
  if (payload.schema_version !== 'worldstage.signed-user-live-test-plan.v1') errors.push('signed_user_live_test_schema_invalid');
  if (payload.project_key !== 'worldstage-cherry') errors.push('signed_user_live_test_project_invalid');
  if (payload.proof_level !== 'implemented_not_live_executed') errors.push('signed_user_live_test_proof_level_invalid');
  if (payload.target !== 'staging') errors.push('signed_user_live_test_target_must_be_staging');
  if (!SHA_RE.test(payload.source_sha || '')) errors.push('signed_user_live_test_source_sha_invalid');
  if (!DEPLOYMENT_RE.test(payload.preview_deployment_id || '')) errors.push('signed_user_live_test_preview_deployment_invalid');
  if (!DEPLOYMENT_RE.test(payload.production_baseline_deployment_id || '')) errors.push('signed_user_live_test_production_baseline_invalid');
  if (payload.preview_deployment_id && payload.preview_deployment_id === payload.production_baseline_deployment_id) errors.push('signed_user_live_test_deployments_must_differ');
  if (!DIGEST_RE.test(payload.policy_bundle_digest || '')) errors.push('signed_user_live_test_policy_bundle_digest_invalid');
  if (payload.fixture_data_class !== 'synthetic_only') errors.push('signed_user_live_test_fixture_must_be_synthetic_only');
  if (payload.live_execution !== false) errors.push('signed_user_live_test_live_execution_must_be_false');
  if (payload.production_access !== false) errors.push('signed_user_live_test_production_access_must_be_false');
  if (payload.confidential_intake_active !== false) errors.push('signed_user_live_test_confidential_intake_must_be_inactive');
  if (payload.intake_control !== 'disabled') errors.push('signed_user_live_test_intake_must_be_disabled');
  if (payload.activation_allowed !== false) errors.push('signed_user_live_test_activation_must_be_false');
  if (payload.production_release_authorized !== false) errors.push('signed_user_live_test_production_release_must_be_unauthorized');

  const expectedCases = new Map(CASES.map((entry) => [entry.case_id, entry]));
  if (!Array.isArray(payload.cases) || payload.cases.length !== CASES.length) {
    errors.push('signed_user_live_test_case_set_invalid');
  } else {
    const seen = new Set();
    for (const entry of payload.cases) {
      const expected = expectedCases.get(entry?.case_id);
      if (!expected || seen.has(entry.case_id)) {
        errors.push('signed_user_live_test_case_set_invalid');
        continue;
      }
      seen.add(entry.case_id);
      if (canonicalize(entry) !== canonicalize(expected)) errors.push(`signed_user_live_test_case_tampered:${entry.case_id}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function inspectSignedUserLiveTestEvidence(evidence, plan) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') return { valid: false, activation_allowed: false, errors: ['signed_user_live_test_evidence_invalid'] };
  if (!plan || verifySignedUserLiveTestPlan(plan).valid !== true) return { valid: false, activation_allowed: false, errors: ['signed_user_live_test_plan_not_valid'] };

  try { assertNoSensitiveEvidence(evidence); } catch (error) { errors.push(error.message); }

  if (evidence.schema_version !== 'worldstage.signed-user-live-test-evidence.v1') errors.push('signed_user_live_test_evidence_schema_invalid');
  if (evidence.project_key !== 'worldstage-cherry') errors.push('signed_user_live_test_evidence_project_invalid');
  if (evidence.target !== 'staging') errors.push('signed_user_live_test_evidence_target_must_be_staging');
  if (!ENV_ID_RE.test(evidence.environment_id || '') || evidence.environment_id === 'UNBOUND') errors.push('signed_user_live_test_environment_id_invalid');
  if ((evidence.source_sha || '').toLowerCase() !== plan.source_sha) errors.push('signed_user_live_test_source_sha_mismatch');
  if (evidence.preview_deployment_id !== plan.preview_deployment_id) errors.push('signed_user_live_test_preview_deployment_mismatch');
  if (evidence.production_baseline_deployment_id !== plan.production_baseline_deployment_id) errors.push('signed_user_live_test_production_baseline_mismatch');
  if (evidence.preview_deployment_id && evidence.preview_deployment_id === evidence.production_baseline_deployment_id) errors.push('signed_user_live_test_deployments_must_differ');
  if ((evidence.policy_bundle_digest || '').toLowerCase() !== plan.policy_bundle_digest) errors.push('signed_user_live_test_policy_bundle_digest_mismatch');
  if ((evidence.test_plan_digest || '').toLowerCase() !== plan.digest) errors.push('signed_user_live_test_plan_digest_mismatch');
  if (evidence.fixture_data_class !== 'synthetic_only') errors.push('signed_user_live_test_fixture_must_be_synthetic_only');
  if (evidence.real_person_data_used !== false) errors.push('signed_user_live_test_real_person_data_must_be_false');
  if (evidence.confidential_data_used !== false) errors.push('signed_user_live_test_confidential_data_must_be_false');
  if (evidence.production_access !== false) errors.push('signed_user_live_test_production_access_must_be_false');
  if (evidence.intake_control !== 'disabled') errors.push('signed_user_live_test_intake_must_be_disabled');
  if (evidence.ephemeral_sessions !== true) errors.push('signed_user_live_test_sessions_must_be_ephemeral');
  if (evidence.cleanup_verified !== true) errors.push('signed_user_live_test_cleanup_must_be_verified');
  if (evidence.activation_requested !== false) errors.push('signed_user_live_test_activation_must_be_false');
  if (evidence.production_release_authorized !== false) errors.push('signed_user_live_test_production_release_must_be_unauthorized');

  for (const field of ['session_context_digest', 'database_policy_trace_digest', 'test_runner_artifact_digest']) {
    if (!DIGEST_RE.test(evidence.artifacts?.[field] || '')) errors.push(`signed_user_live_test_${field}_invalid`);
  }

  const expectedCases = new Map(plan.cases.map((entry) => [entry.case_id, entry]));
  const seen = new Set();
  if (!Array.isArray(evidence.results) || evidence.results.length !== expectedCases.size) {
    errors.push('signed_user_live_test_result_set_invalid');
  } else {
    for (const result of evidence.results) {
      if (!result || typeof result !== 'object') {
        errors.push('signed_user_live_test_result_invalid');
        continue;
      }
      const allowedKeys = new Set(['case_id', 'outcome', 'observed_allowed', 'proof_digest']);
      for (const key of Object.keys(result)) {
        if (!allowedKeys.has(key)) errors.push(`signed_user_live_test_result_field_not_allowed:${key}`);
      }
      const expected = expectedCases.get(result.case_id);
      if (!expected || seen.has(result.case_id)) {
        errors.push('signed_user_live_test_result_set_invalid');
        continue;
      }
      seen.add(result.case_id);
      if (result.outcome !== 'pass') errors.push(`signed_user_live_test_case_not_passed:${result.case_id}`);
      if (result.observed_allowed !== expected.expected_allowed) errors.push(`signed_user_live_test_case_outcome_mismatch:${result.case_id}`);
      if (!DIGEST_RE.test(result.proof_digest || '')) errors.push(`signed_user_live_test_case_proof_digest_invalid:${result.case_id}`);
    }
  }

  return {
    valid: errors.length === 0,
    activation_allowed: false,
    errors,
  };
}

module.exports = {
  CASES,
  assertNoSensitiveEvidence,
  buildSignedUserLiveTestPlan,
  canonicalize,
  digestPayload,
  inspectSignedUserLiveTestEvidence,
  verifySignedUserLiveTestPlan,
};
