# WorldStage / Cherry — Phase 2 secure-intake runtime implementation

**Date:** 2026-08-10  
**Branch:** `redesign/mobile-first-v2`  
**Release state:** branch implementation only; not production activated

## What is now implemented

A minimal server boundary and non-live transaction contract now exist at:

- `api/v1/intakes.js`
- `server/intake-contract.cjs`
- `server/intake-persistence.cjs`

This is intentionally a **fail-closed runtime shell**, not a live confidential intake service.

## Three independent activation gates

The request path refuses intake unless all three conditions are explicitly true:

1. `WORLDSTAGE_SECURE_INTAKE_ENABLED=true`
2. `WORLDSTAGE_SECURE_INTAKE_PERSISTENCE=staging`
3. `WORLDSTAGE_SECURE_INTAKE_ADAPTER=bound`

No real adapter is bound in the repository or connected deployment. The current browser application does not call `/api/v1/intakes`.

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

## Verification

Node built-in tests:

- `tests/intake-runtime.test.cjs`
- `tests/intake-persistence.test.cjs`

CI runs both through:

`npm run test:intake-runtime`

before staging preflight and browser/device suites.

The Phase 2 API security contract now enforces the stronger invariant:

**server code may exist, but the browser must remain disconnected; authority remains server-controlled; provider persistence remains unbound; and every activation boundary fails closed.**

## Not implemented / not claimed

- no live staging database;
- no Supabase/provider adapter;
- no RLS execution against a real database;
- no signed-identity authorization verification;
- no receipt/idempotency persistence store;
- no rate-limit provider;
- no CAPTCHA/bot provider;
- no auth mode activation;
- no confidential production intake;
- no production deployment of this branch;
- no participant data collection;
- no automatic AI/analytics processing.

## Next safe implementation step

Build the executable signed-user authorization harness and provider-neutral adapter interface against synthetic fixtures, then keep the real staging binding blocked until the environment/cost and owner/security gates are legitimately satisfied.
