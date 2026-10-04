import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse as analyseOutcome } from "./analyse.ts";
import { isHedged, isMarkedUncertain } from "./check-flags.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "./red-lines.ts";
import { FLAGS_SHAPE_NAME } from "./reply-shapes.ts";
import { SEVERITIES, type AnalyseInput, type Flag } from "./types.ts";
import { loadFixture } from "../../tests/support/fixtures.ts";
import {
  flagsFrom,
  stubModel,
  type FlagPayload,
} from "../../tests/support/stub-model.ts";

// Flags are tested through Analyse, with only the model stubbed. The stub
// sends flags built from the answer key of the written test contract; some
// tests change one flag first to see what the check does with it.

const contract = loadFixture("adhesion-contract");
const planted = contract.sidecar.planted;

const input: AnalyseInput = {
  text: contract.text,
  documentType: contract.sidecar.documentType,
  redLines: DEFAULT_RED_LINES,
  leverage: DEFAULT_LEVERAGE,
};

const quiet = () => {};

// What these tests look at: the flags shown and how many were held back.
// A clean result shows none and held none back; a withheld one held them all
// back. A failed analysis fails the test.
type Checked = { flags: Flag[]; dropped: number };

async function analyse(...args: Parameters<typeof analyseOutcome>): Promise<Checked> {
  const result = await analyseOutcome(...args);
  switch (result.outcome) {
    case "flagged":
      return { flags: result.flags, dropped: result.dropped };
    case "clean":
      return { flags: [], dropped: 0 };
    case "withheld":
      return { flags: [], dropped: result.withheld };
    case "failed":
      assert.fail(`the analysis failed: ${result.reason}`);
  }
}

// Runs Analyse with the stub sending exactly these flags.
function analyseWith(
  flags: FlagPayload[],
  options: { log?: (message: string) => void; input?: AnalyseInput } = {},
): Promise<Checked> {
  const model = stubModel(contract.sidecar, {
    builders: { [FLAGS_SHAPE_NAME]: () => ({ flags }) },
  });
  return analyse(options.input ?? input, model, options.log ?? quiet);
}

// The answer key's flags with one of them changed.
function withChange(
  clauseType: string,
  change: (flag: FlagPayload) => Partial<FlagPayload>,
  index = 0,
): FlagPayload[] {
  let seen = -1;
  return flagsFrom(contract.sidecar).map((flag) => {
    if (flag.clauseType !== clauseType || ++seen !== index) return flag;
    return { ...flag, ...change(flag) };
  });
}

const RENEWAL = "Automatic renewal";
const LATE_FEES = "Late fees and penalties";
const GUARANTEE = "Personal guarantees";
const ARBITRATION = "Forced arbitration and class-action waivers";

test("returns a flag for every planted clause, with each part in its own field", async () => {
  const analysis = await analyse(input, stubModel(contract.sidecar), quiet);

  assert.equal(analysis.dropped, 0);
  assert.equal(analysis.flags.length, planted.length);
  for (const clause of planted) {
    const flag = analysis.flags.find((f) => f.sourceSentence === clause.sourceSentence);
    assert.ok(flag, `missing: ${clause.clauseType}`);
    assert.deepEqual(Object.keys(flag).sort(), [
      "clauseType",
      "counterOffer",
      "escapabilityReasoning",
      "outcomeClaim",
      "severity",
      "sourceLocation",
      "sourceSentence",
      "textClaim",
    ]);
    assert.equal(flag.clauseType, clause.clauseType);
    assert.equal(flag.severity, clause.expectedSeverity);
    assert.equal(flag.textClaim, clause.textClaim);
    assert.equal(flag.outcomeClaim, clause.outcomeClaim);
    assert.equal(flag.escapabilityReasoning, clause.escapabilityReasoning);
  }
});

test("every source sentence is in the document, at the location the flag gives", async () => {
  const analysis = await analyse(input, stubModel(contract.sidecar), quiet);

  for (const flag of analysis.flags) {
    assert.ok(contract.text.includes(flag.sourceSentence), flag.clauseType);
    const { start, end } = flag.sourceLocation;
    assert.equal(contract.text.slice(start, end), flag.sourceSentence);
  }
});

test("every outcome claim is marked uncertain and no text claim is", async () => {
  const analysis = await analyse(input, stubModel(contract.sidecar), quiet);

  assert.ok(analysis.flags.length > 0);
  for (const flag of analysis.flags) {
    assert.ok(isMarkedUncertain(flag.outcomeClaim), flag.outcomeClaim);
    assert.ok(!isHedged(flag.textClaim), flag.textClaim);
  }
});

