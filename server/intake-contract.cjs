const MAX_BODY_BYTES = 32 * 1024;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

const TOP_LEVEL_KEYS = new Set(['organization', 'contact', 'context', 'notice_version', 'consent_version', 'questionnaire_version']);
const ORGANIZATION_KEYS = new Set(['name', 'website']);
const CONTACT_KEYS = new Set(['name', 'role', 'email', 'phone']);
const CONTEXT_KEYS = new Set(['current_reality', 'desired_reality', 'timing', 'delivery_mode', 'location', 'notes']);

const FORBIDDEN_AUTHORITY_KEYS = new Set([
  'id', 'intake_id', 'receipt_code', 'organization_id', 'transformation_id',
  'actor_user_id', 'submitted_by_user_id', 'assigned_reviewer_user_id',
  'membership_role', 'permissions', 'scopes', 'state', 'review_state',
  'approval_state', 'decision_state', 'visibility_scope', 'sensitivity_class',
  'retention_class', 'required_authority', 'decided_by_user_id', 'decided_at',
  'public_release_state', 'client_sponsor_visible', 'audit_event', 'audit_outcome',
  'audit_actor', 'created_at', 'updated_at', 'service_role_key', 'jwt_claims',
]);

function json(status, code, message, extra = {}) {
  return { status, body: { error: code, message, ...extra } };
}

function enabled(env = process.env) {
  return env.WORLDSTAGE_SECURE_INTAKE_ENABLED === 'true';
}

function persistenceConfigured(env = process.env) {
  return env.WORLDSTAGE_SECURE_INTAKE_PERSISTENCE === 'staging';
}

function hasForbiddenKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_AUTHORITY_KEYS.has(key)) return true;
    if (hasForbiddenKey(nested)) return true;
  }
  return false;
}

function onlyKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return false;
  return Object.keys(object).every((key) => allowed.has(key));
}

function text(value, max, { required = false } = {}) {
  if (value == null || value === '') return required ? null : '';
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (required && !normalized) return null;
  if (normalized.length > max) return null;
  if (/\u0000/.test(normalized)) return null;
  return normalized;
}

function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(422, 'invalid_schema', 'Request body is invalid.');
  if (hasForbiddenKey(body)) return json(422, 'authority_field_rejected', 'Request contains a field the client is not allowed to control.');
  if (!onlyKeys(body, TOP_LEVEL_KEYS)) return json(422, 'unknown_field', 'Request contains an unsupported field.');
  if (!onlyKeys(body.organization, ORGANIZATION_KEYS)) return json(422, 'invalid_organization', 'Organization context is invalid.');
  if (!onlyKeys(body.contact, CONTACT_KEYS)) return json(422, 'invalid_contact', 'Contact context is invalid.');
  if (!onlyKeys(body.context || {}, CONTEXT_KEYS)) return json(422, 'invalid_context', 'Discovery context is invalid.');

  const organizationName = text(body.organization.name, 160, { required: true });
  const contactName = text(body.contact.name, 160, { required: true });
  const email = text(body.contact.email, 254, { required: true });
  const noticeVersion = text(body.notice_version, 64, { required: true });
  const questionnaireVersion = text(body.questionnaire_version, 64, { required: true });

  if (!organizationName || !contactName || !email || !noticeVersion || !questionnaireVersion) {
    return json(422, 'required_field_invalid', 'One or more required fields are missing or invalid.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(422, 'invalid_email', 'Email format is invalid.');

  const optional = [
    [body.organization.website, 512], [body.contact.role, 160], [body.contact.phone, 80],
    [body.context?.current_reality, 4000], [body.context?.desired_reality, 4000],
    [body.context?.timing, 500], [body.context?.delivery_mode, 120],
    [body.context?.location, 500], [body.context?.notes, 4000],
    [body.consent_version, 64],
  ];
  if (optional.some(([value, max]) => text(value, max) === null)) {
    return json(422, 'field_too_large_or_invalid', 'One or more fields exceed the allowed format or length.');
  }

  return { status: 200, body: { valid: true } };
}

function evaluateRequest({ method, headers = {}, rawBody = '', parsedBody, env = process.env }) {
  if (method !== 'POST') return json(405, 'method_not_allowed', 'Method not allowed.');
  if (!enabled(env)) return json(503, 'intake_disabled', 'Secure intake is not available yet.');
  if (!persistenceConfigured(env)) return json(503, 'persistence_not_configured', 'Secure intake is not available yet.');

  const contentType = String(headers['content-type'] || headers['Content-Type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) return json(415, 'unsupported_content_type', 'Content-Type must be application/json.');

  const idempotencyKey = String(headers['idempotency-key'] || headers['Idempotency-Key'] || '');
  if (!IDEMPOTENCY_PATTERN.test(idempotencyKey)) return json(400, 'invalid_idempotency_key', 'A valid Idempotency-Key is required.');

  const byteLength = Buffer.byteLength(rawBody || JSON.stringify(parsedBody || {}), 'utf8');
  if (byteLength > MAX_BODY_BYTES) return json(413, 'payload_too_large', 'Request payload is too large.');

  return validateBody(parsedBody);
}

module.exports = {
  MAX_BODY_BYTES,
  evaluateRequest,
  hasForbiddenKey,
  validateBody,
};
