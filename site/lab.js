/* ============================================================
   Lab guide rendering + progress tracking.
   Reads modules.json, respects the delivery mode, persists
  structured evidence records in localStorage.
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

  /* ---------- progress store ---------- */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
  var progress = loadProgress();

  function recordFor(id) {
    var record = progress[id] || {};
    return {
      artifact: record.artifact || "",
      observation: record.observation || "",
      source: record.source || "",
      attested: record.attested === true
    };
  }

  function recordComplete(record) {
    return !!(record.attested && record.artifact.trim() && record.observation.trim() && record.source.trim());
  }

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
    var record = recordFor(act.id);
    var done = recordComplete(record);
    var fieldsComplete = !!(record.artifact.trim() && record.observation.trim() && record.source.trim());

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
    parts.push('<div class="evidence-box">Evidence to capture: ' + esc(act.evidence) + "</div>");

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
      '<fieldset class="evidence-record"><legend>Validation evidence record</legend>' +
      '<label>Artifact path or URI<input type="text" data-record="artifact" data-activity="' + act.id +
      '" value="' + esc(record.artifact) + '" placeholder="evidence/… or approved repository URI" /></label>' +
      '<label>Observed result<textarea data-record="observation" data-activity="' + act.id +
      '" rows="3" placeholder="Timestamp, actual result, and interpretation">' + esc(record.observation) + "</textarea></label>" +
      '<label>Microsoft source URL<input type="url" data-record="source" data-activity="' + act.id +
      '" value="' + esc(record.source) + '" placeholder="https://learn.microsoft.com/…" /></label>' +
      '<label class="evidence-toggle"><input type="checkbox" data-attest="' + act.id + '"' +
      (record.attested ? " checked" : "") + (fieldsComplete ? "" : " disabled") +
      " /> I attest that the artifact contains the stated machine-readable result</label></fieldset>"
    );

    return (
      '<div class="activity' + (done ? " completed" : "") + '" id="' + act.id + '">' +
      '<button type="button" class="act-head" data-toggle="' + act.id + '" aria-expanded="false" aria-controls="' + act.id + '-body">' +
      '<span class="act-check" aria-hidden="true">✓</span>' +
      '<span class="act-title">' + esc(act.title) + "</span>" +
      '<span class="act-time">' + esc(act.time) + "</span>" +
      '<span class="chev" aria-hidden="true">▶</span>' +
      "</button>" +
      '<div class="act-body" id="' + act.id + '-body">' + parts.join("") + "</div>" +
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
        return recordComplete(recordFor(a.id));
      }).length;
    }, 0);
  }

  function moduleComplete(m) {
    return m.activities.every(function (a) { return recordComplete(recordFor(a.id)); });
  }

  function modulePercent(m) {
    var complete = m.activities.filter(function (a) { return recordComplete(recordFor(a.id)); }).length;
    return m.activities.length ? (complete / m.activities.length) * 100 : 0;
  }

  function weightedScore() {
    return MODULES.reduce(function (sum, m) {
      return sum + (m.domainPoints * modulePercent(m) / 100);
    }, 0);
  }

  function updateMeter() {
    var done = completedCount();
    var totalActivities = MODULES.reduce(function (sum, m) { return sum + m.activities.length; }, 0);
    var pct = Math.round(weightedScore());
    var domainMinimumsMet = MODULES.every(function (m) { return modulePercent(m) >= 60; });
    var capstone = MODULES.find(function (m) { return m.id === "m7"; });
    var capstoneComplete = !!(capstone && moduleComplete(capstone));
    var ready = pct >= 80 && domainMinimumsMet && capstoneComplete;
    meterFill.style.width = pct + "%";
    meterPct.textContent = pct + "%";
    meterFill.classList.toggle("pass", ready);
    if (ready) {
      meterHint.textContent = "Readiness gate met. Export evidence, pass the knowledge check, and schedule live assessor verification.";
    } else if (pct >= 80 && !capstoneComplete) {
      meterHint.textContent = "Weighted score is sufficient, but the individual capstone is mandatory.";
    } else if (pct >= 80 && !domainMinimumsMet) {
      meterHint.textContent = "Weighted score is sufficient, but every domain must reach 60%.";
    } else {
      meterHint.textContent = "Weighted readiness: " + done + "/" + totalActivities + " evidence records complete; capstone and 60% per domain required.";
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
    if (!el) return;
    var open = el.classList.toggle("open");
    var head = el.querySelector(".act-head");
    if (head) head.setAttribute("aria-expanded", String(open));
  }

  function refreshActivity(id) {
    var record = recordFor(id);
    var complete = recordComplete(record);
    var el = document.getElementById(id);
    if (el) el.classList.toggle("completed", complete);
    var attest = document.querySelector('[data-attest="' + id + '"]');
    var fieldsComplete = !!(record.artifact.trim() && record.observation.trim() && record.source.trim());
    if (attest) {
      attest.disabled = !fieldsComplete;
      attest.checked = record.attested;
    }
    saveProgress(progress);
    updateMeter();
  }

  function bindEvents() {
    content.addEventListener("click", function (e) {
      var head = e.target.closest(".act-head");
      if (!head) return;
      toggleActivity(head.getAttribute("data-toggle"));
    });

    content.addEventListener("input", function (e) {
      var field = e.target.closest("[data-record]");
      if (!field) return;
      var id = field.getAttribute("data-activity");
      progress[id] = recordFor(id);
      progress[id][field.getAttribute("data-record")] = field.value;
      if (!progress[id].artifact.trim() || !progress[id].observation.trim() || !progress[id].source.trim()) {
        progress[id].attested = false;
      }
      refreshActivity(id);
    });

    content.addEventListener("change", function (e) {
      var attest = e.target.closest("[data-attest]");
      if (!attest) return;
      var id = attest.getAttribute("data-attest");
      progress[id] = recordFor(id);
      progress[id].attested = attest.checked;
      refreshActivity(id);
    });
  }

  function exportEvidence() {
    var payload = {
      schemaVersion: 1,
      generatedAtUtc: new Date().toISOString(),
      deliveryMode: window.WAACA.getMode(),
      weightedReadinessScore: Math.round(weightedScore()),
      records: progress,
      notice: "Browser records are unverified. An assessor must inspect artifacts and live Azure state."
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "waaca-evidence-record.json";
    link.click();
    URL.revokeObjectURL(link.href);
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
        location.reload();
      });
    }

    var exportBtn = document.getElementById("export-evidence");
    if (exportBtn) exportBtn.addEventListener("click", exportEvidence);

    fetch("data/modules.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        MODULES = data.modules;
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
            if (target.classList.contains("activity")) toggleActivity(hash);
          }
        }
      })
      .catch(function () {
        content.innerHTML =
          '<div class="loading">Could not load lab content. Serve this site over HTTP so fetch() can read data/modules.json.</div>';
      });
  });
})();
