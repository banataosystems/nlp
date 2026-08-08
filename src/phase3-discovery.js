/* Phase 3 Discovery continuation.
   Draft stays in this browser. No network submission occurs until the visitor explicitly opens the email handoff. */

const PHASE3_DRAFT_KEY = 'worldstage.discovery.context.v2';
const WORLDSTAGE_HANDOFF_EMAIL = 'fireup@worldstageinternational.com.ph';

const emptyContext = {
  organization: '',
  website: '',
  contactName: '',
  role: '',
  email: '',
  phone: '',
  experience: '',
  timing: '',
  deliveryMode: '',
  location: '',
  notes: '',
  consent: false,
};

function readDraft() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PHASE3_DRAFT_KEY) || '{}');
    return { ...emptyContext, ...parsed, consent: Boolean(parsed.consent) };
  } catch {
    return { ...emptyContext };
  }
}

function writeDraft(value) {
  try {
    localStorage.setItem(PHASE3_DRAFT_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function escapeAttribute(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function discoveryBriefText() {
  return [...document.querySelectorAll('.brief-item--filled')]
    .map((item) => {
      const label = item.querySelector('.brief-item__label > span:first-child')?.textContent?.trim() || 'DISCOVERY';
      const value = item.querySelector('p')?.textContent?.trim() || '';
      return `${label}\n${value}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function contextIsValid(value) {
  const emailOkay = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim());
  return Boolean(value.organization.trim() && value.contactName.trim() && emailOkay && value.consent);
}

function formMarkup(draft) {
  const options = (value, choices) => choices.map(([key, label]) => `<option value="${escapeAttribute(key)}" ${value === key ? 'selected' : ''}>${label}</option>`).join('');
  return `
    <section class="discovery-context-card" data-phase3-context aria-labelledby="phase3-context-title">
      <div class="discovery-context-card__eyebrow">CONNECT / ROUTE THE CONVERSATION WELL</div>
      <h2 id="phase3-context-title">Now give the context to the right WorldStage person.</h2>
      <p class="discovery-context-card__intro">The transformation brief above captures what you said. These practical details help WorldStage understand who is reaching out, what kind of conversation may be useful, and when. This prototype keeps the draft on this device until you explicitly choose the final handoff.</p>
      <div class="discovery-route-progress" aria-label="Discovery progress">
        <span class="is-complete">Understand</span><span>→</span><span class="is-complete">Imagine</span><span>→</span><span class="is-complete">People</span><span>→</span><span class="is-complete">Context</span><span>→</span><span>Connect</span>
      </div>
      <form data-phase3-form novalidate>
        <div class="discovery-context-grid">
          <div class="discovery-field"><label for="ctx-org">Organization *</label><input id="ctx-org" name="organization" autocomplete="organization" value="${escapeAttribute(draft.organization)}" required></div>
          <div class="discovery-field"><label for="ctx-site">Website</label><input id="ctx-site" name="website" inputmode="url" autocomplete="url" placeholder="https://" value="${escapeAttribute(draft.website)}"></div>
          <div class="discovery-field"><label for="ctx-name">Your name *</label><input id="ctx-name" name="contactName" autocomplete="name" value="${escapeAttribute(draft.contactName)}" required></div>
          <div class="discovery-field"><label for="ctx-role">Your role</label><input id="ctx-role" name="role" autocomplete="organization-title" value="${escapeAttribute(draft.role)}"></div>
          <div class="discovery-field"><label for="ctx-email">Professional email *</label><input id="ctx-email" name="email" type="email" autocomplete="email" value="${escapeAttribute(draft.email)}" required></div>
          <div class="discovery-field"><label for="ctx-phone">Phone (optional)</label><input id="ctx-phone" name="phone" type="tel" autocomplete="tel" value="${escapeAttribute(draft.phone)}"></div>
          <div class="discovery-field"><label for="ctx-experience">What kind of conversation are you considering?</label><select id="ctx-experience" name="experience"><option value="">Not sure yet</option>${options(draft.experience, [['team-building','Team Building'],['culture','Culture Development'],['learning','Learning & Development'],['leadership','Leadership Development'],['keynote','Keynote / Motivation'],['fire-university','Fire University'],['transformation','Broader organizational transformation']])}</select></div>
          <div class="discovery-field"><label for="ctx-timing">Ideal timing</label><input id="ctx-timing" name="timing" placeholder="e.g. October 2026 / flexible" value="${escapeAttribute(draft.timing)}"></div>
          <div class="discovery-field"><label for="ctx-mode">Delivery context</label><select id="ctx-mode" name="deliveryMode"><option value="">Still deciding</option>${options(draft.deliveryMode, [['in-person','In person'],['hybrid','Hybrid'],['virtual','Virtual'],['not-sure','Not sure — help us decide']])}</select></div>
          <div class="discovery-field"><label for="ctx-location">Location</label><input id="ctx-location" name="location" autocomplete="address-level2" placeholder="City / venue / region" value="${escapeAttribute(draft.location)}"></div>
          <div class="discovery-field discovery-field--wide"><label for="ctx-notes">Anything practical we should know?</label><textarea id="ctx-notes" name="notes" placeholder="Date constraints, participant estimate, procurement timing, accessibility needs, or anything that helps route the conversation.">${escapeAttribute(draft.notes)}</textarea></div>
          <label class="discovery-consent"><input type="checkbox" name="consent" ${draft.consent ? 'checked' : ''}><span><span>Permission to prepare the handoff *</span><p>I understand this prototype stores my draft locally on this device. Nothing is sent automatically. If I choose “Prepare email handoff,” my email app will open with the information I supplied so I can review and send it myself.</p></span></label>
        </div>
        <div class="discovery-draft-status" data-phase3-status aria-live="polite">Draft stays on this device.</div>
        <div class="discovery-context-actions">
          <p>No WorldStage diagnosis is implied by this form. The brief remains client-supplied and requires human review.</p>
          <button type="submit" class="discovery-handoff" data-phase3-handoff disabled>Prepare email handoff</button>
        </div>
      </form>
    </section>`;
}

function collectForm(form) {
  const data = new FormData(form);
  return {
    organization: String(data.get('organization') || ''),
    website: String(data.get('website') || ''),
    contactName: String(data.get('contactName') || ''),
    role: String(data.get('role') || ''),
    email: String(data.get('email') || ''),
    phone: String(data.get('phone') || ''),
    experience: String(data.get('experience') || ''),
    timing: String(data.get('timing') || ''),
    deliveryMode: String(data.get('deliveryMode') || ''),
    location: String(data.get('location') || ''),
    notes: String(data.get('notes') || ''),
    consent: data.get('consent') === 'on',
  };
}

function handoffBody(context) {
  const brief = discoveryBriefText();
  return `Hello WorldStage,\n\nI would like to continue a discovery conversation.\n\nORGANIZATION\n${context.organization}\n${context.website ? `Website: ${context.website}\n` : ''}\nCONTACT\n${context.contactName}${context.role ? ` — ${context.role}` : ''}\n${context.email}${context.phone ? `\n${context.phone}` : ''}\n\nPRACTICAL CONTEXT\nExperience: ${context.experience || 'Not sure yet'}\nTiming: ${context.timing || 'Not specified'}\nDelivery: ${context.deliveryMode || 'Not specified'}\nLocation: ${context.location || 'Not specified'}${context.notes ? `\nNotes: ${context.notes}` : ''}\n\nWHAT I SAID IN DISCOVERY\n${brief || 'No discovery brief available.'}\n\nThis summary reflects information I supplied. It is not a WorldStage diagnosis.`;
}

function enhanceCompletedDiscovery() {
  const pane = document.querySelector('.conversation-pane');
  const complete = pane?.querySelector('.conversation-complete');
  if (!pane || !complete || pane.querySelector('[data-phase3-context]')) return;

  complete.dataset.phase3Hidden = 'true';
  const wrapper = document.createElement('div');
  wrapper.innerHTML = formMarkup(readDraft());
  const card = wrapper.firstElementChild;
  complete.after(card);

  const form = card.querySelector('[data-phase3-form]');
  const status = card.querySelector('[data-phase3-status]');
  const handoff = card.querySelector('[data-phase3-handoff]');

  const sync = () => {
    const context = collectForm(form);
    const saved = writeDraft(context);
    handoff.disabled = !contextIsValid(context);
    status.textContent = saved ? 'Draft saved locally on this device.' : 'Draft could not be saved locally; keep this page open.';
  };

  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const context = collectForm(form);
    if (!contextIsValid(context)) {
      status.textContent = 'Add organization, your name, a valid email, and permission before preparing the handoff.';
      form.reportValidity();
      return;
    }
    writeDraft(context);
    const subject = encodeURIComponent(`WorldStage discovery — ${context.organization}`);
    const body = encodeURIComponent(handoffBody(context));
    window.location.href = `mailto:${WORLDSTAGE_HANDOFF_EMAIL}?subject=${subject}&body=${body}`;
  });

  sync();
}

function phase3Enhance() {
  if (!document.querySelector('.discovery-shell')) return;
  enhanceCompletedDiscovery();
}

new MutationObserver(() => queueMicrotask(phase3Enhance)).observe(document.getElementById('app'), { childList: true, subtree: true });
window.addEventListener('hashchange', () => queueMicrotask(phase3Enhance));
phase3Enhance();
