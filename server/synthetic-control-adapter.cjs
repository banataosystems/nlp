function clone(value) {
  return structuredClone(value);
}

function createSyntheticControlAdapter({ initialState = 'disabled', failAudit = false } = {}) {
  let state = { state: initialState, audit: [] };

  return {
    snapshot() { return clone(state); },
    async readState() { return { state: state.state }; },
    async begin() {
      const working = clone(state);
      let closed = false;
      const ensureOpen = () => { if (closed) throw new Error('control_transaction_closed'); };
      return {
        async readState() { ensureOpen(); return { state: working.state }; },
        async setState(next) { ensureOpen(); working.state = next.state; },
        async insertAudit(event) {
          ensureOpen();
          if (failAudit) throw new Error('control_audit_failed');
          working.audit.push(clone(event));
        },
        async commit() { ensureOpen(); state = working; closed = true; },
        async rollback() { if (!closed) closed = true; },
      };
    },
  };
}

module.exports = { createSyntheticControlAdapter };
