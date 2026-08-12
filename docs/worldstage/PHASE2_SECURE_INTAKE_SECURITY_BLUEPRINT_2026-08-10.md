# WorldStage / Cherry — Phase 2 secure intake security blueprint

**Date:** 2026-08-10  
**Project:** WorldStage / Cherry Adaptive Operating System  
**Repository:** `banataosystems/nlp`  
**Status:** NON-DEPLOYED DRAFT — OWNER / SECURITY VALIDATION REQUIRED

## Purpose

Design the minimum safe architecture for moving from the current non-confidential browser-only Discovery prototype to a secure server-side intake and human-review workflow without assuming Cherry/WorldStage's private authority, retention, or systems-of-record choices.

This document is a blueprint only. It creates no database, secrets, production endpoints, authentication accounts, or production permissions.

## Governing principles

1. **Fail closed.** Unknown authority, retention, visibility, or source ownership remains denied until explicitly validated.
2. **Transformation-scoped access.** Access is granted to a specific WorldStage transformation/client context, not globally by convenience.
3. **Least privilege.** Each actor receives only the minimum read/write/approve capabilities required.
4. **Human judgment remains human.** AI/system suggestions never become WorldStage decisions, client commitments, public claims, or sensitive exports without an authorized human action.
5. **Source provenance is mandatory.** Material facts and sensitive insights preserve source type, source identity/reference, who supplied them, when they were captured, and who reviewed them.
6. **Participant privacy is separate from sponsor visibility.** Sponsor/client users do not automatically inherit participant-level access.
7. **No sensitive data in public or uncontrolled surfaces.** Private client/participant material must not enter public GitHub, public analytics, screenshots, logs, prompts, or general semantic memory.
8. **Production release is independently gated.** Passing application tests is not authority to activate confidential intake or production integrations.

## Proposed trust boundaries

### Boundary A — Public website

Allowed:
- public WorldStage content;
- generalized non-confidential Discovery guidance;
- public contact information;
- explicit transition into secure intake.

Denied:
- confidential client narratives;
- participant/person-level responses;
- payment data;
- credentials;
- private documents;
- restricted client records.

### Boundary B — Secure intake

Purpose:
- accept an authenticated or cryptographically bound submission;
- collect explicitly allowed business contact/context fields;
- validate consent/notice version;
- assign a server-generated intake ID;
- write immutable intake receipt/audit events;
- route to human review.

Default state: `pending_human_review`.

No automated recommendation becomes an approved WorldStage conclusion.

### Boundary C — Internal review

Purpose:
- authorized staff review source material;
- classify sensitivity;
- normalize terminology;
- link or create a Transformation;
- decide whether an item enters Cherry Judgment Queue;
- record review decision and provenance.

### Boundary D — Cherry Judgment Queue

Purpose:
- surface only decisions requiring owner-level or specially delegated judgment;
- preserve fact / system suggestion / source-required-question separation;
- never auto-send relationship-sensitive messages;
- never auto-approve commercial exceptions or public claims.

### Boundary E — Client/sponsor portal

Purpose:
- show only explicitly approved sponsor-visible records;
- exclude participant-private, facilitator-private, internal-risk, and owner-only material by default.

### Boundary F — Participant/private evidence

Purpose:
- maintain participant/person-level records behind distinct policy scopes;
- allow aggregation only through approved privacy-safe transforms;
- prevent reverse exposure to sponsor/client users.

## Proposed identity model

### Internal identities

Candidate roles — names are placeholders pending owner validation:

- `owner` — Cherry or owner-equivalent authority.
- `transformation_lead` — accountable engagement lead.
- `relationship_lead` — manages client relationship/follow-up.
- `designer_facilitator` — intervention design/delivery access.
- `operations` — logistics/scheduling/admin access.
- `evidence_reviewer` — measurement/evidence review.
- `finance` — commercial/payment status access only where required.
- `security_admin` — technical security administration; cannot silently gain business-decision authority.

**TO VALIDATE:** actual WorldStage role names, delegation rules, overlap, emergency access, and who may grant/revoke membership.

### External identities

Candidate actor classes:

- `client_sponsor`
- `client_contact`
- `participant`
- `external_facilitator`
- `public_visitor`

External users must never receive internal-role permissions merely because their email belongs to the same organization.

## Authentication blueprint

Minimum proposal:

- strong authenticated internal sessions;
- MFA required for privileged internal roles;
- step-up/AAL2 required for sensitive export, destructive retention/deletion, production administration, permission grants, and release authorization;
- short session lifetime for privileged operations;
- secure reauthentication for high-risk actions;
- no authorization decision based solely on client-side state.

**TO VALIDATE:** chosen identity provider and whether owner/team workflows support passkeys, TOTP, SSO, or another approved factor mix.

## Authorization model

Authorization checks must be server-side and evaluate at least:

