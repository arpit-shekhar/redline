import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse, AnalysisFailedError } from "./analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "./red-lines.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import { stubModel, summaryFrom } from "../../tests/support/stub-model.ts";

// Analyse is tested at its edges: a document goes in, an analysis comes out.
// The model is a stub built from the fixture's answer key, so no key is needed
// and the live model is never called.

const contract = loadFixture("adhesion-contract");

const input = {
  text: contract.text,
  documentType: contract.sidecar.documentType,
  redLines: DEFAULT_RED_LINES,
  leverage: DEFAULT_LEVERAGE,
};

test("returns the summary from the model's reply", async () => {
  const analysis = await analyse(input, stubModel(contract.sidecar));

  assert.equal(analysis.summary, summaryFrom(contract.sidecar));
});

test("sends the whole document text with every request to the model", async () => {
  const model = stubModel(contract.sidecar);
  await analyse(input, model);

  assert.ok(model.requests.length > 0);
  for (const request of model.requests) {
    assert.ok(request.prompt.includes(contract.text));
  }
});

test("asks the model for every reply in a fixed JSON shape", async () => {
  const model = stubModel(contract.sidecar);
  await analyse(input, model);

  for (const { shape } of model.requests) {
    assert.equal(typeof shape.name, "string");
    assert.equal(shape.schema.type, "object");
  }
});

test("trims space around the summary", async () => {
  const model = stubModel(contract.sidecar, {
    builders: { summary: () => ({ summary: "\n  It renews by itself.  \n" }) },
  });

  const analysis = await analyse(input, model);
  assert.equal(analysis.summary, "It renews by itself.");
});

test("fails rather than showing anything when the reply is not JSON", async () => {
  await assert.rejects(
    analyse(
      input,
      stubModel(contract.sidecar, { rawReply: "Here is your summary: it is a contract." }),
    ),
    AnalysisFailedError,
  );
});

test("fails when the reply has no summary", async () => {
  for (const payload of [{}, { summary: "   " }, { summary: 42 }, null, ["a"]]) {
    await assert.rejects(
      analyse(input, stubModel(contract.sidecar, { builders: { summary: () => payload } })),
      AnalysisFailedError,
      `payload ${JSON.stringify(payload)} should be refused`,
    );
  }
});

test("passes on a failed model call instead of returning a summary", async () => {
  const failing = {
    async complete(): Promise<string> {
      throw new Error("network down");
    },
  };
  await assert.rejects(analyse(input, failing), /network down/);
});

test("summarises a document with no planted clauses", async () => {
  const clean = loadFixture("clean-document");
  const analysis = await analyse(
    { ...input, text: clean.text, documentType: clean.sidecar.documentType },
    stubModel(clean.sidecar),
  );

  assert.equal(analysis.summary, summaryFrom(clean.sidecar));
});