test("a flag whose outcome claim is stated as certain is held back", async () => {
  const analysis = await analyseWith(
    withChange(RENEWAL, () => ({
      outcomeClaim: "You will be locked in for three more years at higher prices.",
    })),
  );

  assert.equal(analysis.dropped, 1);
  assert.ok(!analysis.flags.some((f) => f.clauseType === RENEWAL));
});

test("a flag whose text claim hedges is held back", async () => {
  const analysis = await analyseWith(
    withChange(GUARANTEE, () => ({
      textClaim: "The person who signs might have to pay the business's debts.",
    })),
  );

  assert.equal(analysis.dropped, 1);
  assert.ok(!analysis.flags.some((f) => f.clauseType === GUARANTEE));
});

test("severity is only ever must-change or worth-raising", async () => {
  const good = await analyse(input, stubModel(contract.sidecar), quiet);
  for (const flag of good.flags) assert.ok(SEVERITIES.includes(flag.severity));

  for (const severity of ["high", "critical", "Must-change", ""]) {
    const analysis = await analyseWith(withChange(LATE_FEES, () => ({ severity })));
    assert.equal(analysis.dropped, 1, `severity "${severity}" should be held back`);
    assert.equal(analysis.flags.length, planted.length - 1);
    for (const flag of analysis.flags) assert.ok(SEVERITIES.includes(flag.severity));
  }
});

// A flag judged on its source sentence alone told readers there was no way
// out when another clause let either side end the agreement (FINDINGS.md,
// finding 1). This checks the instruction is sent; whether the model follows
// it is measured by the eval on tests/fixtures/exit-clauses/.
test("the flags request asks the model to weigh the document's exit clause before judging severity", async () => {
  const model = stubModel(contract.sidecar);
  await analyse(input, model, quiet);

  const request = model.requests.find(({ shape }) => shape.name === FLAGS_SHAPE_NAME);
  assert.ok(request, "a flags request was sent");
  assert.match(request.prompt, /exit clause/i);
  assert.match(request.prompt, /whole document/i);
});

// The reasoning stated the reader's future as fact, such as "once signed there
// is no route to court", while the outcome claim above it said "could"
// (FINDINGS.md, finding 2). This checks the instruction is sent; whether the
// model follows it is measured by the eval on tests/fixtures/certain-outcomes/.
test("the flags request asks for escapability reasoning that marks what could happen to the reader as uncertain", async () => {
  const model = stubModel(contract.sidecar);
  await analyse(input, model, quiet);

  const request = model.requests.find(({ shape }) => shape.name === FLAGS_SHAPE_NAME);
  assert.ok(request, "a flags request was sent");
  const reasoning = request.prompt
    .split("\n")
    .find((line) => line.startsWith("- escapabilityReasoning:"));
  assert.ok(reasoning, "the request describes the escapability reasoning");
  assert.match(reasoning, /may, might or could/);
  assert.match(reasoning, /as fact/i);
  assert.match(reasoning, /court/i);
  assert.match(
    reasoning,
    /Never say there is no way out when the document has an exit clause the person can use\./,
  );
});

// The summary gave the Client's duty to the reader: "You must give and
// respond to two rounds of written feedback" (FINDINGS.md rank 6). Redline
// does not know which party the reader is. This checks the instruction is
// sent; the smoke run on the clean test document shows whether the model
// follows it.
test("the summary request asks the model to name the party each duty belongs to", async () => {
  const model = stubModel(contract.sidecar);
  await analyse(input, model, quiet);

  const request = model.requests.find(({ shape }) => shape.name === "summary");
  assert.ok(request, "a summary request was sent");
  assert.match(request.prompt, /name the party/i);
  assert.match(request.prompt, /do not know which party/i);
  assert.doesNotMatch(request.prompt, /what they must do/);
});

test("must-change flags come first, then worth-raising, each in document order", async () => {
  const analysis = await analyse(input, stubModel(contract.sidecar), quiet);

  // Expected order worked out by hand from the test contract: sections 3.2,
  // 5.1 and 9.2 are must-change; 4.3, 8.1 and 8.2 are worth-raising.
  const position = (sentence: string) => contract.text.indexOf(sentence);
  const expected = [...planted]
    .sort(
      (a, b) =>
        (a.expectedSeverity === "must-change" ? 0 : 1) -
          (b.expectedSeverity === "must-change" ? 0 : 1) ||
        position(a.sourceSentence) - position(b.sourceSentence),
    )
    .map((c) => c.sourceSentence);
  assert.deepEqual(
    analysis.flags.map((f) => f.sourceSentence),
    expected,
  );
  assert.deepEqual(
    analysis.flags.map((f) => f.clauseType),
    [
      RENEWAL,
      GUARANTEE,
      ARBITRATION,
      LATE_FEES,
      "Indemnity and liability caps",
      "Indemnity and liability caps",
    ],
  );
});

