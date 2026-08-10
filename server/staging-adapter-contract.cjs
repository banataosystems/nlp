const REQUIRED_TX_METHODS = [
  'findIdempotency',
  'insertIntake',
  'insertIdempotency',
  'insertAudit',
  'commit',
  'rollback',
];

function validateStagingAdapter(adapter, { expectedProjectKey = 'worldstage-cherry', expectedSourceSha = null } = {}) {
  const errors = [];
  if (!adapter || typeof adapter !== 'object') return { valid: false, errors: ['adapter_missing'] };

  if (adapter.environment !== 'staging') errors.push('environment_must_be_staging');
  if (adapter.projectKey !== expectedProjectKey) errors.push('project_key_mismatch');
  if (!adapter.provider || typeof adapter.provider !== 'string') errors.push('provider_missing');
  if (!adapter.environmentId || typeof adapter.environmentId !== 'string') errors.push('environment_id_missing');
  if (!adapter.sourceSha || typeof adapter.sourceSha !== 'string') errors.push('source_sha_missing');
  if (expectedSourceSha && adapter.sourceSha !== expectedSourceSha) errors.push('source_sha_mismatch');
  if (adapter.allowsProduction === true) errors.push('production_capability_forbidden');
  if (adapter.containsRealData === true) errors.push('real_data_forbidden_in_synthetic_staging_harness');
  if (typeof adapter.begin !== 'function') errors.push('begin_missing');

  return { valid: errors.length === 0, errors };
}

async function assertStagingTransactionShape(adapter, options) {
  const validation = validateStagingAdapter(adapter, options);
  if (!validation.valid) {
    const error = new Error('staging_adapter_invalid');
    error.details = validation.errors;
    throw error;
  }

  const tx = await adapter.begin({ contractProbe: true });
  const missing = REQUIRED_TX_METHODS.filter((method) => typeof tx?.[method] !== 'function');
  try {
    if (typeof tx?.rollback === 'function') await tx.rollback();
  } catch {
    // Contract probe does not let rollback failures hide missing-method evidence.
  }
  if (missing.length) {
    const error = new Error('staging_transaction_invalid');
    error.details = missing;
    throw error;
  }
  return true;
}

module.exports = {
  REQUIRED_TX_METHODS,
  assertStagingTransactionShape,
  validateStagingAdapter,
};
