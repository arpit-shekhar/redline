import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse } from "./analyse.ts";
import {
  addOwnRedLine,
  DEFAULT_SETTINGS,
  hasSomethingToCheck,
  MAX_OWN_RED_LINES,
  MAX_OWN_WORDS,
  redLinesToCheck,
  removeOwnRedLine,
  setDefaultSeverity,
  setLeverage,
  switchDefault,
  type Change,
  type RedLineSettings,
} from "./red-lines.ts";
import { FLAGS_SHAPE_NAME } from "./reply-shapes.ts";
import type { AnalysisOutcome } from "./types.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { flagsFrom, stubModel, type FlagPayload } from "../../tests/support/stub-model.ts";

// Red lines drive the analysis: what is looked for, and the severity flags
// start from. Tested through Analyse with only the model stubbed. The
// settings are built with the same changes the red lines page makes.

const contract = loadFixture("adhesion-contract");
const clean = loadFixture("clean-document");
const quiet = () => {};

const RENEWAL = "Automatic renewal";
const LATE_FEES = "Late fees and penalties";
const GUARANTEE = "Personal guarantees";

// A red line in the reader's own words, and a sentence from the test
// contract that crosses it. Nothing in the answer key flags this sentence.
const OWN_WORDS = "No price rises when the contract renews";
const RENEWAL_PRICES =
  "Fees for any Renewal Term will be our list prices in effect at the start of that Renewal Term.";

function settled(change: Change): RedLineSettings {
  assert.ok(change.ok, change.ok ? "" : change.problem);
  return change.settings;
}

// Runs Analyse on the test contract with these settings. The stub sends
// `flags` if given, or else one flag for every planted clause.
async function analyseContract(settings: RedLineSettings, flags?: FlagPayload[]) {
  const model = stubModel(contract.sidecar, {
    builders: flags ? { [FLAGS_SHAPE_NAME]: () => ({ flags }) } : {},
  });
  const result = await analyse(
    {
      text: contract.text,
      documentType: contract.sidecar.documentType,
      redLines: redLinesToCheck(settings),
      leverage: settings.leverage,
    },
    model,
    quiet,
  );
  return { result, model };
}

function flagged(result: AnalysisOutcome) {
  assert.equal(result.outcome, "flagged");
  if (result.outcome !== "flagged") throw new Error("not flagged");
  return result;
}

function ownFlag(sourceSentence: string, severity = "must-change"): FlagPayload {
  return {
    clauseType: OWN_WORDS,
    severity,
    sourceSentence,
    textClaim: "When the agreement renews, the fees change to whatever the list prices are then.",
    outcomeClaim: "You could pay more after renewal than you pay now.",
    escapabilityReasoning: "The new price applies once the renewal starts, and getting out of the renewal is hard.",
  };
}

// ---------------------------------------------------------------------------
// Switching a clause type off

test("a switched-off type gives no flags, even when the model sends one, and is not checked for", async () => {
  const settings = settled(switchDefault(DEFAULT_SETTINGS, RENEWAL, false));
  const { result, model } = await analyseContract(settings);

  const analysis = flagged(result);
  // The stub sent a renewal flag anyway, built from the answer key.
  assert.ok(flagsFrom(contract.sidecar).some((f) => f.clauseType === RENEWAL));
  assert.ok(!analysis.flags.some((f) => f.clauseType === RENEWAL));
  assert.ok(!analysis.checkedFor.includes(RENEWAL));
  assert.equal(analysis.checkedFor.length, 7);
  assert.equal(analysis.dropped, 0, "a switched-off type is not counted as held back");
  assert.equal(analysis.flags.length, contract.sidecar.planted.length - 1);

  const request = model.requests.find((r) => r.shape.name === FLAGS_SHAPE_NAME)!;
  assert.ok(!JSON.stringify(request.shape.schema).includes(RENEWAL));
});

test("when the only flags are of switched-off types, the result is clean, not withheld", async () => {
  let settings = DEFAULT_SETTINGS;
  for (const type of new Set(contract.sidecar.planted.map((p) => p.clauseType))) {
    settings = settled(switchDefault(settings, type, false));
  }
  const { result } = await analyseContract(settings);

  assert.equal(result.outcome, "clean");
  if (result.outcome !== "clean") return;
  for (const clause of contract.sidecar.planted) {
    assert.ok(!result.checkedFor.includes(clause.clauseType));
  }
});

