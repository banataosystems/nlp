# WorldStage 10/10 Mobile-First Redesign Master Plan

**Project:** WorldStage International / Cherry Africa business-adaptive operating system
**Repository:** `banataosystems/nlp`
**Working branch:** `redesign/mobile-first-v2`
**Baseline:** 2026-08-08
**Current state:** implemented prototype → deployed → technically reachable → real-device visual verification failed → not production-approved.

## 1. Objective

We are not merely making `cherrypua.vercel.app` prettier. We are rebuilding the defining product surfaces so a serious corporate decision-maker immediately understands that WorldStage listens before it designs, Cherry Africa is a credible transformation authority, interventions are bespoke, evidence and sustainment matter, and the digital system could not belong to another training company simply by changing the logo.

The core operating language remains:

**Client Dream → Current Reality → Discovery → Design → Fire-Up → Evidence → Sustain → Renew**

The target creative system is **The Human Transformation Stage**: authentic human imagery + editorial typography + institutional information design + restrained ember/fire-derived energy.

## 2. Real-device failures that must be fixed

### Mobile navigation
- Menu must render in its own top-level layer.
- Remove reliance on `mix-blend-mode` for critical readability.
- Lock background scrolling when open.
- Trap focus and support Escape/Android-back behavior where possible.
- Preserve underlying scroll position.
- Never allow menu labels to visually collide with hero or page copy.

### Horizontal overflow
- No body-level horizontal scrolling at 320/360/375/390/412/430px.
- All flex/grid children must be shrink-safe (`min-width:0`).
- Desktop rails must become mobile-native chapter navigation.
- Automated test must fail if document scroll width exceeds viewport width except for explicitly approved contained carousels.

### Hero
- Recompose for phones rather than shrinking desktop.
- Stable entry height using `svh`/`dvh` appropriately.
- One primary action only.
- No fragile oversized typography that collides with browser chrome or navigation.

### Discovery
- One meaningful question at a time.
- Keyboard-aware composer using `visualViewport` where available.
- Live brief becomes a bottom sheet / separate mobile view rather than fixed right rail.
- Draft persistence.
- Voice is optional enhancement, never the only input path.

### Cinematic spacing
- Every chapter gets a mobile vertical budget.
- Motion must be tied to meaningful progression and have an equally intentional reduced-motion path.
- No long empty stretches merely to feel cinematic.

### FIRE
- Rebuild as four concise human chapters: Fusion, Inspiration, Revolution, Evidence.
- Real WorldStage imagery should eventually replace decorative effects.

### Cherry editorial section
- Abstract placeholder remains temporary only.
- Production requires owner-approved documentary imagery of Cherry listening, facilitating, speaking, preparing, and interacting with real rooms.

### Provenance labels
- Public site: elegant source footnotes / drawers.
- Discovery: “You said”, “Imported”, “Draft summary”, “Needs clarification”.
- Private OS: full source/owner/date/approval/restriction metadata.

### Cherry OS
- One priority at a time.
- Primary decision visible without scrolling through a long card.
- Verified facts and system suggestions must be visually distinct.

### Transformation Record
- Replace desktop side rail on phones with full-width narrative chapters.
- Summary → What We Heard → Designed → Happened → Changed → Next.

## 3. Five signature WorldStage interactions

1. **Living Transformation Map** — raw organizational language becomes structured signals, themes, current reality, desired reality, unresolved questions, and approved direction.
2. **What We Heard** — conversational discovery where each statement preserves provenance and confidence.
3. **The Room** — 60-second pre-engagement briefing for Cherry/facilitators.
4. **What Remained** — immediate reflection plus 7/30/90-day sustainment and evidence states.
5. **Speak to WorldStage** — voice capture proposes actions but never silently mutates canonical business records.

## 4. Rebuild of the four defining surfaces

### Homepage
1. Arrival — one message, one action, authentic media when supplied.
2. Reality — “What people say / do not say / leadership sees / the room feels.”
3. Living Transformation Map — Listen → Understand → Design → Move → Measure → Sustain.
4. FIRE — four concise chapters.
5. Cherry — editorial documentary treatment.
6. Evidence — What we heard → designed → happened → changed → next.
7. Solution paths — Team Building, Culture, L&D, Keynotes, Fire University.
8. Discovery invitation.

### Discovery
Capture: organization, reason, current reality, observable signals, desired reality, people affected, constraints, possible experience, timing, contact/consent, review, submission.

Production later replaces `mailto:` with secure server-side validation, abuse controls, storage, consent version, idempotency, assignment, audit event, notification, and confirmation.

### Cherry OS
First screen: “Three things require your judgment.” One active item with type, person/org, why-now, verified facts, recommendation, sources, decision, and secondary actions. Add “The Room” briefing and a real voice review workflow before any real client data is connected.

