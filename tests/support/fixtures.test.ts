import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./fixtures.ts";
import { DEFAULT_RED_LINES } from "../../lib/analysis/red-lines.ts";
import { isDocumentType } from "../../lib/analysis/types.ts";

// Later tests trust the answer keys, so the keys themselves are checked here.

const contract = loadFixture("adhesion-contract");
const clean = loadFixture("clean-document");

test("both fixtures load with a known document type", () => {
  for (const fixture of [contract, clean]) {
    assert.ok(fixture.text.length > 0);
    assert.ok(isDocumentType(fixture.sidecar.documentType));
  }
  assert.equal(contract.sidecar.documentType, "contract");
  assert.equal(clean.sidecar.documentType, "freelance-agreement");
});

test("every planted source sentence is in the document word for word", () => {
  assert.ok(contract.sidecar.planted.length > 0);
  for (const clause of contract.sidecar.planted) {
    assert.ok(
      contract.text.includes(clause.sourceSentence),
      `not found: ${clause.sourceSentence.slice(0, 60)}`,
    );
  }
});

test("the sentence with a spelling mistake is only in the document as written", () => {
  const withTypo = contract.sidecar.planted.filter((c) => c.typoNote);
  assert.equal(withTypo.length, 1);
  const { asWritten, corrected } = withTypo[0].typoNote!;
  assert.ok(contract.text.includes(asWritten));
  assert.ok(!contract.text.includes(corrected));
});

test("the line break inside a planted sentence survived checkout", () => {
  assert.ok(contract.sidecar.planted.some((c) => c.sourceSentence.includes("\n")));
  assert.ok(!contract.text.includes("\r\n"), "line endings were changed");
});

test("every planted clause type is one of the default red lines", () => {
  const types = new Set(DEFAULT_RED_LINES.map((line) => line.clauseType));
  for (const clause of contract.sidecar.planted) {
    assert.ok(types.has(clause.clauseType), clause.clauseType);
  }
});

test("the clean document has nothing planted", () => {
  assert.equal(clean.sidecar.planted.length, 0);
});
