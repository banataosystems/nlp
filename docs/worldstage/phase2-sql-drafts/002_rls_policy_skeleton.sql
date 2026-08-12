-- WORLDSTAGE / CHERRY PHASE 2 — NON-DEPLOYED RLS DRAFT
-- DO NOT APPLY. Candidate role names and authority remain TO VALIDATE.
-- Supabase-compatible helpers use auth.uid(); selected auth design is not yet approved.

alter table ws_organizations enable row level security;
alter table ws_people enable row level security;
alter table ws_transformations enable row level security;
alter table ws_transformation_memberships enable row level security;
alter table ws_intakes enable row level security;
alter table ws_intake_answers enable row level security;
alter table ws_discovery_records enable row level security;
alter table ws_sources enable row level security;
alter table ws_decisions enable row level security;
alter table ws_object_sources enable row level security;
alter table ws_audit_events enable row level security;

-- FORCE prevents table owners from silently bypassing RLS in ordinary application paths.
alter table ws_organizations force row level security;
alter table ws_people force row level security;
alter table ws_transformations force row level security;
alter table ws_transformation_memberships force row level security;
alter table ws_intakes force row level security;
alter table ws_intake_answers force row level security;
alter table ws_discovery_records force row level security;
alter table ws_sources force row level security;
alter table ws_decisions force row level security;
alter table ws_object_sources force row level security;
alter table ws_audit_events force row level security;

create or replace function ws_current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function ws_has_active_transformation_membership(
  p_transformation_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from ws_transformation_memberships m
    where m.transformation_id = p_transformation_id
      and m.actor_user_id = auth.uid()
      and m.active = true
      and (p_roles is null or m.membership_role = any (p_roles))
  );
$$;

revoke all on function ws_has_active_transformation_membership(uuid, text[]) from public;
grant execute on function ws_has_active_transformation_membership(uuid, text[]) to authenticated;

create or replace function ws_is_candidate_owner_for_transformation(p_transformation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Candidate role name only. Owner/security validation required.
  select ws_has_active_transformation_membership(p_transformation_id, array['owner']);
$$;

revoke all on function ws_is_candidate_owner_for_transformation(uuid) from public;
grant execute on function ws_is_candidate_owner_for_transformation(uuid) to authenticated;

-- Organizations: no broad policy is created. Access must be mediated through an
-- authorized transformation membership or a future owner-approved org membership model.
create policy ws_organizations_read_via_transformation_membership
on ws_organizations
for select
to authenticated
using (
  exists (
    select 1
    from ws_transformations t
    where t.organization_id = ws_organizations.id
      and ws_has_active_transformation_membership(t.id)
  )
);

-- People: conservative default. Participant/sponsor/self-access rules remain TO VALIDATE.
create policy ws_people_internal_read_via_transformation
on ws_people
for select
to authenticated
using (
  exists (
    select 1
    from ws_transformations t
    where t.organization_id = ws_people.organization_id
      and ws_has_active_transformation_membership(t.id)
      and ws_people.visibility_scope in ('worldstage_internal', 'transformation_team')
  )
);

-- Transformations: explicit active membership is required.
create policy ws_transformations_member_read
on ws_transformations
for select
to authenticated
using (ws_has_active_transformation_membership(id));

-- Draft write rule intentionally limited to candidate owner/transformation lead roles.
create policy ws_transformations_candidate_lead_update
on ws_transformations
for update
to authenticated
using (
  ws_has_active_transformation_membership(id, array['owner','transformation_lead'])
)
with check (
  ws_has_active_transformation_membership(id, array['owner','transformation_lead'])
);

-- Memberships are highly privileged. Ordinary members can see only their own active row.
create policy ws_memberships_self_read
on ws_transformation_memberships
for select
to authenticated
using (actor_user_id = auth.uid());

-- No INSERT/UPDATE/DELETE membership policy is defined here intentionally.
-- Permission grant/revoke requires owner-approved server-side privileged workflow + AAL2.

-- Secure intake: reviewers may read assigned items; submitter self-access is not assumed.
create policy ws_intakes_assigned_reviewer_read
on ws_intakes
for select
to authenticated
using (
  assigned_reviewer_user_id = auth.uid()
  or (
    transformation_id is not null
    and ws_has_active_transformation_membership(transformation_id, array['owner','transformation_lead'])
  )
);

create policy ws_intake_answers_read_through_authorized_intake
on ws_intake_answers
for select
to authenticated
using (
  exists (
    select 1 from ws_intakes i
    where i.id = ws_intake_answers.intake_id
      and (
        i.assigned_reviewer_user_id = auth.uid()
        or (
          i.transformation_id is not null
          and ws_has_active_transformation_membership(i.transformation_id, array['owner','transformation_lead'])
        )
      )
  )
);

-- No anonymous insert policy is defined. Public intake must go through a validated
-- server-side API/function with rate limiting, idempotency, notice/consent validation,
-- field allowlisting and audit. Whether anonymous intake is allowed remains TO VALIDATE.

create policy ws_discovery_member_read
on ws_discovery_records
for select
to authenticated
using (
  ws_has_active_transformation_membership(transformation_id)
  and visibility_scope not in ('participant_private','finance_restricted','security_restricted')
);

create policy ws_sources_member_read
on ws_sources
for select
to authenticated
using (
  transformation_id is not null
  and ws_has_active_transformation_membership(transformation_id)
  and visibility_scope not in ('participant_private','finance_restricted','security_restricted')
);

-- Decisions: owner_only cannot be read merely from general team membership.
create policy ws_decisions_team_read_non_owner_only
on ws_decisions
for select
to authenticated
using (
  ws_has_active_transformation_membership(transformation_id)
  and visibility_scope <> 'owner_only'
);

create policy ws_decisions_candidate_owner_read
on ws_decisions
for select
to authenticated
using (
  visibility_scope = 'owner_only'
  and ws_is_candidate_owner_for_transformation(transformation_id)
);

-- No decision approval UPDATE policy is defined in this draft.
-- Approval must be a server-side action that verifies required authority and AAL2/step-up.

create policy ws_object_sources_read_if_source_visible
on ws_object_sources
for select
to authenticated
using (
  exists (
    select 1 from ws_sources s
    where s.id = ws_object_sources.source_id
      and s.transformation_id is not null
      and ws_has_active_transformation_membership(s.transformation_id)
      and s.visibility_scope not in ('participant_private','finance_restricted','security_restricted')
  )
);

-- Audit: ordinary client/participant access is intentionally absent.
-- Candidate owner can see transformation audit only; security-specific access TO VALIDATE.
create policy ws_audit_candidate_owner_read
on ws_audit_events
for select
to authenticated
using (
  transformation_id is not null
  and ws_is_candidate_owner_for_transformation(transformation_id)
);

-- No general INSERT/UPDATE/DELETE policies are created for audit events.
-- Application audit writes should use a tightly scoped server-side mechanism.

-- Explicitly no policies granted to anon in this draft.
-- Explicitly no participant/sponsor policies until owner privacy boundaries are approved.
-- Explicitly no retention/delete policy until retention durations and deletion authority are approved.
-- Explicitly no service-role key or bypass mechanism belongs in browser code.