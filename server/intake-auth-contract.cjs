const ALLOWED_MODES = new Set(['authenticated', 'bound_invitation']);

function deny(code) {
  return { allowed: false, code };
}

function validateIntakeActor({ mode, actor, now = Math.floor(Date.now() / 1000) }) {
  if (!ALLOWED_MODES.has(mode)) return deny('intake_auth_mode_denied');
  if (!actor || typeof actor !== 'object') return deny('actor_missing');

  if (mode === 'authenticated') {
    if (actor.type !== 'user') return deny('authenticated_user_required');
    if (typeof actor.id !== 'string' || !actor.id) return deny('user_id_missing');
    if (!['aal1', 'aal2'].includes(actor.aal)) return deny('assurance_invalid');
    if (!Number.isInteger(actor.expires_at) || actor.expires_at <= now) return deny('authentication_expired');
    return { allowed: true, code: 'authenticated_user', actor: { type: 'user', id: actor.id, aal: actor.aal } };
  }

  if (actor.type !== 'invitation') return deny('bound_invitation_required');
  if (typeof actor.id !== 'string' || !actor.id) return deny('invitation_id_missing');
  if (actor.scope !== 'intake:create') return deny('invitation_scope_invalid');
  if (actor.audience !== 'worldstage-intake') return deny('invitation_audience_invalid');
  if (!Number.isInteger(actor.expires_at) || actor.expires_at <= now) return deny('invitation_expired');
  return { allowed: true, code: 'bound_invitation', actor: { type: 'invitation', id: actor.id, aal: null } };
}

module.exports = {
  ALLOWED_MODES,
  validateIntakeActor,
};
