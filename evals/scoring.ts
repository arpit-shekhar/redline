import { asksAboutLegality } from "../lib/analysis/answer.ts";
import type {
  AnalysisOutcome,
  AnswerOutcome,
  BeforeChecks,
  Severity,
  SourceLocation,
} from "../lib/analysis/types.ts";
import type { PlantedClause, QuestionExpectation, ReviewDocument } from "./review-set.ts";

// The arithmetic of the quality evals. Everything here is plain counting over
// what Analyse and Answer returned, so it is tested without the network
// (evals/scoring.test.ts). evals/run.ts makes the model calls and prints.

// What PRD.md section 4 sets for each number. The eval prints these beside
// its numbers and never turns them into pass or fail.
export const TARGETS = {
  recall: "95% or better (PRD check 3)",
  fairMustChange: "0 (PRD check 4)",
  answersShown: "0, ever (PRD check 5)",
  dropRate: "none set in PRD.md",
  mustChangePrecision: "90% or better, judged by a person (PRD check 2)",
  sendability: "none until there is a baseline, judged by a person (PRD check 6)",
} as const;

// ---------------------------------------------------------------------------
// Planned calls

export type PlannedCalls = {
  // Analyse sends two requests per document: one for the summary, one for
  // the flags.
  analysis: number;
  // Answer sends one request per question, except a question that names
  // legality outright, which is refused before the model is called.
  questions: number;
  refusedWithoutCall: number;
  total: number;
};

// Only the questions a refusal is expected for are asked (PRD check 5).
// Questions the document answers are not part of any check here.
export function refusalQuestions(document: ReviewDocument) {
  return document.questions.filter((q) => q.expect !== "answered");
}

export function plannedCalls(documents: readonly ReviewDocument[]): PlannedCalls {
  const asked = documents.flatMap(refusalQuestions);
  const refusedWithoutCall = asked.filter((q) => asksAboutLegality(q.question)).length;
  const analysis = documents.length * 2;
  const questions = asked.length - refusedWithoutCall;
  return { analysis, questions, refusedWithoutCall, total: analysis + questions };
}

// ---------------------------------------------------------------------------
// One document

// True when two stretches of the document share at least one character.
export function overlaps(a: SourceLocation, b: SourceLocation): boolean {
  return a.start < b.end && b.start < a.end;
}

export type PlantedScore = {
  clauseType: string;
  expectedSeverity: Severity;
  // A returned flag's source sentence overlaps the planted sentence, at
  // either severity.
  caught: boolean;
  // The highest severity among the flags that caught it.
  caughtAs: Severity | null;
  // Whether one of those flags also named the planted clause type. Recall
  // does not need this; it is kept so a reader of the results can see it.
  sameClauseType: boolean;
};

export function scorePlanted(
  planted: readonly PlantedClause[],
  outcome: AnalysisOutcome,
): PlantedScore[] {
  const flags = outcome.outcome === "flagged" ? outcome.flags : [];
  return planted.map((clause) => {
    const hits = flags.filter((flag) => overlaps(flag.sourceLocation, clause.location));
    const caughtAs = hits.some((flag) => flag.severity === "must-change")
      ? "must-change"
      : hits.length > 0
        ? "worth-raising"
        : null;
    return {
      clauseType: clause.clauseType,
      expectedSeverity: clause.expectedSeverity,
      caught: hits.length > 0,
      caughtAs,
      sameClauseType: hits.some((flag) => flag.clauseType === clause.clauseType),
    };
  });
}

export function severityCounts(outcome: AnalysisOutcome): {
  mustChange: number;
  worthRaising: number;
} {
  if (outcome.outcome !== "flagged") return { mustChange: 0, worthRaising: 0 };
  const mustChange = outcome.flags.filter((flag) => flag.severity === "must-change").length;
  return { mustChange, worthRaising: outcome.flags.length - mustChange };
}

// How many flags the checks held back in this analysis.
export function heldBackCount(outcome: AnalysisOutcome): number {
  if (outcome.outcome === "flagged") return outcome.dropped;
  if (outcome.outcome === "withheld") return outcome.withheld;
  return 0;
}

// The counts taken before the checks, or null when the analysis failed and
// nothing was counted.
export function beforeChecksOf(outcome: AnalysisOutcome): BeforeChecks | null {
  return outcome.outcome === "failed" ? null : outcome.beforeChecks;
}

export type QuestionScore = {
  question: string;
  expect: QuestionExpectation;
  got: AnswerOutcome["outcome"];
};

export type DocumentScore = {
  name: string;
  // No planted clauses: the document was judged fair.
  fair: boolean;
  outcome: AnalysisOutcome["outcome"];
  // Only for a failed analysis. Never holds document text.
  failReason?: string;
  planted: PlantedScore[];
  mustChange: number;
  worthRaising: number;
  heldBack: number;
  beforeChecks: BeforeChecks | null;
  questions: QuestionScore[];
};

export function scoreDocument(
  document: ReviewDocument,
  outcome: AnalysisOutcome,
  questions: readonly QuestionScore[],
): DocumentScore {
  return {
    name: document.name,
    fair: document.planted.length === 0,
    outcome: outcome.outcome,
    ...(outcome.outcome === "failed" ? { failReason: outcome.reason } : {}),
    planted: scorePlanted(document.planted, outcome),
    ...severityCounts(outcome),
    heldBack: heldBackCount(outcome),
    beforeChecks: beforeChecksOf(outcome),
    questions: [...questions],
  };
}

// ---------------------------------------------------------------------------
// The whole set

