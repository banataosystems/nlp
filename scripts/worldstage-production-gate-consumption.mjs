import crypto from 'node:crypto';

const PROJECT_KEY = 'worldstage-cherry';
const REPOSITORY = 'banataosystems/nlp';
const REQUIRED_SECTIONS = Object.freeze(['prior_run','live_staging','physical_device','rollback','governance']);
const ADAPTER_RESULT_SCHEMA = 'worldstage.production-evidence-verification-result.v1';
const ADAPTER_ENVELOPE_SCHEMA = 'worldstage.production-evidence-verification-envelope.v1';
const ADAPTER_GATE_INPUT_SCHEMA = 'worldstage.production-gate-evidence-input.v1';
const CONSUMED_SCHEMA = 'worldstage.production-gate-consumed-evidence.v1';

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256Object(value) {
  return crypto.createHash('sha256').update(stable(value)).digest('hex');
}

function error(code, detail) { return { code, detail }; }

function exactDigestSet(digests) {
  if (!digests || typeof digests !== 'object' || Array.isArray(digests)) return false;
  const keys = Object.keys(digests).sort();
  const expected = [...REQUIRED_SECTIONS].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) return false;
  return expected.every((key) => /^[a-f0-9]{64}$/.test(digests[key] || ''));
}

function verificationSetDigest(digests) {
  return sha256Object(Object.fromEntries(REQUIRED_SECTIONS.map((section) => [section, digests[section]])));
}

function authorityFlagsAreNonAuthorizing(value) {
  return value?.grants_production_authority === false
    && value?.d23_still_required === true
    && value?.separate_release_authorization_required === true;
}

export function createAdapterVerificationEnvelope({ adapterResult, verificationRunId, verificationRunAttempt, generatedAt, expiresAt }) {
  if (!adapterResult || adapterResult.schema !== ADAPTER_RESULT_SCHEMA || adapterResult.verified !== true || !adapterResult.production_gate_input) {
    throw new Error('Only a successful production-evidence adapter result can be enveloped');
  }
  const gate = adapterResult.production_gate_input;
  if (gate.schema !== ADAPTER_GATE_INPUT_SCHEMA || !authorityFlagsAreNonAuthorizing(gate) || !exactDigestSet(gate.verified_section_digests)) {
    throw new Error('Adapter gate input is incomplete or authority-bearing');
  }
  const generated = new Date(generatedAt);
  const expires = new Date(expiresAt);
  if (!Number.isFinite(generated.getTime()) || !Number.isFinite(expires.getTime()) || expires <= generated) throw new Error('Valid generatedAt/expiresAt window required');
  return {
    schema: ADAPTER_ENVELOPE_SCHEMA, project_key: PROJECT_KEY, repository: REPOSITORY, source_sha: gate.source_sha,
    verification_run_id: verificationRunId, verification_run_attempt: verificationRunAttempt,
    prior_run_id: gate.prior_run_id, prior_run_artifact_name: gate.prior_run_artifact_name, preview_deployment_id: gate.preview_deployment_id,
    generated_at: generated.toISOString(), expires_at: expires.toISOString(), adapter_result_digest: sha256Object(adapterResult),
    upstream_verification_set_digest: verificationSetDigest(gate.verified_section_digests), adapter_result: adapterResult,
    grants_production_authority: false, d23_still_required: true, separate_release_authorization_required: true,
  };
}

