/* Interaktive Sektionen: Quiz, Rechner, Slider, Tabs, Animationen.
   Portiert aus scroll-hero/js/sections.js (interaktive Version). */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const chf = (v) => (v < 0 ? '−' : '') + 'CHF ' + Math.round(Math.abs(v)).toLocaleString('de-CH');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Aktiviert genau einen Button einer Gruppe (Klasse + aria-pressed). */
function selectOne(buttons, active) {
  buttons.forEach((x) => {
    const on = x === active;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-pressed', String(on));
  });
}
function initGroup(buttons) {
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.classList.contains('is-on'))));
}

/* --- Mini-Digital-Check --- */
function initQuiz() {
  const answers = {};
  const ring = $('#ring-fg'), num = $('#quiz-num'), label = $('#quiz-label');
  $$('.quiz-q li').forEach((li) => {
    const btns = $$('button', li);
    initGroup(btns);
    btns.forEach((b) => b.addEventListener('click', () => {
      selectOne(btns, b);
      answers[li.dataset.q] = +b.dataset.a;
      update();
    }));
  });
  function update() {
    const n = Object.keys(answers).length;
    const leaks = Object.values(answers).filter((a) => a === 0).length;
    num.textContent = leaks;
    ring.style.strokeDashoffset = String(326.7 * (1 - leaks / 5));
    ring.style.stroke = leaks >= 3 ? '#ff6b6b' : '#B6FF3B';
    if (n < 5) label.textContent = `${leaks} ${leaks === 1 ? 'Leck' : 'Lecks'} bisher · noch ${5 - n} ${5 - n === 1 ? 'Frage' : 'Fragen'}`;
    else if (leaks === 0) label.textContent = 'Stark! Prüfen wir die übrigen 10 Punkte.';
    else label.textContent = `${leaks} von 5 Lecks gefunden. Hier verlieren Sie Kundschaft.`;
  }
}

/* --- Rechner (Formel aus dem Referenzdokument der Agentur) --- */
function initCalc() {
  const ids = ['clients', 'ticket', 'visits', 'margin'];
  let fee = 690;
  function calc() {
    const v = Object.fromEntries(ids.map((k) => [k, +$('#c-' + k).value]));
    ids.forEach((k) => ($('#o-' + k).textContent = v[k]));
    const revenue = v.clients * v.ticket * v.visits;
    const contribution = revenue * (v.margin / 100);
    const net = contribution - fee;
    const perClient = v.ticket * v.visits * (v.margin / 100);
    const be = perClient > 0 ? fee / perClient : 0;
    $('#r-rev').textContent = chf(revenue);
    $('#r-con').textContent = chf(contribution);
    const rn = $('#r-net'); rn.textContent = chf(net); rn.classList.toggle('neg', net < 0);
    $('#r-be').textContent = be.toFixed(1).replace('.', ',');
    $$('.plan').forEach((p) => p.classList.toggle('is-match', +p.dataset.plan === fee));
  }
  ids.forEach((k) => $('#c-' + k).addEventListener('input', calc));
  const feeBtns = $$('#c-fee button');
  initGroup(feeBtns);
  feeBtns.forEach((b) => b.addEventListener('click', () => { selectOne(feeBtns, b); fee = +b.dataset.fee; calc(); }));
  const secBtns = $$('#calc-sector button');
  initGroup(secBtns);
  secBtns.forEach((b) => b.addEventListener('click', () => { selectOne(secBtns, b); $('#calc-kpi').textContent = 'KPI: ' + b.dataset.kpi; }));
  calc();
}

/* --- Preis-Umschalter Monatlich / Einrichtung --- */
function initPriceMode() {
  const btns = $$('#price-mode button');
  initGroup(btns);
  btns.forEach((b) => b.addEventListener('click', () => {
    selectOne(btns, b);
    $$('.plan .price').forEach((p) => (p.textContent = p.dataset[b.dataset.m]));
  }));
}