// A share, or null when there is nothing to take a share of.
export type Rate = { count: number; of: number; rate: number | null };

export function rate(count: number, of: number): Rate {
  return { count, of, rate: of === 0 ? null : count / of };
}

export type RefusalScore = {
  // Questions the answer key expects a refusal for.
  asked: number;
  // Refused, as "not addressed" or as a legality question.
  declined: Rate;
  // Answered with text shown to the reader. Target zero.
  answersShown: number;
  // The model answered, but its passage failed the word-for-word check, so
  // the reader was told the answer could not be checked.
  unverified: number;
  failed: number;
};

export type Totals = {
  documents: number;
  // Analyses that failed are left out of every number below except the
  // question box, and counted here instead, because a failed call says
  // nothing about the model's judgement.
  failedAnalyses: number;
  recall: Rate & { asMustChange: number; asWorthRaising: number };
  fairDocuments: { documents: number; mustChange: number; worthRaising: number };
  refusals: RefusalScore;
  // Quotes the model gave that are not in the document, out of every flag it
  // sent, before the checks removed anything.
  dropRate: Rate;
};

export function refusalScore(questions: readonly QuestionScore[]): RefusalScore {
  const refusals = questions.filter((q) => q.expect !== "answered");
  const declined = refusals.filter(
    (q) => q.got === "not-addressed" || q.got === "legality",
  ).length;
  return {
    asked: refusals.length,
    declined: rate(declined, refusals.length),
    answersShown: refusals.filter((q) => q.got === "answered").length,
    unverified: refusals.filter((q) => q.got === "unverified").length,
    failed: refusals.filter((q) => q.got === "failed").length,
  };
}

export function totalsOf(scores: readonly DocumentScore[]): Totals {
  const analysed = scores.filter((score) => score.outcome !== "failed");
  const planted = analysed.flatMap((score) => score.planted);
  const caught = planted.filter((clause) => clause.caught);
  const fair = analysed.filter((score) => score.fair);
  const counted = analysed.flatMap((score) => (score.beforeChecks ? [score.beforeChecks] : []));
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

  return {
    documents: scores.length,
    failedAnalyses: scores.length - analysed.length,
    recall: {
      ...rate(caught.length, planted.length),
      asMustChange: caught.filter((clause) => clause.caughtAs === "must-change").length,
      asWorthRaising: caught.filter((clause) => clause.caughtAs === "worth-raising").length,
    },
    fairDocuments: {
      documents: fair.length,
      mustChange: sum(fair.map((score) => score.mustChange)),
      worthRaising: sum(fair.map((score) => score.worthRaising)),
    },
    refusals: refusalScore(scores.flatMap((score) => score.questions)),
    dropRate: rate(
      sum(counted.map((c) => c.quoteNotFound)),
      sum(counted.map((c) => c.sent)),
    ),
  };
}

// ---------------------------------------------------------------------------
// The judgement sheet (PRD checks 2 and 6)

export type JudgementRow = {
  check: string;
  askReviewer: string;
  document: string;
  flag: number;
  clauseType: string;
  severity: Severity;
  sourceSentence: string;
  reasoning: string;
  counterOffer: string;
};

const PRECISION = {
  check: "2 must-change precision",
  askReviewer: "Do you agree this clause is must-change? Write agree or disagree.",
};
const SENDABILITY = {
  check: "6 counter-offer sendability",
  askReviewer:
    "Does this counter-offer deal with this clause, and could it be sent as written? Write yes or no.",
};

// One row per must-change flag (check 2), then one row per counter-offer,
// which is one per flag at either severity (check 6). Flag numbers follow the
// order Analyse returned them in, so both rows for a flag share a number.
export function judgementRows(
  analyses: readonly { name: string; outcome: AnalysisOutcome }[],
): JudgementRow[] {
  const rows = (kind: typeof PRECISION, mustChangeOnly: boolean) =>
    analyses.flatMap(({ name, outcome }) =>
      outcome.outcome !== "flagged"
        ? []
        : outcome.flags.flatMap((flag, index) =>
            mustChangeOnly && flag.severity !== "must-change"
              ? []
              : [
                  {
                    ...kind,
                    document: name,
                    flag: index + 1,
                    clauseType: flag.clauseType,
                    severity: flag.severity,
                    sourceSentence: flag.sourceSentence,
                    reasoning: flag.escapabilityReasoning,
                    counterOffer: flag.counterOffer,
                  },
                ],
          ),
    );
  return [...rows(PRECISION, true), ...rows(SENDABILITY, false)];
}

const COLUMNS = [
  "Check",
  "Question for the reviewer",
  "Document",
  "Flag",
  "Clause type",
  "Severity",
  "Source sentence",
  "Redline's reasoning",
  "Counter-offer",
  "Verdict",
  "Notes",
];

// The sheet as CSV (a plain table any spreadsheet opens), with empty Verdict
// and Notes columns for the reviewer. Every cell is quoted, so commas, quote
// marks and line breaks inside a sentence stay in their cell. It starts with
// a byte-order mark (an invisible marker) so Excel reads the curly quotes in
// contract text correctly.
export function judgementCsv(rows: readonly JudgementRow[]): string {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    COLUMNS.map(cell).join(","),
    ...rows.map((row) =>
      [
        row.check,
        row.askReviewer,
        row.document,
        row.flag,
        row.clauseType,
        row.severity,
        row.sourceSentence,
        row.reasoning,
        row.counterOffer,
        "",
        "",
      ]
        .map(cell)
        .join(","),
    ),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}
