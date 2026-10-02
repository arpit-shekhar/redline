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

// One kind of clause the analysis looks for: one of the eight defaults, or a
// red line the reader wrote in their own words. For their own, the words are
// the clause type, so a flag it produces is named by those words.
export type RedLine = {
  clauseType: string;
  // The severity flags of this type start from. The model may move a flag
  // down from must-change to worth-raising, never up (see analyse.ts).
  severity: Severity;
  enabled: boolean;
  // True when the reader wrote this red line themselves.
  ownWords?: boolean;
};

// Whether the user can walk away from the deal (ADR 0005).
export type Leverage = "can-walk-away" | "cannot-walk-away";

export const LEVERAGES: readonly Leverage[] = ["can-walk-away", "cannot-walk-away"];

export function isLeverage(value: unknown): value is Leverage {
  return LEVERAGES.includes(value as Leverage);
}

// How every counter-offer in one analysis is worded (ADR 0005). "firm"
// states the change as a condition of signing ("I require"). "request" asks
// for it ("would you consider"). Only one version is ever drafted.
export type CounterOfferTone = "firm" | "request";

// The tone a reader's leverage calls for. Someone who can walk away gets
// firm wording. Anyone else gets requests, including a reader who has not
// answered the leverage question (everyone signed out): firm wording can
// cost someone without leverage the deal, and a request costs someone with
// leverage very little.
export function toneFor(leverage: Leverage | null): CounterOfferTone {
  return leverage === "can-walk-away" ? "firm" : "request";
}

export type AnalyseInput = {
  text: string;
  documentType: DocumentType;
  redLines: RedLine[];
  // null until the reader has answered the leverage question. It sets the
  // tone of every counter-offer; see toneFor.
  leverage: Leverage | null;
};

export const SEVERITIES: readonly Severity[] = ["must-change", "worth-raising"];

export function isSeverity(value: unknown): value is Severity {
  return SEVERITIES.includes(value as Severity);
}

// Where a source sentence sits in the document text that Analyse was given:
// `start` is the index of its first character and `end` the index just after
// its last, so `text.slice(start, end)` is the sentence.
export type SourceLocation = { start: number; end: number };

// What the model sent for one analysis, counted before the checks in
// check-flags.ts removed anything. The quality evals read it to measure how
// often the model invents a quote (evals/run.ts). No screen shows it, and it
// holds no document text.
export type BeforeChecks = {
  // Every flag the model sent, whatever shape it was in.
  sent: number;
  // How many of those gave no source sentence, or one that is not in the
  // document word for word. Each flag is tested for this whatever else is
  // wrong with it, so a flag held back for another reason still counts here
  // when its quote is also wrong.
  quoteNotFound: number;
};

// One clause that could hurt the reader.
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
  // Replacement wording for this clause that the reader can send to the
  // other side, in the tone their leverage calls for. Never empty.
  counterOffer: string;
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
  // The tone every counter-offer was drafted in, and the leverage answer it
  // came from (null when the reader had not answered), so the screen can
  // say why.
  counterOfferTone: CounterOfferTone;
  leverage: Leverage | null;
  beforeChecks: BeforeChecks;
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
  // The model may still have sent flags of a type that was not asked for.
  beforeChecks: BeforeChecks;
};

// The model sent flags, but every one failed the checks. This is not a clean
// result: something may be there that Redline could not show.
export type WithheldResult = {
  outcome: "withheld";
  summary: string;
  // How many flags were held back. Always at least one.
  withheld: number;
  beforeChecks: BeforeChecks;
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
