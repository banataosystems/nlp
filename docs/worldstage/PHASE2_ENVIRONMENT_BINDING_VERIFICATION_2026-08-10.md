# Phase 2 — Provider-neutral environment-binding verification

**Date:** 2026-08-10  
**Project:** WorldStage / Cherry  
**Status:** implemented contract; live provider binding not performed

## Purpose

Prepare a deterministic, provider-neutral verification boundary for a future isolated staging environment without creating that environment, supplying credentials, enabling confidential intake, applying real migrations or authorizing production release.

This package exists to prevent a future provider connection from being treated as proof merely because an environment ID exists. A valid live-staging evidence set must remain exact-source, non-production, secret-free in durable evidence, and independently prove signed-user policy behavior, backup/restore and kill-switch operation.

## Implemented contract

`server/environment-binding-verification.cjs` defines two separate proof objects:

1. **Environment-binding plan** — the current pre-live object. It is valid only when provider and environment IDs remain `UNBOUND`, the environment has not been created, migrations have not been applied, live policy/backup/kill-switch proof is absent, confidential intake is inactive, production access is false and activation/release authority are false.
2. **Candidate binding evidence inspection** — a future shape verifier for non-secret live-staging evidence. It can validate provider/environment metadata, exact source/deployment provenance and required content-addressed proof digests, but it always returns `activation_allowed: false`. Passing the evidence-shape verifier therefore cannot activate intake or authorize production.

## Secret boundary

Durable evidence rejects credential-shaped fields recursively, including secret, token, password, service-role, private-key, API-key and credential fields. Real credentials, if a future owner-authorized provider is ever connected, must remain only in the provider's approved secret store and never in repository evidence, analytics, screenshots or semantic memory.

## Required future non-secret evidence

A future isolated staging binding must record, without credentials:

- provider name and non-secret environment ID;
- target explicitly equal to staging;
- exact source SHA;
- exact preview deployment ID and distinct preserved production baseline ID;
- staging-readiness, schema and policy bundle digests;
- signed-user positive/negative policy-test digest;
- backup/restore test digest;
- kill-switch test digest;
- confidential intake still inactive during verification;
- intake control still disabled during verification;
- production access false;
- activation request false.

## Required sequence

The contract preserves this order:

1. resolve owner/security decisions;
2. authorize any billable staging environment;
3. create an isolated non-production environment;
4. record only non-secret provider metadata;
5. verify exact source and artifact digests;
6. apply reviewed staging-only migrations;
7. run signed-user positive/negative policy tests;
8. run backup/restore drill;
9. run kill-switch drill;
10. record exact live-staging evidence;
11. conduct a separate release review if production is ever considered.

No earlier step implies approval for a later step.

## Tests

`tests/environment-binding-verification.test.cjs` verifies that:

- the current plan is valid only while live binding is absent;
- tampering toward a live or production-capable state invalidates the plan;
- future non-secret staging evidence can be shape-verified without granting activation authority;
- source drift, production access, activation requests and missing proof digests fail closed;
- preview/production deployment identity collapse is rejected;
- secret-shaped fields are rejected;
- staging creation and live proof remain behind owner/security and spending gates, with production behind a separate review.

The test is included in the mandatory `test:intake-runtime` CI gate.

## Current proof level

- **Documented:** yes.
- **Implemented:** yes, on the active PR branch.
- **Tested:** requires exact-current-head CI after this implementation change.
- **Preview deployed:** requires an exact-current-head READY preview after this implementation change.
- **Live staging:** no.
- **Production verified/released:** no.

## Hard gates retained

This work does not resolve D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17 or D18. It does not authorize billable staging, create or bind a real database/auth/abuse/incident provider, apply real migrations, activate confidential intake, make a legal/public commitment or authorize production release.
