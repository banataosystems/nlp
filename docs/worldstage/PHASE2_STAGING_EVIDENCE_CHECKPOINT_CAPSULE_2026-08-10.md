# WorldStage / Cherry — Phase 2 staging evidence checkpoint portability capsule

**Date:** 2026-08-10  
**Status:** implemented on active PR line; live staging remains blocked  
**Scope:** provider-neutral checkpoint portability only. This document does not authorize provider creation, credential use, confidential intake, production access, production release, spending or any legal/regulatory commitment.

## Purpose

The staging evidence checkpoint chain proves that a manifest and its four reference-only proof digests have not been silently replaced inside one governed lineage. This capsule adds a deterministic export and verification envelope so that complete checkpoint lineages can be copied between durable storage locations and independently re-verified without carrying the underlying provider evidence, credentials, confidential data or release authority.

The capsule transports checkpoint records only. Those checkpoint records already contain content-addressed reference metadata rather than raw provider evidence.

## Contract

Implementation: `server/staging-evidence-checkpoint-capsule-contract.cjs`  
Tests: `tests/staging-evidence-checkpoint-capsule-contract.test.cjs`  
Mandatory gate: included in `npm run test:intake-runtime`.

A valid capsule records:
- exact source SHA;
- non-production preview deployment ID;
- distinct preserved production baseline deployment ID;
- isolated staging provider/environment identifiers;
- manifest-plan digest and immutable reference-set digest;
- complete ordered checkpoint records beginning at sequence 1;
- deterministic genesis and terminal checkpoint digests;
- exact checkpoint count and terminal sequence;
- fixed fail-closed authority state.

The capsule itself is content-addressed with the same canonical SHA-256 scheme used by the existing evidence contracts.

## Portability and continuity rules

A valid capsule must contain a complete ordered chain beginning with the genesis checkpoint. Every checkpoint must pass the checkpoint contract, and every non-genesis checkpoint must verify against its immediate predecessor.

Verification fails closed when:
1. an ancestor is missing;
2. checkpoints are reordered;
3. a checkpoint digest is reused;
4. sequence or parent linkage is forged;
5. source, preview deployment, production baseline, provider, environment, manifest-plan digest or reference-set digest drifts from capsule metadata;
6. the capsule digest is modified or reconstructed from different material;
7. extra durable fields, credential-shaped fields, evidence-location fields or sensitive material are inserted;
8. confidential-data use, production access, activation authority or production-release authority is asserted.

This means a copied capsule can be verified using only the capsule itself. The underlying provider evidence remains external and referenced only by digests.

## Authority boundary

Every valid capsule returns:
- `portability_verified: true`;
- `activation_allowed: false`;
- `production_release_authorized: false`;
- `separate_release_review_required: true`.

A valid capsule proves only that a checkpoint lineage was transported intact. It does not prove the truth of underlying provider evidence, does not prove live staging safety, and does not authorize intake activation or production release.

## Proof progression

- **Documented:** yes — this portability contract and its safety boundary are recorded.
- **Implemented:** yes — contract and tests are present on the active branch.
- **Tested:** requires an exact-current-head CI pass after mandatory-gate integration.
- **Preview deployed:** requires a READY non-production Vercel deployment whose Git SHA exactly matches the tested head.
- **Live staging:** no.
- **Production verified/released for this line:** no.

## Live-staging prerequisites remain unchanged

Owner/security decisions D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 and D18 remain hard gates. Real database/auth/abuse/incident/notification provider binding, real signed-user RLS execution, real provider backup/restore, live kill-switch proof, billable-environment authorization, credential availability and separate production-release authority remain outside this contract.

## Next safe product-facing work after this milestone

With the recovery/evidence portability foundation closed, the highest-value no-cost work should shift toward the actual Cherry OS demo workflow using synthetic data: owner cockpit, leads/clients, projects/events, talent/participants, tasks/documents and transformation record flows. Real provider binding and confidential data remain gated.
