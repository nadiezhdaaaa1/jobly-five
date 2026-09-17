// Computes the content hash of each published legal document (drift detection).
// Hash input = title + lastUpdated + intro + every body block, joined by "\n".
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";

const SRC = "src/lib/legal-data.ts";

const js = ts.transpileModule(readFileSync(SRC, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
export const { LEGAL_DOCS } = await import("data:text/javascript," + encodeURIComponent(js));

export function hashDoc(doc) {
  const parts = [doc.title, doc.lastUpdated, doc.intro];
  for (const block of doc.body) {
    if (block.type === "table") {
      parts.push("table", block.headers.join("|"), ...block.rows.map((r) => r.join("|")));
    } else if (block.type === "ul") {
      // Bullets carry text in `items`, not `text`: hashing block.text here made
      // every list invisible to drift detection.
      parts.push("ul", block.items.join("|"));
    } else if (block.type === "address") {
      parts.push("address", block.lines.join("|"));
    } else {
      parts.push(block.type, block.text);
    }
  }
  return createHash("sha256").update(parts.join("\n"), "utf8").digest("hex");
}

if (process.argv[1]?.endsWith("policy-hash.mjs")) {
  for (const key of ["terms", "privacy", "cookies", "billing", "cancellation", "email", "disclaimer", "dmca"]) {
    console.log(key, LEGAL_DOCS[key].lastUpdated, hashDoc(LEGAL_DOCS[key]));
  }
}
