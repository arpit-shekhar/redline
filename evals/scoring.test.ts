import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { analyse } from "../lib/analysis/analyse.ts";
import { answer } from "../lib/analysis/answer.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "../lib/analysis/red-lines.ts";
import { ANSWER_SHAPE, FLAGS_SHAPE_NAME } from "../lib/analysis/reply-shapes.ts";
import type { AnalysisOutcome } from "../lib/analysis/types.ts";
import { loadFixture, type Sidecar } from "../tests/support/fixtures.ts";
import { flagFrom, flagsFrom, stubModel, type StubModel } from "../tests/support/stub-model.ts";
import { loadReviewSet, type ReviewDocument } from "./review-set.ts";
import {
  judgementCsv,
  judgementRows,
  overlaps,
  plannedCalls,
  refusalQuestions,
  scoreDocument,
  totalsOf,
  type QuestionScore,
} from "./scoring.ts";

// The eval's arithmetic, checked against the real Analyse and Answer with
// only the model stubbed, so no network is needed. The review set here is
// tests/fixtures/, read by the same loader the eval uses.

const quiet = () => {};
const set = loadReviewSet(fileURLToPath(new URL("../tests/fixtures/", import.meta.url)));
const contractDoc = byName("adhesion-contract");
const cleanDoc = byName("clean-document");
const contract = loadFixture("adhesion-contract");
const clean = loadFixture("clean-document");

function byName(name: string): ReviewDocument {
  const found = set.find((document) => document.name === name);
  assert.ok(found, `the review set has no ${name}`);
  return found;
}

function analyseWith(document: ReviewDocument, model: StubModel): Promise<AnalysisOutcome> {
  return analyse(
    {
      text: document.text,
      documentType: document.documentType,
      redLines: DEFAULT_RED_LINES,
      leverage: DEFAULT_LEVERAGE,
    },
    model,
    quiet,
  );
}

function flagsStub(sidecar: Sidecar, flags: unknown[]): StubModel {
  return stubModel(sidecar, { builders: { [FLAGS_SHAPE_NAME]: () => ({ flags }) } });
}

// A sentence in the contract that is not one of the planted clauses.
const SUPPORT_HOURS =
  "We provide email and telephone support from 8:00 a.m. to 8:00 p.m. Eastern Time, Monday through Saturday, excluding public holidays.";

// ---------------------------------------------------------------------------
// The review set loader

test("the loader reads only .txt and .flags.json pairs and finds each planted sentence", () => {
  assert.deepEqual(set.map((d) => d.name), ["adhesion-contract", "clean-document"]);
  assert.equal(contractDoc.planted.length, 6);
  assert.equal(cleanDoc.planted.length, 0);
  for (const clause of contractDoc.planted) {
    assert.equal(
      contractDoc.text.slice(clause.location.start, clause.location.end),
      clause.sourceSentence,
    );
  }
});

// ---------------------------------------------------------------------------
// Planted-trap recall

test("two stretches overlap only when they share a character", () => {
  assert.ok(overlaps({ start: 0, end: 10 }, { start: 9, end: 20 }));
  assert.ok(overlaps({ start: 5, end: 6 }, { start: 0, end: 100 }));
  assert.ok(!overlaps({ start: 0, end: 10 }, { start: 10, end: 20 }));
  assert.ok(!overlaps({ start: 30, end: 40 }, { start: 0, end: 10 }));
});

test("every planted clause flagged by a careful model counts as caught, at its own severity", async () => {
  const outcome = await analyseWith(contractDoc, stubModel(contract.sidecar));
  const score = scoreDocument(contractDoc, outcome, []);

  assert.equal(score.planted.filter((p) => p.caught).length, 6);
  for (const p of score.planted) {
    assert.equal(p.caughtAs, p.expectedSeverity);
    assert.ok(p.sameClauseType);
  }
  const totals = totalsOf([score]);
  assert.deepEqual(
    { count: totals.recall.count, of: totals.recall.of, rate: totals.recall.rate },
    { count: 6, of: 6, rate: 1 },
  );
});

test("a flag quoting part of a planted sentence catches it; a flag elsewhere does not", async () => {
  const [arbitration, ...others] = contract.sidecar.planted.filter(
    (p) => p.clauseType === "Forced arbitration and class-action waivers",
  );
  assert.equal(others.length, 0);
  const firstHalf = arbitration.sourceSentence.slice(0, arbitration.sourceSentence.indexOf(" and you waive"));
  const elsewhere = { ...flagFrom(arbitration), sourceSentence: SUPPORT_HOURS };
  const partial = { ...flagFrom(arbitration), sourceSentence: firstHalf };

  const missed = scoreDocument(
    contractDoc,
    await analyseWith(contractDoc, flagsStub(contract.sidecar, [elsewhere])),
    [],
  );
  assert.equal(missed.planted.filter((p) => p.caught).length, 0);

  const caught = scoreDocument(
    contractDoc,
    await analyseWith(contractDoc, flagsStub(contract.sidecar, [partial])),
    [],
  );
  const caughtTypes = caught.planted.filter((p) => p.caught).map((p) => p.clauseType);
  assert.deepEqual(caughtTypes, ["Forced arbitration and class-action waivers"]);
  assert.equal(totalsOf([caught]).recall.rate, 1 / 6);
});

