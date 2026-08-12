# WorldStage / Cherry — Phase 2 RLS/RBAC verification matrix

**Date:** 2026-08-10  
**Status:** NON-DEPLOYED DRAFT — FAIL-CLOSED  
**Companion:** `PHASE2_SECURE_INTAKE_SECURITY_BLUEPRINT_2026-08-10.md`

## Purpose

Define testable authorization expectations before any secure WorldStage intake, private Cherry OS data, client portal, participant evidence, or restricted document storage is activated.

This matrix is intentionally conservative. Unknown permission = denied.

## Candidate actors

- `owner`
- `transformation_lead`
- `relationship_lead`
- `designer_facilitator`
- `operations`
- `evidence_reviewer`
- `finance`
- `security_admin`
- `client_sponsor`
- `client_contact`
- `participant`
- `external_facilitator`
- `anonymous`

All role names and boundaries are `TO VALIDATE`.

## Candidate resource scopes

- public content
- secure intake
- transformation summary
- confidential discovery
- proposal/commercial data
- program design
- logistics
- facilitator-private notes
- participant-private response
- aggregated evidence
- sponsor-visible evidence
- owner-only decision
- finance-restricted record
- source provenance
- audit record
- permission/membership
- export
- retention/deletion
- production release

## Default policy rule

For every action not expressly permitted by an owner-approved policy:

**DENY**

## Provisional permission matrix

Legend:
- `R` read
- `W` write/update
- `A` approve/authorize
- `N` explicitly denied by default
- `V` owner/security validation required

| Actor | Public | Intake | Transformation | Participant private | Sponsor-visible | Owner decision | Finance | Audit | Permissions | Export/Delete | Release |
|---|---|---|---|---|---|---|---|---|---|---|---|
| owner | R | R/W/A | R/W/A | V | R/W/A | R/W/A | V | R | V | A + step-up | A + step-up |
| transformation_lead | R | R/W | R/W | V | R/W | V | N | V | N | V | N |
| relationship_lead | R | R/W | R/W | N by default | R/W | V | N | V | N | V | N |
| designer_facilitator | R | V | R/W design | V | V | N | N | N | N | N | N |
| operations | R | V | R logistics | N | V | N | N | N | N | N | N |
| evidence_reviewer | R | V | R evidence | V | W evidence | N | N | V | N | V | N |
| finance | R | N | V | N | N | N | R/W finance | V | N | V | N |
| security_admin | R | N | N business content | N | N | N | N | R security | V technical only | V security | V technical only |
| client_sponsor | R | own intake only | approved summary | N | R approved | N | V own | N | N | V own approved | N |
| client_contact | R | own intake only | approved subset | N | R approved subset | N | N | N | N | V own approved | N |
| participant | R | participant flow only | N | own records only if product requires | approved aggregate only | N | N | N | N | own rights only | N |
| external_facilitator | R | N | assigned delivery subset | V | N | N | N | N | N | N | N |
| anonymous | R | create intake only if owner-approved | N | N | N | N | N | N | N | N | N |

This table is **not** an authorization policy until owner/security validation.

## Required policy invariants

### Organization isolation

- Actor in organization A cannot read/write organization B.
- No service/API path may accept organization ID from the client and trust it without authorization resolution.

### Transformation isolation

- Organization membership alone does not imply access to every transformation unless owner policy explicitly says so.
- Resource transformation ID must match an active authorized membership or a specifically authorized external relationship.

### Participant isolation

- Sponsor cannot read participant-private data.
- Participant cannot read another participant's data.
- Aggregated evidence must not expose an individual indirectly below owner-approved anonymity thresholds.

### Finance isolation

- Program delivery roles do not inherit invoice/payment data.
- Finance does not inherit participant or confidential discovery data by default.

### Security-admin separation

Technical administration does not imply business-content access or Cherry decision authority.

### Decision authority

- System/AI cannot mark owner-required decisions approved.
- A user cannot approve a decision above their delegated authority.
- Approval must record identity, timestamp, source basis, required authority, and step-up where required.

## Positive authorization tests

Examples to implement before activation:

1. Assigned transformation lead can read assigned transformation summary.
2. Authorized reviewer can read an intake assigned for review.
3. Owner can approve an owner-required decision after required step-up.
4. Sponsor can read a record explicitly transitioned to sponsor-visible.
5. Participant can submit permitted participant input.
6. Evidence reviewer can create an evidence item in an assigned transformation.
7. Finance user can update payment status where owner policy permits.

