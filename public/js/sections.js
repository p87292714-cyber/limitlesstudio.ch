/* Interaktive Sektionen: Quiz, Rechner, Slider, Tabs, Split-Text, Cursor, Easter Egg */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches || /[?&]fine=1/.test(location.search); // ?fine=1 nur für Tests
  if (fine) document.documentElement.classList.add("has-fine");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const snd = (t) => window.__sound && window.__sound.ui(t);
  const buzz = (ms) => { if (coarse && navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {} };
  const hasGsap = typeof gsap !== "undefined";

  /* --- Split-Text (Wörter / Buchstaben), barrierearm: aria-label auf dem Titel --- */
  function split(el) {
    const mode = el.dataset.split, text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    const words = text.split(" ");
    el.innerHTML = words.map((w) => mode === "chars"
      ? `<span class="split-word" aria-hidden="true">${[...w].map((c) => `<span class="split-c">${c.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`).join("")}</span>`
      : `<span class="split-w" aria-hidden="true"><span class="split-wi">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`).join(" ");
  }
  if (!reduce) $$("[data-split]").forEach(split);

  /* --- FAQ: nur eins offen --- */
  $$(".faq details").forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) $$(".faq details").forEach((o) => o !== d && (o.open = false));
  }));

  /* --- Burger --- */
  const burger = $("#burger");
  burger.addEventListener("click", () => {
    const o = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", o);
  });
  $$("#menu a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));

  /* --- Fortschrittsbalken --- */
  const bar = $("#progress-bar");
  const prog = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener("scroll", prog, { passive: true }); prog();

  /* Anker-Links mit Lenis */
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = a.getAttribute("href"); const el = t.length > 1 && document.querySelector(t);
    if (el && window.__lenis) { e.preventDefault(); window.__lenis.scrollTo(el.id === "top" ? 0 : el, { duration: 1.6 }); }
  }));

  /* --- Füll-Animation der Buttons folgt dem Zeiger --- */
  $$(".btn").forEach((b) => {
    const set = (e) => { const r = b.getBoundingClientRect(); b.style.setProperty("--x", ((e.clientX - r.left) / r.width) * 100 + "%"); b.style.setProperty("--y", ((e.clientY - r.top) / r.height) * 100 + "%"); };
    b.addEventListener("pointerenter", set); b.addEventListener("pointermove", set);
  });

  /* --- Easter Egg: 5× auf das grüne Quadrat → Schwerelos-Modus --- */
  const toast = $("#toast");
  let toastT = 0;
  const say = (msg, ms = 4200) => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("is-on"), ms); };
  let hits = [], floating = false;
  $$(".logo-mark").forEach((m) => m.addEventListener("click", (e) => {
    const now = performance.now(); hits = hits.filter((t) => now - t < 2500); hits.push(now);
    m.classList.add("is-hit"); setTimeout(() => m.classList.remove("is-hit"), 200);
    if (hits.length > 1) { e.preventDefault(); e.stopPropagation(); }
    if (hits.length >= 5 && !floating) { hits = []; zeroG(); }
  }, true));
  function zeroG() {
    floating = true;
    window.__sound && window.__sound.whoosh();
    buzz([20, 60, 20, 60, 40]);
    say("Schwerelos-Modus aktiviert. Willkommen an Bord.");
    if (reduce || !hasGsap) { floating = false; return; }
    const vis = $$(".stat, .tcard, .plan, .tl-step, .chips button, .slot, .quiz-q li, .sector-panel li, .faq details, .btn, .kicker, .sec h2, .ba, .calc-out > div, .cta-row")
      .filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    vis.forEach((el) => gsap.to(el, { x: gsap.utils.random(-40, 40), y: gsap.utils.random(-70, -20), rotation: gsap.utils.random(-10, 10), duration: gsap.utils.random(1.6, 2.6), ease: "sine.inOut", yoyo: true, repeat: 1, onComplete: () => gsap.set(el, { clearProps: "x,y,rotation" }) }));
    setTimeout(() => (floating = false), 5400);
  }
  window.__zeroG = zeroG;

  if (reduce) {
    $$("[data-count]").forEach((el) => (el.textContent = el.dataset.count));
    $("#tl-fill").style.transform = "none";
    return;
  }

  /* --- Cursor: eigener Cursor, Glow, Magnet & Tilt (nur Desktop) --- */
  if (fine) {
    document.documentElement.classList.add("has-cursor");
    const cur = $("#cursor"), dot = $(".cursor-dot", cur), ringEl = $(".cursor-ring", cur), lab = $("#cursor-label");
    const glow = $("#glow");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, gx = mx, gy = my;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; document.body.classList.add("has-glow"); cur.classList.remove("is-hidden"); }, { passive: true });
    document.addEventListener("mouseleave", () => cur.classList.add("is-hidden"));
    addEventListener("mousedown", () => cur.classList.add("is-down"));
    addEventListener("mouseup", () => cur.classList.remove("is-down"));
    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest("[data-cursor], a, button, summary, label, input[type=range]");
      const text = el && (el.dataset.cursor || (el.closest("[data-cursor]") || {}).dataset?.cursor || (el.type === "range" ? "Ziehen" : ""));
      cur.classList.toggle("is-link", !!el && !text);
      cur.classList.toggle("is-label", !!text);
      lab.textContent = text || "";
    });
    let pmx = NaN, pmy = NaN;
    (function loop() {
      // Cursor steht still und Ring/Glow sind angekommen: nichts schreiben
      const settled = Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1 && Math.abs(mx - gx) < 0.1 && Math.abs(my - gy) < 0.1;
      if (!(settled && mx === pmx && my === pmy)) {
        if (settled) { rx = gx = mx; ry = gy = my; }
        else { rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; gx += (mx - gx) * 0.15; gy += (my - gy) * 0.15; }
        dot.style.transform = `translate(${mx}px,${my}px)`;
        ringEl.style.transform = `translate(${rx}px,${ry}px)`;
        glow.style.transform = `translate(${gx}px,${gy}px)`;
        pmx = mx; pmy = my;
      }
      requestAnimationFrame(loop);
    })();
    $$(".magnetic").forEach((b) => {
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      b.addEventListener("mouseleave", () => (b.style.transform = ""));
    });
    $$(".tcard-in, .tilt").forEach((c) => {
      c.addEventListener("mousemove", (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      });
      c.addEventListener("mouseleave", () => (c.style.transform = ""));
    });
  }

  if (!hasGsap || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  /* Zuerst der Pin (Leistungen), damit alle späteren Trigger seinen Abstand kennen */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    gsap.to("#tl-fill", { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 80%", end: "bottom 55%", scrub: true } });
  });
  mm.add("(max-width: 767px)", () => {
    gsap.to("#tl-fill", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 80%", end: "bottom 60%", scrub: true } });
  });

  $$(".reveal").forEach((el) => gsap.from(el, { opacity: 0, y: 28, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));

  /* Titel: Wörter steigen aus einer Maske (Linien-Effekt) */
  $$("[data-split=words]:not([data-scrub])").forEach((el) => {
    const parts = $$(".split-wi", el);
    const tw = { yPercent: 115, rotate: 3, duration: 1, ease: "power4.out", stagger: 0.045 };
    if (el.hasAttribute("data-intro")) {
      gsap.set(parts, { yPercent: 115 });
      document.addEventListener("hero:ready", () => gsap.to(parts, { yPercent: 0, rotate: 0, duration: 1.1, ease: "power4.out", stagger: 0.05, delay: 0.15 }), { once: true });
    } else gsap.from(parts, { ...tw, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  $$("[data-count]").forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%", once: true }, onUpdate: () => (el.textContent = Math.round(o.v)) });
  });

  gsap.from(".tl-step", { opacity: 0, y: 24, stagger: 0.15, duration: 0.6, scrollTrigger: { trigger: "#timeline", start: "top 75%", once: true } });

  /* Aktiver Menüpunkt */
  $$("#menu a[href^='#']").forEach((a) => {
    const sec = $(a.getAttribute("href")); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-active", s.isActive) });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
  document.addEventListener("hero:ready", () => ScrollTrigger.refresh());
})();
