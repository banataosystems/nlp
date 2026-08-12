# WorldStage / Cherry — Phase 2 secure-intake runtime implementation

**Date:** 2026-08-10  
**Branch:** `redesign/mobile-first-v2`  
**Release state:** branch implementation / preview only; not production activated

## What is now implemented

The active branch now contains a provider-neutral secure-intake security harness at:

- `api/v1/intakes.js`
- `server/intake-contract.cjs`
- `server/intake-auth-contract.cjs`
- `server/intake-abuse-contract.cjs`
- `server/intake-orchestrator.cjs`
- `server/intake-persistence.cjs`
- `server/synthetic-staging-adapter.cjs`
- `server/synthetic-identity.cjs`
- `server/synthetic-authorization.cjs`
- `server/staging-adapter-contract.cjs`

This is intentionally a **fail-closed runtime and synthetic staging simulator**, not a live confidential intake service.

## Public route is intentionally non-operational

`/api/v1/intakes` exists so the server boundary can be tested and preview-deployed, but it has **no 2xx path** today.

The low-level request validator requires all three explicit flags:

1. `WORLDSTAGE_SECURE_INTAKE_ENABLED=true`
2. `WORLDSTAGE_SECURE_INTAKE_PERSISTENCE=staging`
3. `WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND=true`

Even if all three are accidentally set, the public route still returns `503 runtime_dependencies_not_bound` rather than accepting an intake. The real route must later be deliberately rewired to the full orchestrator only after authentication, abuse controls, submission authorization, exact-source staging adapter, incident/kill-switch and live staging gates are satisfied.

The browser application does not call `/api/v1/intakes`.

## Request contract

The server request validator enforces:

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
- no privileged credential/provider integration.

Client input cannot choose reviewer, transformation membership, permissions/scopes, approval/workflow state, visibility, sensitivity, retention, decision authority/actor, sponsor/public release flags, audit actor/outcome, server timestamps or privileged identity claims.

## Intake authentication contract

`server/intake-auth-contract.cjs` supports only two future candidate modes:

- `authenticated` user identity;
- `bound_invitation` with exact `intake:create` scope, `worldstage-intake` audience and expiry.

Anonymous/public, email-domain-derived or unknown authentication modes are denied by default.

Normal intake does not invent an AAL2 requirement. AAL1/AAL2 may both satisfy the candidate authenticated intake boundary; privileged business decisions remain separately subject to stronger step-up requirements where policy requires.

No production authentication provider is wired.

## Abuse-control contract

`server/intake-abuse-contract.cjs` requires an explicit provider decision before authentication/persistence proceeds.

The abuse provider receives only coarse request metadata:

- canonical correlation ID;
- HTTP method;
- request byte size;
- truncated SHA-256 fingerprint of the idempotency key.

It does **not** receive the intake body, organization/contact fields, bearer token or participant/client narrative through this contract.

Missing, failed or malformed abuse controls return `503`; an explicit deny returns a low-information `429`.

No external rate-limit/CAPTCHA/bot provider is currently wired.

## Synthetic signed-identity authorization harness

`server/synthetic-identity.cjs` and `server/synthetic-authorization.cjs` provide executable **test-only** identity and authorization simulation. They are deliberately not production authentication.

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

The synthetic actor matrix is derived from `config/worldstage/phase2-synthetic-fixtures.json` and remains explicitly non-authoritative until owner/security role decisions are approved.

## Provider-neutral staging adapter isolation

`server/staging-adapter-contract.cjs` rejects a candidate adapter unless it is:

- explicitly `environment: staging`;
- bound to project key `worldstage-cherry`;
- provider-identified;
- environment-ID identified;
- exact-source-SHA identified;
- not production-capable;
- not marked as containing real data in the synthetic harness;
- transaction-capable with required atomic methods.

Source-SHA mismatch, production capability, real-data marking, missing audit/idempotency/commit/rollback methods, or wrong project/environment all fail closed.

