# Phase 4 — Cherry Daily fixed-vocabulary decision rationale

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository:** `banataosystems/nlp`  
**Active line:** `redesign/mobile-first-v2` / PR #1

## Purpose

Add one small product-facing owner-judgment layer to Cherry Daily without introducing client text, provider bindings, external writes, approval authority, confidential intake, spending, or production-release authority.

Cherry can now distinguish why a demo judgment item is in its current state using only three allowlisted reasons:

- `ready` → **Ready**
- `needs-context` → **Needs context**
- `can-wait` → **Can wait**

There is intentionally no free-text reason field.

## Implemented boundary

The active branch adds:

- `src/cherry-decision-rationale.js` — local-only rationale state, sanitization, deterministic state-to-rationale defaults, reset behavior, and DOM enhancement;
- `src/cherry-decision-rationale.css` — phone-first/safe-width rationale controls with minimum touch targets;
- `tests/cherry-decision-rationale.spec.mjs` — focused mobile, persistence, tamper-sanitization, zero-write and deterministic-mapping coverage;
- `index.html` wiring for the rationale module and stylesheet;
- `package.json` Phase 4 gate integration so the new focused tests are mandatory rather than optional.

## Data model

The rationale lens uses one separate browser-local demo key:

`worldstage.cherry.daily.rationale.demo.v1`

The only durable shape accepted by the module is:

```json
{
  "01": "ready | needs-context | can-wait",
  "02": "ready | needs-context | can-wait",
  "03": "ready | needs-context | can-wait"
}
```

Arbitrary properties, invalid enum values, authority-like values, and injected text are rejected from the rendered/persisted shape. When malformed stored material is encountered, the module replaces it with the exact allowlisted three-item structure instead of rendering or carrying the extra material forward.

## Owner interaction

Each Cherry Daily demo judgment card now has two distinct layers:

1. **Decision state** — Needs Cherry / Prepared / Parked.
2. **Why this state** — Ready / Needs context / Can wait.

Changing the decision state supplies a deterministic safe default rationale:

- Needs Cherry → Needs context
- Prepared → Ready
- Parked → Can wait

Cherry may then choose one of the same three fixed rationale values. No arbitrary text can be entered.

## Safety and privacy boundary

This slice:

- reads no Discovery form values;
- reads no CRM, email, calendar, database, Pandora, provider, client, participant or private engagement record;
- accepts no free-text rationale;
- performs no POST/PUT/PATCH/DELETE request;
- sends no client communication;
- creates no calendar event;
- writes no evidence or audit claim;
- grants no approval, intake activation, production-release or provider authority;
- remains local synthetic/demo state only.

The rationale key is cleared by Cherry Daily reset and by the synthetic engagement reset path.

## Proof-state separation

### Documented

Yes — this record defines the product behavior, data boundary, safety contract, test intent, non-claims and roadmap transition.

### Implemented

Yes — source, styles, wiring and focused tests are present on the active branch.

### Tested

Pending exact-head GitHub Actions verification after the final documentation/roadmap commit. A passing earlier head must not be used as proof for this new rationale implementation.

### Preview deployed

Pending exact-source Vercel preview verification for the final implementation head.

### Live staging

No. No real WorldStage staging provider, database, authentication, RLS, backup/restore or kill-switch environment is bound.

### Production verified / released

No. The preserved production baseline remains separate and this branch is not authorized for production promotion.

## Roadmap transition

This completes the planned **structured synthetic decision-rationale lens** product slice at the implemented/documented level.

After exact-head CI and preview provenance close, the next safe product-facing slice is to expose the selected fixed rationale in the existing Cherry Owner Summary / Owner Handoff so the owner can see not only the next synthetic action but the allowlisted reason behind it. That follow-on must remain read-only/local-demo-only and must not introduce free text or external/provider writes.

## Explicit non-claims

- This is not a real client decision record.
- The rationale is not source evidence, legal reasoning, an approval, a commitment, an instruction to staff, or a client communication.
- No real WorldStage data is represented by these values.
- Browser-local persistence is not a production database or audit ledger.
- A passing CI run or READY preview would prove implementation/deployability only, not live staging or production readiness.
