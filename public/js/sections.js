/* Interaktive Sektionen: Quiz, Rechner, Slider, Tabs, Split-Text, Cursor, Easter Egg */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches || /[?&]fine=1/.test(location.search); // ?fine=1 nur für Tests
  if (fine) document.documentElement.classList.add("has-fine");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const chf = (v) => (v < 0 ? "−" : "") + "CHF " + Math.round(Math.abs(v)).toLocaleString("de-CH");
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

  /* --- Mini-Digital-Check: mit Spiel-Auflösung --- */
  const answers = {};
  const ring = $("#ring-fg"), ringBox = $("#ring"), num = $("#quiz-num"), label = $("#quiz-label");
  const tier = $("#quiz-tier"), steps = $$("#quiz-steps i"), reset = $("#quiz-reset");
  let wasDone = false;
  function floatTag(btn, text, ok) {
    if (!hasGsap || reduce) return;
    const li = btn.closest("li"), t = document.createElement("span");
    t.className = "float-tag" + (ok ? " ok" : ""); t.textContent = text;
    const r = btn.getBoundingClientRect(), lr = li.getBoundingClientRect();
    t.style.left = r.left - lr.left + r.width / 2 + "px"; t.style.top = r.top - lr.top + "px";
    li.appendChild(t);
    gsap.fromTo(t, { xPercent: -50, y: 0, opacity: 0, scale: 0.8 }, { y: -34, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)", onComplete: () => gsap.to(t, { opacity: 0, y: -50, duration: 0.4, delay: 0.25, onComplete: () => t.remove() }) });
  }
  $$(".quiz-q li").forEach((li) => {
    $$("button", li).forEach((b) => b.addEventListener("click", () => {
      $$("button", li).forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      const a = +b.dataset.a;
      answers[li.dataset.q] = a;
      buzz(a ? 8 : [12, 40, 12]);
      snd(a ? "yes" : "no");
      floatTag(b, a ? "Dicht" : "+1 Leck", !!a);
      if (!a && ringBox) { ringBox.classList.remove("is-pulse"); void ringBox.offsetWidth; ringBox.classList.add("is-pulse"); }
      updateQuiz();
    }));
  });
  function updateQuiz() {
    const n = Object.keys(answers).length;
    const leaks = Object.values(answers).filter((a) => a === 0).length;
    num.textContent = n ? leaks : "–";
    ring.style.strokeDashoffset = String(326.7 * (1 - leaks / 5));
    ring.style.stroke = leaks >= 3 ? "#ff6b6b" : "#B6FF3B";
    steps.forEach((s, k) => { s.className = k in answers ? (answers[k] ? "ok" : "leak") : ""; });
    if (n < 5) label.textContent = `${leaks} ${leaks === 1 ? "Leck" : "Lecks"} bisher · noch ${5 - n} ${5 - n === 1 ? "Frage" : "Fragen"}`;
    else if (leaks === 0) label.textContent = "Stark! Prüfen wir die übrigen 10 Punkte.";
    else label.textContent = `${leaks} von 5 Lecks gefunden. Hier verlieren Sie Kundschaft.`;
    const done = n === 5;
    tier.hidden = !done; reset.hidden = !done;
    if (done) {
      tier.textContent = leaks === 0 ? "Dicht" : leaks <= 2 ? "Kleine Lecks" : leaks <= 4 ? "Deutliche Lecks" : "Alarmstufe Rot";
      tier.classList.toggle("is-bad", leaks >= 3);
      if (!wasDone) reveal(leaks);
    }
    wasDone = done;
  }
  function reveal(leaks) {
    snd(leaks <= 2 ? "good" : "bad");
    buzz(leaks <= 2 ? [10, 30, 10, 30, 20] : [30, 50, 30]);
    if (reduce || !hasGsap) return;
    ringBox.classList.remove("is-scan"); void ringBox.offsetWidth; ringBox.classList.add("is-scan");
    gsap.fromTo(tier, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.2)", delay: 0.5 });
    const o = { v: 0 };
    gsap.to(o, { v: leaks, duration: 0.9, ease: "power2.out", onUpdate: () => (num.textContent = Math.round(o.v)) });
    setTimeout(() => burst(leaks >= 3 ? ["#ff6b6b", "#ffb36b"] : ["#B6FF3B", "#e8ffc4", "#ffffff"]), 700);
  }
  function burst(colors) {
    const c = $("#quiz-burst"); if (!c) return;
    const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = r.width * dpr; c.height = r.height * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const cx = r.width / 2, cy = r.height / 2;
    const P = Array.from({ length: 70 }, () => { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5; return { x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, c: colors[(Math.random() * colors.length) | 0], z: 1.5 + Math.random() * 2.5 }; });
    (function step() {
      g.clearRect(0, 0, r.width, r.height);
      let alive = 0;
      P.forEach((p) => { if (p.l <= 0) return; alive++; p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy = p.vy * 0.95 + 0.06; p.l -= 0.018; g.globalAlpha = Math.max(0, p.l); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.z, p.z); });
      if (alive) requestAnimationFrame(step); else g.clearRect(0, 0, r.width, r.height);
    })();
  }
  reset.addEventListener("click", () => {
    Object.keys(answers).forEach((k) => delete answers[k]);
    $$(".quiz-q button").forEach((b) => b.classList.remove("is-on"));
    wasDone = false; updateQuiz(); label.textContent = "Beantworten Sie die 5 Fragen.";
  });

  /* --- Rechner (Formel aus dem Referenzdokument) --- */
  const ids = ["clients", "ticket", "visits", "margin"];
  let fee = 690;
  function setNum(el, v, fmt) {
    if (reduce || !hasGsap) { el.textContent = fmt(v); return; }
    const o = { v: el._v ?? v }; el._v = v;
    gsap.killTweensOf(el._o || {}); el._o = o;
    gsap.to(o, { v, duration: 0.45, ease: "power2.out", onUpdate: () => (el.textContent = fmt(o.v)) });
  }
  function calc() {
    const v = Object.fromEntries(ids.map((k) => [k, +$("#c-" + k).value]));
    ids.forEach((k) => ($("#o-" + k).textContent = v[k]));
    const revenue = v.clients * v.ticket * v.visits;
    const contribution = revenue * (v.margin / 100);
    const net = contribution - fee;
    const perClient = v.ticket * v.visits * (v.margin / 100);
    const be = perClient > 0 ? fee / perClient : 0;
    setNum($("#r-rev"), revenue, chf);
    setNum($("#r-con"), contribution, chf);
    const rn = $("#r-net"); setNum(rn, net, chf); rn.classList.toggle("neg", net < 0);
    setNum($("#r-be"), be, (x) => x.toFixed(1).replace(".", ","));
    $$(".plan").forEach((p) => p.classList.toggle("is-match", +p.dataset.plan === fee));
  }
  ids.forEach((k) => $("#c-" + k).addEventListener("input", calc));
  $$("#c-fee button").forEach((b) => b.addEventListener("click", () => {
    $$("#c-fee button").forEach((x) => x.classList.remove("is-on"));
    b.classList.add("is-on"); fee = +b.dataset.fee; buzz(6); calc();
  }));
  $$("#calc-sector button").forEach((b) => b.addEventListener("click", () => {
    $$("#calc-sector button").forEach((x) => x.classList.remove("is-on"));
    b.classList.add("is-on"); buzz(6); $("#calc-kpi").textContent = "KPI: " + b.dataset.kpi;
  }));
  calc();
  window.__calc = calc;

  /* --- Preis-Umschalter --- */
  $$("#price-mode button").forEach((b) => b.addEventListener("click", () => {
    $$("#price-mode button").forEach((x) => x.classList.remove("is-on"));
    b.classList.add("is-on");
    $$(".plan .price").forEach((p) => (p.textContent = p.dataset[b.dataset.m]));
  }));

  /* --- Vorher/Nachher --- */
  const range = $("#ba-range");
  const setBA = () => {
    $("#ba-after").style.clipPath = `inset(0 0 0 ${range.value}%)`;
    $("#ba-handle").style.left = range.value + "%";
  };
  range.addEventListener("input", setBA); setBA();
  $("#ba").dataset.cursor = "Ziehen";

  /* --- Branchen-Tabs (Inhalte aus dem Referenzdokument) --- */
  const S = [
    { p: ["Reservation per Telefon", "Speisekarte als PDF", "Bewertungen unbeantwortet", "Abhängig von Uber Eats"], s: ["Google & Bewertungen", "Sofort-Reservation", "Gutscheine & WhatsApp-Kanal"], k: "Zusätzliche Gedecke pro Woche und online verkaufte Gutscheine." },
    { p: ["Termine nur per Telefon", "No-Shows", "Instagram ohne Buchungslink", "Keine Erinnerungen"], s: ["Online-Buchung 24/7", "Erinnerungen gegen Ausfälle", "Instagram als Portfolio"], k: "Auslastung der Agenda und Ausfallquote." },
    { p: ["Probetraining ohne Nachfassen", "Kursplan als Bild", "Kündigungen ohne Rückgewinnung", "Kein Video"], s: ["Probetraining-Funnel", "Kundenbindung", "Echte Mitglieder im Video"], k: "Netto-Neumitglieder pro Monat." },
    { p: ["Sortiment unsichtbar bei Google", "Kein Click & Collect", "Veraltete Öffnungszeiten", "Keine Kundendatenbank"], s: ["Digitales Schaufenster", "Click & Collect", "Kundenclub"], k: "Klicks auf «Route» und Anrufe aus Google." },
    { p: ["Telefon überlastet", "Lücken durch Ausfälle", "Immer gleiche Fragen", "Generische Fotos"], s: ["Online-Termine", "Erinnerungen & Warteliste", "FAQ-Chatbot ohne Gesundheitsdaten"], k: "Anteil Online-Termine und gefüllte Lücken." },
    { p: ["Verpasste Anrufe auf der Baustelle", "Kein Offertformular mit Fotos", "Keine Bewertungen nach dem Auftrag", "Portalgebühren pro Kontakt"], s: ["Nie mehr Anrufe verpassen", "Bewertung nach jedem Auftrag", "Website nach Region"], k: "Kosten pro Offertanfrage vs. Portal." },
    { p: ["Abhängig von Homegate & ImmoScout24", "Langsame Antworten", "Wenige Verkaufsmandate", "Inserate ohne Video"], s: ["Verkäufer gewinnen", "Sofort-Antwort", "Video pro Objekt"], k: "Gewonnene Verkaufsmandate und Antwortzeit." },
    { p: ["Booking.com-Provisionen", "Wenig Direktbuchungen", "Keine E-Mails an frühere Gäste", "Alte Fotos"], s: ["Direktbuchung", "Gäste-CRM", "Mehrsprachiger Chatbot"], k: "Anteil Direktbuchungen und gesparte Provision." },
  ];
  const panel = $("#sector-panel");
  const esc = (t) => t.replace(/&/g, "&amp;");
  function showSector(i) {
    const d = S[i];
    panel.innerHTML = `<div><h3>Typische Lecks</h3><ul>${d.p.map((x) => `<li>✕ ${esc(x)}</li>`).join("")}</ul></div><div><h3>Unsere Lösung</h3><ul>${d.s.map((x) => `<li>✓ ${esc(x)}</li>`).join("")}</ul></div><p class="kpi">KPI, der zählt: ${esc(d.k)}</p>`;
    if (!reduce && hasGsap) gsap.fromTo(panel.querySelectorAll("li, .kpi"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.035, duration: 0.4 });
  }
  $$("#sector-chips button").forEach((b) => b.addEventListener("click", () => {
    $$("#sector-chips button").forEach((x) => x.classList.remove("is-on"));
    b.classList.add("is-on"); buzz(6); showSector(+b.dataset.i);
  }));
  showSector(0);

  /* --- Leistungs-Karten: antippen --- */
  $$(".tcard").forEach((c) => { c.dataset.cursor = "Mehr"; c.addEventListener("click", () => c.classList.toggle("is-open")); });

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
    (function loop() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; gx += (mx - gx) * 0.15; gy += (my - gy) * 0.15;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      ringEl.style.transform = `translate(${rx}px,${ry}px)`;
      glow.style.transform = `translate(${gx}px,${gy}px)`;
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
    const track = $("#hs-track");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { id: "hs", trigger: "#leistungen", start: "top top", end: () => "+=" + dist() * 1.2, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
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

  /* Zwischenspiele: an den Scroll gekoppelt */
  const gapTl = (id) => gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: id, start: "top bottom", end: "bottom bottom", scrub: 0.6 } }).set({}, {}, 1); // Zeitachse 0–1 = Scroll-Fortschritt
  {
    const tl = gapTl("#sprung");
    tl.fromTo("#sprung .split-c", { opacity: 0, yPercent: 70, rotate: 8 }, { opacity: 1, yPercent: 0, rotate: 0, stagger: 0.012, duration: 0.12 }, 0.08);
    $$("#countdown span").forEach((s, k) => {
      const at = 0.46 + k * 0.12;
      tl.fromTo(s, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.04 }, at).to(s, { opacity: 0, scale: 0.6, duration: 0.04 }, at + 0.07);
    });
    tl.to("#sprung .mega, #sprung .kicker", { scale: 1.15, opacity: 0, duration: 0.1 }, 0.9);
  }
  {
    const tl = gapTl("#loesung");
    tl.fromTo("#loesung .split-wi", { yPercent: 115 }, { yPercent: 0, stagger: 0.02, duration: 0.15 }, 0.12)
      .fromTo("#reticle", { opacity: 0, scale: 1.7, rotate: -40 }, { opacity: 0.9, scale: 1, rotate: 0, duration: 0.45 }, 0.25)
      .to("#reticle .r2", { rotate: 180, transformOrigin: "50% 50%", duration: 0.5 }, 0.3)
      .to("#reticle", { opacity: 0, scale: 0.85, duration: 0.15 }, 0.85);
  }
  {
    const tl = gapTl("#finale");
    tl.fromTo("#finale .split-c", { opacity: 0, yPercent: 60, filter: "blur(6px)" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", stagger: 0.008, duration: 0.12 }, 0.1)
      .fromTo("#finale .btn", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.12 }, 0.45);
  }

  // Zwischenspiele lösen sich beim Verlassen auf (weicher Übergang zur nächsten Sektion)
  $$(".gap").forEach((g) => gsap.to($(".gap-sticky", g), { opacity: 0, y: -70, filter: "blur(8px)", ease: "none", scrollTrigger: { trigger: g, start: "bottom bottom", end: "bottom 35%", scrub: true } }));

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
