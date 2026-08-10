# WorldStage / Cherry — current roadmap and proof state

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository:** `banataosystems/nlp`  
**Active line:** `redesign/mobile-first-v2` / PR #1  
**Purpose:** current-state reconciliation only. Historical provenance remains preserved in commits, CI runs, deployment records, artifacts and prior Phase 2 evidence documents. This file does not relax the master roadmap, decision ledger or release gates.

## Current phase

**Non-live redesign verification plus provider-neutral secure-intake, rollback/recovery, staging-handoff, deployment-isolation, environment-binding, signed-user proof and live-staging evidence aggregation design, before live staging.**

The active line remains limited to reversible non-live work before billable environment creation, confidential-data activation, real-provider binding and production release.

## Proof-state separation

### Documented

Current contracts include:
- `PHASE2_RECEIPT_AND_INCIDENT_CONTROL_2026-08-10.md`;
- `PHASE2_STAGING_HANDOFF_AND_RESTORE_2026-08-10.md`;
- `PHASE2_DEPLOYMENT_ISOLATION_2026-08-10.md`;
- `PHASE2_ENVIRONMENT_BINDING_VERIFICATION_2026-08-10.md`;
- `PHASE2_SIGNED_USER_LIVE_TEST_CONTRACT_2026-08-10.md`;
- `PHASE2_LIVE_STAGING_EVIDENCE_AGGREGATOR_2026-08-10.md`.

### Implemented on the active branch

Public/prototype layer:
- phone-first responsive/safe-area foundations;
- transformation-stage recomposition;
- conversational Discovery prototype and provenance states;
- Cherry OS judgment-queue prototype;
- Transformation Record prototype.

Secure-intake boundary:
- public `/api/v1/intakes` remains inert with no 2xx path;
- strict request allowlists and recursive authority-field rejection;
- candidate authenticated-user / bound-invitation auth contracts; anonymous intake denied;
- privacy-minimized abuse-control contract;
- synthetic identity/authorization and cross-role, cross-org and revocation simulation;
- exact-source staging-adapter contract;
- atomic persistence/audit with actor-scoped idempotency;
- non-enumerating actor-bound receipt status with no public endpoint;
- transactional fail-closed intake control / kill switch;
- bounded structured incident signals;
- public-route regression guard against private/synthetic runtime binding;
- non-deployed SQL alignment for opaque receipts and actor-scoped idempotency.

Recovery / staging preparation:
- tamper-evident rollback capsule with execution unauthorized by default;
- secret-rejecting staging handoff manifest that remains non-executable and provider-unbound;
- synthetic-only content-addressed backup/restore drill with isolated empty staging target and disabled post-restore intake;
- deployment-isolation capsule requiring exact source/preview provenance and a distinct preserved production baseline;
- environment-binding verifier requiring exact staging provenance and future signed-user, backup/restore and kill-switch proof digests while always returning `activation_allowed: false`;
- signed-user live-test proof contract covering positive/negative authz cases with synthetic ephemeral identities, cleanup proof and no activation authority.

Live-staging evidence aggregator:
- `server/live-staging-evidence-aggregator.cjs` combines four required future proof categories: `environment_binding`, `signed_user_policy`, `backup_restore`, and `kill_switch`;
- all proof metadata must share one exact source SHA and one isolated staging environment;
- proof digests must be valid and distinct;
- signed-user and backup/restore proof must remain synthetic-only;
- production access, production restore, confidential-data use, incomplete cleanup, an enabled post-restore intake state, missing readiness gating, non-transactional kill-switch audit, source/environment drift, activation requests and production-release authority fail closed;
- credential-shaped and common direct-sensitive/free-form evidence keys are rejected;
- even a structurally complete future package returns `activation_allowed: false` and `production_release_authorized: false`.

The aggregator is included in the mandatory `test:intake-runtime` gate through `tests/live-staging-evidence-aggregator.test.cjs`. Its regression fixture is synthetic metadata and is not live-provider evidence.

### Tested — last fully verified baseline before the new aggregator

