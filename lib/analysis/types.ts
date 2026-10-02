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

// What Analyse returns. Exactly one of four outcomes, so a screen has to say
// which one it is showing and can never mistake one for another.
export type AnalysisOutcome =
  | FlaggedResult
  | CleanResult
  | WithheldResult
  | FailedAnalysis;

// An analysis that finished. Failure is the one outcome left out.
export type AnalysisResult = Exclude<AnalysisOutcome, FailedAnalysis>;

// At least one flag passed the checks.
export type FlaggedResult = {
  outcome: "flagged";
  summary: string;
  // Must-change first, then worth-raising, each in document order.
  flags: Flag[];
  // How many flags the model sent that failed the checks and were held back.
  dropped: number;
  // The clause types the analysis looked for. Never empty.
  checkedFor: string[];
};

// Nothing was flagged and nothing was held back (ADR 0004): the document gets
// its checklist, never silence.
export type CleanResult = {
  outcome: "clean";
  summary: string;
  // A plain sentence saying nothing was found.
  statement: string;
  // The clause types the analysis looked for and did not find. Never empty.
  checkedFor: string[];
};

// The model sent flags, but every one failed the checks. This is not a clean
// result: something may be there that Redline could not show.
export type WithheldResult = {
  outcome: "withheld";
  summary: string;
  // How many flags were held back. Always at least one.
  withheld: number;
};

// The model call failed, took too long, or sent a reply that could not be
// read. Nothing from the run is kept, so no part of a result can be shown.
export type FailedAnalysis = {
  outcome: "failed";
  // For the server log only: what went wrong, never any document text.
  reason: string;
};

// What Answer returns for one question about a document. Exactly one of five
// outcomes. Only "answered" carries text from the model; every refusal is a
// fixed statement written by Redline.
export type AnswerOutcome =
  | AnsweredQuestion
  | NotAddressed
  | LegalityRefused
  | UnverifiedAnswer
  | FailedAnswer;

// An answer Answer finished with. Failure is the one outcome left out.
export type AnswerResult = Exclude<AnswerOutcome, FailedAnswer>;

// The document answers the question, and the passage the answer comes from
// was found in it word for word.
export type AnsweredQuestion = {
  outcome: "answered";
  // The model's answer, in plain English.
  answer: string;
  // Copied from the document itself, not from the model's quote, so it is
  // always exactly what the document says.
  passage: string;
  // Worked out by the word-for-word check, never taken from the model.
  passageLocation: SourceLocation;
};

// The document does not address the question. No answer text, so nothing
// from general knowledge can reach the reader.
export type NotAddressed = { outcome: "not-addressed"; statement: string };

// The question asks whether something is legal or enforceable. The document
// alone cannot answer that, and Redline is not legal advice.
export type LegalityRefused = { outcome: "legality"; statement: string };

// The model gave an answer, but its passage was not in the document word for
// word. The answer is withheld and the reader is told so.
export type UnverifiedAnswer = { outcome: "unverified"; statement: string };

// The model call failed, took too long, or sent a reply that could not be
// read. Nothing from it is shown.
export type FailedAnswer = {
  outcome: "failed";
  // For the server log only: what went wrong, never any document text.
  reason: string;
};
