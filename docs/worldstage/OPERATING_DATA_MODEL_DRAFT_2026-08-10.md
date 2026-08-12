# WorldStage / Cherry — Operating data model draft

**Date:** 2026-08-10  
**Project:** WorldStage / Cherry Adaptive Operating System  
**Status:** Phase 1 draft — public/project evidence only; owner validation required before production schema work

## Design rule

The primary business object is a **client transformation**, not an event, ticket, generic CRM deal, or workshop booking.

The product should follow WorldStage's observable transformation rhythm:

`Relationship / opportunity → Discovery → Diagnosis / framing → Solution design → Proposal / engagement → Pre-work → Intervention / delivery → Evidence → Client debrief → Sustainment → Renewal / expansion`

This lifecycle is a working model. Steps, names, ordering, ownership, exceptions and systems of record remain **TO VALIDATE** with Cherry / WorldStage.

## Provenance states

Every consequential field should carry one of these provenance states:

- `PUBLIC_VERIFIED` — supported by WorldStage-owned public material or verified project evidence.
- `CLIENT_SUPPLIED` — supplied directly by a prospect/client and not yet interpreted as WorldStage fact.
- `TEAM_RECORDED` — entered by an authorized WorldStage team member.
- `CHERRY_CONFIRMED` — explicitly approved by Cherry.
- `SOURCE_REQUIRED` — proposed/derived structure waiting for a source.
- `TO_VALIDATE` — operating assumption requiring owner validation before production use.

## Core objects

### 1. Organization

Represents a client/prospect organization.

Candidate fields:
- `organization_id`
- `canonical_name`
- `website`
- `industry` — `TO_VALIDATE` whether operationally useful
- `relationship_state` — `TO_VALIDATE` vocabulary
- `primary_relationship_owner` — `TO_VALIDATE`
- `public_notes`
- `internal_notes` — restricted
- `created_at`
- `updated_at`

Rules:
- Organization is not equivalent to an engagement.
- Relationship status must not be inferred from website activity alone.
- Sensitive notes require role-based access and audit before production use.

### 2. Person / relationship contact

Represents a named business contact, sponsor, stakeholder, participant or team member depending on role.

Candidate fields:
- `person_id`
- `organization_id`
- `name`
- `role_title`
- `email`
- `phone`
- `relationship_role` — sponsor / buyer / participant / facilitator / internal / other; `TO_VALIDATE`
- `contact_permission_state` — `TO_VALIDATE`
- `visibility_class`

Rules:
- Participant-level data must not automatically inherit sponsor visibility.
- Business contact details and participant-sensitive data require separate handling classes.

### 3. Transformation

The principal aggregate object.

Candidate fields:
- `transformation_id`
- `organization_id`
- `working_title`
- `current_reality`
- `desired_reality`
- `business_objective`
- `human_objective`
- `priority_signals`
- `constraints`
- `success_definition`
- `status`
- `relationship_owner`
- `decision_owner`
- `confidentiality_class`
- `source_summary`

Rules:
- `current_reality` and `desired_reality` should preserve source language.
- System-generated interpretation must never silently overwrite client-supplied statements.
- No transformation diagnosis becomes canonical without authorized human review.

### 4. Discovery record

Represents a discovery conversation, FGD, questionnaire, observation or similar intake artifact.

Candidate fields:
- `discovery_id`
- `transformation_id`
- `discovery_type` — exact vocabulary `TO VALIDATE`
- `occurred_at`
- `facilitated_by`
- `participants_scope`
- `raw_source_reference`
- `current_reality_signals`
- `desired_reality_signals`
- `constraints`
- `open_questions`
- `permission_state`
- `review_state`

Rules:
- Raw participant responses are more sensitive than sponsor-facing summaries.
- Prototype local-browser Discovery is not a production store.
- Confidential Discovery requires secure server-side intake, identity, access control, retention policy and audit.

### 5. Insight / finding

Represents a structured statement derived from one or more sources.

Candidate fields:
- `insight_id`
- `transformation_id`
- `statement`
- `statement_type` — fact / observation / hypothesis / recommendation / question
- `source_refs[]`
- `confidence_state`
- `sponsor_visibility`
- `participant_visibility`
- `cherry_review_state`

Rules:
- Facts and suggestions must remain visibly distinct.
- Every important insight must answer “Where did this come from?”
- AI-generated synthesis, if ever enabled, must be marked as synthesis until human-confirmed.

### 6. Solution design

Represents the proposed intervention architecture rather than merely a product SKU.

Candidate fields:
- `design_id`
- `transformation_id`
- `design_rationale`
- `objectives[]`
- `modules[]`
- `experience_sequence[]`
- `facilitator_requirements[]`
- `delivery_mode`
- `duration`
- `measurement_plan`
- `sustainment_plan`
- `source_insight_refs[]`
- `approval_state`

Rules:
- Each major design element should trace back to an approved objective or insight.
- FIRE / other named WorldStage approaches may be referenced only according to owner-approved canonical vocabulary and rights.

### 7. Proposal / commercial engagement

Represents the commercial agreement layer around a transformation.

Candidate fields:
- `proposal_id`
- `transformation_id`
- `scope_summary`
- `commercial_status`
- `pricing_reference`
- `validity_window`
- `approval_owner`
- `client_approval_reference`
- `contract_reference`
- `invoice_reference`
- `payment_status_reference`

All commercial provider/system fields are `TO VALIDATE` until WorldStage confirms its actual accounting, invoicing, contracting and payment systems.

### 8. Program / intervention instance

