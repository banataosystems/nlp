# WorldStage mobile-first v2 — release gate

**Branch:** `redesign/mobile-first-v2`  
**Pull request:** #1  
**Latest verified product-code head:** `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1`  
**Verification workflow:** `31330426696` (run #113)  
**Result:** PASS  
**Current production:** baseline redeploy `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1` — **not mobile-v2**

## Passed automated gates on product-code head `be41775...`

- required mobile widths: 320 / 360 / 375 / 390 / 412 / 430;
- no unexpected document overflow on all four core routes;
- full-screen mobile navigation and page lock;
- Escape close behavior;
- non-confidential Discovery privacy boundary before narrative capture;
- contracted viewport / mobile keyboard Discovery composer behavior;
- bounded `What We Heard` brief sheet;
- five WorldStage solution paths;
- 44px minimum critical touch controls;
- Phase 3 Discovery routing context, local draft, consent gate and explicit user-controlled handoff;
- Phase 4 Cherry OS source/provenance and `The Room` review surfaces;
- Cherry judgment-card non-shrink/full-deck regression across all six phone widths;
- Phase 5 Transformation Record evidence and privacy governance;
- static release security/privacy checks;
- visual evidence capture and artifact upload.

## Latest visual artifact

- Artifact ID: `9042773333`
- Artifact name: `worldstage-mobile-v2-evidence`
- SHA-256: `09d1a4945b38d9a8c5bde38456bdca8ee64b7c342e950674b6625cf4eac3989a`
- Source head: `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1`
- Includes 390×844 captures for Homepage, Discovery privacy boundary, acknowledged Discovery, Cherry OS, Transformation Record, plus PDF review sheet.

## Human browser-evidence review

The 390px Cherry OS evidence was manually inspected after automated verification. A prior visual defect—multiple judgment cards collapsing into one viewport and narrowing the active headline—was found, repaired, regression-tested, and re-reviewed. The latest evidence shows one readable full-width judgment page with clear fact/suggestion sections and usable actions.

This is browser-evidence review, not owner approval and not physical Android/iOS device approval.

## Current production provenance

At 2026-08-10 03:16:32 Asia/Manila, Vercel created production deployment:

`dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`

Vercel reports:

- source: `redeploy`;
- action: `redeploy`;
- original deployment: `dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s`.

The production alias continues to serve the original baseline runtime. It does not contain the mobile-v2 modules and is not evidence that PR #1 has been released. Post-redeploy runtime-error aggregation returned no errors in the checked window.

See `docs/worldstage/PRODUCTION_REDEPLOY_EVIDENCE_2026-08-10.md`.

## Branch/base reconciliation

GitHub currently reports this branch as ahead of `main` and one historical commit behind. The only missing-main-history commit added `PROJECT_CUSTOM_INSTRUCTION.md`. The file's Git blob SHA is identical on both branches:

`542df042d12344e48cd43c1b05f0cc645e125a38`

Therefore there is no missing instruction content. Do not create a synthetic merge solely to change the ahead/behind counter unless normal merge/rebase preparation later requires it.

## Not yet satisfied

- Cherry/WorldStage owner validation of real business terminology, workflow, roles and judgment boundaries;
- real-device visual acceptance of v2;
- Android/iOS keyboard and on-device walkthrough;
- owner-approved Cherry media;
- owner-approved canonical public content and client rights/evidence;
- secure server-side Discovery intake for confidential material;
- real authentication / authorization / source connectors for Cherry OS and Transformation Record;
- Pandora Memory synchronization or explicit temporary governance exception;
- proven automatic Git → Vercel connection or another exact source-to-deployment release mechanism;
- traceable v2 preview/production deployment;
- v2 production smoke, rollback exercise, and real-phone post-deploy verification.

## Promotion rule

Do **not** merge or replace `https://cherrypua.vercel.app` solely because CI is green. Promotion requires:

1. owner/business-truth gate where required;
2. exact candidate source identified;
3. real-device walkthrough of that exact source;
4. content/privacy/security gates satisfied;
5. traceable source → deployment provenance;
6. recorded rollback target and procedure;
7. post-deploy production + real-phone verification.

## Rollback

Current production baseline redeploy `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1` derives from original baseline `dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s`. Mobile-v2 has not replaced production, so no mobile-v2 rollback action is currently required.
