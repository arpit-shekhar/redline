// Writes the PDF and Word test files in this folder from the plain-text test
// documents. Run it again after changing adhesion-contract.txt:
//
//   node tests/fixtures/make-upload-files.ts
//
// A test (lib/extraction/extract.test.ts) builds the same files in memory and
// fails if the ones kept here no longer match.

import { readFileSync, writeFileSync } from "node:fs";
import { buildUploadFiles } from "../support/document-files.ts";

const here = new URL("./", import.meta.url);
const contract = readFileSync(new URL("adhesion-contract.txt", here), "utf8");

for (const [name, bytes] of Object.entries(buildUploadFiles(contract))) {
  writeFileSync(new URL(name, here), bytes);
  console.log(`Wrote tests/fixtures/${name} (${bytes.length} bytes)`);
}
