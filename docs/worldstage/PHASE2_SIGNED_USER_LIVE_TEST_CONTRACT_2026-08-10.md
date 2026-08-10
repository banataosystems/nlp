# Phase 2 — Signed-user live-test fixture and evidence contract

**Date:** 2026-08-10  
**Project:** WorldStage / Cherry  
**Status:** implemented provider-neutral contract; live execution not performed

## Purpose

Prepare the exact proof shape required for a future owner-authorized signed-user staging test without creating a staging environment, supplying credentials, using real-person data, applying real migrations, activating confidential intake or authorizing production.

This contract closes a proof-design gap between environment binding and future live authorization verification. It defines what must be tested and what durable evidence may be retained, while keeping activation fail-closed.

## Implemented boundary

`server/signed-user-live-test-contract.cjs` defines:

1. **Signed-user live-test plan** — a pre-live object tied to exact source SHA, preview deployment, preserved production baseline and policy-bundle digest. It is valid only while live execution is false, the fixture class is synthetic-only, production access is false, confidential intake is inactive, intake control is disabled, activation is false and production release is unauthorized.
2. **Candidate live-test evidence inspection** — a future shape verifier for a real isolated staging run. Passing this verifier never grants activation; it always returns `activation_allowed: false`.

## Required policy matrix

The plan requires positive and negative proof for:

- anonymous authentication denial;
- expired authentication denial;
- valid authenticated-user acceptance at AAL1 where AAL1 is sufficient;
- active-member read access to the correct transformation;
- cross-transformation denial;
- revoked-membership denial;
- assigned-reviewer intake access;
- unassigned intake denial;
- AAL1 denial for sensitive decision resolution;
- authorized AAL2 sensitive-decision resolution;
- restricted-visibility denial;
- owner-only decision denial for a non-owner.

The matrix is immutable at the plan-verification boundary: missing, duplicate, unknown or tampered cases fail closed.

## Privacy and secret boundary

Durable evidence is restricted to synthetic fixture classification, coarse boolean outcomes and content-addressed digests. The contract rejects credential-shaped and common direct-PII/free-form evidence keys recursively, including keys shaped like secrets, passwords, service roles, private/API keys, credentials, email, phone, full name, address, birth data, narrative, payload, message, body or response.

Future evidence must explicitly state:

- `fixture_data_class: synthetic_only`;
- `real_person_data_used: false`;
- `confidential_data_used: false`;
- `production_access: false`;
- `intake_control: disabled`;
- ephemeral sessions were used;
- cleanup was verified;
- activation was not requested;
- production release was not authorized.

No session material, credentials, real identifiers or confidential content belongs in repository evidence.

## Content-addressed future proof

A future live staging test must provide non-secret digests for:

- session-context proof;
- database-policy trace proof;
- test-runner artifact proof;
- every required policy case.

Candidate evidence must match the exact source SHA, preview deployment, preserved production baseline, policy-bundle digest and signed-user test-plan digest. Preview and production deployment identities must remain distinct.

## Required sequence

1. verify exact source and preview provenance;
2. verify an isolated staging target;
3. create synthetic ephemeral identities only;
4. run authentication negative and positive cases;
5. run authorization cross-scope and revocation cases;
6. run AAL1/AAL2 sensitive-decision cases;
7. record only content-addressed non-secret evidence;
8. verify cleanup and disabled-intake state;
9. retain `activation_allowed: false` for a separate release review.

No earlier step authorizes a later step.

## Tests

`tests/signed-user-live-test-contract.test.cjs` verifies:

- the plan remains synthetic-only, staging-only and non-activating;
- live-execution or production-access tampering fails closed;
- case-matrix tampering is detected;
- structurally complete future staging evidence can be inspected without granting activation;
- source drift and preview/production identity collapse are rejected;
- missing, duplicate and contradictory policy results fail closed;
- real-person data, confidential data, production access, activation requests and production-release authority are rejected;
- sensitive/free-form durable evidence fields are rejected;
- content-addressed proof digests and cleanup evidence are mandatory.

The test is included in the mandatory `test:intake-runtime` CI gate.

## Proof level after implementation

- **Documented:** yes.
- **Implemented:** yes, on the active PR branch.
- **Tested:** requires exact-current-head CI after this implementation change.
- **Preview deployed:** requires an exact-current-head READY preview after this implementation change.
- **Live staging:** no.
- **Production verified/released:** no.

## Hard gates retained

This work does not resolve D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 or D18. It does not authorize billable staging, create or bind a real database/auth/abuse/incident provider, create real users, apply real migrations, activate confidential intake, make a legal/public commitment or authorize production release.