test("switching a type back on looks for it again", async () => {
  const off = settled(switchDefault(DEFAULT_SETTINGS, RENEWAL, false));
  const on = settled(switchDefault(off, RENEWAL, true));
  const { result } = await analyseContract(on);

  const analysis = flagged(result);
  assert.ok(analysis.checkedFor.includes(RENEWAL));
  assert.ok(analysis.flags.some((f) => f.clauseType === RENEWAL));
});

// ---------------------------------------------------------------------------
// Changing a clause type's severity

test("lowering a type to worth-raising makes its flags worth-raising", async () => {
  const settings = settled(setDefaultSeverity(DEFAULT_SETTINGS, RENEWAL, "worth-raising"));
  // The stub sends the renewal flag as must-change, as the answer key says.
  const { result } = await analyseContract(settings);

  const renewal = flagged(result).flags.find((f) => f.clauseType === RENEWAL);
  assert.equal(renewal?.severity, "worth-raising");
});

test("raising a type to must-change lets its flags be must-change", async () => {
  // A model that calls the late fee must-change.
  const flags = flagsFrom(contract.sidecar).map((flag) =>
    flag.clauseType === LATE_FEES ? { ...flag, severity: "must-change" } : flag,
  );

  // At its default, worth-raising, the flag cannot go above that.
  const before = await analyseContract(DEFAULT_SETTINGS, flags);
  assert.equal(
    flagged(before.result).flags.find((f) => f.clauseType === LATE_FEES)?.severity,
    "worth-raising",
  );

  // Once the reader raises the type, the same reply gives a must-change flag.
  const raised = settled(setDefaultSeverity(DEFAULT_SETTINGS, LATE_FEES, "must-change"));
  const after = await analyseContract(raised, flags);
  assert.equal(
    flagged(after.result).flags.find((f) => f.clauseType === LATE_FEES)?.severity,
    "must-change",
  );
});

test("the model may still move a must-change type's flag down to worth-raising", async () => {
  const flags = flagsFrom(contract.sidecar).map((flag) =>
    flag.clauseType === GUARANTEE ? { ...flag, severity: "worth-raising" } : flag,
  );
  const { result } = await analyseContract(DEFAULT_SETTINGS, flags);

  const guarantee = flagged(result).flags.find((f) => f.clauseType === GUARANTEE);
  assert.equal(guarantee?.severity, "worth-raising");
});

test("a lowered flag is ranked with the worth-raising flags", async () => {
  const settings = settled(setDefaultSeverity(DEFAULT_SETTINGS, RENEWAL, "worth-raising"));
  const { result } = await analyseContract(settings);

  const severities = flagged(result).flags.map((f) => f.severity);
  const firstWorthRaising = severities.indexOf("worth-raising");
  assert.ok(firstWorthRaising > 0);
  assert.ok(
    severities.slice(firstWorthRaising).every((s) => s === "worth-raising"),
    "a must-change flag comes after a worth-raising one",
  );
});

// ---------------------------------------------------------------------------
// A red line in the reader's own words

test("a red line in the reader's own words is looked for, and its flag is named by those words", async () => {
  const settings = settled(addOwnRedLine(DEFAULT_SETTINGS, OWN_WORDS, "must-change"));
  const flags = [...flagsFrom(contract.sidecar), ownFlag(RENEWAL_PRICES)];
  const { result, model } = await analyseContract(settings, flags);

  const analysis = flagged(result);
  assert.ok(analysis.checkedFor.includes(OWN_WORDS));
  const own = analysis.flags.find((f) => f.clauseType === OWN_WORDS);
  assert.ok(own, "the flag for the reader's own red line is missing");
  assert.equal(own.sourceSentence, RENEWAL_PRICES);
  assert.equal(own.severity, "must-change");
  assert.equal(contract.text.slice(own.sourceLocation.start, own.sourceLocation.end), RENEWAL_PRICES);
  assert.equal(analysis.dropped, 0);

  const request = model.requests.find((r) => r.shape.name === FLAGS_SHAPE_NAME)!;
  assert.ok(JSON.stringify(request.shape.schema).includes(OWN_WORDS));
});

test("a flag for the reader's own red line is held back when its sentence is invented", async () => {
  const settings = settled(addOwnRedLine(DEFAULT_SETTINGS, OWN_WORDS, "must-change"));
  const invented = ownFlag("Prices for each renewal term will be set by Kestrelmoor at its discretion.");
  const flags = [...flagsFrom(contract.sidecar), invented];
  const { result } = await analyseContract(settings, flags);

  const analysis = flagged(result);
  assert.ok(!analysis.flags.some((f) => f.clauseType === OWN_WORDS));
  assert.equal(analysis.dropped, 1);
});

