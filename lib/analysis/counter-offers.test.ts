import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse } from "./analyse.ts";
import type { ModelRequest } from "./model.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "./red-lines.ts";
import { FLAGS_SHAPE_NAME, SUMMARY_SHAPE } from "./reply-shapes.ts";
import { toneFor, type AnalyseInput, type FlaggedResult, type Leverage } from "./types.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { flagsFrom, stubModel, type FlagPayload } from "../../tests/support/stub-model.ts";

// Counter-offers, tested through Analyse with only the model stubbed. The
// stub sends one flag per planted clause of the written test contract, each
// with the counter-offer the answer key records for it.

const contract = loadFixture("adhesion-contract");
const planted = contract.sidecar.planted;

function inputWith(leverage: Leverage | null): AnalyseInput {
  return {
    text: contract.text,
    documentType: contract.sidecar.documentType,
    redLines: DEFAULT_RED_LINES,
    leverage,
  };
}

async function flaggedRun(leverage: Leverage | null, flags?: FlagPayload[]) {
  const model = stubModel(contract.sidecar, {
    builders: flags ? { [FLAGS_SHAPE_NAME]: () => ({ flags }) } : {},
  });
  const logs: string[] = [];
  const result = await analyse(inputWith(leverage), model, (line) => logs.push(line));
  return { result, requests: model.requests, logs };
}

function flagged(result: Awaited<ReturnType<typeof analyse>>): FlaggedResult {
  assert.equal(result.outcome, "flagged");
  return result as FlaggedResult;
}

function requestFor(requests: ModelRequest[], shapeName: string): ModelRequest {
  const found = requests.filter((request) => request.shape.name === shapeName);
  assert.equal(found.length, 1, `expected one "${shapeName}" request`);
  return found[0];
}

// The parts of a request that reach the model.
const sent = ({ system, prompt, shape }: ModelRequest) => JSON.stringify({ system, prompt, shape });

test("every flag in an analysis has a non-empty counter-offer for its own clause", async () => {
  for (const leverage of [null, "can-walk-away", "cannot-walk-away"] as const) {
    const analysis = flagged((await flaggedRun(leverage)).result);
    assert.equal(analysis.flags.length, planted.length);
    for (const flag of analysis.flags) {
      assert.equal(typeof flag.counterOffer, "string");
      assert.notEqual(flag.counterOffer.trim(), "");
      const clause = planted.find((c) => c.sourceSentence === flag.sourceSentence);
      assert.ok(clause, `no planted clause for ${flag.clauseType}`);
      assert.equal(flag.counterOffer, clause.counterOffer);
    }
  }
});

test("the analysis says which tone it used and which leverage answer it came from", async () => {
  const firm = flagged((await flaggedRun("can-walk-away")).result);
  assert.equal(firm.counterOfferTone, "firm");
  assert.equal(firm.leverage, "can-walk-away");

  const request = flagged((await flaggedRun("cannot-walk-away")).result);
  assert.equal(request.counterOfferTone, "request");
  assert.equal(request.leverage, "cannot-walk-away");

  const unanswered = flagged((await flaggedRun(DEFAULT_LEVERAGE)).result);
  assert.equal(unanswered.counterOfferTone, "request");
  assert.equal(unanswered.leverage, null);
});

test("an unanswered leverage question gets requests, the safer tone", () => {
  assert.equal(DEFAULT_LEVERAGE, null);
  assert.equal(toneFor(null), "request");
  assert.equal(toneFor("cannot-walk-away"), "request");
  assert.equal(toneFor("can-walk-away"), "firm");
});

test("the leverage answer reaches the flags request, and only that request", async () => {
  const canWalk = (await flaggedRun("can-walk-away")).requests;
  const cannotWalk = (await flaggedRun("cannot-walk-away")).requests;
  const unanswered = (await flaggedRun(null)).requests;

  // What the model is asked for the flags changes with the answer.
  assert.notEqual(
    sent(requestFor(canWalk, FLAGS_SHAPE_NAME)),
    sent(requestFor(cannotWalk, FLAGS_SHAPE_NAME)),
  );
  // Unanswered is asked for exactly as "cannot walk away" is.
  assert.equal(
    sent(requestFor(unanswered, FLAGS_SHAPE_NAME)),
    sent(requestFor(cannotWalk, FLAGS_SHAPE_NAME)),
  );
  // The summary does not depend on leverage.
  assert.equal(
    sent(requestFor(canWalk, SUMMARY_SHAPE.name)),
    sent(requestFor(cannotWalk, SUMMARY_SHAPE.name)),
  );
});

test("one counter-offer is asked for per flag, in the same request as the flag", async () => {
  const { requests } = await flaggedRun("can-walk-away");
  assert.equal(requests.length, 2, "one summary request and one flags request, nothing more");

  const shape = requestFor(requests, FLAGS_SHAPE_NAME).shape.schema as {
    properties: { flags: { items: { properties: Record<string, { type: string }>; required: string[] } } };
  };
  const item = shape.properties.flags.items;
  assert.equal(item.properties.counterOffer.type, "string", "a single version, not a list");
  assert.ok(item.required.includes("counterOffer"));
});

test("a flag with an empty, blank or missing counter-offer is held back and counted", async () => {
  const withEmpty = flagsFrom(contract.sidecar).map((flag, index) => {
    if (index === 0) return { ...flag, counterOffer: "" };
    if (index === 2) return { ...flag, counterOffer: "  \n " };
    if (index === 3) {
      const partial: Partial<FlagPayload> = { ...flag };
      delete partial.counterOffer;
      return partial as FlagPayload;
    }
    return flag;
  });
  const { result, logs } = await flaggedRun("cannot-walk-away", withEmpty);

  const analysis = flagged(result);
  assert.equal(analysis.dropped, 3);
  assert.equal(analysis.flags.length, planted.length - 3);
  for (const flag of analysis.flags) assert.notEqual(flag.counterOffer.trim(), "");
  assert.ok(logs.some((line) => line.includes("no counter-offer")));
});

test("when no flag has a counter-offer, nothing is shown and the result is not clean", async () => {
  const none = flagsFrom(contract.sidecar).map((flag) => ({ ...flag, counterOffer: "" }));
  const { result } = await flaggedRun("can-walk-away", none);

  assert.equal(result.outcome, "withheld");
  if (result.outcome !== "withheld") return;
  assert.equal(result.withheld, planted.length);
});

test("space around a counter-offer is trimmed", async () => {
  const padded = flagsFrom(contract.sidecar).map((flag) => ({
    ...flag,
    counterOffer: `\n  ${flag.counterOffer}  \n`,
  }));
  const analysis = flagged((await flaggedRun("can-walk-away", padded)).result);
  for (const flag of analysis.flags) {
    const clause = planted.find((c) => c.sourceSentence === flag.sourceSentence);
    assert.equal(flag.counterOffer, clause?.counterOffer);
  }
});
