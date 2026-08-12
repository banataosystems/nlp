# WorldStage / Cherry — Phase 4 Cherry Daily owner workflow

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Active line:** `redesign/mobile-first-v2` / PR #1

## Why this milestone exists

The prior Phase 4 Cherry OS surface showed a judgment queue, source-map pattern and 60-second Room briefing, but it did not yet let Cherry operate the queue as a persistent owner workflow. This milestone moves the prototype from passive demonstration toward a phone-first operating pattern without binding real client systems or data.

## Implemented behavior

The Cherry OS judgment queue now includes **Cherry Daily**, a local-only owner workflow with three explicit demo states:

- `Needs Cherry` — the item still needs owner judgment;
- `Prepared` — the item is ready for the next human step;
- `Parked` — the item can wait without disappearing.

Each of the three existing demo judgment cards can be moved between those states. The cockpit shows live counts for each state, persists the demo state in browser `localStorage`, restores it after refresh, and includes a reset control.

The interface is deliberately explicit that these are **DEMO states**. A state change does not send a message, modify a CRM, write to email/calendar, approve a proposal, change a client record, or touch production.

## Product intent

This is the first owner-operable Phase 4 slice that reflects the intended WorldStage principle: the system should adapt to Cherry's day rather than require Cherry to learn a back-office system. The owner should be able to open one phone screen, see what actually needs judgment, make a lightweight decision, and move on.

Future provider-bound versions can map verified WorldStage records into this same workflow, but only after the existing authentication, authorization, provenance, privacy and staging gates pass.

## Safety and data boundary

- No real WorldStage client or participant data is introduced.
- No network write is performed by Cherry Daily.
- Only the three demo item IDs and their demo state strings are stored locally.
- No credentials, contact details, message content, private notes or evidence blobs are persisted by this feature.
- Reset removes the local demo state only.
- Existing source-map and Room briefing provenance warnings remain unchanged.
- Existing secure-intake, staging and production gates remain fail-closed.

## Verification added

`tests/cockpit-phase4.spec.mjs` now verifies on a 390 × 844 mobile viewport that:

1. Cherry Daily renders inside Cherry OS;
2. the no-external-write warning is visible;
3. initial counts are `3 / 0 / 0` for Needs Cherry / Prepared / Parked;
4. moving item `01` to Prepared updates counts and visible item state;
5. the exact demo state is stored locally and survives reload;
6. reset restores the initial state and states that no external system changed;
7. the added workflow does not introduce horizontal overflow.

## Proof-state separation

- **Documented:** yes — this file records product intent, implemented behavior, boundaries and proof requirements.
- **Implemented:** yes — `src/phase4-cockpit.js` and `src/phase4-cockpit.css` contain the owner workflow on the active branch.
- **Tested:** pending exact-current-head GitHub Actions proof after this documentation commit; authored Playwright coverage is not itself a PASS claim.
- **Preview deployed:** pending exact-current-head Vercel verification.
- **Live staging:** no.
- **Production verified/released:** no.

## Next proof action

Obtain an exact-current-head CI pass including Phase 4 mobile coverage, verify the resulting non-production Vercel preview provenance, then continue the next safe product slice: an end-to-end synthetic WorldStage engagement workflow that connects Discovery → owner judgment → Transformation Record without creating a real provider environment, using confidential data, or crossing production gates.