export function consumeAdapterVerificationEnvelope({ envelope, context, consumedDigests = new Set() }) {
  const errors = [];
  if (!envelope || typeof envelope !== 'object') return { schema:'worldstage.production-gate-consumption-result.v1', accepted:false, errors:[error('ADAPTER_ENVELOPE_REQUIRED','Verified adapter envelope required')], consumed_evidence:null };
  if (envelope.schema !== ADAPTER_ENVELOPE_SCHEMA) {
    const rawCode = envelope.schema === 'worldstage.production-evidence-artifact.v1' ? 'RAW_BUNDLE_FORBIDDEN' : envelope.schema === ADAPTER_RESULT_SCHEMA || envelope.schema === ADAPTER_GATE_INPUT_SCHEMA ? 'UNCONSUMED_ADAPTER_OUTPUT_FORBIDDEN' : 'ADAPTER_ENVELOPE_SCHEMA_INVALID';
    errors.push(error(rawCode, 'Production gate consumption accepts only the current-run verified adapter envelope'));
  }
  if (envelope.project_key !== PROJECT_KEY) errors.push(error('PROJECT_KEY_MISMATCH','Unexpected project key'));
  if (envelope.repository !== REPOSITORY) errors.push(error('REPOSITORY_MISMATCH','Unexpected repository'));
  if (!authorityFlagsAreNonAuthorizing(envelope)) errors.push(error('ENVELOPE_AUTHORITY_FLAGS_INVALID','Envelope must be explicitly non-authorizing'));
  const adapterResult = envelope.adapter_result;
  if (!adapterResult || adapterResult.schema !== ADAPTER_RESULT_SCHEMA) errors.push(error('ADAPTER_RESULT_MISSING','Verified adapter result missing'));
  else {
    if (adapterResult.verified !== true || !Array.isArray(adapterResult.errors) || adapterResult.errors.length !== 0) errors.push(error('ADAPTER_RESULT_NOT_VERIFIED','Adapter result must be verified with zero errors'));
    if (sha256Object(adapterResult) !== envelope.adapter_result_digest) errors.push(error('ADAPTER_RESULT_DIGEST_MISMATCH','Adapter result digest mismatch'));
  }
  const gate = adapterResult?.production_gate_input;
  if (!gate || gate.schema !== ADAPTER_GATE_INPUT_SCHEMA) errors.push(error('ADAPTER_GATE_INPUT_MISSING','Adapter production gate input missing'));
  else {
    if (!authorityFlagsAreNonAuthorizing(gate)) errors.push(error('ADAPTER_GATE_AUTHORITY_FLAGS_INVALID','Adapter gate input must remain non-authorizing'));
    if (!exactDigestSet(gate.verified_section_digests)) errors.push(error('UPSTREAM_VERIFICATION_DIGEST_SET_INVALID','Exactly five independent upstream verification digests are required'));
    else if (verificationSetDigest(gate.verified_section_digests) !== envelope.upstream_verification_set_digest) errors.push(error('UPSTREAM_VERIFICATION_SET_BINDING_MISMATCH','Upstream verification digest set was changed after adapter verification'));
  }
  const now = new Date(context?.now), generated = new Date(envelope.generated_at), expires = new Date(envelope.expires_at);
  const maxAgeSeconds = Number(context?.maxAdapterAgeSeconds ?? 600);
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(generated.getTime()) || !Number.isFinite(expires.getTime())) errors.push(error('ADAPTER_TIME_INVALID','Valid gate/envelope timestamps required'));
  else {
    if (generated > now) errors.push(error('ADAPTER_OUTPUT_FROM_FUTURE','Adapter output cannot be from the future'));
    if (now > expires) errors.push(error('ADAPTER_OUTPUT_EXPIRED','Adapter output expired'));
    if ((now - generated) / 1000 > maxAgeSeconds) errors.push(error('ADAPTER_OUTPUT_STALE','Adapter output exceeded the maximum accepted age'));
  }
  if (!Number.isInteger(envelope.verification_run_id) || envelope.verification_run_id <= 0) errors.push(error('VERIFICATION_RUN_ID_INVALID','Positive verification run id required'));
  if (!Number.isInteger(envelope.verification_run_attempt) || envelope.verification_run_attempt <= 0) errors.push(error('VERIFICATION_RUN_ATTEMPT_INVALID','Positive verification run attempt required'));
  if (envelope.verification_run_id !== context?.currentRunId) errors.push(error('VERIFICATION_RUN_DRIFT','Adapter output must be generated in the current release workflow run'));
  if (envelope.verification_run_attempt !== context?.currentRunAttempt) errors.push(error('VERIFICATION_ATTEMPT_DRIFT','Adapter output must be generated in the current release workflow attempt'));
  if (envelope.source_sha !== context?.sourceSha || gate?.source_sha !== context?.sourceSha) errors.push(error('SOURCE_SHA_DRIFT','Adapter output must match exact checked-out release source'));
  if (envelope.prior_run_id !== context?.expectedPriorRunId || gate?.prior_run_id !== context?.expectedPriorRunId) errors.push(error('PRIOR_RUN_DRIFT','Prior evidence run differs from release request'));
  if (envelope.prior_run_id === context?.currentRunId) errors.push(error('PRIOR_RUN_REPLAY_INVALID','Prior evidence run must differ from current release run'));
  if (envelope.prior_run_artifact_name !== context?.expectedPriorArtifactName || gate?.prior_run_artifact_name !== context?.expectedPriorArtifactName) errors.push(error('PRIOR_ARTIFACT_DRIFT','Prior evidence artifact name differs from release request'));
  if (envelope.preview_deployment_id !== context?.expectedPreviewDeploymentId || gate?.preview_deployment_id !== context?.expectedPreviewDeploymentId) errors.push(error('PREVIEW_DEPLOYMENT_DRIFT','Verified preview deployment differs from release request'));
  const envelopeDigest = sha256Object(envelope);
  if (consumedDigests.has(envelopeDigest)) errors.push(error('ADAPTER_OUTPUT_REPLAYED_IN_ATTEMPT','This exact adapter output has already been consumed in the current attempt'));
  const accepted = errors.length === 0;
  if (accepted) consumedDigests.add(envelopeDigest);
  return {
    schema: 'worldstage.production-gate-consumption-result.v1', project_key: PROJECT_KEY, source_sha: context?.sourceSha || null, accepted, errors,
    consumed_evidence: accepted ? {
      schema: CONSUMED_SCHEMA, project_key: PROJECT_KEY, repository: REPOSITORY, source_sha: context.sourceSha,
      release_run_id: context.currentRunId, release_run_attempt: context.currentRunAttempt,
      prior_run_id: context.expectedPriorRunId, prior_run_artifact_name: context.expectedPriorArtifactName,
      preview_deployment_id: context.expectedPreviewDeploymentId, adapter_envelope_digest: envelopeDigest,
      adapter_result_digest: envelope.adapter_result_digest, evidence_bundle_digest: gate.evidence_bundle_digest,
      verified_section_digests: gate.verified_section_digests, upstream_verification_set_digest: envelope.upstream_verification_set_digest,
      grants_production_authority: false, d23_still_required: true, separate_release_authorization_required: true
    } : null,
  };
}

