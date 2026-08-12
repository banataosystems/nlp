import crypto from 'node:crypto';

const SECTION_RULES = Object.freeze({
  prior_run: 'worldstage.prior-run-evidence.v1',
  live_staging: 'worldstage.live-staging-evidence.v1',
  physical_device: 'worldstage.physical-device-acceptance.v1',
  rollback: 'worldstage.rollback-evidence.v1',
  governance: 'worldstage.governance-evidence.v1',
});

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256Object(value) {
  return crypto.createHash('sha256').update(stable(value)).digest('hex');
}

function fail(code, section, detail) {
  return { code, section, detail };
}

function hasSensitiveShape(value, path = '') {
  if (!value || typeof value !== 'object') return null;
  const forbidden = /(token|secret|password|credential|private[_-]?key|api[_-]?key|authorization|cookie|session|email|phone|address|client[_-]?name|person[_-]?name)/i;
  for (const [key, child] of Object.entries(value)) {
    const next = path ? `${path}.${key}` : key;
    if (forbidden.test(key)) return next;
    const nested = hasSensitiveShape(child, next);
    if (nested) return nested;
  }
  return null;
}

function verifyCommon(section, evidence, expectedSchema, sourceSha, repository) {
  const errors = [];
  if (!evidence || typeof evidence !== 'object') return [fail('UPSTREAM_EVIDENCE_MISSING', section, 'Referenced evidence object is missing')];
  if (evidence.schema !== expectedSchema) errors.push(fail('UPSTREAM_SCHEMA_INVALID', section, `Expected ${expectedSchema}`));
  if (evidence.project_key !== 'worldstage-cherry') errors.push(fail('PROJECT_KEY_MISMATCH', section, 'Wrong project key'));
  if (evidence.repository !== repository) errors.push(fail('REPOSITORY_MISMATCH', section, 'Evidence repository differs from candidate repository'));
  if (evidence.source_sha !== sourceSha) errors.push(fail('SOURCE_SHA_MISMATCH', section, 'Evidence source differs from release candidate'));
  const sensitive = hasSensitiveShape(evidence);
  if (sensitive) errors.push(fail('SENSITIVE_EVIDENCE_FIELD', section, sensitive));
  return errors;
}

function verifySectionSpecific(section, evidence, bundle) {
  const errors = [];
  switch (section) {
    case 'prior_run':
      if (evidence.conclusion !== 'success') errors.push(fail('PRIOR_RUN_NOT_SUCCESS', section, 'Prior evidence run must be successful'));
      if (!Number.isInteger(evidence.run_id) || evidence.run_id <= 0) errors.push(fail('PRIOR_RUN_ID_INVALID', section, 'Positive numeric run id required'));
      if (evidence.artifact_name !== bundle.prior_run_artifact_name) errors.push(fail('PRIOR_RUN_ARTIFACT_NAME_MISMATCH', section, 'Artifact name differs from bundle binding'));
      if (evidence.run_id !== bundle.prior_run_id) errors.push(fail('PRIOR_RUN_ID_MISMATCH', section, 'Run id differs from bundle binding'));
      break;
    case 'live_staging':
      if (evidence.kind !== 'live-staging') errors.push(fail('LIVE_STAGING_KIND_INVALID', section, 'Synthetic/preview proof cannot satisfy live staging'));
      if (evidence.result !== 'PASS') errors.push(fail('LIVE_STAGING_NOT_PASS', section, 'Live staging result must be PASS'));
      if (evidence.confidential_data_used !== false) errors.push(fail('LIVE_STAGING_CONFIDENTIAL_DATA_INVALID', section, 'Confidential data use must be false for verification proof'));
      if (evidence.production_accessed !== false) errors.push(fail('LIVE_STAGING_PRODUCTION_ACCESS_INVALID', section, 'Production access must be false'));
      if (!evidence.preview_deployment_id || evidence.preview_deployment_id === evidence.production_deployment_id) errors.push(fail('DEPLOYMENT_ISOLATION_INVALID', section, 'Preview/staging and production deployment ids must be distinct'));
      break;
    case 'physical_device':
      if (evidence.result !== 'PASS') errors.push(fail('PHYSICAL_DEVICE_NOT_PASS', section, 'Physical-device acceptance must be PASS'));
      if (!evidence.reviewer_role || !['owner','authorized-reviewer'].includes(evidence.reviewer_role)) errors.push(fail('PHYSICAL_DEVICE_REVIEWER_INVALID', section, 'Authorized reviewer role required'));
      if (evidence.preview_deployment_id !== bundle.preview_deployment_id) errors.push(fail('PHYSICAL_DEVICE_DEPLOYMENT_MISMATCH', section, 'Physical-device proof must target the candidate preview'));
      break;
    case 'rollback':
      if (evidence.result !== 'VERIFIED') errors.push(fail('ROLLBACK_NOT_VERIFIED', section, 'Rollback proof must be VERIFIED'));
      if (!evidence.rollback_target_sha || evidence.rollback_target_sha === bundle.source_sha) errors.push(fail('ROLLBACK_TARGET_INVALID', section, 'Rollback target must be a distinct prior source'));
      if (evidence.production_mutated_during_proof !== false) errors.push(fail('ROLLBACK_PRODUCTION_MUTATION_INVALID', section, 'Rollback verification may not mutate production during proof'));
      break;
    case 'governance':
      if (!['SYNCED','APPROVED_EXCEPTION'].includes(evidence.status)) errors.push(fail('GOVERNANCE_NOT_ACCEPTED', section, 'Governance must be SYNCED or APPROVED_EXCEPTION'));
      if (evidence.status === 'APPROVED_EXCEPTION' && evidence.exception_approved !== true) errors.push(fail('GOVERNANCE_EXCEPTION_NOT_APPROVED', section, 'Governance exception must be explicitly approved'));
      break;
  }
  return errors;
}

