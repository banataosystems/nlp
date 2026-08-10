# WorldStage / Cherry — current roadmap and proof state

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository:** `banataosystems/nlp`  
**Active line:** `redesign/mobile-first-v2` / PR #1  
**Purpose of this file:** current-state reconciliation. This document supersedes the stale **Current state and next autonomous action** section of `WORLDSTAGE_10_OF_10_MOBILE_FIRST_REDESIGN_MASTER_PLAN.md`; it does not rewrite the original design requirements or release gates.

## Current phase

**Non-live redesign verification + secure-intake hardening, before live staging.**

The active branch contains the rebuilt mobile-first public/prototype surfaces through Discovery, Cherry OS and Transformation Record, plus a provider-neutral, fail-closed secure-intake runtime harness. The branch is intentionally being advanced only up to the live-staging/billable/confidential-data boundary.

## State by proof level

### Documented

Current design, security and operating boundaries are documented in the WorldStage roadmap, decision ledger, Phase 2 security/runtime package and `PHASE2_RECEIPT_AND_INCIDENT_CONTROL_2026-08-10.md`.

### Implemented on the active branch

- phone-first navigation, viewport/overflow/safe-area and mobile composition foundations;
- homepage / transformation-stage recomposition;
- conversational Discovery prototype and provenance states;
- Cherry OS judgment-queue prototype;
- Transformation Record prototype;
- public `/api/v1/intakes` server shell that remains intentionally inert;
- strict server request allowlists and recursive rejection of client-controlled authority fields;
- candidate authenticated-user / bound-invitation authentication contracts with anonymous intake denied;
- privacy-minimized abuse-control contract;
- synthetic signed identity and authorization harness;
- cross-role / cross-organization / revocation authorization simulation;
- exact-source, staging-only adapter contract;
- transactional persistence and audit contract;
- actor-scoped idempotency;
- non-enumerating actor-bound receipt-status contract with no public endpoint;
- transactional fail-closed dynamic intake control / kill-switch contract;
- synthetic transactional control adapter;
- bounded structured incident-signal contract;
- dynamic control enforced before abuse/auth/persistence in the private synthetic orchestrator;
- static regression guard preventing the public route from silently importing/binding the private orchestrator or synthetic adapters;
- non-deployed SQL design alignment for opaque receipts and actor-scoped idempotency.

### Tested

The last fully green implementation head before the evidence-pipeline correction was `17627fc4a9646e22f7cf1e0f717b22fba3555309` in GitHub Actions run `31353949556` (#399). That run passed the secure-intake runtime gate, mobile/device contracts, Phase 2 SQL/staging contracts, Discovery, Cherry OS, Transformation Record, release/security/privacy checks and visual evidence generation.

The active head after the evidence-pipeline correction requires its own exact-head CI success before the branch as a whole may again be labelled **tested**. Older green runs are preserved as provenance but do not substitute for exact-current-head proof.

### Preview deployed

Git-linked Vercel previews are proven to trace branch commits by exact Git SHA and use `target: null`. They are preview deployments, not production releases.

### Live staging

**Not created / not activated.** There is no live WorldStage staging database/auth/abuse provider, no real PostgreSQL/RLS signed-user execution and no real confidential intake path.

### Production

The existing `cherrypua` production baseline remains separately deployed and reachable. The mobile-v2 / secure-intake branch has **not** been promoted to production and is not production-approved.

## Evidence-pipeline correction discovered on 2026-08-10

GitHub Actions run #399 was green and uploaded both expected artifacts, but inspection of its Phase 2 staging-readiness ZIP found that the report's internal `source_sha` had been overwritten to `synthetic-ci-sha` by the staging preflight test suite before artifact upload.

This did **not** mean the workflow executed against the wrong Git commit; the GitHub artifact metadata correctly identified head `17627fc4a9646e22f7cf1e0f717b22fba3555309`. It did mean the uploaded report itself was not acceptable as exact-source provenance.

The workflow has therefore been corrected to regenerate the staging-readiness report **after all tests and immediately before artifact upload**, with `WORLDSTAGE_SOURCE_SHA` bound to the actual workflow head SHA and all intake/persistence activation flags explicitly fail-closed. The corrected workflow must pass and its new artifact must be inspected before exact-source staging-readiness evidence is considered repaired.

The prior artifact remains part of history and must not be represented as exact-source proof.

## Verified production baseline facts

- Vercel project: `cherrypua`.
- Production deployment baseline: `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`.
- State: READY.
- Target: production.
- Source: redeploy of the preserved baseline, not the mobile-v2 branch.
- `https://cherrypua.vercel.app/` returned HTTP 200 during this verification pass.
- Vercel reported no runtime errors for the project in the queried 7-day window.

These facts verify reachability/hosting health of the preserved production baseline only. They do **not** constitute approval of the mobile-v2 redesign, secure intake, confidential-data handling or owner content.

## Current blockers / gates

1. **Owner/security decisions:** minimum decisions D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 remain unresolved in the authoritative decision ledger.
2. **Live-staging / billable environment:** not authorized by the current evidence state.
3. **Real provider bindings:** no production-grade PostgreSQL/Supabase, authentication, abuse-control, incident-management or notification provider is bound.
4. **Real-data proof:** no signed-user PostgreSQL/RLS execution has occurred; confidential intake remains disabled.
5. **Physical-device / owner validation:** automated WebKit/Chromium device-class checks do not replace required physical-device/owner approval.
6. **Authentic owner-approved content:** production-quality Cherry/program/client media and rights/evidence remain separate owner/content gates.
7. **Pandora Memory:** canonical synchronization is currently unproven because the ProjectOS/Pandora MCP endpoint is returning `401 Protected deployment`. Do not treat repository documentation as a successful Pandora sync.
8. **Production release:** no authorization has been given to promote this branch; production promotion remains fail-closed.

## Current safe next autonomous actions

1. Complete exact-head CI after the evidence-pipeline correction.
2. Inspect the newly uploaded staging-readiness artifact and verify its internal `source_sha` exactly equals the workflow head SHA; preserve artifact ID and digest.
3. Verify the exact-head Vercel preview is READY and records the same Git SHA.
4. Reconcile PR #1 evidence metadata to that exact head without changing production.
5. Continue only non-live/provider-neutral hardening, rollback/security evidence and documentation that do not create a billable environment, bind confidential data, make legal/public commitments or promote production.

## Explicit non-claims

- No live staging environment is claimed.
- No production database/auth/abuse/incident provider is claimed.
- No confidential intake is claimed.
- No public receipt-status endpoint is claimed.
- No participant-private production flow is claimed.
- No owner/security approval is inferred from code or tests.
- No physical-device owner approval is inferred from browser automation.
- No Pandora Memory synchronization is claimed while the connector is protected.
- No mobile-v2 / secure-intake production release is claimed.
