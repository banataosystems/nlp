# WorldStage / Cherry — Phase 2 secure-intake API contract

**Date:** 2026-08-10  
**Status:** NON-DEPLOYED DRAFT — DO NOT IMPLEMENT AGAINST PRODUCTION YET  
**Scope:** first bounded secure-intake slice only

## Purpose

Define the server boundary for the proposed flow:

`browser → secure intake API → validation / abuse controls / auth context → RLS-protected persistence → audit receipt → human review`

This is a contract draft, not an endpoint implementation. No route, database write path, secret, service credential, authentication account, or confidential production intake is created by this document.

## Core invariant

The public/browser client may submit **content**, but it may never assign **authority**.

The client must not be trusted to choose or override:

- internal organization ownership;
- transformation membership;
- reviewer assignment;
- user/role identity;
- visibility scope;
- sensitivity class;
- approval state;
- decision authority;
- audit identity/outcome;
- retention/deletion class;
- client/sponsor publication state.

All privileged values are derived or assigned server-side after authenticated/human review.

## Proposed versioned route family

All names are placeholders until implementation review.

### Public/client submission

`POST /api/v1/intakes`

**Activation state now:** disabled / nonexistent.  
**Future purpose:** accept an owner-approved authenticated or cryptographically bound intake submission.

### Receipt lookup

`GET /api/v1/intakes/receipt/{receipt_code}`

**Activation state now:** disabled / nonexistent.  
**Future purpose:** expose only a minimal submitter-safe status if owner/security validation decides receipt lookup is needed.

### Internal human review

`GET /api/v1/internal/intakes/{intake_id}`  
`POST /api/v1/internal/intakes/{intake_id}/review`

**Activation state now:** disabled / nonexistent.  
**Future purpose:** authorized internal review only.

### Privileged decision action

`POST /api/v1/internal/decisions/{decision_id}/resolve`

**Activation state now:** disabled / nonexistent.  
**Future purpose:** human decision resolution with required role plus AAL2/step-up where policy requires.

No public route is allowed to write directly to `ws_transformations`, `ws_transformation_memberships`, `ws_decisions`, or `ws_audit_events`.

## Submission request allowlist

The first implementation should use an explicit allowlist. Unknown top-level or nested fields should be rejected rather than silently persisted.

Candidate allowed fields, all subject to owner/privacy validation:

```json
{
  "organization": {
    "name": "string",
    "website": "string|null"
  },
  "contact": {
    "name": "string",
    "role": "string|null",
    "email": "string",
    "phone": "string|null"
  },
  "context": {
    "current_reality": "string|null",
    "desired_reality": "string|null",
    "timing": "string|null",
    "delivery_mode": "string|null",
    "location": "string|null",
    "notes": "string|null"
  },
  "notice_version": "string",
  "consent_version": "string|null",
  "questionnaire_version": "string"
}
```

This candidate body does not authorize confidential production collection until the owner/privacy gates are satisfied.

## Explicitly forbidden client fields

Reject a request containing any client-controlled field equivalent to:

- `id`, `intake_id`, `receipt_code`;
- `organization_id`, `transformation_id`;
- `actor_user_id`, `submitted_by_user_id`, `assigned_reviewer_user_id`;
- `role`, `membership_role`, `permissions`, `scopes` when used as authorization claims;
- `state`, `review_state`, `approval_state`, `decision_state`;
- `visibility_scope`, `sensitivity_class`, `retention_class`;
- `required_authority`, `decided_by_user_id`, `decided_at`;
- `public_release_state`, `client_sponsor_visible` authority flags;
- `audit_event`, `audit_outcome`, `audit_actor`;
- `created_at`, `updated_at`, or any server timestamp override;
- service/API credentials, JWT claims, provider object permissions, or raw SQL.

The server may normalize a human-entered role title such as `contact.role`; that is descriptive business context, not an authorization role.

## Required headers

Candidate contract:

