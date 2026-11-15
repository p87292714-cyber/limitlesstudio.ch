/* Barrierefreiheit über dem Prototyp «Reise», ohne dessen Skripte zu ändern:
   aria-pressed für Auswahl-Knöpfe, Tastatur für Leistungs-Karten,
   Escape schliesst das Menü, Fokus nach Anker-Sprung. */

const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

function syncPressed() {
  const btns = $$('.yn button, #c-fee button, #calc-sector button, #price-mode button, #sector-chips button');
  const set = (b) => b.setAttribute('aria-pressed', String(b.classList.contains('is-on')));
  btns.forEach(set);
  const mo = new MutationObserver((list) => list.forEach((m) => set(m.target)));
  btns.forEach((b) => mo.observe(b, { attributes: true, attributeFilter: ['class'] }));
}

function cards() {
  $$('.tcard').forEach((c) => {
    c.setAttribute('role', 'button');
    c.setAttribute('aria-expanded', 'false');
    new MutationObserver(() => c.setAttribute('aria-expanded', String(c.classList.contains('is-open'))))
      .observe(c, { attributes: true, attributeFilter: ['class'] });
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
    });
  });
}

function menu() {
  const burger = document.getElementById('burger');
  if (!burger) return;
  const label = () => burger.setAttribute('aria-label', document.body.classList.contains('menu-open') ? 'Menü schliessen' : 'Menü öffnen');
  new MutationObserver(() => {
    label();
    burger.setAttribute('aria-expanded', String(document.body.classList.contains('menu-open')));
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      burger.focus();
    }
  });
  addEventListener('resize', () => { if (innerWidth > 900) document.body.classList.remove('menu-open'); });
}

function anchorFocus() {
  // sections.js scrollt mit Lenis (1,6 s); danach den Fokus auf das Ziel setzen.
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', () => {
    const id = a.getAttribute('href');
    const el = id.length > 1 && id !== '#top' && document.querySelector(id);
    if (!el) return;
    setTimeout(() => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }, window.__lenis ? 1700 : 0);
  }));
}

/* Rechner: realistische Bereiche und Beispielwerte je Branche.
   Reihenfolge der Chips: Gastro, Coiffeur, Fitness, Laden, Praxis, Handwerk, Hotel.
   Beispielannahmen (keine Messwerte) – im Bericht als Schätzung gekennzeichnet. */
const SECTOR_CALC = [
  { label: 'Durchschnittsbon',       clients: [20, 40],  ticket: [50, 15, 120, 5],     visits: [1, 2], margin: 65 },
  { label: 'Preis pro Termin',       clients: [10, 20],  ticket: [80, 30, 250, 5],     visits: [1, 1], margin: 70 },
  { label: 'Mitgliederbeitrag / Mt.', clients: [8, 15],  ticket: [100, 40, 150, 5],    visits: [1, 1], margin: 80 },
  { label: 'Durchschnittsbon',       clients: [30, 50],  ticket: [45, 10, 200, 5],     visits: [1, 2], margin: 40 },
  { label: 'Preis pro Termin',       clients: [10, 20],  ticket: [120, 60, 250, 10],   visits: [1, 2], margin: 60 },
  { label: 'Auftragswert',           clients: [2, 8],    ticket: [1500, 300, 5000, 100], visits: [1, 1], margin: 35 },
  { label: 'Umsatz pro Aufenthalt',  clients: [10, 30],  ticket: [300, 100, 600, 10],  visits: [1, 1], margin: 70 },
];

function calcSectors() {
  const chips = $$('#calc-sector button');
  if (!chips.length) return;
  const el = (id) => document.getElementById(id);
  const setRange = (id, value, min, max, step = 1) => {
    const r = el('c-' + id);
    r.min = min; r.max = max; r.step = step; r.value = value;
  };
  const apply = (i) => {
    const s = SECTOR_CALC[i];
    if (!s) return;
    el('l-ticket').textContent = s.label;
    setRange('clients', s.clients[0], 1, s.clients[1]);
    setRange('ticket', s.ticket[0], s.ticket[1], s.ticket[2], s.ticket[3]);
    setRange('visits', s.visits[0], 1, s.visits[1]);
    setRange('margin', s.margin, 20, 80, 5);
    // sections.js rechnet bei «input» neu
    el('c-clients').dispatchEvent(new Event('input', { bubbles: true }));
  };
  chips.forEach((b, i) => b.addEventListener('click', () => apply(i)));
  // sections.js startet mit einem fest eingetragenen Paketpreis: auf den aktiven Knopf abgleichen
  document.querySelector('#c-fee button.is-on')?.click();
  apply(Math.max(0, chips.findIndex((b) => b.classList.contains('is-on'))));
}

/* Preise: Zeile «regulär …» wechselt mit Monatlich / Einrichtung */
function priceRegular() {
  $$('#price-mode button').forEach((b) => b.addEventListener('click', () => {
    $$('.plan .regular[data-month]').forEach((p) => { p.textContent = p.dataset[b.dataset.m]; });
  }));
}

export function initEnhance() {
  syncPressed();
  cards();
  menu();
  anchorFocus();
  calcSectors();
  priceRegular();
}
