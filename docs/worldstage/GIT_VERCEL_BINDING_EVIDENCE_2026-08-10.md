# WorldStage / Cherry — Git → Vercel preview binding evidence

**Date:** 2026-08-10  
**Repository:** `banataosystems/nlp`  
**Branch:** `redesign/mobile-first-v2`  
**PR:** #1  
**Vercel project:** `cherrypua` / `prj_ebP53cux8LAB18VFiKlgfP3ew2RH`

## Conclusion

Git → Vercel **preview deployment binding is now proven** for the active mobile-v2 branch.

This does not mean mobile-v2 is in production. Production remains the redeployed original baseline artifact.

## Exact proof

Vercel deployment:

- Deployment ID: `dpl_2VtuQnr9JV7hZuioNALtpXg3esBX`
- Deployment URL: `cherrypua-4uro3x1dq-mbanatao-dc676069.vercel.app`
- Branch alias: `cherrypua-git-redesign-mobile-first-v2-mbanatao-dc676069.vercel.app`
- State: `READY`
- Target: preview / non-production (`target: null`)
- Source: `git`
- Region: `iad1`

Vercel metadata records:

- GitHub org: `banataosystems`
- GitHub repo: `nlp`
- GitHub branch: `redesign/mobile-first-v2`
- GitHub PR: `1`
- Exact commit SHA: `80d0e1e28de421c0c52586b830ba205e599c9785`
- Commit message: `ci: smoke protected Vercel previews with authenticated CLI`
- GitHub repository ID: `1327299295`

Vercel build logs independently report:

`Cloning github.com/banataosystems/nlp (Branch: redesign/mobile-first-v2, Commit: 80d0e1e)`

and:

- Vercel CLI `58.1.0`
- build completed successfully
- deployment completed successfully

GitHub also reports successful Vercel commit statuses for commit `80d0e1e28de421c0c52586b830ba205e599c9785`, including the deployment inspector target.

## Observed sequence

Multiple recent pushes to `redesign/mobile-first-v2` generated READY Vercel previews with exact Git metadata, including commits:

- `d7d6793ac036cd2dc2e4798b11ed6ab29505ac00`
- `149e2b8766bffd917ba64bc4c265708284c5ba95`
- `35976ff767a5dd82b3e1d045346c6180e85f4d47`
- `57eb472b9c9b5c5a5c93b2ec97fdd29968400b26`
- `80d0e1e28de421c0c52586b830ba205e599c9785`

This demonstrates repeatable branch-push → preview-deployment behavior rather than a one-off manual deploy.

## Protection boundary

The preview branch alias is protected by Vercel Authentication. Direct unauthenticated fetches return an authentication redirect. Protection was preserved; it was not disabled merely to simplify verification.

Because the preview is protected, current connector-side HTTP smoke could not directly read the preview asset body. However, exact Git provenance and successful Vercel build/deployment metadata are independently verified.

The repository also now contains a manual traceable release workflow at:

`.github/workflows/vercel-traceable-release.yml`

That workflow is `workflow_dispatch` only. It:

1. requires an exact release ref or workflow ref;
2. records source commit and tree;
3. reruns mobile, Discovery, Cherry OS, Transformation Record, release/security and visual tests;
4. fails closed if `VERCEL_TOKEN` is absent;
5. requires the exact literal `DEPLOY_CHERRY_PRODUCTION` before any production command can execute;
6. builds using Vercel CLI;
7. deploys the prebuilt output;
8. uses authenticated `vercel curl` for protected preview smoke;
9. records source/deployment provenance as an artifact.

The manual workflow has been committed but **has not been dispatched** in this work session.

## Production remains separate

Current production deployment:

`dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`

is still a Vercel `redeploy` of original baseline deployment:

`dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s`

Therefore:

- preview Git binding: **PROVEN**;
- mobile-v2 preview deployment: **PROVEN / READY**;
- mobile-v2 production deployment: **NOT PERFORMED**;
- exact Git → production release proof for mobile-v2: **NOT YET APPLICABLE**;
- production promotion remains gated.

## Next release-proof step

Before production promotion, perform a real-device review against an exact protected preview deployment. Only after that and the remaining owner/privacy/content gates are satisfied should the traceable release path be used for production.

## Pandora Memory status

Pandora Memory synchronization was not available while this evidence was recorded. This repository document is a durable fallback evidence record only until canonical synchronization is restored.
