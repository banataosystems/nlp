# WorldStage / Cherry — Production redeploy evidence

**Observed:** 2026-08-10 03:16:32 Asia/Manila  
**Project:** `cherrypua`  
**Project ID:** `prj_ebP53cux8LAB18VFiKlgfP3ew2RH`  
**Production alias:** `https://cherrypua.vercel.app`

## Current production deployment

- Deployment ID: `dpl_FqWgsBsTWiLzMN2MsdogPEaY5mC1`
- Deployment URL: `cherrypua-ir2ltlli6-mbanatao-dc676069.vercel.app`
- State: `READY`
- Target: `production`
- Region: `iad1`
- Source reported by Vercel: `redeploy`
- Vercel metadata action: `redeploy`
- Original deployment ID: `dpl_DsM6JwHMZbmiuzSwXNswvhqwhF5s`

## Provenance conclusion

This production event is a **redeploy of the original production artifact**. It is not a Git deployment of PR #1 and does not establish automatic Git → Vercel integration.

Vercel did not report Git repository, branch, or commit metadata for this production deployment. Therefore:

- do not claim that `redesign/mobile-first-v2` is deployed;
- do not claim that PR head `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1` is in production;
- do not use production availability as proof of the mobile-v2 release;
- preserve the existing release gate requiring exact source → deployment provenance.

## Production smoke after redeploy

Verification performed after the redeploy:

- `https://cherrypua.vercel.app/src/app.js` returned HTTP 200.
- The served runtime contains the original baseline four-route application (`home`, `discovery`, `cockpit`, `client`).
- The served runtime still exposes the original client-supplied Discovery flow and demo Cherry OS data model rather than the mobile-v2 safety modules.
- Vercel runtime-error aggregation for the post-redeploy window returned no runtime errors.

## Source correlation

The current production runtime begins with the same source constants and route model as `main/src/app.js`, whose Git blob SHA is:

`c3db4396c9286ccedf4d157b784dd3d0269273b8`

This supports the Vercel redeploy metadata conclusion that production remains on the original baseline artifact. It is not a byte-for-byte cryptographic deployment attestation because Vercel does not expose a Git source commit for this deployment.

## Active branch state

The active implementation line remains:

- branch: `redesign/mobile-first-v2`
- PR: #1 — `WorldStage mobile-first recovery v2`
- last exact-source automated+visual proof before this documentation-only provenance update: `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1`
- mobile-v2 production deployment: **NOT PERFORMED**

## Release gate impact

This redeploy does not close the release provenance gap. Before mobile-v2 production promotion, one of the following must exist:

1. proven Git → Vercel project binding with exact commit metadata, or
2. another traceable deployment mechanism that records exact source commit → build → deployment ID.

After promotion, production must still receive exact smoke verification, real-phone review, and rollback proof.

## Governance note

Pandora Memory synchronization was not available while this evidence was recorded. This repository document is therefore a durable fallback record and must not be represented as already synchronized into Pandora Memory.
