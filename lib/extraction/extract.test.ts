import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as legacyPdf from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractText, MIN_TEXT_PER_PAGE, type FileInput } from "./extract.ts";
import { checkFlags } from "../analysis/check-flags.ts";
import { analyse, DocumentTooLongError } from "../analysis/analyse.ts";
import { isTooLong, MAX_DOCUMENT_CHARACTERS, tooLongMessage } from "../analysis/limits.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "../analysis/red-lines.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { buildUploadFiles } from "../../tests/support/document-files.ts";
import { stubModel } from "../../tests/support/stub-model.ts";

// Text extraction is tested at its edges: a file goes in, text comes out.
// The files are the test contract written out as a PDF and as a Word file
// (see tests/fixtures/make-upload-files.ts). The PDF is read with the build
// of pdfjs-dist made for Node; the browser loads the same library through
// its bundler entry point, and both run the same code in extract.ts.

const contract = loadFixture("adhesion-contract");
const FIXTURES = new URL("../../tests/fixtures/", import.meta.url);

const PDF = "application/pdf";
const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function fixtureFile(name: string, type: string): FileInput {
  const bytes = readFileSync(new URL(name, FIXTURES));
  return fileFrom(name, type, bytes);
}

function fileFrom(name: string, type: string, bytes: Uint8Array): FileInput {
  return {
    name,
    type,
    arrayBuffer: async () => bytes.slice().buffer as ArrayBuffer,
  };
}

async function readText(file: FileInput): Promise<string> {
  const result = await extractText(file, legacyPdf);
  assert.equal(result.status, "read", `${file.name} was not read`);
  return result.status === "read" ? result.text : "";
}

// The text with every run of spaces and line breaks made one space. Line
// breaks fall in different places in a PDF than in the original text, and
// the source sentence check treats them all as one space too.
const words = (text: string) => text.replace(/\s+/g, " ").trim();

// The planted clauses, sent to the source sentence check the way the model
// would send them.
const plantedFlags = contract.sidecar.planted.map((clause) => ({
  ...clause,
  severity: clause.expectedSeverity,
}));
const clauseTypes = [...new Set(contract.sidecar.planted.map((c) => c.clauseType))];

test("the PDF and Word files kept in tests/fixtures match a fresh build", () => {
  for (const [name, bytes] of Object.entries(buildUploadFiles(contract.text))) {
    const kept = new Uint8Array(readFileSync(new URL(name, FIXTURES)));
    assert.deepEqual(kept, bytes, `${name} is out of date: run node tests/fixtures/make-upload-files.ts`);
  }
});

for (const [name, type] of [
  ["adhesion-contract.pdf", PDF],
  ["adhesion-contract.docx", WORD],
] as const) {
  test(`${name}: every planted source sentence is found in the extracted text`, async () => {
    const text = await readText(fixtureFile(name, type));
    const { flags, heldBack } = checkFlags(text, plantedFlags, clauseTypes);
    assert.deepEqual(heldBack, []);
    assert.equal(flags.length, contract.sidecar.planted.length);
    for (const flag of flags) {
      assert.equal(text.slice(flag.sourceLocation.start, flag.sourceLocation.end), flag.sourceSentence);
    }
  });

  test(`${name}: the extracted text has the same words, quotes and spelling as the original`, async () => {
    const text = await readText(fixtureFile(name, type));
    assert.equal(words(text), words(contract.text));
  });

  test(`${name}: a quote with its spelling mistake fixed is still not found`, async () => {
    const text = await readText(fixtureFile(name, type));
    const planted = contract.sidecar.planted.find((clause) => clause.typoNote)!;
    const fixed = { ...planted, severity: planted.expectedSeverity, sourceSentence: planted.typoNote!.corrected };
    const { flags, heldBack } = checkFlags(text, [fixed], clauseTypes);
    assert.equal(flags.length, 0);
    assert.deepEqual(heldBack, [{ reason: "source sentence not found", clauseType: planted.clauseType }]);
  });
}

test("a Word line break inside a paragraph is kept as a line break", async () => {
  const text = await readText(fixtureFile("adhesion-contract.docx", WORD));
  assert.ok(text.includes("class arbitration or other\nrepresentative proceeding"));
});

test("a PDF with no text, only pictures of pages, is refused as a scan", async () => {
  const result = await extractText(fixtureFile("scanned-page.pdf", PDF), legacyPdf);
  assert.deepEqual(result, { status: "scan" });
});

test("an empty Word file is refused as a scan", async () => {
  const result = await extractText(fixtureFile("empty.docx", WORD), legacyPdf);
  assert.deepEqual(result, { status: "scan" });
});

test("a PDF with only a few words a page is refused as a scan", async () => {
  // Two pages that each carry only a short stamp, like a scan with a page
  // number added by the scanner.
  const stamp = "Page 1 of 2";
  assert.ok(stamp.length < MIN_TEXT_PER_PAGE);
  const { buildPdf } = await import("../../tests/support/document-files.ts");
  const bytes = buildPdf([{ lines: [stamp] }, { lines: ["Page 2 of 2"] }]);
  const result = await extractText(fileFrom("stamped.pdf", PDF, bytes), legacyPdf);
  assert.deepEqual(result, { status: "scan" });
});

test("a file that is not a PDF or a Word file is not read", async () => {
  const file = fileFrom("contract.txt", "text/plain", new TextEncoder().encode(contract.text));
  assert.deepEqual(await extractText(file, legacyPdf), { status: "not-supported" });
});

test("a damaged PDF is reported as unreadable", async () => {
  const file = fileFrom("broken.pdf", PDF, new TextEncoder().encode("not really a PDF"));
  assert.deepEqual(await extractText(file, legacyPdf), { status: "unreadable" });
});

test("the length limit lets the test contract through and stops one character over", () => {
  assert.ok(!isTooLong(contract.text));
  assert.ok(!isTooLong("a".repeat(MAX_DOCUMENT_CHARACTERS)));
  const over = "a".repeat(MAX_DOCUMENT_CHARACTERS + 1);
  assert.ok(isTooLong(over));
  assert.match(tooLongMessage(over), /100,001 characters/);
  assert.match(tooLongMessage(over), /100,000/);
});

test("Analyse refuses a document over the length limit before calling the model", async () => {
  const model = stubModel(contract.sidecar);
  const text = (contract.text + "\n\n").repeat(Math.ceil(MAX_DOCUMENT_CHARACTERS / contract.text.length) + 1);
  await assert.rejects(
    analyse(
      { text, documentType: "contract", redLines: DEFAULT_RED_LINES, leverage: DEFAULT_LEVERAGE },
      model,
      () => {},
    ),
    DocumentTooLongError,
  );
  assert.equal(model.requests.length, 0);
});
