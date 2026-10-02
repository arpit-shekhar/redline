import { test } from "node:test";
import assert from "node:assert/strict";
import {
  answer,
  LEGALITY_STATEMENT,
  NOT_ADDRESSED_STATEMENT,
  QuestionNotUsableError,
} from "./answer.ts";
import type { ModelClient } from "./model.ts";
import type { AnswerOutcome } from "./types.ts";
import { loadFixture, type FixtureQuestion } from "../../tests/support/fixtures.ts";
import { stubModel } from "../../tests/support/stub-model.ts";

// Answer is tested at its edges: a document and a question go in, an answer
// or a refusal comes out. The model is a stub built from the fixtures' answer
// keys, so no key is needed and the live model is never called.

const contract = loadFixture("adhesion-contract");
const cleanDocument = loadFixture("clean-document");
const quiet = () => {};

function questionOf(expect: FixtureQuestion["expect"], sidecar = contract.sidecar) {
  const found = sidecar.questions.find((q) => q.expect === expect);
  assert.ok(found, `the answer key has a ${expect} question`);
  return found;
}

const answered = questionOf("answered") as Extract<FixtureQuestion, { expect: "answered" }>;
const notAddressed = questionOf("not-addressed");
const legality = questionOf("legality");

function ask(question: string, model: ModelClient, text = contract.text) {
  return answer(text, question, { model, log: quiet });
}

// Nothing from the model's own words may appear anywhere in a refusal.
function assertRefusalCarries(outcome: AnswerOutcome, sneaked: string) {
  assert.ok(!("answer" in outcome), "a refusal carries no answer");
  assert.ok(!("passage" in outcome), "a refusal carries no passage");
  assert.ok(!JSON.stringify(outcome).includes(sneaked));
}

test("an answered question returns the answer and its passage, found in the document", async () => {
  const outcome = await ask(answered.question, stubModel(contract.sidecar));

  assert.equal(outcome.outcome, "answered");
  if (outcome.outcome !== "answered") return;
  assert.equal(outcome.answer, answered.answer);
  assert.equal(outcome.passage, answered.expectedPassage);
  const { start, end } = outcome.passageLocation;
  assert.equal(contract.text.slice(start, end), outcome.passage);
  assert.equal(start, contract.text.indexOf(answered.expectedPassage));
});

test("the passage location comes from the document, whatever spacing the model quoted", async () => {
  const model = stubModel(contract.sidecar, {
    builders: {
      answer: () => ({
        outcome: "answered",
        answer: answered.answer,
        passage: `  ${answered.expectedPassage.replace(/ /g, "\n  ")}  `,
      }),
    },
  });

  const outcome = await ask(answered.question, model);
  assert.equal(outcome.outcome, "answered");
  if (outcome.outcome !== "answered") return;
  assert.equal(outcome.passage, answered.expectedPassage);
});

test("a passage with one word silently changed is withheld as unverified", async () => {
  const changed = answered.expectedPassage.replace("certified mail", "registered mail");
  assert.notEqual(changed, answered.expectedPassage);
  const model = stubModel(contract.sidecar, {
    builders: {
      answer: () => ({ outcome: "answered", answer: answered.answer, passage: changed }),
    },
  });

  const outcome = await ask(answered.question, model);
  assert.equal(outcome.outcome, "unverified");
  assert.ok(!JSON.stringify(outcome).includes(answered.answer), "the answer is not shown");
  assert.ok(!JSON.stringify(outcome).includes("registered mail"));
});

test("an answer with no passage is withheld as unverified", async () => {
  const model = stubModel(contract.sidecar, {
    builders: { answer: () => ({ outcome: "answered", answer: answered.answer, passage: "" }) },
  });

  const outcome = await ask(answered.question, model);
  assert.equal(outcome.outcome, "unverified");
});

test("a question the document does not address gets the plain refusal", async () => {
  const outcome = await ask(notAddressed.question, stubModel(contract.sidecar));

  assert.deepEqual(outcome, { outcome: "not-addressed", statement: NOT_ADDRESSED_STATEMENT });
});

test("the not-addressed refusal carries no answer even when the model sneaks one in", async () => {
  const sneaked = "Most providers let you pause for up to three months.";
  const model = stubModel(contract.sidecar, {
    builders: {
      answer: () => ({
        outcome: "not-addressed",
        answer: sneaked,
        passage: "Kestrelmoor",
      }),
    },
  });

  const outcome = await ask(notAddressed.question, model);
  assert.equal(outcome.outcome, "not-addressed");
  assertRefusalCarries(outcome, sneaked);
});

