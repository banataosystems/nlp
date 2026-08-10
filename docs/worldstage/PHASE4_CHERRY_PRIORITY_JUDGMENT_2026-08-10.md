# Phase 4 — Cherry Owner Summary deterministic priority judgment

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa  
**Active line:** `redesign/mobile-first-v2` / PR #1

## Purpose

Make the phone-first Cherry Owner Summary identify one synthetic judgment item as the immediate priority without introducing private data, scoring, AI ranking, free text, or an external action surface.

## Priority rule

The priority is derived only from the three existing fixed local-demo judgment items (`01`, `02`, `03`) and their already-allowlisted states:

1. `Needs Cherry`
2. `Prepared`
3. `Parked`

Within the same state, the lowest fixed item number wins. The selected item also displays its existing fixed rationale (`Ready`, `Needs context`, or `Can wait`).

There is no numerical score, model inference, hidden weighting, client value estimate, urgency claim, or private-source lookup.

## Implemented behavior

`src/cherry-owner-summary.js` now:

- retains the sanitized per-item Cherry Daily states while computing summary counts;
- computes one deterministic priority item from only the fixed three-item local state;
- pairs that item with only its sanitized allowlisted rationale;
- renders `PRIORITY JUDGMENT · SYNTHETIC` in the Owner Summary;
- states the exact deterministic priority rule in the phone view;
- recomputes through the existing owner-summary signature when local demo state changes.

## Safety boundary

This slice is local synthetic presentation only. It does not:

- inspect client data, messages, documents, contacts, calendars, CRM or private sources;
- infer commercial value, risk, legal significance, urgency, emotion, intent or relationship importance;
- add a free-text field;
- call an AI/model ranking service;
- perform POST/PUT/PATCH/DELETE requests;
- send, schedule, approve, persist externally, activate intake, promote a deployment, or authorize production.

## Verification contract

`tests/cherry-owner-summary.spec.mjs` requires:

- clean local demo state to select item `01` as `Needs Cherry · Needs context`;
- same-session rationale changes to update the priority reason without external writes;
- a mixed state (`01 Prepared`, `02 Parked`, `03 Needs Cherry`) to select item `03`;
- an invalid item `03` rationale to fail closed to `Needs context`;
- injected private/authority-looking fields and invalid rationale text to remain unrendered;
- existing owner handoff, privacy, focus, phone-width and zero network-write protections to remain intact.

## Proof-state rule

This record establishes documented + implemented state when committed. Tested state requires the mandatory exact-current-head GitHub Actions chain to pass. Preview-deployed state requires an exact-source READY non-production Vercel preview. Neither state authorizes live staging or production.

## Next safe product action

After exact-head verification, use this deterministic priority item to reduce Cherry's phone workflow to one compact `Review now` owner card that opens only the existing local demo judgment context, without adding real data or external writes.