`actor → organization → transformation membership → role → resource sensitivity → action → approval state`

Example predicate:

`can(actor, action, resource)` only if all are true:

1. authenticated actor is active;
2. actor belongs to the authorized WorldStage organization or allowed external party;
3. resource belongs to a transformation the actor may access;
4. actor role grants the requested action;
5. sensitivity classification permits the action;
6. object state permits the action;
7. additional approval/step-up requirements are satisfied.

No client-side role flag is authoritative.

## RLS/RBAC blueprint

Every tenant-owned or transformation-owned table exposed through the application must have RLS enabled.

### Proposed core policy dimensions

- `organization_id`
- `transformation_id`
- `actor_user_id`
- `membership_role`
- `visibility_scope`
- `sensitivity_class`
- `source_owner_type`
- `record_state`

### Default-deny visibility scopes

Candidate scopes:

- `public`
- `worldstage_internal`
- `owner_only`
- `transformation_team`
- `client_sponsor_visible`
- `participant_private`
- `facilitator_private`
- `finance_restricted`
- `security_restricted`

**TO VALIDATE:** exact scopes and who may transition records between scopes.

### Critical negative tests

RLS testing must prove denial for:

- another transformation in the same organization when membership is absent;
- another organization/tenant;
- client sponsor reading participant-private records;
- participant reading other participants' records;
- facilitator reading finance-restricted records;
- operations user approving owner-only decisions;
- removed/disabled membership accessing cached or direct API paths;
- anonymous user reading secure intake rows;
- client-side role manipulation;
- forged transformation IDs;
- stale JWT/session after role revocation where platform capabilities allow immediate revocation/step-up enforcement.

## Proposed secure-intake objects

No physical database schema is approved yet. Logical candidates:

### `intakes`

Fields:
- intake ID;
- organization/contact context;
- submission channel;
- notice/consent version;
- state;
- created timestamp;
- sensitivity classification;
- assigned reviewer;
- linked transformation ID nullable until review.

### `intake_answers`

Fields:
- intake ID;
- question key/version;
- answer body;
- source classification;
- sensitivity class;
- visibility scope;
- redaction status.

### `transformations`

Primary business object representing the client transformation lifecycle, not a generic event.

### `transformation_memberships`

Explicit actor-to-transformation authorization.

### `sources`

Source provenance record for emails, notes, documents, calls, forms, surveys, external systems, or human-entered facts.

### `decisions`

Human/system decision record with:
- decision type;
- proposed-by;
- fact basis/source links;
- recommendation text if any;
- required authority;
- decision state;
- decision maker;
- decision timestamp;
- supersession chain.

### `evidence_items`

Evidence state kept distinct from marketing/public claims.

Candidate state chain:

`anecdotal → observed → measured → client_confirmed → externally_verified → publicly_approved`

### `audit_events`

Append-oriented security/business audit trail.

## Audit blueprint

At minimum record:

- authentication success/failure where appropriate;
- MFA/step-up success/failure;
- membership grant/change/revoke;
- secure intake created/viewed/assigned;
- sensitivity/visibility changed;
- source attached/removed/redacted;
- decision proposed/approved/rejected/superseded;
- client-visible publication;
- sensitive export;
- retention deletion request and execution;
- production release authorization;
- privileged configuration change;
- rollback invocation.

Audit event fields should include:

- event ID;
- timestamp;
- actor ID/type;
- organization/transformation IDs where applicable;
- action;
- resource type/ID;
- before/after hashes or structured change summary for consequential mutations;
- request/correlation ID;
- IP/coarse network metadata only where lawful/necessary;
- user agent/device metadata only where useful and privacy-appropriate;
- outcome;
- reason/approval reference.

Audit logs should be tamper-evident and inaccessible to ordinary client/participant actors.

## Data classification draft

### Class 0 — Public

Examples: approved public website content.

### Class 1 — Internal business

Examples: internal planning/logistics that are not client-confidential.

### Class 2 — Confidential client

Examples: client discovery notes, proposals, private business context.

### Class 3 — Participant/person-level

Examples: individual survey/FGD responses or attributable participant observations.

### Class 4 — Highly restricted

Candidate examples: credentials, payment secrets, privileged legal material, health/safety information, highly sensitive HR matters.

**TO VALIDATE:** exact classification definitions, handling rules, regulatory constraints, and whether certain categories are prohibited entirely.

## Retention and deletion

No production retention duration is approved.

Until owner/legal/security validation:

- do not invent retention periods;
- do not silently retain abandoned secure-intake drafts indefinitely;
- do not permit destructive deletion without authorization and audit;
- preserve legal/contractual hold capability if required;
- define deletion across primary data, derived indexes, cached exports, backups, analytics, and AI/vector stores before activation;
- treat semantic memory/embedding retention as a separate explicit permission question.

