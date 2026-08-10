function deny(code = 'not_authorized') {
  return Object.freeze({ allowed: false, code });
}

function allow(code = 'authorized') {
  return Object.freeze({ allowed: true, code });
}

function activeMemberships(identity, transformationId) {
  if (!identity || !identity.id || !Array.isArray(identity.memberships)) return [];
  return identity.memberships.filter((m) =>
    m && m.active === true && m.transformation_id === transformationId && typeof m.role === 'string'
  );
}

function hasRole(identity, transformationId, roles = null) {
  const memberships = activeMemberships(identity, transformationId);
  if (!roles) return memberships.length > 0;
  return memberships.some((m) => roles.includes(m.role));
}

function authorize({ identity, action, resource }) {
  if (!identity || identity.synthetic !== true || !identity.id) return deny('identity_missing_or_unverified');
  if (!resource || typeof resource !== 'object') return deny('resource_invalid');
  if (typeof action !== 'string') return deny('action_invalid');

  if (resource.type === 'transformation') {
    if (action === 'read') {
      return hasRole(identity, resource.id) ? allow('active_transformation_membership') : deny('no_active_transformation_membership');
    }
    if (action === 'update') {
      return hasRole(identity, resource.id, ['owner', 'transformation_lead'])
        ? allow('candidate_lead_role')
        : deny('candidate_lead_role_required');
    }
    return deny('action_not_supported');
  }

  if (resource.type === 'membership') {
    if (action === 'read_self') {
      return resource.actor_user_id === identity.id ? allow('self_membership') : deny('self_only');
    }
    return deny('membership_mutation_not_exposed');
  }

  if (resource.type === 'intake') {
    const transformationId = resource.transformation_id || null;
    if (action === 'read') {
      if (resource.assigned_reviewer_user_id === identity.id) return allow('assigned_reviewer');
      if (transformationId && hasRole(identity, transformationId, ['owner', 'transformation_lead'])) return allow('candidate_lead_role');
      return deny('intake_read_denied');
    }
    if (action === 'review') {
      if (resource.assigned_reviewer_user_id === identity.id) return allow('assigned_reviewer');
      if (transformationId && hasRole(identity, transformationId, ['owner', 'transformation_lead'])) return allow('candidate_lead_role');
      return deny('intake_review_denied');
    }
    return deny('action_not_supported');
  }

  if (resource.type === 'discovery' || resource.type === 'source') {
    if (action !== 'read') return deny('action_not_supported');
    if (!resource.transformation_id || !hasRole(identity, resource.transformation_id)) return deny('no_active_transformation_membership');
    if (['participant_private', 'finance_restricted', 'security_restricted'].includes(resource.visibility_scope)) {
      return deny('restricted_visibility');
    }
    return allow('member_visible_resource');
  }

  if (resource.type === 'decision') {
    if (!resource.transformation_id) return deny('transformation_required');
    if (action === 'read') {
      if (resource.visibility_scope === 'owner_only') {
        return hasRole(identity, resource.transformation_id, ['owner']) ? allow('candidate_owner_role') : deny('owner_only');
      }
      return hasRole(identity, resource.transformation_id) ? allow('active_transformation_membership') : deny('no_active_transformation_membership');
    }
    if (action === 'resolve') {
      if (!hasRole(identity, resource.transformation_id, [resource.required_authority])) return deny('required_authority_missing');
      if (identity.aal !== 'aal2') return deny('aal2_required');
      if (!['needs_review', 'proposed', 'needs_source'].includes(resource.state)) return deny('decision_state_not_resolvable');
      return allow('required_authority_and_aal2');
    }
    return deny('action_not_supported');
  }

  if (resource.type === 'audit') {
    if (action !== 'read') return deny('audit_mutation_not_exposed');
    if (!resource.transformation_id) return deny('transformation_required');
    return hasRole(identity, resource.transformation_id, ['owner']) ? allow('candidate_owner_role') : deny('owner_only');
  }

  return deny('resource_type_not_supported');
}

module.exports = {
  activeMemberships,
  authorize,
  hasRole,
};