test("the same input gives the same order every run, whatever order the model used", async () => {
  const payloads = flagsFrom(contract.sidecar);
  const first = await analyseWith(payloads);
  const orders = [
    payloads,
    [...payloads].reverse(),
    [payloads[3], payloads[0], payloads[5], payloads[1], payloads[4], payloads[2]],
  ];
  for (const order of orders) {
    for (let run = 0; run < 3; run++) {
      assert.deepEqual((await analyseWith(order)).flags, first.flags);
    }
  }
});

test("a quote with its spelling mistake silently corrected is held back and counted", async () => {
  const withTypo = planted.find((c) => c.typoNote)!;
  const analysis = await analyseWith(
    withChange(withTypo.clauseType, () => ({
      sourceSentence: withTypo.typoNote!.corrected,
    })),
  );

  assert.equal(analysis.dropped, 1);
  assert.equal(analysis.flags.length, planted.length - 1);
  assert.ok(!analysis.flags.some((f) => f.clauseType === withTypo.clauseType));
});

test("a quote with straight quote marks where the document has curly ones passes", async () => {
  const straighten = (text: string) =>
    text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const changed = withChange(RENEWAL, (f) => ({ sourceSentence: straighten(f.sourceSentence) }))
    .map((f) =>
      f.clauseType === GUARANTEE ? { ...f, sourceSentence: straighten(f.sourceSentence) } : f,
    );
  assert.notEqual(changed[0].sourceSentence, planted[0].sourceSentence, "the change took");

  const analysis = await analyseWith(changed);

  assert.equal(analysis.dropped, 0);
  // The flag shows the document's own sentence, curly quotes and all.
  for (const type of [RENEWAL, GUARANTEE]) {
    const flag = analysis.flags.find((f) => f.clauseType === type)!;
    const clause = planted.find((c) => c.clauseType === type)!;
    assert.equal(flag.sourceSentence, clause.sourceSentence);
  }
});

test("a quote whose spaces and line breaks differ from the document passes", async () => {
  const arbitration = planted.find((c) => c.clauseType === ARBITRATION)!;
  assert.ok(arbitration.sourceSentence.includes("\n"));

  const analysis = await analyseWith(
    withChange(ARBITRATION, (f) => ({
      sourceSentence: `  ${f.sourceSentence.replace("\n", " ").replace(/, /g, ",   ")}\t`,
    })),
  );

  assert.equal(analysis.dropped, 0);
  const flag = analysis.flags.find((f) => f.clauseType === ARBITRATION)!;
  assert.equal(flag.sourceSentence, arbitration.sourceSentence);
  const { start, end } = flag.sourceLocation;
  assert.equal(contract.text.slice(start, end), arbitration.sourceSentence);
});

test("an invented sentence is held back", async () => {
  const analysis = await analyseWith([
    ...flagsFrom(contract.sidecar),
    {
      clauseType: "Non-competes",
      severity: "must-change",
      sourceSentence:
        "For two years after this Agreement ends, you will not use any other point-of-sale provider.",
      textClaim: "You cannot switch to another provider for two years.",
      outcomeClaim: "You could be stuck with Kestrelmoor after you leave.",
      escapabilityReasoning: "It binds you after the agreement ends.",
      counterOffer: "Would you consider removing this restriction?",
    },
  ]);

  assert.equal(analysis.dropped, 1);
  assert.equal(analysis.flags.length, planted.length);
  assert.ok(!analysis.flags.some((f) => f.clauseType === "Non-competes"));
});

test("letter case and punctuation are not forgiven", async () => {
  const changes = [
    (s: string) => s.toLowerCase(),
    (s: string) => s.replace("Initial Term,", "Initial Term"),
    (s: string) => s.replace("(36)", "36"),
  ];
  for (const change of changes) {
    const analysis = await analyseWith(
      withChange(RENEWAL, (f) => ({ sourceSentence: change(f.sourceSentence) })),
    );
    assert.equal(analysis.dropped, 1);
    assert.ok(!analysis.flags.some((f) => f.clauseType === RENEWAL));
  }
});

// A type nobody asked for is set aside, not held back: the reader did not
// ask Redline to look for it, so it is not something Redline failed to show.
test("a flag of a clause type that was not asked for is not shown and not counted", async () => {
  const analysis = await analyseWith(
    withChange(RENEWAL, () => ({ clauseType: "Hidden fees" })),
  );
  assert.equal(analysis.dropped, 0);
  assert.equal(analysis.flags.length, planted.length - 1);
  assert.ok(!analysis.flags.some((f) => f.clauseType === "Hidden fees"));
});

