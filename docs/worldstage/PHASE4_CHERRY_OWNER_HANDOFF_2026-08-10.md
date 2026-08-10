# Phase 4 — Cherry Owner Handoff

**Date:** 2026-08-10  
**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Repository line:** `banataosystems/nlp` → `redesign/mobile-first-v2` / PR #1

## Purpose

Turn the Cherry Owner Summary's deterministic next action into the minimum phone-first context Cherry needs to make a judgment without exposing or inventing real client information.

This slice remains a **local synthetic prototype**. It is not a client briefing, CRM record, calendar task, engagement approval, evidence record, confidential intake path, production action or release mechanism.

## Implemented interaction

From the Cherry Owner Summary, `Open 60-second brief` opens a focused owner handoff surface containing exactly four decision fields derived from sanitized local demo state:

1. **Situation** — where the fixed synthetic engagement currently sits.
2. **Cherry decides** — the one decision appropriate to that state.
3. **If no decision** — the fail-safe consequence of leaving the demo unchanged.
4. **Boundary** — what the briefing does not read, claim or change.

The handoff then offers one safe navigation action to the already-existing prototype route for the current phase. Navigation is hash-only and does not create a network write.

## State and privacy contract

The handoff re-reads the same sanitized local demo state used by the Owner Summary:

- `worldstage.synthetic.engagement.flow.v1` → schema version + sequential engagement booleans only;
- `worldstage.cherry.daily.demo.v1` → allowlisted states for fixed demo items `01`, `02`, `03` only;
- `worldstage.synthetic.sustainment.plan.v1` → schema version + sequential 7 / 30 / 90 booleans only.

Unknown keys, injected text, skipped/tampered progression and private-looking material are not rendered into the handoff. No Discovery form value, client identifier, contact detail, private source, CRM content, email, calendar content, uploaded file or provider record is read by this component.

## Mobile/accessibility contract

- phone-first bottom-sheet composition at small widths;
- safe-area aware placement;
- body scroll locked while the handoff is open;
- explicit close control with a minimum touch target;
- Escape closes the handoff;
- keyboard focus is trapped within the open dialog;
- closing restores focus to the opener;
- opening a next step closes the handoff before changing the hash route;
- no body-level horizontal overflow is permitted.

## Safety contract

The handoff must never:

- POST, PUT, PATCH or DELETE;
- send client communication;
- schedule a meeting, reminder or task;
- approve an engagement or legal/business commitment;
- write to a database, CRM, analytics/evidence store or external provider;
- activate confidential intake;
- claim that demo content is verified client truth;
- authorize live staging or production release.

If Cherry takes no action, the synthetic state remains unchanged and no external system changes.

## Automated proof contract

`tests/cherry-owner-summary.spec.mjs` covers the handoff on a 390×844 touch/mobile viewport and requires:

- the correct briefing for the default pre-Discovery state;
- the correct briefing for sanitized sequential sustainment state;
- injected extra fields never appear;
- no mutating network request occurs;
- dialog focus starts on Close;
- closing restores focus to the opener;
- Escape closes the dialog;
- next-step navigation uses only an allowlisted local hash route;
- page width remains within the mobile viewport.

These authored tests become **tested evidence only when the exact source head passes the required GitHub Actions chain**. A READY preview alone is not test proof and neither test success nor preview readiness authorizes live staging or production.

## Production gate remains unchanged

Real owner handoffs require authenticated and authorized source-linked records, privacy restrictions, provenance, auditability and owner-approved content. Those gates remain separate from this synthetic UI pattern. No live provider or confidential WorldStage data is introduced by this slice.
