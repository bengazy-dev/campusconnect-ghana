(function () {
  var THEME_KEY = "campusconnect-theme";
  var LOADER_MS = 1000;

  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function setTheme(mode) {
    if (mode !== "light" && mode !== "dark") return;
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch (e) {}
    syncThemeMeta();
    syncThemeToggle();
  }

  function syncThemeMeta() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", getTheme() === "light" ? "#f1f5f9" : "#070a0f");
  }

  function syncThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var dark = getTheme() === "dark";
    btn.setAttribute("aria-checked", dark ? "true" : "false");
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = dark ? "Light mode" : "Dark mode";
    btn.classList.toggle("theme-toggle--dark", dark);
  }

  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      setTheme(getTheme() === "dark" ? "light" : "dark");
    });
  }

  function initLoader() {
    var el = document.getElementById("loading");
    if (!el) {
      document.body.classList.add("is-ready");
      return;
    }
    if (!document.getElementById("eventsGrid") && !document.getElementById("savedGrid")) {
      el.remove();
      document.body.classList.add("is-ready");
      return;
    }
    var start = typeof performance !== "undefined" ? performance.now() : 0;
    function done() {
      el.classList.add("is-done");
      el.setAttribute("aria-busy", "false");
      document.body.classList.add("is-ready");
      setTimeout(function () {
        el.remove();
      }, 550);
    }
    var elapsed = (typeof performance !== "undefined" ? performance.now() : 0) - start;
    var wait = Math.max(0, LOADER_MS - elapsed);
    setTimeout(done, wait);
  }

  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    var nodes = document.querySelectorAll(".reveal-on-scroll");
    if (!nodes.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  function markRevealTargets() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".event-card, .stat-pill, .feed-toolbar, .page-hero").forEach(function (el) {
      el.classList.add("reveal-on-scroll");
    });
  }

  function initNavClose() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.checked = false;
      });
    });
  }

  function onReady() {
    syncThemeMeta();
    syncThemeToggle();
    initThemeToggle();
    markRevealTargets();
    initReveal();
    initNavClose();
    initLoader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  window.addEventListener("storage", function (e) {
    if (e.key !== THEME_KEY) return;
    if (e.newValue === "light" || e.newValue === "dark") {
      document.documentElement.setAttribute("data-theme", e.newValue);
      syncThemeMeta();
      syncThemeToggle();
    }
  });
})();
