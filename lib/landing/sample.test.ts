import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_CLAUSES, SAMPLE_FLAGS } from "./sample.ts";

// The landing page demonstrates the source sentence rule, so its own demo has
// to obey it.
test("every sample flag quotes its clause word for word", () => {
  for (const flag of SAMPLE_FLAGS) {
    const clause = SAMPLE_CLAUSES.find((c) => c.number === flag.clause);
    assert.ok(clause, `flag ${flag.rank} points at a missing clause`);
    assert.ok(
      clause.text.includes(flag.sentence),
      `flag ${flag.rank}'s sentence is not in clause ${flag.clause}`,
    );
  }
});

test("sample flags are ranked must-change first, then by position", () => {
  const order = (severity: string) => (severity === "must-change" ? 0 : 1);
  const sorted = [...SAMPLE_FLAGS].sort(
    (a, b) => order(a.severity) - order(b.severity) || a.clause - b.clause,
  );
  assert.deepEqual(
    SAMPLE_FLAGS.map((f) => f.rank),
    sorted.map((f) => f.rank),
  );
  assert.deepEqual(
    SAMPLE_FLAGS.map((f) => f.rank),
    SAMPLE_FLAGS.map((_, i) => i + 1),
  );
});

test("each clause carries at most one flag", () => {
  const clauses = SAMPLE_FLAGS.map((f) => f.clause);
  assert.equal(new Set(clauses).size, clauses.length);
});
