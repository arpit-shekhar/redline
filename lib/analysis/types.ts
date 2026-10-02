export const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "lease", label: "Lease" },
  { value: "freelance-agreement", label: "Freelance agreement" },
  { value: "terms-of-service", label: "Terms of service" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export function isDocumentType(value: unknown): value is DocumentType {
  return DOCUMENT_TYPES.some((type) => type.value === value);
}

// Exactly two levels, ranked by how hard a clause is to get out of (ADR 0003).
export type Severity = "must-change" | "worth-raising";

export type RedLine = {
  clauseType: string;
  severity: Severity;
  enabled: boolean;
};

// Whether the user can walk away from the deal (ADR 0005).
export type Leverage = "can-walk-away" | "cannot-walk-away";

export type AnalyseInput = {
  text: string;
  documentType: DocumentType;
  redLines: RedLine[];
  leverage: Leverage;
};

export const SEVERITIES: readonly Severity[] = ["must-change", "worth-raising"];

export function isSeverity(value: unknown): value is Severity {
  return SEVERITIES.includes(value as Severity);
}

// Where a source sentence sits in the document text that Analyse was given:
// `start` is the index of its first character and `end` the index just after
// its last, so `text.slice(start, end)` is the sentence.
export type SourceLocation = { start: number; end: number };

// One clause that could hurt the reader. The counter-offer is added later
// (ticket 07).
export type Flag = {
  clauseType: string;
  severity: Severity;
  // Copied from the document itself, not from the model's quote, so it is
  // always exactly what the document says.
  sourceSentence: string;
  sourceLocation: SourceLocation;
  // What the clause says. Stated plainly.
  textClaim: string;
  // What it might do to the reader. Always carries a word such as "may",
  // "might" or "could".
  outcomeClaim: string;
  // Why it has this severity, judged by how hard the clause is to get out of.
  escapabilityReasoning: string;
};

export type Analysis = {
  summary: string;
  // Must-change first, then worth-raising, each in document order.
  flags: Flag[];
  // How many flags the model sent that failed the checks and were held back.
  dropped: number;
};
