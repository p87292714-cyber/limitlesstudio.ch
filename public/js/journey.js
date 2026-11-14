/* Reise: das Video (als WebP-Fotogramme) liegt fix hinter der ganzen Seite
   und läuft mit dem Scroll der gesamten Seite. GSAP ScrollTrigger + Lenis. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const SETS = {
    desktop: { path: "frames/desktop/", count: 400, fps: 24, conc: 6, w: 1920, h: 1080 },
    mobile: { path: "frames/mobile/", count: 200, fps: 12, conc: 4, w: 1280, h: 720 },
  };
  const DURATION = 16.62; // s (letztes Fotogramm ≈ 16,625 s)
  const HERO_T = 1.25;    // diese Sekunden (≈ erster Bildschirm) werden vor dem Start geladen

  /* Scroll → Videozeit, stückweise linear. [Selektor, Kante, Zeit in s]
     top = Oberkante der Sektion oben im Viewport; end = Unterkante unten im Viewport. */
  const ANCHORS = [
    [null, "start", 0],
    ["#problem", "top", 1.6],      // Hero = Intro-Gang
    ["#problem", "end", 3.4],      // rissiger Boden hinter Problem + Quiz
    ["#sprung", "end", 6.75],      // Energie, Absprung, Blitz-Höhepunkt
    ["#leistungen", "top", 7.1],   // Blitz löst sich zur Erde auf
    ["#leistungen", "end", 8.6],   // Erde von oben
    ["#loesung", "end", 9.7],      // Annäherung → Visier
    ["#referenz", "end", 12.3],    // Visier-Nahaufnahme hinter Ablauf + Audit
    ["#preise", "top", 12.5],
    ["#preise", "end", 14.8],      // Sturzflug, Eintritt in die Wolken
    ["#faq", "end", 15.7],         // Wolken hinter Branchen + FAQ
    ["#finale", "end", 16.3],      // grüner Nebel
    [null, "max", DURATION],
  ];
  // Standbilder bei «Bewegung reduzieren» (Zeit pro Sektion)
  const STILLS = { "hero-sequence": 0.6, problem: 2.0, sprung: 5.6, leistungen: 7.6, loesung: 9.8, ablauf: 10.6, referenz: 11.6, preise: 13.9, branchen: 15.0, faq: 15.4, finale: 16.1, kontakt: 16.5 };
  // Kapitel für das HUD (Startzeit in s)
  const CHAPTERS = [0, 4.5, 7.0, 9.4, 12.4, 15.6];

  const canvas = $("#bg-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const preloader = $("#preloader"), preFill = $("#preloader-fill"), prePct = $("#preloader-pct");
  const wipe = $("#wipe"), mist = $("#mist"), hudT = $("#hud-t");
  const hudLinks = $$(".hud a");
  const overlays = $$("#hero-sequence [data-start]");
  const hero = $("#hero-sequence");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = matchMedia("(max-width: 767px)").matches;
  const SET = isMobile ? SETS.mobile : SETS.desktop;
  const params = new URLSearchParams(location.search);
  const shotP = params.has("p") ? clamp(parseFloat(params.get("p")), 0, 1) : null;

  const frames = new Array(SET.count);
  const state = new Uint8Array(SET.count); // 0 = offen, 1 = angefragt, 2 = geladen
  let points = [];            // [{y, t}]
  let targetT = 0, curT = 0, drawnIdx = -1, lastY = 0, vel = 0;
  let lenis = null;
  window.__journey = { t: 0, vel: 0, duration: DURATION };

  const urlOf = (i) => `${SET.path}${String(i + 1).padStart(4, "0")}.webp`;
  const idxOf = (t) => clamp(Math.round(t * SET.fps), 0, SET.count - 1);

  /* ---------- Canvas ---------- */
  function resize() {
    const vw = innerWidth, vh = innerHeight;
    const cover = Math.max(vw / SET.w, vh / SET.h);          // CSS-px pro Bild-px
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.max(1, 1 / cover)); // nie mehr Pixel als das Bild hat
    const w = Math.round(vw * 1.04 * dpr), h = Math.round(vh * 1.04 * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; drawnIdx = -1; }
  }
  function draw(img) {
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
    // Hochformat: Bildausschnitt folgt dem Astronauten (Gang rechts der Mitte, danach zentriert)
    const fx = 0.5 + 0.15 * (1 - smooth(5.2, 6.6, curT));
    const x = clamp(cw / 2 - fx * dw, cw - dw, 0);
    ctx.drawImage(img, x, (ch - dh) / 2, dw, dh);
  }
  function nearestLoaded(i) {
    if (state[i] === 2) return i;
    for (let d = 1; d < SET.count; d++) {
      if (i - d >= 0 && state[i - d] === 2) return i - d;
      if (i + d < SET.count && state[i + d] === 2) return i + d;
    }
    return -1;
  }
  function render() {
    const j = nearestLoaded(idxOf(curT));
    if (j < 0 || j === drawnIdx) return;
    draw(frames[j]);
    drawnIdx = j;
  }

  /* ---------- Laden: Hero zuerst, Rest progressiv (grob → fein) ---------- */
  function load(i) {
    state[i] = 1;
    return new Promise((res) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames[i] = img; state[i] = 2; res(); };
      img.onerror = () => { state[i] = 0; res(); };
      img.src = urlOf(i);
    });
  }
  async function loadHero(onProgress) {
    // Desktop: jedes 2. Bild des ersten Bildschirms vorab, der Rest folgt sofort im Hintergrund
    const step = isMobile ? 1 : 2, list = [];
    for (let i = 0; i <= idxOf(HERO_T); i += step) list.push(i);
    const n = list.length; let done = 0, k = 0;
    // decode() kann in Hintergrund-Tabs hängen bleiben (die Seite wird nicht gezeichnet): mit Zeitlimit
    const decode = (img) => Promise.race([img?.decode?.(), new Promise((r) => setTimeout(r, 1500))]);
    const work = async () => { while (k < n) { const i = list[k++]; await load(i); try { await decode(frames[i]); } catch (_) {} onProgress(++done / n); } };
    await Promise.all(Array.from({ length: SET.conc }, work));
  }
  function loadRest() {
    const order = [];
    [16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < SET.count; i += step) order.push(i); });
    let q = 0;
    const next = () => {
      // Vorrang: fehlende Bilder nahe der aktuellen Position
      const w = idxOf(targetT);
      for (let d = 0; d <= 10; d++) {
        for (const i of [w + d, w - d]) if (i >= 0 && i < SET.count && state[i] === 0) return i;
      }
      while (q < order.length && state[order[q]] !== 0) q++;
      return q < order.length ? order[q] : -1;
    };
    const work = async () => { let i; while ((i = next()) >= 0) await load(i); };
    for (let c = 0; c < SET.conc; c++) work();
  }

  /* ---------- Scroll → Zeit ---------- */
  function docTop(el) {
    const host = el.parentElement && el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el;
    return host.getBoundingClientRect().top + scrollY;
  }
  function docH(el) {
    const host = el.parentElement && el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el;
    return host.offsetHeight;
  }
  function computePoints() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    let prev = -1;
    points = ANCHORS.map(([sel, edge, t]) => {
      let y = 0;
      if (edge === "max") y = max;
      else if (sel) {
        const el = $(sel);
        const top = docTop(el), h = docH(el);
        y = edge === "top" ? top : top + Math.max(h - innerHeight, h * 0.6);
      }
      y = clamp(y, prev + 1, max); prev = y;
      return { y, t };
    });
  }
  function timeAt(y) {
    if (!points.length) return 0;
    if (y <= points[0].y) return points[0].t;
    for (let k = 1; k < points.length; k++) {
      const a = points[k - 1], b = points[k];
      if (y <= b.y) return a.t + (b.t - a.t) * ((y - a.y) / (b.y - a.y));
    }
    return points[points.length - 1].t;
  }

  /* ---------- Hero-Texte ---------- */
  function updateOverlays() {
    const max = Math.max(1, hero.offsetHeight - innerHeight);
    const p = clamp(scrollY / max, 0, 1);
    overlays.forEach((el) => {
      const a = +el.dataset.start, b = +el.dataset.end, f = +(el.dataset.fade || 0.05);
      let o = 0;
      if (p >= a && p <= b) o = Math.min(a <= 0 ? 1 : clamp((p - a) / f, 0, 1), b >= 1 ? 1 : clamp((b - p) / f, 0, 1));
      el.style.opacity = o;
      const dy = (1 - o) * -24;
      if (el.classList.contains("scroll-hint")) el.style.transform = `translateX(-50%) translateY(${(1 - o) * 10}px)`;
      else if (el.classList.contains("copy-left") && innerWidth > 767) el.style.transform = `translateY(calc(-50% + ${dy}px))`;
      else el.style.transform = `translateY(${dy}px)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    });
  }

  /* ---------- Overlays aus der Videozeit ---------- */
  let lastCh = -1;
  function updateFx(t) {
    // Blitz als Wischer zwischen «Sprung» und «Leistungen»
    const flash = 1 - smooth(0, 0.42, Math.abs(t - 6.8));
    wipe.style.opacity = (flash * 0.92).toFixed(3);
    mist.style.opacity = (smooth(15.5, 16.5, t) * 0.5).toFixed(3);
    if (hudT) hudT.textContent = t.toFixed(1).padStart(4, "0");
    let ch = 0; CHAPTERS.forEach((c, k) => { if (t >= c) ch = k; });
    if (ch !== lastCh) { lastCh = ch; hudLinks.forEach((a, k) => a.classList.toggle("is-on", k === ch)); document.body.dataset.chapter = ch; }
  }

  function tick() {
    const y = scrollY;
    const dy = y - lastY; lastY = y;
    vel += (dy - vel) * 0.25;
    targetT = timeAt(y);
    const d = targetT - curT;
    curT = Math.abs(d) < 0.002 ? targetT : curT + d * (isMobile ? 0.22 : 0.3);
    window.__journey.t = curT; window.__journey.vel = vel;
    render();
    updateFx(curT);
    updateOverlays();
  }

  /* ---------- Fokus: Hintergrund dimmen/weichzeichnen, solange Text im Bild ist ---------- */
  function setupFocus() {
    const active = new Set();
    $$(".sec:not(.hscroll)").forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: "top 62%", end: "bottom 38%",
        onToggle: (self) => { self.isActive ? active.add(sec) : active.delete(sec); document.body.classList.toggle("bg-focus", active.size > 0); },
      });
    });
  }

  /* ---------- Start ---------- */
  function hidePreloader() {
    preloader.classList.add("is-done");
    document.body.classList.add("is-ready");
    document.body.dataset.ready = "1";
    setTimeout(() => document.dispatchEvent(new Event("hero:ready")), 60);
  }

  function setupLenis() {
    if (typeof Lenis === "undefined" || reduce) return;
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  async function initReduced() {
    document.body.classList.add("is-reduced");
    hidePreloader();
    const show = async (id) => {
      const t = STILLS[id]; if (t == null) return;
      const i = idxOf(t);
      if (state[i] !== 2) await load(i);
      if (frames[i]) draw(frames[i]);
      mist.style.opacity = t > 16 ? 0.5 : 0;
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && show(e.target.id)), { rootMargin: "-45% 0px -45% 0px" });
    $$("#hero-sequence, main > section[id]").forEach((s) => io.observe(s));
    show("hero-sequence");
    addEventListener("resize", () => { resize(); });
  }

  async function init() {
    resize();
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") { console.warn("GSAP fehlt"); }
    gsap.registerPlugin(ScrollTrigger);
    if (reduce && shotP === null) return initReduced();

    setupLenis();
    ScrollTrigger.addEventListener("refresh", computePoints);
    setupFocus();
    addEventListener("resize", () => { resize(); ScrollTrigger.refresh(); });

    const t0 = performance.now();
    await loadHero((f) => { const p = Math.round(f * 100); preFill.style.width = p + "%"; prePct.textContent = p + "%"; });
    ScrollTrigger.refresh();
    computePoints();
    if (shotP !== null) {
      const y = shotP * (document.documentElement.scrollHeight - innerHeight);
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
      lastY = scrollY; curT = targetT = timeAt(scrollY);
    }
    render(); updateFx(curT); updateOverlays();
    gsap.ticker.add(tick);
    loadRest();
    const wait = Math.max(0, 350 - (performance.now() - t0));
    setTimeout(hidePreloader, wait);
  }

  window.__journeyDebug = () => ({ points, curT, targetT, loaded: state.reduce((a, b) => a + (b === 2), 0), count: SET.count, set: isMobile ? "mobile" : "desktop" });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
