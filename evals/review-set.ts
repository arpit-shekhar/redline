import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fold, locate } from "../lib/analysis/check-flags.ts";
import {
  DOCUMENT_TYPES,
  isSeverity,
  type DocumentType,
  type Severity,
  type SourceLocation,
} from "../lib/analysis/types.ts";

// Reads a review set: a folder of test documents, each a `.txt` file with an
// answer key beside it (a `.flags.json` file, called the sidecar). The
// written test documents in tests/fixtures/ are one such folder. The real
// review set (ticket 11) is another, kept outside this public repo.
//
// Only `.txt` files and `.flags.json` files are read. Anything else in the
// folder (a PDF, a Word file, a README) is left alone.
//
// The format is described for people in HELP in evals/run.ts. Keep the two
// in step.

// A clause planted in a document on purpose, which the analysis should flag.
export type PlantedClause = {
  clauseType: string;
  // The sentence exactly as the answer key records it.
  sourceSentence: string;
  expectedSeverity: Severity;
  // Where the sentence sits in the document text, worked out when the set is
  // read. A flag catches this clause when its source sentence overlaps here.
  location: SourceLocation;
};

export type QuestionExpectation = "answered" | "not-addressed" | "legality";

export type ReviewQuestion = { question: string; expect: QuestionExpectation };

export type ReviewDocument = {
  // The sidecar's file name without ".flags.json".
  name: string;
  text: string;
  documentType: DocumentType;
  // Empty for a fair document: one with nothing in it that should be flagged
  // at must-change.
  planted: PlantedClause[];
  questions: ReviewQuestion[];
};

// The review set cannot be used as it is. The message says which file and
// what is wrong, and never quotes document text.
export class ReviewSetError extends Error {
  name = "ReviewSetError";
}

const SIDECAR = ".flags.json";
const EXPECTATIONS: readonly QuestionExpectation[] = ["answered", "not-addressed", "legality"];

export function loadReviewSet(folder: string): ReviewDocument[] {
  if (!existsSync(folder) || !statSync(folder).isDirectory()) {
    throw new ReviewSetError(`There is no folder at ${folder}.`);
  }
  const files = readdirSync(folder);
  const texts = new Set(files.filter((file) => file.endsWith(".txt")));
  const sidecars = files.filter((file) => file.endsWith(SIDECAR)).sort();
  if (sidecars.length === 0) {
    throw new ReviewSetError(`${folder} has no ${SIDECAR} files, so there is nothing to measure.`);
  }

  const used = new Set<string>();
  const documents = sidecars.map((sidecar) => {
    const { document, textFile } = readDocument(folder, sidecar, texts);
    used.add(textFile);
    return document;
  });

  // A text file with no answer key would be left out without anyone
  // noticing, and the numbers would then cover less than the set.
  const orphans = [...texts].filter((file) => !used.has(file));
  if (orphans.length > 0) {
    throw new ReviewSetError(
      `These text files have no ${SIDECAR} answer key: ${orphans.join(", ")}.`,
    );
  }
  return documents;
}

function readSidecar(folder: string, sidecar: string): Record<string, unknown> {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(folder, sidecar), "utf8"));
  } catch {
    throw new ReviewSetError(`${sidecar} is not valid JSON.`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ReviewSetError(`${sidecar} is not a JSON object.`);
  }
  return raw as Record<string, unknown>;
}

function readDocument(
  folder: string,
  sidecar: string,
  texts: Set<string>,
): { document: ReviewDocument; textFile: string } {
  const raw = readSidecar(folder, sidecar);
  const name = sidecar.slice(0, -SIDECAR.length);
  const file = raw.document;
  if (typeof file !== "string" || !texts.has(file)) {
    throw new ReviewSetError(
      `${sidecar}: "document" must name a .txt file in the same folder.`,
    );
  }
  const text = readFileSync(join(folder, file), "utf8");
  const documentType = readDocumentType(sidecar, raw.documentType);

  if (!Array.isArray(raw.planted)) {
    throw new ReviewSetError(`${sidecar}: "planted" must be a list. Use [] for a fair document.`);
  }
  const folded = fold(text);
  const planted = raw.planted.map((entry, index) =>
    readPlanted(sidecar, index, entry, folded),
  );

  const questions = raw.questions === undefined ? [] : raw.questions;
  if (!Array.isArray(questions)) {
    throw new ReviewSetError(`${sidecar}: "questions" must be a list when it is given.`);
  }
  return {
    textFile: file,
    document: {
      name,
      text,
      documentType,
      planted,
      questions: questions.map((entry, index) => readQuestion(sidecar, index, entry)),
    },
  };
}

// A sidecar may name its type by value ("freelance-agreement") or by label
// ("freelance agreement"), the same as tests/support/fixtures.ts allows.
function readDocumentType(sidecar: string, raw: unknown): DocumentType {
  const wanted = String(raw).trim().toLowerCase();
  const match = DOCUMENT_TYPES.find(
    (type) => type.value === wanted || type.label.toLowerCase() === wanted,
  );
  if (!match) {
    const known = DOCUMENT_TYPES.map((type) => type.value).join(", ");
    throw new ReviewSetError(`${sidecar}: "documentType" must be one of ${known}.`);
  }
  return match.value;
}

function readPlanted(
  sidecar: string,
  index: number,
  entry: unknown,
  folded: ReturnType<typeof fold>,
): PlantedClause {
  const where = `${sidecar}: planted clause ${index + 1}`;
  const clause = (entry ?? {}) as Record<string, unknown>;
  const { clauseType, sourceSentence, expectedSeverity } = clause;
  if (typeof clauseType !== "string" || clauseType.trim() === "") {
    throw new ReviewSetError(`${where} has no "clauseType".`);
  }
  if (typeof sourceSentence !== "string" || sourceSentence.trim() === "") {
    throw new ReviewSetError(`${where} has no "sourceSentence".`);
  }
  if (!isSeverity(expectedSeverity)) {
    throw new ReviewSetError(
      `${where}: "expectedSeverity" must be "must-change" or "worth-raising".`,
    );
  }
  // The same word-for-word check flags go through, so curly quotes and line
  // breaks in the text do not stop a planted sentence being found.
  const location = locate(folded, sourceSentence);
  if (!location) {
    throw new ReviewSetError(
      `${where}: its "sourceSentence" is not in the document word for word.`,
    );
  }
  return { clauseType, sourceSentence, expectedSeverity, location };
}

function readQuestion(sidecar: string, index: number, entry: unknown): ReviewQuestion {
  const where = `${sidecar}: question ${index + 1}`;
  const item = (entry ?? {}) as Record<string, unknown>;
  if (typeof item.question !== "string" || item.question.trim() === "") {
    throw new ReviewSetError(`${where} has no "question".`);
  }
  if (!EXPECTATIONS.includes(item.expect as QuestionExpectation)) {
    throw new ReviewSetError(`${where}: "expect" must be one of ${EXPECTATIONS.join(", ")}.`);
  }
  return { question: item.question, expect: item.expect as QuestionExpectation };
}
