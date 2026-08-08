# WorldStage / Cherry Pua — Production Deployment Manifest

**Date:** 2026-08-08  
**Repository:** `banataosystems/nlp`  
**Branch:** `main`  
**Vercel project:** `cherrypua`  
**Vercel project ID:** `prj_ebP53cux8LAB18VFiKlgfP3ew2RH`  
**Vercel deployment ID:** `dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s`  
**Production URL:** https://cherrypua.vercel.app

## Source commits

- `e8b1862750acd2534a346bba3c68669285416a5d` — add WorldStage premium experience shell (`index.html`)
- `0244ef9811108da58f67a96d3cc71b48cca3c25e` — configure static Vercel hosting (`vercel.json`)
- `7bd0807c16ea5f47626ba0280f1f862606dbcfc1` — implement WorldStage signature interactions (`src/app.js`)
- `8f00ce79fbdee0d8fb2b03251e9e94495dee4542` — add premium WorldStage visual system (`src/styles.css`)
- `9d5921020a5252ab29e936cf7da3044dbb666f6d` — record implementation/QA evidence

## Production verification

Vercel reported the deployment state as `READY` and assigned the exact production alias `cherrypua.vercel.app` with no alias error.

External Vercel fetch verification returned:

- `https://cherrypua.vercel.app` → HTTP 200, expected WorldStage HTML shell.
- `https://cherrypua.vercel.app/src/app.js` → HTTP 200, expected WorldStage application runtime containing The Stage, Discovery, Cherry OS, and Transformation Record routes.
- `https://cherrypua.vercel.app/src/styles.css` → HTTP 200, expected responsive WorldStage visual system.
- Vercel runtime error query after deployment → no runtime errors found in the selected post-launch time range.

## Verification state

- **Documented:** yes.
- **Implemented:** yes, for the four signature prototype surfaces.
- **Locally/browser tested:** yes.
- **Deployed:** yes.
- **Production endpoint verified:** yes for production availability and deployed static assets.
- **Full production business integration verified:** no. CRM, calendar, database intake, participant systems, real AI, and private WorldStage data integrations are not active in this prototype.

## Git ↔ Vercel integration status

The production deployment was created by sending the exact committed repository files through the connected Vercel deployment action. The currently available Vercel connector exposes deployment/project reads but **does not expose a Git-repository-link mutation**. The resulting deployment metadata contains no Git commit/repository provenance.

Therefore:

- source is durably committed in `banataosystems/nlp`;
- production is deployed at `cherrypua.vercel.app`;
- automatic Git-push → Vercel continuous deployment is **not yet verified/established** and must not be claimed as connected.

## Rollback evidence

The source history is preserved in GitHub through the commit chain above. The deployed version is identified exactly by Vercel deployment ID `dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s`. A future release should record the prior production deployment before promotion so rollback can be explicitly tested rather than merely inferred from source history.

## Pandora Memory status

Pandora Memory could not be synchronized from this conversation because the ProjectOS developer MCP endpoint returned:

`FORBIDDEN: This conversation does not support developer MCPs`

This is an explicit canonical-state blocker. The GitHub blueprint, implementation status, and this deployment manifest are the durable fallback evidence until Pandora connectivity is restored.
