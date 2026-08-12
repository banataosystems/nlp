# WorldStage / Cherry — native `main` protection production gate

Date: 2026-08-12
Project key: `worldstage-cherry`

## Purpose

Add one more fail-closed production boundary while Issue #6 remains externally blocked: production release must not proceed unless GitHub reports native protection active on the repository `main` branch at release time.

## Runtime contract

The traceable production workflow now checks `github.rest.repos.getBranch({ branch: 'main' })` inside the existing reviewed-PR provenance step. For `target=production`, the workflow fails before production-evidence assembly and before any Vercel credential/provider operation unless `mainBranch.protected === true`.

This check runs before the existing exact-source provenance requirements:

1. native `main` protection reports active;
2. exact candidate SHA is associated with a merged PR targeting `main`;
3. exact candidate SHA has a successful mandatory `pull_request` run from `.github/workflows/mobile-contract.yml`;
4. only then may production evidence assembly continue.

## Scope and non-claims

This is defense in depth. It does not configure GitHub branch protection, prove that every desired Issue #6 protection rule is present, or close Issue #6. Native repository configuration still requires a GitHub administration-capable control surface and separate read-only verification of the actual rule set.

It does not authorize live staging, confidential intake, provider creation, spending, legal/public commitments, or production release. Owner/security decisions and D23 remain independent requirements.

## Verification target

The mandatory release-control regression must prove that the native-protection check:

- is production-only;
- occurs after exact source capture;
- occurs before production evidence assembly;
- occurs before Vercel credential access;
- fails closed unless `mainBranch.protected === true`;
- precedes merged-PR and exact-source-CI provenance checks.