test("only switched-on red lines are looked for", async () => {
  const redLines = DEFAULT_RED_LINES.map((line) =>
    line.clauseType === RENEWAL ? { ...line, enabled: false } : line,
  );
  const model = stubModel(contract.sidecar);
  const analysis = await analyse({ ...input, redLines }, model, quiet);

  const request = model.requests.find((r) => r.shape.name === FLAGS_SHAPE_NAME)!;
  const asked = JSON.stringify(request.shape.schema);
  assert.ok(!asked.includes(RENEWAL));
  assert.ok(asked.includes(GUARANTEE));
  // The stub still sends a renewal flag; it is not shown, and not counted
  // as held back.
  assert.ok(!analysis.flags.some((f) => f.clauseType === RENEWAL));
  assert.equal(analysis.dropped, 0);
});

test("the eight default red lines are what a first analysis looks for", async () => {
  const model = stubModel(contract.sidecar);
  await analyse(input, model, quiet);

  const request = model.requests.find((r) => r.shape.name === FLAGS_SHAPE_NAME)!;
  const asked = JSON.stringify(request.shape.schema);
  assert.equal(DEFAULT_RED_LINES.length, 8);
  for (const line of DEFAULT_RED_LINES) assert.ok(asked.includes(line.clauseType));
});

test("a flag with a part missing or blank is held back", async () => {
  const missing = flagsFrom(contract.sidecar).map((flag, index) => {
    if (index !== 1) return flag;
    const partial: Partial<FlagPayload> = { ...flag };
    delete partial.escapabilityReasoning;
    return partial as FlagPayload;
  });
  assert.equal((await analyseWith(missing)).dropped, 1);

  const blank = withChange(GUARANTEE, () => ({ textClaim: "   " }));
  assert.equal((await analyseWith(blank)).dropped, 1);
});

test("the same flag sent twice is shown once and nothing is counted as held back", async () => {
  const payloads = flagsFrom(contract.sidecar);
  const analysis = await analyseWith([...payloads, payloads[0]]);
  assert.equal(analysis.flags.length, planted.length);
  assert.equal(analysis.dropped, 0);
});

test("held-back flags are logged by count and clause type, never with document text", async () => {
  const withTypo = planted.find((c) => c.typoNote)!;
  const messages: string[] = [];
  const invented = "You will pay a $500 fee to end this Agreement early.";

  await analyseWith(
    [
      ...withChange(withTypo.clauseType, () => ({
        sourceSentence: withTypo.typoNote!.corrected,
      })),
      { ...flagsFrom(contract.sidecar)[0], sourceSentence: invented },
    ],
    { log: (message) => messages.push(message) },
  );

  assert.equal(messages.length, 1);
  const [message] = messages;
  assert.match(message, /\b2 flags\b/);
  assert.ok(message.includes(withTypo.clauseType));
  assert.ok(message.includes(RENEWAL));
  assert.ok(!message.includes("Fee Sch"), "the quote leaked into the log");
  assert.ok(!message.includes("$500"), "the invented quote leaked into the log");
  for (const clause of planted) {
    assert.ok(!message.includes(clause.sourceSentence.slice(0, 30)));
    assert.ok(!message.includes(clause.textClaim.slice(0, 30)));
  }
});

test("nothing is logged when every flag passes", async () => {
  const messages: string[] = [];
  await analyse(input, stubModel(contract.sidecar), (m) => messages.push(m));
  assert.deepEqual(messages, []);
});

test("a document with nothing planted gets no flags and nothing held back", async () => {
  const clean = loadFixture("clean-document");
  const analysis = await analyse(
    { ...input, text: clean.text, documentType: clean.sidecar.documentType },
    stubModel(clean.sidecar),
    quiet,
  );
  assert.deepEqual(analysis.flags, []);
  assert.equal(analysis.dropped, 0);
});

test("fails rather than showing anything when the flags reply cannot be read", async () => {
  const unreadable = [
    stubModel(contract.sidecar, { rawReplies: { [FLAGS_SHAPE_NAME]: "Here are the flags." } }),
    stubModel(contract.sidecar, { builders: { [FLAGS_SHAPE_NAME]: () => ({}) } }),
    stubModel(contract.sidecar, { builders: { [FLAGS_SHAPE_NAME]: () => ({ flags: "none" }) } }),
  ];
  for (const model of unreadable) {
    const result = await analyseOutcome(input, model, quiet);
    assert.equal(result.outcome, "failed");
    assert.ok(!("flags" in result), "a failed analysis carries no flags");
  }
});
