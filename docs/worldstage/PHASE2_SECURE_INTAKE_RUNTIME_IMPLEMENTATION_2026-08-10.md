# WorldStage / Cherry — Phase 2 secure-intake runtime implementation

**Date:** 2026-08-10  
**Branch:** `redesign/mobile-first-v2`  
**Release state:** branch implementation only; not production activated

## What is now implemented

A minimal server boundary and non-live security/transaction harness now exist at:

- `api/v1/intakes.js`
- `server/intake-contract.cjs`
- `server/intake-persistence.cjs`
- `server/synthetic-identity.cjs`
- `server/synthetic-authorization.cjs`
- `server/staging-adapter-contract.cjs`

This is intentionally a **fail-closed runtime and staging simulator**, not a live confidential intake service.

## Three independent activation gates

The request path refuses intake unless all three conditions are explicitly true:

1. `WORLDSTAGE_SECURE_INTAKE_ENABLED=true`
2. `WORLDSTAGE_SECURE_INTAKE_PERSISTENCE=staging`
3. `WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND=true`

No real adapter is bound in the repository or connected deployment. The current browser application does not call `/api/v1/intakes`.

The staging preflight separately blocks any persistence selection, adapter binding, migration/provider adapter path, staging/production project collision, or confidential-intake enablement while the owner/security gate remains unresolved.

## Runtime enforcement implemented

- POST only;
- JSON content type;
- required bounded idempotency key;
- 32 KiB request cap;
- explicit top-level/nested allowlists;
- recursive rejection of client-controlled authority fields;
- required organization/contact/version fields;
- email validation;
- bounded text lengths;
- no raw request logging;
- `Cache-Control: no-store`;
- low-information error responses;
- generic internal-error response;
- no privileged credential or provider integration.

## Transaction contract implemented

`server/intake-persistence.cjs` defines the future adapter-facing transaction behavior without binding a provider.

Synthetic tests verify:

- intake + idempotency + audit must all succeed before commit;
- audit failure rolls the whole transaction back;
- same idempotency key + same body returns the existing receipt without duplicate writes;
- same idempotency key + different body fails with conflict and rolls back;
- audit change summaries contain only state/security metadata, not submitted narrative, email, or organization content.

The transaction contract defaults a future accepted record to:

- state: `pending_human_review`;
- sensitivity: `confidential_client_unclassified`;
- visibility: `worldstage_internal_only`.

These values remain staging design defaults, not owner-approved production policy.

## Synthetic signed-identity authorization harness

`server/synthetic-identity.cjs` and `server/synthetic-authorization.cjs` provide executable, **test-only** identity and authorization simulation. They are deliberately not production authentication.

The harness verifies:

- signed short-lived synthetic tokens;
- signature, expiry, issuer/audience and AAL validation;
- active membership required for transformation reads;
- revoked membership denied;
- owner / transformation-lead requirement for candidate transformation updates;
- membership mutation not exposed;
- assigned reviewer or candidate lead requirement for intake review;
- participant-private / finance-restricted / security-restricted resources denied under the current conservative draft;
- owner-only decisions hidden from ordinary transformation members;
- decision resolution requires the exact required authority plus AAL2 and a resolvable state;
- technical security-admin identity does not imply business-content access;
- same-organization presence alone does not grant transformation access;
- cross-organization membership cannot cross transformation boundaries.

The synthetic actor matrix is derived from the existing `config/worldstage/phase2-synthetic-fixtures.json` actor set and remains explicitly non-authoritative until owner/security role decisions are approved.

## Staging adapter isolation contract

`server/staging-adapter-contract.cjs` enforces future adapter metadata before a transaction can be used.

A candidate adapter is rejected unless it is:

- explicitly `environment: staging`;
- bound to project key `worldstage-cherry`;
- provider-identified;
- environment-ID identified;
- exact-source-SHA identified;
- not production-capable;
- not marked as containing real data in the synthetic harness;
- transaction-capable with required atomic methods.

The contract rejects source-SHA mismatches and transaction shapes that omit audit, idempotency, commit or rollback behavior.

## Verification

Node built-in tests now cover:

- `tests/intake-runtime.test.cjs`
- `tests/intake-persistence.test.cjs`
- `tests/synthetic-authorization.test.cjs`
- `tests/synthetic-rls-matrix.test.cjs`
- `tests/staging-adapter-contract.test.cjs`

CI runs all of them through:

`npm run test:intake-runtime`

before staging preflight and browser/device suites.

The Phase 2 API security contract enforces this invariant:

**server code may exist, but the browser remains disconnected; authority remains server-controlled; provider persistence remains unbound; staging/production isolation is explicit; and every activation boundary fails closed.**

## Not implemented / not claimed

- no live staging database;
- no Supabase/provider persistence adapter;
- no RLS execution against a real database;
- no production authentication provider;
- no receipt/idempotency persistence store outside synthetic tests;
- no rate-limit provider;
- no CAPTCHA/bot provider;
- no auth mode activation;
- no confidential production intake;
- no production deployment of this branch;
- no participant data collection;
- no automatic AI/analytics processing.

## Next safe implementation step

Build the provider-neutral secure-intake orchestration layer and synthetic end-to-end request → authentication → authorization → transaction → audit harness, while keeping the real staging binding blocked until environment/cost and owner/security gates are legitimately satisfied.
