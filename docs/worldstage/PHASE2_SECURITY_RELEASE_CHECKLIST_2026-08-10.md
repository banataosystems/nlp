# WorldStage / Cherry — Phase 2 security release checklist

**Date:** 2026-08-10  
**Status:** NON-DEPLOYED DRAFT  
**Purpose:** define the minimum evidence required before confidential WorldStage intake or private Cherry OS data can be activated.

## Gate 1 — Owner/business truth

- [ ] owner-approved vocabulary map
- [ ] one representative engagement mapped end to end
- [ ] owner-approved logical data model
- [ ] owner-approved decision-authority matrix
- [ ] systems-of-record inventory confirmed
- [ ] data classifications confirmed
- [ ] retention/deletion rules confirmed
- [ ] first production workflow explicitly selected

Any unchecked item blocks confidential activation.

## Gate 2 — Environment and source control

- [ ] dev/staging/production environments separated
- [ ] exact repository/branch/commit provenance recorded
- [ ] migrations version-controlled
- [ ] secrets absent from repository
- [ ] managed secret storage configured
- [ ] dependency lock/verification strategy defined
- [ ] production release path requires explicit authorization
- [ ] rollback candidate identified before release

## Gate 3 — Authentication

- [ ] internal authentication implemented
- [ ] external identity model implemented where required
- [ ] MFA enabled for privileged internal users
- [ ] AAL2/step-up enforced for sensitive export, destructive retention/deletion, permission changes, production administration and release authorization
- [ ] session expiration/reauthentication tested
- [ ] revoked/disabled user access denied

## Gate 4 — Authorization and RLS

- [ ] RLS enabled on every exposed tenant/transformation-owned table
- [ ] server-side authorization for privileged actions
- [ ] organization isolation positive/negative tests pass
- [ ] transformation isolation positive/negative tests pass
- [ ] sponsor/participant isolation tests pass
- [ ] finance isolation tests pass
- [ ] security-admin/business-authority separation tested
- [ ] role revocation tested
- [ ] direct API/database-path denial tested
- [ ] client-side role manipulation has no effect

Companion evidence: `PHASE2_RLS_RBAC_VERIFICATION_MATRIX_2026-08-10.md`.

## Gate 5 — Secure intake

- [ ] server-generated intake receipt ID
- [ ] notice/consent version stored where required
- [ ] payload limits
- [ ] rate limiting/abuse controls
- [ ] idempotency/duplicate handling
- [ ] prohibited/sensitive content quarantine path
- [ ] client cannot set privileged fields
- [ ] human-review state machine verified
- [ ] review acceptance/rejection audited
- [ ] clarification flow cannot leak internal notes

## Gate 6 — Private files/media

If uploads are enabled:

- [ ] files are private by default
- [ ] signed access is short-lived
- [ ] authorization checked before signing
- [ ] size/type validation server-side
- [ ] storage paths are server-controlled
- [ ] malware/quarantine strategy implemented where required
- [ ] file metadata does not leak sensitive information
- [ ] deletion/retention applies to file storage too

## Gate 7 — Auditability

- [ ] consequential mutations produce audit events
- [ ] permission grant/change/revoke audited
- [ ] MFA/step-up events audited where appropriate
- [ ] sensitive exports audited
- [ ] decision approval/rejection/supersession audited
- [ ] visibility/sensitivity changes audited
- [ ] retention deletion audited
- [ ] production release authorization audited
- [ ] privileged configuration changes audited
- [ ] rollback invocation audited
- [ ] audit records tamper-evident or otherwise protected from ordinary mutation
- [ ] sensitive payloads excluded from logs

## Gate 8 — Privacy / analytics / AI

- [ ] restricted surfaces have no unauthorized session replay
- [ ] analytics payloads contain no confidential client/participant content
- [ ] prompt/LLM logging policy defined
- [ ] retrieval honors actor authorization
- [ ] AI context cannot include denied sources
- [ ] AI suggestions visibly distinguished from facts/decisions
- [ ] AI cannot approve, publish, send relationship-sensitive communication, alter permissions, delete restricted data, or authorize releases
- [ ] semantic-memory/vector-store eligibility explicitly approved by data class

## Gate 9 — Retention and deletion

- [ ] owner/legal-approved retention periods exist by data class
- [ ] abandoned intake draft behavior defined
- [ ] participant/client deletion rights defined where applicable
- [ ] legal/contract hold behavior defined
- [ ] deletion covers approved derived stores/indexes
- [ ] vector/semantic copies handled
- [ ] backups have approved retention
- [ ] audit retention defined separately
- [ ] destructive actions require authorization and audit

No arbitrary retention duration may be inserted merely to complete this checklist.

## Gate 10 — Backup and restore

- [ ] automated backup strategy confirmed
- [ ] restore procedure documented
- [ ] restore drill performed in non-production or controlled environment
- [ ] RTO/RPO expectations validated if applicable
- [ ] restore does not bypass current permissions
- [ ] restore preserves/audits security-critical history as designed

## Gate 11 — Security testing

- [ ] secret scan
- [ ] dependency review
- [ ] CSP/security-header verification
- [ ] CSRF protections where applicable
- [ ] input validation
- [ ] upload abuse testing if applicable
- [ ] authorization bypass testing
- [ ] tenant/transformation ID tampering testing
- [ ] stale/revoked session testing
- [ ] rate-limit/abuse testing
- [ ] mobile-browser secure-intake testing
- [ ] independent security review for high-risk paths

## Gate 12 — Physical-device validation

- [ ] physical iPhone walkthrough
- [ ] physical Android walkthrough
- [ ] software keyboard behavior verified
- [ ] orientation/safe-area behavior verified where relevant
- [ ] accessibility/touch controls reviewed
- [ ] protected preview source SHA recorded

Browser emulation does not satisfy this gate.

## Gate 13 — Incident response

Before confidential activation:

- [ ] security/incident owner named
- [ ] intake-disable kill switch or equivalent exists
- [ ] compromised-account response documented
- [ ] permission-revocation path tested
- [ ] secret rotation path documented
- [ ] data-exposure assessment path documented
- [ ] audit retrieval path documented
- [ ] client/participant notification obligations identified with appropriate legal/privacy review

## Gate 14 — Release provenance

- [ ] exact source commit tested
- [ ] exact deployment ID/URL recorded
- [ ] source → build → deployment chain recorded
- [ ] release authorization identity recorded
- [ ] production smoke verified
- [ ] monitoring checked after release
- [ ] rollback mechanism verified
- [ ] post-release physical-device verification completed

## Gate 15 — Governance sync

- [ ] Pandora Memory canonical state synchronized, **or**
- [ ] explicit governance exception recorded because canonical Memory remains unavailable

Never claim Memory synchronization when it did not occur.

## Activation decision

Secure confidential WorldStage intake may be called **production-ready** only when all applicable gates are satisfied with evidence.

The lifecycle labels must remain distinct:

`documented → implemented → tested → preview-deployed → production-deployed → production-verified`

A draft security blueprint is documented, not implemented. RLS policies without negative tests are implemented, not verified. A production deployment without physical-device and rollback proof is deployed, not production-verified.