const PROTOTYPE_ACK_KEY = 'worldstage.prototype.nonconfidential.v1';

const STYLE = `
  .prototype-safety-gate {
    position: relative;
    z-index: 2;
    margin: 0 clamp(18px, 4vw, 56px) 24px;
    padding: clamp(20px, 3vw, 32px);
    border: 1px solid rgba(213, 164, 77, .46);
    background: rgba(213, 164, 77, .08);
    color: #f5f3ed;
  }
  .prototype-safety-gate__eyebrow,
  .prototype-safety-banner strong {
    display: block;
    margin-bottom: 8px;
    font-family: "DM Mono", monospace;
    font-size: 10px;
    letter-spacing: .18em;
    text-transform: uppercase;
  }
  .prototype-safety-gate h2 {
    margin: 0 0 12px;
    font-family: "Playfair Display", Georgia, serif;
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 500;
    line-height: 1.04;
  }
  .prototype-safety-gate p,
  .prototype-safety-banner span {
    max-width: 70ch;
    color: rgba(245, 243, 237, .72);
    line-height: 1.65;
  }
  .prototype-safety-gate button {
    margin-top: 18px;
    min-height: 48px;
    padding: 12px 18px;
    border: 1px solid rgba(245, 243, 237, .28);
    background: #f1eee6;
    color: #060606;
    cursor: pointer;
  }
  .prototype-safety-banner {
    margin: 14px 0 0;
    padding: 12px 14px;
    border-left: 2px solid rgba(213, 164, 77, .75);
    background: rgba(213, 164, 77, .06);
  }
  .prototype-safety-banner strong { margin-bottom: 4px; }
  .prototype-safety-banner span { display: block; font-size: 12px; }
  .conversation-pane[data-prototype-locked="true"] {
    opacity: .46;
    pointer-events: none;
    user-select: none;
  }
  @media (max-width: 760px) {
    .prototype-safety-gate { margin-inline: 14px; }
  }
`;

function ensureStyles() {
  if (document.getElementById('worldstage-prototype-safety-style')) return;
  const style = document.createElement('style');
  style.id = 'worldstage-prototype-safety-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

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
    // The guard remains useful even when storage is unavailable.
  }
  applyPrototypeSafety();
}

function addGate(shell, conversation) {
  if (!shell.querySelector('[data-prototype-safety-gate]')) {
    const gate = document.createElement('section');
    gate.className = 'prototype-safety-gate';
    gate.dataset.prototypeSafetyGate = 'true';
    gate.setAttribute('role', 'note');
    gate.innerHTML = `
      <span class="prototype-safety-gate__eyebrow">Non-confidential prototype</span>
      <h2>Keep real client and participant details out of this screen for now.</h2>
      <p>This Discovery experience is not yet connected to secure server-side intake. Continue only with generalized, non-confidential information. Do not enter names, contact details, participant responses, private client material, credentials, payment information, health information, legal-privileged content, or other sensitive data.</p>
      <button type="button" data-prototype-continue>I understand — continue with non-confidential information</button>
    `;
    shell.insertBefore(gate, conversation);
    gate.querySelector('[data-prototype-continue]')?.addEventListener('click', acknowledge);
  }

  conversation.dataset.prototypeLocked = 'true';
  conversation.setAttribute('inert', '');
}

function addBanner(conversation) {
  conversation.dataset.prototypeLocked = 'false';
  conversation.removeAttribute('inert');

  if (!conversation.querySelector('[data-prototype-safety-banner]')) {
    const meta = conversation.querySelector('.conversation-pane__meta');
    const banner = document.createElement('div');
    banner.className = 'prototype-safety-banner';
    banner.dataset.prototypeSafetyBanner = 'true';
    banner.innerHTML = `
      <strong>Prototype privacy boundary</strong>
      <span>Use generalized, non-confidential information only. Secure WorldStage intake is a later gated workflow.</span>
    `;
    meta?.insertAdjacentElement('afterend', banner);
  }

  const input = conversation.querySelector('[data-discovery-input]');
  if (input) {
    input.placeholder = 'Non-confidential prototype only — describe the situation without names, personal data, or sensitive client details.';
  }
}

function applyPrototypeSafety() {
  ensureStyles();

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

const observer = new MutationObserver(() => queueMicrotask(applyPrototypeSafety));
observer.observe(document.getElementById('app'), { childList: true, subtree: true });

window.addEventListener('hashchange', () => queueMicrotask(applyPrototypeSafety));
applyPrototypeSafety();
