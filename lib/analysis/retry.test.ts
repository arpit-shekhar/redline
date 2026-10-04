import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse } from "./analyse.ts";
import { ModelCallError, ModelConfigError, type ModelClient, type ModelRequest } from "./model.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "./red-lines.ts";
import { FLAGS_SHAPE_NAME } from "./reply-shapes.ts";
import type { AnalyseInput, AnalysisOutcome } from "./types.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { stubModel } from "../../tests/support/stub-model.ts";

// An analysis that hits a temporary failure is tried once more before the
// reader sees anything. If it still fails, the outcome says what kind of
// failure it was, so the page can tell the reader (FINDINGS.md rank 9:
// "The analysis failed" with no reason, then "Try again" worked).

const contract = loadFixture("adhesion-contract");
const quiet = () => {};

const input: AnalyseInput = {
  text: contract.text,
  documentType: contract.sidecar.documentType,
  redLines: DEFAULT_RED_LINES,
  leverage: DEFAULT_LEVERAGE,
};

// A model whose flags requests go through `onFlags`, given how many flags
// requests came before. Summary requests always get a good reply.
function flagsModel(onFlags: (attempt: number, request: ModelRequest) => Promise<string>) {
  const good = stubModel(contract.sidecar);
  let attempts = 0;
  const model: ModelClient = {
    complete(request) {
      if (request.shape.name !== FLAGS_SHAPE_NAME) return good.complete(request);
      return onFlags(attempts++, request);
    },
  };
  return { model, flagsAttempts: () => attempts };
}

function failed(result: AnalysisOutcome) {
  if (result.outcome !== "failed") throw new Error(`Expected failed, got ${result.outcome}.`);
  return result;
}

test("an unreadable reply is tried once more, and a good second reply is shown", async () => {
  const good = stubModel(contract.sidecar);
  const { model, flagsAttempts } = flagsModel((attempt, request) =>
    attempt === 0 ? Promise.resolve('{"flags": [ {"clauseType": "Autom') : good.complete(request),
  );
  const result = await analyse(input, model, quiet);

  assert.equal(result.outcome, "flagged");
  assert.equal(flagsAttempts(), 2);
});

test("a busy service is tried once more, then reported as busy", async () => {
  const { model, flagsAttempts } = flagsModel(async () => {
    throw new ModelCallError("OpenRouter returned HTTP 429.", { status: 429 });
  });
  const result = failed(await analyse(input, model, quiet));

  assert.equal(result.kind, "busy");
  assert.equal(flagsAttempts(), 2);
});

test("a fault at the service is tried once more, then reported as unavailable", async () => {
  const { model, flagsAttempts } = flagsModel(async () => {
    throw new ModelCallError("OpenRouter returned HTTP 502.", { status: 502 });
  });
  const result = failed(await analyse(input, model, quiet));

  assert.equal(result.kind, "unavailable");
  assert.equal(flagsAttempts(), 2);
});

test("a setup problem is not tried again", async () => {
  const { model, flagsAttempts } = flagsModel(async () => {
    throw new ModelConfigError("OPENROUTER_MODEL is missing. Add it to .env.local.");
  });
  const result = failed(await analyse(input, model, quiet));

  assert.equal(result.kind, "not-set-up");
  assert.equal(flagsAttempts(), 1);
});

test("a refused request that is not temporary is not tried again", async () => {
  const { model, flagsAttempts } = flagsModel(async () => {
    throw new ModelCallError("OpenRouter returned HTTP 400.", { status: 400 });
  });
  const result = failed(await analyse(input, model, quiet));

  assert.equal(result.kind, "unavailable");
  assert.equal(flagsAttempts(), 1);
});

test("a model that never replies is not tried again, and is reported as too slow", async () => {
  const { model, flagsAttempts } = flagsModel(() => new Promise<string>(() => {}));
  const result = failed(await analyse(input, model, quiet, 30));

  assert.equal(result.kind, "timed-out");
  assert.equal(flagsAttempts(), 1);
});

test("the second try stops at the same time limit as the first", async () => {
  const { model, flagsAttempts } = flagsModel((attempt) =>
    attempt === 0
      ? new Promise((resolve) => setTimeout(() => resolve("not JSON"), 20))
      : new Promise<string>(() => {}),
  );
  const started = Date.now();
  const result = failed(await analyse(input, model, quiet, 80));

  assert.equal(result.kind, "timed-out");
  assert.equal(flagsAttempts(), 2);
  assert.ok(Date.now() - started < 1000, "the second try ran past the time limit");
});

test("the first try's other request is cancelled before the second try starts", async () => {
  const signals: AbortSignal[] = [];
  let flagsAttempts = 0;
  const good = stubModel(contract.sidecar);
  const model: ModelClient = {
    complete(request) {
      if (request.shape.name === FLAGS_SHAPE_NAME) {
        return flagsAttempts++ === 0
          ? Promise.reject(new ModelCallError("Could not reach OpenRouter."))
          : good.complete(request);
      }
      if (request.signal) signals.push(request.signal);
      // The first summary request never replies on its own.
      return signals.length === 1
        ? new Promise<string>((_, reject) =>
            request.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
          )
        : good.complete(request);
    },
  };
  const result = await analyse(input, model, quiet);

  assert.equal(result.outcome, "flagged");
  assert.equal(signals[0]?.aborted, true);
});
