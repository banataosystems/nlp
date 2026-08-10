# WorldStage / Cherry — current roadmap and proof state

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository:** `banataosystems/nlp`  
**Active line:** `redesign/mobile-first-v2` / PR #1  
**Purpose:** current-state reconciliation. Historical provenance remains preserved in prior evidence documents, commits, CI runs, deployment records and artifacts. This file does not relax the master roadmap, owner/security decision ledger or release gates.

## Current phase

**Non-live redesign verification + provider-neutral secure-intake, rollback/recovery, staging-handoff, deployment-isolation, environment-binding and signed-user live-test proof design, before live staging.**

The active line remains limited to reversible synthetic/non-live work before the billable-environment, confidential-data, real-provider-binding and production-release boundaries.

## Proof-state separation

### Documented

Current contracts and gates are recorded in the master redesign roadmap and Phase 2 evidence documents, including:

- `PHASE2_RECEIPT_AND_INCIDENT_CONTROL_2026-08-10.md`;
- `PHASE2_STAGING_HANDOFF_AND_RESTORE_2026-08-10.md`;
- `PHASE2_DEPLOYMENT_ISOLATION_2026-08-10.md`;
- `PHASE2_ENVIRONMENT_BINDING_VERIFICATION_2026-08-10.md`;
- `PHASE2_SIGNED_USER_LIVE_TEST_CONTRACT_2026-08-10.md`.

### Implemented on the active branch

Public/prototype experience:
- phone-first navigation, responsive/safe-area foundations and transformation-stage recomposition;
- conversational Discovery prototype and provenance states;
- Cherry OS judgment-queue prototype;
- Transformation Record prototype.

Secure-intake boundary:
- public `/api/v1/intakes` shell remains inert with no 2xx path;
- strict request allowlists and recursive authority-field rejection;
- candidate authenticated-user / bound-invitation auth contracts; anonymous intake denied;
- privacy-minimized abuse-control contract;
- synthetic identity / authorization and cross-role, cross-org and revocation simulation;
- exact-source staging-adapter contract;
- atomic persistence/audit contract with actor-scoped idempotency;
- non-enumerating actor-bound receipt-status contract with no public endpoint;
- transactional fail-closed intake control / kill switch;
- bounded structured incident signals;
- public-route regression guard against binding the private orchestrator/synthetic adapters;
- non-deployed SQL alignment for opaque receipts and actor-scoped idempotency.

Rollback / staging handoff / recovery / deployment isolation:
- tamper-evident rollback capsule with execution unauthorized by default;
- staging handoff manifest valid only while provider/environment/auth/abuse/incident bindings remain unbound, data is synthetic-only, intake is disabled, migrations are non-executable, production access is false and activation is false;
- rejection of secret-shaped fields from staging handoff evidence;
- synthetic-only content-addressed backup contract;
- isolated restore drill rejecting real data, production-capable/non-empty targets, tampering, integrity mismatch and enabled intake;
- deployment-isolation capsule requiring exact source/preview provenance, distinct preserved production baseline, content-addressed evidence, disabled intake/confidential data and release authority false.

Provider-neutral environment-binding verification:
- pre-live binding plan remains valid only while provider/environment IDs are unbound, environment creation/provider binding/migrations/live proof are absent and production access is false;
- future staging evidence can be shape-verified only with exact source/deployment provenance and content-addressed policy/backup/kill-switch proof digests;
- candidate evidence always returns `activation_allowed: false`;
- recursive secret-field rejection applies to current plans and candidate evidence;
- source drift, production access, activation requests, missing live-test digests and preview/production identity collapse fail closed.

Signed-user live-test proof contract:
- `server/signed-user-live-test-contract.cjs` defines a pre-live plan tied to exact source SHA, preview deployment, preserved production baseline and policy-bundle digest;
- the plan is valid only with synthetic-only fixtures, live execution false, production access false, confidential intake inactive, intake control disabled, activation false and production release unauthorized;
- required positive/negative policy cases cover anonymous and expired denial, authenticated-user acceptance, correct-transformation membership, cross-transformation denial, revoked-membership denial, assigned/unassigned intake access, AAL1/AAL2 sensitive-decision behavior, restricted visibility and owner-only denial;
- candidate future live-test evidence is restricted to coarse outcomes and content-addressed digests and never grants activation;
- durable evidence rejects credential-shaped fields and common direct-PII/free-form keys;
- missing, duplicate, unknown, contradictory or tampered test cases fail closed;
- source drift, preview/production deployment collapse, real-person/confidential data use, production access, activation requests and production-release authority fail closed;
- per-case proof digests, session-context digest, database-policy trace digest, test-runner artifact digest and cleanup verification are mandatory.

### Tested

