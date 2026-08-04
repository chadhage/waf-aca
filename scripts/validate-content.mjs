import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const fail = (message) => { throw new Error(message); };

const modules = readJson("site/data/modules.json").modules;
const questionData = readJson("site/data/questions.json");
const questions = questionData.questions;
const scorecard = readJson("workshop/assessor/scorecard.json");
const sourceReview = readJson("governance/source-review.json");

if (modules.length !== 9) fail("Expected nine modules");
if (modules.reduce((sum, module) => sum + module.domainPoints, 0) !== 100) fail("Module points must total 100");
if (modules.reduce((sum, module) => sum + Number.parseFloat(module.duration), 0) !== 24) fail("Module durations must total 24 hours");
for (const module of modules) {
  const moduleMinutes = Number.parseFloat(module.duration) * 60;
  const activityMinutes = module.activities.reduce((sum, activity) => sum + Number.parseInt(activity.time.replace(/\D/g, ""), 10), 0);
  if (moduleMinutes !== activityMinutes) fail(`${module.code} activities do not match module duration`);
}

if (questions.length < 60) fail("Question bank must contain at least 60 questions");
if (new Set(questions.map((question) => question.id)).size !== questions.length) fail("Question IDs must be unique");
if (questions.filter((question) => question.scenario).length / questions.length < 0.60) fail("At least 60% of the bank must be scenario based");
for (const category of Object.keys(questionData.meta.categoryWeights)) {
  if (!questionData.categories[category]) fail(`Missing display name for category: ${category}`);
  if (!questions.some((question) => question.category === category)) fail(`No questions found for category: ${category}`);
}
if (questions.filter((question) => question.category === "functions-on-container-apps").length < 10) {
  fail("Functions on Container Apps category must contain at least 10 questions");
}
for (const question of questions) {
  if (!question.options[question.correctIndex]) fail(`${question.id} has an invalid correctIndex`);
  if (!question.source.startsWith("https://learn.microsoft.com/") && !question.source.startsWith("https://azure.microsoft.com/")) {
    fail(`${question.id} uses a non-Microsoft source`);
  }
}

const weight = Object.values(questionData.meta.categoryWeights).reduce((sum, value) => sum + value, 0);
if (Math.abs(weight - 1) > 0.0001) fail("Question category weights must total 1");
if (Object.values(scorecard.categories).reduce((sum, value) => sum + value, 0) !== 100) fail("Assessor scorecard must total 100");
if (!sourceReview.claims.length || sourceReview.claims.some((entry) => entry.disposition !== "verified")) fail("Source-review manifest has unverified claims");

const requiredFiles = [
  "workshop/app/Dockerfile",
  "workshop/app/server.js",
  "workshop/infra/main.bicep",
  "workshop/load/smoke.js",
  "workshop/evidence/activity-template.md",
  "workshop/assessor/fault-cards.md",
  "workshop/catalog/valid-request.json",
  "workshop/catalog/unsafe-request.json",
  "workshop/functions/package.json",
  "workshop/functions/package-lock.json",
  "workshop/functions/host.json",
  "workshop/functions/Dockerfile",
  "workshop/functions/local.settings.example.json",
  "workshop/functions/src/functions/health.ts",
  "workshop/functions/src/functions/processOrder.ts",
  "workshop/functions/src/domain/order.ts",
  "workshop/functions/src/tests/order.test.ts",
  "scripts/validate-catalog-request.mjs",
  "scripts/validate-evidence-record.mjs"
];
for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) fail(`Missing required workshop asset: ${relativePath}`);
}

console.log(`Validated ${modules.length} modules, ${questions.length} questions, and ${requiredFiles.length} workshop assets.`);