const STATES = new Set(['enabled', 'disabled']);

function validReason(reason) {
  return typeof reason === 'string' && reason.trim().length >= 10 && reason.trim().length <= 500;
}

async function intakeIsEnabled({ controlAdapter }) {
  if (!controlAdapter || typeof controlAdapter.readState !== 'function') return false;
  try {
    const state = await controlAdapter.readState();
    return state?.state === 'enabled';
  } catch {
    return false;
  }
}

async function changeIntakeState({
  desiredState,
  actor,
  reason,
  correlationId,
  authorizeControl,
  verifyReadiness,
  controlAdapter,
}) {
  if (!STATES.has(desiredState)) throw new Error('control_state_invalid');
  if (!actor || typeof actor.id !== 'string' || !actor.id) throw new Error('control_actor_required');
  if (!validReason(reason)) throw new Error('control_reason_invalid');
  if (!correlationId || typeof correlationId !== 'string') throw new Error('control_correlation_required');
  if (typeof authorizeControl !== 'function') throw new Error('control_authorization_not_configured');
  if (!controlAdapter || typeof controlAdapter.begin !== 'function') throw new Error('control_adapter_invalid');

  const action = desiredState === 'disabled' ? 'secure_intake:disable' : 'secure_intake:enable';
  const decision = await authorizeControl({ actor, action, desiredState });
  if (!decision || decision.allowed !== true || !decision.decision_id) {
    const error = new Error('control_not_authorized');
    error.code = 'control_not_authorized';
    throw error;
  }

  let readinessEvidence = null;
  if (desiredState === 'enabled') {
    if (typeof verifyReadiness !== 'function') throw new Error('enable_readiness_not_configured');
    const readiness = await verifyReadiness({ actor, action, desiredState });
    if (!readiness || readiness.ready !== true || !readiness.evidence_ref) {
      const error = new Error('enable_readiness_not_proven');
      error.code = 'enable_readiness_not_proven';
      throw error;
    }
    readinessEvidence = readiness.evidence_ref;
  }

  const tx = await controlAdapter.begin();
  let committed = false;
  try {
    const previous = await tx.readState();
    await tx.setState({ state: desiredState });
    await tx.insertAudit({
      action,
      outcome: 'applied',
      actor_id: actor.id,
      actor_type: actor.type || 'authorized_actor',
      correlation_id: correlationId,
      authorization_decision_id: decision.decision_id,
      authorization_policy_ref: decision.policy_ref || null,
      readiness_evidence_ref: readinessEvidence,
      change_summary: {
        from: previous?.state || 'unknown',
        to: desiredState,
        reason_code: decision.reason_code || null,
      },
    });
    await tx.commit();
    committed = true;
    return { changed: previous?.state !== desiredState, state: desiredState };
  } catch (error) {
    if (!committed) {
      try { await tx.rollback(); } catch { /* preserve original failure */ }
    }
    throw error;
  }
}

function buildIncidentSignal({ category, severity, correlationId, source, errorClass = null }) {
  const categories = new Set(['authorization', 'abuse', 'persistence', 'privacy', 'availability', 'integrity']);
  const severities = new Set(['low', 'medium', 'high', 'critical']);
  if (!categories.has(category)) throw new Error('incident_category_invalid');
  if (!severities.has(severity)) throw new Error('incident_severity_invalid');
  if (!correlationId || typeof correlationId !== 'string') throw new Error('incident_correlation_required');
  if (!source || typeof source !== 'string') throw new Error('incident_source_required');
  if (errorClass != null && typeof errorClass !== 'string') throw new Error('incident_error_class_invalid');

  return Object.freeze({
    category,
    severity,
    correlation_id: correlationId,
    source,
    error_class: errorClass,
  });
}

module.exports = {
  STATES,
  buildIncidentSignal,
  changeIntakeState,
  intakeIsEnabled,
};
