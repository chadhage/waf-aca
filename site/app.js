/* ============================================================
   Shared behaviour: theme toggle, delivery-mode persistence,
   active nav highlighting. Loaded on every page.
   ============================================================ */
(function () {
  "use strict";

  var THEME_KEY = "waaca-theme";
  var MODE_KEY = "waaca-mode";

  /* ---------- Theme ---------- */
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.querySelector("[data-theme-label]").textContent = t === "dark" ? "Light" : "Dark";
    }
  }
  function toggleTheme() {
    var next = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  /* ---------- Delivery mode ---------- */
  // Priority: explicit ?mode= query param > saved value > default "self"
  function getMode() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("mode");
    if (q === "self" || q === "led") {
      localStorage.setItem(MODE_KEY, q);
      return q;
    }
    return localStorage.getItem(MODE_KEY) || "self";
  }
  function setMode(m) {
    if (m !== "self" && m !== "led") return;
    localStorage.setItem(MODE_KEY, m);
    document.body.setAttribute("data-mode", m);
    document.dispatchEvent(new CustomEvent("modechange", { detail: m }));
  }

  /* ---------- Active nav ---------- */
  function markActiveNav() {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".navlinks a").forEach(function (a) {
      var target = (a.getAttribute("href") || "").split("?")[0].split("#")[0];
      if (target === here) a.classList.add("active");
    });
  }

  /* ---------- Expose ---------- */
  window.WAACA = {
    getMode: getMode,
    setMode: setMode,
    getTheme: getTheme,
    MODE_KEY: MODE_KEY
  };

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getTheme());
    document.body.setAttribute("data-mode", getMode());
    markActiveNav();

    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) toggle.addEventListener("click", toggleTheme);
  });
})();
