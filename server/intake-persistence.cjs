const crypto = require('node:crypto');

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

function publicReceipt() {
  return `WS-${crypto.randomBytes(12).toString('base64url')}`;
}

function actorScope(actor) {
  if (!actor || typeof actor.id !== 'string' || !actor.id) throw new Error('actor_identity_required');
  const type = typeof actor.type === 'string' && actor.type ? actor.type : 'actor';
  return `${type}:${actor.id}`;
}

async function persistValidatedIntake({ adapter, idempotencyKey, body, actor, correlationId }) {
  if (!adapter || typeof adapter.begin !== 'function') throw new Error('persistence_adapter_invalid');
  if (!idempotencyKey) throw new Error('idempotency_key_required');
  if (!correlationId) throw new Error('correlation_id_required');

  const bodyHash = hashBody(body);
  const scope = actorScope(actor);
  const tx = await adapter.begin();
  let committed = false;

  try {
    const existing = await tx.findIdempotency(idempotencyKey, scope);
    if (existing) {
      if (existing.body_hash !== bodyHash || existing.actor_scope !== scope) {
        const error = new Error('idempotency_conflict');
        error.code = 'idempotency_conflict';
        throw error;
      }
      await tx.rollback();
      return {
        status: 'duplicate',
        receipt_code: existing.receipt_code,
        intake_id: existing.intake_id,
      };
    }

    const receiptCode = publicReceipt();
    const intake = await tx.insertIntake({
      receipt_code: receiptCode,
      state: 'pending_human_review',
      sensitivity_class: 'confidential_client_unclassified',
      visibility_scope: 'worldstage_internal_only',
      actor,
      correlation_id: correlationId,
      body,
    });

    await tx.insertIdempotency({
      idempotency_key: idempotencyKey,
      actor_scope: scope,
      body_hash: bodyHash,
      receipt_code: receiptCode,
      intake_id: intake.id,
    });

    await tx.insertAudit({
      action: 'secure_intake_received',
      outcome: 'accepted_for_human_review',
      resource_type: 'intake',
      resource_id: intake.id,
      actor_type: actor.type || 'authenticated_submitter',
      actor_id: actor.id,
      correlation_id: correlationId,
      change_summary: {
        state: 'pending_human_review',
        sensitivity_class: 'confidential_client_unclassified',
        visibility_scope: 'worldstage_internal_only',
      },
    });

    await tx.commit();
    committed = true;

    return {
      status: 'created',
      receipt_code: receiptCode,
      intake_id: intake.id,
    };
  } catch (error) {
    if (!committed) {
      try { await tx.rollback(); } catch { /* preserve original failure */ }
    }
    throw error;
  }
}

module.exports = {
  actorScope,
  hashBody,
  persistValidatedIntake,
};
