/* Hero con fotogramas sincronizados al scroll (portado del prototipo scroll-hero).
   GSAP ScrollTrigger + Lenis, instalados por npm. Misma lógica y mismos beats. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const CONFIG = {
  frameCount: 240,
  desktopPath: '/hero/frames/desktop/',
  mobilePath: '/hero/frames/mobile/',
  mobileMq: '(max-width: 767px)',
  concurrency: 8,
  dprCap: 2,
};

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

export function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const preloader = document.getElementById('preloader');
  const preFill = document.getElementById('preloader-fill');
  const prePct = document.getElementById('preloader-pct');
  const overlays = Array.from(document.querySelectorAll('#hero-sequence [data-start]'));
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMq = window.matchMedia(CONFIG.mobileMq);

  // ?p=0.66 permite revisar un punto concreto del recorrido (solo en desarrollo).
  const params = new URLSearchParams(location.search);
  const shotProgress = import.meta.env.DEV && params.has('p') ? clamp(parseFloat(params.get('p')), 0, 1) : null;

  const frames = new Array(CONFIG.frameCount);
  let current = -1;
  let lenis = null;
  let trigger = null;

  const frameUrl = (i) => `${mobileMq.matches ? CONFIG.mobilePath : CONFIG.desktopPath}${String(i + 1).padStart(4, '0')}.webp`;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (current >= 0 && frames[current]) draw(frames[current]);
    }
  }

  function draw(img) {
    if (!img || !img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function nearestFrame(i) {
    for (let d = 1; d < CONFIG.frameCount; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function setFrame(progress) {
    const i = Math.round(clamp(progress, 0, 1) * (CONFIG.frameCount - 1));
    if (i !== current) {
      current = i;
      const img = frames[i] || nearestFrame(i);
      if (img) draw(img);
    }
    updateOverlays(progress);
  }

  function updateOverlays(progress) {
    overlays.forEach((el) => {
      const a = parseFloat(el.dataset.start);
      const b = parseFloat(el.dataset.end);
      const fade = parseFloat(el.dataset.fade || '0.03');
      let t = 0;
      if (progress >= a && progress <= b) {
        const fadeIn = a <= 0 ? 1 : clamp((progress - a) / fade, 0, 1);
        const fadeOut = b >= 1 ? 1 : clamp((b - progress) / fade, 0, 1);
        t = Math.min(fadeIn, fadeOut);
      }
      el.style.opacity = String(t);
      const off = (1 - t) * 18;
      if (el.classList.contains('scroll-hint')) el.style.transform = `translateX(-50%) translateY(${(1 - t) * 10}px)`;
      else if (el.classList.contains('copy-center')) el.style.transform = `translate(-50%, calc(-50% + ${off}px))`;
      else if (el.classList.contains('copy-low')) el.style.transform = `translate(-50%, ${off}px)`;
      else if (el.classList.contains('copy-left') && window.innerWidth > 767) el.style.transform = `translateY(calc(-50% + ${off}px))`;
      else el.style.transform = `translateY(${off}px)`;
      el.style.pointerEvents = t > 0.6 ? 'auto' : 'none';
      el.setAttribute('aria-hidden', t < 0.05 ? 'true' : 'false');
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = async () => {
        // decode() puede quedarse esperando si la pestaña no se está pintando
        // (pestaña en segundo plano); con un tope, el onload basta.
        try { if (img.decode) await Promise.race([img.decode(), new Promise((r) => setTimeout(r, 1500))]); } catch { /* el onload basta */ }
        resolve(img);
      };
      img.onerror = () => reject(new Error('Konnte nicht laden ' + src));
      img.src = src;
    });
  }

  async function preload() {
    const total = CONFIG.frameCount;
    let loaded = 0;
    let cursor = 0;
    const update = () => {
      const pct = Math.round((loaded / total) * 100);
      preFill.style.width = pct + '%';
      prePct.textContent = pct + '%';
    };
    async function worker() {
      while (cursor < total) {
        const i = cursor++;
        try { frames[i] = await loadImage(frameUrl(i)); } catch (err) { console.warn(err.message); }
        loaded += 1;
        update();
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONFIG.concurrency, total) }, worker));
    update();
  }

  function hidePreloader() {
    preloader.classList.add('is-done');
    document.body.classList.add('is-ready');
  }

  function setupScroll() {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduceMq.matches) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    trigger = ScrollTrigger.create({
      trigger: '#hero-sequence',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.2,
      onUpdate: (self) => setFrame(self.progress),
    });
    setFrame(trigger.progress || 0);
  }

  function setupReduced() {
    document.body.classList.add('is-reduced', 'is-ready');
    preloader.classList.add('is-done');
    updateOverlays(1);
  }

  function heroProgressToScroll(p) {
    const el = document.getElementById('hero-sequence');
    return el.offsetTop + Math.max(0, el.offsetHeight - window.innerHeight) * p;
  }

  async function init() {
    resize();
    window.addEventListener('resize', () => { resize(); if (trigger) ScrollTrigger.refresh(); });

    if (reduceMq.matches && shotProgress === null) { setupReduced(); return; }

    try { await preload(); } catch (err) { console.error(err); }

    setFrame(shotProgress === null ? 0 : shotProgress);
    setupScroll();

    if (shotProgress !== null) {
      const y = heroProgressToScroll(shotProgress);
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      requestAnimationFrame(() => { ScrollTrigger.refresh(); setFrame(shotProgress); hidePreloader(); });
    } else {
      hidePreloader();
    }
  }

  return init();
}
