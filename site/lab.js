/* ============================================================
   Lab guide rendering + progress tracking.
   Reads modules.json, respects the delivery mode, persists
   activity completion and evidence checkboxes in localStorage.
   ============================================================ */
(function () {
  "use strict";

  var PROGRESS_KEY = "waaca-progress";
  var content = document.getElementById("lab-content");
  var railMods = document.getElementById("rail-mods");
  var meterFill = document.getElementById("meter-fill");
  var meterPct = document.getElementById("meter-pct");
  var meterHint = document.getElementById("meter-hint");
  var modeIndicator = document.getElementById("mode-indicator");

  var MODULES = [];
  var totalActivities = 0;

  /* ---------- progress store ---------- */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
  var progress = loadProgress();

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- rendering ---------- */
  function stepGroup(label, num, inner) {
    return (
      '<div class="step-group"><div class="step-label">' +
      (num ? '<span class="num">' + num + "</span>" : "") +
      esc(label) + "</div>" + inner + "</div>"
    );
  }

  function renderList(items) {
    return "<ol>" + items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ol>";
  }

  function renderActivity(mod, act) {
    var done = !!(progress[act.id] && progress[act.id].done);
    var evidenceChecked = !!(progress[act.id] && progress[act.id].evidence);

    var parts = [];
    parts.push(stepGroup("Pre-check", null, "<p>" + esc(act.precheck) + "</p>"));
    parts.push(stepGroup("Steps", null, renderList(act.steps)));
    if (act.commands) {
      parts.push('<pre class="cmd">' + esc(act.commands) + "</pre>");
    }
    parts.push(
      '<div class="validation-box">' +
      stepGroup("Validation gate", null, "<p>" + esc(act.validation) + "</p>") +
      "</div>"
    );
    parts.push('<div class="evidence-box">📁 Evidence to capture: ' + esc(act.evidence) + "</div>");

    // Instructor-only block (CSS hides it in self mode)
    if (act.talkTrack) {
      parts.push(
        '<div class="instructor">' +
        stepGroup("Instructor talk track", null, "<p>" + esc(act.talkTrack) + "</p>") +
        "</div>"
      );
    }
    if (act.stretch) {
      parts.push(
        '<div class="stretch">' +
        stepGroup("Level-400 stretch", null, "<p>" + esc(act.stretch) + "</p>") +
        "</div>"
      );
    }

    parts.push(
      '<label class="evidence-toggle">' +
      '<input type="checkbox" data-evidence="' + act.id + '"' + (evidenceChecked ? " checked" : "") + " />" +
      " I have captured and saved the evidence for this activity</label>"
    );

    return (
      '<div class="activity' + (done ? " completed" : "") + '" id="' + act.id + '">' +
      '<div class="act-head" data-toggle="' + act.id + '">' +
      '<span class="act-check" data-check="' + act.id + '">✓</span>' +
      '<span class="act-title">' + esc(act.title) + "</span>" +
      '<span class="act-time">' + esc(act.time) + "</span>" +
      '<span class="chev">▶</span>' +
      "</div>" +
      '<div class="act-body">' + parts.join("") + "</div>" +
      "</div>"
    );
  }

  function renderModule(mod) {
    var level = mod.index <= 0 ? "l300" : "l400";
    var levelLabel = mod.index <= 0 ? "L300→400" : "L400";
    var outcomes = (mod.outcomes || [])
      .map(function (o) { return "<li>" + esc(o) + "</li>"; })
      .join("");
    var acts = mod.activities.map(function (a) { return renderActivity(mod, a); }).join("");

    return (
      '<section class="mod-block" id="' + mod.id + '">' +
      "<header>" +
      '<span class="mod-num">MODULE ' + mod.index + " · " + esc(mod.code) + "</span>" +
      "<h2>" + esc(mod.title) + "</h2>" +
      '<div class="pill-row">' +
      '<span class="badge badge-' + level + '">' + levelLabel + "</span>" +
      '<span class="badge badge-pts">' + mod.domainPoints + " pts</span>" +
      '<span class="tag">' + esc(mod.duration) + "</span>" +
      (mod.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
      "</div>" +
      '<p class="mod-summary">' + esc(mod.summary) + "</p>" +
      '<ul class="outcomes">' + outcomes + "</ul>" +
      '<div class="gate"><strong>Evidence gate:</strong> ' + esc(mod.evidenceGate) + "</div>" +
      "</header>" +
      acts +
      "</section>"
    );
  }

  /* ---------- progress meter + rail ---------- */
  function completedCount() {
    return MODULES.reduce(function (sum, m) {
      return sum + m.activities.filter(function (a) {
        return progress[a.id] && progress[a.id].done;
      }).length;
    }, 0);
  }

  function moduleComplete(m) {
    return m.activities.every(function (a) { return progress[a.id] && progress[a.id].done; });
  }

  function updateMeter() {
    var done = completedCount();
    var pct = totalActivities ? Math.round((done / totalActivities) * 100) : 0;
    meterFill.style.width = pct + "%";
    meterPct.textContent = pct + "%";
    meterFill.classList.toggle("pass", pct >= 80);
    if (pct >= 100) {
      meterHint.textContent = "All activities complete. Take the knowledge check to certify.";
    } else if (pct >= 80) {
      meterHint.textContent = "You have cleared the 80% activity gate. Finish the capstone and knowledge check.";
    } else {
      meterHint.textContent = "Complete every activity to reach the 80% gate (" + done + "/" + totalActivities + ").";
    }

    // rail states
    MODULES.forEach(function (m) {
      var el = document.querySelector('[data-rail="' + m.id + '"]');
      if (el) el.classList.toggle("done", moduleComplete(m));
    });
  }

  function renderRail() {
    railMods.innerHTML = MODULES.map(function (m) {
      return (
        '<a class="rail-mod" data-rail="' + m.id + '" href="#' + m.id + '">' +
        '<span class="rail-check">' + m.index + "</span>" + esc(m.title) + "</a>"
      );
    }).join("");
  }

  /* ---------- events ---------- */
  function toggleActivity(id) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle("open");
  }

  function setDone(id, done) {
    progress[id] = progress[id] || {};
    progress[id].done = done;
    saveProgress(progress);
    var el = document.getElementById(id);
    if (el) el.classList.toggle("completed", done);
    updateMeter();
  }

  function bindEvents() {
    content.addEventListener("click", function (e) {
      var head = e.target.closest(".act-head");
      if (!head) return;
      var id = head.getAttribute("data-toggle");
      // clicking the check toggles completion; clicking elsewhere expands
      if (e.target.closest(".act-check")) {
        e.stopPropagation();
        var cur = !!(progress[id] && progress[id].done);
        setDone(id, !cur);
        return;
      }
      toggleActivity(id);
    });

    content.addEventListener("change", function (e) {
      var cb = e.target.closest("[data-evidence]");
      if (!cb) return;
      var id = cb.getAttribute("data-evidence");
      progress[id] = progress[id] || {};
      progress[id].evidence = cb.checked;
      // capturing evidence also marks the activity done for convenience
      if (cb.checked && !(progress[id] && progress[id].done)) setDone(id, true);
      saveProgress(progress);
    });
  }

  /* ---------- mode ---------- */
  function reflectMode() {
    var mode = window.WAACA.getMode();
    document.body.setAttribute("data-mode", mode);
    if (modeIndicator) {
      modeIndicator.textContent = mode === "led" ? "🎓 Instructor-led" : "🧭 Self-paced";
    }
    var lbl = document.querySelector("[data-mode-switch-label]");
    if (lbl) lbl.textContent = mode === "led" ? "Led" : "Self";
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    reflectMode();

    var switchBtn = document.querySelector("[data-mode-switch]");
    if (switchBtn) {
      switchBtn.addEventListener("click", function () {
        var next = window.WAACA.getMode() === "led" ? "self" : "led";
        window.WAACA.setMode(next);
        reflectMode();
      });
    }

    var resetBtn = document.getElementById("reset-progress");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (!confirm("Reset all lab progress and evidence in this browser?")) return;
        progress = {};
        saveProgress(progress);
        document.querySelectorAll(".activity.completed").forEach(function (a) { a.classList.remove("completed"); });
        document.querySelectorAll("[data-evidence]").forEach(function (c) { c.checked = false; });
        updateMeter();
      });
    }

    fetch("data/modules.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        MODULES = data.modules;
        totalActivities = MODULES.reduce(function (s, m) { return s + m.activities.length; }, 0);
        content.innerHTML = MODULES.map(renderModule).join("");
        renderRail();
        bindEvents();
        updateMeter();

        // open the first incomplete activity, or the one targeted by the hash
        var hash = location.hash.replace("#", "");
        if (hash) {
          var target = document.getElementById(hash);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            if (target.classList.contains("activity")) target.classList.add("open");
          }
        }
      })
      .catch(function () {
        content.innerHTML =
          '<div class="loading">Could not load lab content. Serve this site over HTTP so fetch() can read data/modules.json.</div>';
      });
  });
})();
