const crypto = require('node:crypto');
const { evaluateRequest } = require('./intake-contract.cjs');
const { persistValidatedIntake } = require('./intake-persistence.cjs');
const { validateStagingAdapter } = require('./staging-adapter-contract.cjs');
const { buildAbuseContext, validateAbuseDecision } = require('./intake-abuse-contract.cjs');

function response(status, body) {
  return { status, body };
}

async function processSecureIntake({
  request,
  env = process.env,
  adapter,
  checkAbuse,
  authenticate,
  authorizeSubmission,
  expectedSourceSha,
  correlationId = crypto.randomUUID(),
}) {
  const contract = evaluateRequest({
    method: request?.method,
    headers: request?.headers || {},
    rawBody: request?.rawBody || '',
    parsedBody: request?.parsedBody,
    env,
  });
  if (contract.status !== 200) return contract;

  if (typeof checkAbuse !== 'function') {
    return response(503, { error: 'abuse_controls_not_configured', message: 'Secure intake is not available yet.' });
  }

  let abuseDecision;
  try {
    abuseDecision = validateAbuseDecision(await checkAbuse(buildAbuseContext({ request, correlationId })));
  } catch {
    return response(503, { error: 'abuse_controls_unavailable', message: 'Secure intake is not available yet.' });
  }
  if (!abuseDecision.valid) {
    return response(503, { error: 'abuse_controls_unavailable', message: 'Secure intake is not available yet.' });
  }
  if (!abuseDecision.allowed) {
    return response(429, { error: 'request_not_accepted', message: 'Please try again later.' });
  }

  if (typeof authenticate !== 'function') {
    return response(503, { error: 'authentication_not_configured', message: 'Secure intake is not available yet.' });
  }
  if (typeof authorizeSubmission !== 'function') {
    return response(503, { error: 'submission_policy_not_configured', message: 'Secure intake is not available yet.' });
  }

  let identity;
  try {
    identity = await authenticate(request);
  } catch {
    return response(401, { error: 'authentication_failed', message: 'Authentication is required.' });
  }
  if (!identity || typeof identity.id !== 'string' || !identity.id) {
    return response(401, { error: 'authentication_failed', message: 'Authentication is required.' });
  }

  let submissionDecision;
  try {
    submissionDecision = await authorizeSubmission({ identity, request });
  } catch {
    return response(403, { error: 'submission_not_authorized', message: 'This intake submission is not authorized.' });
  }
  if (!submissionDecision || submissionDecision.allowed !== true) {
    return response(403, { error: 'submission_not_authorized', message: 'This intake submission is not authorized.' });
  }

  const adapterValidation = validateStagingAdapter(adapter, { expectedSourceSha });
  if (!adapterValidation.valid) {
    return response(503, { error: 'staging_adapter_invalid', message: 'Secure intake is not available yet.' });
  }

  const idempotencyKey = request.headers?.['idempotency-key'] || request.headers?.['Idempotency-Key'];

  try {
    const persisted = await persistValidatedIntake({
      adapter,
      idempotencyKey,
      body: request.parsedBody,
      actor: { id: identity.id },
      correlationId,
    });

    return response(202, {
      receipt_code: persisted.receipt_code,
      status: 'received',
      message: 'Your submission was received for human review.',
    });
  } catch (error) {
    if (error?.code === 'idempotency_conflict' || error?.code === 'idempotency_unique_violation') {
      return response(409, { error: 'idempotency_conflict', message: 'The request conflicts with an earlier submission.' });
    }
    return response(500, { error: 'internal_error', message: 'Secure intake is temporarily unavailable.' });
  }
}

module.exports = {
  processSecureIntake,
};
