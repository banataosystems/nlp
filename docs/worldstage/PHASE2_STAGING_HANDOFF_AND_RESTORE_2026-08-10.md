# WorldStage / Cherry — Phase 2 staging handoff + restore package

**Date:** 2026-08-10  
**Branch:** `redesign/mobile-first-v2`  
**Scope:** provider-neutral, non-live staging preparation only

## Purpose

This package prepares the secure-intake system for a future isolated staging environment without creating one, binding a provider, activating confidential intake, applying executable migrations, or changing production.

It adds three related safety layers:

1. rollback capsule contract;
2. staging handoff manifest contract;
3. synthetic-only backup/restore drill contract.

## Rollback capsule

`server/intake-rollback-contract.cjs` records a tamper-evident rollback capsule containing:

- exact source SHA;
- exact preview deployment ID;
- preserved production restore baseline deployment ID;
- disabled intake control;
- unbound provider state;
- confidential intake inactive;
- ordered restore steps;
- explicit `authorized: false` execution state;
- required release/security gates before any restore execution.

The capsule cannot itself authorize a production restore.

## Staging handoff manifest

`server/staging-handoff-contract.cjs` defines the provider-neutral handoff object that a future staging binding must satisfy.

The handoff is valid only while:

- project key is `worldstage-cherry`;
- source SHA and deployment provenance are explicit;
- rollback/schema/policy artifact digests are supplied;
- provider, environment ID, auth, abuse and incident providers remain `UNBOUND`;
- data class is `synthetic_only`;
- confidential intake remains disabled;
- dynamic intake control remains disabled;
- executable migrations remain false;
- production access remains false;
- activation remains false.

Any secret-shaped field such as token, password, service-role key, API key, credential or private key is rejected from the manifest structure. Credentials belong only in the eventual approved provider secret store and must never be committed into GitHub evidence.

The required bind sequence preserves the dependency order:

`owner/security decisions → billable staging authorization → isolated non-production environment → provider/environment identity evidence → artifact digest verification → reviewed staging-only migrations → auth configuration → signed-user positive/negative policy tests → backup/restore + kill-switch drills → exact staging evidence`

## Synthetic backup / restore drill

`server/synthetic-backup-restore-contract.cjs` provides a provider-neutral restore rehearsal without real customer data.

A synthetic backup capsule:

- accepts only records explicitly marked `synthetic: true`;
- rejects any non-synthetic/real-data record;
- requires `synthetic_only` sensitivity when supplied;
- requires intake control disabled;
- carries exact source SHA;
- is content-digested for tamper detection;
- declares production restore forbidden;
- requires an empty isolated staging target;
- requires confidential intake disabled after restore.

The restore drill fails if:

- the backup digest is altered;
- the target is production-capable;
- the target contains real data;
- the target is not empty;
- the restored content does not exactly match the backup content;
- intake control is not disabled after restore;
- confidential intake becomes active after restore.

This is a **synthetic execution contract only**. It is not evidence that a real PostgreSQL/Supabase backup has been created or restored.

## CI integration

The secure-intake runtime gate now includes:

- `tests/rollback-contract.test.cjs`
- `tests/staging-handoff-contract.test.cjs`
- `tests/synthetic-backup-restore.test.cjs`

alongside the existing request, route-shell, authentication, abuse-control, authorization, receipt, kill-switch, persistence, idempotency, RLS simulation and staging-adapter contracts.

Exact-current-head GitHub Actions success is required before this package may be labelled tested.

## Lifecycle status

- **Documented:** implemented in this file and existing Phase 2 evidence package.
- **Implemented:** contracts and tests exist on the branch.
- **Tested:** pending exact-current-head CI at the time this document is written.
- **Preview deployed:** pending exact-current-head Vercel preview verification.
- **Live staging:** not created.
- **Real backup/restore:** not performed.
- **Production:** unchanged; this package is not promoted.

## Remaining hard gates

Real staging remains blocked until the authoritative owner/security decision ledger is resolved and billable staging creation is legitimately authorized. A future live staging pass must still prove real signed-user authentication, live PostgreSQL/RLS isolation, negative cross-role/cross-org tests, abuse controls, backup/restore, kill-switch behavior, audit integrity, provider isolation and exact-source evidence.

Pandora Memory synchronization must also be restored or explicitly governed as an exception before durable production-state claims are made.
