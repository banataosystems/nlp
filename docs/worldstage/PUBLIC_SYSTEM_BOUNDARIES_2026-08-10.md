# WorldStage / Cherry — public system-boundary map

**Date:** 2026-08-10  
**State:** public evidence only; not an owner-confirmed systems-of-record inventory

## Purpose

Reduce the Phase 1 systems-of-record interview by documenting what can be observed safely from WorldStage's current public web surfaces without inferring private CRM, finance, participant or internal operations systems.

## Current public boundaries

### 1. Main WorldStage website

Observed public surface:

`https://worldstageinternational.com.ph/`

Current public behavior includes:

- primary corporate/solutions content;
- `Request a Discovery Session` routing to the public contact surface;
- public phone/email contact details;
- separate solution pages for team building/culture development, learning & development and keynote/motivation;
- an external `Book` link to a separate shop domain;
- a public chat widget is present in the rendered site.

**Candidate boundary:** public discovery/marketing/contact entry point.

**Not proven:** the main website is not evidence of the internal CRM, proposal system, client record, calendar, participant database or finance source of truth.

### 2. WorldStage Events subdomain

Observed public surface:

`https://events.worldstageinternational.com.ph/`

Observed public event flow includes:

- event landing pages;
- ticket/product surfaces;
- contact information;
- a ticket-order path under `/tickets/` / `/tickets/order.php`;
- completed/ended ticket-sale states remain publicly reachable.

**Candidate boundary:** public event/ticket acquisition flow distinct from the main corporate discovery surface.

**Not proven:** the public event flow does not prove how registrations, payment settlement, attendee records, invoices, reconciliation or post-event follow-up are stored internally.

### 3. External shop boundary

The current main site exposes a `Book` link to `hitpay.shop`.

**Candidate boundary:** separate public commerce/payment surface for at least some book/product transactions.

**Not proven:** do not infer that HitPay is WorldStage's canonical payment processor for corporate engagements, event tickets, invoices or all products.

## Product implication

The adaptive system should not assume one generic funnel.

Public evidence supports at least three potentially distinct entry paths:

1. **Corporate discovery** — main WorldStage site/contact/discovery request.
2. **Public events** — event landing/ticket flow.
3. **Public commerce** — external shop/book flow.

Until owner validation, keep these as separate candidate adapters feeding a shared relationship/transformation model rather than forcing them into one sales pipeline.

## Phase 1 owner-validation delta

Owner/team only needs to correct or complete the unknown internal side of each boundary:

- Where does a corporate discovery request go after public contact?
- Where do event registrations and attendee truth live?
- Which system owns payment confirmation/reconciliation for each transaction type?
- Is the external shop current and what products use it?
- What system owns proposals/contracts for corporate engagements?
- What system owns calendars/logistics?
- What system owns participant forms/surveys?
- What system owns post-intervention evidence and follow-up?

## Privacy / governance

This file contains only public architectural observations. It intentionally excludes connected private account identifiers, credentials, project IDs, client data and internal-provider assumptions.
