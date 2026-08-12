# WorldStage / Cherry — Phase 2 secure-intake threat model

**Date:** 2026-08-10  
**Status:** NON-DEPLOYED DRAFT — SECURITY REVIEW REQUIRED

## Scope

Threat model for the proposed bounded flow:

`browser → secure intake API → RLS-protected persistence → human review → Transformation → Cherry Judgment Queue`

This document does not create any live data path.

## Assets to protect

- client/prospect business context;
- participant/person-level information;
- WorldStage internal analysis and judgment;
- relationship/contact data;
- transformation membership and authority;
- source provenance;
- decision records;
- audit history;
- authentication sessions/tokens;
- invitation tokens if adopted;
- private files if later enabled;
- production release authority.

## Trust boundaries

1. **Untrusted browser/content** — all submitted content and client-side state are untrusted.
2. **Secure intake API** — validation, abuse controls, authentication/binding, server-derived fields.
3. **Database/RLS** — tenant/transformation isolation and record-level policy enforcement.
4. **Human review** — classification and transformation linking.
5. **Cherry Judgment Queue** — decision support, not automatic authority.
6. **External providers** — email/calendar/AI/analytics/storage only after approved contracts.
7. **Production administration** — privileged release/configuration actions requiring separate authority.

## Threat categories and controls

### 1. Spoofing identity

Threats:
- forged browser role/local storage;
- stolen bearer token;
- forged intake invitation;
- email-domain impersonation;
- replay of old privileged session.

Controls:
- server-side identity resolution;
- never trust client role claims;
- signed, scoped, expiring invitations if that mode is selected;
- MFA for privileged internal users;
- AAL2/step-up for sensitive actions;
- short privileged windows and revocation testing;
- email domain alone never grants access.

### 2. Tampering

Threats:
- client sets reviewer/state/visibility/sensitivity;
- forged organization/transformation ID;
- decision state altered through direct API call;
- audit event modified/deleted;
- malicious body attempts prototype pollution/object confusion in future runtimes.

Controls:
- strict request allowlist;
- unknown fields rejected;
- privileged fields server-derived;
- RLS + server-side authorization;
- no ordinary audit update/delete path;
- schema validation and normalized object construction;
- state-transition checks on the server.

### 3. Repudiation

Threats:
- user denies approving a decision;
- reviewer denies changing visibility/classification;
- administrator denies granting membership;
- release action lacks identity/provenance.

Controls:
- append-oriented audit events;
- authenticated actor identity;
- correlation/request IDs;
- AAL2 reference where required;
- decision supersession chain;
- exact source/build/deployment provenance for release.

### 4. Information disclosure

Threats:
- sponsor sees participant-private data;
- cross-client/cross-transformation IDOR;
- receipt endpoint reveals existing clients/users;
- logs contain full confidential body/token;
- error message reveals reviewer, internal IDs or account existence;
- signed private file URL leaked/overlong;
- AI/retrieval surfaces unauthorized source.

Controls:
- transformation-scoped RLS;
- sponsor/participant separation;
- non-enumerating 404/low-information errors;
- public-safe opaque receipt only;
- privacy-safe logs;
- private files and short-lived signed URLs if later enabled;
- authorization-filtered retrieval;
- default deny for AI/analytics on restricted data.

### 5. Denial of service / abuse

Threats:
- submission flood;
- oversized/deep JSON;
- repeated expensive validation;
- bot attacks on public intake;
- idempotency-store exhaustion;
- brute-force receipt lookup.

Controls:
- rate limits;
- payload byte/depth/field-count limits;
- timeouts/concurrency limits;
- abuse/bot controls proportionate to intake mode;
- receipt entropy + rate limits;
- idempotency rules and approved retention;
- kill switch.

### 6. Elevation of privilege

Threats:
- operations user approves owner-only decision;
- security admin gains business-content authority;
- reviewer grants transformation membership;
- sponsor changes sponsor-visible flag;
- stale membership remains effective;
- service-role credential exposed to browser.

Controls:
- explicit transformation membership;
- separate technical vs business authority;
- no direct membership-grant policy from ordinary app paths;
- no direct decision-approval policy before authority validation;
- live membership lookup for authorization;
- privileged service credentials server-only;
- role-revocation negative tests.

## Content-specific threats

### Prompt injection / malicious instructions

Threat:
Submitted narrative contains instructions such as “ignore previous rules,” data-exfiltration requests, or payloads intended to manipulate future AI processing.

Controls:
- intake content is data, never authority;
- no automatic LLM call on intake;
- later AI processing happens only after classification/authorization;
- retrieval source and actor authorization enforced before context assembly;
- AI output stays suggestion, never approval.

### Sensitive-data oversharing

Threat:
A prospect submits credentials, payment secrets, health data, privileged legal material, sensitive HR information, or participant-private material beyond the approved intake purpose.

