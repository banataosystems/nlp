const SITE_SOURCE = 'https://worldstageinternational.com.ph/';
const TEAM_SOURCE = 'https://worldstageinternational.com.ph/our-team/';
const METHOD_SOURCE = 'https://worldstageinternational.com.ph/our-magic/';
const CONTACT_EMAIL = 'fireup@worldstageinternational.com.ph';
const ROUTES = new Set(['home', 'discovery', 'cockpit', 'client']);

const icons = {
  arrowRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 2.7 8.2 7 10 4.3-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>',
};

function icon(name, cls = '') {
  return `<span class="icon ${cls}">${icons[name] || ''}</span>`;
}

function sourcePill(text = 'PUBLIC SOURCE', tone = 'source') {
  return `<span class="source-pill source-pill--${tone}">${text}</span>`;
}

function routeFromHash() {
  const raw = location.hash.replace('#/', '').replace('#', '');
  return ROUTES.has(raw) ? raw : 'home';
}

let route = routeFromHash();
let mobileMenu = false;
let lastScroll = 0;
let navVisible = true;
let discovery;
let cockpitIndex = 0;
let clientChapter = 'heard';
let pointerStart = null;

const app = document.getElementById('app');

function createDiscoveryState() {
  return {
    step: 0,
    input: '',
    brief: {},
    messages: [{ type: 'system', text: discoveryQuestions[0].prompt }],
    listening: false,
    copied: false,
  };
}

const discoveryQuestions = [
  { key: 'currentReality', prompt: 'Before we talk about programs, tell us what is happening inside the organization right now.', label: 'CURRENT REALITY' },
  { key: 'signals', prompt: 'What are people doing, saying, or avoiding that makes this important now?', label: 'SIGNALS' },
  { key: 'desiredReality', prompt: 'If this genuinely improved, what would you notice six months from now?', label: 'DESIRED REALITY' },
  { key: 'people', prompt: 'Who is most affected by this transformation?', label: 'PEOPLE' },
  { key: 'constraints', prompt: 'What must WorldStage understand before anyone designs an intervention?', label: 'CONSTRAINTS' },
];

discovery = createDiscoveryState();

function navTemplate() {
  return `
    <header class="global-nav ${navVisible ? 'global-nav--visible' : 'global-nav--hidden'}">
      <button class="wordmark" data-nav="home" aria-label="WorldStage home"><span class="wordmark__mark" aria-hidden="true"></span><span>WORLDSTAGE</span></button>
      <nav class="desktop-nav" aria-label="Primary">
        <button data-nav="home" class="${route === 'home' ? 'is-active' : ''}">The Stage</button>
        <button data-nav="discovery" class="${route === 'discovery' ? 'is-active' : ''}">Discovery</button>
        <button data-nav="client" class="${route === 'client' ? 'is-active' : ''}">Transformation Record</button>
        <button data-nav="cockpit" class="${route === 'cockpit' ? 'is-active' : ''}">Cherry OS</button>
      </nav>
      <button class="menu-toggle" data-menu aria-expanded="${mobileMenu}" aria-label="${mobileMenu ? 'Close' : 'Open'} menu">${mobileMenu ? icon('x') : icon('menu')}</button>
      ${mobileMenu ? `<div class="mobile-nav" role="dialog" aria-label="Mobile navigation">
        <button data-nav="home">The Stage</button><button data-nav="discovery">Discovery</button><button data-nav="client">Transformation Record</button><button data-nav="cockpit">Cherry OS</button>
      </div>` : ''}
    </header>`;
}

