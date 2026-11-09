/* ============================================================
   The Design Chronicle — case-study enhancements (shared)
   reading progress · scroll reveal · board icons · section anchors
   image lightbox · back-to-top
   Content is never changed; this only adds interaction.
   ============================================================ */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("cs-js");

  /* ---------- icon set (line icons, 24px grid) ---------- */
  var P = {
    box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5L12 12l9-4.5M12 12v9"/>',
    devices: '<rect x="2" y="5" width="14" height="10" rx="1.5"/><path d="M6 19h6"/><rect x="17" y="8" width="5" height="11" rx="1.2"/>',
    badge: '<circle cx="12" cy="8" r="4"/><path d="M8.5 11.5L7 21l5-2.5 5 2.5-1.5-9.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2 .8 3.5 2.8 3.5 5.7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tool: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5L17 4l3 3-2.5 2.5"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.3"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  function svg(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[name] || P.spark) + '</svg>';
  }

  /* ---------- 1. reading progress ---------- */
  var bar = doc.createElement("div");
  bar.className = "cs-progress"; bar.setAttribute("aria-hidden", "true");
  doc.body.appendChild(bar);

  /* ---------- 2. back to top ---------- */
  var top = doc.createElement("button");
  top.type = "button"; top.className = "cs-totop"; top.setAttribute("aria-label", "Back to top");
  top.innerHTML = svg("up", 18);
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  doc.body.appendChild(top);

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = root.scrollHeight - innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
      top.classList.toggle("show", scrollY > innerHeight * 1.2);
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- 3. icons on the project-info board ---------- */
  var MAP = [
    [/product|type/i, "box"], [/surface|platform/i, "devices"], [/role/i, "badge"],
    [/scope|coverage/i, "target"], [/user|validated|team/i, "users"], [/method|practice/i, "compass"],
    [/prd|timeline|year/i, "calendar"], [/turnaround|cadence/i, "clock"], [/tool/i, "tool"],
    [/brief/i, "file"], [/decision|concurrent/i, "layers"], [/milestone/i, "flag"],
    [/rating|confident/i, "star"]
  ];
  doc.querySelectorAll(".cs-board-cell .k").forEach(function (k) {
    if (k.querySelector("svg")) return;
    var t = k.textContent, name = "spark";
    for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(t)) { name = MAP[i][1]; break; }
    k.insertAdjacentHTML("afterbegin", '<span class="cs-k-ico">' + svg(name, 14) + "</span>");
  });

  /* ---------- 4. section anchors ---------- */
  var used = {};
  doc.querySelectorAll(".cs-block > h2").forEach(function (h) {
    var sec = h.parentElement;
    if (!sec.id) {
      var base = (h.textContent || "section").replace(/^\s*\d+\s*/, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "section";
      var id = base, n = 2;
      while (used[id] || doc.getElementById(id)) id = base + "-" + n++;
      used[id] = 1; sec.id = id;
    }
    var a = doc.createElement("a");
    a.className = "cs-anchor"; a.href = "#" + sec.id;
    a.setAttribute("aria-label", "Link to this section");
    a.innerHTML = svg("link", 15);
    a.addEventListener("click", function (e) {
      try {
        var url = location.href.split("#")[0] + "#" + sec.id;
        if (navigator.clipboard) { navigator.clipboard.writeText(url); a.classList.add("copied"); setTimeout(function () { a.classList.remove("copied"); }, 1400); }
      } catch (err) {}
    });
    h.appendChild(a);
  });

  /* ---------- 5. scroll reveal ---------- */
  var blocks = doc.querySelectorAll(".cs-block, .cs-figure, .cs-flow, .phone-strip, .cs-table-wrap, .n-cards, .t-dec, .cs-video, .cs-morelink, .feature-table, .cs-feat-grid, .cs-story");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("cs-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    blocks.forEach(function (b) { b.classList.add("cs-rv"); io.observe(b); });
    /* failsafe: never leave content hidden once it's been reached */
    var pending = Array.prototype.slice.call(blocks);
    var sweep = function () {
      var vh = innerHeight, atEnd = scrollY + vh >= root.scrollHeight - 40;
      pending = pending.filter(function (el) {
        if (atEnd || el.getBoundingClientRect().top < vh) { el.classList.add("cs-in"); io.unobserve(el); return false; }
        return true;
      });
      if (!pending.length) removeEventListener("scroll", sweepRaf);
    };
    var sweepQueued = false;
    var sweepRaf = function () { if (sweepQueued) return; sweepQueued = true; setTimeout(function () { sweepQueued = false; sweep(); }, 120); };
    addEventListener("scroll", sweepRaf, { passive: true });
    addEventListener("load", sweep);
    addEventListener("hashchange", sweep);
  }

  /* ---------- 6. image lightbox ---------- */
  var zoomable = doc.querySelectorAll(".cs-figure img, .cs-flow img, .cs-frame img, .cs-feat img, .cs-plate img");
  if (zoomable.length) {
    var box = doc.createElement("div");
    box.className = "cs-lightbox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.hidden = true;
    box.innerHTML = '<button type="button" class="cs-lb-close" aria-label="Close">' + svg("close", 20) + '</button><img alt=""><p class="cs-lb-cap"></p>';
    doc.body.appendChild(box);
    var bImg = box.querySelector("img"), bCap = box.querySelector(".cs-lb-cap"), last = null;
    function open(img) {
      last = img;
      bImg.src = img.currentSrc || img.src; bImg.alt = img.alt || "";
      var fc = img.closest("figure"); var cap = fc && fc.querySelector("figcaption");
      bCap.textContent = cap ? cap.textContent : (img.alt || "");
      box.hidden = false; requestAnimationFrame(function () { box.classList.add("open"); });
      doc.body.classList.add("cs-lb-lock");
      box.querySelector(".cs-lb-close").focus();
    }
    function close() {
      box.classList.remove("open"); doc.body.classList.remove("cs-lb-lock");
      setTimeout(function () { box.hidden = true; bImg.src = ""; }, reduce ? 0 : 220);
      if (last) try { last.focus(); } catch (e) {}
    }
    zoomable.forEach(function (img) {
      img.classList.add("cs-zoom"); img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Enlarge image" + (img.alt ? ": " + img.alt : ""));
      var wrap = img.parentElement;
      if (wrap && !wrap.querySelector(".cs-zoom-hint")) {
        wrap.classList.add("cs-zoom-wrap");
        wrap.insertAdjacentHTML("beforeend", '<span class="cs-zoom-hint" aria-hidden="true">' + svg("expand", 14) + "</span>");
      }
      img.addEventListener("click", function () { open(img); });
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); } });
    });
    box.addEventListener("click", function (e) { if (e.target !== bImg) close(); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  }
})();