test("the clean document's unaddressed question gets the plain refusal", async () => {
  const question = questionOf("not-addressed", cleanDocument.sidecar);
  const outcome = await ask(question.question, stubModel(cleanDocument.sidecar), cleanDocument.text);

  assert.deepEqual(outcome, { outcome: "not-addressed", statement: NOT_ADDRESSED_STATEMENT });
});

test("a legality question gets the legality refusal", async () => {
  const outcome = await ask(legality.question, stubModel(contract.sidecar));

  assert.deepEqual(outcome, { outcome: "legality", statement: LEGALITY_STATEMENT });
});

test("a legality question is refused even when the model answers it from the document", async () => {
  const sneaked = "Yes, it is enforceable because the document says it is final and binding.";
  const model = stubModel(contract.sidecar, {
    builders: {
      answer: () => ({
        outcome: "answered",
        answer: sneaked,
        passage: "will be resolved exclusively by final and binding arbitration",
      }),
    },
  });

  const outcome = await ask(legality.question, model);
  assert.equal(outcome.outcome, "legality");
  assertRefusalCarries(outcome, sneaked);
});

test("a legality question worded without legal terms is refused when the model says so", async () => {
  const question = "Would a court in California uphold the arbitration clause?";
  const model = stubModel(contract.sidecar, {
    builders: {
      answer: () => ({ outcome: "legality", answer: "Courts often do.", passage: "" }),
    },
  });

  const outcome = await ask(question, model);
  assert.equal(outcome.outcome, "legality");
  assertRefusalCarries(outcome, "Courts often do.");
});

test("an ordinary question that mentions legal fees still gets an answer", async () => {
  const passage = "including attorneys’ fees";
  const model = stubModel(contract.sidecar, {
    builders: {
      answer: () => ({ outcome: "answered", answer: "You pay them.", passage }),
    },
  });

  const outcome = await ask("Who pays the legal fees if a customer sues?", model);
  assert.equal(outcome.outcome, "answered");
});

test("a model that throws gives the failure outcome", async () => {
  const model: ModelClient = {
    async complete() {
      throw new Error("Connection reset.");
    },
  };

  const outcome = await ask(answered.question, model);
  assert.equal(outcome.outcome, "failed");
  assert.ok(!("answer" in outcome));
});

test("a reply that is not JSON gives the failure outcome", async () => {
  const outcome = await ask(
    answered.question,
    stubModel(contract.sidecar, { rawReply: "You need to give 90 days' notice." }),
  );
  assert.equal(outcome.outcome, "failed");
});

test("a reply with an unknown outcome or no answer text gives the failure outcome", async () => {
  for (const payload of [
    { outcome: "maybe", answer: "", passage: "" },
    { outcome: "answered", answer: " ", passage: answered.expectedPassage },
  ]) {
    const model = stubModel(contract.sidecar, { builders: { answer: () => payload } });
    const outcome = await ask(answered.question, model);
    assert.equal(outcome.outcome, "failed", JSON.stringify(payload));
  }
});

test("a model that does not reply in time gives the failure outcome", async () => {
  const model: ModelClient = {
    complete: ({ signal }) =>
      new Promise((_, reject) => signal?.addEventListener("abort", () => reject(signal.reason))),
  };

  const outcome = await answer(contract.text, answered.question, {
    model,
    log: quiet,
    timeoutMs: 20,
  });
  assert.equal(outcome.outcome, "failed");
});

test("an empty or too-long question is refused before the model is called", async () => {
  const model = stubModel(contract.sidecar);
  await assert.rejects(ask("   ", model), QuestionNotUsableError);
  await assert.rejects(ask("Why? ".repeat(200), model), QuestionNotUsableError);
  assert.equal(model.requests.length, 0);
});

test("sends the whole document and the question to the model in the answer shape", async () => {
  const model = stubModel(contract.sidecar);
  await ask(answered.question, model);

  assert.equal(model.requests.length, 1);
  const [request] = model.requests;
  assert.equal(request.shape.name, "answer");
  assert.ok(request.prompt.includes(contract.text));
  assert.ok(request.prompt.includes(answered.question));
});
