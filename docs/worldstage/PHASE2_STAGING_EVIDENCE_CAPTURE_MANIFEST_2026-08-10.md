# WorldStage / Cherry — Phase 2 staging evidence capture manifest

**Date:** 2026-08-10  
**Status:** implemented as a provider-neutral, non-live contract on `redesign/mobile-first-v2`. This document does not claim a live staging environment, provider binding, real policy execution, confidential intake activation or production release.

## Purpose

Define a durable evidence-capture format for a future isolated staging environment that records only nonsecret, content-addressed proof references. The manifest exists so environment-binding, signed-user policy, backup/restore and kill-switch evidence can later be checkpointed and audited without placing credentials, direct sensitive data, raw evidence material, production access or activation authority in repository evidence.

## Contract

Implementation: `server/staging-evidence-manifest-contract.cjs`  
Regression suite: `tests/staging-evidence-manifest-contract.test.cjs`

The manifest plan is tied to:
- one exact source SHA;
- one non-production preview deployment;
- one distinct preserved production baseline deployment;
- one Phase 2 staging-readiness digest;
- one live-staging evidence-plan digest;
- exactly four proof classes: `environment_binding`, `signed_user_policy`, `backup_restore`, and `kill_switch`.

A future candidate manifest must remain reference-only. Each proof reference may contain only the proof type, content digest, exact source SHA, isolated environment identifier, provider identifier, staging target and coarse outcome. Raw evidence material and evidence locations are intentionally outside the durable manifest.

## Fail-closed rules

The contract rejects:
- source, environment or provider drift;
- missing, unknown or duplicated proof classes;
- reused or malformed proof digests;
- any proof outcome other than `pass`;
- preview/production deployment collapse;
- production access;
- confidential-data use;
- enabled intake control;
- inline evidence material;
- activation requests;
- production-release authority;
- credential-shaped keys;
- common direct-sensitive/free-form keys;
- raw blobs, content fields, URLs/URIs, paths, query/header/cookie fields and similar durable evidence-location material;
- manifest or plan tampering.

A structurally valid manifest returns `evidence_capture_complete: true` only for the reference package itself. It always returns `activation_allowed: false` and `production_release_authorized: false`.

## Proof-state separation

- **Documented:** this contract and its release boundary are recorded here.
- **Implemented:** code exists on the active branch.
- **Tested:** requires an exact-current-head mandatory CI pass with the new regression suite included.
- **Preview deployed:** requires a READY non-production Vercel deployment tied to the exact tested source SHA.
- **Live staging:** not claimed by this contract. Real provider-backed execution remains a separate gated phase.
- **Production verified/released:** not claimed or authorized.

## Safety boundary

This contract does not create infrastructure, bind a provider, accept credentials, apply migrations, execute signed-user database policy tests, restore a provider backup, toggle a live kill switch, activate confidential intake or release production.

Live staging remains blocked until the authoritative owner/security decisions, spending/provider-binding authority, required credentials and all separate live security/recovery gates are legitimately satisfied.
