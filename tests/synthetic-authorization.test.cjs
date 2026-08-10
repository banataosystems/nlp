const test = require('node:test');
const assert = require('node:assert/strict');
const { issueSyntheticToken, verifySyntheticToken } = require('../server/synthetic-identity.cjs');
const { authorize } = require('../server/synthetic-authorization.cjs');

const secret = 'synthetic-worldstage-test-secret-32-bytes-minimum-value';
const now = 1_800_000_000;

function identity({ actorId = 'user-1', aal = 'aal1', memberships = [] } = {}) {
  const token = issueSyntheticToken({ actorId, aal, memberships, now, ttlSeconds: 300 }, secret);
  return verifySyntheticToken(token, secret, { now: now + 1 });
}

const owner = identity({
  actorId: 'owner-1', aal: 'aal2', memberships: [{ transformation_id: 't-1', role: 'owner', active: true }]
});
const lead = identity({
  actorId: 'lead-1', aal: 'aal1', memberships: [{ transformation_id: 't-1', role: 'transformation_lead', active: true }]
});
const facilitator = identity({
  actorId: 'fac-1', aal: 'aal1', memberships: [{ transformation_id: 't-1', role: 'facilitator', active: true }]
});
const outsider = identity({ actorId: 'out-1', aal: 'aal2', memberships: [] });
const revokedOwner = identity({
  actorId: 'revoked-1', aal: 'aal2', memberships: [{ transformation_id: 't-1', role: 'owner', active: false }]
});

test('synthetic tokens reject tampering, expiry, wrong secret, and invalid assurance', () => {
  const token = issueSyntheticToken({ actorId: 'u', aal: 'aal1', memberships: [], now, ttlSeconds: 2 }, secret);
  assert.throws(() => verifySyntheticToken(`${token}x`, secret, { now: now + 1 }), /signature|token/);
  assert.throws(() => verifySyntheticToken(token, `${secret}-wrong`, { now: now + 1 }), /signature/);
  assert.throws(() => verifySyntheticToken(token, secret, { now: now + 3 }), /expired/);
  assert.throws(() => issueSyntheticToken({ actorId: 'u', aal: 'aal3', now }, secret), /aal/);
});

test('transformation read requires active membership; updates require owner or transformation lead', () => {
  const resource = { type: 'transformation', id: 't-1' };
  assert.equal(authorize({ identity: facilitator, action: 'read', resource }).allowed, true);
  assert.equal(authorize({ identity: outsider, action: 'read', resource }).allowed, false);
  assert.equal(authorize({ identity: revokedOwner, action: 'read', resource }).allowed, false);
  assert.equal(authorize({ identity: lead, action: 'update', resource }).allowed, true);
  assert.equal(authorize({ identity: facilitator, action: 'update', resource }).allowed, false);
});

test('membership access is self-read only and mutation remains unavailable', () => {
  const resource = { type: 'membership', actor_user_id: 'fac-1' };
  assert.equal(authorize({ identity: facilitator, action: 'read_self', resource }).allowed, true);
  assert.equal(authorize({ identity: owner, action: 'read_self', resource }).allowed, false);
  assert.equal(authorize({ identity: owner, action: 'grant', resource }).code, 'membership_mutation_not_exposed');
});

test('intake read/review requires assigned reviewer or candidate lead role', () => {
  const assigned = { type: 'intake', assigned_reviewer_user_id: 'fac-1', transformation_id: null };
  assert.equal(authorize({ identity: facilitator, action: 'read', resource: assigned }).allowed, true);
  assert.equal(authorize({ identity: outsider, action: 'read', resource: assigned }).allowed, false);

  const linked = { type: 'intake', assigned_reviewer_user_id: 'someone-else', transformation_id: 't-1' };
  assert.equal(authorize({ identity: owner, action: 'review', resource: linked }).allowed, true);
  assert.equal(authorize({ identity: lead, action: 'review', resource: linked }).allowed, true);
  assert.equal(authorize({ identity: facilitator, action: 'review', resource: linked }).allowed, false);
});

test('participant/finance/security restricted discovery and sources remain hidden from ordinary members', () => {
  for (const type of ['discovery', 'source']) {
    assert.equal(authorize({ identity: facilitator, action: 'read', resource: { type, transformation_id: 't-1', visibility_scope: 'transformation_team' } }).allowed, true);
    for (const visibility_scope of ['participant_private', 'finance_restricted', 'security_restricted']) {
      assert.equal(authorize({ identity: owner, action: 'read', resource: { type, transformation_id: 't-1', visibility_scope } }).allowed, false);
    }
  }
});

test('owner-only decisions are invisible to ordinary transformation members', () => {
  const resource = { type: 'decision', transformation_id: 't-1', visibility_scope: 'owner_only', state: 'needs_review', required_authority: 'owner' };
  assert.equal(authorize({ identity: owner, action: 'read', resource }).allowed, true);
  assert.equal(authorize({ identity: lead, action: 'read', resource }).allowed, false);
  assert.equal(authorize({ identity: facilitator, action: 'read', resource }).allowed, false);
});

test('decision resolution requires exact authority, AAL2, and a resolvable state', () => {
  const resource = { type: 'decision', transformation_id: 't-1', visibility_scope: 'owner_only', state: 'needs_review', required_authority: 'owner' };
  assert.equal(authorize({ identity: owner, action: 'resolve', resource }).allowed, true);

  const ownerAal1 = identity({ actorId: 'owner-aal1', aal: 'aal1', memberships: [{ transformation_id: 't-1', role: 'owner', active: true }] });
  assert.equal(authorize({ identity: ownerAal1, action: 'resolve', resource }).code, 'aal2_required');
  assert.equal(authorize({ identity: lead, action: 'resolve', resource }).code, 'required_authority_missing');
  assert.equal(authorize({ identity: owner, action: 'resolve', resource: { ...resource, state: 'approved' } }).code, 'decision_state_not_resolvable');
});

test('audit read is candidate-owner only and audit mutation is not exposed', () => {
  const resource = { type: 'audit', transformation_id: 't-1' };
  assert.equal(authorize({ identity: owner, action: 'read', resource }).allowed, true);
  assert.equal(authorize({ identity: lead, action: 'read', resource }).allowed, false);
  assert.equal(authorize({ identity: owner, action: 'insert', resource }).code, 'audit_mutation_not_exposed');
});

test('unknown identity, resource, action, and resource type fail closed', () => {
  assert.equal(authorize({ identity: null, action: 'read', resource: { type: 'transformation', id: 't-1' } }).allowed, false);
  assert.equal(authorize({ identity: outsider, action: 'read', resource: null }).allowed, false);
  assert.equal(authorize({ identity: outsider, action: null, resource: { type: 'x' } }).allowed, false);
  assert.equal(authorize({ identity: outsider, action: 'read', resource: { type: 'unknown' } }).code, 'resource_type_not_supported');
});
