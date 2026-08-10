-- WORLDSTAGE / CHERRY PHASE 2 — NON-DEPLOYED SQL DRAFT
-- DO NOT APPLY. This file is intentionally outside any migration directory.
-- Runtime-alignment design adjustment only.
--
-- Purpose:
-- 1) receipt codes are opaque public-safe strings generated server-side, not raw UUIDs;
-- 2) idempotency is scoped to the authenticated/bound submitter context, not globally by key;
-- 3) different actors may reuse the same client-generated key without seeing each other's receipt.

-- Server owns receipt generation. The public shape may be `WS-...` and must remain opaque.
alter table ws_intakes
  alter column receipt_code drop default;

alter table ws_intakes
  alter column receipt_code type text using receipt_code::text;

-- The minimum schema originally declared a global UNIQUE idempotency key. That is too broad:
-- two unrelated authenticated/bound actors could legitimately generate the same key.
alter table ws_intakes
  drop constraint if exists ws_intakes_idempotency_key_key;

alter table ws_intakes
  add column if not exists idempotency_actor_scope text;

-- Actor scope is server-derived from the authenticated user or bound invitation identity.
-- The browser cannot supply or override this value.
-- Do not derive scope from email domain, organization name, client-supplied role, or local storage.
create unique index if not exists ws_intakes_actor_idempotency_unique
  on ws_intakes (idempotency_actor_scope, idempotency_key)
  where idempotency_key is not null and idempotency_actor_scope is not null;

-- No global unique index on idempotency_key should remain after this design adjustment.
-- No receipt lookup may disclose internal intake UUID, actor scope, organization/transformation IDs,
-- reviewer identity, internal sensitivity labels, or existence of other actors' submissions.