function stageHomeTemplate() {
  const signals = ['misalignment', 'trust', 'energy', 'fear', 'ambition', 'silence', 'communication', 'belonging', 'performance', 'clarity'];
  return `
  <main id="main" class="stage-home">
    <section class="hero-stage" aria-labelledby="hero-title">
      <div class="stage-aperture" aria-hidden="true"><div class="stage-aperture__halo"></div><div class="stage-aperture__line stage-aperture__line--one"></div><div class="stage-aperture__line stage-aperture__line--two"></div><div class="stage-aperture__line stage-aperture__line--three"></div></div>
      <div class="hero-stage__eyebrow">WORLDSTAGE INTERNATIONAL · THE HUMAN TRANSFORMATION COMPANY</div>
      <h1 id="hero-title">Every organization<br>walks into the room<br><em>with a story.</em></h1>
      <p class="hero-stage__copy">Before WorldStage designs an intervention, it listens for the reality beneath the brief.</p>
      <button class="quiet-cta" data-nav="discovery">Begin with what is happening ${icon('arrowRight')}</button>
      <div class="hero-stage__scroll" aria-hidden="true"><span>Listen</span>${icon('chevronDown')}</div>
    </section>

    <section class="reality-scene reveal" data-reveal>
      <div class="chapter-index">01 / REALITY</div>
      <h2><span>What people say.</span><br>What people do not say.<br>What leadership sees.<br>What the room actually feels.</h2>
      <p>WorldStage begins by understanding the current state before proposing what should happen next.</p>
      <a href="${SITE_SOURCE}" target="_blank" rel="noreferrer" class="source-link">${sourcePill()} Official WorldStage methodology ${icon('external')}</a>
    </section>

    <section class="signal-field" data-signal-field aria-label="Transformation visualization">
      <div class="signal-field__frame">
        <div class="chapter-index chapter-index--dark">02 / TRANSFORMATION</div>
        ${signals.map((s, i) => `<span class="signal signal--${i + 1}">${s}</span>`).join('')}
        <div class="clarity-core"><span>FROM SIGNALS TO</span><strong>CLARITY</strong><div class="clarity-core__steps"><span>Listen</span><i></i><span>Understand</span><i></i><span>Design</span><i></i><span>Move</span><i></i><span>Measure</span><i></i><span>Sustain</span></div></div>
      </div>
    </section>

    <section class="method-stage reveal" data-reveal>
      <div class="method-stage__header"><div><div class="chapter-index">03 / THE METHOD</div><h2>Not a program.<br><em>An intervention designed for this room.</em></h2></div><p>WorldStage publicly describes its FIRE approach as a fusion of head, heart and gut, an inspiring message, breakthrough tools, and enduring data.</p></div>
      <div class="fire-track">
        <article class="fire-node"><div class="fire-node__letter">F</div><div><h3>Fusion</h3><p>Head, heart and gut in one experience.</p></div></article>
        <article class="fire-node"><div class="fire-node__letter">I</div><div><h3>Inspiration</h3><p>Messages people can carry back to work.</p></div></article>
        <article class="fire-node"><div class="fire-node__letter">R</div><div><h3>Revolution</h3><p>Experiences strong enough to interrupt old patterns.</p></div></article>
        <article class="fire-node"><div class="fire-node__letter">E</div><div><h3>Evidence</h3><p>Data and follow-through that let change endure.</p></div></article>
      </div>
      <a href="${METHOD_SOURCE}" target="_blank" rel="noreferrer" class="source-link">${sourcePill()} Official WorldStage “Our Magic” source ${icon('external')}</a>
    </section>

    <section class="cherry-editorial reveal" data-reveal>
      <div class="cherry-editorial__portrait" aria-label="Abstract stage portrait art direction for Cherry Africa"><div class="portrait-orbit portrait-orbit--one"></div><div class="portrait-orbit portrait-orbit--two"></div><div class="portrait-monogram">CA</div><span class="portrait-caption">Authentic Cherry photography can replace this art direction when owner-approved assets are supplied.</span></div>
      <div class="cherry-editorial__copy"><div class="chapter-index chapter-index--dark">04 / CHERRY PUA AFRICA</div><p class="cherry-kicker">Founder · Coach · Transformation leader</p><h2>People do not change because you told them to.</h2><h3>They change when something moves them.</h3><p class="cherry-body">The digital experience is designed around the same principle: understand the human reality first, then decide what intervention belongs in the room.</p><a href="${TEAM_SOURCE}" target="_blank" rel="noreferrer" class="source-link source-link--dark">${sourcePill('PUBLIC SOURCE', 'dark')} Current WorldStage team profile ${icon('external')}</a></div>
    </section>

    <section class="evidence-stage reveal" data-reveal>
      <div class="chapter-index">05 / WHAT REMAINS</div><div class="evidence-stage__headline"><h2>Transformation is not what happens on stage.</h2><p>It is what remains when the room is empty.</p></div>
      <div class="evidence-ledger-demo"><div class="evidence-ledger-demo__line"><span>What we heard</span><b>Source-linked discovery</b></div><div class="evidence-ledger-demo__line"><span>What we designed</span><b>Approved intervention</b></div><div class="evidence-ledger-demo__line"><span>What changed</span><b>Evidence, not decoration</b></div><div class="evidence-ledger-demo__line"><span>What happens next</span><b>7 / 30 / 90-day sustainment</b></div></div>
    </section>

    <section class="finale-stage"><p>WORLDSTAGE DOES NOT START WITH A PROGRAM.</p><h2>It starts with a conversation worth listening to.</h2><button class="finale-stage__button" data-nav="discovery">Start the discovery ${icon('arrowRight')}</button></section>
  </main>`;
}

