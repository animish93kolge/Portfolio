/* ============================================================
   The Design Chronicle — "AI edition" homepage interactions
   halftone field · typed headline · AI desk console · lead cards
   All content is in the HTML; scripts only add motion.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document;
  doc.documentElement.classList.add("ai-js");

  /* ---------- 1. interactive halftone dots behind the nameplate ---------- */
  var cv = doc.getElementById("plateDots");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d"), host = cv.parentElement;
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), gap = 18;
    var mx = -999, my = -999, tx = -999, ty = -999, t0 = performance.now(), running = false, visible = true;
    function size() {
      var r = host.getBoundingClientRect();
      W = r.width; H = r.height; gap = W < 600 ? 16 : 18;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(performance.now());
    }
    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      var t = (now - t0) / 1000;
      mx += (tx - mx) * 0.12; my += (ty - my) * 0.12;
      for (var y = gap / 2; y < H; y += gap) {
        for (var x = gap / 2; x < W; x += gap) {
          var wave = reduce ? 0.5 : (Math.sin(x * 0.012 + t * 0.9) + Math.cos(y * 0.016 - t * 0.7)) * 0.25 + 0.5;
          var d = Math.hypot(x - mx, y - my), near = Math.max(0, 1 - d / 170);
          var r = 0.5 + wave * 0.9 + near * 3.6;
          ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832);
          ctx.fillStyle = near > 0.02 ? "rgba(166,50,42," + (0.18 + near * 0.55).toFixed(3) + ")" : "rgba(27,25,21,0.09)";
          ctx.fill();
        }
      }
    }
    function loop(now) { if (!running) return; draw(now); requestAnimationFrame(loop); }
    function start() { if (running || reduce || !visible) return; running = true; requestAnimationFrame(loop); }
    host.addEventListener("pointermove", function (e) { var r = host.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; });
    host.addEventListener("pointerleave", function () { tx = -999; ty = -999; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else running = false; }).observe(host);
    }
    addEventListener("resize", size);
    size(); start();
  }

  /* ---------- 2. headline types itself in when it scrolls into view ---------- */
  var head = doc.getElementById("typeHead");
  if (head && !reduce && "IntersectionObserver" in window) {
    var full = head.textContent;
    head.setAttribute("aria-label", full);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      head.textContent = ""; head.classList.add("typing");
      var span = doc.createElement("span"); span.setAttribute("aria-hidden", "true");
      head.appendChild(span);
      var i = 0;
      (function tick() {
        i += 1; span.textContent = full.slice(0, i);
        if (i < full.length) setTimeout(tick, full[i - 1] === " " ? 38 : 24);
        else setTimeout(function () { head.classList.remove("typing"); head.classList.add("typed"); }, 900);
      })();
    }, { threshold: 0.4 });
    io.observe(head);
  }

  /* ---------- 3. AI desk console: tabs + typed output + auto-cycle ---------- */
  var desk = doc.getElementById("aiDesk");
  if (desk) {
    desk.classList.add("is-live");
    var tabs = [].slice.call(desk.querySelectorAll(".ai-tab"));
    var panels = [].slice.call(desk.querySelectorAll(".ai-panel"));
    var texts = panels.map(function (p) { return p.querySelector(".ai-out").textContent; });
    var cur = -1, timer = null, typer = null, auto = !reduce, CYCLE = 7000;
    function show(n, fromUser) {
      if (fromUser) { auto = false; desk.classList.add("manual"); }
      if (n === cur) return; cur = n;
      tabs.forEach(function (t, i) { var on = i === n; t.classList.toggle("on", on); t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
      panels.forEach(function (p, i) { p.hidden = i !== n; });
      var out = panels[n].querySelector(".ai-out"), txt = texts[n];
      clearTimeout(typer);
      if (reduce) { out.textContent = txt; }
      else {
        out.textContent = ""; out.classList.add("typing"); var k = 0;
        (function t() { k += 2; out.textContent = txt.slice(0, k); if (k < txt.length) typer = setTimeout(t, 14); else out.classList.remove("typing"); })();
      }
      desk.style.setProperty("--cycle", CYCLE + "ms");
      tabs.forEach(function (t) { t.classList.remove("run", "paused"); }); void tabs[n].offsetWidth; if (auto) tabs[n].classList.add("run");
      clearTimeout(timer); if (auto) timer = setTimeout(function () { show((n + 1) % tabs.length); }, CYCLE);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i, true); });
      t.addEventListener("keydown", function (e) {
        var k = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (k) { e.preventDefault(); var n = (i + k + tabs.length) % tabs.length; show(n, true); tabs[n].focus(); }
      });
    });
    var started = false;
    function begin() { if (started) return; started = true; show(0); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) begin(); }, { threshold: 0.35 }).observe(desk);
    else begin();
    panels.forEach(function (p, i) { p.hidden = i !== 0; });
    desk.addEventListener("mouseenter", function () { if (auto) { clearTimeout(timer); tabs[cur] && tabs[cur].classList.add("paused"); } });
    desk.addEventListener("mouseleave", function () { if (auto && cur > -1) { tabs[cur].classList.remove("paused"); show((cur + 1) % tabs.length); } });
  }

  /* ---------- 4. "How I lead" cards open on hover / tap ---------- */
  var cards = doc.getElementById("leadCards");
  if (cards) {
    cards.classList.add("is-compact");
    [].slice.call(cards.querySelectorAll(".hl-item")).forEach(function (c) {
      c.setAttribute("role", "button"); c.setAttribute("aria-expanded", "false");
      function toggle() { var o = !c.classList.contains("open"); c.classList.toggle("open", o); c.setAttribute("aria-expanded", o ? "true" : "false"); }
      c.addEventListener("click", toggle);
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
  }
})();