test("a worth-raising red line of the reader's own never gives a must-change flag", async () => {
  const settings = settled(addOwnRedLine(DEFAULT_SETTINGS, OWN_WORDS, "worth-raising"));
  const flags = [ownFlag(RENEWAL_PRICES, "must-change")];
  const { result } = await analyseContract(settings, flags);

  const own = flagged(result).flags.find((f) => f.clauseType === OWN_WORDS);
  assert.equal(own?.severity, "worth-raising");
});

test("a removed red line is no longer looked for", async () => {
  const added = settled(addOwnRedLine(DEFAULT_SETTINGS, OWN_WORDS, "must-change", "line-1"));
  const removed = settled(removeOwnRedLine(added, "line-1"));
  const flags = [...flagsFrom(contract.sidecar), ownFlag(RENEWAL_PRICES)];
  const { result } = await analyseContract(removed, flags);

  const analysis = flagged(result);
  assert.ok(!analysis.checkedFor.includes(OWN_WORDS));
  assert.ok(!analysis.flags.some((f) => f.clauseType === OWN_WORDS));
});

test("with all eight switched off, one red line of the reader's own is enough to check", async () => {
  let settings = DEFAULT_SETTINGS;
  for (const line of DEFAULT_SETTINGS.defaults) {
    settings = settled(switchDefault(settings, line.clauseType, false));
  }
  assert.equal(hasSomethingToCheck(settings), false);
  settings = settled(addOwnRedLine(settings, OWN_WORDS, "worth-raising"));
  assert.equal(hasSomethingToCheck(settings), true);

  const result = await analyse(
    {
      text: clean.text,
      documentType: clean.sidecar.documentType,
      redLines: redLinesToCheck(settings),
      leverage: settings.leverage,
    },
    stubModel(clean.sidecar),
    quiet,
  );
  assert.equal(result.outcome, "clean");
  if (result.outcome !== "clean") return;
  assert.deepEqual(result.checkedFor, [OWN_WORDS]);
});

// ---------------------------------------------------------------------------
// What the red lines page may and may not save

test("a red line of the reader's own is tidied, and blank, overlong or repeated ones are refused", () => {
  const added = settled(addOwnRedLine(DEFAULT_SETTINGS, `  No price\n rises   when the contract renews `, "must-change"));
  assert.equal(added.own[0].words, OWN_WORDS);

  assert.equal(addOwnRedLine(DEFAULT_SETTINGS, "   \n ", "must-change").ok, false);
  assert.equal(addOwnRedLine(DEFAULT_SETTINGS, "x".repeat(MAX_OWN_WORDS + 1), "must-change").ok, false);
  assert.equal(addOwnRedLine(added, OWN_WORDS.toUpperCase(), "worth-raising").ok, false);
  assert.equal(addOwnRedLine(DEFAULT_SETTINGS, "automatic RENEWAL", "worth-raising").ok, false);
});

test("a reader can keep only so many red lines of their own", () => {
  let settings = DEFAULT_SETTINGS;
  for (let i = 0; i < MAX_OWN_RED_LINES; i++) {
    settings = settled(addOwnRedLine(settings, `Red line number ${i}`, "worth-raising"));
  }
  assert.equal(addOwnRedLine(settings, "One more", "worth-raising").ok, false);
});

test("a change to a clause type Redline does not have is refused", () => {
  assert.equal(switchDefault(DEFAULT_SETTINGS, "Hidden fees", false).ok, false);
  assert.equal(setDefaultSeverity(DEFAULT_SETTINGS, "Hidden fees", "must-change").ok, false);
});

test("leverage starts unanswered and is passed to Analyse once answered", async () => {
  assert.equal(DEFAULT_SETTINGS.leverage, null);
  const settings = settled(setLeverage(DEFAULT_SETTINGS, "can-walk-away"));
  assert.equal(settings.leverage, "can-walk-away");
  // Analyse takes either; it does not use leverage until counter-offers exist.
  const { result } = await analyseContract(settings);
  assert.equal(result.outcome, "flagged");
});

test("changes never alter the settings they were given", () => {
  const before = structuredClone(DEFAULT_SETTINGS);
  switchDefault(DEFAULT_SETTINGS, RENEWAL, false);
  setDefaultSeverity(DEFAULT_SETTINGS, LATE_FEES, "must-change");
  addOwnRedLine(DEFAULT_SETTINGS, OWN_WORDS, "must-change");
  setLeverage(DEFAULT_SETTINGS, "cannot-walk-away");
  assert.deepEqual(DEFAULT_SETTINGS, before);
});
