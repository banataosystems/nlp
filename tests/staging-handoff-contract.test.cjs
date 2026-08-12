const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStagingHandoffManifest,
  verifyStagingHandoffManifest,
  assertNoSecretMaterial,
} = require('../server/staging-handoff-contract.cjs');

const digest = `sha256:${'a'.repeat(64)}`;

function build(overrides = {}) {
  return buildStagingHandoffManifest({
    sourceSha: 'd740991bfbe0a05abcd4a350bfedaa380ade56d2',
    previewDeploymentId: 'dpl_preview123',
    productionBaselineDeploymentId: 'dpl_baseline123',
    rollbackCapsuleDigest: digest,
    schemaBundleDigest: `sha256:${'b'.repeat(64)}`,
    policyBundleDigest: `sha256:${'c'.repeat(64)}`,
    ...overrides,
  });
}

test('manifest is valid only as an unbound synthetic-only staging handoff', () => {
  const manifest = build();
  const verification = verifyStagingHandoffManifest(manifest);
  assert.equal(verification.valid, true, verification.errors.join(','));
  assert.equal(manifest.environment_contract.provider, 'UNBOUND');
  assert.equal(manifest.environment_contract.confidential_intake_enabled, false);
  assert.equal(manifest.environment_contract.executable_migrations, false);
  assert.equal(manifest.environment_contract.production_access, false);
  assert.equal(manifest.activation.allowed, false);
});

test('tampering invalidates the digest and provider binding remains forbidden', () => {
  const manifest = structuredClone(build());
  manifest.environment_contract.provider = 'supabase';
  const verification = verifyStagingHandoffManifest(manifest);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('staging_handoff_digest_mismatch'));
  assert.ok(verification.errors.includes('staging_handoff_provider_must_be_unbound'));
});

test('real/confidential activation cannot be represented as ready', () => {
  const manifest = structuredClone(build());
  manifest.environment_contract.confidential_intake_enabled = true;
  manifest.environment_contract.intake_control = 'enabled';
  manifest.environment_contract.executable_migrations = true;
  manifest.environment_contract.production_access = true;
  manifest.activation.allowed = true;
  const verification = verifyStagingHandoffManifest(manifest);
  assert.equal(verification.valid, false);
  for (const error of [
    'staging_handoff_confidential_intake_must_be_disabled',
    'staging_handoff_intake_control_must_be_disabled',
    'staging_handoff_migrations_must_be_nonexecutable',
    'staging_handoff_production_access_must_be_false',
    'staging_handoff_activation_must_be_false',
  ]) assert.ok(verification.errors.includes(error));
});

test('manifest rejects malformed source/deployment/digest provenance', () => {
  assert.throws(() => build({ sourceSha: 'not-a-sha' }), /source_sha_invalid/);
  assert.throws(() => build({ previewDeploymentId: 'production' }), /preview_deployment_invalid/);
  assert.throws(() => build({ schemaBundleDigest: 'sha256:broken' }), /schema_digest_invalid/);
});

test('secret-shaped fields are forbidden anywhere in the handoff object', () => {
  assert.throws(() => assertNoSecretMaterial({ provider: { service_role_key: 'x' } }), /secret_field/);
  assert.throws(() => assertNoSecretMaterial({ auth: { apiToken: 'x' } }), /secret_field/);
  assert.doesNotThrow(() => assertNoSecretMaterial({ provider: 'UNBOUND', environment_id: 'UNBOUND' }));
});

test('required bind sequence keeps real staging activation after authorization and isolation', () => {
  const sequence = build().required_bind_sequence;
  assert.ok(sequence.indexOf('resolve_owner_security_decisions') < sequence.indexOf('authorize_billable_staging_environment'));
  assert.ok(sequence.indexOf('authorize_billable_staging_environment') < sequence.indexOf('create_isolated_nonproduction_environment'));
  assert.ok(sequence.indexOf('create_isolated_nonproduction_environment') < sequence.indexOf('apply_reviewed_staging_only_migrations'));
  assert.ok(sequence.indexOf('apply_reviewed_staging_only_migrations') < sequence.indexOf('run_signed_user_positive_and_negative_policy_tests'));
  assert.ok(sequence.indexOf('run_signed_user_positive_and_negative_policy_tests') < sequence.indexOf('run_backup_restore_and_kill_switch_drills'));
});
