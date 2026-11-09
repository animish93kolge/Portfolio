/* ============================================================
   TODAY'S EDITION — cover open, paper rustle, bulletin tune,
   radio on/off toggle
   ============================================================ */
(function () {
  var root = document.documentElement;
  var cover = document.getElementById("cover");
  var openBtn = document.getElementById("coverOpen");
  var radio = document.getElementById("radioBtn");

  var MUTE_KEY = "bulletinMuted";
  var muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  var tune = new Audio("assets/audio/intro.mp3");
  tune.loop = false;
  tune.preload = "auto";

  /* spoken bulletin that follows the tune: [start-second, caption] */
  var LINES = [[0.0, "Namaskar, and good day. This is The Design Chronicle, broadcasting from the Mumbai Edition. Here are today's headlines on designer Animish Kolge."], [11.59, "Leading the future of wearables: Animish leads design for B by Lenskart, India's first AI-powered smart glasses, at AjnaLens — from the companion app to the on-lens interaction and the conversational AI."], [27.84, "Eight seasons on the desk: more than eight years in design, across fintech, edtech, AI and AR/VR/XR."], [36.84, "A design team, built from zero: he set up a nine-person design organisation from the ground up — the team, the processes, design ops and governance."], [48.42, "Investing made simple for Bharat: Saathi's first mutual fund journey for tier 2 and 3 India, in Hindi and English — 75% closure and ₹1 crore deployed."], [62.58, "Four times the scale: daily Saathi transactions climbed from about 5,000 to 20,000."], [70.32, "More schools on board: Teno grew from 5,000 to 7,000 schools, with his Principal Dashboard giving principals one command centre for every school activity."], [82.73, "AI at the drawing board: he runs an AI-driven design system with custom Claude skills that automate design handover and audits."], [92.97, "Credentials in brief: M.Des from MIT Institute of Design; previously Design Manager at PayNearby, and Lead Experience Designer at Propellum and Infosys Digital."], [107.73, "Coming up in this edition: the Mutual Fund Investment Journey and Teacher Attendance case studies."], [114.98, "Now taking enquiries: open to Design Manager, Principal, Head of Design and Design Director roles. Write to the desk."], [126.54, "That's the bulletin for now. Scroll on to read the full stories. This was The Design Chronicle, from Mumbai."]];
  var bulletin = new Audio("assets/audio/bulletin.mp3");
  bulletin.preload = "none";

  /* ---------- synthesised sounds: pips + paper rustle (no extra files) ---------- */
  var actx = null;
  function getCtx() {
    if (actx) return actx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { actx = new AC(); } catch (e) { actx = null; }
    return actx;
  }
  /* radio time-signal pip: short beeps, a longer one at the end */
  function pip(long) {
    var ctx = getCtx(); if (!ctx || muted) return;
    try {
      var t = ctx.currentTime, dur = long ? 0.5 : 0.1;
      var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 1000;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.setValueAtTime(0.18, t + dur - 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function rustle() {
    var ctx = getCtx(); if (!ctx) return;
    try {
      var dur = 0.75, rate = ctx.sampleRate;
      var buf = ctx.createBuffer(1, Math.floor(rate * dur), rate);
      var d = buf.getChannelData(0);
      // crackly noise in short bursts, like a sheet being shaken open
      for (var i = 0; i < d.length; i++) {
        var t = i / rate;
        var burst = Math.pow(Math.abs(Math.sin(t * 38 + Math.sin(t * 9) * 3)), 6);
        d[i] = (Math.random() * 2 - 1) * (0.25 + burst) * Math.exp(-t * 3.2);
      }
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1400;
      var bp = ctx.createBiquadFilter(); bp.type = "peaking"; bp.frequency.value = 4200; bp.gain.value = 6;
      var g = ctx.createGain(); g.gain.value = 0.35;
      src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  /* ---------- radio toggle ---------- */
  function paintRadio() {
    if (!radio) return;
    var on = isOn(tune) || isOn(bulletin);
    radio.setAttribute("aria-pressed", on ? "true" : "false");
    radio.setAttribute("aria-label", on ? "Stop the bulletin" : "Play the bulletin");
    var st = radio.querySelector(".radio-state");
    if (st) st.textContent = on ? "On" : "Play";
    radio.classList.toggle("is-playing", on);
  }
  function isOn(a) { return !a.paused && !a.ended; }
  [tune, bulletin].forEach(function (a) {
    a.addEventListener("play", paintRadio);
    a.addEventListener("pause", paintRadio);
    a.addEventListener("ended", paintRadio);
  });

  /* ---------- on-air caption bar ---------- */
  var bar = document.createElement("div");
  bar.className = "onair"; bar.setAttribute("aria-live", "polite"); bar.hidden = true;
  bar.innerHTML = '<span class="onair-dot" aria-hidden="true"></span>' +
    '<span class="onair-lab">On air <em class="onair-n"></em></span>' +
    '<span class="onair-text"></span>' +
    '<button class="onair-stop" type="button" aria-label="Stop bulletin">Stop</button>';
  document.body.appendChild(bar);
  var barN = bar.querySelector(".onair-n"), barText = bar.querySelector(".onair-text");
  var lastIdx = -1;
  function showLine(i) {
    if (i === lastIdx) return; lastIdx = i;
    var last = LINES.length - 1;
    barN.textContent = (i === 0) ? "· Headlines" : (i === last) ? "· Sign-off" : "· " + i + " of " + (last - 1);
    barText.textContent = LINES[i][1];
    bar.classList.remove("swap"); void bar.offsetWidth; bar.classList.add("swap");
  }
  bulletin.addEventListener("timeupdate", function () {
    var t = bulletin.currentTime, i = 0;
    for (var k = 0; k < LINES.length; k++) if (t >= LINES[k][0]) i = k;
    showLine(i);
  });
  var priming = false;
  bulletin.addEventListener("play", function () { if (priming) return; bar.hidden = false; requestAnimationFrame(function(){ bar.classList.add("show"); }); });
  function hideBar() { if (priming) return; bar.classList.remove("show"); setTimeout(function(){ if (!bar.classList.contains("show")) bar.hidden = true; }, 300); }
  bulletin.addEventListener("ended", hideBar);
  bulletin.addEventListener("pause", hideBar);
  bar.querySelector(".onair-stop").addEventListener("click", function () { bulletin.pause(); tune.pause(); });

  /* tune → bulletin */
  tune.addEventListener("ended", function () {
    if (muted) return;
    try { bulletin.currentTime = 0; } catch (e) {}
    lastIdx = -1;
    var p = bulletin.play(); if (p && p.catch) p.catch(function () {});
  });

  /* iPhone Safari only lets a sound play later if it was started inside a tap,
     so "unlock" the bulletin silently during the same tap that starts the tune */
  var unlocked = false;
  function unlockBulletin() {
    if (unlocked) return; unlocked = true;
    priming = true; bulletin.muted = true;
    var p = bulletin.play();
    var done = function () { bulletin.pause(); try { bulletin.currentTime = 0; } catch (e) {} bulletin.muted = false; priming = false; };
    if (p && p.then) p.then(done).catch(function () { bulletin.muted = false; priming = false; unlocked = false; });
    else done();
  }
  var tuneUnlocked = false;
  function unlockTune() {
    if (tuneUnlocked) return; tuneUnlocked = true;
    tune.muted = true;
    var p = tune.play();
    var done = function () { if (tune.muted) { tune.pause(); try { tune.currentTime = 0; } catch (e) {} tune.muted = false; } };
    if (p && p.then) p.then(done).catch(function () { tune.muted = false; tuneUnlocked = false; });
    else done();
  }

  function playTune(fromStart) {
    if (muted) return;
    bulletin.preload = "auto";
    if (!bulletin.paused && !priming) bulletin.pause();
    unlockBulletin();
    if (fromStart || tune.ended) { try { tune.currentTime = 0; } catch (e) {} }
    tune.muted = false;
    var p = tune.play();
    if (p && p.catch) p.catch(function () {});
  }

  if (radio) {
    radio.addEventListener("click", function () {
      /* tap to play the tune + bulletin; tap again to stop */
      if (isOn(tune) || isOn(bulletin)) { tune.pause(); bulletin.pause(); }
      else { muted = false; playTune(true); }
      paintRadio();
    });
  }
  paintRadio();

  /* ---------- cover ---------- */
  function startPage() {
    requestAnimationFrame(function () { document.body.classList.add("is-ready"); });
  }

  if (!root.classList.contains("has-cover") || !cover || !openBtn) return;

  var opened = false, counting = false, timers = [];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var numEl = cover.querySelector(".cc-num");

  /* tap → 3 · 2 · 1 countdown with pips → paper opens, tune starts */
  function startCountdown() {
    if (opened) return;
    if (counting) { finishOpen(); return; }          // second tap skips the countdown
    counting = true;
    try { sessionStorage.setItem("coverSeen", "1"); } catch (e) {}
    if (!muted) {
      var ctx = getCtx(); if (ctx && ctx.resume) ctx.resume();
      unlockTune(); unlockBulletin();                  // unlock inside the tap (iPhone)
    }
    cover.classList.add("is-counting");
    var n = 5;
    function tick() {
      if (opened) return;
      if (n === 0) { pip(true); finishOpen(); return; }
      numEl.textContent = n;
      cover.classList.remove("cc-tick"); void cover.offsetWidth; cover.classList.add("cc-tick");
      pip(false);
      n--;
      timers.push(setTimeout(tick, 1000));
    }
    tick();
  }

  function finishOpen() {
    if (opened) return;
    opened = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem("coverSeen", "1"); } catch (e) {}
    if (!muted) {
      rustle();
      playTune(true);
    }
    cover.classList.add("is-opening");
    setTimeout(function () {
      root.classList.remove("has-cover");
      cover.parentNode && cover.parentNode.removeChild(cover);
      window.scrollTo(0, 0);
      startPage();
    }, reduce ? 220 : 1000);
  }

  openBtn.addEventListener("click", startCountdown);
  function onKey(e) {
    if (opened) { document.removeEventListener("keydown", onKey); return; }
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") { e.preventDefault(); startCountdown(); }
  }
  document.addEventListener("keydown", onKey);
})();
