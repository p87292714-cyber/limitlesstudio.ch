/* Ton: Ambient-Bett aus dem Originalton der beiden Clips + Scroll-Granulat + UI-Klicks.
   Standardmässig aus (Browser blockieren Autoplay). Zustand in localStorage. */
(() => {
  const KEY = "agentur-sound";
  const btn = document.getElementById("sound-toggle");
  const label = document.getElementById("sound-label");
  const AC = window.AudioContext || window.webkitAudioContext;
  const api = { on: false, ui() {}, whoosh() {} };
  window.__sound = api;
  if (!btn || !AC) { if (btn) btn.hidden = true; return; }

  const probe = document.createElement("audio");
  const SRC = probe.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? "audio/soundtrack.m4a"
    : probe.canPlayType('audio/ogg; codecs="vorbis"') ? "audio/soundtrack.ogg" : "audio/soundtrack.mp3";
  const TRIM = 0.06;      // Encoder-Polster am Anfang/Ende
  const XFADE = 2.0;      // Überblendung an der Loop-Naht

  let ctx = null, master, comp, bedGain, bedFilter, grainBus, uiBus, droneGain;
  // localStorage kann blockiert sein (privater Modus, Cookies aus): dann einfach nichts merken
  const store = { get: () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } }, set: (v) => { try { localStorage.setItem(KEY, v); } catch (_) {} } };
  let buf = null, bedSrc = null, loading = null, enabled = store.get() === "on";
  let nextGrain = 0, suspendTimer = 0, lastTick = 0, intensity = 0;

  function setUI() {
    btn.setAttribute("aria-pressed", String(enabled));
    btn.setAttribute("aria-label", enabled ? "Ton ausschalten" : "Ton einschalten");
    label.textContent = enabled ? "Ton aus" : "Ton an";
  }

  function graph() {
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(comp).connect(ctx.destination);

    bedFilter = ctx.createBiquadFilter(); bedFilter.type = "lowpass"; bedFilter.frequency.value = 650; bedFilter.Q.value = 0.4;
    bedGain = ctx.createGain(); bedGain.gain.value = 0.42;
    bedFilter.connect(bedGain).connect(master);

    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 140;
    grainBus = ctx.createGain(); grainBus.gain.value = 0.9;
    grainBus.connect(hp).connect(master);

    uiBus = ctx.createGain(); uiBus.gain.value = 0.22; uiBus.connect(master);

    // sehr leiser Sub-Drone als Fundament (synthetisch)
    droneGain = ctx.createGain(); droneGain.gain.value = 0.035; droneGain.connect(master);
    [55, 82.41, 110.3].forEach((f, k) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; o.detune.value = (k - 1) * 4;
      const g = ctx.createGain(); g.gain.value = k === 2 ? 0.25 : 0.6;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + k * 0.03;
      const lg = ctx.createGain(); lg.gain.value = 0.25; lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(droneGain); o.start(); lfo.start();
    });
  }

  // Nahtloser Loop: Ende wird über den Anfang geblendet (gleiche Leistung)
  function makeBed(src) {
    const sr = src.sampleRate, a = Math.floor(TRIM * sr), L = src.length - 2 * a, X = Math.floor(XFADE * sr), N = L - X;
    const out = ctx.createBuffer(src.numberOfChannels, N, sr);
    for (let c = 0; c < src.numberOfChannels; c++) {
      const s = src.getChannelData(c).subarray(a, a + L), o = out.getChannelData(c);
      for (let i = 0; i < N; i++) {
        if (i < X) { const p = (i / X) * Math.PI / 2; o[i] = s[i] * Math.sin(p) + s[L - X + i] * Math.cos(p); }
        else o[i] = s[i];
      }
    }
    return out;
  }

  async function ensureLoaded() {
    if (buf) return;
    if (!loading) loading = fetch(SRC).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)));
    buf = await loading;
    bedSrc = ctx.createBufferSource(); bedSrc.buffer = makeBed(buf); bedSrc.loop = true;
    bedSrc.connect(bedFilter); bedSrc.start(ctx.currentTime + 0.05);
  }

  async function start() {
    if (!ctx) graph();
    clearTimeout(suspendTimer);
    if (ctx.state !== "running") { try { await ctx.resume(); } catch (_) {} }
    btn.classList.add("is-loading");
    try { await ensureLoaded(); } catch (e) { console.warn("Ton konnte nicht geladen werden", e); }
    btn.classList.remove("is-loading");
    if (!enabled || document.hidden) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6);
    api.on = true;
  }
  function stop(suspend = true) {
    api.on = false;
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    clearTimeout(suspendTimer);
    if (suspend) suspendTimer = setTimeout(() => ctx && ctx.state === "running" && ctx.suspend(), 1400);
  }

  /* ---------- Scroll-Reaktion: Filter/Lautstärke + Körner aus der passenden Stelle ---------- */
  function grain(offset, amp) {
    const g = ctx.createGain(), s = ctx.createBufferSource(), t = ctx.currentTime + 0.02, d = 0.24;
    s.buffer = buf; s.playbackRate.value = 0.97 + Math.random() * 0.06;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.09); g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(g).connect(grainBus);
    s.start(t, Math.max(0, Math.min(buf.duration - d, offset + TRIM + (Math.random() - 0.5) * 0.04)), d);
  }
  function loop() {
    requestAnimationFrame(loop);
    if (!api.on || !buf) return;
    const j = window.__journey || { t: 0, vel: 0 };
    const target = Math.min(1, Math.abs(j.vel) / 38);
    intensity += (target - intensity) * (target > intensity ? 0.25 : 0.06);
    const now = ctx.currentTime;
    bedFilter.frequency.setTargetAtTime(650 + intensity * 5200, now, 0.12);
    bedGain.gain.setTargetAtTime(0.42 + intensity * 0.3, now, 0.15);
    if (intensity > 0.04 && now >= nextGrain) { grain(j.t, intensity * 0.6); nextGrain = now + 0.065; }
  }
  requestAnimationFrame(loop);

  /* ---------- UI-Klänge (Web Audio, keine Fremd-Dateien) ---------- */
  function blip(f1, f2, dur, type = "sine", gain = 1, delay = 0) {
    const t = ctx.currentTime + 0.005 + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(uiBus); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, f1, f2, gain) {
    const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime + 0.01;
    s.buffer = n; bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(uiBus); s.start(t);
  }
  api.ui = (type = "tick") => {
    if (!api.on) return;
    if (type === "tick") blip(1500, 800, 0.05, "triangle", 0.5);
    else if (type === "soft") blip(2200, 1800, 0.025, "sine", 0.18);
    else if (type === "yes") { blip(880, 990, 0.08, "sine", 0.6); blip(1320, 1480, 0.12, "sine", 0.45, 0.06); }
    else if (type === "no") blip(300, 190, 0.18, "triangle", 0.7);
    else if (type === "good") [523.3, 659.3, 784, 1046.5].forEach((f, k) => blip(f, f * 1.01, 0.35, "sine", 0.4, k * 0.07));
    else if (type === "bad") [392, 311.1, 233.1].forEach((f, k) => blip(f, f * 0.98, 0.4, "triangle", 0.45, k * 0.09));
    else if (type === "whoosh") noise(0.9, 250, 3200, 0.9);
  };
  api.whoosh = () => api.ui("whoosh");
  api.debug = () => ({ enabled, on: api.on, state: ctx && ctx.state, loaded: !!buf, bedSec: bedSrc && bedSrc.buffer.duration, src: SRC, gain: master && master.gain.value, intensity });

  // Klick auf alles Klickbare (Quiz-Knöpfe haben eigene Klänge)
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a, button, summary, .tcard");
    if (!el || el === btn || el.closest(".yn") || el.dataset.sound === "none") return;
    api.ui("tick");
  });
  // Regler: feines Rasten
  document.addEventListener("input", (e) => {
    if (e.target.type !== "range") return;
    const n = performance.now(); if (n - lastTick < 55) return; lastTick = n; api.ui("soft");
  });

  btn.addEventListener("click", () => {
    enabled = !enabled;
    store.set(enabled ? "on" : "off");
    setUI();
    if (enabled) start().then(() => api.ui("yes")); else stop();
  });

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) stop(true);
    else if (enabled) start();
  });

  // War der Ton beim letzten Besuch an: beim ersten Tippen/Klicken/Tastendruck starten
  if (enabled) {
    const arm = (e) => { if (e && e.target && e.target.closest && e.target.closest("#sound-toggle")) return; ["pointerdown", "keydown", "touchend"].forEach((ev) => removeEventListener(ev, arm, true)); if (enabled) start(); };
    ["pointerdown", "keydown", "touchend"].forEach((ev) => addEventListener(ev, arm, true));
  }
  setUI();
})();