test("a flag the check drops does not catch its planted clause", async () => {
  // The typo in the late fee sentence, silently fixed, so the quote is no
  // longer word for word.
  const flags = flagsFrom(contract.sidecar).map((flag, index) => {
    const typo = contract.sidecar.planted[index].typoNote;
    return typo ? { ...flag, sourceSentence: typo.corrected } : flag;
  });
  const outcome = await analyseWith(contractDoc, flagsStub(contract.sidecar, flags));
  const score = scoreDocument(contractDoc, outcome, []);

  const missed = score.planted.filter((p) => !p.caught).map((p) => p.clauseType);
  assert.deepEqual(missed, ["Late fees and penalties"]);
  assert.equal(score.heldBack, 1);
});

// ---------------------------------------------------------------------------
// Must-change flags on fair documents

test("a fair document counts its must-change flags and not its worth-raising ones", async () => {
  const notice =
    "Either party may end this agreement at any time by giving the other party 14 days’ written notice by email.";
  const base = {
    sourceSentence: notice,
    textClaim: "Either side can end the agreement with 14 days' notice by email.",
    outcomeClaim: "The work could stop sooner than you planned.",
    escapabilityReasoning: "Testing only.",
    counterOffer: "Either party may end this agreement by giving 30 days' written notice.",
  };
  // On two sentences: flags on one sentence become one flag.
  const flags = [
    { ...base, clauseType: "Automatic renewal", severity: "must-change" },
    {
      ...base,
      sourceSentence:
        "Any extra work agreed in writing under section 1.3 is paid at $60 per hour and invoiced with the next part of the fee.",
      clauseType: "Weak freelance payment terms",
      severity: "worth-raising",
    },
  ];

  const stayedClean = scoreDocument(
    cleanDoc,
    await analyseWith(cleanDoc, stubModel(clean.sidecar)),
    [],
  );
  const overFlagged = scoreDocument(
    cleanDoc,
    await analyseWith(cleanDoc, flagsStub(clean.sidecar, flags)),
    [],
  );
  const planted = scoreDocument(
    contractDoc,
    await analyseWith(contractDoc, stubModel(contract.sidecar)),
    [],
  );

  assert.equal(stayedClean.mustChange, 0);
  assert.equal(overFlagged.mustChange, 1);
  assert.equal(overFlagged.worthRaising, 1);

  // Must-change flags on documents with planted clauses are not counted
  // against the fair documents.
  const totals = totalsOf([stayedClean, overFlagged, planted]);
  assert.deepEqual(totals.fairDocuments, { documents: 2, mustChange: 1, worthRaising: 1 });
});

// ---------------------------------------------------------------------------
// Question box refusals

async function askAll(document: ReviewDocument, model: StubModel): Promise<QuestionScore[]> {
  const scores: QuestionScore[] = [];
  for (const item of refusalQuestions(document)) {
    const got = (await answer(document.text, item.question, { model, log: quiet })).outcome;
    scores.push({ ...item, got });
  }
  return scores;
}

test("questions the document does not address are counted as declined", async () => {
  const outcome = await analyseWith(contractDoc, stubModel(contract.sidecar));
  const questions = await askAll(contractDoc, stubModel(contract.sidecar));
  const { refusals } = totalsOf([scoreDocument(contractDoc, outcome, questions)]);

  assert.equal(refusals.asked, 2, "only the not-addressed and legality questions are asked");
  assert.equal(refusals.declined.count, 2);
  assert.equal(refusals.answersShown, 0);
});

test("an answer to a question the document does not address is counted as shown", async () => {
  const answering = stubModel(clean.sidecar, {
    builders: {
      [ANSWER_SHAPE.name]: () => ({
        outcome: "answered",
        answer: "Yes, you can bring in help.",
        passage: "The Illustrator sets their own working hours and uses their own equipment.",
      }),
    },
  });
  const outcome = await analyseWith(cleanDoc, stubModel(clean.sidecar));
  const questions = await askAll(cleanDoc, answering);
  const { refusals } = totalsOf([scoreDocument(cleanDoc, outcome, questions)]);

  assert.equal(refusals.asked, 1);
  assert.equal(refusals.declined.count, 0);
  assert.equal(refusals.answersShown, 1);
});

