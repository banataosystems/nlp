const crypto = require('node:crypto');

function fingerprint(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
}

function buildAbuseContext({ request, correlationId }) {
  const rawBody = request?.rawBody || '';
  const idempotencyKey = request?.headers?.['idempotency-key'] || request?.headers?.['Idempotency-Key'] || '';
  return Object.freeze({
    correlation_id: correlationId,
    method: request?.method || null,
    body_bytes: Buffer.byteLength(rawBody, 'utf8'),
    idempotency_fingerprint: fingerprint(idempotencyKey),
  });
}

function validateAbuseDecision(decision) {
  if (!decision || typeof decision !== 'object') return { valid: false, code: 'abuse_decision_missing' };
  if (typeof decision.allowed !== 'boolean') return { valid: false, code: 'abuse_decision_invalid' };
  if (typeof decision.provider !== 'string' || !decision.provider) return { valid: false, code: 'abuse_provider_missing' };
  if (typeof decision.decision_id !== 'string' || !decision.decision_id) return { valid: false, code: 'abuse_decision_id_missing' };
  return {
    valid: true,
    allowed: decision.allowed,
    provider: decision.provider,
    decision_id: decision.decision_id,
    reason_code: typeof decision.reason_code === 'string' ? decision.reason_code : null,
  };
}

module.exports = {
  buildAbuseContext,
  fingerprint,
  validateAbuseDecision,
};
