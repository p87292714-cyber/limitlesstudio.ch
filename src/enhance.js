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

export function initEnhance() {
  syncPressed();
  cards();
  menu();
  anchorFocus();
}
