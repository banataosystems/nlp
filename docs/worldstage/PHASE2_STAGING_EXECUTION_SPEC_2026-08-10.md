# WorldStage / Cherry — Phase 2 staging execution specification

**Date:** 2026-08-10  
**Status:** NON-PRODUCTION SPECIFICATION — DO NOT CREATE LIVE CLIENT DATA  
**Scope:** staging-only execution plan for secure intake, RLS/RBAC, audit, backup/restore and rollback validation

## Purpose

Define exactly how Phase 2 should be executed in a disposable/non-production environment once owner/security gates are satisfied, without allowing staging work to become an accidental production activation.

This specification does not create a Supabase project, database, auth tenant, secret, endpoint, migration, or production release.

## Environment topology

Required logical separation:

`local/dev → isolated staging → production`

### Local/dev

Use only synthetic fixtures. No real client/participant records.

Purpose:
- migration syntax checks;
- unit/static policy tests;
- local API contract tests;
- deterministic fixtures.

### Staging

Must be a distinct project/environment with distinct credentials and no production aliases.

Allowed data:
- synthetic organizations;
- synthetic contacts;
- synthetic transformations;
- synthetic participant identities;
- synthetic evidence/decisions;
- owner-approved test accounts only.

Denied:
- live client confidential material;
- real participant responses;
- production payment data;
- production secrets copied for convenience;
- real client documents unless a later explicit security exception authorizes a controlled fixture.

### Production

No Phase 2 activation from this specification. Production requires a separate explicit release authorization after all staging gates pass.

## Environment naming / binding rules

Candidate identifiers are placeholders until the actual provider is selected.

- `WORLDSTAGE_ENV=development|staging|production`
- staging project ID must differ from production project ID;
- staging URL/domain must not own `cherrypua.vercel.app`;
- staging database credentials must never be usable against production;
- staging service-role key must never be exposed client-side;
- production secrets are not copied into GitHub fixtures.

Deployment/runtime must fail closed if environment identity is ambiguous.

## Migration conversion order

The current SQL drafts under `docs/worldstage/phase2-sql-drafts/` are not executable migrations.

When approved for staging conversion, create reviewed executable migrations in this order:

1. enum/types and extensions;
2. organizations/people;
3. transformations;
4. transformation memberships;
5. intakes/intake answers;
6. discovery records;
7. sources/object-source links;
8. decisions;
9. audit events;
10. indexes/constraints;
11. RLS enable + FORCE RLS;
12. helper functions;
13. narrow policies;
14. audit triggers/functions if selected;
15. seed-only staging fixtures in a clearly staging-only path.

Each migration must be independently reviewable and forward-only by default. Destructive rollback is not assumed.

## Migration safety checks

Before applying each migration to staging:

- exact commit SHA recorded;
- SQL reviewed;
- no `GRANT ... TO anon` or broad public grant for private tables;
- every private table has RLS enabled/forced before app access;
- no production connection string in CI logs;
- no arbitrary retention scheduler;
- no hidden service-role bypass in browser code;
- no data-destructive statement without explicit migration review.

After each migration:

- schema introspection recorded;
- constraints verified;
- policies enumerated;
- negative smoke tests run;
- audit path checked where applicable.

## Synthetic staging identity set

Create deterministic test identities only after the auth provider is selected.

Required actor classes:

1. `owner_alpha`
2. `transformation_lead_alpha`
3. `relationship_lead_alpha`
4. `operations_alpha`
5. `evidence_reviewer_alpha`
6. `finance_alpha`
7. `security_admin_alpha`
8. `client_sponsor_alpha`
9. `participant_alpha_1`
10. `participant_alpha_2`
11. `external_facilitator_alpha`
12. `same_org_nonmember_alpha`
13. `cross_org_user_beta`
14. `revoked_member_alpha`
15. `disabled_user_alpha`

Each account must have a documented expected assurance level and transformation membership state.

No fixture email/domain should impersonate a real person or WorldStage client.

## Synthetic business fixtures

Minimum staging data graph:

