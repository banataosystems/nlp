const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { issueSyntheticToken, verifySyntheticToken } = require('../server/synthetic-identity.cjs');
const { authorize } = require('../server/synthetic-authorization.cjs');

const manifest = JSON.parse(fs.readFileSync('config/worldstage/phase2-synthetic-fixtures.json', 'utf8'));
const secret = 'worldstage-synthetic-rls-matrix-secret-value-32bytes';
const now = 1_800_100_000;

const candidateMemberships = {
  owner_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'owner', active: true }],
  transformation_lead_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'transformation_lead', active: true }],
  relationship_lead_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'relationship_lead', active: true }],
  operations_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'operations', active: true }],
  evidence_reviewer_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'evidence_reviewer', active: true }],
  finance_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'finance', active: true }],
  security_admin_alpha: [],
  client_sponsor_alpha: [],
  participant_alpha_1: [],
  participant_alpha_2: [],
  external_facilitator_alpha: [],
  same_org_nonmember_alpha: [],
  cross_org_user_beta: [{ transformation_id: 'transformation_beta_1', role: 'operations', active: true }],
  revoked_member_alpha: [{ transformation_id: 'transformation_alpha_1', role: 'owner', active: false }],
  disabled_user_alpha: [],
};

function assuranceFor(actor) {
  return actor.expected_assurance.startsWith('aal2') ? 'aal2' : 'aal1';
}

function identityFor(actor) {
  const token = issueSyntheticToken({
    actorId: actor.key,
    aal: assuranceFor(actor),
    memberships: candidateMemberships[actor.key] || [],
    now,
    ttlSeconds: 300,
  }, secret);
  return verifySyntheticToken(token, secret, { now: now + 1 });
}

const actors = Object.fromEntries(manifest.actors.map((actor) => [actor.key, identityFor(actor)]));
const alpha = { type: 'transformation', id: 'transformation_alpha_1' };
const beta = { type: 'transformation', id: 'transformation_beta_1' };

test('every synthetic fixture actor has an explicit candidate membership decision', () => {
  assert.deepEqual(Object.keys(candidateMemberships).sort(), manifest.actors.map((actor) => actor.key).sort());
});

test('same-organization presence alone never grants transformation access', () => {
  for (const key of ['same_org_nonmember_alpha', 'client_sponsor_alpha', 'participant_alpha_1', 'participant_alpha_2', 'external_facilitator_alpha']) {
    assert.equal(authorize({ identity: actors[key], action: 'read', resource: alpha }).allowed, false, key);
  }
});

test('technical security administration does not imply business-content access', () => {
  assert.equal(authorize({ identity: actors.security_admin_alpha, action: 'read', resource: alpha }).allowed, false);
  assert.equal(authorize({ identity: actors.security_admin_alpha, action: 'read', resource: { type: 'audit', transformation_id: 'transformation_alpha_1' } }).allowed, false);
});

test('revoked membership is denied even when the historical role was owner', () => {
  assert.equal(authorize({ identity: actors.revoked_member_alpha, action: 'read', resource: alpha }).allowed, false);
  assert.equal(authorize({ identity: actors.revoked_member_alpha, action: 'update', resource: alpha }).allowed, false);
});

test('cross-organization membership cannot read another transformation', () => {
  assert.equal(authorize({ identity: actors.cross_org_user_beta, action: 'read', resource: beta }).allowed, true);
  assert.equal(authorize({ identity: actors.cross_org_user_beta, action: 'read', resource: alpha }).allowed, false);
});

test('candidate internal members can read their assigned transformation but only lead roles may update it', () => {
  for (const key of ['owner_alpha', 'transformation_lead_alpha', 'relationship_lead_alpha', 'operations_alpha', 'evidence_reviewer_alpha', 'finance_alpha']) {
    assert.equal(authorize({ identity: actors[key], action: 'read', resource: alpha }).allowed, true, key);
  }
  assert.equal(authorize({ identity: actors.owner_alpha, action: 'update', resource: alpha }).allowed, true);
  assert.equal(authorize({ identity: actors.transformation_lead_alpha, action: 'update', resource: alpha }).allowed, true);
  for (const key of ['relationship_lead_alpha', 'operations_alpha', 'evidence_reviewer_alpha', 'finance_alpha']) {
    assert.equal(authorize({ identity: actors[key], action: 'update', resource: alpha }).allowed, false, key);
  }
});

test('participant-private and finance/security-restricted resources remain denied until dedicated policies exist', () => {
  for (const visibility_scope of ['participant_private', 'finance_restricted', 'security_restricted']) {
    const resource = { type: 'source', transformation_id: 'transformation_alpha_1', visibility_scope };
    for (const key of ['owner_alpha', 'transformation_lead_alpha', 'operations_alpha', 'finance_alpha']) {
      assert.equal(authorize({ identity: actors[key], action: 'read', resource }).allowed, false, `${key}:${visibility_scope}`);
    }
  }
});

test('owner-only decision visibility is not inherited by transformation leads or other members', () => {
  const decision = {
    type: 'decision',
    transformation_id: 'transformation_alpha_1',
    visibility_scope: 'owner_only',
    state: 'needs_review',
    required_authority: 'owner',
  };
  assert.equal(authorize({ identity: actors.owner_alpha, action: 'read', resource: decision }).allowed, true);
  for (const key of ['transformation_lead_alpha', 'relationship_lead_alpha', 'operations_alpha', 'finance_alpha']) {
    assert.equal(authorize({ identity: actors[key], action: 'read', resource: decision }).allowed, false, key);
  }
});