export function validateInputAcceptedByProductionReleaseGate(input) {
  const errors = [];
  if (!input || input.schema !== CONSUMED_SCHEMA) {
    errors.push(error('CONSUMED_ADAPTER_EVIDENCE_REQUIRED','Production release gate accepts only consumed verified-adapter evidence'));
    return { accepted:false, errors };
  }
  if (input.project_key !== PROJECT_KEY || input.repository !== REPOSITORY) errors.push(error('CONSUMED_SCOPE_INVALID','Unexpected project/repository'));
  if (!/^[a-f0-9]{40}$/.test(input.source_sha || '')) errors.push(error('CONSUMED_SOURCE_INVALID','Exact source SHA required'));
  if (!/^[a-f0-9]{64}$/.test(input.adapter_envelope_digest || '') || !/^[a-f0-9]{64}$/.test(input.adapter_result_digest || '') || !/^[a-f0-9]{64}$/.test(input.evidence_bundle_digest || '')) errors.push(error('CONSUMED_DIGEST_BINDING_INVALID','Adapter/bundle digests required'));
  if (!exactDigestSet(input.verified_section_digests)) errors.push(error('CONSUMED_UPSTREAM_DIGESTS_INVALID','All independent upstream verification digests required'));
  else if (verificationSetDigest(input.verified_section_digests) !== input.upstream_verification_set_digest) errors.push(error('CONSUMED_UPSTREAM_SET_MISMATCH','Upstream verification set binding mismatch'));
  if (!authorityFlagsAreNonAuthorizing(input)) errors.push(error('CONSUMED_AUTHORITY_FLAGS_INVALID','Consumed evidence must not grant release authority'));
  return { accepted: errors.length === 0, errors };
}

