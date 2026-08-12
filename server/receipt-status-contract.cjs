const RECEIPT_PATTERN = /^WS-[A-Za-z0-9_-]{12,64}$/;

const PUBLIC_STATUS_BY_INTERNAL_STATE = Object.freeze({
  pending_human_review: 'received',
  under_human_review: 'under_review',
  needs_clarification: 'action_needed',
  accepted: 'closed',
  rejected: 'closed',
  quarantined: 'under_review',
  legal_security_review: 'under_review',
});

function unavailable() {
  return {
    status: 404,
    body: {
      error: 'receipt_unavailable',
      message: 'Receipt status is unavailable.',
    },
  };
}

function validateReceiptCode(value) {
  return RECEIPT_PATTERN.test(String(value || ''));
}

async function lookupReceiptStatus({ receiptCode, actor, adapter }) {
  if (!validateReceiptCode(receiptCode)) return unavailable();
  if (!actor || typeof actor.id !== 'string' || !actor.id) return unavailable();
  if (!adapter || typeof adapter.findReceiptForActor !== 'function') return unavailable();

  let record;
  try {
    record = await adapter.findReceiptForActor({ receiptCode, actor });
  } catch {
    return unavailable();
  }
  if (!record || record.receipt_code !== receiptCode) return unavailable();

  const publicStatus = PUBLIC_STATUS_BY_INTERNAL_STATE[record.state];
  if (!publicStatus) return unavailable();

  return {
    status: 200,
    body: {
      receipt_code: receiptCode,
      status: publicStatus,
      message: publicStatus === 'action_needed'
        ? 'WorldStage needs additional information before review can continue.'
        : 'Your submission status is available.',
    },
  };
}

module.exports = {
  PUBLIC_STATUS_BY_INTERNAL_STATE,
  RECEIPT_PATTERN,
  lookupReceiptStatus,
  validateReceiptCode,
};