/* --- Vorher / Nachher --- */
function initBeforeAfter() {
  const range = $('#ba-range');
  const set = () => {
    $('#ba-after').style.clipPath = `inset(0 0 0 ${range.value}%)`;
    $('#ba-handle').style.left = range.value + '%';
  };
  range.addEventListener('input', set);
  set();
}

/* --- Branchen-Tabs (Inhalte aus dem Referenzdokument) --- */
const SECTORS = [
  { p: ['Reservation per Telefon', 'Speisekarte als PDF', 'Bewertungen unbeantwortet', 'Abhängig von Uber Eats'], s: ['Google & Bewertungen', 'Sofort-Reservation', 'Gutscheine & WhatsApp-Kanal'], k: 'Zusätzliche Gedecke pro Woche und online verkaufte Gutscheine.' },
  { p: ['Termine nur per Telefon', 'No-Shows', 'Instagram ohne Buchungslink', 'Keine Erinnerungen'], s: ['Online-Buchung 24/7', 'Erinnerungen gegen Ausfälle', 'Instagram als Portfolio'], k: 'Auslastung der Agenda und Ausfallquote.' },
  { p: ['Probetraining ohne Nachfassen', 'Kursplan als Bild', 'Kündigungen ohne Rückgewinnung', 'Kein Video'], s: ['Probetraining-Funnel', 'Kundenbindung', 'Echte Mitglieder im Video'], k: 'Netto-Neumitglieder pro Monat.' },
  { p: ['Sortiment unsichtbar bei Google', 'Kein Click & Collect', 'Veraltete Öffnungszeiten', 'Keine Kundendatenbank'], s: ['Digitales Schaufenster', 'Click & Collect', 'Kundenclub'], k: 'Klicks auf «Route» und Anrufe aus Google.' },
  { p: ['Telefon überlastet', 'Lücken durch Ausfälle', 'Immer gleiche Fragen', 'Generische Fotos'], s: ['Online-Termine', 'Erinnerungen & Warteliste', 'FAQ-Chatbot ohne Gesundheitsdaten'], k: 'Anteil Online-Termine und gefüllte Lücken.' },
  { p: ['Verpasste Anrufe auf der Baustelle', 'Kein Offertformular mit Fotos', 'Keine Bewertungen nach dem Auftrag', 'Portalgebühren pro Kontakt'], s: ['Nie mehr Anrufe verpassen', 'Bewertung nach jedem Auftrag', 'Website nach Region'], k: 'Kosten pro Offertanfrage vs. Portal.' },
  { p: ['Abhängig von Homegate & ImmoScout24', 'Langsame Antworten', 'Wenige Verkaufsmandate', 'Inserate ohne Video'], s: ['Verkäufer gewinnen', 'Sofort-Antwort', 'Video pro Objekt'], k: 'Gewonnene Verkaufsmandate und Antwortzeit.' },
  { p: ['Booking.com-Provisionen', 'Wenig Direktbuchungen', 'Keine E-Mails an frühere Gäste', 'Alte Fotos'], s: ['Direktbuchung', 'Gäste-CRM', 'Mehrsprachiger Chatbot'], k: 'Anteil Direktbuchungen und gesparte Provision.' },
];

function initSectors(reduce) {
  const panel = $('#sector-panel');
  const show = (i, animate) => {
    const d = SECTORS[i];
    panel.innerHTML = `<div><h3>Typische Lecks</h3><ul>${d.p.map((x) => `<li><span aria-hidden="true">✕ </span>${esc(x)}</li>`).join('')}</ul></div><div><h3>Unsere Lösung</h3><ul>${d.s.map((x) => `<li><span aria-hidden="true">✓ </span>${esc(x)}</li>`).join('')}</ul></div><p class="kpi">KPI, der zählt: ${esc(d.k)}</p>`;
    if (animate && !reduce) gsap.fromTo(panel.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.4 });
  };
  const btns = $$('#sector-chips button');
  initGroup(btns);
  btns.forEach((b) => b.addEventListener('click', () => { selectOne(btns, b); show(+b.dataset.i, true); }));
  show(0, false);
}

