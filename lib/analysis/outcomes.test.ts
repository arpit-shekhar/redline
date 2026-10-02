import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse, NothingToCheckError } from "./analyse.ts";
import type { ModelClient, ModelRequest } from "./model.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "./red-lines.ts";
import { FLAGS_SHAPE_NAME, SUMMARY_SHAPE } from "./reply-shapes.ts";
import type { AnalyseInput } from "./types.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { flagsFrom, stubModel, summaryFrom } from "../../tests/support/stub-model.ts";

// Which of the four outcomes Analyse returns: flagged, clean, withheld or
// failed. Tested through Analyse with only the model stubbed.

const contract = loadFixture("adhesion-contract");
const clean = loadFixture("clean-document");
const quiet = () => {};

const contractInput: AnalyseInput = {
  text: contract.text,
  documentType: contract.sidecar.documentType,
  redLines: DEFAULT_RED_LINES,
  leverage: DEFAULT_LEVERAGE,
};

const cleanInput: AnalyseInput = {
  ...contractInput,
  text: clean.text,
  documentType: clean.sidecar.documentType,
};

const switchedOn = DEFAULT_RED_LINES.filter((line) => line.enabled).map(
  (line) => line.clauseType,
);

// ---------------------------------------------------------------------------
// Clean

test("a clean document gives a clean result listing every clause type checked for", async () => {
  const result = await analyse(cleanInput, stubModel(clean.sidecar), quiet);

  assert.equal(result.outcome, "clean");
  if (result.outcome !== "clean") return;
  assert.equal(result.summary, summaryFrom(clean.sidecar));
  assert.ok(result.statement.trim().length > 0, "the clean result says so");
  assert.ok(result.checkedFor.length > 0, "the checked-for list is empty");
  assert.deepEqual(result.checkedFor, switchedOn);
  assert.ok(!("flags" in result), "a clean result carries no flag list");
});

test("the checked-for list is the clause types that were switched on", async () => {
  const redLines = DEFAULT_RED_LINES.map((line, index) =>
    index < 3 ? { ...line, enabled: false } : line,
  );
  const result = await analyse({ ...cleanInput, redLines }, stubModel(clean.sidecar), quiet);

  assert.equal(result.outcome, "clean");
  if (result.outcome !== "clean") return;
  assert.deepEqual(
    result.checkedFor,
    DEFAULT_RED_LINES.slice(3).map((line) => line.clauseType),
  );
});

test("with every red line switched off, Analyse refuses before calling the model", async () => {
  const redLines = DEFAULT_RED_LINES.map((line) => ({ ...line, enabled: false }));
  const model = stubModel(clean.sidecar);

  await assert.rejects(analyse({ ...cleanInput, redLines }, model, quiet), NothingToCheckError);
  assert.equal(model.requests.length, 0);
});

// ---------------------------------------------------------------------------
// Flagged

test("a document with flags that pass gives a flagged result with its checklist", async () => {
  const result = await analyse(contractInput, stubModel(contract.sidecar), quiet);

  assert.equal(result.outcome, "flagged");
  if (result.outcome !== "flagged") return;
  assert.equal(result.flags.length, contract.sidecar.planted.length);
  assert.equal(result.dropped, 0);
  assert.deepEqual(result.checkedFor, switchedOn);
});

test("some flags held back and some shown is still a flagged result, with the count", async () => {
  const payloads = flagsFrom(contract.sidecar);
  const broken = payloads.map((flag, index) =>
    index < 2 ? { ...flag, sourceSentence: `${flag.sourceSentence} And more.` } : flag,
  );
  const model = stubModel(contract.sidecar, {
    builders: { [FLAGS_SHAPE_NAME]: () => ({ flags: broken }) },
  });
  const result = await analyse(contractInput, model, quiet);

  assert.equal(result.outcome, "flagged");
  if (result.outcome !== "flagged") return;
  assert.equal(result.flags.length, payloads.length - 2);
  assert.equal(result.dropped, 2);
});

// ---------------------------------------------------------------------------
// Withheld