- Organization Alpha
  - Transformation Alpha-1
  - Transformation Alpha-2
- Organization Beta
  - Transformation Beta-1

Participant-private records must exist for Alpha-1 to test sponsor isolation.
Finance-restricted records must exist for Alpha-1 to test delivery-role denial.
Owner-only decisions must exist for Alpha-1 to test authority/AAL2.
A quarantined intake must exist to test restricted handling.

## Signed-user RLS test scenarios

Tests must run with real signed user sessions/tokens from the selected staging identity provider rather than fabricated client-side role flags.

### Positive cases

- owner reads approved assigned resources;
- transformation lead reads assigned transformation;
- authorized reviewer reads assigned intake;
- sponsor reads explicitly sponsor-visible aggregate only;
- participant accesses only their permitted participant surface;
- finance accesses permitted finance record;
- owner resolves an owner-level decision with required step-up.

### Negative cases

- same-org nonmember reads another transformation → deny;
- cross-org user reads/writes Alpha → deny;
- sponsor reads participant-private response → deny;
- participant 1 reads participant 2 → deny;
- operations reads finance-restricted record → deny;
- finance reads participant-private record → deny;
- external facilitator reads unassigned transformation → deny;
- security admin reads business-confidential content without explicit break-glass policy → deny;
- revoked membership via fresh API call → deny;
- stale browser role/localStorage mutation → deny;
- forged transformation ID → deny;
- direct REST/database route outside UI → same denial;
- owner-level decision without required AAL2 → deny;
- anonymous secure-intake read → deny;
- anonymous intake submission → deny unless owner-approved mode explicitly changes this gate.

## API integration-test harness

Once a staging route implementation exists, execute tests against the actual staged endpoint.

Required tests:

1. valid synthetic intake returns minimal `202` receipt;
2. same idempotency key + same body does not duplicate;
3. same idempotency key + changed body fails;
4. forbidden authority field rejected;
5. unknown field rejected;
6. invalid content type rejected;
7. oversized body rejected;
8. anonymous/auth-invalid behavior matches chosen mode;
9. receipt lookup cannot enumerate records;
10. reviewer route denies non-reviewer;
11. revoked reviewer denied;
12. review transition creates audit event;
13. review cannot grant membership;
14. review cannot promote participant-private data to sponsor-visible;
15. decision resolution without required AAL2 denied;
16. kill switch produces generic unavailable response and persists no body;
17. downstream audit/persistence failure does not claim success;
18. prompt-injection text is persisted/handled only as untrusted content and cannot execute authority;
19. runtime logs exclude full intake body/tokens;
20. no production release action is reachable from intake API.

## Audit assertions

For consequential staging writes, verify audit event contains:

- actor ID/type;
- canonical server timestamp;
- organization/transformation context;
- action;
- resource type/ID;
- outcome;
- correlation/request ID;
- approval/AAL2 reference when required;
- structured change summary for consequential mutation.

Verify audit event does **not** contain:

- bearer token;
- cookie/session secret;
- service-role key;
- raw participant response body unless the audit design explicitly and safely requires a redacted reference;
- payment secret;
- full confidential intake narrative.

Audit records must be immutable to ordinary users.

## AAL2 / step-up staging tests

If Supabase/TOTP remains the chosen design, privileged tests must prove:

`AAL1 → privileged action denied → challenge/verify → AAL2 → narrow privileged action succeeds → expired/revoked assurance → denied again`

Required privileged examples:
- owner-only decision resolution;
- sensitive export;
- permission grant/revoke;
- destructive retention/deletion operation;
- production administration/release authorization.

Production release itself remains separately governed and should not be exercised against production during staging testing.

## Backup / restore drill

Before confidential production activation, staging must prove data recovery.

### Backup drill

- create known synthetic dataset;
- record row counts/hashes for selected fixture objects;
- take/provider-confirm backup or snapshot using approved mechanism;
- make controlled non-sensitive changes/deletions in staging;
- restore into isolated recovery target where possible;
- compare expected fixture hashes/relationships;
- verify RLS/policies are preserved or re-applied correctly;
- verify restored environment is not exposed publicly.

