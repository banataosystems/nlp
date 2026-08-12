# WorldStage / Cherry — Phase 2 staging preflight

**Date:** 2026-08-10  
**State:** executable pre-staging guard; no live infrastructure created

## Purpose

Turn the Phase 2 staging gate into repeatable machine evidence without weakening the owner/security boundary.

The preflight does **not** create a database, auth tenant, API endpoint, secret, staging project, production deployment, or client-data path.

## Components

- `config/worldstage/phase2-staging-gate.json` — machine-readable lifecycle gate and fail-closed defaults.
- `scripts/worldstage-decision-evidence-check.mjs` — rejects a `RESOLVED` decision unless the complete evidence record exists.
- `scripts/worldstage-staging-preflight.mjs` — reads the authoritative decision ledger, records its SHA-256, evaluates the minimum staging decisions and environment identity, and emits a readiness report.
- `tests/phase2-decision-evidence-enforcement.spec.mjs` — proves a checkbox/status flip cannot unlock staging without evidence.
- `tests/phase2-staging-preflight.spec.mjs` — proves the preflight blocks unresolved decisions, intake enablement and staging/production project collisions.

## Machine report

CI generates:

`artifacts/staging-readiness/worldstage-phase2-staging-readiness.json`

The report includes:

- exact source SHA supplied by CI;
- authoritative Issue #4 reference;
- decision-ledger path and SHA-256;
- status of every minimum staging decision;
- fail-closed defaults;
- relevant environment identity facts;
- unexpected remote Phase 2 implementation paths;
- explicit blocker codes;
- final readiness state.

## Current expected state

With the current ledger, the correct output is:

`BLOCKED`

with blocker:

`OWNER_SECURITY_DECISIONS_OPEN`

That result is a **PASS for the preflight mechanism** because live staging is intentionally not authorized yet.

## Two operating modes

### Report mode

`npm run preflight:staging`

Produces the readiness artifact and exits successfully even when readiness is `BLOCKED`. This lets CI preserve evidence about *why* staging is blocked.

### Enforcement mode

`npm run preflight:staging:require-ready`

Exits non-zero unless the gate is genuinely ready. This command is reserved for the future staging-creation workflow and must be executed before any remote staging creation/migration action.

## Decision evidence rule

A decision row may be changed to `RESOLVED` only when the evidence record contains non-placeholder values for:

1. Decision ID
2. Status
3. Decision value
4. Approved by
5. Approval date
6. Evidence/source
7. Rationale
8. Exceptions
9. Implementation impact

The structural checker does not decide whether an approver is legally/business-authorized; it prevents obvious mechanical bypasses and incomplete evidence from being treated as sufficient.

## Remote implementation guard

Before the staging gate is ready, the preflight flags unexpected live Phase 2 implementation paths such as an intake API route or executable remote-migration directory.

The current SQL under `docs/worldstage/phase2-sql-drafts/` is intentionally excluded from that flag because it remains documentation/static draft material, not an executable remote migration set.

## Safety invariant

A developer, agent, CI job or automation must not convert technical readiness into business/security authority.

The lifecycle remains:

`documented → statically verified → owner/security decision evidence → isolated staging → signed-user/RLS/API proof → production authorization → production deployment → production verification`

No earlier stage implies a later one.