test("when every flag fails the source sentence check, the result is withheld, not clean", async () => {
  const payloads = flagsFrom(contract.sidecar).map((flag) => ({
    ...flag,
    // Each quote has words added, so none is in the document word for word.
    sourceSentence: `In short, ${flag.sourceSentence}`,
  }));
  const model = stubModel(contract.sidecar, {
    builders: { [FLAGS_SHAPE_NAME]: () => ({ flags: payloads }) },
  });
  const result = await analyse(contractInput, model, quiet);

  assert.equal(result.outcome, "withheld");
  if (result.outcome !== "withheld") return;
  assert.equal(result.withheld, payloads.length);
  assert.equal(result.summary, summaryFrom(contract.sidecar));
  assert.ok(!("flags" in result), "a withheld result shows no flags");
  assert.ok(!("checkedFor" in result), "a withheld result is not shown as clean");
});

test("flags invented for a clean document are withheld, not shown as clean", async () => {
  const invented = {
    clauseType: "Automatic renewal",
    severity: "must-change",
    sourceSentence: "This Agreement renews by itself every year unless cancelled.",
    textClaim: "The agreement renews every year unless you cancel.",
    outcomeClaim: "You could pay for a year you did not want.",
    escapabilityReasoning: "It renews unless you act first.",
    counterOffer: "Would you consider letting the agreement end each year unless we both agree to renew it?",
  };
  const model = stubModel(clean.sidecar, {
    builders: { [FLAGS_SHAPE_NAME]: () => ({ flags: [invented, invented] }) },
  });
  const result = await analyse(cleanInput, model, quiet);

  assert.equal(result.outcome, "withheld");
  if (result.outcome !== "withheld") return;
  assert.equal(result.withheld, 2);
});

// ---------------------------------------------------------------------------
// Failed

// A model that sends the summary but fails on the flags, so a test can check
// the summary is not passed on as a partial result.
function failingOnFlags(fail: (request: ModelRequest) => Promise<string>): ModelClient {
  const good = stubModel(contract.sidecar);
  return {
    complete(request) {
      return request.shape.name === SUMMARY_SHAPE.name ? good.complete(request) : fail(request);
    },
  };
}

test("a model call that throws gives a failed outcome with nothing else", async () => {
  const model = failingOnFlags(async () => {
    throw new Error("connection reset");
  });
  const result = await analyse(contractInput, model, quiet);

  assert.deepEqual(Object.keys(result).sort(), ["outcome", "reason"]);
  assert.equal(result.outcome, "failed");
  if (result.outcome !== "failed") return;
  assert.match(result.reason, /connection reset/);
});

test("a model that never replies gives a failed outcome once the time runs out", async () => {
  const signals: (AbortSignal | undefined)[] = [];
  const model = failingOnFlags((request) => {
    signals.push(request.signal);
    return new Promise<string>(() => {});
  });
  const started = Date.now();
  const result = await analyse(contractInput, model, quiet, 30);

  assert.equal(result.outcome, "failed");
  assert.deepEqual(Object.keys(result).sort(), ["outcome", "reason"]);
  if (result.outcome !== "failed") return;
  assert.match(result.reason, /did not reply/);
  assert.ok(Date.now() - started < 2000, "it waited far longer than the time allowed");
  // The waiting request was told to stop.
  assert.equal(signals.length, 1);
  assert.equal(signals[0]?.aborted, true);
});

test("a reply that is not JSON gives a failed outcome with no flags", async () => {
  const model = stubModel(contract.sidecar, {
    rawReplies: { [FLAGS_SHAPE_NAME]: '{"flags": [ {"clauseType": "Automatic' },
  });
  const result = await analyse(contractInput, model, quiet);

  assert.equal(result.outcome, "failed");
  assert.ok(!("flags" in result));
  assert.ok(!("summary" in result));
});

test("a failure is logged without any document text", async () => {
  const messages: string[] = [];
  const model = stubModel(contract.sidecar, { rawReply: "Sorry, I cannot help with that." });
  await analyse(contractInput, model, (message) => messages.push(message));

  assert.equal(messages.length, 1);
  assert.match(messages[0], /Analysis failed/);
  for (const clause of contract.sidecar.planted) {
    assert.ok(!messages[0].includes(clause.sourceSentence.slice(0, 30)));
  }
});
