const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIntakeActor } = require('../server/intake-auth-contract.cjs');

const now = 1_800_300_000;

test('anonymous and unknown modes remain denied', () => {
  assert.equal(validateIntakeActor({ mode: 'anonymous', actor: {}, now }).allowed, false);
  assert.equal(validateIntakeActor({ mode: 'email-domain', actor: {}, now }).allowed, false);
  assert.equal(validateIntakeActor({ mode: null, actor: {}, now }).allowed, false);
});

test('authenticated mode requires a live user identity and valid assurance', () => {
  const valid = validateIntakeActor({ mode: 'authenticated', actor: { type: 'user', id: 'user-1', aal: 'aal1', expires_at: now + 60 }, now });
  assert.equal(valid.allowed, true);
  assert.deepEqual(valid.actor, { type: 'user', id: 'user-1', aal: 'aal1' });

  assert.equal(validateIntakeActor({ mode: 'authenticated', actor: { type: 'invitation', id: 'x', aal: 'aal1', expires_at: now + 60 }, now }).allowed, false);
  assert.equal(validateIntakeActor({ mode: 'authenticated', actor: { type: 'user', id: 'u', aal: 'aal3', expires_at: now + 60 }, now }).allowed, false);
  assert.equal(validateIntakeActor({ mode: 'authenticated', actor: { type: 'user', id: 'u', aal: 'aal1', expires_at: now }, now }).code, 'authentication_expired');
});

test('bound invitation mode requires exact scope, audience and expiry', () => {
  const valid = validateIntakeActor({ mode: 'bound_invitation', actor: { type: 'invitation', id: 'invite-1', scope: 'intake:create', audience: 'worldstage-intake', expires_at: now + 60 }, now });
  assert.equal(valid.allowed, true);
  assert.deepEqual(valid.actor, { type: 'invitation', id: 'invite-1', aal: null });

  assert.equal(validateIntakeActor({ mode: 'bound_invitation', actor: { type: 'invitation', id: 'invite-1', scope: 'admin', audience: 'worldstage-intake', expires_at: now + 60 }, now }).code, 'invitation_scope_invalid');
  assert.equal(validateIntakeActor({ mode: 'bound_invitation', actor: { type: 'invitation', id: 'invite-1', scope: 'intake:create', audience: 'other', expires_at: now + 60 }, now }).code, 'invitation_audience_invalid');
  assert.equal(validateIntakeActor({ mode: 'bound_invitation', actor: { type: 'invitation', id: 'invite-1', scope: 'intake:create', audience: 'worldstage-intake', expires_at: now }, now }).code, 'invitation_expired');
});

test('intake authentication does not require AAL2 by default', () => {
  assert.equal(validateIntakeActor({ mode: 'authenticated', actor: { type: 'user', id: 'u', aal: 'aal1', expires_at: now + 60 }, now }).allowed, true);
  assert.equal(validateIntakeActor({ mode: 'authenticated', actor: { type: 'user', id: 'u', aal: 'aal2', expires_at: now + 60 }, now }).allowed, true);
});
