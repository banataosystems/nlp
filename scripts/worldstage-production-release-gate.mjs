import { validateLedger } from './worldstage-decision-evidence-check.mjs';
import { validateInputAcceptedByProductionReleaseGate, sha256Object } from './worldstage-production-gate-consumption.mjs';

const REQUIRED = Object.freeze(Array.from({length:24}, (_,i)=>`D${i+1}`));
const PROJECT = 'worldstage-cherry';
const REPOSITORY = 'banataosystems/nlp';

function blocker(code, detail) { return { code, detail }; }

export function evaluateProductionReleaseGate({ consumedEvidence, ledgerMarkdown, context }) {
  const blockers = [];
  const schemaCheck = validateInputAcceptedByProductionReleaseGate(consumedEvidence);
  if (!schemaCheck.accepted) blockers.push(blocker('CONSUMED_ADAPTER_EVIDENCE_INVALID', schemaCheck.errors));

  if (consumedEvidence?.project_key !== PROJECT || consumedEvidence?.repository !== REPOSITORY) blockers.push(blocker('PRODUCTION_SCOPE_INVALID','Unexpected project/repository'));
  if (consumedEvidence?.source_sha !== context?.sourceSha) blockers.push(blocker('PRODUCTION_SOURCE_DRIFT','Consumed evidence must match checked-out source'));
  if (consumedEvidence?.release_run_id !== context?.currentRunId) blockers.push(blocker('PRODUCTION_RELEASE_RUN_DRIFT','Consumed evidence must belong to current release run'));
  if (consumedEvidence?.release_run_attempt !== context?.currentRunAttempt) blockers.push(blocker('PRODUCTION_RELEASE_ATTEMPT_DRIFT','Consumed evidence must belong to current release attempt'));
  if (consumedEvidence?.prior_run_id !== context?.expectedPriorRunId) blockers.push(blocker('PRODUCTION_PRIOR_RUN_DRIFT','Prior evidence run mismatch'));
  if (consumedEvidence?.prior_run_artifact_name !== context?.expectedPriorArtifactName) blockers.push(blocker('PRODUCTION_PRIOR_ARTIFACT_DRIFT','Prior evidence artifact mismatch'));
  if (consumedEvidence?.preview_deployment_id !== context?.expectedPreviewDeploymentId) blockers.push(blocker('PRODUCTION_PREVIEW_DRIFT','Verified preview deployment mismatch'));
  if (context?.productionDeploymentId && context.productionDeploymentId === context.expectedPreviewDeploymentId) blockers.push(blocker('PRODUCTION_PREVIEW_IDENTITY_COLLISION','Preview and production deployment must remain distinct'));

  const ledger = validateLedger(ledgerMarkdown || '');
  if (ledger.errors.length) blockers.push(blocker('PRODUCTION_DECISION_EVIDENCE_INVALID', ledger.errors));
  const missing = REQUIRED.filter((id) => !ledger.rows.has(id));
  if (missing.length) blockers.push(blocker('PRODUCTION_DECISIONS_MISSING', missing));
  const open = REQUIRED.filter((id) => ledger.rows.get(id) !== 'RESOLVED');
  if (open.length) blockers.push(blocker('PRODUCTION_DECISIONS_OPEN', open));
  if (ledger.rows.get('D23') !== 'RESOLVED') blockers.push(blocker('PRODUCTION_RELEASE_AUTHORITY_MISSING','D23 must be RESOLVED with complete evidence'));

  const accepted = blockers.length === 0;
  const evidenceDigest = consumedEvidence && typeof consumedEvidence === 'object' ? sha256Object(consumedEvidence) : null;
  return {
    schema: 'worldstage.production-release-gate-result.v2',
    project_key: PROJECT,
    repository: REPOSITORY,
    source_sha: context?.sourceSha || null,
    release_run_id: context?.currentRunId || null,
    release_run_attempt: context?.currentRunAttempt || null,
    readiness: accepted ? 'READY_FOR_EXPLICIT_PRODUCTION_RELEASE' : 'BLOCKED',
    accepted,
    blockers,
    consumed_evidence_digest: evidenceDigest,
    grants_production_authority: false,
    separate_release_action_required: true,
    typed_confirmation_alone_is_sufficient: false,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.resolve(process.env.WORLDSTAGE_RELEASE_CONTROL_DIR || 'artifacts/release-control');
  const consumedPathIndex = process.argv.indexOf('--consumed-evidence');
  const consumedPath = consumedPathIndex >= 0 && process.argv[consumedPathIndex + 1]
    ? path.resolve(process.argv[consumedPathIndex + 1])
    : path.join(dir, 'consumed-adapter-evidence.json');
  const ledgerPath = path.resolve(process.env.WORLDSTAGE_DECISION_LEDGER_PATH || 'docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md');
  const consumedEvidence = JSON.parse(fs.readFileSync(consumedPath, 'utf8'));
  const ledgerMarkdown = fs.readFileSync(ledgerPath, 'utf8');
  const context = {
    sourceSha: process.env.WORLDSTAGE_SOURCE_SHA,
    currentRunId: Number(process.env.GITHUB_RUN_ID || process.env.WORLDSTAGE_RELEASE_RUN_ID),
    currentRunAttempt: Number(process.env.GITHUB_RUN_ATTEMPT || process.env.WORLDSTAGE_RELEASE_RUN_ATTEMPT || 1),
    expectedPriorRunId: Number(process.env.WORLDSTAGE_PRIOR_EVIDENCE_RUN_ID),
    expectedPriorArtifactName: process.env.WORLDSTAGE_PRIOR_EVIDENCE_ARTIFACT_NAME,
    expectedPreviewDeploymentId: process.env.WORLDSTAGE_VERIFIED_PREVIEW_DEPLOYMENT_ID,
    productionDeploymentId: process.env.WORLDSTAGE_PRODUCTION_DEPLOYMENT_ID || null,
  };
  const result = evaluateProductionReleaseGate({ consumedEvidence, ledgerMarkdown, context });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'production-release-gate-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`[worldstage-production-release-gate] readiness=${result.readiness}`);
  if (process.argv.includes('--require-ready') && !result.accepted) process.exitCode = 2;
}
