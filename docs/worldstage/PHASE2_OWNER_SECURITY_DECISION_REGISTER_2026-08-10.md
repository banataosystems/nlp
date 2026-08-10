# WorldStage / Cherry — Phase 2 owner/security decision register

**Date:** 2026-08-10  
**Status:** OWNER / SECURITY DECISIONS REQUIRED  
**Purpose:** convert the remaining Phase 2 blockers into explicit approve / change / reject decisions before any live staging database or confidential intake environment is created.

## Operating rule

No unresolved item in this register may be silently inferred from public information, developer preference, platform defaults, or convenience.

For each item, record:
- decision;
- approver;
- date;
- rationale;
- source/evidence;
- exceptions;
- implementation impact.

Until resolved, the implementation state remains fail closed.

## D1 — Canonical workflow

**Question:** What exact WorldStage workflow should the system model for the first live implementation?

Proposed default for validation only:

`Secure Discovery Intake → Human Review → Transformation → Cherry Judgment Queue`

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Required evidence:
- one representative real engagement mapped end to end;
- owner correction of terminology and sequence.

Blocks:
- production schema activation;
- workflow-specific API states;
- automation decisions.

## D2 — Principal business object

**Question:** Is `Client Transformation` the canonical primary business object?

Proposed model:

`Organization → Transformation → Discovery → Insights → Design → Commercial Engagement → Intervention → Evidence → Debrief → Sustainment → Renewal/Expansion`

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- executable schema finalization;
- naming of foreign keys/routes/queues.

## D3 — Internal roles and authority

Candidate roles for validation only:
- owner;
- transformation lead;
- relationship lead;
- designer/facilitator;
- operations;
- evidence reviewer;
- finance;
- security admin.

Questions:
1. Which roles actually exist?
2. Which may overlap?
3. Which decisions require Cherry personally?
4. Which may be delegated and within what limits?
5. Who may grant/revoke access?
6. Is break-glass access permitted?

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- real RBAC/RLS policies;
- privileged APIs;
- real seed accounts.

## D4 — External roles

Candidate classes:
- client sponsor;
- client contact;
- participant;
- external facilitator.

Questions:
- Does sponsor differ from ordinary client contact?
- May external facilitators access private delivery materials?
- Does participant self-access exist?

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- portal scopes;
- participant policies;
- invitation logic.

## D5 — Participant vs sponsor privacy boundary

Conservative proposal:
- participant-person-level material is private by default;
- sponsor sees only explicitly approved aggregate/derived evidence;
- no sponsor inheritance from organization membership;
- facilitator-private notes remain separate.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- participant tables/policies;
- evidence aggregation/publication;
- sponsor portal.

## D6 — Data classification

Proposed classes:
0. Public
1. Internal business
2. Confidential client
3. Participant/person-level
4. Highly restricted

Questions:
- Which categories are prohibited entirely?
- Which may be used with AI?
- Which may be used with analytics/session replay?
- Which may be exported?

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- AI/retrieval;
- analytics;
- logging;
- retention.

## D7 — Retention and deletion

Canonical invariant: **retention/deletion durations are never invented.**

No durations are proposed automatically.

Required owner/legal/security decisions by data class:
- intake draft retention;
- submitted intake retention;
- client discovery records;
- participant records;
- evidence;
- audit logs;
- exports;
- backups;
- semantic/vector data if ever permitted;
- legal/contract hold behavior.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- retention jobs;
- deletion APIs;
- backup policy;
- production activation.

## D8 — Intake authentication mode

Choose exactly one initial mode:

### A — authenticated account
Submitter must authenticate first.

### B — signed invitation
Server-issued scoped/expiring token binds the intake invitation.

### C — anonymous public intake
Default denied; requires explicit owner/security/privacy approval plus stronger abuse controls.

Decision: `A / B / C / OPEN`

**Current:** OPEN

Blocks:
- endpoint implementation;
- identity provider configuration;
- abuse model.

## D9 — Internal authentication / MFA

Conservative proposal:
- strong internal auth;
- MFA for privileged users;
- AAL2/step-up for permission changes, sensitive exports, owner-level decisions, destructive deletion/retention operations, production administration/release authorization.

If Supabase remains selected, TOTP/AAL2 is the current candidate design.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

Blocks:
- auth implementation;
- privileged route tests.

## D10 — Systems of record

Confirm authoritative systems for:
- email;
- calendar;
- contacts/CRM;
- proposals/contracts;
- schedules;
- documents/files;
- event/ticket registration;
- payments/accounting;
- participant forms/surveys;
- learning platform / Fire University;
- analytics;
- messaging/follow-up.

For each: `KEEP / WRAP / REPLACE / NO INTEGRATION / UNKNOWN`.

**Current:** OPEN

