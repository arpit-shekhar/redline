// The quality evals (spec, "Quality evals"; PRD.md section 4). They run the
// real Analyse and Answer, with the real OpenRouter client, over a review set
// and print how good the analysis is. They cost real model calls, so they run
// only when someone types `npm run evals`, never in `npm test` or the build.
//
// The numbers it prints are measurements, not pass or fail. Each one has the
// PRD's target beside it where the PRD sets one.

import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyse } from "../lib/analysis/analyse.ts";
import { answer } from "../lib/analysis/answer.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "../lib/analysis/red-lines.ts";
import type { AnalysisOutcome, AnswerOutcome } from "../lib/analysis/types.ts";
import { loadReviewSet, ReviewSetError, type ReviewDocument } from "./review-set.ts";
import {
  judgementCsv,
  judgementRows,
  plannedCalls,
  rate,
  refusalQuestions,
  refusalScore,
  scoreDocument,
  TARGETS,
  totalsOf,
  type DocumentScore,
  type QuestionScore,
  type Rate,
} from "./scoring.ts";

const repo = new URL("../", import.meta.url);
const repoPath = fileURLToPath(repo);
const RESULTS = new URL("evals/results/", repo);

const HELP = `Redline quality evals

Usage:
  npm run evals                      Run on the test documents in tests/fixtures/
  npm run evals -- <folder>          Run on another review set
  npm run evals -- --plan [folder]   Count the model calls, then stop
  npm run evals -- --help            Show this text

The review set can also be named in the REDLINE_REVIEW_SET variable. A folder
given on the command line wins over the variable.

It needs OPENROUTER_API_KEY and OPENROUTER_MODEL, from the environment or from
.env.local in the repo folder. Before any call it says how many model calls it
will make. Each document costs two: one for the summary, one for the flags.
Each question that expects a refusal costs one, unless it names legality
outright, which Redline refuses without asking the model.

Review set format
  A folder of documents. Each document is two files:
    <name>.txt          the document text, UTF-8
    <name>.flags.json   its answer key
  Only .txt and .flags.json files are read. Every .txt file needs an answer key.

  The answer key is a JSON object:
    "document"       the .txt file's name, for example "lease-1.txt"
    "documentType"   contract, lease, freelance-agreement or terms-of-service
    "planted"        a list of clauses planted on purpose. Use [] for a fair
                     document, one judged to have nothing worth a must-change
                     flag. Each entry has:
        "clauseType"         the clause type, as named in the red lines
        "sourceSentence"     the sentence copied exactly from the .txt file
        "expectedSeverity"   "must-change" or "worth-raising"
    "questions"      optional list of question box questions. Each entry has:
        "question"   what a reader might type
        "expect"     "answered", "not-addressed" or "legality"
  Other fields are allowed and ignored. tests/fixtures/README.md describes
  the test documents, which follow this format.

What it measures
  Planted-trap recall: a planted clause is caught when a flag's source
    sentence overlaps the planted sentence in the text, at either severity.
  Must-change flags on fair documents, printed next to recall.
  Question box refusals, for "not-addressed" and "legality" questions only.
  Drop rate before the check: of every flag the model sent, how many quoted
    a sentence that is not in the document word for word.
  Must-change precision and counter-offer sendability need a person. The run
    writes a sheet for those, with a blank Verdict column.

Output
  A JSON results file and a CSV judgement sheet in evals/results/, which git
  ignores.
`;

// ---------------------------------------------------------------------------
// Start-up: arguments, settings, the review set and the plan

