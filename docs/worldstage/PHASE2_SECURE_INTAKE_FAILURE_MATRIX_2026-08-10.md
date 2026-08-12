# WorldStage / Cherry — Phase 2 secure-intake failure matrix

**Date:** 2026-08-10  
**Status:** NON-DEPLOYED DRAFT

## Purpose

Turn the secure-intake API and threat model into deterministic failure behavior before implementation.

| Scenario | Expected result | Persistence | Audit / telemetry | External disclosure |
|---|---|---|---|---|
| Route disabled by kill switch | `503` generic unavailable | none | privileged disable action audited; request metadata only | no internal reason |
| Missing/invalid auth when auth required | `401` | none | auth failure metadata as appropriate | no account existence detail |
| Authenticated but unauthorized internal actor | `403` or non-enumerating `404` | none | denial metadata | no resource existence detail |
| Anonymous mode not approved | deny | none | abuse/auth metadata only | no route capability detail beyond generic response |
| Unsupported content type | `415` | none | status/route only | generic message |
| Malformed JSON | `400` | none | status/route only | generic malformed request |
| Unknown field | `422` | none | validation code only | identify safe field error only if non-sensitive |
| Client supplies reviewer | `422` | none | validation code | do not echo reviewer ID |
| Client supplies internal org/transformation ID | `422` by default | none | validation code | do not confirm target existence |
| Client supplies state/approval/visibility/sensitivity | `422` | none | validation code | generic forbidden field |
| Missing required notice/version | `422` | none | validation code | safe remediation text |
| Oversized body | `413` | none | size class only; not body | generic too large |
| Excessive nesting/field count | `422` or `413` | none | validation/abuse code | generic invalid payload |
| Rate limit exceeded | `429` | none | rate-limit event, minimized metadata | no internal thresholds unless safe |
| Bot/abuse rule triggered | deny/throttle/challenge per approved mode | none unless explicitly quarantined | abuse code | no detailed detection logic |
| Same idempotency key + same body/context | same receipt/idempotent success | no duplicate | idempotent replay event optional | same public-safe receipt |
| Same idempotency key + different body | `409` | no overwrite | conflict code | no old body returned |
| Receipt code probe/non-owner | non-enumerating `404`/deny | none | abuse/access denial | do not confirm receipt exists |
| Highly sensitive/prohibited content detected | accepted-to-quarantine or reject per approved policy | minimum authorized quarantine only if policy permits | security/audit event without raw secret | no echo of sensitive body |
| Database write fails before audit/receipt transaction completes | `500` generic | atomic rollback | internal error class | no partial-success claim |
| Audit write fails for consequential mutation | fail mutation / rollback where design requires audit atomicity | no un-audited consequential success | internal failure | generic error |
| Human review assignment rule unavailable | intake remains unassigned pending review | intake only if safely accepted | operational alert | no reviewer detail |
| Revoked reviewer tries read/review | deny | none | authorization denial | no record detail |
| Reviewer tries to grant membership | deny | none | authorization denial | generic forbidden |
| Reviewer tries sponsor-visible promotion without authority | deny | none | authorization denial | generic forbidden |
| Internal actor resolves decision without required authority | deny | none | authorization denial | generic forbidden |
| Required AAL2 missing/expired | deny / step-up required | none | step-up-required metadata | no sensitive decision data beyond authorized pre-step-up view |
| Duplicate concurrent submissions | one canonical intake/receipt | idempotent single write | duplicate/concurrency metadata | same receipt or conflict |
| Downstream email/queue/provider unavailable | intake remains safely pending; no false completion | canonical intake only | operational error | receipt remains generic received/pending |
| AI provider unavailable | no effect on intake acceptance unless AI was explicitly required by approved workflow | no AI-derived state | provider error metadata | no user content echoed |
| Malicious prompt-injection text submitted | store only if allowed; treat as untrusted content | normal/quarantine according to classification | no prompt execution | no tool/AI action |
| XSS/HTML payload in text | store as untrusted text if allowed | normal record | validation/security metadata as needed | output escaped later |
| Spreadsheet-formula payload later exported | neutralize at export boundary | source preserved | export audit | no execution |
| Token/cookie accidentally presented in form field | quarantine/reject according to approved sensitive-content handling | minimum handling only | no token in logs | no echo |
| Service credential appears in browser/request | security incident path | do not persist as normal content | high-priority security event without secret value | generic failure |
| Cross-origin request to secure endpoint | deny unless exact approved origin policy | none | origin denial metadata | generic forbidden |
| CSRF check fails under cookie auth | `403` | none | CSRF denial metadata | generic forbidden |
| Server timeout before commit | retry only through idempotency | no duplicate/partial privileged state | timeout metadata | generic retry-safe failure |
| Partial transformation linkage failure | rollback linkage; intake remains previous safe state | no half-linked authority | internal/audit failure | no internal IDs |
| Log/telemetry sink unavailable | business mutation must follow approved audit/observability dependency rule; consequential audit cannot silently disappear | fail closed where audit is mandatory | local protected operational signal if available | generic error |
| Production release attempted through intake path | deny | none | security event | generic forbidden |

## Invariants

1. No validation/auth failure creates privileged business state.
2. No client error response returns internal IDs, reviewer identity, private classification, or existence information the caller is not authorized to know.
3. No consequential human-review/decision mutation succeeds without required audit behavior.
4. No intake submission grants membership or approves a decision.
5. No failed request is retried in a way that can create duplicates without idempotency control.
6. Sensitive or suspicious content never flows automatically to analytics, AI, embeddings, email automation, or public logs.
7. Kill-switch state prevents persistence and downstream action.
8. Production release authority is completely outside the intake API.

## Implementation note

Exact HTTP choices for some deny/non-enumeration cases may change during security review. What must not change is the fail-closed outcome and absence of unauthorized persistence/disclosure.