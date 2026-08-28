# 0001. Every flag cites its source

Status: Accepted — 2026-08-28

## Decision

Every risk flag Redline shows carries the exact sentence from the uploaded
document it came from, displayed beside it. If that sentence cannot be shown,
the flag is a bug — fix it or drop it, never tidy it up later.

## Alternatives

- **No quoting: the model describes each risk in its own words.** Cheapest, and
  the smoothest to read. Rejected: the reader can check none of it, and an
  invented risk looks exactly like a real one.
- **Cite the clause number only ("see Section 7.2").** Less to build. Rejected:
  it sends the reader hunting, and a wrong number looks just as authoritative.
- **Quote a tidied-up, close-enough version.** Reads better. Rejected: it cannot
  be checked against the stored text, so quotes drift with nothing to catch it.

## Why

A reader can take any flag, search their own copy of the document for that
exact sentence, and decide for themselves whether we read it correctly — the
difference between asking them to trust us and letting them check us. It also
gives us a test a machine can run: the quote either appears in the stored text
or it does not, so an invented flag is caught before anyone sees it.

## Consequences

- OCR (reading scanned images as text) stays out and gets harder to add later.
  A citation pointing at misread text is worse than no citation at all.
- We must store the extracted text with enough position information to find and
  highlight the sentence again.
- Model output has to be structured — a flag paired with its quote — and every
  response is checked against that stored text before it is displayed.
- Testing checks that each quote appears word for word in the source. A flag
  that fails that check fails the build; it is not a warning.
- Risks that come from the document as a whole get dropped, or tied to the
  single clearest sentence, rather than weakening the rule.
