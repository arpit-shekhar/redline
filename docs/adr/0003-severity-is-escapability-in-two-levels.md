---
status: accepted
---

# 0003. Severity means escapability, in exactly two levels

A clause is dangerous when it is hard to get out of, not when it is unusual or
merely expensive. Severity ranks primarily on escapability — can the user leave
without paying or waiting — with money at stake acting as a multiplier rather
than the axis itself. Severity has exactly two values: **must-change** and
**worth-raising**.

The evidence drove this. Nothing that hurt a real person in the research was
financially large: £95 to cancel Adobe, $30 a month to pause a gym membership, a
"within 50 miles" cancellation clause reinterpreted to mean 80 miles. Every one
was a trap they could not exit. Ranking by dollars would have missed all of
them.

Two levels rather than three because three-level scales collapse — everything
becomes medium, and medium means nothing. Two levels force the analysis to make
the call the user actually came for: is this bad enough to push back on? The
worth-raising level is where uncertainty lives, which keeps hedged language out
of the must-change level.

## Considered options

- **Rank by money at stake.** Rejected: would have missed every documented case.
- **Rank by one-sidedness, or by deviation from what is standard.** Rejected:
  both measure whether a clause is *unusual*, which is exactly what severity is
  not. An unusual clause you can walk away from tomorrow is just unusual.
- **Three levels (high/medium/low), as Pact and most tools use.** Rejected as
  above.

## Scope of what gets flagged

Version 1 detects all eight clause types ranked in `research/summary.md`, across
all four document types. **This is the widest available option and was chosen
over a narrower alternative** (going deep on the exit-trap family alone —
auto-renewal, cancellation terms, notice periods, early-termination fees —
which is the only family with verified pain at scale and the only one present in
every first-person account in the research).

The reasoning for choosing breadth here is the user's and is not yet recorded.
Two consequences should be weighed against it:

- The research states its own eight-row ranking is **not comparable across
  rows** — some rows are complaint counts, some are survey results, some are
  dollar totals — and labels row 8 "least measured, not least damaging." The
  ranking is a judgement call, not a measurement, and severity now rests on it.
- Eight clause types across four document types is 32 combinations, each
  requiring detection, severity calibration, and a drafted counter-offer, and
  each bound by ADR 0001 to produce an exact source sentence or be a bug.
