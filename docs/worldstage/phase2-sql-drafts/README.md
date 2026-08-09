# Phase 2 SQL drafts — DO NOT APPLY

These files are **design artifacts only** for the WorldStage / Cherry secure-intake architecture.

They intentionally live under `docs/worldstage/phase2-sql-drafts/`, not under `supabase/migrations/`, `migrations/`, or any deployment path.

## Safety status

- No Supabase/database project is selected or modified by these files.
- No credentials or environment identifiers belong here.
- Role names, retention periods, sponsor/participant visibility rules, and approval thresholds remain `TO VALIDATE`.
- Unknown authorization must remain denied.
- These drafts must receive owner/security approval, migration review, staging execution, positive/negative RLS tests, backup/restore proof, and rollback review before conversion into executable migrations.

## Files

1. `001_minimum_schema.sql` — minimum logical slice: organizations, people, transformations, memberships, intakes, intake answers, discovery, sources, decisions, source links, audit events.
2. `002_rls_policy_skeleton.sql` — Supabase-compatible policy helpers and default-deny RLS skeletons. Candidate role names are placeholders.
3. `003_negative_authorization_fixtures.sql` — non-executable test-case catalog expressed as SQL comments/queries for later staging conversion.

## Minimum live-flow hypothesis

`Secure Discovery Intake → Human Review → source-linked Transformation → Cherry Judgment Queue`

The hypothesis remains owner-unapproved.

## Conversion rule

Do not copy these files into a live migration directory until all applicable gates in `../PHASE2_SECURITY_RELEASE_CHECKLIST_2026-08-10.md` are satisfied or explicitly accepted as staged implementation gates.