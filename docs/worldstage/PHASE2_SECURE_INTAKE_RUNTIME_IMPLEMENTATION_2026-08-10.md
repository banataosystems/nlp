# WorldStage / Cherry — Phase 2 secure-intake runtime implementation

**Date:** 2026-08-10  
**Branch:** `redesign/mobile-first-v2`  
**Release state:** branch implementation only; not production activated

## What is now implemented

A minimal server boundary now exists at:

- `api/v1/intakes.js`
- `server/intake-contract.cjs`

This is intentionally a **fail-closed runtime shell**, not a live confidential intake service.

## Safety state

The route refuses intake unless both conditions are explicitly true:

1. `WORLDSTAGE_SECURE_INTAKE_ENABLED=true`
2. `WORLDSTAGE_SECURE_INTAKE_PERSISTENCE=staging`

Even when both are set, the current runtime performs validation only. It has no database, Supabase, CRM, queue, AI, analytics, email, vector, or other persistence/downstream adapter.

The current browser application does not call `/api/v1/intakes`.

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

## Authority fields rejected

The runtime rejects client attempts to control fields including reviewer assignment, membership role, permissions/scopes, workflow/approval state, visibility, sensitivity, retention, required authority, decision actor/timestamp, sponsor/public release flags, audit actor/outcome, server timestamps, and privileged identity claims.

## Verification

`tests/intake-runtime.test.cjs` exercises the runtime contract using Node's built-in test runner.

The CI workflow now runs:

`npm run test:intake-runtime`

before staging preflight and browser/device suites.

The existing Phase 2 API security contract was also updated so that the invariant is no longer “the route must not exist.” The stronger invariant is now:

**the route may exist as tested server code, but the browser must not call it, persistence must remain unconfigured, authority must remain server-controlled, and activation must fail closed.**

## Not implemented / not claimed

- no live staging database;
- no RLS execution against a real database;
- no signed-identity authorization verification;
- no receipt persistence;
- no idempotency persistence store;
- no rate-limit provider;
- no CAPTCHA/bot provider;
- no auth mode activation;
- no confidential production intake;
- no production deployment of this branch;
- no participant data collection;
- no automatic AI/analytics processing.

## Next safe implementation step

Build the persistence adapter interface, transaction/audit semantics, synthetic staging fixtures, and executable signed-user authorization harness in code **without binding them to any real Supabase project**. A real staging project/branch can be attached only after the billable environment-creation gate is explicitly satisfied.
