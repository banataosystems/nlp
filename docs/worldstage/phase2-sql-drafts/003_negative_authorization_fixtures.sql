-- WORLDSTAGE / CHERRY PHASE 2 — NEGATIVE AUTHORIZATION FIXTURES
-- NON-DEPLOYED / NON-EXECUTABLE CATALOG.
-- Convert these into staging tests only after owner-approved roles and a test environment exist.
-- Every case below is expected to DENY unless explicitly reclassified by owner/security review.

-- Fixture identities (illustrative UUID labels only; do not use in production):
-- owner_a, lead_a, ops_a, finance_a, security_admin_a, sponsor_a, participant_a1,
-- participant_a2, facilitator_a, outsider_same_org_a, user_org_b, revoked_user_a, anonymous.
-- Fixture transformations: transformation_a1, transformation_a2, transformation_b1.

-- N01 anonymous read secure intake
-- SET request.jwt.claim.sub = null;
-- SELECT * FROM ws_intakes WHERE id = :intake_a1;
-- EXPECT: 0 rows / denied.

-- N02 anonymous update secure intake
-- UPDATE ws_intakes SET state = 'accepted' WHERE id = :intake_a1;
-- EXPECT: denied.

-- N03 same-organization non-member reads transformation
-- AS outsider_same_org_a:
-- SELECT * FROM ws_transformations WHERE id = :transformation_a1;
-- EXPECT: 0 rows.

-- N04 cross-organization read
-- AS user_org_b:
-- SELECT * FROM ws_transformations WHERE id = :transformation_a1;
-- EXPECT: 0 rows.

-- N05 cross-organization write
-- AS user_org_b:
-- UPDATE ws_transformations SET working_title = 'forged' WHERE id = :transformation_a1;
-- EXPECT: 0 rows changed / denied.

-- N06 forged transformation ID in member-visible query
-- AS lead_a authorized only for transformation_a1:
-- SELECT * FROM ws_discovery_records WHERE transformation_id = :transformation_a2;
-- EXPECT: 0 rows unless explicit membership exists.

-- N07 sponsor reads participant-private data
-- AS sponsor_a:
-- SELECT * FROM ws_people WHERE id = :participant_sensitive_person;
-- SELECT * FROM ws_sources WHERE visibility_scope = 'participant_private';
-- EXPECT: 0 rows.

-- N08 participant reads another participant
-- AS participant_a1:
-- SELECT * FROM ws_people WHERE id = :participant_a2_person;
-- EXPECT: 0 rows.

-- N09 operations reads finance-restricted data
-- AS ops_a:
-- SELECT * FROM ws_sources WHERE visibility_scope = 'finance_restricted';
-- EXPECT: 0 rows.

-- N10 finance reads participant-private data
-- AS finance_a:
-- SELECT * FROM ws_sources WHERE visibility_scope = 'participant_private';
-- EXPECT: 0 rows.

-- N11 external facilitator reads unassigned transformation
-- AS facilitator_a assigned only transformation_a1:
-- SELECT * FROM ws_transformations WHERE id = :transformation_a2;
-- EXPECT: 0 rows.

-- N12 security admin reads confidential business content by technical role alone
-- AS security_admin_a with no transformation membership:
-- SELECT * FROM ws_discovery_records WHERE transformation_id = :transformation_a1;
-- EXPECT: 0 rows.

-- N13 relationship/operations role approves owner-only decision
-- AS ops_a:
-- UPDATE ws_decisions
-- SET state='approved', decision='approve'
-- WHERE id=:owner_only_decision;
-- EXPECT: denied; no direct approval policy exists.

-- N14 revoked membership
-- AS revoked_user_a where membership.active=false:
-- SELECT * FROM ws_transformations WHERE id = :transformation_a1;
-- EXPECT: 0 rows.

-- N15 client-side role manipulation
-- A browser/localStorage/JWT-untrusted field claims role='owner' but DB membership is not owner.
-- SELECT * FROM ws_decisions WHERE visibility_scope='owner_only';
-- EXPECT: 0 rows.

-- N16 direct API/database access outside UI
-- Same actor/context as an unauthorized UI action, but query REST/RPC/database directly.
-- EXPECT: identical denial because authorization is server/RLS based.

-- N17 sponsor attempts visibility escalation
-- AS sponsor_a:
-- UPDATE ws_sources SET visibility_scope='client_sponsor_visible' WHERE id=:participant_private_source;
-- EXPECT: denied.

-- N18 sensitive export without AAL2/step-up
-- CALL future_export_rpc(:transformation_a1) without verified AAL2.
-- EXPECT: denied by server function before data export.

-- N19 destructive deletion without authorized retention rule
-- DELETE FROM ws_intakes WHERE id=:intake_a1;
-- EXPECT: denied. No delete policy is defined.

-- N20 production release authorization from application role
-- Application/business database role attempts to set or record production release as authorized.
-- EXPECT: cannot authorize deployment; release authorization is outside ordinary data-role capability.

-- N21 client cannot choose assigned reviewer
-- Public/server intake payload includes assigned_reviewer_user_id=:owner_a.
-- EXPECT: server allowlist drops/rejects privileged field; browser must not write table directly.

-- N22 client cannot choose visibility scope
-- Public/server intake payload includes visibility_scope='client_sponsor_visible'.
-- EXPECT: server-controlled default remains worldstage_internal until human review.

-- N23 client cannot self-accept intake
-- Public/server intake payload includes state='accepted'.
-- EXPECT: state is server-controlled pending_human_review.

-- N24 duplicate idempotency key
-- Submit same validated idempotency key twice.
-- EXPECT: second request resolves to existing receipt or deterministic duplicate response; no duplicate intake rows.

-- N25 sensitive-content quarantine
-- Submit content classified by approved rule as prohibited/highly restricted for ordinary intake.
-- EXPECT: quarantine/reject path; no normal human-review exposure until authorized security/legal review.

-- N26 audit log mutation by ordinary user
-- UPDATE ws_audit_events SET outcome='success' WHERE id=:audit_event;
-- DELETE FROM ws_audit_events WHERE id=:audit_event;
-- EXPECT: denied.

-- N27 source-link access cannot bypass source visibility
-- AS team member lacking participant-private permission:
-- SELECT os.* FROM ws_object_sources os WHERE os.source_id=:participant_private_source;
-- EXPECT: 0 rows through RLS.

-- N28 owner-only decision not exposed by generic transformation membership
-- AS transformation_lead_a but not candidate owner:
-- SELECT * FROM ws_decisions WHERE id=:owner_only_decision;
-- EXPECT: 0 rows.

-- N29 stale session after role revocation
-- Revoke/disable membership, retain pre-revocation browser session, repeat protected SELECT/UPDATE.
-- EXPECT: server policy denies based on current membership state; provider-specific JWT/session caveats must be tested.

-- N30 semantic/AI retrieval authorization
-- Retrieval actor sponsor_a asks AI for all sources for transformation_a1.
-- EXPECT: participant_private / owner_only / security_restricted sources are absent from retrieval context.

-- Required positive controls (not authorization expansion):
-- P01 active transformation member reads permitted transformation summary.
-- P02 assigned reviewer reads assigned intake.
-- P03 candidate owner reads owner_only decision for assigned transformation.
-- P04 same user loses access immediately/within approved revocation semantics after membership disabled.

-- Conversion requirement:
-- These fixtures must become executable staging tests (e.g., pgTAP, Supabase local tests,
-- integration tests using signed test JWTs, or equivalent) before RLS/RBAC can be called verified.