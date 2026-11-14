/* Reveal-Animationen und aktive Navigation */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initSections() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  // Anker-Links: mit Lenis sanft scrollen und den Fokus setzen (Tastatur, Screenreader).
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    a.addEventListener('click', (e) => {
      const sec = document.querySelector(id);
      if (!sec) return;
      e.preventDefault();
      const focus = () => { sec.setAttribute('tabindex', '-1'); sec.focus({ preventScroll: true }); };
      if (window.__lenis) window.__lenis.scrollTo(sec, { onComplete: focus });
      else { sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); focus(); }
      history.replaceState(null, '', id);
    });
  });

  const links = document.querySelectorAll('.nav nav a[href^="#"]');
  links.forEach((a) => {
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

  if (reduce) return;
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 28, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}
