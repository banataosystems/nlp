import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const draftDir = 'docs/worldstage/phase2-sql-drafts';

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const schema = `${draftDir}/001_minimum_schema.sql`;
const rls = `${draftDir}/002_rls_policy_skeleton.sql`;
const fixtures = `${draftDir}/003_negative_authorization_fixtures.sql`;
const runtimeAlignment = `${draftDir}/004_runtime_alignment_constraints.sql`;
const readme = `${draftDir}/README.md`;

const privateTables = [
  'ws_organizations',
  'ws_people',
  'ws_transformations',
  'ws_transformation_memberships',
  'ws_intakes',
  'ws_intake_answers',
  'ws_discovery_records',
  'ws_sources',
  'ws_decisions',
  'ws_object_sources',
  'ws_audit_events',
];

test('Phase 2 SQL stays in documentation, not executable migration paths', () => {
  for (const rel of [readme, schema, rls, fixtures, runtimeAlignment]) expect(fs.existsSync(path.join(root, rel))).toBe(true);
  expect(draftDir).toMatch(/^docs\/worldstage\//);
  expect(draftDir).not.toMatch(/(^|\/)supabase\/migrations(\/|$)/);
  expect(draftDir).not.toMatch(/(^|\/)migrations(\/|$)/);
  expect(read(readme)).toContain('DO NOT APPLY');
});

test('minimum schema contains only the bounded Phase 2 slice and no retention scheduler', () => {
  const source = read(schema);
  for (const table of privateTables) expect(source).toContain(`create table ${table}`);
  expect(source).toContain('client transformation');
  expect(source).toContain('TO VALIDATE');
  expect(source).not.toMatch(/cron|pg_cron|schedule\s*\(/i);
  expect(source).not.toMatch(/retention.*interval\s*['"]/i);
  expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  expect(source).not.toContain('service_role');
});

test('runtime-alignment draft converts receipts to opaque text and scopes idempotency by actor', () => {
  const source = read(runtimeAlignment);
  expect(source).toContain('alter column receipt_code type text');
  expect(source).toContain('drop constraint if exists ws_intakes_idempotency_key_key');
  expect(source).toContain('idempotency_actor_scope text');
  expect(source).toContain('ws_intakes_actor_idempotency_unique');
  expect(source).toContain('(idempotency_actor_scope, idempotency_key)');
  expect(source).toContain('browser cannot supply or override');
  expect(source).toContain('No global unique index on idempotency_key should remain');
});

test('every private table explicitly enables and forces RLS', () => {
  const source = read(rls);
  for (const table of privateTables) {
    expect(source).toContain(`alter table ${table} enable row level security;`);
    expect(source).toContain(`alter table ${table} force row level security;`);
  }
});

test('RLS draft contains no anonymous policies or broad public grants', () => {
  const source = read(rls).toLowerCase();
  expect(source).not.toMatch(/create\s+policy[\s\S]{0,250}\bto\s+anon\b/i);
  expect(source).not.toMatch(/grant\s+(select|insert|update|delete|all)[\s\S]{0,100}\bto\s+(anon|public)\b/i);
  expect(source).toContain('no anonymous insert policy');
  expect(source).toContain('no policies granted to anon');
});

test('high-risk mutations remain absent from direct RLS policy grants', () => {
  const source = read(rls).toLowerCase();
  expect(source).toContain('no insert/update/delete membership policy');
  expect(source).toContain('no decision approval update policy');
  expect(source).toContain('no retention/delete policy');
  expect(source).not.toMatch(/create\s+policy\s+[^\n]+\s+on\s+ws_audit_events\s+for\s+(update|delete)/i);
});

test('authorization depends on current database membership, not browser state', () => {
  const source = read(rls);
  expect(source).toContain('auth.uid()');
  expect(source).toContain('ws_transformation_memberships');
  expect(source).toContain('m.active = true');
  expect(source).toContain('ws_has_active_transformation_membership');
});

test('negative authorization fixture catalog covers required denial classes', () => {
  const source = read(fixtures).toLowerCase();
  const required = [
    'anonymous read secure intake',
    'same-organization non-member reads transformation',
    'cross-organization read',
    'forged transformation id',
    'sponsor reads participant-private data',
    'participant reads another participant',
    'operations reads finance-restricted data',
    'security admin reads confidential business content',
    'revoked membership',
    'client-side role manipulation',
    'direct api/database access outside ui',
    'sensitive export without aal2/step-up',
    'destructive deletion without authorized retention rule',
    'audit log mutation by ordinary user',
    'stale session after role revocation',
    'semantic/ai retrieval authorization',
  ];
  for (const phrase of required) expect(source).toContain(phrase);
  const negativeCases = [...source.matchAll(/-- n\d{2}\b/g)];
  expect(negativeCases.length).toBeGreaterThanOrEqual(30);
});

test('draft documentation preserves implementation boundary', () => {
  const docs = [
    read('docs/worldstage/PHASE2_SECURE_INTAKE_SECURITY_BLUEPRINT_2026-08-10.md'),
    read('docs/worldstage/PHASE2_RLS_RBAC_VERIFICATION_MATRIX_2026-08-10.md'),
    read('docs/worldstage/PHASE2_SECURITY_RELEASE_CHECKLIST_2026-08-10.md'),
  ].join('\n');
  expect(docs).toContain('NON-DEPLOYED');
  expect(docs).toContain('Unknown permission = denied');
  expect(docs).toContain('No duration is assumed');
  expect(docs).toContain('Browser emulation does not satisfy this gate');
});
