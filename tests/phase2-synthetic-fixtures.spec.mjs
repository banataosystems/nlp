import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('config/worldstage/phase2-synthetic-fixtures.json', 'utf8'));
const requiredActors = [
  'owner_alpha',
  'transformation_lead_alpha',
  'relationship_lead_alpha',
  'operations_alpha',
  'evidence_reviewer_alpha',
  'finance_alpha',
  'security_admin_alpha',
  'client_sponsor_alpha',
  'participant_alpha_1',
  'participant_alpha_2',
  'external_facilitator_alpha',
  'same_org_nonmember_alpha',
  'cross_org_user_beta',
  'revoked_member_alpha',
  'disabled_user_alpha'
];

test('fixture manifest is synthetic-only and contains no real contact fields', () => {
  expect(manifest.data_policy).toBe('synthetic_only');
  expect(manifest.forbid_real_client_or_participant_data).toBe(true);
  const raw = JSON.stringify(manifest);
  expect(raw).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  expect(raw).not.toMatch(/\+?\d[\d\s()-]{7,}/);
  expect(manifest.rules.production_secrets).toBe('forbidden');
  expect(manifest.rules.production_identifiers).toBe('forbidden');
});

test('fixture actor coverage matches the staging execution specification', () => {
  expect(manifest.actors.map(({ key }) => key)).toEqual(requiredActors);
  expect(new Set(manifest.actors.map(({ key }) => key)).size).toBe(requiredActors.length);
});

test('fixture graph contains cross-organization and cross-transformation boundaries', () => {
  expect(manifest.organizations.map(({ key }) => key)).toEqual(['organization_alpha', 'organization_beta']);
  expect(manifest.transformations).toEqual([
    { key: 'transformation_alpha_1', organization: 'organization_alpha' },
    { key: 'transformation_alpha_2', organization: 'organization_alpha' },
    { key: 'transformation_beta_1', organization: 'organization_beta' }
  ]);
});

test('fixture graph contains the sensitive states needed for negative authorization proof', () => {
  expect(manifest.required_sensitive_fixtures).toEqual([
    'participant_private_record_alpha_1',
    'finance_restricted_record_alpha_1',
    'owner_only_decision_alpha_1',
    'quarantined_intake_alpha_1'
  ]);
});

test('privileged internal actors declare stronger assurance expectations without pretending external policy is decided', () => {
  const byKey = Object.fromEntries(manifest.actors.map((actor) => [actor.key, actor]));
  expect(byKey.owner_alpha.expected_assurance).toBe('aal2_for_privileged_actions');
  expect(byKey.security_admin_alpha.expected_assurance).toBe('aal2_for_privileged_actions');
  expect(byKey.client_sponsor_alpha.expected_assurance).toBe('to_validate');
  expect(byKey.participant_alpha_1.expected_assurance).toBe('to_validate');
});