Represents a concrete delivery instance inside the larger transformation.

Candidate fields:
- `intervention_id`
- `transformation_id`
- `design_id`
- `scheduled_start`
- `scheduled_end`
- `location_or_channel`
- `audience_scope`
- `facilitators[]`
- `run_of_show_reference`
- `materials_reference`
- `safety_or_accessibility_requirements`
- `delivery_state`

Rules:
- An intervention is subordinate to the transformation, not the top-level business object.
- Calendar/provider ownership remains `TO VALIDATE`.

### 9. Commitment / promise

Represents a human or commercial follow-up that must not disappear in messages.

Candidate fields:
- `commitment_id`
- `transformation_id`
- `relationship_id`
- `description`
- `promised_by`
- `promised_to`
- `due_at`
- `source_ref`
- `status`
- `completion_evidence_ref`
- `sensitivity_class`

This object is important because the owner-validation packet specifically asks which forgotten promises/follow-ups are most dangerous. The actual escalation and reminder rules remain `TO VALIDATE`.

### 10. Evidence item

Represents evidence that something changed.

Candidate fields:
- `evidence_id`
- `transformation_id`
- `evidence_type`
- `statement`
- `source_ref`
- `evidence_state`
- `collected_at`
- `confirmed_by`
- `client_visibility`
- `public_release_state`

Use the existing evidence progression:

`Anecdotal → Observed → Measured → Client-confirmed → Externally verified → Publicly approved`

Rules:
- Publicly approved is not implied by client-confirmed.
- Participant-level evidence must be privacy-filtered before sponsor or public use.
- Marketing claims require separate rights/approval evidence.

### 11. Debrief

Represents the post-intervention human interpretation and next-step decision.

Candidate fields:
- `debrief_id`
- `transformation_id`
- `intervention_id`
- `what_happened`
- `what_changed`
- `open_risks`
- `client_feedback`
- `worldstage_judgment`
- `next_actions[]`
- `renewal_signal`
- `reviewed_by`

### 12. Sustainment action

Represents post-program reinforcement rather than treating the intervention as finished when the room closes.

Candidate fields:
- `sustainment_id`
- `transformation_id`
- `action_type`
- `due_at`
- `owner`
- `audience`
- `status`
- `source_or_rationale_ref`
- `completion_evidence_ref`

Cadence such as 7/30/90-day follow-up is a prototype pattern and remains `TO VALIDATE` unless owner-approved.

### 13. Source reference

Every source-dependent object should point to a durable source record.

Candidate fields:
- `source_ref_id`
- `source_type`
- `provider`
- `provider_object_id`
- `captured_at`
- `content_hash`
- `author_or_sender`
- `visibility_class`
- `retention_class`
- `access_scope`

Rules:
- Preserve source identity independently of UI summaries.
- Secrets and private content must never be copied into public repository evidence.
- Semantic memory cannot become the sole source of record.

### 14. Decision / approval

Represents a consequential human decision.

Candidate fields:
- `decision_id`
- `transformation_id`
- `decision_type`
- `question`
- `decision`
- `decided_by`
- `authority_basis`
- `source_refs[]`
- `decided_at`
- `supersedes_decision_id`
- `rollback_or_reversal_notes`

This is the backbone of the Cherry Judgment Queue. The queue should surface decisions, not manufacture authority.

## Relationships

Working relationship model:

- Organization `1 → many` Transformations
- Organization `1 → many` People
- Transformation `1 → many` Discovery records
- Transformation `1 → many` Insights
- Transformation `1 → many` Solution designs
- Transformation `1 → many` Proposals / commercial engagements
- Transformation `1 → many` Intervention instances
- Transformation `1 → many` Commitments
- Transformation `1 → many` Evidence items
- Transformation `1 → many` Debriefs
- Transformation `1 → many` Sustainment actions
- Any consequential object `many → many` Source references
- Transformation `1 → many` Decisions / approvals

These cardinalities are architectural defaults and remain subject to owner workflow validation.

## Required access dimensions before production

Every private record should be evaluated across:

1. organization/client isolation;
2. WorldStage internal role;
3. sponsor vs participant visibility;
4. Cherry-only / executive-only visibility;
5. AI-access eligibility;
6. analytics/session-replay eligibility;
7. retention/deletion class;
8. public-release permission.

No production schema should be activated until the role model, data classifications, retention rules and provider systems are confirmed.

## Phase 2 minimum viable production slice

Pending owner approval, the smallest coherent live slice is:

`Organization + Person + Transformation + Discovery Record + Source Reference + Decision/Approval`

Flow:

`Secure Discovery Intake → Human Review → source-linked Transformation context → Cherry Judgment Queue`

Explicitly excluded from the first slice until validated:

- participant analytics;
- automated diagnosis;
- autonomous proposal sending;
- payment automation;
- public outcome claims;
- automatic relationship messaging;
- unrestricted AI over private client content.

## Owner-validation questions that change this model

The following answers can materially restructure the schema:

- What are Cherry's exact terms for discovery, FGD and “twinkle” conversations?
- Is a transformation opened before or after commercial acceptance?
- Can one proposal cover multiple transformations or vice versa?
- What object does the team actually think of as “the client job” today?
- Which participant data must remain separated from sponsors?
- Where is the canonical truth today for contacts, proposals, schedules, payments and follow-ups?
- Which decisions are Cherry-only?
- What evidence qualifies as “worked” for Cherry?
- What retention/deletion rules already exist contractually or operationally?

Until answered, this document is a design hypothesis with explicit provenance—not a production database specification.
