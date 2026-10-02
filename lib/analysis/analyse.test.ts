import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyse, AnalysisFailedError } from "./analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "./red-lines.ts";
import type { Complete } from "./model.ts";

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

const input = {
  text: fixture("freelance-agreement.txt"),
  documentType: "freelance-agreement" as const,
  redLines: DEFAULT_RED_LINES,
  leverage: DEFAULT_LEVERAGE,
};

// Tests run against saved model replies and never call the live model.
const replyWith =
  (reply: string): Complete =>
  async () =>
    reply;

// This reply was written by hand, not recorded from the model, because no
// OpenRouter key existed when it was made. Replace it with a recorded one.
test("returns the summary from the model's reply", async () => {
  const analysis = await analyse(
    input,
    replyWith(fixture("freelance-agreement.summary-reply.txt")),
  );

  assert.match(analysis.summary, /^You agree to design a logo/);
  assert.match(analysis.summary, /even if it has not paid you/);
});

test("sends the document's text to the model", async () => {
  let sent = "";
  await analyse(input, async (request) => {
    sent = request.prompt;
    return '{"summary": "A summary."}';
  });

  assert.ok(sent.includes(input.text));
});

test("fails rather than showing anything when the reply is not JSON", async () => {
  await assert.rejects(
    analyse(input, replyWith("Here is your summary: it is a contract.")),
    AnalysisFailedError,
  );
});

test("fails when the reply has no summary", async () => {
  await assert.rejects(
    analyse(input, replyWith('{"summary": "   "}')),
    AnalysisFailedError,
  );
});
