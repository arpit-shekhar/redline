import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse } from "./analyse.ts";
import { addOwnRedLine, DEFAULT_SETTINGS, redLinesToCheck, type RedLineSettings } from "./red-lines.ts";
import { FLAGS_SHAPE_NAME } from "./reply-shapes.ts";
import type { AnalysisOutcome } from "./types.ts";
import { tabCounts } from "../storage/types.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { flagFrom, stubModel, type FlagPayload } from "../../tests/support/stub-model.ts";

// One flag per source sentence (CONTEXT.md, "Flag"). When a sentence crosses
// more than one red line, the reader sees one flag that names every red line
// it crosses, carries the highest severity among them, and counts once.
// FINDINGS.md rank 3: one sentence showed "2 flags: 2 must change".

const contract = loadFixture("adhesion-contract");
const quiet = () => {};

const RENEWAL = "Automatic renewal";
const ARBITRATION = "Forced arbitration and class-action waivers";
const OWN_WORDS = "I will not be locked into a renewal I did not choose";

const planted = (clauseType: string) => {
  const clause = contract.sidecar.planted.find((p) => p.clauseType === clauseType);
  if (!clause) throw new Error(`No planted ${clauseType} clause.`);
  return flagFrom(clause);
};

// A second flag on the same sentence as `flag`, for another red line.
function alsoOn(flag: FlagPayload, clauseType: string, severity = "must-change"): FlagPayload {
  return {
    ...flag,
    clauseType,
    severity,
    textClaim: "The agreement starts a new term on its own unless notice is given.",
    outcomeClaim: "You could be held to a term you did not mean to start.",
    escapabilityReasoning: "Nothing in the document lets you end a renewal once it starts.",
    counterOffer: "Would you consider making each renewal need both sides to agree in writing?",
  };
}

function withOwn(severity: "must-change" | "worth-raising" = "must-change"): RedLineSettings {
  const change = addOwnRedLine(DEFAULT_SETTINGS, OWN_WORDS, severity);
  assert.ok(change.ok);
  return change.settings;
}

async function analyseWith(settings: RedLineSettings, flags: FlagPayload[]) {
  const model = stubModel(contract.sidecar, {
    builders: { [FLAGS_SHAPE_NAME]: () => ({ flags }) },
  });
  return analyse(
    {
      text: contract.text,
      documentType: contract.sidecar.documentType,
      redLines: redLinesToCheck(settings),
      leverage: settings.leverage,
    },
    model,
    quiet,
  );
}

function flagged(result: AnalysisOutcome) {
  if (result.outcome !== "flagged") throw new Error(`Expected flagged, got ${result.outcome}.`);
  return result;
}

test("two red lines on one sentence give one flag, counted once", async () => {
  const renewal = planted(RENEWAL);
  const result = flagged(await analyseWith(withOwn(), [renewal, alsoOn(renewal, OWN_WORDS)]));

  assert.equal(result.flags.length, 1);
  assert.deepEqual(tabCounts(result), { mustChange: 1, worthRaising: 0 });
  assert.equal(result.dropped, 0);
});

test("on a tie, the reader's own red line names the flag and the other is listed as also crossed", async () => {
  const renewal = planted(RENEWAL);
  const own = alsoOn(renewal, OWN_WORDS);
  for (const order of [[renewal, own], [own, renewal]]) {
    const [flag] = flagged(await analyseWith(withOwn(), order)).flags;
    assert.equal(flag.clauseType, OWN_WORDS);
    assert.equal(flag.textClaim, own.textClaim);
    assert.equal(flag.counterOffer, own.counterOffer);
    assert.deepEqual(flag.alsoCrosses, [RENEWAL]);
  }
});

test("the higher severity wins, whatever order the flags arrive in", async () => {
  const renewal = planted(RENEWAL);
  // The reader's own red line starts at worth-raising, so its flag is capped
  // there and the must-change renewal flag is the one kept.
  const own = alsoOn(renewal, OWN_WORDS);
  for (const order of [[renewal, own], [own, renewal]]) {
    const [flag, ...rest] = flagged(await analyseWith(withOwn("worth-raising"), order)).flags;
    assert.equal(rest.length, 0);
    assert.equal(flag.clauseType, RENEWAL);
    assert.equal(flag.severity, "must-change");
    assert.deepEqual(flag.alsoCrosses, [OWN_WORDS]);
  }
});

test("a flag on part of a sentence merges into the flag on the whole sentence", async () => {
  const renewal = planted(RENEWAL);
  const words = renewal.sourceSentence.split(" ");
  const part = { ...alsoOn(renewal, OWN_WORDS), sourceSentence: words.slice(2, 12).join(" ") };
  const result = flagged(await analyseWith(withOwn(), [renewal, part]));

  assert.equal(result.flags.length, 1);
  assert.deepEqual(tabCounts(result), { mustChange: 1, worthRaising: 0 });
});

test("flags on different sentences are never merged", async () => {
  const result = flagged(await analyseWith(withOwn(), [planted(RENEWAL), planted(ARBITRATION)]));

  assert.equal(result.flags.length, 2);
  for (const flag of result.flags) assert.equal(flag.alsoCrosses, undefined);
});