Controls:
- clear intake notice;
- minimal fields;
- sensitive-content quarantine/review path;
- no echo in response/logging;
- no analytics/AI/vector forwarding;
- legal/privacy handling process `TO VALIDATE`.

### Formula/script/markup injection

Threat:
Submitted text later lands in spreadsheets, HTML, Markdown, email, PDFs or downstream systems and executes/interprets unexpectedly.

Controls:
- treat stored content as untrusted;
- context-appropriate output escaping;
- spreadsheet formula neutralization when exporting;
- no raw HTML trust;
- sanitization belongs at rendering/export boundary, not destructive mutation of source evidence.

## API abuse cases

1. Caller supplies `assigned_reviewer_user_id` → reject `422`.
2. Caller supplies `state=accepted` → reject `422`.
3. Caller supplies `visibility_scope=client_sponsor_visible` → reject `422`.
4. Caller submits another transformation ID → reject/ignore only according to explicit server contract; default reject.
5. Caller reuses idempotency key with different body → `409`.
6. Anonymous caller uses route when anonymous mode not approved → `401/403/404` according to non-enumeration policy.
7. Caller probes receipt codes → rate-limit and non-enumerating response.
8. Revoked reviewer tries review → deny.
9. Reviewer attempts owner-only decision resolve → deny.
10. Caller omits/forges consent/notice version → validation failure or controlled clarification according to approved policy.
11. Caller exceeds payload limit → `413`.
12. Unsupported content type → `415`.
13. Burst submissions → `429`.
14. Intake kill switch active → `503`, no persistence/downstream actions.
15. Internal error occurs after partial processing → atomic rollback/idempotent retry, no success response.

## Data-flow threats

### Browser → API

Risks:
- token theft;
- CSRF if cookies;
- CORS misconfiguration;
- oversized input;
- malicious text.

Controls:
- TLS;
- same-origin CORS default;
- CSRF protection if cookie auth;
- strict validation;
- auth/invitation scope;
- limits/rate controls.

### API → database

Risks:
- service privilege overreach;
- SQL injection;
- wrong tenant/transformation linkage;
- partial writes.

Controls:
- parameterized SDK/query paths;
- no raw client SQL;
- server-resolved foreign keys;
- RLS plus server authorization;
- transaction/atomicity for receipt + intake + audit where feasible;
- idempotency.

### Database → human review

Risks:
- overbroad reviewer access;
- participant/sponsor leakage;
- source provenance lost;
- reviewer changes privileged classification without trace.

Controls:
- assigned/authorized review scope;
- minimum fields;
- provenance links;
- audited state/classification changes;
- separate sponsor/private scopes.

### Review → Cherry Judgment Queue

Risks:
- unreviewed content becomes decision;
- AI suggestion presented as fact;
- wrong required authority;
- sensitive content leaks into executive summary.

Controls:
- only accepted/authorized inputs enter queue;
- fact/suggestion/source-required separation;
- required authority stored and checked;
- privacy-aware source filtering;
- no auto-send/auto-approve.

## External-provider threats

Before any connector is enabled, assess:

- credential scope;
- provider retention;
- data residency/contractual terms where relevant;
- webhook authenticity if webhooks are later introduced;
- retries/idempotency;
- revocation;
- logging/telemetry;
- least-data transfer;
- provider outage/degraded behavior.

No connector may bypass the internal authorization model merely because the service credential can technically access more data.

## Logging/observability threats

Threats:
- confidential body captured in runtime logs;
- authorization header/token logged;
- participant PII sent to analytics;
- error tracing stores raw request payload.

Controls:
- structured metadata-only logs;
- explicit field redaction;
- no full body logging;
- no auth/cookie/token logging;
- restricted surfaces excluded from session replay;
- error telemetry configured to avoid raw sensitive payloads.

## Availability / incident threats

Threats:
- compromised intake route continues collecting data;
- bug creates wrong visibility;
- provider breach/outage;
- leaked secret.

Controls:
- intake kill switch;
- permission revocation path;
- secret rotation procedure;
- data write freeze option;
- audit retrieval;
- rollback/forward-fix procedures;
- incident owner `TO VALIDATE`;
- legal/privacy notification obligations `TO VALIDATE`.

## Residual risks requiring owner/security decisions

- anonymous vs authenticated intake;
- exact participant/sponsor boundaries;
- actual role/delegation model;
- retention/deletion periods;
- whether external facilitators need private access;
- AI eligibility by data class;
- systems of record and provider integrations;
- legal/privacy notice language;
- incident owner and escalation path.

## Verification rule

This threat model is **documented**, not verified implementation evidence.

A threat is considered mitigated only when the corresponding control is implemented in a selected environment and tested with positive/negative evidence.