Latest fully verified baseline before the signed-user contract implementation:
- exact source head: `69859d2e5f30a76891f14b178a80ab800aa7c86c`;
- GitHub Actions run: `31363828707` (#451);
- conclusion: **PASS**;
- Phase 2 staging-readiness artifact: `9053410959`, digest `sha256:055906566d4d964f22a396592bbb5ce2018e39617bcb02bc895df58c0a464b3f`;
- mobile visual artifact: `9053411202`, digest `sha256:4225665a9a3f4216f3d903aee2723af6fcc1b2ef63042bf95762a7ea9b240262`.

The #451 staging-readiness ZIP was directly inspected and contains exact `source_sha = 69859d2e5f30a76891f14b178a80ab800aa7c86c`, `readiness = BLOCKED`, confidential intake disabled, intake activation false, persistence unselected, adapter binding false, no staging/production project IDs and only `OWNER_SECURITY_DECISIONS_OPEN` for D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18.

The newer signed-user live-test contract is **implemented** and included in the mandatory `test:intake-runtime` gate. Exact-current-head CI evidence must pass before that newer work is promoted from implemented to tested. Exact run/artifact evidence is maintained in PR #1 after each verification cycle to avoid conflating implementation with test proof.

### Preview deployed

Latest verified baseline before the signed-user contract implementation:
- Vercel preview `dpl_9o5afUiGrHMUyLLEgoiMhVZE46q6`;
- state READY;
- source Git;
- `target: null`;
- exact Git SHA `69859d2e5f30a76891f14b178a80ab800aa7c86c`.

A newer READY preview does not upgrade the signed-user contract to deployed until exact-source provenance and exact-head test proof are both verified.

### Live staging

**Not created / not activated.** No live WorldStage staging database/auth/abuse/incident/notification provider is bound; no real signed-user PostgreSQL/RLS execution has occurred; confidential intake remains disabled.

### Production

The preserved production baseline remains `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`, READY, `target: production`, source `redeploy`, with `cherrypua.vercel.app` among its aliases. The mobile-v2 / secure-intake line has not been promoted and is not production-approved.

## Current hard gates / blockers

1. Owner/security decisions D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 remain OPEN in the authoritative ledger.
2. Live/billable staging creation is not authorized by current evidence.
3. Real PostgreSQL/Supabase, authentication, abuse-control, incident-management and notification providers are unbound.
4. Real signed-user PostgreSQL/RLS and real provider backup/restore proof do not exist; only synthetic/provider-neutral contracts and drills are proven.
5. Physical-device / owner validation remains separate from automated WebKit/Chromium evidence.
6. Authentic owner-approved Cherry/program/client content and rights evidence remain separate owner/content gates.
7. Pandora Memory synchronization remains unproven because the current connector/plugin catalog does not expose Pandora Memory; repository/CI/Vercel evidence is durable fallback evidence, not a substitute for successful canonical synchronization.
8. Production release remains separately unauthorized and fail-closed.

## Risks

- Provider-neutral and synthetic proof reduces implementation risk but cannot substitute for live RLS/auth/abuse/backup/restore proof.
- Signed-user candidate evidence validates proof shape and expected access outcomes only; even structurally valid evidence has `activation_allowed: false`.
- Environment-binding candidate verification checks evidence shape and provenance only; it cannot activate intake.
- Deployment-isolation proof verifies preview/production separation and exact-source provenance only; it does not prove production suitability or authorize release.
- Preview READY verifies deployability/provenance, not production suitability.
- The preserved production baseline must remain isolated until explicit release authority and all required proof gates exist.
- Pandora unavailability prevents canonical memory reconciliation until its access path is restored or an explicit governance exception is recorded.

## Current safe next autonomous actions

1. Run and verify the exact-current-head mandatory CI chain with the signed-user live-test contract included.
2. Verify exact-head non-production Vercel preview provenance and preserved production isolation.
3. Continue non-live provider-boundary, rollback/recovery and security-evidence hardening without binding a real provider.
4. Keep public receipt lookup absent and confidential intake fail-closed until owner/security/auth/privacy gates are resolved.
5. Prepare the next provider-neutral live-staging evidence aggregator that can combine environment-binding, signed-user policy, backup/restore and kill-switch proof without credentials and without granting activation.
6. Do not create billable staging, bind confidential data, apply real migrations, make legal/public commitments or promote production without separate hard gates.

## Explicit non-claims

- No live staging environment is claimed.
- No production database/auth/abuse/incident/notification provider is claimed.
- No confidential intake is claimed.
- No public receipt-status endpoint is claimed.
- No real provider backup/restore is claimed.
- No participant-private production flow is claimed.
- No owner/security approval is inferred from code or tests.
- No physical-device owner approval is inferred from browser automation.
- No Pandora Memory synchronization is claimed while its connector path is unavailable.
- No mobile-v2 / secure-intake production release is claimed.
