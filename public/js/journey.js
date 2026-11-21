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

  // End time of each section's clip. Scroll selects the clip; the clock plays it.
  const CLIPS = [
    ["hero-sequence", 1.6], ["problem", 3.4], ["sprung", 7.1],
    ["leistungen", 8.6], ["loesung", 9.7], ["ablauf", 10.8],
    ["referenz", 12.3], ["preise", 14.8], ["branchen", 15.2],
    ["faq", 15.7], ["finale", 16.3], ["kontakt", DURATION],
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
  const state = new Uint8Array(SET.count); // 0 = offen, 1 = angefragt, 2 = geladen, 3 = fehlgeschlagen
  let points = [];            // [{y, t}]
  let targetT = 0, curT = 0, drawnIdx = -1, drawnBitmap = false, lastY = 0, vel = 0, dir = 1;
  let lenis = null;
  let dirty = true; // DOM-Overlays neu schreiben (Start, Resize)

  /* ImageBitmap-Cache (nur Desktop): fertig skalierte Bitmaps um das aktuelle Bild herum.
     Aus einem Blob erzeugt, damit das Dekodieren nicht synchron im Haupt-Thread passiert. */
  const BM = { ahead: 10, behind: 3, inflight: 4, near: 3 };
  const useBitmaps = !isMobile && typeof createImageBitmap === "function";
  const bitmaps = new Map(); // idx → ImageBitmap
  const pendingBm = new Set();
  const failedBm = new Set();
  let bmGen = 0, bmW = 0, bmH = 0;
  window.__journey = { t: 0, vel: 0, duration: DURATION };

  const urlOf = (i) => `${SET.path}${String(i + 1).padStart(4, "0")}.webp`;
  const idxOf = (t) => clamp(Math.round(t * SET.fps), 0, SET.count - 1);

  /* ---------- Canvas ---------- */
  function resize() {
    const vw = innerWidth, vh = innerHeight;
    const cover = Math.max(vw / SET.w, vh / SET.h);          // CSS-px pro Bild-px
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.max(1, 1 / cover)); // nie mehr Pixel als das Bild hat
    const w = Math.round(vw * 1.04 * dpr), h = Math.round(vh * 1.04 * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h; drawnIdx = -1; dirty = true;
      clearBitmaps();
      const s = Math.max(w / SET.w, h / SET.h);
      bmW = Math.round(SET.w * s); bmH = Math.round(SET.h * s);
    }
  }
  function placeX(dw) {
    // Hochformat: Bildausschnitt folgt dem Astronauten (Gang rechts der Mitte, danach zentriert)
    const fx = 0.5 + 0.15 * (1 - smooth(5.2, 6.6, curT));
    return clamp(canvas.width / 2 - fx * dw, canvas.width - dw, 0);
  }
  function draw(img) {
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
    ctx.drawImage(img, placeX(dw), (ch - dh) / 2, dw, dh);
  }
  function drawBitmap(bm) {
    // bereits auf «cover»-Grösse skaliert: 1:1 zeichnen, ohne erneutes Skalieren
    ctx.drawImage(bm, Math.round(placeX(bm.width)), Math.round((canvas.height - bm.height) / 2));
  }
  function nearestLoaded(i) {
    if (state[i] === 2) return i;
    for (let d = 1; d < SET.count; d++) {
      if (i - d >= 0 && state[i - d] === 2) return i - d;
      if (i + d < SET.count && state[i + d] === 2) return i + d;
    }
    return -1;
  }
  function nearestBitmap(i) {
    if (bitmaps.has(i)) return i;
    for (let d = 1; d <= BM.near; d++) {
      if (bitmaps.has(i - d)) return i - d;
      if (bitmaps.has(i + d)) return i + d;
    }
    return -1;
  }
  function render() {
    const i = idxOf(curT);
    // 1) exaktes Bitmap, 2) nächstes Bitmap (±3), 3) erst zuletzt das <img>
    const b = useBitmaps ? (state[i] === 2 ? (bitmaps.has(i) ? i : -1) : nearestBitmap(i)) : -1;
    if (b >= 0) {
      if (b === drawnIdx && drawnBitmap) return;
      drawBitmap(bitmaps.get(b));
      drawnIdx = b; drawnBitmap = true;
      return;
    }
    const j = nearestLoaded(i);
    if (j < 0 || (j === drawnIdx && !drawnBitmap)) return;
    draw(frames[j]);
    drawnIdx = j; drawnBitmap = false;
  }

  /* ---------- ImageBitmap-Fenster um das aktuelle Bild ---------- */
  function clearBitmaps() {
    bmGen++;
    bitmaps.forEach((bm) => bm.close && bm.close());
    bitmaps.clear();
    pendingBm.clear();
  }
  function makeBitmap(i) {
    const gen = bmGen;
    pendingBm.add(i);
    fetch(frames[i].src)
      .then((r) => r.blob())
      .then((blob) => createImageBitmap(blob, { resizeWidth: bmW, resizeHeight: bmH, resizeQuality: "medium" }))
      .then((bm) => {
        pendingBm.delete(i);
        const c = idxOf(curT), lo = c - (dir > 0 ? BM.behind : BM.ahead), hi = c + (dir > 0 ? BM.ahead : BM.behind);
        if (gen !== bmGen || i < lo || i > hi) { bm.close(); return; } // veraltet oder schon aus dem Fenster
        bitmaps.set(i, bm);
      })
      .catch(() => { pendingBm.delete(i); failedBm.add(i); });
  }
  function pumpBitmaps() {
    if (!useBitmaps || !bmW) return;
    const c = idxOf(curT);
    const lo = c - (dir > 0 ? BM.behind : BM.ahead), hi = c + (dir > 0 ? BM.ahead : BM.behind);
    // Bitmaps ausserhalb des Fensters freigeben
    bitmaps.forEach((bm, i) => { if (i < lo || i > hi) { bm.close(); bitmaps.delete(i); } });
    // fehlende erzeugen: zuerst das aktuelle, dann in Scrollrichtung, dann dahinter
    if (pendingBm.size >= BM.inflight) return;
    const order = [c];
    for (let d = 1; d <= BM.ahead; d++) {
      order.push(c + dir * d);
      if (d <= BM.behind) order.push(c - dir * d);
    }
    for (const i of order) {
      if (pendingBm.size >= BM.inflight) break;
      if (i < 0 || i >= SET.count || i < lo || i > hi) continue;
      if (bitmaps.has(i) || pendingBm.has(i) || failedBm.has(i) || state[i] !== 2) continue;
      makeBitmap(i);
    }
  }

  /* ---------- Laden: Hero zuerst, Rest progressiv (grob → fein) ---------- */
  function load(i) {
    state[i] = 1;
    return new Promise((res) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames[i] = img; state[i] = 2; res(); };
      img.onerror = () => { state[i] = 3; res(); };
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
      const w = idxOf(curT);
      for (let d = 0; d <= 10; d++) {
        for (const i of [w + dir * d, w - dir * d]) if (i >= 0 && i < SET.count && state[i] === 0) return i;
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
  function computePoints() {
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    points = CLIPS.map(([id, t], index) => ({
      y: index === 0 ? Math.min(24, max) : clamp(docTop(document.getElementById(id)) - innerHeight * 0.55, 0, max),
      t,
    }));
  }

  function sectionEndAt(y) {
    let end = CLIPS[0][1];
    for (const point of points) {
      if (y + 0.5 < point.y) break;
      end = point.t;
    }
    return end;
  }

  // A gentle camera drift keeps the resting pose alive. The text stays still.
  function floatBackground(surface) {
    return surface.animate([
      { transform: "translate3d(-2px, 3px, 0) scale(1.008)" },
      { transform: "translate3d(2px, -3px, 0) scale(1.014)" },
    ], { duration: 3600, direction: "alternate", iterations: Infinity, easing: "ease-in-out" });
  }

  function travelRate(distance) {
    return clamp(distance / 3.8, 1, 3);
  }

  // Deterministic still for the existing screenshot/inspection mode.
  function previewTimeAt(y) {
    let previous = { y: 0, t: 0 };
    for (const point of points) {
      if (y < point.y) return previous.t + (point.t - previous.t) * (y - previous.y) / (point.y - previous.y);
      previous = point;
    }
    return previous.t;
  }

  /* ---------- Hero-Texte ---------- */
  let lastP = -1;
  function updateOverlays(force) {
    const max = Math.max(1, hero.offsetHeight - innerHeight);
    const p = clamp(scrollY / max, 0, 1);
    // Nur im Hero arbeiten: ausserhalb bleibt p = 1 und es ändert sich nichts
    if (p === lastP && !force) return;
    lastP = p;
    overlays.forEach((el) => {
      const a = +el.dataset.start, b = +el.dataset.end, f = +(el.dataset.fade || 0.05);
      let o = 0;
      if (p >= a && p <= b) o = Math.min(a <= 0 ? 1 : clamp((p - a) / f, 0, 1), b >= 1 ? 1 : clamp((b - p) / f, 0, 1));
      if (o === el._o && !force) return; // nur schreiben, wenn sich die Deckkraft ändert
      el._o = o;
      el.style.opacity = o;
      const dy = (1 - o) * -24;
      if (el.classList.contains("scroll-hint")) el.style.transform = `translateX(-50%) translateY(${(1 - o) * 10}px)`;
      else if (el.classList.contains("copy-left") && innerWidth > 767) el.style.transform = `translateY(calc(-50% + ${dy}px))`;
      else el.style.transform = `translateY(${dy}px)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    });
  }

  /* ---------- Overlays aus der Videozeit ---------- */
  let lastCh = -1, lastWipe = "", lastMist = "", lastHud = "";
  function updateFx(t) {
    // Blitz als Wischer zwischen «Sprung» und «Leistungen» – nur schreiben, wenn sich etwas ändert
    const wo = ((1 - smooth(0, 0.42, Math.abs(t - 6.8))) * 0.92).toFixed(3);
    if (wo !== lastWipe) { wipe.style.opacity = wo; lastWipe = wo; }
    const mo = (smooth(15.5, 16.5, t) * 0.5).toFixed(3);
    if (mo !== lastMist) { mist.style.opacity = mo; lastMist = mo; }
    const ht = t.toFixed(1).padStart(4, "0");
    if (hudT && ht !== lastHud) { hudT.textContent = ht; lastHud = ht; }
    let ch = 0; CHAPTERS.forEach((c, k) => { if (t >= c) ch = k; });
    if (ch !== lastCh) { lastCh = ch; hudLinks.forEach((a, k) => a.classList.toggle("is-on", k === ch)); document.body.dataset.chapter = ch; }
  }

  function tick(_time, deltaMs) {
    const y = scrollY;
    const dy = y - lastY; lastY = y;
    vel += (dy - vel) * 0.25;
    if (Math.abs(vel) < 0.01) vel = 0;
    const previous = curT;
    if (shotP === null) {
      targetT = sectionEndAt(y);
      const distance = targetT - curT;
      if (distance) {
        dir = Math.sign(distance);
        const step = clamp(deltaMs, 0, 100) / 1000 * travelRate(Math.abs(distance));
        curT = Math.abs(distance) <= step ? targetT : curT + dir * step;
      }
      const mode = curT === targetT ? "float" : "travel";
      if (canvas.dataset.motion !== mode) canvas.dataset.motion = mode;
    } else {
      curT = targetT = previewTimeAt(y);
    }
    window.__journey.t = curT; window.__journey.vel = vel;
    pumpBitmaps();
    render(); // darf weiterlaufen: zeichnet nur, wenn ein besseres Bild bereit ist
    // Seite steht still: keine DOM-Schreibzugriffe
    if (dy === 0 && vel === 0 && previous === curT && !dirty) return;
    const force = dirty; dirty = false;
    updateFx(curT);
    updateOverlays(force);
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
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, touchMultiplier: 1, smoothWheel: true, syncTouch: false });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    setupKeyboard();
  }

  /* Tastatur über Lenis: gleich weich wie Rad/Trackpad */
  function setupKeyboard() {
    addEventListener("keydown", (e) => {
      if (!lenis || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && t.closest) {
        if (t.isContentEditable || t.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
      }
      const page = innerHeight * 0.85;
      let step = null, to = null;
      switch (e.key) {
        case "ArrowDown": step = 140; break;
        case "ArrowUp": step = -140; break;
        case "PageDown": step = page; break;
        case "PageUp": step = -page; break;
        case " ":
          if (t && t.closest && t.closest("button, a, summary")) return; // Leertaste aktiviert das Element
          step = e.shiftKey ? -page : page; break;
        case "Home": to = 0; break;
        case "End": to = lenis.limit; break;
        default: return;
      }
      e.preventDefault();
      const dest = to !== null ? to : clamp(lenis.targetScroll + step, 0, lenis.limit);
      // programmatic: false → targetScroll wird sofort das Ziel (wie beim Rad),
      // sonst überschreibt Lenis es bei jedem Frame und schnelle Tastendrücke addieren sich nicht.
      lenis.scrollTo(dest, { lerp: 0.1, programmatic: false });
    });
    // Nach Mausklick den Fokus vom Knopf nehmen, damit die Leertaste wieder scrollt
    addEventListener("pointerup", (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target && e.target.closest && e.target.closest("button, summary");
      if (el) el.blur();
    });
  }

  function setupSectionSnap() {
    const sections = CLIPS.map(([id]) => document.getElementById(id));
    const footer = document.querySelector("footer");
    let timer, intent = 0, nativeMotion = false, touching = false;
    let touchX = 0, touchY = 0;

    // Intervals contain the positions where a whole section can be read.
    // The sticky cinematic scenes have one landing each; keep pin spacers
    // in the Services section so every horizontal card remains reachable.
    function landing(y, direction) {
      const height = document.documentElement.clientHeight;
      const limit = Math.max(0, document.documentElement.scrollHeight - height);
      const top = sections.map(docTop);
      const footerTop = footer ? docTop(footer) : limit + height;
      let previousEnd = 0;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        let start = clamp(top[i], 0, limit);
        let end = clamp((top[i + 1] ?? footerTop) - height, start, limit);
        if (section === hero || section.classList.contains("gap")) {
          // In Finale the call to action appears partway through the sticky scene.
          const fraction = section.id === "finale" ? 0.35 : section.id === "loesung" ? 0.22 : 0;
          start = end = start + (end - start) * fraction;
        }
        if (y < start - 2) return direction > 0 ? start : previousEnd;
        if (y <= end + 2) return null;
        previousEnd = end;
      }
      return direction > 0 ? limit : previousEnd;
    }

    function cancel() {
      clearTimeout(timer);
      intent = 0;
    }
    function settle() {
      if (!intent || touching) return;
      const y = lenis && !nativeMotion ? lenis.targetScroll : scrollY;
      const destination = landing(y, intent);
      cancel();
      if (destination === null || Math.abs(y - destination) <= 2) return;
      if (lenis) lenis.scrollTo(destination, { duration: 0.68, easing: t => 1 - (1 - t) ** 3 });
      else window.scrollTo({ top: destination, behavior: reduce ? "instant" : "smooth" });
    }
    function schedule() {
      clearTimeout(timer);
      if (intent && !touching) timer = setTimeout(settle, 140);
    }
    function editable(target) {
      return target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], [data-lenis-prevent]");
    }
    addEventListener("wheel", event => {
      if (event.ctrlKey || editable(event.target) || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      nativeMotion = !lenis;
      intent = Math.sign(event.deltaY);
      schedule();
    }, { passive: true });
    addEventListener("touchstart", event => {
      cancel();
      touching = event.touches.length === 1 && !editable(event.target);
      if (touching) {
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;
      }
    }, { passive: true });
    addEventListener("touchmove", event => {
      if (!touching || event.touches.length !== 1) { cancel(); return; }
      const touch = event.touches[0];
      const dy = touchY - touch.clientY;
      if (Math.abs(dy) < 4 || Math.abs(dy) <= Math.abs(touchX - touch.clientX)) return;
      intent = Math.sign(dy);
      nativeMotion = true;
      touchX = touch.clientX;
      touchY = touch.clientY;
    }, { passive: true });
    addEventListener("touchend", () => { touching = false; schedule(); }, { passive: true });
    addEventListener("touchcancel", () => { touching = false; cancel(); }, { passive: true });
    addEventListener("scroll", () => { if (nativeMotion && intent) schedule(); }, { passive: true });
    addEventListener("keydown", event => {
      if (event.altKey || event.ctrlKey || event.metaKey || editable(event.target)) return;
      if (event.key === "Home" || event.key === "End" || event.key === "Tab") { cancel(); return; }
      if (event.key === " " && event.target.closest?.("button, a, summary")) return;
      if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown", " "].includes(event.key)) return;
      nativeMotion = !lenis;
      intent = event.key.endsWith("Up") || (event.key === " " && event.shiftKey) ? -1 : 1;
      schedule();
    });
    addEventListener("pointerdown", cancel, { passive: true });
    addEventListener("hashchange", cancel);
    addEventListener("resize", cancel);
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

  async function startVideo() {
    const video = document.createElement("video");
    video.id = canvas.id;
    video.dataset.journeyVideo = "";
    video.loop = false;
    video.muted = video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    video.style.objectFit = "cover";
    video.poster = "/poster.webp";
    video.src = "/js/flight-" + (isMobile ? "mobile" : "desktop") + "-v1.mp4";
    canvas.replaceWith(video);

    let timeout;
    function restoreCanvas() {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.replaceWith(canvas);
    }
    try {
      await Promise.race([
        video.play(),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Video startup timed out")), 5000); }),
      ]);
    } catch {
      restoreCanvas();
      return false;
    } finally {
      clearTimeout(timeout);
    }

    ScrollTrigger.refresh();
    computePoints();
    const drift = floatBackground(video);
    const turn = video.duration / 2;
    let reversed = false;
    let lastGoal = null;
    let failed = false;

    function useFrameFallback() {
      if (failed) return;
      failed = true;
      gsap.ticker.remove(updateVideoState);
      video.removeEventListener("error", useFrameFallback);
      drift.cancel();
      restoreCanvas();
      startFrames();
    }

    function updatePlayback(y) {
      targetT = sectionEndAt(y);
      const goal = Math.min(turn, Math.round(targetT * 24) / 24);
      const position = () => reversed ? video.duration - video.currentTime : video.currentTime;
      if (goal !== lastGoal) {
        const here = clamp(position(), 0, turn);
        const goBack = goal < here;
        if (goBack !== reversed) {
          reversed = goBack;
          video.currentTime = reversed ? video.duration - here : here;
        }
        lastGoal = goal;
        video.dataset.motion = "travel";
      }
      curT = clamp(position(), 0, turn);
      if (video.dataset.motion === "float") return;
      const remaining = reversed ? curT - goal : goal - curT;
      if (remaining <= 0.012) {
        video.pause();
        const stop = reversed ? video.duration - goal : goal;
        if (Math.abs(video.currentTime - stop) > 0.009) video.currentTime = stop;
        curT = goal;
        video.dataset.motion = "float";
      } else {
        const rate = Math.round(travelRate(remaining) * 10) / 10;
        if (video.playbackRate !== rate) video.playbackRate = rate;
        if (video.paused) video.play().catch(error => {
          if (error.name !== "AbortError") useFrameFallback();
        });
      }
    }

    function updateVideoState() {
      const y = scrollY;
      vel += ((y - lastY) - vel) * 0.25;
      lastY = y;
      updatePlayback(y);
      window.__journey.t = curT;
      window.__journey.vel = vel;
      if (isMobile) {
        const width = video.clientWidth, height = video.clientHeight;
        const imageWidth = Math.max(width, height * 16 / 9);
        const focus = 0.5 + 0.15 * (1 - smooth(5.2, 6.6, curT));
        const pos = imageWidth > width ? clamp((focus * imageWidth - width / 2) / (imageWidth - width), 0, 1) : 0.5;
        const position = (pos * 100).toFixed(1) + "% center";
        if (position !== video.style.objectPosition) video.style.objectPosition = position;
      }
      updateFx(curT);
      updateOverlays(dirty);
      dirty = false;
    }
    updateVideoState();
    gsap.ticker.add(updateVideoState);
    video.addEventListener("error", useFrameFallback, { once: true });
    hidePreloader();
    return true;
  }

  async function init() {
    resize();
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") { console.warn("GSAP fehlt"); }
    gsap.registerPlugin(ScrollTrigger);
    if (shotP === null) setupSectionSnap();
    if (reduce && shotP === null) return initReduced();

    setupLenis();
    ScrollTrigger.addEventListener("refresh", computePoints);
    setupFocus();
    addEventListener("resize", () => { resize(); }); // ScrollTrigger refresht selbst (mit Debounce)

    if (shotP === null && await startVideo()) return;
    await startFrames();
  }

  async function startFrames() {
    const t0 = performance.now();
    await loadHero((f) => { const p = Math.round(f * 100); preFill.style.width = p + "%"; prePct.textContent = p + "%"; });
    ScrollTrigger.refresh();
    computePoints();
    if (shotP !== null) {
      const y = shotP * (document.documentElement.scrollHeight - innerHeight);
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
      lastY = scrollY; curT = targetT = previewTimeAt(scrollY);
    }
    if (shotP === null) floatBackground(canvas);
    render(); updateFx(curT); updateOverlays(true);
    gsap.ticker.add(tick);
    loadRest();
    const wait = Math.max(0, 350 - (performance.now() - t0));
    if (!document.body.classList.contains("is-ready")) setTimeout(hidePreloader, wait);
  }

  window.__journeyDebug = () => ({ points, curT, targetT, loaded: state.reduce((a, b) => a + (b === 2), 0), count: SET.count, set: isMobile ? "mobile" : "desktop", bitmaps: [...bitmaps.keys()].sort((a, b) => a - b), pendingBm: pendingBm.size, failedBm: failedBm.size, drawnIdx, drawnBitmap, bmSize: [bmW, bmH] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
