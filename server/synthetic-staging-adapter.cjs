function clone(value) {
  return structuredClone(value);
}

function actorMatches(recordActor, actor) {
  if (!recordActor || !actor) return false;
  const recordType = recordActor.type || 'user';
  const actorType = actor.type || 'user';
  return recordType === actorType && recordActor.id === actor.id;
}

function createSyntheticStagingAdapter({ sourceSha = 'synthetic-source-sha' } = {}) {
  let state = {
    nextIntake: 1,
    intakes: [],
    idempotency: [],
    audit: [],
  };

  const adapter = {
    environment: 'staging',
    projectKey: 'worldstage-cherry',
    provider: 'synthetic-memory',
    environmentId: 'worldstage-synthetic-staging',
    sourceSha,
    allowsProduction: false,
    containsRealData: false,

    snapshot() {
      return clone(state);
    },

    async findReceiptForActor({ receiptCode, actor }) {
      const record = state.intakes.find((item) =>
        item.receipt_code === receiptCode && actorMatches(item.actor, actor)
      );
      return record ? clone(record) : null;
    },

    async begin() {
      const working = clone(state);
      let closed = false;

      function ensureOpen() {
        if (closed) throw new Error('transaction_closed');
      }

      return {
        async findIdempotency(key, actorScope) {
          ensureOpen();
          return working.idempotency.find((record) =>
            record.idempotency_key === key && record.actor_scope === actorScope
          ) || null;
        },
        async insertIntake(record) {
          ensureOpen();
          const inserted = { id: `synthetic-intake-${working.nextIntake++}`, ...clone(record) };
          working.intakes.push(inserted);
          return clone(inserted);
        },
        async insertIdempotency(record) {
          ensureOpen();
          if (working.idempotency.some((item) =>
            item.idempotency_key === record.idempotency_key && item.actor_scope === record.actor_scope
          )) {
            const error = new Error('idempotency_unique_violation');
            error.code = 'idempotency_unique_violation';
            throw error;
          }
          working.idempotency.push(clone(record));
        },
        async insertAudit(record) {
          ensureOpen();
          working.audit.push(clone(record));
        },
        async commit() {
          ensureOpen();
          state = working;
          closed = true;
        },
        async rollback() {
          if (closed) return;
          closed = true;
        },
      };
    },
  };

  return adapter;
}

module.exports = {
  createSyntheticStagingAdapter,
};
