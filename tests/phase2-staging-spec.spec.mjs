import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const spec = fs.readFileSync('docs/worldstage/PHASE2_STAGING_EXECUTION_SPEC_2026-08-10.md', 'utf8');

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

test('staging remains isolated and synthetic-only', () => {
  expect(spec).toContain('local/dev → isolated staging → production');
  expect(spec).toContain('synthetic data only');
  expect(spec).toContain('No real client/participant records');
  expect(spec).toContain('staging project ID must differ from production project ID');
  expect(spec).toContain('production secrets are not copied into GitHub fixtures');
});

test('exact source provenance is mandatory', () => {
  expect(spec).toContain('exact commit SHA recorded');
  expect(spec).toContain('No “latest branch” or floating ref may substitute for exact source');
  expect(spec).toContain('approved source SHA → test evidence → staging evidence → release approver → production deployment ID → smoke evidence → rollback candidate');
});

test('staging pass never authorizes production', () => {
  expect(spec).toContain('Passing staging does not authorize production');
  expect(spec).toContain('Production requires a separate explicit authorization event and exact source SHA');
  expect(spec).toContain('No Phase 2 activation from this specification');
});

test('signed staging actor set covers privilege and isolation boundaries', () => {
  for (const actor of requiredActors) expect(spec).toContain(`\`${actor}\``);
  expect(spec).toContain('real signed user sessions/tokens');
  expect(spec).toContain('rather than fabricated client-side role flags');
});

test('negative authorization scenarios cover cross-scope and revocation failures', () => {
  const required = [
    'same-org nonmember reads another transformation → deny',
    'cross-org user reads/writes Alpha → deny',
    'sponsor reads participant-private response → deny',
    'participant 1 reads participant 2 → deny',
    'operations reads finance-restricted record → deny',
    'revoked membership via fresh API call → deny',
    'forged transformation ID → deny',
    'owner-level decision without required AAL2 → deny'
  ];
  for (const phrase of required) expect(spec).toContain(phrase);
});

test('staged API contract includes idempotency, authority, kill-switch and failure atomicity', () => {
  const required = [
    'same idempotency key + changed body fails',
    'forbidden authority field rejected',
    'review cannot grant membership',
    'decision resolution without required AAL2 denied',
    'kill switch produces generic unavailable response and persists no body',
    'downstream audit/persistence failure does not claim success',
    'no production release action is reachable from intake API'
  ];
  for (const phrase of required) expect(spec).toContain(phrase);
});

test('audit assertions exclude secrets and confidential payloads', () => {
  expect(spec).toContain('bearer token');
  expect(spec).toContain('service-role key');
  expect(spec).toContain('full confidential intake narrative');
  expect(spec).toContain('Audit records must be immutable to ordinary users');
});

test('backup, revocation, kill-switch and incident drills are mandatory', () => {
  expect(spec).toContain('## Backup / restore drill');
  expect(spec).toContain('## Kill-switch drill');
  expect(spec).toContain('## Revocation drill');
  expect(spec).toContain('## Incident simulation');
  expect(spec).toContain('No production backup is modified by this drill');
});

test('rollback is data-aware and does not assume destructive reversal', () => {
  expect(spec).toContain('Do not automatically reverse destructive/data-shaping migrations');
  expect(spec).toContain('Prefer reviewed forward-fix');
  expect(spec).toContain('A dedicated kill switch/write freeze is preferred');
});

test('spec explicitly remains non-live', () => {
  expect(spec).toContain('This specification does not create a Supabase project, database, auth tenant, secret, endpoint, migration, or production release');
  expect(spec).toContain('No staging or production database environment has been created by this step');
});
