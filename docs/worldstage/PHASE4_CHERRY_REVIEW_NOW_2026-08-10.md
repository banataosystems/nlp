# WorldStage / Cherry — Phase 4 Review now owner focus

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository:** `banataosystems/nlp`  
**Active line:** `redesign/mobile-first-v2` / PR #1

## Purpose

Turn the already deterministic synthetic priority judgment into one compact phone action: **Review now**. The action must keep Cherry on the same cockpit surface and focus only the existing local-demo judgment context for the selected priority item.

## Implemented behavior

- Reads only the three allowlisted local demo judgment states: `Needs Cherry`, `Prepared`, `Parked`.
- Reads only the three allowlisted local rationale values: `Ready`, `Needs context`, `Can wait`.
- Uses the existing deterministic order: `Needs Cherry` first, then `Prepared`, then `Parked`; ties use the lowest fixed item number.
- Injects one compact `Review now` card immediately after the existing Owner Summary priority card.
- On activation, scrolls to the existing matching judgment card on the current phone surface and focuses its current local-demo state control.
- Announces the exact allowlisted item/state/rationale in an `aria-live` status line.
- Does not route away from the cockpit, create a new judgment, add free text, infer urgency, calculate a score, or read a private source.

## Safety boundary

This slice is synthetic/local-only. It performs no POST, PUT, PATCH, or DELETE request; no CRM/email/calendar/database/provider write; no confidential intake; no production access; no approval; and no release action. Invalid or injected storage fields are ignored and cannot render into the owner card.

## Durable source and test surface

- `src/cherry-review-now.js`
- `tests/cherry-review-now.spec.mjs`
- `index.html`
- `package.json` Phase 4 mandatory test gate

## Required proof

The slice is not considered tested merely because source exists. Exact-head proof requires the mandatory WorldStage mobile contract to pass with the new Playwright coverage, including mobile width, same-surface focus, deterministic priority refresh, allowlisted rationale fallback, injected-field rejection, and zero network writes. Preview deployment must independently resolve to the same exact source SHA. Production remains separately gated.

## Non-claims

- No real client decision is represented.
- No private WorldStage source is queried.
- No AI ranking or urgency inference is performed.
- No live staging environment is created.
- No production release is authorized.
- No owner/security approval is inferred from this prototype interaction.