function discoveryTemplate() {
  const complete = discovery.step >= discoveryQuestions.length;
  return `
  <main id="main" class="discovery-shell">
    <section class="conversation-pane">
      <div class="conversation-pane__meta"><span>DISCOVERY / WHAT WE HEARD</span>${sourcePill('CLIENT-SUPPLIED', 'client')}</div>
      <div class="conversation-feed" data-feed aria-live="polite">
        ${discovery.messages.map((m) => `<div class="conversation-message conversation-message--${m.type}">${m.type === 'system' ? '<span>WORLDSTAGE</span>' : m.type === 'user' ? '<span>YOU</span>' : ''}<p>${escapeHtml(m.text)}</p></div>`).join('')}
      </div>
      ${!complete ? `<form class="conversation-input" data-discovery-form><label class="sr-only" for="discovery-answer">Your response</label><textarea id="discovery-answer" data-discovery-input rows="2" placeholder="Speak plainly. We can structure it later.">${escapeHtml(discovery.input)}</textarea><div class="conversation-input__actions"><button type="button" class="mic-button ${discovery.listening ? 'is-listening' : ''}" data-voice aria-label="Use voice input">${icon('mic')}</button><button type="submit" class="send-button" ${discovery.input.trim() ? '' : 'disabled'}>Continue ${icon('arrowRight')}</button></div></form>` : `<div class="conversation-complete"><button data-copy>${discovery.copied ? icon('check') : icon('copy')} ${discovery.copied ? 'Copied' : 'Copy brief'}</button><button class="conversation-complete__primary" data-email>${icon('mail')} Email this brief to WorldStage</button></div>`}
    </section>
    <aside class="brief-pane" aria-label="Live discovery brief"><div class="brief-pane__header"><div><span>LIVE TRANSFORMATION BRIEF</span><h1>What we heard</h1></div>${icon('shield')}</div><p class="brief-pane__notice">Every statement below is traceable to what you typed or said. No hidden “AI diagnosis” is being presented as fact.</p><div class="brief-items">${discoveryQuestions.map((q) => { const item = discovery.brief[q.key]; return `<article class="brief-item ${item ? 'brief-item--filled' : ''}"><div class="brief-item__label"><span>${q.label}</span>${item ? sourcePill('DIRECT', 'client') : ''}</div><p>${item ? escapeHtml(item.value) : 'Waiting for your words.'}</p></article>`; }).join('')}</div><div class="brief-pane__footer">${sourcePill('NEEDS HUMAN REVIEW', 'review')}<span>This prototype sends nothing automatically.</span></div></aside>
  </main>`;
}

