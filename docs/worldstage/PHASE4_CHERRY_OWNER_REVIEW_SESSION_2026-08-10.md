# Phase 4 — Cherry 3-minute owner review session

**Project:** WorldStage International / Cherry Africa business-adaptive operating system  
**Active line:** `redesign/mobile-first-v2` / PR #1  
**Status at implementation commit:** implemented; exact-head CI/preview verification must be recorded separately before this slice is called tested or deployed.

## Purpose

Give Cherry one compact phone-first review pass over the three existing synthetic judgment items without creating a new data source, task system, scoring model, or external side effect.

## Product behavior

- A new `3-MINUTE OWNER REVIEW · SYNTHETIC` card appears beneath the existing Review now card on `#/cockpit`.
- The review starts from the same deterministic fixed order used elsewhere: `Needs Cherry` → `Prepared` → `Parked`, ties by lowest fixed item number.
- Each item can be reviewed at most once during the in-memory review session.
- After Cherry marks the current item's existing local-demo decision state, that item is counted as reviewed and the next unseen deterministic priority is surfaced automatically.
- The next item's existing decision-state control is scrolled into view and focused on the same phone surface.
- Progress is explicit: `0 of 3`, `1 of 3`, `2 of 3`, then `3 of 3` reviewed.
- A completed session can be restarted. Session progress itself is in-memory only; existing local-demo state remains governed by the pre-existing strict allowlists.

## Safety boundary

This slice:

- accepts no free text;
- reads only the three allowlisted local demo decision states and three allowlisted rationale values;
- ignores arbitrary/injected stored fields;
- performs no POST, PUT, PATCH, or DELETE request;
- does not query private sources;
- does not rank with AI or infer urgency, commercial value, legal significance, or client risk;
- does not create CRM records, email, messages, calendar events, tasks, notifications, database writes, evidence claims, approvals, contracts, or production releases;
- does not bind any provider or credential;
- does not change the existing live-staging, confidential-intake, owner/security, spending, destructive-data, legal/public-commitment, or production-release gates.

## Implementation surfaces

- `src/cherry-owner-review-session.js`
- `tests/cherry-owner-review-session.spec.mjs`
- `index.html`
- `package.json` mandatory `test:phase4` gate

## Required verification

The focused Playwright coverage must prove:

1. mixed local demo states start with the correct deterministic priority;
2. changing the active item's decision state advances to the next unseen deterministic priority;
3. the next current state control receives focus automatically on the same `#/cockpit` surface;
4. all three items can be reviewed once and the session terminates cleanly;
5. restart resets only in-memory review-session progress;
6. invalid rationale/state values fail closed to the allowlisted defaults;
7. injected private/authority-looking fields never render;
8. no POST/PUT/PATCH/DELETE requests occur;
9. the 390px phone viewport has no horizontal overflow;
10. the complete mandatory Phase 4 and repository CI chain still passes on the exact final head.

## Non-claims

Implementation presence is not test proof. CI success is not live-staging proof. Preview READY is not production proof. This review session remains synthetic owner-interface scaffolding until real owner-validated data, authentication, authorization, provider security, recovery, and production-release gates are separately satisfied.
