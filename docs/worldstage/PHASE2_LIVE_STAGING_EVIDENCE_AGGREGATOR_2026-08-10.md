# Phase 2 — Live-staging evidence aggregator

Status: **implemented contract only; no live staging execution**.

This contract prepares one fail-closed, provider-neutral evidence package for a future isolated staging environment. It does not create an environment, bind a provider, apply a migration, activate confidential intake, authorize spend, or authorize production release.

## Required proof set

A future evidence package must contain four distinct content-addressed proofs tied to the same exact source SHA and the same isolated staging environment:

1. `environment_binding` — provider/environment binding is proven for staging only, with production access false.
2. `signed_user_policy` — synthetic/ephemeral signed-user authentication and authorization cases pass and cleanup is verified.
3. `backup_restore` — synthetic-only restore proof targets staging, forbids production restore, finishes with intake disabled, and verifies cleanup.
4. `kill_switch` — disabled state is proven, enablement still requires readiness evidence, state change audit is transactional, and cleanup is verified.

The package also binds to the exact preview deployment, preserved production baseline, staging-readiness digest and evidence-plan digest.

## Fail-closed rules

The verifier rejects source drift, environment drift, preview/production identity collapse, missing/extra proof categories, reused proof digests, failed proof outcomes, credential-shaped or direct-sensitive evidence keys, confidential-data use, production access, production restore, incomplete cleanup, an enabled post-restore intake state, missing readiness gating, non-transactional control audit, activation requests and production-release authority.

Even a structurally complete package returns:

- `staging_evidence_complete: true` only for the evidence package itself;
- `activation_allowed: false`;
- `production_release_authorized: false`.

Evidence aggregation is therefore not an activation mechanism and is not production-release evidence.

## Proof-state separation

- **Documented:** this contract and its required evidence shape are recorded.
- **Implemented:** `server/live-staging-evidence-aggregator.cjs` and its regression suite exist on the active branch.
- **Tested:** requires exact-head CI success with `tests/live-staging-evidence-aggregator.test.cjs` inside the mandatory `test:intake-runtime` gate.
- **Preview deployed:** requires an exact-head READY Git preview with non-production target.
- **Live staging:** remains false until a separately authorized isolated provider environment exists and real provider evidence is collected.
- **Production verified/released:** remains false and requires a separate production-release authority path.

## Explicit non-claims

The regression suite uses synthetic metadata only. Passing tests do not prove that a real provider, database, authentication system, RLS policy, backup/restore system or kill switch has been exercised. No credentials belong in the evidence package or repository. No owner/security decision is inferred from this contract.