**TO VALIDATE:** retention per data class, participant deletion rights, sponsor access period, contract/legal hold rules, backup retention, and AI/vector-store eligibility.

## Analytics and AI boundary

Default deny for confidential/restricted surfaces.

No session replay, raw event payload, prompt logging, or third-party analytics may receive client/participant content unless specifically approved through privacy/security review.

AI can assist with:

- structure suggestions;
- summarization of authorized inputs;
- question generation;
- non-authoritative recommendations;
- retrieval of explicitly authorized sources.

AI cannot autonomously:

- approve a transformation design;
- publish an outcome claim;
- send relationship-sensitive messages;
- disclose participant/private evidence;
- change permissions;
- delete restricted data;
- authorize production release.

## Secure intake state machine draft

`draft → submitted → pending_human_review → needs_clarification | accepted → linked_to_transformation → archived`

Sensitive exception states:

`quarantined`, `rejected_for_sensitive_content`, `legal_security_review`

**TO VALIDATE:** whether WorldStage wants drafts server-side at all, whether anonymous intake is allowed, who can clarify/reopen, and deletion behavior.

## Network and storage controls

Minimum target controls:

- TLS only;
- secure cookies/session protections;
- CSRF protection where applicable;
- strict CSP;
- no cross-origin wildcard for secure APIs;
- signed, short-lived access for private files/media;
- server-side file-type/size validation;
- malware scanning for uploaded files if uploads are enabled;
- encryption at rest through chosen platform controls;
- secrets only in managed secret stores/environment configuration;
- no secrets committed to GitHub;
- backup/restore testing before confidential production activation.

## Proposed API boundary

Public website must not write directly to privileged business tables.

Preferred path:

`browser → secure intake API/function → validation/rate limit/auth context → RLS-protected persistence → audit event → human review queue`

Privileged service-role credentials never reach the browser.

## Abuse controls

Before public intake activation:

- rate limiting;
- bot/abuse protection proportionate to risk;
- duplicate-submission/idempotency handling;
- payload size limits;
- input normalization;
- upload restrictions;
- alerting for abnormal submission/authorization patterns.

## Phase 2 implementation sequence — proposed

### P2.0 Owner/security decisions

Must complete:
- owner approves vocabulary/data model;
- authority matrix confirmed;
- data classes and retention defined;
- systems of record selected;
- first workflow confirmed.

### P2.1 Environment foundation

- create/verify target data environment;
- define dev/staging/production separation;
- establish backup/restore plan;
- secrets inventory;
- request/correlation IDs;
- security logging.

### P2.2 Authentication and memberships

- internal auth;
- MFA/step-up;
- organization membership;
- transformation membership;
- role assignment/revocation;
- negative authorization tests.

### P2.3 Secure intake storage

- RLS-protected logical objects;
- intake state machine;
- immutable receipt ID;
- consent/notice versioning;
- classification/visibility fields;
- audit events.

### P2.4 Human review queue

- reviewer assignment;
- sensitive-content quarantine;
- transformation linking;
- clarification flow;
- explicit accept/reject;
- no automated Cherry escalation without policy.

### P2.5 Cherry Judgment Queue integration

- only human-reviewed/authorized items enter queue;
- fact/suggestion/source-required separation preserved;
- required authority stored on each decision;
- no auto-send or auto-approval.

### P2.6 Security verification

Required:
- positive RLS tests;
- negative cross-tenant/transformation tests;
- role-revocation tests;
- sponsor/participant isolation tests;
- audit completeness tests;
- backup/restore drill;
- retention/deletion test;
- secret scan;
- dependency/security review;
- mobile/browser secure-intake review;
- independent review for high-risk paths.

### P2.7 Release gate

No production activation until:
- owner approval;
- privacy/security approval;
- exact tested source;
- exact deployment provenance;
- rollback proof;
- physical-device validation;
- monitoring/incident path;
- Pandora Memory synchronization restored or explicit governance exception.

## Rollback model

Before activating confidential intake, rollback must address both application and data:

- application version rollback;
- feature/route disable switch for secure intake;
- schema migration rollback/forward-fix procedure;
- data write freeze procedure;
- audit preservation;
- restore-from-backup procedure;
- communication/incident owner.

Never implement a destructive rollback that silently discards valid client/participant records.

## Open owner/security decisions

All remain `TO VALIDATE`:

1. actual internal role names and delegation;
2. who can approve/override Cherry-level decisions;
3. real systems of record;
4. anonymous vs authenticated intake;
5. server-side draft behavior;
6. participant/sponsor visibility rules;
7. data retention/deletion periods;
8. AI/vector-store eligibility by data class;
9. external facilitator permissions;
10. finance/commercial visibility;
11. production incident owner;
12. required legal/privacy notices and consent language.

## Activation rule

This blueprint may guide implementation planning, tests, and schema drafts. It may **not** be treated as an approved production authorization model until the owner/security validation gates above are satisfied.