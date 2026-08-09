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

This production event is a **redeploy of the original production artifact**. It is not a Git deployment of PR #1 and is not evidence that mobile-v2 has been promoted to production.

Vercel did not report Git repository, branch, or commit metadata for this specific production deployment. Therefore:

- do not claim that `redesign/mobile-first-v2` is in production;
- do not claim that PR product-code head `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1` is in production;
- do not use production availability as proof of the mobile-v2 release.

### Important later evidence

After this redeploy was observed, exact Git → Vercel **preview** binding was independently proven for `redesign/mobile-first-v2`.

Verified example:

- preview deployment: `dpl_2VtuQnr9JV7hZuioNALtpXg3esBX`
- source: `git`
- branch: `redesign/mobile-first-v2`
- exact Git commit: `80d0e1e28de421c0c52586b830ba205e599c9785`
- state: `READY`

Vercel build logs show an exact clone of `github.com/banataosystems/nlp`, branch `redesign/mobile-first-v2`, commit `80d0e1e`, followed by a successful Vercel CLI 58.1.0 build and deployment.

Therefore the current distinction is:

- Git → Vercel preview binding: **PROVEN**;
- mobile-v2 protected preview: **PROVEN / READY**;
- mobile-v2 production promotion: **NOT PERFORMED**;
- current production: **original baseline redeploy**.

See `docs/worldstage/GIT_VERCEL_BINDING_EVIDENCE_2026-08-10.md`.

## Production smoke after redeploy

Verification performed after the redeploy:

- `https://cherrypua.vercel.app/src/app.js` returned HTTP 200.
- The served runtime contains the original baseline four-route application (`home`, `discovery`, `cockpit`, `client`).
- The served runtime still exposes the original client-supplied Discovery flow and demo Cherry OS data model rather than the mobile-v2 safety modules.
- Vercel runtime-error aggregation for the post-redeploy window returned no runtime errors.

## Source correlation

The current production runtime begins with the same source constants and route model as `main/src/app.js`, whose Git blob SHA is:

`c3db4396c9286ccedf4d157b784dd3d0269273b8`

This supports the Vercel redeploy metadata conclusion that production remains on the original baseline artifact. It is not a byte-for-byte cryptographic deployment attestation because this production deployment does not expose a Git source commit.

## Active branch state

The active implementation line remains:

- branch: `redesign/mobile-first-v2`
- PR: #1 — `WorldStage mobile-first recovery v2`
- latest product-code automated+visual proof: `be41775eb6bae9c7e1d569ee6b2fa58d382d77d1`
- repeatable protected Git previews: **verified**
- mobile-v2 production deployment: **NOT PERFORMED**

## Release gate impact

The preview provenance gap is now closed. The remaining production gate is no longer “prove that Git can create traceable previews.” It is:

1. validate the exact release candidate on a real device using a protected Git-linked preview;
2. satisfy owner/business/content/privacy gates;
3. explicitly authorize production promotion;
4. deploy the exact approved source through a traceable mechanism;
5. record exact source → production deployment provenance;
6. perform production smoke, real-phone verification, and rollback proof.

The repository also contains a manual traceable release workflow at `.github/workflows/vercel-traceable-release.yml`. It is manual-only and has not been dispatched in this work session.

## Governance note

Pandora Memory synchronization was not available while this evidence was recorded. This repository document is therefore a durable fallback record and must not be represented as already synchronized into Pandora Memory.