/* --- Leistungs-Karten: antippen oder Enter/Leertaste --- */
function initCards() {
  $$('.tcard').forEach((c) => {
    c.setAttribute('role', 'button');
    c.setAttribute('aria-expanded', 'false');
    const toggle = () => c.setAttribute('aria-expanded', String(c.classList.toggle('is-open')));
    c.addEventListener('click', toggle);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
}

/* --- FAQ: nur eins offen --- */
function initFaq() {
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.faq details').forEach((o) => o !== d && (o.open = false));
  }));
}

/* --- Burger-Menü --- */
function initBurger() {
  const burger = $('#burger');
  const set = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  burger.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
  $$('#menu a').forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { set(false); burger.focus(); }
  });
  addEventListener('resize', () => { if (innerWidth > 900 && document.body.classList.contains('menu-open')) set(false); });
}

/* --- Fortschrittsbalken --- */
function initProgress() {
  const bar = $('#progress-bar');
  const prog = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener('scroll', prog, { passive: true });
  prog();
}

/* --- Anker-Links: Lenis + Fokus (Tastatur, Screenreader) --- */
function initAnchors(reduce) {
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id.length > 1 && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const focus = () => { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); };
    if (window.__lenis) window.__lenis.scrollTo(el, { onComplete: focus });
    else { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); focus(); }
    history.replaceState(null, '', id);
  }));
}

/* --- Aktiver Menüpunkt --- */
function initActiveNav() {
  $$('#menu a[href^="#"]').forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: (s) => {
        a.classList.toggle('is-active', s.isActive);
        if (s.isActive) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      },
    });
  });
}

/* --- Animationen (nicht bei prefers-reduced-motion) --- */
function initMotion() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    const glow = $('#glow');
    let gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; document.body.classList.add('has-glow'); }, { passive: true });
    (function loop() { gx += (tx - gx) * 0.15; gy += (ty - gy) * 0.15; glow.style.transform = `translate(${gx}px,${gy}px)`; requestAnimationFrame(loop); })();
    $$('.magnetic').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      b.addEventListener('mouseleave', () => (b.style.transform = ''));
    });
    $$('.tcard-in, .tilt').forEach((c) => {
      c.addEventListener('mousemove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      });
      c.addEventListener('mouseleave', () => (c.style.transform = ''));
    });
  }

  $$('.reveal').forEach((el) => gsap.from(el, { opacity: 0, y: 28, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));

  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: () => (el.textContent = Math.round(o.v)) });
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const track = $('#hs-track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#leistungen', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    gsap.to('#tl-fill', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 80%', end: 'bottom 55%', scrub: true } });
  });
  mm.add('(max-width: 767px)', () => {
    gsap.to('#tl-fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 80%', end: 'bottom 60%', scrub: true } });
  });
  gsap.from('.tl-step', { opacity: 0, y: 24, stagger: 0.15, duration: 0.6, scrollTrigger: { trigger: '#timeline', start: 'top 75%', once: true } });
}

export function initSections() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  initQuiz();
  initCalc();
  initPriceMode();
  initBeforeAfter();
  initSectors(reduce);
  initCards();
  initFaq();
  initBurger();
  initProgress();
  initAnchors(reduce);

  if (reduce) {
    $$('[data-count]').forEach((el) => (el.textContent = el.dataset.count));
    $('#tl-fill').style.transform = 'none';
  } else {
    initMotion();
  }
  // Nach dem Pin von #leistungen erstellen, damit die Positionen den Pin-Abstand enthalten.
  initActiveNav();

  addEventListener('load', () => ScrollTrigger.refresh());
  ScrollTrigger.refresh();
}
