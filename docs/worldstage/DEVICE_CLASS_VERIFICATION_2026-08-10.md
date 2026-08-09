# WorldStage / Cherry — Device-class verification

**Date:** 2026-08-10  
**Repository:** `banataosystems/nlp`  
**Branch:** `redesign/mobile-first-v2`  
**PR:** #1 — WorldStage mobile-first recovery v2

## Exact tested source

- Git SHA: `045f79b4ce6bbe291475c52ec0c1611d7329b5b5`
- GitHub Actions workflow: `WorldStage mobile contract`
- Run ID: `31333290359` (#157)
- Result: **PASS**
- Visual evidence artifact: `9043569646`
- Artifact digest: `sha256:cedc9089b26470949b0dafb4b05f0f22ff5144b8a1431d41ea151e80d5b5d32c`

## Device-class gate added

The mobile release contract now includes two distinct Playwright browser/device workers:

1. **iPhone 14-class / WebKit**
2. **Pixel 7-class / Chromium**

This is automated browser/device emulation, not a claim of testing on physical Apple or Android hardware.

## What the device contracts verify

For both device classes:

- all four core routes (`home`, `discovery`, `cockpit`, `client`) stay within the device viewport without unexpected horizontal document overflow;
- the Discovery privacy boundary fails closed before interaction;
- the privacy acknowledgement control meets the minimum touch-target contract;
- after acknowledgement, the Discovery composer remains usable and inside the viewport;
- Cherry OS contains three judgment records but exactly one active judgment page;
- judgment cards retain full deck layout width and `flex-shrink: 0`;
- the active Cherry OS headline remains readable rather than collapsing into a narrow column;
- the primary judgment action meets the minimum touch-target contract;
- a contracted viewport keeps the Discovery composer reachable as a browser-level proxy for keyboard/visible-viewport pressure.

## Full exact-head verification result

Run `31333290359` passed:

- existing 78-test six-width mobile contract;
- iPhone 14 / WebKit device-class contract;
- Pixel 7 / Chromium device-class contract;
- Discovery Phase 3 contract;
- Cherry OS Phase 4 contract;
- Transformation Record Phase 5 contract;
- release security/privacy contract;
- visual evidence generation;
- visual evidence artifact upload.

## Exact Git-linked Vercel preview

The same Git SHA produced READY Vercel preview deployment:

- deployment: `dpl_7VU6eskkiBT96ubukHoqckAHysAW`
- state: `READY`
- source: `git`
- GitHub org/repo: `banataosystems/nlp`
- branch: `redesign/mobile-first-v2`
- PR: `1`
- Git commit: `045f79b4ce6bbe291475c52ec0c1611d7329b5b5`
- branch alias: `cherrypua-git-redesign-mobile-first-v2-mbanatao-dc676069.vercel.app`

The preview remains behind Vercel Authentication.

## Gate interpretation

This closes the **browser device-class compatibility** proof gate for the tested source. It does **not** close:

- physical iPhone review;
- physical Android review;
- real software-keyboard/on-device browser behavior;
- owner/Cherry visual acceptance;
- production deployment or production verification.

Those states remain separate from automated device-class verification.

## Production boundary

No mobile-v2 production promotion was performed as part of this verification. Current production remains the separately documented baseline redeploy until an explicitly authorized, traceable mobile-v2 production release occurs.

## Governance note

Pandora Memory synchronization was not available while this evidence was recorded. This repository document is a durable fallback evidence record and must not be represented as already synchronized into Pandora Memory.