Each positive test must verify the exact minimum fields returned, not merely HTTP success.

## Negative authorization tests

Must include at minimum:

1. anonymous read of secure intake → DENY;
2. anonymous update of secure intake → DENY;
3. same-org non-member reads transformation → DENY;
4. cross-org read/write → DENY;
5. forged transformation ID → DENY;
6. client sponsor reads participant-private response → DENY;
7. participant reads another participant's record → DENY;
8. operations reads finance-restricted data → DENY;
9. finance reads participant-private data → DENY;
10. external facilitator reads unassigned transformation → DENY;
11. security admin reads confidential client content without explicit exceptional policy → DENY;
12. relationship lead approves owner-only decision → DENY;
13. disabled membership continues access → DENY;
14. revoked role via stale browser state → server denies;
15. browser changes role field/local storage → no permission change;
16. direct database/API query outside UI → same denial;
17. sponsor changes visibility field → DENY;
18. user exports restricted data without step-up → DENY;
19. user executes destructive deletion without required authority → DENY;
20. application/service tries production release without release authorization → DENY.

## Intake-specific tests

### Submission

- duplicate idempotency token returns existing receipt rather than duplicate record where applicable;
- oversized payload rejected;
- disallowed file type rejected;
- missing notice/consent version rejected when required;
- prohibited/sensitive content handling routes to quarantine or rejection instead of normal processing;
- client cannot set reviewer, role, approval state, organization owner, or visibility scope directly.

### Human review

- only authorized reviewer can transition `pending_human_review`;
- reviewer cannot silently promote participant-private content to sponsor-visible;
- transformation linking requires authorized transformation access;
- acceptance/rejection creates audit event;
- clarification flow cannot leak internal review notes externally.

## Audit verification

For consequential mutations, test that audit contains:

- actor;
- action;
- resource;
- organization/transformation context;
- result;
- timestamp;
- request/correlation ID;
- approval/step-up reference if required;
- change summary/hash where appropriate.

Negative security events should also be observable without logging sensitive payloads.

## Retention/deletion verification

No duration is assumed. Once owner-approved rules exist, tests must verify:

- scheduled retention targets correct data class;
- legal/contract hold blocks deletion;
- user deletion rights affect all approved derived stores;
- backups follow approved policy;
- audit records follow separate retention rules;
- deletion does not leave accessible vector/semantic-memory copies;
- destructive operations require authorization and audit.

## Session and MFA tests

- privileged action without step-up → DENY;
- valid step-up allows only intended privileged window/action;
- expired privileged session → DENY;
- revoked user/member → DENY;
- disabled MFA factor cannot be reused;
- session fixation/replay protections verified according to selected auth provider.

## File/private media tests

If uploads are enabled:

- private file URL is not public/static;
- short-lived signed access expires;
- actor cannot request signed URL for unauthorized transformation;
- content type/size validation is server-side;
- original filename does not control storage path;
- malware scan/quarantine path works if adopted;
- metadata does not expose sensitive client/participant information publicly.

## AI/retrieval authorization tests

- retrieval only sees sources actor is authorized to read;
- AI prompt/context does not contain denied records;
- citations/source references preserve authorization;
- owner-only data is not surfaced to sponsor;
- participant-private data is not used in sponsor-facing summaries except owner-approved aggregate transforms;
- AI-generated suggestion remains labeled suggestion and cannot mutate approval state.

## Production gate

RLS/RBAC cannot be marked verified until:

1. policies exist in the target environment;
2. migrations are reviewed;
3. positive tests pass;
4. negative tests pass;
5. role revocation tested;
6. participant/sponsor isolation tested;
7. audit behavior tested;
8. data backup/restore tested;
9. owner-approved authority matrix matches implementation;
10. security review signs off.

## Owner/security decisions still required

- exact roles;
- global vs transformation-scoped memberships;
- sponsor/client-contact distinction;
- participant self-access rules;
- external facilitator scope;
- finance scope;
- security-admin break-glass rules;
- approval thresholds;
- export rules;
- retention/deletion rules;
- MFA/step-up requirements beyond the conservative defaults.

Until those decisions exist, implementation should preserve the narrowest reasonable access and default deny.