- `Content-Type: application/json`
- `Idempotency-Key: <opaque client-generated value>` — required for submission once enabled
- `Authorization: Bearer <token>` — required if authenticated intake is selected
- `X-Request-ID` — optional caller correlation value; server generates its own canonical correlation ID regardless

The client may not supply trusted audit identity through headers.

## Server-derived fields

The server owns at least:

- canonical intake UUID;
- public-safe receipt code;
- authenticated submitter identity where applicable;
- canonical correlation/request ID;
- server timestamps;
- initial state;
- sensitivity classification;
- visibility scope;
- reviewer assignment;
- organization/transformation linkage;
- source provenance record;
- audit events;
- rate-limit/abuse metadata;
- quarantine/review routing.

Default proposed initial state after an accepted submission:

`pending_human_review`

Default proposed handling before classification:

- sensitivity: conservative confidential-client handling;
- visibility: WorldStage internal only;
- transformation: unset until authorized human review;
- reviewer: unset or server-assigned by validated internal rule;
- sponsor visibility: denied;
- AI/vector eligibility: denied until explicit policy.

## Success response

Preferred submission response: `202 Accepted`.

Return the minimum information needed by the submitter, for example:

```json
{
  "receipt_code": "opaque-receipt",
  "status": "received",
  "message": "Your submission was received for human review."
}
```

Do not return:

- internal intake UUID;
- organization/transformation IDs;
- reviewer identity;
- internal sensitivity/visibility labels;
- internal queue position;
- internal notes;
- security/risk scores;
- whether a named person/client already exists in WorldStage records.

## Idempotency semantics

Once enabled:

- the same valid `Idempotency-Key` plus same authenticated/bound submitter context must not create duplicate intake records;
- repeated successful submission returns the same public receipt or an equivalent idempotent result;
- reusing a key with materially different body must fail rather than overwrite the earlier intake;
- idempotency storage must not become an indefinite retention loophole; its duration remains `TO VALIDATE` and must be separately approved.

## Validation limits

Exact values remain implementation decisions, but the contract requires explicit server-side limits for:

- request body bytes;
- string lengths;
- nesting depth;
- number of questionnaire fields;
- URL/email/phone normalization;
- Unicode/control characters;
- content type;
- request frequency;
- upload count/size if uploads are ever enabled.

No file upload is allowed in the first live intake slice unless a separate private-file security review is completed.

## Authentication modes

The project must choose one mode before activation:

### Mode A — authenticated intake

Require a valid authenticated identity before submission.

### Mode B — cryptographically bound intake invitation

Allow a signed, scoped, expiring intake invitation token generated server-side.

### Mode C — anonymous public intake

**Default: DENIED.** This mode requires explicit owner/security/privacy approval plus stronger abuse controls and does not become allowed merely because the public website exists.

The API must not infer authorization from an email domain or browser-local role flag.

## Internal review contract

Only an authenticated authorized reviewer may read/review a secure intake.

A review action may propose:

- `needs_clarification`;
- `accepted`;
- `quarantined`;
- `rejected_for_sensitive_content`;
- `legal_security_review`;
- link/create a transformation through a separately authorized operation.

Review endpoints must not let a reviewer silently:

- promote participant-private content to sponsor-visible;
- grant transformation membership;
- approve Cherry-level decisions;
- invent retention periods;
- publish client claims;
- bypass audit.

Every consequential review transition creates an audit event.

## Decision-resolution contract

A decision-resolution request must be server-authorized against:

`actor → active membership → role/authority → transformation → decision required_authority → object state → sensitivity → required step-up/AAL2`

The client may submit a human decision value/reason, but cannot choose `decided_by_user_id`, required authority, approval timestamp, or step-up result.

If AAL2/step-up is required and absent/expired, the action fails closed.

## Audit contract

Every enabled write path must create or trigger an append-oriented audit event containing only necessary metadata:

- server timestamp;
- authenticated actor identity/type where applicable;
- organization/transformation context resolved server-side;
- action;
- resource type/ID;
- outcome;
- canonical correlation ID;
- approval/step-up reference where required;
- structured change summary for consequential mutations.