function main(): Promise<void> | void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return;
  }
  const planOnly = args.includes("--plan");
  const unknown = args.filter((arg) => arg.startsWith("-") && arg !== "--plan");
  if (unknown.length > 0) {
    console.error(`Unknown option ${unknown.join(", ")}. Run npm run evals -- --help.`);
    process.exitCode = 1;
    return;
  }
  const folderArg = args.find((arg) => !arg.startsWith("-"));

  // Load .env.local if there is one. Its values are never printed.
  try {
    process.loadEnvFile(new URL(".env.local", repo));
  } catch {
    // No .env.local here. The settings may already be in the environment.
  }

  const named = folderArg ?? process.env.REDLINE_REVIEW_SET?.trim();
  const folder = named ? resolve(named) : fileURLToPath(new URL("tests/fixtures/", repo));

  let documents: ReviewDocument[];
  try {
    documents = loadReviewSet(folder);
  } catch (error) {
    if (!(error instanceof ReviewSetError)) throw error;
    console.error(`The review set cannot be used. ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const fair = documents.filter((d) => d.planted.length === 0).length;
  console.log("Redline quality evals\n");
  console.log(`Review set: ${shortPath(folder)}`);
  console.log(
    `${documents.length} ${plural(documents.length, "document")}: ` +
      `${documents.length - fair} with planted clauses, ${fair} fair.\n`,
  );

  const plan = plannedCalls(documents);
  console.log(
    `This run will make ${plan.total} model ${plural(plan.total, "call")}: ` +
      `${plan.analysis} for analysis and ${plan.questions} for questions.`,
  );
  if (plan.refusedWithoutCall > 0) {
    console.log(
      `${plan.refusedWithoutCall} legality ${plural(plan.refusedWithoutCall, "question")} ` +
        "will be refused without a call.",
    );
  }
  console.log("Before the first call, it also checks the model name against OpenRouter's list.\n");

  if (planOnly) return;

  const missing = ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    console.error(`Stopped before any call. Missing: ${missing.join(", ")}.`);
    console.error("Set them in .env.local in the repo folder, then run it again.");
    process.exitCode = 1;
    return;
  }

  return run(folder, documents);
}

// ---------------------------------------------------------------------------
// The run

async function run(folder: string, documents: ReviewDocument[]): Promise<void> {
  const scores: DocumentScore[] = [];
  const analyses: { name: string; outcome: AnalysisOutcome }[] = [];

  // One document at a time, so a large review set does not hit OpenRouter
  // with every request at once.
  for (const [index, document] of documents.entries()) {
    console.log(`Running ${index + 1} of ${documents.length}: ${document.name}`);
    const log = (message: string) => console.warn(`  [${document.name}] ${message}`);

    const outcome = await analyseOne(document, log);
    const questions: QuestionScore[] = [];
    for (const item of refusalQuestions(document)) {
      questions.push({ ...item, got: await askOne(document, item.question, log) });
    }
    scores.push(scoreDocument(document, outcome, questions));
    analyses.push({ name: document.name, outcome });
  }

  const totals = totalsOf(scores);
  printReport(scores, totals);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  mkdirSync(RESULTS, { recursive: true });
  const resultsFile = new URL(`${stamp}-results.json`, RESULTS);
  const sheetFile = new URL(`${stamp}-judgements.csv`, RESULTS);
  const rows = judgementRows(analyses);

  // The results hold counts, clause types and severities, never document
  // text. The judgement sheet does hold the flagged sentences, because the
  // reviewer needs them; it stays in the gitignored results folder.
  writeFileSync(
    resultsFile,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        reviewSet: shortPath(folder),
        // Which model answered, so runs can be compared. Read from the
        // environment at run time; no model is named in this code.
        model: process.env.OPENROUTER_MODEL?.trim(),
        targets: TARGETS,
        totals,
        documents: scores,
      },
      null,
      2,
    ),
  );
  writeFileSync(sheetFile, judgementCsv(rows));

  console.log("\nFiles");
  console.log(`  Results: ${shortPath(fileURLToPath(resultsFile))}`);
  console.log(
    `  Judgement sheet: ${shortPath(fileURLToPath(sheetFile))} ` +
      `(${rows.length} ${plural(rows.length, "row")} for a person to fill in)`,
  );
  // Setting the exit code, rather than exiting at once, lets Node close its
  // network connections first. Exiting while they close crashes Node on
  // Windows.
  if (totals.failedAnalyses > 0) process.exitCode = 1;
}

// Analyse with the real client. A failed call comes back as the "failed"
// outcome. A document Analyse refuses outright (too long, for example) is
// recorded the same way, so one bad document does not stop the run.
async function analyseOne(
  document: ReviewDocument,
  log: (message: string) => void,
): Promise<AnalysisOutcome> {
  try {
    return await analyse(
      {
        text: document.text,
        documentType: document.documentType,
        redLines: DEFAULT_RED_LINES,
        leverage: DEFAULT_LEVERAGE,
      },
      undefined,
      log,
    );
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error.";
    log(`Analysis refused. ${reason}`);
    return { outcome: "failed", reason };
  }
}

async function askOne(
  document: ReviewDocument,
  question: string,
  log: (message: string) => void,
): Promise<AnswerOutcome["outcome"]> {
  try {
    return (await answer(document.text, question, { log })).outcome;
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error.";
    log(`Question refused before the model was asked. ${reason}`);
    return "failed";
  }
}

// ---------------------------------------------------------------------------
// The report

function printReport(scores: DocumentScore[], totals: ReturnType<typeof totalsOf>): void {
  console.log("\nPer document");
  for (const score of scores) {
    const kind = score.fair ? "fair" : `${score.planted.length} planted`;
    console.log(`\n  ${score.name} (${kind})`);
    console.log(`    Outcome: ${score.outcome}`);
    if (score.failReason) {
      console.log(`    ${score.failReason}`);
      console.log("    Left out of recall, fair-document and drop rate numbers.");
    } else {
      if (!score.fair) {
        const caught = score.planted.filter((p) => p.caught).length;
        console.log(`    Planted clauses caught: ${share(rate(caught, score.planted.length))}`);
        for (const p of score.planted) {
          const how = p.caught
            ? `caught as ${p.caughtAs}${p.sameClauseType ? "" : ", under another clause type"}`
            : "missed";
          console.log(`      - ${p.clauseType} (expected ${p.expectedSeverity}): ${how}`);
        }
      }
      console.log(
        `    Flags shown: ${score.mustChange} must-change, ${score.worthRaising} worth-raising` +
          (score.fair ? `. Must-change target: ${TARGETS.fairMustChange}.` : ""),
      );
      console.log(`    Held back by the checks: ${score.heldBack}`);
      if (score.beforeChecks) {
        const { quoteNotFound, sent } = score.beforeChecks;
        console.log(
          `    Quotes not in the document, before the check: ${share(rate(quoteNotFound, sent))} flags sent`,
        );
      }
    }
    const refusals = refusalScore(score.questions);
    if (refusals.asked > 0) {
      console.log(`    Refusal questions declined: ${share(refusals.declined)}`);
      for (const q of score.questions) {
        console.log(`      - expected ${q.expect}, got ${q.got}`);
      }
    }
  }

  const { recall, fairDocuments, refusals, dropRate } = totals;
  console.log("\nOverall");
  if (totals.failedAnalyses > 0) {
    console.log(
      `  Analyses that failed: ${totals.failedAnalyses} of ${totals.documents}. ` +
        "They are left out of the numbers below, except the question box.",
    );
  }
  // Recall and must-change flags on fair documents sit next to each other on
  // purpose (spec, "Watch the tension between check 3 and check 4"): recall
  // bought by adding must-change flags breaks the severity model.
  console.log("\n  Planted-trap recall and fair documents, side by side");
  console.log(`    Planted clauses caught: ${share(recall)}. Target ${TARGETS.recall}.`);
  console.log(
    `      Caught as must-change: ${recall.asMustChange}. Caught as worth-raising: ${recall.asWorthRaising}.`,
  );
  console.log(
    `    Must-change flags on fair documents: ${fairDocuments.mustChange} across ` +
      `${fairDocuments.documents} fair ${plural(fairDocuments.documents, "document")}. ` +
      `Target ${TARGETS.fairMustChange}.`,
  );
  console.log(`      Worth-raising flags on fair documents: ${fairDocuments.worthRaising}. No target.`);

  console.log("\n  Question box");
  console.log(`    Questions that expect a refusal: ${refusals.asked}`);
  console.log(`    Declined: ${share(refusals.declined)}`);
  console.log(`    Answered anyway, with text shown: ${refusals.answersShown}. Target ${TARGETS.answersShown}.`);
  console.log(`    Answered, but held back by the passage check: ${refusals.unverified}`);
  console.log(`    Failed calls: ${refusals.failed}`);

  console.log("\n  Before the source sentence check");
  console.log(
    `    Flags whose quote is not in the document: ${share(dropRate)} flags the model sent. ` +
      `Target: ${TARGETS.dropRate}.`,
  );

  console.log("\n  Needs a person");
  console.log(`    Must-change precision: target ${TARGETS.mustChangePrecision}.`);
  console.log(`    Counter-offer sendability: target ${TARGETS.sendability}.`);
  console.log("    Record each verdict in the judgement sheet below.");
}

function share({ count, of, rate: value }: Rate): string {
  const percent = value === null ? "no data" : `${(value * 100).toFixed(1)}%`;
  return `${count} of ${of} (${percent})`;
}

function plural(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`;
}

// A path inside the repo is shown from the repo folder; anything else in full.
function shortPath(path: string): string {
  const inside = relative(repoPath, path);
  return inside && !inside.startsWith("..") && !isAbsolute(inside)
    ? inside.replace(/\\/g, "/")
    : path;
}

await main();
