import fs from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/validate-catalog-request.mjs <request.json>");

const request = JSON.parse(fs.readFileSync(file, "utf8"));
const failures = [];

for (const field of ["owner", "costCenter", "region", "image", "exposure", "dataClass", "minReplicas", "maxReplicas", "rtoMinutes", "rpoMinutes"]) {
  if (request[field] === undefined || request[field] === "") failures.push(`missing ${field}`);
}
if (typeof request.image === "string" && !request.image.includes("@sha256:")) failures.push("image must be pinned by digest");
if (Number(request.maxReplicas) <= 0 || Number(request.maxReplicas) > 100) failures.push("maxReplicas must be between 1 and 100");
if (Number(request.minReplicas) < 0 || Number(request.minReplicas) > Number(request.maxReplicas)) failures.push("replica bounds are invalid");
if (["restricted", "confidential"].includes(request.dataClass) && request.exposure === "public" && !request.publicExposureApproval) {
  failures.push("restricted data requires private exposure or explicit approval");
}
if (request.embeddedCredential === true) failures.push("embedded credentials are prohibited");

if (failures.length) {
  console.error(`REJECTED: ${failures.join("; ")}`);
  process.exitCode = 1;
} else {
  console.log("ADMITTED: request satisfies baseline catalog controls");
}