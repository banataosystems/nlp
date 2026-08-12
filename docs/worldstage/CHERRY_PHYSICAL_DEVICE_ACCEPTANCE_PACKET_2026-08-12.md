# WorldStage / Cherry — Physical-device owner acceptance packet

Date prepared: 2026-08-12  
Project key: `worldstage-cherry`  
Repository: `banataosystems/nlp`  
Active line: `redesign/mobile-first-v2`

## Purpose

This packet is the bounded owner/device proof for the current **synthetic, non-production** WorldStage / Cherry workflow. It is intentionally short enough to complete on one phone. It does not authorize live staging, production release, confidential intake, provider access, spending, legal/public commitments, or real client-data processing.

The packet being present is **not** Cherry approval. Acceptance exists only after Cherry (or an explicitly authorized owner representative) performs the checks on a physical device and records the result.

## Exact build under review

- Exact validation source: `bbd073aa0cb14db48439f372aabd99bc59634b2f`
- Exact-source GitHub Actions: `31565659324` / #858 — SUCCESS
- Exact-source Vercel preview: `dpl_4dx9WksvwGGk1Lumk3WWpiEdP1xk` — READY, non-production
- Runtime implementation for reset/focus behavior: `92df41b452ea7203a6f5bf6765fb858148fdd2a0`
- Readiness remains intentionally `BLOCKED`; this acceptance check cannot change that state by itself.

The preview may require Vercel authentication. If the owner cannot reach the exact preview on the physical device because of authentication or access policy, record **BLOCKED — preview access** rather than inferring a pass.

## Safety rules for the check

Use only synthetic/example information. Do not enter a real client name, participant information, private messages, payment details, confidential documents, credentials, or other protected information. Do not upload files. Do not treat any synthetic completion state as a real client engagement outcome.

## Device evidence header

Record only these non-sensitive facts:

- Owner/reviewer: ____________________
- Device model: ____________________
- OS/version: ____________________
- Browser/version: ____________________
- Local date/time: ____________________
- Exact preview deployment checked: `dpl_4dx9WksvwGGk1Lumk3WWpiEdP1xk`

For every check below, record **PASS**, **FAIL**, or **BLOCKED** and one short note if needed.

## A. Mobile fit and basic usability

1. **Initial load** — The exact preview opens on the physical phone without a broken/blank page. Result: __________
2. **No horizontal overflow** — Normal portrait use does not require sideways scrolling to read or operate the primary Cherry workflow. Result: __________
3. **Readable owner surface** — Primary labels, stage names, current-stage detail, and the owner action are readable without zooming. Result: __________
4. **Touch targets** — The primary owner action and local-demo controls can be tapped reliably without accidental adjacent activation. Result: __________

## B. Discovery → Cherry review → Transformation Record continuity

5. **Discovery orientation** — The continuity surface clearly identifies Discovery as the starting/current stage in a fresh synthetic flow. Result: __________
6. **Progression is understandable** — After completing the available synthetic Discovery action, the interface makes the move toward Cherry review understandable without exposing a second conflicting owner action. Result: __________
7. **Cherry review orientation** — In the synthetic Cherry review stage, the visible current-stage label/detail agrees with the stage the owner is actually reviewing. Result: __________
8. **Transformation Record orientation** — After completing the synthetic review path, the continuity surface reaches Transformation Record without showing stale Discovery/Review as the current stage. Result: __________
9. **Resume consistency** — When Resume is available, its visible/accessibility meaning matches the current synthetic stage and it resumes that same stage rather than another one. Result: __________

## C. Reset / Cancel / Start-new boundary

10. **Completed-state Start new** — A completed synthetic flow exposes the bounded Start-new/reset-confirmation path rather than immediately destroying the completed local state. Result: __________
11. **Cancel is safe** — Cancel closes the confirmation, keeps the completed synthetic state intact, returns focus/attention to the owner surface, and leaves the local `Reset demo` control usable again. Result: __________
12. **Repeated Cancel/open cycles** — Repeating Start new → Cancel at least three times does not duplicate the confirmation, lose the owner action, visually corrupt stage status, or leave `Reset demo` stuck unavailable after Cancel. Result: __________
13. **Canonical Confirm** — On a fresh completed synthetic flow, Start new → Confirm resets only the local synthetic demo and returns continuity to Discovery. Result: __________
14. **No stale completion after Confirm** — After Confirm, the UI does not continue claiming Transformation Record/completed state or show a stale completed Start-new confirmation. Result: __________

## D. Owner confidence / product truth

15. **No production-looking claim** — The current synthetic workflow does not make the owner believe a real client record, production workflow, payment, provider integration, or confidential intake has been activated. Result: __________
16. **Stage language is understandable** — “Discovery”, “Cherry review”, “Transformation Record”, Resume, Start new, Cancel and Confirm make sense to Cherry in the context of how she works. Result: __________
17. **No critical phone-only friction** — Cherry can complete the synthetic review path on the physical phone without needing a desktop, browser developer tools, terminal, or code access. Result: __________

## Acceptance result

- Overall result: **PASS / FAIL / BLOCKED**
- Failed/blocked item numbers: ____________________
- Short owner note: ____________________

A **PASS** requires all safety-critical items 1, 2, 5, 7, 8, 9, 11, 13, 14, 15 and 17 to be PASS, with no unresolved FAIL that changes workflow truth or prevents ordinary phone use. A BLOCKED item caused by preview authentication/access remains a blocker and is not converted into PASS.

## Owner evidence rule

Physical-device acceptance becomes durable evidence only when the recorded result can be tied to this exact deployment/source pair and an identifiable authorized owner/reviewer statement. A screenshot may be used if it contains no private client data or credentials, but a screenshot is not required if a dated written owner result is available.

Do not infer approval from silence, a READY deployment, automated Playwright/device-class tests, this checklist, or the existence of an owner account.

## What acceptance does not unlock automatically

Even a complete PASS does **not** by itself authorize live staging, real PostgreSQL/Supabase binding, signed-user RLS production use, confidential intake, provider activation, billable services, legal/regulatory commitments, real client data, merge, or production release. Those remain governed by their separate recorded gates and approvals.
