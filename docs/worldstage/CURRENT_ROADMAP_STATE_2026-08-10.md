# WorldStage / Cherry — current roadmap and proof state

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository:** `banataosystems/nlp`  
**Active line:** `redesign/mobile-first-v2` / PR #1  
**Purpose:** current-state reconciliation. Historical provenance remains preserved in commits, CI runs, Vercel deployment records, artifacts and prior Phase 2 evidence documents. This file does not relax the master roadmap, decision ledger, owner/security gates or production-release gates.

## Current phase

**Non-live redesign verification plus provider-neutral secure-intake, recovery, environment-binding, signed-user proof, live-staging evidence aggregation, reference-only evidence manifests and immutable evidence-checkpoint continuity, before live staging.**

The active line remains limited to reversible non-live work before billable environment creation, real-provider binding, confidential-data activation, credential use, real migrations and production release.

## Proof-state separation

### Documented

Current Phase 2 contracts include:
- receipt / incident control;
- staging handoff and restore;
- deployment isolation;
- environment-binding verification;
- signed-user live-test proof;
- live-staging evidence aggregation;
- `PHASE2_STAGING_EVIDENCE_CAPTURE_MANIFEST_2026-08-10.md` for nonsecret content-addressed proof references;
- `PHASE2_STAGING_EVIDENCE_CHECKPOINT_CHAIN_2026-08-10.md` for deterministic parent/manifest/reference continuity.

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

Recovery and staging preparation:
- tamper-evident rollback capsule with execution unauthorized by default;
- secret-rejecting staging handoff manifest that remains non-executable and provider-unbound;
- synthetic-only content-addressed backup/restore drill with isolated empty staging target and disabled post-restore intake;
- deployment-isolation capsule requiring exact source/preview provenance and a distinct preserved production baseline;
- environment-binding verifier requiring exact staging provenance and future signed-user, backup/restore and kill-switch proof digests while always returning `activation_allowed: false`;
- signed-user live-test proof contract covering positive/negative authz cases with synthetic ephemeral identities, cleanup proof and no activation authority;
- live-staging evidence aggregator requiring one exact-source, one-environment package with `environment_binding`, `signed_user_policy`, `backup_restore` and `kill_switch` proof classes;
- staging evidence capture/manifest contract that serializes only content-addressed proof references and explicitly forbids inline/raw evidence, credential-shaped fields, direct sensitive/free-form material, evidence URLs/URIs/paths, production access, confidential data, enabled intake, activation requests and production-release authority;
- staging evidence checkpoint contract that links a genesis/child chain by checkpoint digest and parent manifest digest while requiring exact continuity of source, preview, production baseline, provider, environment, manifest plan, manifest digest and every individual proof-reference digest.

The checkpoint chain is immutable by design: proof-reference replacement, manifest replacement, environment/provider drift, forged parent links, sequence gaps, extra durable fields, sensitive material and authority escalation all fail closed. A proof rerun or genuinely different manifest must start a separately governed lineage rather than rewriting the existing chain.

The manifest and checkpoint contracts are integrated into mandatory `test:intake-runtime` through `tests/staging-evidence-manifest-contract.test.cjs` and `tests/staging-evidence-checkpoint-contract.test.cjs`. Structural completeness or checkpoint continuity never authorizes intake activation or production release.

### Tested

The last exact verified baseline before the checkpoint layer is:
- source head `7eaa30e1dd37d24a178b8c8e5e1ef758415981eb`;
- GitHub Actions run `31376831347` (#485), **PASS**;
- staging-readiness artifact `9058309607`, digest `sha256:b492fefaef39d8a91cc8ec96a352043e1099439a7a4a70852e4bb82de6ed75d2`;
- mobile artifact `9058309927`, digest `sha256:9e73a35c2bceadc683ebb34ad2bbd7265d068b2d5048516a623420823edefd03`.

That staging-readiness artifact was inspected directly and records exact source `7eaa30e1dd37d24a178b8c8e5e1ef758415981eb`, `readiness = BLOCKED`, confidential intake disabled, persistence/provider binding absent, no staging/production project IDs and unresolved D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18.

The new checkpoint layer is **implemented** and placed in the mandatory CI gate. Project-level **tested** status for it requires an exact-current-head CI pass. Exact-head run/artifact IDs are maintained in PR #1 because editing this roadmap itself changes the source head; this document therefore does not self-certify a later CI run by assumption.

### Preview deployed

The last exact verified baseline preview is `dpl_DTdw6mPYZhp6MgYS2LLiCQkggh3G`, READY, Git-sourced, `target: null`, tied to source `7eaa30e1dd37d24a178b8c8e5e1ef758415981eb`.

A newer checkpoint implementation preview must be verified against its exact source SHA before it can be called preview-deployed at that proof level. Preview READY is deployability/provenance evidence only.

### Live staging

**Not created / not activated.** No live WorldStage staging database/auth/abuse/incident/notification provider is bound; no real signed-user PostgreSQL/RLS execution, provider backup/restore drill or live kill-switch proof has occurred; confidential intake remains disabled.

### Production

The preserved production baseline remains `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`, READY, `target: production`, source `redeploy`, with `cherrypua.vercel.app` among its aliases. The mobile-v2 / secure-intake line has not been promoted and is not production-approved.

## Current hard gates / blockers

1. Owner/security decisions D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 remain OPEN in the decision ledger.
2. Live/billable staging creation is not authorized by current evidence.
3. Real PostgreSQL/Supabase, authentication, abuse-control, incident-management and notification providers remain unbound.
4. Real signed-user PostgreSQL/RLS, provider backup/restore and live kill-switch proof do not exist; only provider-neutral/synthetic contracts and drills are proven.
5. Physical-device / owner validation remains separate from automated WebKit/Chromium evidence.
6. Authentic owner-approved Cherry/program/client content and rights evidence remain separate owner/content gates.
7. Pandora Memory synchronization remains unproven because the current connector/plugin set does not expose Pandora Memory; repository/CI/Vercel evidence remains fallback evidence, not a substitute for canonical synchronization.
8. Production release remains separately unauthorized and fail-closed.

## Risks

- Provider-neutral/synthetic proof reduces implementation risk but cannot substitute for live database-policy, security, recovery or operational proof.
- Reference-only evidence manifests preserve provenance without secrets, but they do not prove the referenced provider evidence was valid unless the separate live-staging aggregator verifies it.
- Checkpoint continuity proves that reference digests were not silently replaced inside one lineage; it does not prove the underlying evidence itself and must not be treated as activation authority.
- A structurally complete manifest, aggregated package or valid checkpoint chain is not production-release evidence.
- Preview READY proves deployability/provenance only, not production suitability.
- The preserved production baseline must remain isolated until explicit production-release authority and all required live proof gates exist.
- Pandora unavailability prevents canonical memory reconciliation until access is restored or a separately authorized governance exception exists.

## Current safe next autonomous actions

1. Obtain exact-current-head CI proof with the evidence checkpoint contract inside the mandatory runtime gate and reconcile run/artifact evidence in PR #1.
2. Verify exact-current-head non-production Vercel provenance while preserving the production baseline.
3. Continue provider-neutral rollback/recovery and security-evidence hardening without binding a real provider.
4. Keep public receipt lookup absent and confidential intake fail-closed until owner/security/auth/privacy gates are resolved.
5. Do not create billable staging, bind confidential data, use missing credentials, apply real migrations, make legal/public commitments or promote production without separate hard gates.

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
