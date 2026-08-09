# WorldStage International / Cherry Pua

Business-adaptive digital experience and operating-system prototype for WorldStage International.

## Production

**https://cherrypua.vercel.app**

Vercel project: `cherrypua`  
Project ID: `prj_ebP53cux8LAB18VFiKlgfP3ew2RH`  
Current verified production deployment: `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`  
Production event: redeploy of original deployment `dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s` on 2026-08-10 03:16:32 Asia/Manila.

The current production deployment is a Vercel **redeploy of the original baseline artifact**. It is not evidence that `redesign/mobile-first-v2` or PR #1 has been released.

## Active implementation line

- Branch: `redesign/mobile-first-v2`
- PR: #1 — WorldStage mobile-first recovery v2
- Latest exact-source product-code proof: `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1`
- Git → Vercel preview binding: **PROVEN**
- Mobile-v2 protected preview deployment: **PROVEN / READY**
- Production promotion: **not performed**

A verified preview deployment tied to exact Git source is:

- deployment: `dpl_2VtuQnr9JV7hZuioNALtpXg3esBX`
- GitHub repo: `banataosystems/nlp`
- branch: `redesign/mobile-first-v2`
- exact commit: `80d0e1e28de421c0c52586b830ba205e599c9785`
- source reported by Vercel: `git`
- Vercel build log: cloned this branch/commit, built with Vercel CLI 58.1.0, deployment completed successfully.

The branch alias is protected by Vercel Authentication and remains non-production.

## Signature surfaces

- **The Stage** — cinematic/editorial public experience.
- **What We Heard** — conversational, source-aware discovery.
- **Cherry Judgment Queue** — mobile-first executive intelligence prototype.
- **Transformation Record** — provenance, permission, evidence and sustainment narrative.

## Governing principle

> WorldStage should not adjust itself to the software. The software should adjust itself to WorldStage.

The product is intentionally built around WorldStage's discovery → design → intervention → evidence → sustainment logic instead of imposing a generic CRM mental model.

## Current verification state

| Gate | State |
|---|---|
| Documented | Verified |
| Baseline prototype implemented | Verified for the four prototype surfaces |
| Mobile-v2 implementation | Implemented on draft PR #1 |
| Mobile-v2 automated/browser tested | Verified on exact product-code head `be41775...` |
| Git → Vercel preview binding | **Verified** |
| Mobile-v2 preview deployment | **Verified / READY / protected** |
| Current production availability | Verified after baseline redeploy |
| Current production source | Redeployed original baseline artifact |
| Mobile-v2 deployed to production | No |
| Full business integrations | Not yet implemented |
| Pandora Memory synchronization | Blocked/unavailable in current connector state |

## Release infrastructure

The repository now includes `.github/workflows/vercel-traceable-release.yml`.

It is manual (`workflow_dispatch`) only and has not been run. It reruns exact-source tests before deployment, fails closed if `VERCEL_TOKEN` is missing, and requires the exact literal `DEPLOY_CHERRY_PRODUCTION` before production commands can execute. It records source SHA/tree, deployment URL, Vercel CLI version and workflow run provenance.

## Evidence

- [`docs/worldstage/WORLDSTAGE_MASTER_BLUEPRINT.md`](docs/worldstage/WORLDSTAGE_MASTER_BLUEPRINT.md) — research and system blueprint.
- [`docs/worldstage/IMPLEMENTATION_STATUS_2026-08-08.md`](docs/worldstage/IMPLEMENTATION_STATUS_2026-08-08.md) — implementation and QA status for the original baseline.
- [`docs/worldstage/DEPLOYMENT_MANIFEST_2026-08-08.md`](docs/worldstage/DEPLOYMENT_MANIFEST_2026-08-08.md) — original exact source/deployment identifiers.
- [`docs/worldstage/PRODUCTION_REDEPLOY_EVIDENCE_2026-08-10.md`](docs/worldstage/PRODUCTION_REDEPLOY_EVIDENCE_2026-08-10.md) — current production redeploy provenance and verification.
- [`docs/worldstage/GIT_VERCEL_BINDING_EVIDENCE_2026-08-10.md`](docs/worldstage/GIT_VERCEL_BINDING_EVIDENCE_2026-08-10.md) — exact Git → protected-preview binding proof.
- [`docs/worldstage/PHASE1_EXECUTION_2026-08-10.md`](docs/worldstage/PHASE1_EXECUTION_2026-08-10.md) — reconciled Phase 1 business-truth gate and next dependency order.
- [`docs/worldstage/CHERRY_OWNER_VALIDATION_PACKET.md`](docs/worldstage/CHERRY_OWNER_VALIDATION_PACKET.md) — owner workflow validation packet.

## Important boundaries

Current production is still the high-fidelity baseline prototype, not the finished WorldStage business operating system and not mobile-v2. A protected mobile-v2 preview now exists with exact Git provenance, but it is not owner-approved production. Secure server-side Discovery intake, real authentication/authorization, CRM, calendar, participant, payment and production AI integrations remain gated future work.
