/**
 * Drift detection: compares the hash of each published legal page's text against
 * the content_hash recorded for its current version in policy_versions.
 *
 * Exit code 1 means someone edited a legal page without publishing a version.
 * Usage: node scripts/policy-drift-check.mjs
 * Requires PG* env vars (available in the Lovable sandbox).
 */
import { execFileSync } from "node:child_process";
import { hashDoc, LEGAL_DOCS } from "./policy-hash.mjs";

// document_key in policy_versions -> key in LEGAL_DOCS
const MAP = { terms: "terms", privacy: "privacy", cookies: "cookies", billing_terms: "billing" };

const rows = JSON.parse(
  execFileSync("psql", [
    "-tAc",
    "SELECT json_agg(row_to_json(x)) FROM (SELECT c.document_key, c.version, v.content_hash FROM current_policy_version c JOIN policy_versions v ON v.document_key = c.document_key AND v.version = c.version) x",
  ]).toString().trim() || "[]",
);

let drift = 0;
for (const row of rows) {
  const docKey = MAP[row.document_key];
  if (!docKey) continue;
  const doc = LEGAL_DOCS[docKey];
  const actual = hashDoc(doc);
  const versionMatches = doc.lastUpdated === row.version;
  const hashMatches = actual === row.content_hash;
  if (versionMatches && hashMatches) {
    console.log(`ok    ${row.document_key} @ ${row.version}`);
    continue;
  }
  drift += 1;
  console.log(`DRIFT ${row.document_key}: page says ${doc.lastUpdated}, registry says ${row.version}`);
  if (!hashMatches) console.log(`      recorded hash ${row.content_hash}\n      actual hash   ${actual}`);
}

if (drift > 0) {
  console.log(`\n${drift} document(s) drifted. Publish a version (see src/routes/LEGAL-README.md) instead of editing the page alone.`);
  process.exit(1);
}
console.log("\nNo drift.");