export function validateProductionWorkflowPlacement(workflowText) {
  const required = ['Verify production evidence bundle with adapter','Consume verified production evidence for release gate','Run machine-readable production release gate','Verify Vercel credential is configured','Pull Vercel project configuration','Build exact source for Vercel','Deploy prebuilt artifact'];
  const positions = Object.fromEntries(required.map((name) => [name, workflowText.indexOf(`name: ${name}`)]));
  const errors = [];
  for (const [name, pos] of Object.entries(positions)) if (pos < 0) errors.push(error('WORKFLOW_STEP_MISSING', name));
  if (errors.length) return { accepted:false, errors };
  const order = required.map((name) => positions[name]);
  for (let i = 1; i < order.length; i += 1) if (order[i] <= order[i - 1]) errors.push(error('WORKFLOW_ORDER_INVALID', `${required[i - 1]} must precede ${required[i]}`));
  const consumerBlock = workflowText.slice(positions['Consume verified production evidence for release gate'], positions['Run machine-readable production release gate']);
  const gateBlock = workflowText.slice(positions['Run machine-readable production release gate'], positions['Verify Vercel credential is configured']);
  if (!consumerBlock.includes('worldstage-production-gate-consumption.mjs')) errors.push(error('CONSUMER_SCRIPT_NOT_INVOKED','Consumption step must invoke the gate-consumption script'));
  if (!gateBlock.includes('worldstage.production-gate-consumed-evidence.v1') && !gateBlock.includes('consumed-adapter-evidence.json')) errors.push(error('PRODUCTION_GATE_CONSUMED_INPUT_MISSING','Production gate must consume only consumed adapter evidence'));
  if (gateBlock.includes('production-evidence-artifact.v1') || gateBlock.includes('raw-production-evidence')) errors.push(error('RAW_BUNDLE_GATE_PATH_FORBIDDEN','Raw evidence bundle must never feed production gate directly'));
  return { accepted: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.resolve(process.env.WORLDSTAGE_RELEASE_CONTROL_DIR || 'artifacts/release-control');
  const adapterResult = JSON.parse(fs.readFileSync(path.join(dir, 'adapter-verification-result.json'), 'utf8'));
  const now = process.env.WORLDSTAGE_GATE_NOW || new Date().toISOString();
  const generatedAt = process.env.WORLDSTAGE_ADAPTER_GENERATED_AT || now;
  const maxAgeSeconds = Number(process.env.WORLDSTAGE_ADAPTER_MAX_AGE_SECONDS || 600);
  const expiresAt = process.env.WORLDSTAGE_ADAPTER_EXPIRES_AT || new Date(new Date(generatedAt).getTime() + maxAgeSeconds * 1000).toISOString();
  let envelope;
  try {
    envelope = createAdapterVerificationEnvelope({ adapterResult, verificationRunId: Number(process.env.GITHUB_RUN_ID || process.env.WORLDSTAGE_RELEASE_RUN_ID), verificationRunAttempt: Number(process.env.GITHUB_RUN_ATTEMPT || process.env.WORLDSTAGE_RELEASE_RUN_ATTEMPT || 1), generatedAt, expiresAt });
  } catch (cause) {
    console.error(`[worldstage-production-gate-consumption] envelope_error=${cause.message}`);
    process.exitCode = 2;
  }
  if (envelope) {
    const statePath = path.join(dir, 'consumption-state.json');
    let state = { run_id: Number(process.env.GITHUB_RUN_ID || process.env.WORLDSTAGE_RELEASE_RUN_ID), run_attempt: Number(process.env.GITHUB_RUN_ATTEMPT || process.env.WORLDSTAGE_RELEASE_RUN_ATTEMPT || 1), consumed: [] };
    if (fs.existsSync(statePath)) {
      const prior = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (prior.run_id === state.run_id && prior.run_attempt === state.run_attempt && Array.isArray(prior.consumed)) state = prior;
    }
    const consumedDigests = new Set(state.consumed);
    const context = { sourceSha: process.env.WORLDSTAGE_SOURCE_SHA, currentRunId: state.run_id, currentRunAttempt: state.run_attempt, expectedPriorRunId: Number(process.env.WORLDSTAGE_PRIOR_EVIDENCE_RUN_ID), expectedPriorArtifactName: process.env.WORLDSTAGE_PRIOR_EVIDENCE_ARTIFACT_NAME, expectedPreviewDeploymentId: process.env.WORLDSTAGE_VERIFIED_PREVIEW_DEPLOYMENT_ID, now, maxAdapterAgeSeconds: maxAgeSeconds };
    const result = consumeAdapterVerificationEnvelope({ envelope, context, consumedDigests });
    fs.writeFileSync(path.join(dir, 'adapter-verification-envelope.json'), `${JSON.stringify(envelope, null, 2)}\n`);
    fs.writeFileSync(path.join(dir, 'gate-consumption-result.json'), `${JSON.stringify(result, null, 2)}\n`);
    if (result.accepted) {
      fs.writeFileSync(path.join(dir, 'consumed-adapter-evidence.json'), `${JSON.stringify(result.consumed_evidence, null, 2)}\n`);
      state.consumed = [...consumedDigests];
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    }
    console.log(`[worldstage-production-gate-consumption] accepted=${result.accepted}`);
    if (process.argv.includes('--require-consumed') && !result.accepted) process.exitCode = 2;
  }
}
