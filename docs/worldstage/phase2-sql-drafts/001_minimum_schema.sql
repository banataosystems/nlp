-- WORLDSTAGE / CHERRY PHASE 2 — NON-DEPLOYED SQL DRAFT
-- DO NOT APPLY. This file is intentionally outside any migration directory.
-- PostgreSQL / Supabase-compatible design hypothesis only.
-- Owner/security validation required before executable migration work.

create extension if not exists pgcrypto;

create type ws_sensitivity_class as enum (
  'public',
  'internal_business',
  'confidential_client',
  'participant_person_level',
  'highly_restricted'
);

create type ws_visibility_scope as enum (
  'public',
  'worldstage_internal',
  'owner_only',
  'transformation_team',
  'client_sponsor_visible',
  'participant_private',
  'facilitator_private',
  'finance_restricted',
  'security_restricted'
);

create type ws_intake_state as enum (
  'draft',
  'submitted',
  'pending_human_review',
  'needs_clarification',
  'accepted',
  'linked_to_transformation',
  'quarantined',
  'rejected_for_sensitive_content',
  'legal_security_review',
  'archived'
);

create type ws_decision_state as enum (
  'proposed',
  'needs_source',
  'needs_review',
  'approved',
  'rejected',
  'superseded'
);

create table ws_organizations (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  website text,
  relationship_state text, -- TO VALIDATE vocabulary
  primary_relationship_owner_user_id uuid,
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'worldstage_internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references ws_organizations(id) on delete restrict,
  auth_user_id uuid, -- may reference auth.users only after identity design is approved
  display_name text not null,
  role_title text,
  email text,
  phone text,
  relationship_role text, -- sponsor/buyer/participant/facilitator/internal/etc TO VALIDATE
  contact_permission_state text, -- TO VALIDATE
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'worldstage_internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_transformations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ws_organizations(id) on delete restrict,
  working_title text not null,
  current_reality text,
  desired_reality text,
  business_objective text,
  human_objective text,
  success_definition text,
  status text not null default 'draft', -- TO VALIDATE lifecycle vocabulary
  relationship_owner_user_id uuid,
  decision_owner_user_id uuid,
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'transformation_team',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_transformation_memberships (
  id uuid primary key default gen_random_uuid(),
  transformation_id uuid not null references ws_transformations(id) on delete cascade,
  actor_user_id uuid not null,
  membership_role text not null, -- candidate role name; TO VALIDATE
  active boolean not null default true,
  granted_by_user_id uuid,
  granted_at timestamptz not null default now(),
  revoked_by_user_id uuid,
  revoked_at timestamptz,
  unique (transformation_id, actor_user_id, membership_role)
);

create table ws_intakes (
  id uuid primary key default gen_random_uuid(),
  receipt_code uuid not null default gen_random_uuid() unique,
  organization_id uuid references ws_organizations(id) on delete restrict,
  submitted_by_user_id uuid,
  contact_name text,
  contact_email text,
  contact_phone text,
  submission_channel text not null default 'web_secure_intake',
  notice_version text,
  consent_version text,
  state ws_intake_state not null default 'pending_human_review',
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'worldstage_internal',
  assigned_reviewer_user_id uuid,
  transformation_id uuid references ws_transformations(id) on delete restrict,
  idempotency_key text unique,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_intake_answers (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references ws_intakes(id) on delete cascade,
  question_key text not null,
  question_version text,
  answer_body text not null,
  source_classification text not null default 'client_supplied',
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'worldstage_internal',
  redaction_state text not null default 'unreviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_discovery_records (
  id uuid primary key default gen_random_uuid(),
  transformation_id uuid not null references ws_transformations(id) on delete cascade,
  intake_id uuid references ws_intakes(id) on delete set null,
  discovery_type text not null, -- exact WorldStage vocabulary TO VALIDATE
  occurred_at timestamptz,
  facilitated_by_user_id uuid,
  participants_scope text,
  current_reality_signals text,
  desired_reality_signals text,
  constraints text,
  open_questions text,
  permission_state text,
  review_state text not null default 'pending_human_review',
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'transformation_team',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_sources (
  id uuid primary key default gen_random_uuid(),
  transformation_id uuid references ws_transformations(id) on delete cascade,
  source_type text not null,
  provider text,
  provider_object_id text,
  captured_at timestamptz not null default now(),
  content_hash text,
  author_or_sender text,
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'transformation_team',
  retention_class text, -- TO VALIDATE; intentionally no duration
  access_scope text,
  created_at timestamptz not null default now()
);

create table ws_decisions (
  id uuid primary key default gen_random_uuid(),
  transformation_id uuid not null references ws_transformations(id) on delete cascade,
  decision_type text not null,
  question text not null,
  recommendation text,
  decision text,
  state ws_decision_state not null default 'needs_review',
  required_authority text not null, -- TO VALIDATE role/authority vocabulary
  proposed_by_user_id uuid,
  decided_by_user_id uuid,
  decided_at timestamptz,
  supersedes_decision_id uuid references ws_decisions(id) on delete restrict,
  sensitivity_class ws_sensitivity_class not null default 'confidential_client',
  visibility_scope ws_visibility_scope not null default 'owner_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ws_object_sources (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references ws_sources(id) on delete cascade,
  object_type text not null,
  object_id uuid not null,
  relationship_type text not null default 'supports',
  created_at timestamptz not null default now(),
  unique (source_id, object_type, object_id, relationship_type)
);

create table ws_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_type text not null,
  organization_id uuid references ws_organizations(id) on delete restrict,
  transformation_id uuid references ws_transformations(id) on delete restrict,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  outcome text not null,
  reason_code text,
  correlation_id uuid,
  approval_reference text,
  change_summary jsonb,
  created_at timestamptz not null default now()
);

create index ws_transformations_organization_idx on ws_transformations(organization_id);
create index ws_memberships_actor_idx on ws_transformation_memberships(actor_user_id, active);
create index ws_intakes_review_idx on ws_intakes(state, assigned_reviewer_user_id);
create index ws_discovery_transformation_idx on ws_discovery_records(transformation_id);
create index ws_sources_transformation_idx on ws_sources(transformation_id);
create index ws_decisions_queue_idx on ws_decisions(state, required_authority, created_at);
create index ws_audit_transformation_idx on ws_audit_events(transformation_id, occurred_at desc);

-- No retention scheduler is defined here on purpose.
-- No anonymous/public grants are defined here on purpose.
-- No auth.users foreign key is applied until the selected identity provider/model is approved.
-- No service-role bypass is part of browser/application authorization design.