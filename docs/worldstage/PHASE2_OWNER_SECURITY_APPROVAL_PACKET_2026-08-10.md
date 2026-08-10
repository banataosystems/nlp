# WorldStage / Cherry — Phase 2 owner/security approval packet

**Date:** 2026-08-10  
**Status:** READY FOR OWNER / SECURITY DECISIONS  
**Purpose:** reduce the 24-item decision register into one structured approval session whose outputs can be applied directly to staging implementation.

## How to use this packet

For each decision below, choose one option and add a short correction only if needed. Do not redesign the software in the meeting. The purpose is to confirm how WorldStage actually works and where the system must stop, ask, or escalate.

A decision is not complete without:
- decision value;
- approver name/role;
- date;
- source/example where needed;
- exceptions;
- implementation impact.

## Group A — Business operating truth

### A1 / D1 — First live workflow

Proposed:
`Secure Discovery Intake → Human Review → Transformation → Cherry Judgment Queue`

Choose: `APPROVE / CHANGE / REJECT`

Correction/example:

### A2 / D2 — Primary business object

Proposed: `Client Transformation` is the primary business object.

Choose: `APPROVE / CHANGE / REJECT`

Correction:

### A3 / D3 — Internal roles and authority

Validate actual internal roles, role overlap, Cherry-only decisions, delegated decisions, access-grant authority and break-glass rules.

Choose: `APPROVE DRAFT / CHANGE / REJECT`

Named roles/authority corrections:

### A4 / D10 — Systems of record

For each system choose `KEEP / WRAP / REPLACE / NO INTEGRATION / UNKNOWN`:
- email
- calendar
- contacts/CRM
- proposals/contracts
- schedules
- documents/files
- event/ticket registration
- payments/accounting
- participant forms/surveys
- Fire University / learning platform
- analytics
- messaging/follow-up

## Group B — Privacy and security boundaries

### B1 / D5 — Participant vs sponsor visibility

Proposed:
- participant-person-level material private by default;
- sponsor sees only explicitly approved aggregate/derived evidence;
- sponsor organization membership does not automatically expose participant records;
- facilitator-private notes remain separate.

Choose: `APPROVE / CHANGE / REJECT`

### B2 / D6 — Data classification

Proposed:
0. Public
1. Internal business
2. Confidential client
3. Participant/person-level
4. Highly restricted

Choose: `APPROVE / CHANGE / REJECT`

List prohibited categories, if any:

### B3 / D7 — Retention/deletion

**No duration is proposed by the software team.**

Set owner/legal/security-approved retention/deletion rules for:
- intake drafts
- submitted intakes
- client discovery
- participant records
- evidence
- audit logs
- exports
- backups
- semantic/vector copies if ever allowed
- legal/contract holds

### B4 / D12 — AI eligibility

Proposed default:
- no automatic AI from intake;
- AI only for explicitly eligible data classes;
- actor/source permissions apply to retrieval;
- AI output is suggestion, never approval;
- no AI permission, deletion, public-release or production-release authority.

Choose: `APPROVE / CHANGE / REJECT`

### B5 / D13 — Analytics/session replay

Proposed default:
- no confidential client/participant payload in analytics;
- no unrestricted replay on secure surfaces;
- metadata-only events unless separately approved.

Choose: `APPROVE / CHANGE / REJECT`

### B6 / D14 — File uploads

Recommended first release: `DISABLE INITIAL`.

Choose: `DISABLE INITIAL / ENABLE WITH SEPARATE PRIVATE-FILE REVIEW`

## Group C — Identity and privileged actions

### C1 / D8 — External intake authentication

Choose one initial mode:
- `A` authenticated account
- `B` signed, scoped, expiring invitation
- `C` anonymous public intake with explicit security/privacy approval

Recommendation pending owner validation: **B**, because it minimizes friction without creating an unrestricted anonymous confidential-data channel.

Final choice:

### C2 / D9 — Internal MFA / AAL2

Proposed:
- MFA for privileged internal users;
- AAL2/step-up for permissions, sensitive exports, owner-level decisions, destructive retention/deletion, production administration and release authorization.

Choose: `APPROVE / CHANGE / REJECT`

If Supabase is selected, candidate method: TOTP/AAL2.

## Group D — Staging and incident authority

### D1 / D15 — Staging provider

Choose: `SUPABASE / OTHER`

If Supabase, create a separate staging project only after this packet is approved; never reuse production project ID/secrets.

### D2 / D16 — Who may create/manage staging infrastructure?

Named authority:

### D3 / D17 — Incident owner(s)

Name owner(s) for:
- account compromise
- leaked secret
- sensitive-data exposure
- intake disable/kill switch
- migration failure
- access revocation
- client/privacy escalation

### D4 / D18 — Kill-switch authority

Who may disable secure intake?

Who may re-enable it?

Must these be different roles/approvals?

### D5 / D19 — Backup/restore governance

Approve:
- backup mechanism
- retention
- restore authority
- recovery environment
- recovery objectives if contractually required

## Group E — Release and public-content authority

### E1 / D20 — Physical devices

Required before production verification:
- physical iPhone pass
- physical Android pass
- real keyboard behavior
- touch/accessibility review
- exact source SHA

### E2 / D21 — Media/content rights

Approve exact set of:
- Cherry photography
- team photography
- client logos
- testimonials/case studies
- outcome claims
- trademarked vocabulary

### E3 / D22 — Pandora Memory governance

Choose before production:
- `SYNC` — restore and synchronize canonical Pandora Memory; or
- `EXCEPTION` — explicitly approve another canonical-state procedure.

### E4 / D23 — Production release authority

Named person/role who may explicitly authorize production:

Production authorization must be separate from staging PASS and bind an exact source SHA to release evidence.

### E5 / D24 — First production scope

Recommended bounded first release:
- secure intake
- human review
- transformation linking
- Cherry Judgment Queue handoff
- no file uploads
- no participant survey
- no sponsor portal
- no payment mutation
- no automatic relationship messaging
- no semantic memory
- no autonomous AI decisions

Choose: `APPROVE / CHANGE / REJECT`

## Minimum decision set to unlock live staging

Live staging remains blocked until the following are resolved with evidence:

`D1, D2, D3, D5, D6, D7, D8, D9, D10, D15, D16, D17, D18`

This packet may resolve additional decisions at the same session, but those thirteen are the minimum technical/business truth required to create isolated staging safely.

## Handoff output

After approval, the implementation team should update `PHASE2_OWNER_SECURITY_DECISION_REGISTER_2026-08-10.md` with the exact decisions and evidence, then:

1. convert approved SQL drafts into reviewed executable staging migrations;
2. create the isolated staging provider/project under the named authority;
3. create synthetic identities only;
4. run signed-user RLS/API/AAL2 tests;
5. run audit, kill-switch, revocation, backup/restore and incident drills;
6. produce an exact-source staging evidence bundle;
7. stop again at the separate production-authorization gate.

**This packet itself does not authorize infrastructure creation.**