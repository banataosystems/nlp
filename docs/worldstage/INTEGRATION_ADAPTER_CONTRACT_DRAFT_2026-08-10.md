# WorldStage / Cherry — integration adapter contract draft

**Date:** 2026-08-10  
**State:** provider-agnostic design; no private connector activated

## Purpose

Allow WorldStage's actual tools to be kept, wrapped or replaced later without forcing the business into a generic CRM or allowing one provider to become the architecture.

The system models WorldStage's transformation workflow first; adapters translate external systems into source-aware records.

## Core rule

**Adapters move evidence and actions across boundaries. They do not own business truth.**

A provider record must never silently become a canonical WorldStage fact merely because an API returned it.

## Candidate public entry adapters

Public evidence currently suggests at least three distinct inbound boundaries:

1. `CorporateDiscoveryAdapter` — main WorldStage discovery/contact path.
2. `PublicEventsAdapter` — WorldStage Events registration/ticket path.
3. `PublicCommerceAdapter` — external shop/book commerce path.

These are candidate architectural names only. They do not claim the current internal provider or source of truth is known.

## Standard source envelope

Every adapter should normalize inbound evidence to a provider-neutral envelope before business logic touches it:

```text
SourceEnvelope
- adapter_key
- provider_key
- source_object_type
- source_record_id
- source_version / etag if available
- observed_at
- source_timestamp if available
- payload_hash
- organization_hint (untrusted until matched/reviewed)
- person_hint (untrusted until matched/reviewed)
- transformation_hint (untrusted until matched/reviewed)
- classification_state
- consent_or_permission_reference if applicable
- access_scope
- raw_payload_pointer (private provider-side or approved private store; not public GitHub/Memory)
```

## Canonicalization boundary

An adapter may:

- normalize field names;
- validate signatures/authentication;
- deduplicate provider events;
- calculate payload hashes;
- attach source timestamps;
- create an internal review candidate;
- request a human/system match against known organization/person/transformation records.

An adapter may **not** independently:

- create owner authority;
- assign Cherry-level decision authority;
- change participant-private data to sponsor-visible;
- mark an intervention outcome as verified;
- publish a client claim;
- invent retention/deletion policy;
- enable AI eligibility;
- authorize payment/refund/commercial exceptions;
- authorize production release.

## Provider credential boundary

- credentials remain server-side;
- secrets are never stored in public GitHub, browser code, analytics or semantic memory;
- use minimum scopes;
- record credential owner and rotation/revocation path outside public code;
- every connector must degrade safely when credentials expire/revoke;
- one provider credential must not become a general cross-system superuser.

## Read vs write capability

Default capability for a new adapter:

`READ / RECEIVE ONLY`

Write-back requires a separate approved contract specifying:

- exact allowed mutation;
- actor/authority requirements;
- idempotency key;
- retry behavior;
- timeout;
- conflict behavior;
- audit event;
- rollback/compensation behavior;
- user-visible failure state.

No adapter gets broad `sync everything both ways` authority by default.

## Idempotency / replay

Every event-capable adapter must define a stable replay key from provider event ID, source record/version or equivalent.

Requirements:

- same event replay does not duplicate canonical work;
- changed provider record creates a new source version rather than silently overwriting provenance;
- replays cannot repeat consequential write-back;
- idempotency state follows approved retention policy and is not kept indefinitely by convenience.

## Degraded behavior

When a provider is unavailable:

- preserve last verified source state with timestamp;
- visibly mark freshness/staleness;
- do not fabricate replacement facts;
- do not convert stale data into an automated decision;
- queue only safe idempotent retries;
- relationship-sensitive or commercial actions requiring fresh provider state fail closed or require human review.

## Data minimization

An adapter should ingest only fields required for the approved workflow.

Examples:

- calendar adapter does not imply full mailbox ingestion;
- CRM/contact adapter does not imply participant-survey access;
- payment adapter does not imply raw card/payment credential storage;
- event adapter does not imply unrestricted participant-profile visibility;
- analytics adapter does not receive confidential Discovery text by default.

## Source deletion / revocation

If source access is revoked or a record is deleted:

- do not pretend the source still exists;
- preserve only the minimum audit/provenance evidence allowed by policy;
- mark linked derived facts as source-revoked/deleted where appropriate;
- re-evaluate AI/index eligibility;
- never use a cached private source to bypass current access restrictions.

## Cross-product isolation

WorldStage adapters must not directly read another Banatao product's application database.

Cross-product reuse must occur through versioned provider/platform contracts with scoped authorization, not shared-table convenience.

## Future candidate adapter families

Owner validation may eventually select providers for:

- Email / relationship communication
- Calendar / logistics
- Contacts / CRM
- Drive / documents
- Proposals / contracts
- Events / registration
- Payments / accounting
- Participant forms / surveys
- Fire University / LMS
- Analytics
- Messaging / follow-up
- Public website CMS

No provider is selected by this draft.

## Adapter readiness checklist

Before activating any adapter:

1. owner confirms system is actually used;
2. keep / wrap / replace / no-integration decision recorded;
3. data classes and fields approved;
4. source-of-truth role defined;
5. auth/scopes verified;
6. privacy/retention requirements defined;
7. read/write capabilities separated;
8. timeout/retry/idempotency/revocation defined;
9. audit behavior defined;
10. negative authorization/data-leak tests pass;
11. degraded mode tested;
12. rollback/disable path tested;
13. exact deployment evidence recorded.
