import { assembleProductionEvidenceArtifact } from './worldstage-production-evidence-artifact.mjs';
import { verifyProductionEvidenceBundle } from './worldstage-production-evidence-verification-adapter.mjs';
import { createAdapterVerificationEnvelope, consumeAdapterVerificationEnvelope } from './worldstage-production-gate-consumption.mjs';
import { evaluateProductionReleaseGate } from './worldstage-production-release-gate.mjs';

export function evaluateAtomicProductionReleaseControl({ evidence, ledgerMarkdown, context, consumedDigests = new Set() }) {
  const assembled = assembleProductionEvidenceArtifact({
    sourceSha: context.sourceSha,
    priorRunId: context.expectedPriorRunId,
    priorRunArtifactName: context.expectedPriorArtifactName,
    previewDeploymentId: context.expectedPreviewDeploymentId,
    evidence,
  });
  const adapter = verifyProductionEvidenceBundle({ bundle: assembled.bundle, artifactsByDigest: assembled.artifactsByDigest });
  if (!adapter.verified) {
    return {
      schema:'worldstage.atomic-production-release-control-result.v1',
      stage:'adapter-verification',
      accepted:false,
      assembled_bundle_digest: assembled.bundleDigest,
      adapter,
      consumption:null,
      production_gate:null,
    };
  }
  const envelope = createAdapterVerificationEnvelope({
    adapterResult: adapter,
    verificationRunId: context.currentRunId,
    verificationRunAttempt: context.currentRunAttempt,
    generatedAt: context.adapterGeneratedAt,
    expiresAt: context.adapterExpiresAt,
  });
  const consumption = consumeAdapterVerificationEnvelope({ envelope, context, consumedDigests });
  if (!consumption.accepted) {
    return {
      schema:'worldstage.atomic-production-release-control-result.v1',
      stage:'gate-consumption',
      accepted:false,
      assembled_bundle_digest: assembled.bundleDigest,
      adapter,
      envelope,
      consumption,
      production_gate:null,
    };
  }
  const productionGate = evaluateProductionReleaseGate({ consumedEvidence: consumption.consumed_evidence, ledgerMarkdown, context });
  return {
    schema:'worldstage.atomic-production-release-control-result.v1',
    stage:'production-governance-gate',
    accepted: productionGate.accepted,
    assembled_bundle_digest: assembled.bundleDigest,
    adapter,
    envelope,
    consumption,
    production_gate: productionGate,
  };
}
