import {
  isSeverity,
  type Flag,
  type Severity,
  type SourceLocation,
} from "./types.ts";

// The check every flag passes before anyone sees it (ADR 0001, ADR 0004).
// A flag is held back when its source sentence is not in the document word
// for word, or when it breaks the rule that its outcome claim is marked
// uncertain and its text claim is not. Held-back flags are counted, never
// shown.

// ---------------------------------------------------------------------------
// Finding a source sentence in the document

// Curly single quotes and apostrophes, and curly double quotes. Each counts
// as the matching straight quote. Nothing else is treated as equal: not
// letter case, not spelling, not any other punctuation.
const SINGLE_QUOTES = new Set(["‘", "’", "‚", "‛"]);
const DOUBLE_QUOTES = new Set(["“", "”", "„", "‟"]);
const SPACE = /\s/;

// A copy of some text in which every run of spaces, tabs and line breaks is
// one space and every curly quote is straight. `origin[i]` is where the
// character at position i of the copy came from in the original, so a match
// in the copy can be mapped back to the original text.
export type Folded = { text: string; origin: number[] };

export function fold(source: string): Folded {
  const chars: string[] = [];
  const origin: number[] = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (SPACE.test(char)) {
      origin.push(i);
      chars.push(" ");
      while (i < source.length && SPACE.test(source[i])) i++;
      continue;
    }
    chars.push(
      SINGLE_QUOTES.has(char) ? "'" : DOUBLE_QUOTES.has(char) ? '"' : char,
    );
    origin.push(i);
    i++;
  }
  return { text: chars.join(""), origin };
}

// Where `quote` sits in the document, or null if it is not there word for
// word. The location is worked out here from the document, never taken from
// the model. This is the one word-for-word check in Redline: flags use it for
// their source sentence and Answer uses it for its quoted passage (answer.ts).
export function locate(document: Folded, quote: string): SourceLocation | null {
  const wanted = fold(quote).text.trim();
  if (wanted === "") return null;
  const at = document.text.indexOf(wanted);
  if (at === -1) return null;
  // The quote was trimmed, so its first and last characters are not spaces
  // and map back to exact positions.
  return {
    start: document.origin[at],
    end: document.origin[at + wanted.length - 1] + 1,
  };
}

// ---------------------------------------------------------------------------
// Marking what is certain and what is not

// Words that mark a statement as uncertain. Every outcome claim needs at
// least one.
export const UNCERTAINTY_WORDS = [
  "may",
  "might",
  "could",
  "possibly",
  "perhaps",
  "probably",
  "likely",
  "unlikely",
  "maybe",
] as const;

// The uncertainty words a text claim may not use. "May" and "could" are
// allowed in a text claim because documents use them to give permission
// ("we may suspend the Services"), and a plain text claim repeats that.
export const DOUBT_WORDS = [
  "might",
  "possibly",
  "perhaps",
  "probably",
  "likely",
  "unlikely",
  "maybe",
] as const;

const wordPattern = (words: readonly string[]) =>
  new RegExp(`\\b(?:${words.join("|")})\\b`, "i");

const UNCERTAIN = wordPattern(UNCERTAINTY_WORDS);
const DOUBTFUL = wordPattern(DOUBT_WORDS);

export function isMarkedUncertain(claim: string): boolean {
  return UNCERTAIN.test(claim);
}

export function isHedged(claim: string): boolean {
  return DOUBTFUL.test(claim);
}

// ---------------------------------------------------------------------------
// The check itself

export type HeldBack = {
  reason:
    | "unreadable"
    | "clause type not asked for"
    | "text claim hedged"
    | "outcome claim not marked uncertain"
    | "source sentence not found";
  // Only set when it is one of the clause types asked for, so a log line
  // never repeats text the model made up.
  clauseType?: string;
};

export type CheckedFlags = { flags: Flag[]; heldBack: HeldBack[] };

const FIELDS = [
  "clauseType",
  "severity",
  "sourceSentence",
  "textClaim",
  "outcomeClaim",
  "escapabilityReasoning",
] as const;

// Checks each flag the model sent against the document text, keeps the ones
// that pass, and returns them in rank order.
export function checkFlags(
  documentText: string,
  candidates: readonly unknown[],
  clauseTypes: readonly string[],
): CheckedFlags {
  const document = fold(documentText);
  const asked = new Set(clauseTypes);
  const flags: Flag[] = [];
  const heldBack: HeldBack[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const fields = readFields(candidate);
    if (!fields || !isSeverity(fields.severity)) {
      heldBack.push({ reason: "unreadable" });
      continue;
    }
    if (!asked.has(fields.clauseType)) {
      heldBack.push({ reason: "clause type not asked for" });
      continue;
    }
    const { clauseType } = fields;
    if (isHedged(fields.textClaim)) {
      heldBack.push({ reason: "text claim hedged", clauseType });
      continue;
    }
    if (!isMarkedUncertain(fields.outcomeClaim)) {
      heldBack.push({ reason: "outcome claim not marked uncertain", clauseType });
      continue;
    }
    const location = locate(document, fields.sourceSentence);
    if (!location) {
      heldBack.push({ reason: "source sentence not found", clauseType });
      continue;
    }

    // The same clause type on the same sentence twice is one flag sent
    // twice. Nothing is withheld by showing it once.
    const key = `${clauseType}|${location.start}|${location.end}`;
    if (seen.has(key)) continue;
    seen.add(key);

    flags.push({
      clauseType,
      severity: fields.severity,
      sourceSentence: documentText.slice(location.start, location.end),
      sourceLocation: location,
      textClaim: fields.textClaim,
      outcomeClaim: fields.outcomeClaim,
      escapabilityReasoning: fields.escapabilityReasoning,
    });
  }

  return { flags: rankFlags(flags), heldBack };
}

// The six text fields, trimmed, or null if any is missing or blank.
function readFields(
  candidate: unknown,
): Record<(typeof FIELDS)[number], string> | null {
  if (typeof candidate !== "object" || candidate === null) return null;
  const record = candidate as Record<string, unknown>;
  const fields = {} as Record<(typeof FIELDS)[number], string>;
  for (const name of FIELDS) {
    const value = record[name];
    if (typeof value !== "string" || value.trim() === "") return null;
    fields[name] = value.trim();
  }
  return fields;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  "must-change": 0,
  "worth-raising": 1,
};

// Must-change before worth-raising, then by where the sentence starts in the
// document. Ties are broken by where it ends and then by clause type, so the
// same flags always come out in the same order whatever order they arrived in.
export function rankFlags(flags: readonly Flag[]): Flag[] {
  return [...flags].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.sourceLocation.start - b.sourceLocation.start ||
      a.sourceLocation.end - b.sourceLocation.end ||
      (a.clauseType < b.clauseType ? -1 : a.clauseType > b.clauseType ? 1 : 0),
  );
}

// One log line about what was held back: how many, why, and the clause type
// where it is known. It never includes document text or the model's quote.
export function describeHeldBack(heldBack: readonly HeldBack[]): string {
  const parts = heldBack.map(({ reason, clauseType }) =>
    clauseType ? `${reason} (${clauseType})` : reason,
  );
  const noun = heldBack.length === 1 ? "flag" : "flags";
  return `Held back ${heldBack.length} ${noun}: ${parts.join("; ")}.`;
}