### Evidence

Record:
- backup identifier/time;
- source environment;
- restore target;
- exact schema/app commit;
- result;
- discrepancies;
- elapsed operational steps if useful;
- reviewer/approver.

No production backup is modified by this drill.

## Kill-switch drill

Staging must demonstrate:

1. intake enabled for synthetic test;
2. privileged operator activates kill switch;
3. new submissions return generic unavailable response;
4. request bodies are not persisted;
5. no queue/AI/automation downstream side effect occurs;
6. kill-switch action is audited;
7. re-enable requires authorized action;
8. re-enable does not replay rejected bodies.

## Revocation drill

- sign in as active transformation member;
- verify allowed action;
- revoke membership server-side;
- repeat action using existing browser/session;
- server denies according to approved revocation/session semantics;
- obtain fresh session and verify denial persists;
- record audit evidence.

## Incident simulation

At minimum simulate in staging:

- suspected account compromise;
- leaked/rotated staging secret;
- repeated authorization failures;
- accidental highly sensitive intake content;
- unavailable database/audit dependency;
- bad migration requiring intake freeze;
- rollback/forward-fix decision.

Each simulation needs an owner, containment action, evidence source and recovery criterion.

## Observability requirements

Staging telemetry should prove behavior without leaking confidential payloads.

Required:
- request/correlation ID;
- route/status/latency;
- authorization outcome class;
- rate-limit/abuse-control outcome;
- error class;
- deployment/version identifier.

Denied by default:
- raw request bodies;
- secrets/tokens;
- participant narratives;
- confidential documents;
- unrestricted session replay on secure surfaces.

## Promotion criteria from staging to production candidate

Staging can become a production **candidate** only when all applicable items are evidenced:

- owner-approved workflow/model/roles/authority;
- approved data classification and retention/deletion;
- migrations apply cleanly from empty staging environment;
- signed-identity positive RLS tests pass;
- all required negative RLS tests pass;
- API integration tests pass;
- audit assertions pass;
- AAL2/step-up tests pass;
- kill-switch drill passes;
- revocation drill passes;
- backup/restore drill passes;
- secrets/security review passes;
- incident simulation completed;
- physical Android/iPhone secure-intake walkthrough passes;
- exact source/build/deployment provenance captured;
- independent review completed for high-risk paths;
- Pandora Memory synchronized or explicit governance exception recorded.

Passing staging does not authorize production.

## Production promotion rule

Production requires a separate explicit authorization event and exact source SHA.

The release record must bind:

`approved source SHA → test evidence → staging evidence → release approver → production deployment ID → smoke evidence → rollback candidate`

No “latest branch” or floating ref may substitute for exact source.

## Rollback / forward-fix criteria

Rollback choice must account for both app and data state.

### App rollback

Allowed when prior artifact remains compatible with current data schema and rollback candidate is verified.

### Database rollback

Do not automatically reverse destructive/data-shaping migrations. Prefer reviewed forward-fix when reversing would risk valid records.

### Intake freeze

A dedicated kill switch/write freeze is preferred when data safety is uncertain.

### Required evidence before release

- rollback candidate identified;
- compatibility assessed;
- intake-disable path proven;
- backup/restore path proven;
- audit preservation guaranteed.

## Staging exit checklist

- [ ] environment isolated from production
- [ ] synthetic data only
- [ ] exact migrations reviewed
- [ ] RLS enabled/forced
- [ ] signed-user test identities created
- [ ] positive tests pass
- [ ] negative tests pass
- [ ] API tests pass
- [ ] audit tests pass
- [ ] AAL2 tests pass
- [ ] kill-switch drill pass
- [ ] revocation drill pass
- [ ] backup/restore drill pass
- [ ] incident simulation complete
- [ ] physical-device validation pass
- [ ] exact evidence bundle produced
- [ ] production still unchanged

## Current status

This document is a staging execution **specification only**. No staging or production database environment has been created by this step.