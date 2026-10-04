import { test } from "node:test";
import assert from "node:assert/strict";
import { toneLine } from "./tone-line.ts";

// The line under the flag count. A library copy is never redrafted, so it
// must not send the reader to Red lines as if changing their answer would
// change it (FINDINGS.md rank 4).

test("a new result offers to change the answer in Red lines", () => {
  const line = toneLine({ tone: "firm", leverage: "can-walk-away", view: { kind: "new", account: "signed-in" } });
  assert.equal(
    line.text,
    "Each counter-offer is worded firmly, because you said you could walk away from deals like this.",
  );
  assert.deepEqual(line.link, { href: "/red-lines", label: "Change your answer in Red lines" });
});

test("a saved copy whose reader has since changed their answer says so and does not send them to Red lines", () => {
  const line = toneLine({
    tone: "firm",
    leverage: "can-walk-away",
    view: { kind: "saved", currentLeverage: "cannot-walk-away" },
  });
  assert.match(line.text, /^When Redline read this, you had said you could walk away/);
  assert.match(line.text, /Your answer is now that you cannot walk away\./);
  assert.match(line.text, /Redline has not redrafted these counter-offers/);
  assert.deepEqual(line.link, { href: "/try", label: "Check the document again" });
});

test("a saved copy whose answer has not changed shows only what it followed, with no link", () => {
  const line = toneLine({
    tone: "request",
    leverage: "cannot-walk-away",
    view: { kind: "saved", currentLeverage: "cannot-walk-away" },
  });
  assert.equal(
    line.text,
    "When Redline read this, you had said you could not walk away from deals like this, so each counter-offer is worded as a request.",
  );
  assert.equal(line.link, null);
});

test("a saved copy from before the reader answered counts a later answer as a change", () => {
  const line = toneLine({
    tone: "request",
    leverage: null,
    view: { kind: "saved", currentLeverage: "can-walk-away" },
  });
  assert.match(line.text, /^When Redline read this, you had not said whether you could walk away/);
  assert.match(line.text, /Your answer is now that you can walk away\./);
  assert.equal(line.link?.href, "/try");
});

test("a saved copy makes no claim about a change when today's answer cannot be read", () => {
  const line = toneLine({
    tone: "firm",
    leverage: "can-walk-away",
    view: { kind: "saved", currentLeverage: "unknown" },
  });
  assert.doesNotMatch(line.text, /now|redrafted/);
  assert.equal(line.link, null);
});

// Signed out, the Red lines page does not show the leverage question, so a
// link there sends the reader to a question they cannot reach (FINDINGS.md
// rank 10).
test("a signed-out reader is told to sign in to answer, not sent to Red lines", () => {
  const line = toneLine({
    tone: "request",
    leverage: null,
    view: { kind: "new", account: "signed-out" },
  });
  assert.equal(
    line.text,
    "Each counter-offer is worded as a request, because Redline does not know whether you could walk away.",
  );
  assert.deepEqual(line.link, { href: "/sign-in", label: "Sign in to answer that" });
});

test("where Redline has no sign-in, the line has no link", () => {
  const line = toneLine({
    tone: "request",
    leverage: null,
    view: { kind: "new", account: "none" },
  });
  assert.equal(line.link, null);
});

test("a signed-in reader who has not answered is sent to Red lines", () => {
  const line = toneLine({
    tone: "request",
    leverage: null,
    view: { kind: "new", account: "signed-in" },
  });
  assert.deepEqual(line.link, { href: "/red-lines", label: "Answer that in Red lines" });
});