`server/synthetic-staging-adapter.cjs` provides an in-memory transactional adapter solely for executable tests.

No Supabase/Postgres persistence adapter exists in the repository.

## Atomic persistence and actor-scoped idempotency

`server/intake-persistence.cjs` defines the future adapter-facing transaction behavior.

Synthetic execution verifies:

- intake + idempotency + audit all succeed before commit;
- audit failure rolls the transaction back;
- actor identity is required;
- same actor + same key + same body returns the existing receipt without duplicate writes;
- same actor + same key + materially different body returns conflict;
- a different actor may reuse the same client-generated key without receiving or discovering the first actor's receipt;
- audit change summaries exclude submitted narrative, contact email and organization content.

Public receipt codes are server-generated opaque `WS-...` strings. Internal intake IDs are not returned in public responses.

The non-deployed SQL design is aligned in `docs/worldstage/phase2-sql-drafts/004_runtime_alignment_constraints.sql`: receipt codes become server-generated text values and idempotency is uniquely scoped by server-derived actor scope + idempotency key instead of globally by key.

## End-to-end synthetic orchestration

`server/intake-orchestrator.cjs` composes:

`request validation → abuse control → authentication → submission authorization → exact-source staging adapter validation → atomic persistence/audit → minimal receipt`

Synthetic end-to-end tests verify every missing dependency fails before persistence and that an allowed synthetic flow creates exactly one intake/idempotency/audit transaction and returns only the public receipt.

This orchestrator is **not wired to the public route** and **not bound to a real database/auth/abuse provider**.

## Staging preflight reconciliation

The staging preflight now distinguishes inert/testable Phase 2 server code from a bound data path.

Allowed before live-staging authorization:

- inert API shell;
- provider-neutral contracts;
- synthetic identity/authz/persistence adapters;
- tests and non-deployed SQL drafts.

Still blocks readiness:

- unresolved minimum owner/security decisions;
- confidential-intake enablement;
- staging persistence selector activation;
- adapter binding;
- executable migration/provider adapter paths;
- staging/production project identity collision.

## Verification suite

`npm run test:intake-runtime` includes:

- `tests/intake-runtime.test.cjs`
- `tests/intake-route-shell.test.cjs`
- `tests/intake-persistence.test.cjs`
- `tests/intake-orchestrator.test.cjs`
- `tests/intake-auth-contract.test.cjs`
- `tests/synthetic-authorization.test.cjs`
- `tests/synthetic-rls-matrix.test.cjs`
- `tests/staging-adapter-contract.test.cjs`

The CI workflow runs this security/runtime gate before staging preflight and the wider mobile/device/Phase 2/release/visual suites.

## Current lifecycle state

- Documented: **implemented and reconciled in branch docs**.
- Implemented: **provider-neutral fail-closed runtime/synthetic harness implemented**.
- Tested: **requires exact-current-head CI completion after the latest changes**.
- Preview deployed: **Git-linked Vercel previews are generated automatically; preview is not production**.
- Live staging database/auth: **not created**.
- Production deployed: **not performed for mobile-v2/Phase 2**.
- Production verified: **not applicable to these branch changes**.

## Not implemented / not claimed

- no live staging database;
- no Supabase/Postgres persistence adapter;
- no live PostgreSQL/RLS execution;
- no production authentication provider;
- no external abuse/rate-limit/CAPTCHA provider;
- no confidential intake activation;
- no browser submission to secure intake;
- no participant-private production flow;
- no automatic AI/analytics/vector/session-replay path from intake;
- no production promotion of this branch;
- no Pandora Memory synchronization proof in the current tool state.

## Next safe implementation step

After exact-head CI is green, continue with disabled/non-enumerating receipt-status lookup and provider-neutral incident/kill-switch contracts, then complete the non-live Phase 2 package up to the billable/live-staging boundary. Real Supabase staging creation and real-data activation remain blocked until their separate gates are legitimately satisfied.
