# WorldStage / Cherry — main provenance guard

Date: 2026-08-12
Project: `worldstage-cherry`
Repository: `banataosystems/nlp`

## Purpose

Defense-in-depth for Issue #6 while native GitHub branch protection remains unavailable through the current connected control plane.

This guard does **not** replace native branch protection. It prevents a direct-to-`main` or otherwise unreviewed source from being accepted as a production candidate by the traceable release workflow.

## Production provenance requirements

Before production evidence assembly or any Vercel credential/provider operation, the exact checked-out source SHA must satisfy both:

1. GitHub associates the exact SHA with at least one pull request that is actually merged and targets `main`.
2. The exact same SHA has a successful `pull_request` run of `.github/workflows/mobile-contract.yml`.

A direct `main` commit with no associated merged PR is rejected even if some unrelated CI run exists. A merged PR without exact-source mandatory CI is rejected. CI from another SHA or another workflow cannot substitute.

## Git deployment isolation

`vercel.json` sets `git.deploymentEnabled=false`, disabling automatic Git deployments for every branch. This keeps repository hardening work from becoming an implicit preview or production deployment path. Explicit traceable release remains separately gated.

## Lifecycle / non-claims

- Documented: yes
- Implemented on hardening branch: yes
- Exact-source PR CI: pending until the hardening PR runs
- Merged to main: no at this checkpoint
- Live staging: no
- Production release: no

No owner/security decision, live provider resource, confidential intake, spending authority, legal/public commitment, or production release is created by this guard.