Never put raw confidential narrative, credentials, payment secrets, full participant response bodies, tokens, or authorization headers into logs/audit payloads.

## Error contract

Errors should use stable machine codes and low-information human messages.

Candidate statuses:

- `400` malformed request;
- `401` authentication required/invalid;
- `403` authenticated but not authorized;
- `404` resource unavailable or intentionally non-enumerable;
- `409` idempotency conflict/state conflict;
- `413` payload too large;
- `415` unsupported content type;
- `422` allowlist/schema validation failure;
- `429` rate/abuse limit;
- `500` internal failure with generic public response;
- `503` intake intentionally disabled/kill-switched.

Do not reveal whether a client, participant, email address, transformation, reviewer, or decision exists when the caller is not authorized to know.

## Quarantine behavior

If content is flagged as prohibited, unexpectedly highly sensitive, malformed, or suspicious:

- do not route it into normal Cherry Judgment Queue;
- preserve only the minimum authorized evidence needed for review;
- mark/route server-side into `quarantined` or `legal_security_review` as appropriate;
- do not echo sensitive content in the response;
- generate a security/audit event without raw secret payloads;
- do not send content to analytics, LLMs, embeddings, session replay, or external automation.

Exact prohibited-content criteria and legal/privacy handling remain `TO VALIDATE`.

## Abuse controls

Before activation, implement and test:

- per-origin/per-identity/per-token rate limits as appropriate;
- replay/idempotency protection;
- bot/automation abuse mitigation proportionate to selected intake mode;
- payload size/depth limits;
- input normalization;
- timeouts;
- concurrency limits;
- duplicate detection where lawful/appropriate;
- alerting for repeated authorization failures or abnormal submission bursts.

Abuse telemetry must minimize personal data.

## CORS / browser boundary

Default:

- same-origin requests only;
- no wildcard CORS for secure endpoints;
- credentials only where required;
- CSRF protection if cookie-based authentication is selected;
- CSP/connect-src updated only for explicitly approved same-origin/secure endpoints.

## Kill switch

Before confidential activation, there must be a way to make the intake write path fail closed without redeploying the entire public site.

When disabled:

- submission returns a generic unavailable response such as `503`;
- no body is persisted;
- no downstream queue/event/AI action fires;
- the disable action itself is audited through the privileged control path.

## AI boundary

The intake API does not automatically send submitted content to an LLM.

Any later AI use must happen only after:

1. authorized human/system classification;
2. actor/source authorization;
3. approved data-class eligibility;
4. approved provider/retention terms;
5. prompt/logging policy;
6. auditability.

Prompt injection or malicious text inside an intake is untrusted content, never executable authority.

## Privacy-safe logging

Application/runtime logs may contain:

- request/correlation ID;
- route;
- outcome/status;
- latency;
- coarse abuse-control result;
- internal error class.

They should not contain full intake bodies, contact details by default, bearer tokens, cookies, secret invitation tokens, participant narratives, or uploaded document contents.

## Failure atomicity

A submission must not leave a partially privileged state.

If persistence/audit fails:

- do not claim success to the caller;
- avoid partially linked transformation/decision state;
- retry only through idempotent server logic;
- never create a transformation membership or approved decision as a side effect of intake submission.

## First-slice explicit exclusions

Not part of first secure intake activation:

- file uploads;
- participant surveys;
- sponsor portal publication;
- payment/invoice mutation;
- automated proposal generation/sending;
- automated relationship messages;
- autonomous transformation diagnosis;
- semantic-memory/vector ingestion;
- AI-generated decision approval;
- automatic membership grants;
- production release actions.

## Implementation gate

This API contract may be converted into code only after the project has owner/security decisions for:

- selected intake authentication mode;
- canonical request fields and notice/consent language;
- role/authority map;
- data classification;
- participant/sponsor visibility;
- retention/deletion;
- systems of record;
- target dev/staging environment;
- incident owner and kill-switch authority.

Until then this remains a non-deployed contract.