Blocks:
- connectors;
- data synchronization;
- source provenance rules.

## D11 — Source provenance requirements

Conservative proposal:
Every consequential insight/decision preserves:
- source type;
- source record/reference;
- supplied-by identity;
- capture timestamp;
- reviewer;
- transformation context;
- sensitivity/visibility.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

## D12 — AI eligibility

Conservative default:
- no automatic AI from intake;
- data class must explicitly permit AI;
- retrieval respects current actor authorization;
- AI output remains suggestion, not approval;
- no automatic external messaging;
- no AI permission changes/deletion/release actions.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

## D13 — Analytics / replay eligibility

Conservative default:
- no confidential client/participant payload in analytics;
- no unrestricted session replay on secure surfaces;
- analytics events are metadata-only unless separately approved.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

## D14 — File uploads

First live intake proposal:
- **disabled** initially.

Enable only after private-file review covering signed access, authorization, file validation, malware/quarantine, metadata leakage and deletion/retention.

Decision: `DISABLE INITIAL / ENABLE WITH REVIEW / OPEN`

**Current:** OPEN

## D15 — Staging provider/environment

Required decision:
- provider/project for isolated staging;
- staging project ID distinct from production;
- separate secrets;
- synthetic-only data;
- no production aliases;
- no production credentials in fixtures.

Candidate: isolated Supabase project if Supabase is confirmed as data/auth provider.

Decision: `SUPABASE / OTHER / OPEN`

**Current:** OPEN

Blocks:
- live staging creation.

## D16 — Staging environment creation authority

Question:
Who is authorized to create the staging project, generate staging-only credentials and manage technical access?

Decision: `NAMED AUTHORITY / OPEN`

**Current:** OPEN

Blocks:
- actual environment creation.

## D17 — Incident owner

Required named owner(s) for:
- suspected account compromise;
- leaked secret;
- sensitive-data exposure;
- intake kill switch;
- migration failure;
- access revocation;
- client/privacy escalation.

Decision: `NAMED OWNER(S) / OPEN`

**Current:** OPEN

Blocks:
- confidential staging/prod activation.

## D18 — Kill-switch authority

Question:
Who may disable/re-enable secure intake?

Conservative requirement:
- disable must be possible without deploying the public site;
- action audited;
- re-enable separately authorized.

Decision: `NAMED AUTHORITY / OPEN`

**Current:** OPEN

## D19 — Backup / restore target

Required decisions:
- backup provider/mechanism;
- backup retention;
- restore authority;
- recovery environment;
- recovery objectives if contractually needed.

Decision: `APPROVE / CHANGE / OPEN`

**Current:** OPEN

## D20 — Physical-device approval

Required evidence:
- physical iPhone walkthrough;
- physical Android walkthrough;
- secure-intake keyboard behavior once implemented;
- accessibility/touch review;
- exact preview/source SHA.

Decision: `PASS / FAIL / OPEN`

**Current:** OPEN

## D21 — Owner-approved media/content rights

Confirm:
- Cherry photography;
- team photography;
- client logos;
- testimonials/case studies;
- public outcome claims;
- trademarked vocabulary usage.

Decision: `APPROVED SET / OPEN`

**Current:** OPEN

## D22 — Pandora Memory governance

Current connector state does not prove canonical Memory synchronization.

Choose before production:
- restore/synchronize Pandora Memory; or
- document explicit governance exception and alternate canonical state procedure.

Decision: `SYNC / EXCEPTION / OPEN`

**Current:** OPEN

## D23 — Production release authority

Question:
Who may explicitly authorize production promotion after all technical/business gates pass?

Conservative requirement:
- separate from staging PASS;
- exact source SHA;
- exact deployment evidence;
- rollback candidate;
- release identity/audit reference.

Decision: `NAMED AUTHORITY / OPEN`

**Current:** OPEN

## D24 — First production scope

Conservative candidate:
- secure intake;
- human review;
- transformation linking;
- Cherry Judgment Queue handoff;
- no files;
- no participant survey;
- no sponsor portal;
- no payment mutation;
- no automatic messaging;
- no semantic memory;
- no autonomous AI decisions.

Decision: `APPROVE / CHANGE / REJECT / OPEN`

**Current:** OPEN

## Readiness rule

**LIVE STAGING CREATION = BLOCKED** until at minimum D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 are resolved with evidence.

**CONFIDENTIAL PRODUCTION ACTIVATION = BLOCKED** until all applicable decisions are resolved and technical staging evidence passes.

## Decision capture template

For each resolved item:

```text
Decision ID:
Decision:
Approved by:
Date:
Evidence/source:
Rationale:
Exceptions:
Implementation impact:
```

## Current state

All decision entries remain OPEN unless separately evidenced and recorded. This register does not itself approve any business/security policy or authorize infrastructure creation.