export function validateReviewedPrProvenance({ sourceSha, pullRequests, workflowRuns, requiredBase='main', requiredWorkflowPath='.github/workflows/mobile-contract.yml' }) {
  const errors = [];
  if (!/^[a-f0-9]{40}$/.test(sourceSha || '')) errors.push('SOURCE_SHA_INVALID');
  const prs = Array.isArray(pullRequests) ? pullRequests : [];
  const runs = Array.isArray(workflowRuns) ? workflowRuns : [];
  const merged = prs.filter((pr) => pr?.merged_at && pr?.base?.ref === requiredBase);
  if (merged.length === 0) errors.push('MERGED_PR_PROVENANCE_MISSING');
  const exactSuccess = runs.filter((run) => run?.head_sha === sourceSha && run?.event === 'pull_request' && run?.conclusion === 'success' && run?.path === requiredWorkflowPath);
  if (exactSuccess.length === 0) errors.push('EXACT_SOURCE_MANDATORY_CI_MISSING');
  return {
    accepted: errors.length === 0,
    source_sha: sourceSha,
    qualifying_pr_numbers: merged.map((pr) => pr.number),
    qualifying_ci_run_ids: exactSuccess.map((run) => run.id),
    errors,
  };
}
