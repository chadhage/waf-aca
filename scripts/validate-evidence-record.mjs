import fs from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/validate-evidence-record.mjs <waaca-evidence-record.json>");

const bundle = JSON.parse(fs.readFileSync(file, "utf8"));
if (bundle.schemaVersion !== 1 || !bundle.generatedAtUtc || !bundle.records) throw new Error("Invalid evidence bundle schema");

const invalid = Object.entries(bundle.records).filter(([, record]) =>
  !record.attested || !record.artifact?.trim() || !record.observation?.trim() ||
  !record.source?.startsWith("https://learn.microsoft.com/")
);
if (invalid.length) throw new Error(`Incomplete evidence records: ${invalid.map(([id]) => id).join(", ")}`);

console.log(`Evidence bundle is structurally complete with ${Object.keys(bundle.records).length} records.`);
console.log("Structural validation is not certification; verify artifacts and live Azure state against the assessor scorecard.");