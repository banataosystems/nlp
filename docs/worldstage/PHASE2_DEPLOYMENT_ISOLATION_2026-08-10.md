# WorldStage / Cherry — Phase 2 deployment isolation contract

**Date:** 2026-08-10  
**Scope:** non-production evidence hardening only  
**Implementation:** `server/deployment-isolation-contract.cjs`  
**Tests:** `tests/deployment-isolation-contract.test.cjs`

## Purpose

Prevent preview-deployed WorldStage candidate code from being mistaken for a production release, and make the separation between the active candidate deployment and the preserved production baseline explicit, tamper-evident and machine-verifiable.

This contract does not authorize deployment, staging activation, data binding or production release. It records and verifies a fail-closed evidence shape only.

## Enforced invariants

A valid deployment-isolation capsule requires all of the following:

- the candidate source SHA is a 40-character Git SHA;
- the candidate preview Git SHA exactly equals the candidate source SHA;
- candidate and production-baseline deployment IDs are valid and different;
- the candidate deployment target is `null`, representing preview/non-production evidence;
- the candidate source is Git;
- the preserved production baseline remains `target: production` and source `redeploy`;
- production promotion is explicitly false;
- the staging-readiness and mobile-visual artifacts are content-addressed with SHA-256 digests;
- intake control remains disabled;
- confidential intake remains inactive;
- release authority remains false;
- secret-shaped fields are rejected from the evidence object;
- any mutation invalidates the capsule digest.

## Proof-level boundary

The capsule may represent only `proof_level: preview_deployed`.

It cannot represent:

- live staging proof;
- provider binding;
- confidential-data activation;
- production release authorization;
- production promotion;
- production verification.

Those remain separate proof gates.

## Failure behavior

Verification fails closed for SHA mismatch, shared candidate/production deployment IDs, production-targeted candidates, changed production provenance, missing or malformed artifact digests, enabled intake, confidential intake, release authorization, secret-shaped fields or tamper-digest mismatch.

## Current evidence use

The contract is designed to capture exact-source deployment evidence after CI and Vercel verification. The verified deployment IDs and artifact digests belong in durable PR/roadmap evidence after the exact-current-head verification cycle completes; they are not hard-coded into the reusable contract.

## Non-claims

This work does not create a staging environment, bind a database or authentication provider, perform a production release, authorize spending, or prove production suitability.
