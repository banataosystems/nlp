# WorldStage / Cherry — Phase 2 receipt + incident/control hardening

**Date:** 2026-08-10  
**Branch:** `redesign/mobile-first-v2`  
**Scope:** non-live Phase 2 hardening only; no production activation

## Purpose

This package closes two safe pre-staging gaps without binding a real database, authentication provider, abuse-control provider, confidential-data path, or production release:

1. non-enumerating receipt-status lookup; and
2. provider-neutral incident / dynamic intake-control contracts.

The existing outer environment kill switch remains in place. The dynamic control below is an additional fail-closed layer inside the non-public synthetic orchestrator.

## Receipt status — implemented, non-public

`server/receipt-status-contract.cjs` implements an actor-bound lookup contract that:

- accepts only opaque `WS-...` receipt codes matching a narrow format;
- requires a server-derived actor identity;
- requires an adapter method that resolves a receipt for that actor;
- returns the same low-information `404 receipt_unavailable` response for malformed, absent, cross-actor, adapter-failure and unknown-state cases;
- maps internal workflow states to a small public status vocabulary;
- returns only `receipt_code`, coarse `status` and a bounded public message;
- does not expose internal intake IDs, sensitivity/visibility classes or confidential narrative.

The synthetic staging adapter supports actor-bound lookup solely for tests. No public receipt-status route is exposed and no real provider is bound.

## Dynamic intake control — implemented in synthetic orchestration

`server/intake-control.cjs` defines a provider-neutral control contract with two states only:

- `enabled`
- `disabled`

Reading control state fails closed: a missing adapter, adapter failure or unknown state is treated as disabled.

State changes require:

- a non-empty actor identity;
- a bounded operational reason;
- a correlation ID;
- an external authorization decision with a decision identifier;
- atomic transaction support;
- an audit record in the same transaction.

Enabling is intentionally harder than disabling: enablement additionally requires explicit readiness evidence. Audit failure rolls the state transition back.

The raw operational reason is not copied into the audit change summary. The audit stores bounded control metadata and references instead.

`server/synthetic-control-adapter.cjs` is an in-memory transactional test adapter only.

## Orchestrator integration

`server/intake-orchestrator.cjs` now evaluates the dynamic control immediately after the existing request/environment contract and before abuse-control, authentication, authorization or persistence work.

The effective synthetic intake sequence is now:

`outer environment gates → dynamic control state → abuse control → authentication → submission authorization → exact-source staging adapter validation → atomic persistence/audit → minimal public receipt`

If dynamic control is missing, disabled or unavailable, the orchestrator returns a generic `503 intake_control_disabled` response and does not call downstream abuse controls or write persistence state.

This orchestrator remains deliberately **unbound from the public route**. `/api/v1/intakes` still has no 2xx path even if its three environment flags are set.

## Incident signal contract

`buildIncidentSignal` produces a structured, bounded incident signal with only:

- category;
- severity;
- correlation ID;
- source;
- optional error class.

Accepted categories are limited to authorization, abuse, persistence, privacy, availability and integrity. Accepted severities are low, medium, high and critical. Arbitrary narrative fields are not part of the signal contract.

No live incident-management provider, pager, email, webhook, analytics destination or automatic production shutdown is wired.

## Verification added

`tests/receipt-status-contract.test.cjs` covers:

- narrow opaque receipt format;
- identical unavailable responses;
- actor-bound retrieval;
- cross-actor and cross-identity-type denial;
- coarse state mapping;
- adapter failure handling;
- non-disclosure of internal state/classes.

`tests/intake-control.test.cjs` covers:

- fail-closed control reads;
- disabled-by-default synthetic state;
- external authorization requirement;
- readiness evidence required before enablement;
- atomic audit + state transition;
- rollback on audit failure;
- required reason/correlation;
- bounded incident signals.

`tests/intake-orchestrator.test.cjs` additionally covers:

- missing dynamic control fails closed;
- disabled dynamic control fails before downstream work;
- unavailable control store fails closed;
- enabled synthetic control permits the existing verified pipeline;
- the original outer environment kill switch still takes precedence.

`package.json` includes both receipt and control suites in `npm run test:intake-runtime`.

## Lifecycle state at this commit line

- **Documented:** yes — contract and boundaries recorded here.
- **Implemented:** yes — receipt lookup, transactional control contract, synthetic control adapter and dynamic orchestrator gate exist on the branch.
- **Tested:** pending exact-current-head GitHub Actions completion; individual test source is present but a green exact-head run is required before claiming tested.
- **Preview deployed:** automatic Git-linked preview deployment is expected for branch commits; READY + exact Git SHA must be verified separately before claiming the current head preview-deployed.
- **Live staging:** not created / not activated.
- **Production deployed:** not performed for these changes.
- **Production verified:** not applicable; production remains on the separate baseline.

## Gates that remain closed

Do not bind or activate real confidential intake until the existing owner/security decision ledger, billable-environment authorization, live staging security proof, provider identity, real PostgreSQL/RLS tests, physical-device validation, release provenance, rollback evidence, Pandora Memory synchronization (or explicit governance exception), and authorized production-release gates are satisfied.

No current code in this package is evidence that those gates are satisfied.

## Next safe work after exact-head CI

If exact-head CI and the exact-source preview are green, reconcile the runtime implementation document and PR evidence to this head. Then continue only with non-live provider-boundary hardening that does not create a billable environment or expose confidential intake. Real staging creation remains a separate gated action.