Exact verified baseline recovered from PR #1:
- exact source head: `1f5bc64b765fdbc0eb37baeb9d5da4bef82ac20e`;
- GitHub Actions run: `31368085608` (#465);
- conclusion: **PASS**;
- Phase 2 staging-readiness artifact: `9055000919`, digest `sha256:016fe8c0dc32f4df463881a86e7ae94b0697e47f69b951a01d657d85ca4f88b0`;
- mobile visual artifact: `9055001589`, digest `sha256:30b053fca128c692c370f319e6b5c6a4084240cafbfd456c1652daab5986fdaa`.

The inspected #465 staging-readiness artifact records exact source `1f5bc64b765fdbc0eb37baeb9d5da4bef82ac20e`, `readiness = BLOCKED`, disabled confidential intake, unselected persistence, no adapter binding, no staging/production project IDs and unresolved D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18.

The newer live-staging evidence aggregator is **implemented** and locally regression-tested before commit, but it must not be promoted to project-level **tested** until an exact-current-head GitHub Actions run completes successfully. PR #1 is the durable exact-head verification ledger.

### Preview deployed

The exact aggregator implementation head `2904aa5356706ac8587b00e139938643d560072f` has Vercel preview `dpl_8HxNy9ibAMsBFxj1b1DfCNN1EdPF`, READY, source Git, `target: null`. The protected preview was fetched through authorized Vercel access and returned HTTP 200 with the WorldStage/Cherry HTML shell and security headers.

This is non-production preview evidence only. A newer documentation-only head must be reconciled separately in PR #1 and is not allowed to inherit exact-head proof by assumption.

### Live staging

**Not created / not activated.** No live WorldStage staging database/auth/abuse/incident/notification provider is bound; no real signed-user PostgreSQL/RLS execution, provider backup/restore drill or live kill-switch proof has occurred; confidential intake remains disabled.

### Production

The preserved production baseline remains `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`, READY, `target: production`, source `redeploy`, with `cherrypua.vercel.app` among its aliases. The mobile-v2 / secure-intake line has not been promoted and is not production-approved.

## Current hard gates / blockers

1. Owner/security decisions D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 remain OPEN in the decision ledger.
2. Live/billable staging creation is not authorized by current evidence.
3. Real PostgreSQL/Supabase, authentication, abuse-control, incident-management and notification providers remain unbound.
4. Real signed-user PostgreSQL/RLS, real provider backup/restore and real kill-switch proof do not exist; only provider-neutral/synthetic contracts and drills are proven.
5. Physical-device / owner validation remains separate from automated WebKit/Chromium evidence.
6. Authentic owner-approved Cherry/program/client content and rights evidence remain separate owner/content gates.
7. Pandora Memory synchronization remains unproven because the current connector/plugin set does not expose Pandora Memory; repository/CI/Vercel evidence is durable fallback evidence, not a substitute for successful canonical synchronization.
8. Production release remains separately unauthorized and fail-closed.

## Risks

- Provider-neutral/synthetic proof reduces implementation risk but cannot substitute for live security, database-policy, recovery or operational proof.
- A structurally complete aggregated staging evidence package is not activation authority and is not production-release evidence.
- Preview READY proves deployability/provenance only, not production suitability.
- The preserved production baseline must remain isolated until explicit production-release authority and all required live proof gates exist.
- Pandora unavailability prevents canonical memory reconciliation until access is restored or a separately authorized governance exception exists.

## Current safe next autonomous actions

1. Obtain exact-current-head CI proof with the live-staging evidence aggregator inside the mandatory runtime gate and reconcile artifact IDs/digests in PR #1.
2. Verify exact-current-head non-production Vercel provenance while preserving the existing production baseline.
3. Prepare a provider-neutral evidence capture/manifest contract for future staging that serializes only nonsecret, content-addressed proof references and cannot activate intake.
4. Continue rollback/recovery and security-evidence hardening without binding a real provider.
5. Keep public receipt lookup absent and confidential intake fail-closed until owner/security/auth/privacy gates are resolved.
6. Do not create billable staging, bind confidential data, apply real migrations, make legal/public commitments or promote production without separate hard gates.

## Explicit non-claims

- No live staging environment is claimed.
- No production database/auth/abuse/incident/notification provider is claimed.
- No confidential intake is claimed.
- No public receipt-status endpoint is claimed.
- No real provider backup/restore or live kill-switch proof is claimed.
- No participant-private production flow is claimed.
- No owner/security approval is inferred from code or tests.
- No physical-device owner approval is inferred from browser automation.
- No Pandora Memory synchronization is claimed while its connector path is unavailable.
- No mobile-v2 / secure-intake production release is claimed.