### Transformation Record
Mobile begins with organization, current transformation, stage, owner, next commitment, risk/attention, and privacy classification. Then six narrative chapters. Evidence remains explicitly categorized as anecdotal / observed / measured / client-confirmed / externally verified / publicly approved.

## 5. Mobile engineering contract

Mandatory widths: **320, 360, 375, 390, 412, 430**.
Secondary widths: **600, 768, 1024, 1280, 1440, 1920**.

Rules:
- safe-area insets;
- `100svh` for stable entry screens;
- selective `100dvh` for dynamic app shells;
- never rely on `100vh` alone for critical phone composition;
- `min-width:0` for grid/flex children;
- media stays within container width;
- minimum 44×44 CSS-pixel touch targets;
- swipe always has button/keyboard alternatives;
- no critical text depends on blend modes;
- motion never required for comprehension;
- Discovery handles on-screen keyboard intentionally;
- no essential 8px body text.

## 6. Required WorldStage content for true production quality

### Cherry package
Landscape hero image, vertical portrait, speaking/facilitating/listening/conversation/preparation imagery, short clean video clips, approved biography/current positioning/speaking topics/books/media, optional authentic signature.

### Programs
Official title, audience, challenge, desired outcome, duration, format, modules, facilitators, activities, safety requirements, approved imagery, evidence, follow-up.

### Clients
Logo permission, challenge, discovery, intervention, outcome, evidence source/method, approval date, and marketing-use restrictions.

Never invent missing metrics, testimonials, partnerships, awards, logos, or facts.

## 7. Implementation phases

### Phase 0 — Freeze and preserve evidence
- preserve current commit/deployment as failed-mobile baseline;
- retain recording and representative frames in the verification history where possible;
- create `redesign/mobile-first-v2`;
- preserve rollback identifiers;
- stop claiming the current production version as visually approved.

### Phase 1 — Mobile foundation
- replace mobile navigation architecture;
- eliminate body-level overflow;
- build viewport/safe-area primitives;
- mobile typography and spacing tokens;
- keyboard-aware shell;
- overflow assertions;
- reduced-motion foundation.

**Gate:** skeleton/core routes pass navigation, focus, viewport and overflow checks at all six mobile widths.

### Phase 2 — Homepage recomposition
Rebuild hero, Reality, Living Transformation Map, FIRE, Cherry content-ready section, Evidence, solution paths, final CTA.

**Gate:** 360/390/430 render and real-device review pass.

### Phase 3 — Discovery
One-question conversation, persistence, brief bottom sheet, provenance states, business/contact questions, secure submission later, consent/audit/notification, Android/iOS keyboard testing.

### Phase 4 — Cherry OS
One-card judgment queue, source drawer, The Room, accessible navigation, voice review workflow, authentication/authorization before real data.

### Phase 5 — Transformation Record
Full-width mobile chapters, evidence/privacy drawers, privacy-safe participant patterns, desktop expansion after mobile approval.

### Phase 6 — Authentic content
Approved media, biographies, program descriptions, client assets/rights, alt text/captions/transcripts, remove developer placeholders.

### Phase 7 — Hardening
Visual regression, accessibility, performance, privacy, security, browser compatibility, real-device testing, content review.

### Phase 8 — Controlled release
Exact Git SHA, preview/prod deployment evidence, smoke tests, low-risk real Discovery submission, rollback proof, alias promotion only after gates pass.

## 8. 100-point quality score

- Mobile composition/usability — 20
- Brand distinctiveness — 15
- Authentic content/art direction — 15
- Discovery usefulness — 10
- Cherry OS clarity — 10
- Trust/evidence — 10
- Accessibility — 8
- Performance — 5
- Privacy/security — 5
- Release/rollback evidence — 2

Target: **95/100+** with no critical-category failure.

Automatic failure regardless of score: navigation overlap, unexpected horizontal scrolling, unreadable text, fake metric/claim, sensitive-data exposure, inaccessible primary action, broken Discovery submission, deployment not traceable to source, missing rollback proof, or failed real-device verification.

## 9. Definition of done

A release is complete only when exact commit is recorded, automated tests pass, required real-device checks pass, navigation and overflow pass, Discovery works end-to-end, accessibility/performance/content/privacy/security gates pass, production is re-recorded on a real phone, rollback is tested, and owner approval is recorded.

## 10. Current state and next autonomous action

**Current phase:** failed-verification recovery / redesign implementation.

**Done:** research, blueprint, first prototype, deployment, real-device failure diagnosis, comprehensive redesign roadmap.

**Blocked:** authentic owner-approved media; complete case-study evidence; Pandora Memory connector currently unavailable from this conversation; automatic Git→Vercel linkage not yet proven.

**Next autonomous action:** Phase 1 only — navigation, viewport, overflow, safe-area, mobile typography, reduced-motion, and keyboard foundation before higher-level visual redesign.