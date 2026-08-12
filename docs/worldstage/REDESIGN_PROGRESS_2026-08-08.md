# WorldStage redesign progress — 2026-08-08

## Branch
`redesign/mobile-first-v2`

## Pull request
PR #1 — `WorldStage mobile-first recovery v2` (draft)

## Release posture
The existing `main` branch and `https://cherrypua.vercel.app` remain intentionally unchanged. They are preserved as rollback/failure evidence from the first mobile release. The v2 branch is **not production-approved** until a real-device visual review passes.

## What changed

### Phase 0 — recovery / rollback preservation
- Preserved existing production as the failed-mobile baseline.
- Committed the 10/10 mobile-first redesign master plan.
- Moved redesign work to a dedicated branch and draft PR.

### Phase 1 — mobile foundation
- Replaced the broken mobile navigation composition with a true top-layer full-screen menu.
- Removed mobile dependence on `mix-blend-mode` for critical navigation readability.
- Added safe-area handling and `svh` / `dvh` / `visualViewport` support.
- Added body-level horizontal-overflow protections.
- Rebuilt the hero for phone composition rather than shrinking desktop.
- Reduced cinematic vertical budgets on mobile.
- Made Discovery keyboard-aware.
- Constrained Cherry OS and Transformation Record to phone width.
- Added reduced-motion behavior, Escape handling, menu lock, and focus controls.

### Phase 2 — mobile art direction
- Tightened FIRE into four readable human chapters.
- Recomposed Cherry's editorial section for mobile sequencing.
- Reworked Evidence into a narrative mobile layout.
- Added five WorldStage solution paths: Team Building, Culture Development, Learning & Development, Keynotes & Motivation, and Fire University.
- Added a mobile `What we heard` trigger and bounded Transformation Brief sheet.
- Added modal focus management and additional phone-scale finale/spacing refinements.

### Phase 3 — production-shaped Discovery
- Preserved the source-aware five-question `What We Heard` conversation.
- Added practical routing context after discovery: organization, website, contact, role, professional email, optional phone, possible experience, timing, delivery mode, location, and practical notes.
- Added explicit permission before preparing a handoff.
- Draft persists in browser local storage under `worldstage.discovery.context.v2`.
- No automatic network submission exists in this branch.
- Final handoff is user-controlled and opens the visitor's email client with the supplied brief/context.
- Explicitly states that client-supplied information is not a WorldStage diagnosis.

### Phase 4 — Cherry OS provenance + The Room
- Wired the previously inert `View sources` action.
- Added a source/provenance drawer that explicitly states no private CRM/calendar/email/Pandora/client source is connected.
- Added `The Room` 60-second briefing pattern behind `Review context`.
- Separates demo facts, system suggestions, and questions requiring verified evidence.
- Added fail-closed production gates for authentication, authorization, auditability, and source-level privacy restrictions.
- Added keyboard/Escape/focus handling and mobile touch-target rules.

### Phase 5 — Transformation Record governance
- Added a mobile summary for organization, stage, owner, and privacy state.
- Added an Evidence Governance drawer preserving the states: Anecdotal, Observed, Measured, Client-confirmed, Externally verified, and Publicly approved.
- Added a Privacy Gate drawer covering participant responses, Discovery artifacts, sponsor visibility, AI access, and public-content permissions.
- Real client/participant information remains blocked until authentication, organization isolation, RBAC, audit logging, retention, and approved privacy notices exist.

### Phase 6 — content governance
- Added `docs/worldstage/CONTENT_RELEASE_MANIFEST.md`.
- Owner-approved Cherry media, current biography/positioning, program details, client/logo rights, and case-study evidence are explicitly tracked as production gates.
- The abstract `CA` treatment remains a placeholder, not approved production media.
- Missing facts/assets cannot silently become production content.

### Phase 7 — hardening
- Added Vercel response policies: CSP, frame denial, MIME sniff protection, referrer policy, permissions policy, COOP/CORP.
- Camera/geolocation/payment browser capabilities are denied; microphone is scoped to self for the optional voice experience.
- Added release tests checking for obvious secrets, third-party replay/analytics code on restricted surfaces, same-origin application scripts, response-policy requirements, and a conservative static source-size budget.
- CI concurrency cancels superseded branch runs so evidence maps to the latest source instead of stale commits.

