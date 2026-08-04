/* ============================================================
   Knowledge check: draws a weighted random 25 from the bank,
   scores answers, requires >=80% to pass, shows explanations
   and Microsoft source links, and gives a category breakdown.
   ============================================================ */
(function () {
  "use strict";

  var ISSUE = 25;
  var PASS = 80;

  var meta, categories, bank;
  var quiz = [];
  var current = 0;
  var answers = []; // index chosen per question
  var locked = false;

  var el = {
    intro: document.getElementById("kc-intro"),
    quiz: document.getElementById("kc-quiz"),
    result: document.getElementById("kc-result"),
    counter: document.getElementById("q-counter"),
    cat: document.getElementById("q-cat"),
    stem: document.getElementById("q-stem"),
    options: document.getElementById("q-options"),
    explain: document.getElementById("q-explain"),
    next: document.getElementById("q-next"),
    hint: document.getElementById("q-hint"),
    progress: document.getElementById("kc-progress-fill"),
    resultInner: document.getElementById("result-inner"),
    start: document.getElementById("start-kc")
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Build a weighted, category-balanced selection of ISSUE questions.
  function buildQuiz() {
    var byCat = {};
    bank.forEach(function (q) {
      (byCat[q.category] = byCat[q.category] || []).push(q);
    });

    var weights = meta.categoryWeights || {};
    var selected = [];
    var usedIds = {};

    // target count per category from weights
    Object.keys(weights).forEach(function (cat) {
      var target = Math.round(weights[cat] * ISSUE);
      var pool = shuffle(byCat[cat] || []);
      for (var i = 0; i < target && i < pool.length; i++) {
        selected.push(pool[i]);
        usedIds[pool[i].id] = true;
      }
    });

    // top up or trim to exactly ISSUE
    var remaining = shuffle(bank.filter(function (q) { return !usedIds[q.id]; }));
    while (selected.length < ISSUE && remaining.length) {
      selected.push(remaining.pop());
    }
    selected = shuffle(selected).slice(0, ISSUE);
    return selected;
  }

  function catName(key) { return (categories && categories[key]) || key; }

  function renderQuestion() {
    locked = false;
    var q = quiz[current];
    el.counter.textContent = "Question " + (current + 1) + " of " + quiz.length;
    el.cat.textContent = catName(q.category) + (q.scenario ? " · scenario" : "");
    el.stem.textContent = q.stem;
    el.explain.className = "explain";
    el.explain.innerHTML = "";
    el.next.classList.add("hidden");
    el.hint.textContent = "Select an answer";
    el.progress.style.width = Math.round((current / quiz.length) * 100) + "%";

    var keys = ["A", "B", "C", "D", "E", "F"];
    el.options.innerHTML = q.options.map(function (opt, i) {
      return (
        '<button class="opt" data-opt="' + i + '">' +
        '<span class="opt-key">' + keys[i] + "</span>" + esc(opt) + "</button>"
      );
    }).join("");
  }

  function onAnswer(choiceIdx) {
    if (locked) return;
    locked = true;
    var q = quiz[current];
    answers[current] = choiceIdx;

    var btns = el.options.querySelectorAll(".opt");
    btns.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.correctIndex) b.classList.add("correct");
      if (i === choiceIdx && choiceIdx !== q.correctIndex) b.classList.add("wrong");
      if (i === choiceIdx) b.classList.add("selected");
    });

    var correct = choiceIdx === q.correctIndex;
    el.hint.textContent = correct ? "✓ Correct" : "✗ Not quite";
    el.hint.style.color = correct ? "var(--good)" : "var(--bad)";

    el.explain.innerHTML =
      esc(q.explanation) +
      '<a class="src" href="' + esc(q.source) + '" target="_blank" rel="noopener">Microsoft source →</a>';
    el.explain.classList.add("show");
    el.next.classList.remove("hidden");
    el.next.textContent = current + 1 < quiz.length ? "Next →" : "See results →";
  }

  function next() {
    el.hint.style.color = "";
    if (current + 1 < quiz.length) {
      current++;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      showResult();
    }
  }

  function showResult() {
    el.quiz.classList.add("hidden");
    el.result.classList.remove("hidden");

    var correctCount = 0;
    var perCat = {}; // cat -> {correct, total}
    quiz.forEach(function (q, i) {
      var ok = answers[i] === q.correctIndex;
      if (ok) correctCount++;
      var c = perCat[q.category] = perCat[q.category] || { correct: 0, total: 0 };
      c.total++; if (ok) c.correct++;
    });

    var pct = Math.round((correctCount / quiz.length) * 100);
    var pass = pct >= PASS;

    var catRows = Object.keys(perCat).map(function (cat) {
      var c = perCat[cat];
      var cp = Math.round((c.correct / c.total) * 100);
      var color = cp >= 60 ? "var(--good)" : "var(--bad)";
      return (
        '<div class="cat-row"><span class="cat-name">' + esc(catName(cat)) + "</span>" +
        '<span class="cat-score" style="color:' + color + '">' + c.correct + "/" + c.total + " · " + cp + "%</span></div>"
      );
    }).join("");

    el.resultInner.className = "result " + (pass ? "pass" : "fail");
    el.resultInner.innerHTML =
      '<div class="score-ring" style="--pct:' + pct + '%"><span>' + pct + "%</span></div>" +
      '<div class="verdict">' + (pass ? "Passed — competency demonstrated" : "Not yet — keep going") + "</div>" +
      '<p style="color:var(--text-dim)">You answered ' + correctCount + " of " + quiz.length +
      " correctly. The certification gate is " + PASS + "%" +
      (pass ? "." : ", and each category should reach at least 60%.") + "</p>" +
      '<div class="cat-breakdown"><h3 style="font-size:1rem;margin:0 0 8px">Category breakdown</h3>' + catRows + "</div>" +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px">' +
      '<button class="btn btn-primary" id="retry-kc">Take a new randomized set →</button>' +
      '<a class="btn btn-ghost" href="lab.html">Review the lab guide</a></div>';

    el.progress.style.width = "100%";
    document.getElementById("retry-kc").addEventListener("click", startQuiz);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startQuiz() {
    quiz = buildQuiz();
    answers = [];
    current = 0;
    el.intro.classList.add("hidden");
    el.result.classList.add("hidden");
    el.quiz.classList.remove("hidden");
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- events ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    el.options.addEventListener("click", function (e) {
      var b = e.target.closest(".opt");
      if (!b || b.disabled) return;
      onAnswer(parseInt(b.getAttribute("data-opt"), 10));
    });
    el.next.addEventListener("click", next);
    el.start.addEventListener("click", startQuiz);

    fetch("data/questions.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        meta = data.meta;
        categories = data.categories;
        bank = data.questions;
      })
      .catch(function () {
        el.start.textContent = "Could not load questions — serve over HTTP";
        el.start.disabled = true;
      });
  });
})();
