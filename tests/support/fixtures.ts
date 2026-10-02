import { readFileSync } from "node:fs";
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type Severity,
} from "../../lib/analysis/types.ts";

// Reads a test document from tests/fixtures/ together with its answer key
// (the "sidecar", a JSON file listing every planted clause). See
// tests/fixtures/README.md for what each field means.

export type FixtureName = "adhesion-contract" | "clean-document";

export type PlantedClause = {
  clauseType: string;
  sourceSentence: string;
  expectedSeverity: Severity;
  textClaim: string;
  outcomeClaim: string;
  escapabilityReasoning: string;
  counterOffer: string;
  typoNote?: { asWritten: string; corrected: string };
};

export type FixtureQuestion =
  | {
      question: string;
      expect: "answered";
      expectedPassage: string;
      answer: string;
    }
  | { question: string; expect: "not-addressed" | "legality" };

export type Sidecar = {
  document: string;
  documentType: DocumentType;
  planted: PlantedClause[];
  questions: FixtureQuestion[];
};

export type Fixture = {
  name: FixtureName;
  text: string;
  sidecar: Sidecar;
};

const FIXTURES = new URL("../fixtures/", import.meta.url);

export function loadFixture(name: FixtureName): Fixture {
  const raw = JSON.parse(
    readFileSync(new URL(`${name}.flags.json`, FIXTURES), "utf8"),
  );
  const text = readFileSync(new URL(raw.document, FIXTURES), "utf8");
  return {
    name,
    text,
    sidecar: { ...raw, documentType: toDocumentType(raw.documentType) },
  };
}

// A sidecar may name its type by value ("freelance-agreement") or by label
// ("freelance agreement"). Anything else is a broken fixture.
function toDocumentType(raw: unknown): DocumentType {
  const wanted = String(raw).trim().toLowerCase();
  const match = DOCUMENT_TYPES.find(
    (type) => type.value === wanted || type.label.toLowerCase() === wanted,
  );
  if (!match) {
    throw new Error(`Fixture has an unknown document type: ${String(raw)}`);
  }
  return match.value;
}