## Automated verification

Workflow: `WorldStage mobile contract`

### Required mobile widths
- 320
- 360
- 375
- 390
- 412
- 430

### Core routes
- home
- discovery
- cockpit
- client

### Latest exact-source gate
Verified code head: `40629f5634f4c60157c25475283559fe0060fa53`
Workflow run: `31264372119`
Result: **PASS**

Passed stages:
1. dependency / Chromium setup;
2. six-width mobile structural contract;
3. Phase 3 Discovery contract;
4. Phase 4 Cherry OS provenance / Room contract;
5. Phase 5 Transformation Record governance contract;
6. release security/privacy/source-budget contract;
7. mobile visual evidence generation;
8. evidence artifact upload.

### Mobile contract proves
- no unexpected document-level horizontal overflow on required routes/widths;
- mobile menu covers the viewport and locks the underlying page;
- Escape closes the menu;
- Discovery composer survives contracted viewport height;
- Transformation Brief sheet is bounded and dismissible;
- five solution paths fit without document overflow;
- critical controls meet the 44px minimum touch target.

### Discovery contract proves
- practical context appears only after the conceptual `What We Heard` sequence completes;
- handoff remains disabled until organization, contact name, valid email, and permission exist;
- practical context persists locally;
- route re-render restores the local draft in-session.

### Cherry OS contract proves
- provenance drawer is explicitly demo-only;
- no private client source is represented as connected;
- `The Room` briefing labels demo data and source-required questions;
- modal close action is touch-safe and Escape-safe.

### Transformation Record contract proves
- mobile summary stays inside viewport;
- evidence states remain distinct;
- privacy gate is fail-closed before real client/participant data;
- governance close action meets touch target.

### Release contract proves
- expected Vercel security headers exist in configuration;
- application scripts are same-origin;
- no obvious production secrets are present in the tested source set;
- restricted surfaces do not initialize PostHog/Hotjar/FullStory/Clarity session replay in this branch;
- static source stays below the defined 500 KB source budget;
- public homepage does not contain the previously invented private-client prototype language.

## Visual evidence
Latest artifact for the verified code head:
- Artifact ID: `9023710609`
- Name: `worldstage-mobile-v2-evidence`
- Size: `1,098,015 bytes`
- SHA-256: `fb87a9c5f8c84e5710d7b6b3d0c7e7f52839f991a5f7645f8b6d330aef429631`
- Captures: Homepage, Discovery, Cherry OS, Transformation Record at 390 × 844 plus PDF review sheet.

Automated screenshot generation passing is **not** equivalent to real-device visual approval.

## Current lifecycle state
- Documented: **yes**.
- Implemented: **yes, Phase 0–7 branch scope described above**.
- Automated browser tested: **yes, passing on exact verified source head above**.
- Visual evidence generated: **yes**.
- Real-device visually verified: **no**.
- Merged to `main`: **no**.
- Deployed as v2 production: **no**.
- Production-verified as v2: **no**.

## Why production remains unchanged
The previous release proved that HTTP 200, Vercel READY, DOM assertions, and static screenshots are insufficient evidence of a premium real-phone experience. The v2 branch therefore remains a draft PR until a real phone confirms navigation, hero composition, chapter rhythm, on-screen keyboard behavior, Cherry OS, Transformation Record, and the new drawers/Discovery flow.

## Open blockers / owner gates
- Owner-approved authentic Cherry photography/video.
- Owner-approved Cherry biography/current positioning where public copy needs canonical wording.
- Owner-approved program catalog/details.
- Approved client imagery/logo rights and case-study evidence.
- Secure server-side Discovery intake is not implemented; current handoff remains user-controlled email.
- Authentication / authorization / source connectors are not implemented for real Cherry OS or Transformation Record data.
- Pandora Memory connector remains unavailable from this conversation, so canonical Memory synchronization is blocked.
- Automatic Git → Vercel project linkage remains unproven.
- Isolated Vercel branch-preview creation is blocked by the available Vercel connector's URL/import limitations.

## Highest-value next action
Obtain a real-device review surface for this exact v2 source without replacing `cherrypua.vercel.app`; record a phone walkthrough; correct any visual defects found; only then consider merge / controlled deployment. If preview transport remains unavailable, preserve production and do not weaken the visual gate.
