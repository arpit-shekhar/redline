import {
  isDocumentType,
  type AnalysisResult,
  type DocumentType,
} from "../analysis/types.ts";

// Storage (spec, "Seams", seam 3). One interface, more than one way to keep
// the data. Code above this file talks only to these types and never learns
// which kind of storage is behind them.
//
// Every method takes the user id of the person asking. A store returns, and
// deletes, only that person's documents.

// A document to put in the library, together with what Analyse returned for
// it. The text is the exact text that was analysed, so each flag's source
// location still points at its sentence when the document is opened again.
export type NewDocument = {
  documentType: DocumentType;
  text: string;
  analysis: AnalysisResult;
  // When the analysis ran. The reader uses this to tell whether an analysis
  // came before or after a change to their red lines (story 39).
  analysedAt: Date;
};

export type SavedDocument = NewDocument & { id: string };

// One row of the library list. It carries no document text beyond the
// opening line, so listing stays light.
export type LibraryEntry = {
  id: string;
  documentType: DocumentType;
  // The document's first line, cut short, so two documents of the same type
  // can be told apart.
  opening: string;
  analysedAt: Date;
  outcome: AnalysisResult["outcome"];
  mustChange: number;
  worthRaising: number;
};

export type DocumentStore = {
  // Keeps the document and returns the id it was given.
  save(userId: string, document: NewDocument): Promise<string>;
  // This user's documents, newest analysis first.
  list(userId: string): Promise<LibraryEntry[]>;
  // One of this user's documents, or null if there is none with this id.
  get(userId: string, id: string): Promise<SavedDocument | null>;
  // Removes the document's text and analysis. Returns false if this user has
  // no document with this id, in which case nothing is removed.
  delete(userId: string, id: string): Promise<boolean>;
};

// Everything one kind of storage keeps. Red lines and leverage join the
// documents here when they are built (ticket 06).
export type Storage = {
  documents: DocumentStore;
};

// The store could not do what it was asked, for example because the database
// could not be reached. The message never contains document text.
export class StorageError extends Error {
  name = "StorageError";
}

const OPENING_LENGTH = 120;

// The first line of the document with any text in it, cut at a space if it
// is long.
export function openingOf(text: string): string {
  const line = text.split("\n").map((l) => l.trim()).find((l) => l !== "") ?? "";
  if (line.length <= OPENING_LENGTH) return line;
  const cut = line.slice(0, OPENING_LENGTH);
  const space = cut.lastIndexOf(" ");
  return `${space > 40 ? cut.slice(0, space) : cut}…`;
}

// How many tabs of each colour the document's sheet carries.
export function tabCounts(analysis: AnalysisResult): {
  mustChange: number;
  worthRaising: number;
} {
  if (analysis.outcome !== "flagged") return { mustChange: 0, worthRaising: 0 };
  const mustChange = analysis.flags.filter((f) => f.severity === "must-change").length;
  return { mustChange, worthRaising: analysis.flags.length - mustChange };
}

// The library row for a saved document.
export function entryFor(document: SavedDocument): LibraryEntry {
  return {
    id: document.id,
    documentType: document.documentType,
    opening: openingOf(document.text),
    analysedAt: document.analysedAt,
    outcome: document.analysis.outcome,
    ...tabCounts(document.analysis),
  };
}

const OUTCOMES: readonly string[] = ["flagged", "clean", "withheld"];

// A light check on an analysis read back from storage: the right outcome and
// a summary. Anything else means the stored row is not one Redline wrote.
export function readAnalysis(value: unknown): AnalysisResult {
  const candidate = value as Partial<AnalysisResult> | null;
  if (
    !candidate ||
    typeof candidate !== "object" ||
    !OUTCOMES.includes(String(candidate.outcome)) ||
    typeof candidate.summary !== "string"
  ) {
    throw new StorageError("A stored analysis is not in the shape Redline saves.");
  }
  return candidate as AnalysisResult;
}

export function readDocumentType(value: unknown): DocumentType {
  if (!isDocumentType(value)) {
    throw new StorageError("A stored document has an unknown document type.");
  }
  return value;
}
