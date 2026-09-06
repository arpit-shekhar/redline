---
status: accepted
---

# 0004. Flag generously, speak precisely, and hand a clean document its checklist

Three decisions about how the analysis behaves and how it sounds.

**Missing a real trap is the worse error.** Version 1 errs toward catching
everything, accepting that harmless clauses will sometimes be flagged. The
alternative — never flagging anything harmless, at the cost of missing some real
traps — was recommended and rejected; the reasoning for choosing sensitivity is
the user's and is not yet recorded here.

**Confidence is split by claim type, not softened across the board.** Every flag
contains two different claims. What the clause *says* is a text claim: checkable
against the source sentence, and stated plainly with no hedging. What it *might
do to the user* is an outcome claim: it depends on facts the document does not
contain, and is always marked uncertain. Hedging the first is the useless
hedging worth avoiding; stating the second confidently is what drew the US
Federal Trade Commission's 2024 action against DoNotPay, which ended in a
$193,000 order and a ban on advertising itself as a substitute for a lawyer.

**A clean document gets its checklist, never silence.** When nothing is found,
the result says so and lists what was checked for and not found. A bare "no
flags" reads as the analysis failing rather than the document passing, and the
user has no way to tell those apart. Showing the checklist makes a null result
into visible work — the same instinct as ADR 0001.

## Consequences

- **This pulls against the clean result.** Flagging generously across eight
  clause types and four document types means few documents come back clean, so
  the clean-result experience will rarely fire in practice. The two decisions
  were made in the same round and point in opposite directions.
- **It also pulls against the project's stated purpose.** `CLAUDE.md` says this
  version exists to prove the analysis is trustworthy, and over-flagging is the
  documented way tools in this category lose trust: every flag shows its source
  sentence, so a user can check a false alarm instantly and watch the tool be
  wrong.
- **A mitigation exists and should be used.** ADR 0003 reserves the must-change
  level for near-certain flags. Generous flagging can therefore be routed into
  worth-raising, keeping sensitivity high without spending credibility at the
  level that matters. If sensitivity is allowed to raise the must-change count,
  both this ADR and 0003 are undermined.
- **The checklist reveals coverage.** Showing what was checked also shows what
  was not, making the eight-clause limit visible to users.
