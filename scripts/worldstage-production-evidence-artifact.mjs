import { sha256Object } from './worldstage-production-evidence-verification-adapter.mjs';

const REQUIRED = Object.freeze(['prior_run','live_staging','physical_device','rollback','governance']);
const REPOSITORY = 'banataosystems/nlp';
const PROJECT = 'worldstage-cherry';

export function assembleProductionEvidenceArtifact({
  sourceSha,
  priorRunId,
  priorRunArtifactName,
  previewDeploymentId,
  evidence,
}) {
  if (!/^[a-f0-9]{40}$/.test(sourceSha || '')) throw new Error('Exact source SHA required');
  if (!Number.isInteger(priorRunId) || priorRunId <= 0) throw new Error('Positive prior run id required');
  if (!priorRunArtifactName || typeof priorRunArtifactName !== 'string') throw new Error('Prior artifact name required');
  if (!previewDeploymentId || typeof previewDeploymentId !== 'string') throw new Error('Preview deployment id required');
  const artifactsByDigest = {};
  const references = {};
  for (const section of REQUIRED) {
    const item = evidence?.[section];
    if (!item || typeof item !== 'object') throw new Error(`Missing ${section} evidence`);
    if (item.project_key !== PROJECT || item.repository !== REPOSITORY || item.source_sha !== sourceSha) {
      throw new Error(`${section} evidence scope/source mismatch`);
    }
    const digest = sha256Object(item);
    references[section] = { algorithm: 'sha256', digest };
    artifactsByDigest[digest] = item;
  }
  const bundle = {
    schema: 'worldstage.production-evidence-artifact.v1',
    project_key: PROJECT,
    repository: REPOSITORY,
    source_sha: sourceSha,
    prior_run_id: priorRunId,
    prior_run_artifact_name: priorRunArtifactName,
    preview_deployment_id: previewDeploymentId,
    grants_production_authority: false,
    d23_still_required: true,
    separate_release_authorization_required: true,
    references,
  };
  return { bundle, artifactsByDigest, bundleDigest: sha256Object(bundle) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const outDir = path.resolve(process.env.WORLDSTAGE_RELEASE_CONTROL_DIR || 'artifacts/release-control');
  const evidenceDir = path.resolve(process.env.WORLDSTAGE_EVIDENCE_DIR || `${outDir}/upstream`);
  const read = (name) => JSON.parse(fs.readFileSync(path.join(evidenceDir, `${name}.json`), 'utf8'));
  const result = assembleProductionEvidenceArtifact({
    sourceSha: process.env.WORLDSTAGE_SOURCE_SHA,
    priorRunId: Number(process.env.WORLDSTAGE_PRIOR_EVIDENCE_RUN_ID),
    priorRunArtifactName: process.env.WORLDSTAGE_PRIOR_EVIDENCE_ARTIFACT_NAME,
    previewDeploymentId: process.env.WORLDSTAGE_VERIFIED_PREVIEW_DEPLOYMENT_ID,
    evidence: Object.fromEntries(REQUIRED.map((name) => [name, read(name)])),
  });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'production-evidence-bundle.json'), `${JSON.stringify(result.bundle, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'upstream-artifacts-by-digest.json'), `${JSON.stringify(result.artifactsByDigest, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'production-evidence-bundle.sha256'), `${result.bundleDigest}\n`);
  console.log(`[worldstage-production-evidence-artifact] bundle_sha256=${result.bundleDigest}`);
}