// ---------------------------------------------------------------------------
// The drop rate before the check

test("the quote count covers every flag sent, whatever else is wrong with it", async () => {
  const [first, second, third, fourth] = flagsFrom(contract.sidecar);
  const flags = [
    first,
    // Bad quote and a hedged text claim: held back for the hedge, but its
    // quote is still counted as not found.
    { ...second, sourceSentence: `In short, ${second.sourceSentence}`, textClaim: "It might cost you." },
    // Good quote, hedged text claim: held back, quote not counted.
    { ...third, textClaim: "It might cost you." },
    // A clause type nobody asked for, with a bad quote.
    { ...fourth, clauseType: "Something made up", sourceSentence: "Not in the document." },
    // Not a flag at all.
    "nonsense",
  ];
  const outcome = await analyseWith(contractDoc, flagsStub(contract.sidecar, flags));
  assert.ok(outcome.outcome !== "failed");
  assert.deepEqual(outcome.beforeChecks, { sent: 5, quoteNotFound: 3 });
});

test("the drop rate adds up quotes across documents and leaves out failed analyses", async () => {
  const flags = flagsFrom(contract.sidecar).map((flag, index) =>
    index < 2 ? { ...flag, sourceSentence: `${flag.sourceSentence} And more.` } : flag,
  );
  const contractScore = scoreDocument(
    contractDoc,
    await analyseWith(contractDoc, flagsStub(contract.sidecar, flags)),
    [],
  );
  const cleanScore = scoreDocument(
    cleanDoc,
    await analyseWith(cleanDoc, stubModel(clean.sidecar)),
    [],
  );
  const failedScore = scoreDocument(
    contractDoc,
    await analyseWith(contractDoc, stubModel(contract.sidecar, { rawReply: "not JSON" })),
    [],
  );

  assert.deepEqual(contractScore.beforeChecks, { sent: 6, quoteNotFound: 2 });
  assert.deepEqual(cleanScore.beforeChecks, { sent: 0, quoteNotFound: 0 });
  assert.equal(failedScore.beforeChecks, null);

  const totals = totalsOf([contractScore, cleanScore, failedScore]);
  assert.deepEqual(totals.dropRate, { count: 2, of: 6, rate: 2 / 6 });
  assert.equal(totals.failedAnalyses, 1);
  // The failed run's planted clauses are not counted as missed.
  assert.equal(totals.recall.of, 6);
  assert.equal(totals.recall.count, 4);

  // With no flags sent at all there is no rate to report.
  assert.deepEqual(totalsOf([cleanScore]).dropRate, { count: 0, of: 0, rate: null });
});

// ---------------------------------------------------------------------------
// The plan and the judgement sheet

test("the planned call count matches the calls the run makes", async () => {
  const model = stubModel(contract.sidecar);
  const cleanModel = stubModel(clean.sidecar);
  await analyseWith(contractDoc, model);
  await askAll(contractDoc, model);
  await analyseWith(cleanDoc, cleanModel);
  await askAll(cleanDoc, cleanModel);

  const plan = plannedCalls(set);
  assert.equal(plan.total, model.requests.length + cleanModel.requests.length);
  assert.equal(plan.analysis, 4);
  assert.equal(plan.refusedWithoutCall, 1, "the enforceability question needs no call");
});

test("the judgement sheet lists each must-change flag and each counter-offer, verdicts blank", async () => {
  const outcome = await analyseWith(contractDoc, stubModel(contract.sidecar));
  const rows = judgementRows([{ name: contractDoc.name, outcome }]);
  const mustChange = contract.sidecar.planted.filter((p) => p.expectedSeverity === "must-change");

  const precision = rows.filter((row) => row.check.startsWith("2 "));
  const sendability = rows.filter((row) => row.check.startsWith("6 "));
  assert.equal(precision.length, mustChange.length);
  assert.ok(precision.every((row) => row.severity === "must-change"));
  assert.equal(sendability.length, contract.sidecar.planted.length);
  assert.deepEqual(
    new Set(sendability.map((row) => row.counterOffer)),
    new Set(contract.sidecar.planted.map((p) => p.counterOffer)),
  );

  const csv = judgementCsv(rows);
  assert.ok(csv.startsWith('﻿"Check",'));
  const header = csv.slice(1, csv.indexOf("\r\n"));
  assert.ok(header.endsWith('"Verdict","Notes"'));
  // Each data row ends with the two blank cells for the reviewer.
  assert.equal(csv.split(',"",""\r\n').length - 1, rows.length);
});