export function verifyProductionEvidenceBundle({ bundle, artifactsByDigest }) {
  const errors = [];
  if (!bundle || typeof bundle !== 'object') return { verified: false, errors: [fail('BUNDLE_MISSING', null, 'Bundle is required')] };
  if (bundle.schema !== 'worldstage.production-evidence-artifact.v1') errors.push(fail('BUNDLE_SCHEMA_INVALID', null, 'Unexpected bundle schema'));
  if (bundle.project_key !== 'worldstage-cherry') errors.push(fail('BUNDLE_PROJECT_INVALID', null, 'Unexpected project key'));
  if (bundle.repository !== 'banataosystems/nlp') errors.push(fail('BUNDLE_REPOSITORY_INVALID', null, 'Unexpected repository'));
  if (!/^[a-f0-9]{40}$/.test(bundle.source_sha || '')) errors.push(fail('BUNDLE_SOURCE_SHA_INVALID', null, 'Exact 40-character source SHA required'));
  if (bundle.grants_production_authority !== false || bundle.d23_still_required !== true || bundle.separate_release_authorization_required !== true) {
    errors.push(fail('BUNDLE_AUTHORITY_FLAGS_INVALID', null, 'Bundle must remain explicitly non-authorizing'));
  }
  const refs = bundle.references;
  if (!refs || typeof refs !== 'object') errors.push(fail('BUNDLE_REFERENCES_MISSING', null, 'Content-addressed references required'));

  const verifiedSections = {};
  if (refs && typeof refs === 'object') {
    for (const [section, schema] of Object.entries(SECTION_RULES)) {
      const ref = refs[section];
      if (!ref || typeof ref !== 'object') {
        errors.push(fail('REFERENCE_MISSING', section, 'Required evidence reference missing'));
        continue;
      }
      if (ref.algorithm !== 'sha256' || !/^[a-f0-9]{64}$/.test(ref.digest || '')) {
        errors.push(fail('REFERENCE_DIGEST_INVALID', section, 'sha256 digest required'));
        continue;
      }
      const evidence = artifactsByDigest?.[ref.digest];
      if (!evidence) {
        errors.push(fail('REFERENCED_ARTIFACT_NOT_FOUND', section, ref.digest));
        continue;
      }
      const actual = sha256Object(evidence);
      if (actual !== ref.digest) {
        errors.push(fail('REFERENCED_ARTIFACT_DIGEST_MISMATCH', section, `Expected ${ref.digest}, got ${actual}`));
        continue;
      }
      errors.push(...verifyCommon(section, evidence, schema, bundle.source_sha, bundle.repository));
      errors.push(...verifySectionSpecific(section, evidence, bundle));
      verifiedSections[section] = { digest: ref.digest, schema: evidence.schema };
    }
  }

  const verified = errors.length === 0;
  return {
    schema: 'worldstage.production-evidence-verification-result.v1',
    project_key: 'worldstage-cherry',
    source_sha: bundle.source_sha || null,
    verified,
    errors,
    verified_sections: verified ? verifiedSections : {},
    production_gate_input: verified ? {
      schema: 'worldstage.production-gate-evidence-input.v1',
      project_key: 'worldstage-cherry',
      repository: bundle.repository,
      source_sha: bundle.source_sha,
      prior_run_id: bundle.prior_run_id,
      prior_run_artifact_name: bundle.prior_run_artifact_name,
      preview_deployment_id: bundle.preview_deployment_id,
      evidence_bundle_digest: sha256Object(bundle),
      verified_section_digests: Object.fromEntries(Object.entries(verifiedSections).map(([k,v]) => [k,v.digest])),
      grants_production_authority: false,
      d23_still_required: true,
      separate_release_authorization_required: true
    } : null
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.resolve(process.env.WORLDSTAGE_RELEASE_CONTROL_DIR || 'artifacts/release-control');
  const bundle = JSON.parse(fs.readFileSync(path.join(dir, 'production-evidence-bundle.json'), 'utf8'));
  const artifactsByDigest = JSON.parse(fs.readFileSync(path.join(dir, 'upstream-artifacts-by-digest.json'), 'utf8'));
  const result = verifyProductionEvidenceBundle({ bundle, artifactsByDigest });
  fs.writeFileSync(path.join(dir, 'adapter-verification-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`[worldstage-production-evidence-adapter] verified=${result.verified}`);
  if (process.argv.includes('--require-verified') && !result.verified) process.exitCode = 2;
}
