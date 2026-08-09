# WorldStage / Cherry — Decision authority draft

**Date:** 2026-08-10  
**Status:** Phase 1 draft; no private authority assumptions are production-approved

## Governing rule

The system may prepare context, detect missing evidence, structure options, and remind humans of commitments. It must not silently promote an automated suggestion into a WorldStage decision.

Until Cherry / WorldStage validates the role map, authority defaults are intentionally conservative.

## Authority states

- `TEAM_OPERATIONAL` — candidate routine operational decision; exact role `TO VALIDATE`.
- `PROGRAM_LEAD_REVIEW` — candidate delivery/design review; exact WorldStage role `TO VALIDATE`.
- `COMMERCIAL_REVIEW` — candidate commercial/contract decision; exact role `TO VALIDATE`.
- `CHERRY_REVIEW` — likely judgment-sensitive; must not be automated without owner validation.
- `CLIENT_APPROVAL` — requires client/sponsor authorization.
- `PRIVACY_OR_RIGHTS_REVIEW` — requires authorized review of confidentiality, participant privacy, content rights or public-use permission.
- `SOURCE_REQUIRED` — no decision should be made until supporting evidence exists.

These labels are workflow placeholders, not an assertion of the actual WorldStage org chart.

## Draft matrix

| Decision | Draft authority | Automation allowed now? | Required evidence / rule |
|---|---|---:|---|
| Record a new non-confidential prospect inquiry | `TEAM_OPERATIONAL` `TO VALIDATE` | Prototype only | Source-linked inquiry; no confidential material in current prototype |
| Interpret Discovery input as a diagnosis | `CHERRY_REVIEW` / authorized human `TO VALIDATE` | **No** | Client-supplied statements remain separate from interpretation |
| Decide whether more Discovery / FGD work is needed | `CHERRY_REVIEW` or program lead `TO VALIDATE` | **No** | Source summary + missing questions |
| Convert an observation into a canonical client fact | Authorized human `TO VALIDATE` | **No** | Provenance and confirmation required |
| Recommend a transformation objective | `CHERRY_REVIEW` / program design authority `TO VALIDATE` | Suggest only | Must trace to Discovery/source evidence |
| Select intervention approach / narrative arc | `CHERRY_REVIEW` `TO VALIDATE` | Suggest only | Context, objectives, constraints, source links |
| Choose routine delivery logistics | `TEAM_OPERATIONAL` `TO VALIDATE` | Potentially | Within approved scope/budget; provider system `TO VALIDATE` |
| Change approved program scope materially | `CHERRY_REVIEW` + possibly `CLIENT_APPROVAL` | **No** | Change rationale and source/client approval |
| Approve proposal narrative | `CHERRY_REVIEW` or delegated commercial/program role `TO VALIDATE` | **No** | Proposal/source context |
| Approve price / commercial exception | `COMMERCIAL_REVIEW` / Cherry `TO VALIDATE` | **No** | Pricing policy, margin/exception basis, contract context |
| Send a proposal | Authorized commercial role + client contact rule `TO VALIDATE` | **No automatic send** | Human-reviewed final artifact and recipient |
| Promise a client follow-up/date | Authorized relationship owner `TO VALIDATE` | Suggest/remind only | Explicit commitment source |
| Send relationship-sensitive follow-up | Relationship owner / Cherry `TO VALIDATE` | **No automatic send** | Context, tone, last interaction, promise source |
| Schedule a routine confirmed meeting | `TEAM_OPERATIONAL` `TO VALIDATE` | Potentially after auth | Confirmed participants, availability, authority |
| Change facilitator / keynote commitment | `CHERRY_REVIEW` / program authority `TO VALIDATE` | **No** | Availability, client context, contractual impact |
| Expose participant-level feedback to sponsor | `PRIVACY_OR_RIGHTS_REVIEW` | **No** | Explicit visibility rule and lawful/contractual basis |
| Summarize participant feedback into sponsor-safe themes | Authorized human `TO VALIDATE` | Assist only | Privacy threshold, aggregation rules, source separation |
| Mark outcome as “measured” | Authorized evidence owner `TO VALIDATE` | Assist only | Measurement method + source |
| Mark outcome as “client-confirmed” | Client + authorized WorldStage recorder | **No automatic promotion** | Client confirmation source |
| Use outcome/client name/logo publicly | `PRIVACY_OR_RIGHTS_REVIEW` + client approval | **No** | Documented rights/approval |
| Decide that an intervention “worked” | `CHERRY_REVIEW` / evidence authority `TO VALIDATE` | Suggest only | Evidence bundle + owner criteria |
| Trigger sustainment action | `TEAM_OPERATIONAL` or program owner `TO VALIDATE` | Potentially | Approved cadence/playbook |
| Identify renewal/expansion signal | Relationship owner / Cherry `TO VALIDATE` | Suggest only | Evidence + relationship context |
| Contact client about renewal | Relationship owner / Cherry `TO VALIDATE` | **No automatic send** | Human approval and current relationship state |
| Delete/retain confidential records | Privacy/data authority `TO VALIDATE` | Policy-driven only | Validated retention rule + audit |
| Allow AI access to confidential client data | Privacy/data authority + owner policy | **No** until Phase 2 controls | Data class, purpose, provider, retention, audit, opt-outs |
| Promote mobile-v2 to production | Explicit production authorization | **No** | Exact tested source, release provenance, rollback, physical-device and owner gates |

## Cherry Judgment Queue design rule

The queue should contain **questions requiring judgment**, not a generic task list.

Each item should include:

1. `Why this needs attention`
2. `What we know` — facts with source links
3. `What is only a suggestion`
4. `What is missing / source required`
5. `Who currently appears authorized` — `TO VALIDATE` until role map approved
6. `What action would happen after approval`
7. `What would not happen automatically`
8. `Reversal / rollback path` where consequential

## Candidate Cherry-sensitive judgment classes

These are likely to deserve executive judgment based on the product vision, but owner validation is required:

- narrative/intervention direction;
- exceptions where the client brief and human reality conflict;
- major scope changes;
- relationship-sensitive outreach;
- commercial exceptions;
- high-risk program or reputation issues;
- keynote/founder commitments;
- approval of consequential client/outcome claims;
- renewal/expansion approach for important relationships.

## Candidate delegable classes

These may be appropriate for team-owned workflows after role validation:

- confirmed logistics;
- document/status collection;
- reminder and follow-up tracking;
- source linking;
- checklist completion;
- approved-template preparation;
- evidence collection without interpretation;
- scheduling within explicit constraints;
- routine operational status updates.

The system should never infer that “routine” means “safe to automate” until the owner-approved role/exception model exists.

## Fail-closed escalation conditions

A queue item should escalate or block automation when any of the following is true:

- authority is unknown;
- source provenance is missing;
- participant privacy may be affected;
- public/client claim rights are unclear;
- contract/scope/pricing may change;
- the action sends an external message or creates a commitment;
- the system detects contradictory source evidence;
- the action could expose confidential information;
- the decision relies materially on AI-generated inference;
- reversal would be difficult or reputationally sensitive.

## Owner validation required

Cherry / WorldStage must confirm or replace:

- which decisions truly require Cherry personally;
- actual delegated roles and names/titles;
- commercial approval limits;
- relationship ownership rules;
- who approves public/client evidence claims;
- participant/sponsor visibility rules;
- emergency/escalation rules;
- what actions the system may perform without interrupting Cherry;
- what actions must always require explicit human confirmation.

Until this matrix is owner-approved, it is a conservative design control, not an authorization policy.
