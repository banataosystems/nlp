# WorldStage / Cherry — Phase 2 staging evidence checkpoint chain

**Date:** 2026-08-10  
**Status:** implemented on active PR line; live staging remains blocked  
**Scope:** provider-neutral evidence continuity only. This document does not authorize provider creation, credential use, confidential intake, production access, production release or any legal/regulatory commitment.

## Purpose

The staging evidence manifest already limits durable evidence to nonsecret, content-addressed proof references. This checkpoint layer adds deterministic continuity so a later copy, handoff or verification event can prove that the same exact manifest and the same four proof references were preserved rather than silently replaced.

The checkpoint is intentionally an immutability/continuity contract, not an evidence-capture or release mechanism.

## Contract

Implementation: `server/staging-evidence-checkpoint-contract.cjs`  
Tests: `tests/staging-evidence-checkpoint-contract.test.cjs`  
Mandatory gate: included in `npm run test:intake-runtime`.

A valid checkpoint records only:
- exact source SHA;
- non-production preview deployment ID;
- distinct preserved production baseline deployment ID;
- isolated staging provider/environment identifiers;
- manifest-plan digest;
- manifest digest;
- one digest for each required proof class: `environment_binding`, `signed_user_policy`, `backup_restore`, `kill_switch`;
- a deterministic digest of that four-proof reference set;
- sequence number;
- parent checkpoint digest and parent manifest digest for non-genesis checkpoints;
- fixed fail-closed authority state.

It carries no raw provider evidence, evidence URL/path, credential, secret, participant PII, confidential-data material, request/response body, query/header/cookie material or release authority.

## Continuity rules

A genesis checkpoint has sequence `1` and null parent digests.

A child checkpoint must:
1. point to the exact digest of its immediate parent checkpoint;
2. carry the parent's exact manifest digest;
3. increment sequence by exactly one;
4. preserve source SHA, preview deployment, production baseline, provider, environment and manifest-plan digest;
5. preserve every individual proof-reference digest;
6. preserve the deterministic reference-set digest;
7. preserve the exact manifest digest.

If any proof reference is replaced, any continuity field drifts, a parent link is forged, sequence skips, or the manifest itself changes, verification fails closed.

A proof rerun or a genuinely different manifest must start a separately governed evidence lineage rather than rewriting an existing checkpoint chain.

## Authority boundary

Every valid checkpoint returns:
- `activation_allowed: false`;
- `production_release_authorized: false`;
- `separate_release_review_required: true`.

A valid checkpoint proves reference continuity only. It does not prove that the underlying provider evidence is true, does not prove live staging is safe, and does not authorize intake activation or production release.

## Current project proof level

- **Documented:** yes — this contract and its safety boundary are recorded.
- **Implemented:** yes — contract and test source are present on the active branch.
- **Tested:** requires an exact-current-head CI pass after this change.
- **Preview deployed:** requires a READY non-production Vercel deployment whose Git SHA exactly matches the tested head.
- **Live staging:** no.
- **Production verified/released for this line:** no.

## Live-staging prerequisites remain unchanged

Owner/security decisions D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 remain hard gates. Real database/auth/abuse/incident/notification provider binding, real signed-user RLS execution, real provider backup/restore, live kill-switch proof, billable-environment authorization, credential availability and separate production-release authority remain outside this contract.
