/* ============================================================
   The Design Chronicle — homepage interactions
   (progress bar · dateline · ticker · counters · hover-peek
    · spotlight · magnetic buttons · print-in load)
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- print-in load ---- */
  requestAnimationFrame(function () { document.body.classList.add("is-ready"); });

  /* ---- reading progress ---- */
  var bar = document.getElementById("progress");
  if (bar) {
    var tick = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      bar.style.width = (p * 100).toFixed(2) + "%";
    };
    document.addEventListener("scroll", tick, { passive: true });
    tick();
  }

  /* ---- ticker: duplicate for seamless loop ---- */
  var track = document.getElementById("tickerTrack");
  if (track && !reduce) {
    track.innerHTML += track.innerHTML;
  }

  /* ---- count-up numbers ---- */
  var counts = document.querySelectorAll(".count");
  function animateCount(el) {
    var to = parseFloat(el.getAttribute("data-to")) || 0;
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = pre + to + suf; return; }
    var dur = 1100, start = null;
    function step(t) {
      if (!start) start = t;
      var k = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(to * eased) + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counts.length) {
    if ("IntersectionObserver" in window) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      counts.forEach(function (c) { co.observe(c); });
    } else {
      counts.forEach(animateCount);
    }
  }

  /* ---- hover-peek clipping + spotlight ---- */
  var peek = document.getElementById("peek");
  var editions = document.getElementById("editions");
  if (peek && editions && fine && !reduce) {
    var pKicker = document.getElementById("peekKicker");
    var pTitle = document.getElementById("peekTitle");
    var pMetric = document.getElementById("peekMetric");
    var pPhoto = document.getElementById("peekPhoto");
    var pFoot = document.getElementById("peekFoot");
    var clip = peek.querySelector(".peek-clip");
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      peek.style.left = cx + "px"; peek.style.top = cy + "px";
      raf = requestAnimationFrame(loop);
    }

    var entries = editions.querySelectorAll(".entry");
    entries.forEach(function (en) {
      en.addEventListener("mouseenter", function () {
        var accent = en.getAttribute("data-accent") || "#A6322A";
        clip.style.setProperty("--accent", accent);
        pKicker.textContent = en.getAttribute("data-kicker") || "";
        pTitle.textContent = en.getAttribute("data-title") || "";
        var soon = en.classList.contains("entry-soon");
        if (soon) {
          pPhoto.innerHTML = '<span class="peek-metric">Coming soon</span>';
          if (pFoot) pFoot.textContent = "Coming soon";
        } else {
          var img = en.getAttribute("data-img");
          var metric = en.getAttribute("data-metric") || "";
          pPhoto.innerHTML = img
            ? '<img src="' + img + '" alt="">'
            : '<span class="peek-metric">' + metric + "</span>";
          if (pFoot) pFoot.textContent = "Read the full story →";
        }
        editions.classList.add("has-hover");
        peek.classList.add("show");
      });
    });
    editions.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) { cx = tx; cy = ty; loop(); }
    });
    editions.addEventListener("mouseleave", function () {
      editions.classList.remove("has-hover");
      peek.classList.remove("show");
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }

  /* ---- magnetic buttons ---- */
  if (fine && !reduce) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + mx * 0.25 + "px," + my * 0.35 + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }
})();