const cockpitCards = [
  { id:'01', label:'REVIEW', title:'A proposal needs your narrative judgment.', client:'Demo transformation account', what:'The proposed intervention has a clear business objective, but the story arc still reads like a generic leadership workshop.', recommendation:'Reframe the narrative around the client’s own language before anything is approved.' },
  { id:'02', label:'RELATIONSHIP', title:'A relationship has an open promise.', client:'Demo relationship', what:'The relationship timeline contains a promised follow-up with no confirmed completion record.', recommendation:'Review the source timeline, then prepare a human follow-up rather than sending one automatically.' },
  { id:'03', label:'BRIEFING', title:'Tomorrow’s room needs a 60-second briefing.', client:'Demo keynote', what:'Audience, objective, program history and sensitive constraints should be visible before stage preparation begins.', recommendation:'Open “The Room” briefing and verify every sensitive note against its source.' },
];

function cockpitTemplate() {
  const today = new Intl.DateTimeFormat('en-PH', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return `
  <main id="main" class="cockpit-shell">
    <header class="cockpit-header"><div><span>CHERRY</span><h1>${today}</h1></div><button class="client-record-link" data-nav="client">Open transformation record ${icon('arrowRight')}</button></header>
    <section class="judgment-intro"><span>YOUR JUDGMENT QUEUE</span><h2>Three things deserve your attention.</h2><p>Everything below is explicitly marked as demo intelligence until connected to verified WorldStage data.</p></section>
    <section class="judgment-deck" data-deck><div class="judgment-track" style="transform:translateX(-${cockpitIndex * 100}%)">${cockpitCards.map((c, i) => `<article class="judgment-card ${cockpitIndex === i ? 'is-active' : ''}"><div class="judgment-card__number">${c.id}</div><div class="judgment-card__content"><div class="judgment-card__meta"><span>${c.label}</span>${sourcePill('DEMO DATA', 'demo')}</div><h3>${c.title}</h3><p class="judgment-card__client">${c.client}</p><div class="judgment-card__grid"><div><span>WHAT WE KNOW</span><p>${c.what}</p></div><div><span>WORLDSTAGE SUGGESTION</span><p>${c.recommendation}</p></div></div><div class="judgment-card__actions"><button>View sources</button><button class="judgment-card__primary">Review context ${icon('arrowRight')}</button></div></div></article>`).join('')}</div><button class="deck-control deck-control--left" data-prev ${cockpitIndex === 0 ? 'disabled' : ''} aria-label="Previous item">${icon('arrowLeft')}</button><button class="deck-control deck-control--right" data-next ${cockpitIndex === cockpitCards.length - 1 ? 'disabled' : ''} aria-label="Next item">${icon('arrowRight')}</button></section>
    <footer class="cockpit-footer"><div class="deck-dots" aria-label="Item ${cockpitIndex + 1} of ${cockpitCards.length}">${cockpitCards.map((_, i) => `<span class="${cockpitIndex === i ? 'is-active' : ''}"></span>`).join('')}</div><button class="speak-control" data-speak><span><b>Speak to WorldStage</b><small>Hold to simulate capture</small></span><i>${icon('mic')}</i></button></footer>
  </main>`;
}

const clientChapters = {
  heard: { eyebrow:'WHAT WE HEARD', title:'The transformation record begins with source, not interpretation.', body:'Client language, discovery notes and authorized source material belong here. Every statement should preserve where it came from and who confirmed it.', status:'SOURCE-LINKED' },
  designed: { eyebrow:'WHAT WE DESIGNED', title:'The intervention should explain why each element belongs in this room.', body:'Program modules, stories, activities, facilitators, timing, safety requirements and measurement should trace back to an approved transformation objective.', status:'HUMAN-APPROVED' },
  happened: { eyebrow:'WHAT HAPPENED', title:'Delivery becomes an operational memory, not a disappearing event.', body:'Run-of-show changes, facilitator observations, important client moments and follow-up commitments should become part of the relationship history.', status:'DELIVERY RECORD' },
  changed: { eyebrow:'WHAT CHANGED', title:'Evidence is separated from storytelling.', body:'Anecdotal, observed, measured, client-confirmed and publicly approved outcomes must remain distinguishable before any claim reaches sales or marketing.', status:'EVIDENCE GATED' },
  next: { eyebrow:'WHAT HAPPENS NEXT', title:'Sustainment is part of the transformation, not an afterthought.', body:'Seven-, thirty- and ninety-day follow-up, relationship signals and renewal opportunities should emerge from the same record without exposing participant-level information unnecessarily.', status:'SUSTAINMENT' },
};

function clientTemplate() {
  const chapter = clientChapters[clientChapter];
  return `
  <main id="main" class="record-shell"><aside class="record-rail"><div class="record-rail__identity"><span>TRANSFORMATION RECORD</span><strong>Demo organization</strong>${sourcePill('DEMO DATA', 'dark')}</div><nav aria-label="Transformation chapters">${Object.entries(clientChapters).map(([key, item], i) => `<button data-chapter="${key}" class="${clientChapter === key ? 'is-active' : ''}"><span>0${i + 1}</span>${item.eyebrow}</button>`).join('')}</nav><div class="record-rail__source">${icon('shield')}<p>Prototype structure only. No private client facts are represented here.</p></div></aside><section class="record-story"><div class="record-story__top"><span>${chapter.eyebrow}</span>${sourcePill(chapter.status, 'dark')}</div><h1>${chapter.title}</h1><p>${chapter.body}</p><div class="record-story__visual" aria-hidden="true"><div class="record-story__pulse"></div><div class="record-story__axis"></div><span>source</span><span>judgment</span><span>intervention</span><span>evidence</span><span>sustain</span></div><div class="record-story__proof"><article><span>PROVENANCE</span><h2>Every important statement should answer: “Where did this come from?”</h2></article><article><span>PERMISSION</span><h2>Every consequential action should answer: “Who is allowed to approve this?”</h2></article><article><span>PRIVACY</span><h2>Every insight should answer: “Who actually needs to see this?”</h2></article></div></section></main>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function summaryText() {
  return discoveryQuestions.map(q => `${q.label}\n${discovery.brief[q.key]?.value || '—'}`).join('\n\n');
}

function render({ preserveScroll = false } = {}) {
  const scrollY = window.scrollY;
  let content = stageHomeTemplate();
  if (route === 'discovery') content = discoveryTemplate();
  if (route === 'cockpit') content = cockpitTemplate();
  if (route === 'client') content = clientTemplate();
  app.innerHTML = navTemplate() + content;
  bindEvents();
  if (route === 'home') bindReveal();
  if (route === 'discovery') {
    requestAnimationFrame(() => {
      const feed = document.querySelector('[data-feed]');
      if (feed) feed.scrollTop = feed.scrollHeight;
      const input = document.querySelector('[data-discovery-input]');
      if (input) input.focus({ preventScroll: true });
    });
  }
  if (preserveScroll) window.scrollTo(0, scrollY);
}

function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.nav)));
  document.querySelector('[data-menu]')?.addEventListener('click', () => { mobileMenu = !mobileMenu; render({ preserveScroll: true }); });
  document.querySelector('[data-discovery-input]')?.addEventListener('input', (e) => {
    discovery.input = e.target.value;
    document.querySelector('.send-button')?.toggleAttribute('disabled', !discovery.input.trim());
  });
  document.querySelector('[data-discovery-form]')?.addEventListener('submit', (e) => { e.preventDefault(); submitDiscovery(discovery.input); });
  document.querySelector('[data-discovery-input]')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDiscovery(e.target.value); } });
  document.querySelector('[data-voice]')?.addEventListener('click', startVoice);
  document.querySelector('[data-copy]')?.addEventListener('click', copyBrief);
  document.querySelector('[data-email]')?.addEventListener('click', emailBrief);
  document.querySelector('[data-prev]')?.addEventListener('click', () => moveCockpit(-1));
  document.querySelector('[data-next]')?.addEventListener('click', () => moveCockpit(1));
  const deck = document.querySelector('[data-deck]');
  deck?.addEventListener('pointerdown', e => { pointerStart = e.clientX; });
  deck?.addEventListener('pointerup', e => { if (pointerStart == null) return; const delta = e.clientX - pointerStart; pointerStart = null; if (Math.abs(delta) > 60) moveCockpit(delta < 0 ? 1 : -1); });
  const speak = document.querySelector('[data-speak]');
  speak?.addEventListener('pointerdown', () => setSpeakState(true));
  speak?.addEventListener('pointerup', () => setSpeakState(false));
  speak?.addEventListener('pointercancel', () => setSpeakState(false));
  document.querySelectorAll('[data-chapter]').forEach(btn => btn.addEventListener('click', () => { clientChapter = btn.dataset.chapter; render({ preserveScroll: true }); }));
}

function bindReveal() {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting)), { threshold: .22, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
  const signal = document.querySelector('[data-signal-field]');
  if (signal) {
    const signalObserver = new IntersectionObserver(([entry]) => signal.classList.toggle('signal-field--ordered', entry.isIntersecting), { threshold: .42 });
    signalObserver.observe(signal);
  }
}

function navigate(next) {
  if (!ROUTES.has(next)) return;
  route = next; mobileMenu = false; location.hash = `/${next}`; window.scrollTo({ top: 0, behavior: 'smooth' }); render();
}

function submitDiscovery(raw) {
  const value = String(raw || '').trim();
  if (!value || discovery.step >= discoveryQuestions.length) return;
  const q = discoveryQuestions[discovery.step];
  discovery.brief[q.key] = { value, source:'client-supplied', confidence:'direct' };
  discovery.messages.push({ type:'user', text:value });
  discovery.input = '';
  discovery.step += 1;
  if (discovery.step < discoveryQuestions.length) discovery.messages.push({ type:'system', text:discoveryQuestions[discovery.step].prompt });
  else discovery.messages.push({ type:'system', text:'This is not our diagnosis. It is the beginning of our conversation. Nothing here becomes a WorldStage conclusion until a person reviews it.' });
  render();
}

function startVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    discovery.messages.push({ type:'system-note', text:'Voice capture is not available in this browser. You can type instead.' });
    render(); return;
  }
  const recognition = new Recognition();
  recognition.lang = 'en-PH'; recognition.interimResults = false; recognition.maxAlternatives = 1;
  discovery.listening = true; render({ preserveScroll:true });
  recognition.onresult = e => { discovery.input = e.results[0][0].transcript; render({ preserveScroll:true }); };
  recognition.onerror = () => { discovery.messages.push({ type:'system-note', text:'Voice capture could not complete. No response was submitted.' }); discovery.listening = false; render(); };
  recognition.onend = () => { discovery.listening = false; render({ preserveScroll:true }); };
  recognition.start();
}

async function copyBrief() {
  await navigator.clipboard.writeText(`WORLDSTAGE DISCOVERY BRIEF\n\n${summaryText()}\n\nClient-supplied; not a WorldStage diagnosis.`);
  discovery.copied = true; render({ preserveScroll:true }); setTimeout(() => { discovery.copied = false; render({ preserveScroll:true }); }, 1500);
}

function emailBrief() {
  const subject = encodeURIComponent('WorldStage discovery conversation');
  const body = encodeURIComponent(`Hello WorldStage,\n\nI would like to continue a discovery conversation.\n\n${summaryText()}\n\nThis summary reflects my own responses and is not a WorldStage diagnosis.`);
  location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function moveCockpit(delta) {
  cockpitIndex = Math.max(0, Math.min(cockpitCards.length - 1, cockpitIndex + delta)); render({ preserveScroll:true });
}

function setSpeakState(listening) {
  const control = document.querySelector('[data-speak]');
  if (!control) return;
  control.classList.toggle('is-listening', listening);
  const b = control.querySelector('b'); const small = control.querySelector('small');
  if (b) b.textContent = listening ? 'Listening…' : 'Speak to WorldStage';
  if (small) small.textContent = listening ? 'Release to stop' : 'Hold to simulate capture';
}

window.addEventListener('hashchange', () => { route = routeFromHash(); mobileMenu = false; render(); window.scrollTo(0,0); });
window.addEventListener('scroll', () => {
  const current = window.scrollY; const nextVisible = current < 64 || current < lastScroll; lastScroll = current;
  if (nextVisible !== navVisible) { navVisible = nextVisible; const nav = document.querySelector('.global-nav'); if (nav) nav.className = `global-nav ${navVisible ? 'global-nav--visible' : 'global-nav--hidden'}`; }
}, { passive:true });

render();
