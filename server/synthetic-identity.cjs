const crypto = require('node:crypto');

const ISSUER = 'worldstage-test-harness';
const AUDIENCE = 'worldstage-phase2-staging-simulator';

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signPayload(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

function timingSafeEqualString(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function verifySyntheticToken(token, secret, { now = Math.floor(Date.now() / 1000) } = {}) {
  if (!secret || typeof secret !== 'string' || secret.length < 32) throw new Error('synthetic_secret_invalid');
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('synthetic_token_invalid');

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  if (!timingSafeEqualString(signature, expected)) throw new Error('synthetic_signature_invalid');

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('synthetic_token_invalid');
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('synthetic_header_invalid');
  if (payload.iss !== ISSUER || payload.aud !== AUDIENCE) throw new Error('synthetic_claims_invalid');
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('synthetic_subject_invalid');
  if (!Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)) throw new Error('synthetic_time_claim_invalid');
  if (payload.iat > now + 60) throw new Error('synthetic_token_not_yet_valid');
  if (payload.exp <= now) throw new Error('synthetic_token_expired');
  if (!['aal1', 'aal2'].includes(payload.aal)) throw new Error('synthetic_aal_invalid');

  return Object.freeze({
    id: payload.sub,
    aal: payload.aal,
    memberships: Array.isArray(payload.memberships) ? payload.memberships.map((m) => ({ ...m })) : [],
    issuedAt: payload.iat,
    expiresAt: payload.exp,
    synthetic: true,
  });
}

function issueSyntheticToken({ actorId, aal = 'aal1', memberships = [], ttlSeconds = 300, now = Math.floor(Date.now() / 1000) }, secret) {
  if (!actorId) throw new Error('synthetic_actor_required');
  if (!['aal1', 'aal2'].includes(aal)) throw new Error('synthetic_aal_invalid');
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 3600) throw new Error('synthetic_ttl_invalid');
  return signPayload({
    iss: ISSUER,
    aud: AUDIENCE,
    sub: actorId,
    aal,
    memberships,
    iat: now,
    exp: now + ttlSeconds,
  }, secret);
}

module.exports = {
  AUDIENCE,
  ISSUER,
  issueSyntheticToken,
  verifySyntheticToken,
};
