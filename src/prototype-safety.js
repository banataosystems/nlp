const PROTOTYPE_ACK_KEY = 'worldstage.prototype.nonconfidential.v2';

function isAcknowledged() {
  try {
    return sessionStorage.getItem(PROTOTYPE_ACK_KEY) === 'acknowledged';
  } catch {
    return false;
  }
}

function acknowledge() {
  try {
    sessionStorage.setItem(PROTOTYPE_ACK_KEY, 'acknowledged');
  } catch {
    // The boundary still works for the current render when storage is unavailable.
  }
  applyPrototypeSafety();
}

function gateMarkup() {
  return `
    <div class="prototype-safety-gate__card">
      <span class="prototype-safety-gate__eyebrow">Prototype privacy boundary</span>
      <h2>Keep confidential client and participant information out of Discovery for now.</h2>
      <p>Use generalized, non-confidential organization context only. Do not enter participant responses, private client documents, credentials, payment data, health information, legal-privileged material, or other sensitive information.</p>
      <p class="prototype-safety-gate__detail">If you later choose the contact handoff, you may enter your own business contact details. That draft stays on this device and nothing is sent automatically until you review and send the prepared email yourself.</p>
      <button type="button" data-prototype-continue>I understand — continue with non-confidential Discovery</button>
    </div>`;
}

function addGate(shell, conversation) {
  let gate = shell.querySelector('[data-prototype-safety-gate]');
  if (!gate) {
    gate = document.createElement('section');
    gate.className = 'prototype-safety-gate';
    gate.dataset.prototypeSafetyGate = 'true';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-label', 'Prototype privacy boundary');
    gate.innerHTML = gateMarkup();
    shell.appendChild(gate);
    gate.querySelector('[data-prototype-continue]')?.addEventListener('click', acknowledge);
  }

  conversation.dataset.prototypeLocked = 'true';
  conversation.setAttribute('inert', '');
  queueMicrotask(() => gate.querySelector('[data-prototype-continue]')?.focus({ preventScroll: true }));
}

function addBanner(conversation) {
  conversation.dataset.prototypeLocked = 'false';
  conversation.removeAttribute('inert');

  if (!conversation.querySelector('[data-prototype-safety-banner]')) {
    const meta = conversation.querySelector('.conversation-pane__meta');
    const banner = document.createElement('div');
    banner.className = 'prototype-safety-banner';
    banner.dataset.prototypeSafetyBanner = 'true';
    banner.setAttribute('role', 'note');
    banner.innerHTML = `
      <strong>Non-confidential prototype</strong>
      <span>Keep Discovery generalized. Sensitive client/participant material belongs only in a future secure, authorized intake workflow.</span>`;
    meta?.insertAdjacentElement('afterend', banner);
  }

  const input = conversation.querySelector('[data-discovery-input]');
  if (input) {
    input.placeholder = 'Describe the situation without confidential client or participant details.';
  }
}

function removeDetachedGate() {
  document.querySelectorAll('[data-prototype-safety-gate]').forEach((gate) => {
    if (!gate.closest('.discovery-shell')) gate.remove();
  });
}

function applyPrototypeSafety() {
  removeDetachedGate();

  const shell = document.querySelector('.discovery-shell');
  if (!shell) return;

  const conversation = shell.querySelector('.conversation-pane');
  if (!conversation) return;

  if (isAcknowledged()) {
    shell.querySelector('[data-prototype-safety-gate]')?.remove();
    addBanner(conversation);
  } else {
    addGate(shell, conversation);
  }
}

const app = document.getElementById('app');
if (app) {
  new MutationObserver(() => queueMicrotask(applyPrototypeSafety)).observe(app, { childList: true, subtree: true });
}

window.addEventListener('hashchange', () => queueMicrotask(applyPrototypeSafety));
applyPrototypeSafety();
