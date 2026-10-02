# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, Supabase for sign-in and the database, deployed on Vercel. Settled in
`CLAUDE.md`; do not reinterpret. The uploaded file is read in the browser and
only its extracted text is stored.

## Users

Freelancers and small business owners holding a document they have not signed
yet: a contract, a lease, a freelance agreement or a set of terms of service
(ADR 0002). They cannot tell which parts will hurt them. Today most sign it
unread, some pay a lawyer $250 to $750, and many paste it into a free AI
chatbot.

They use Redline on desktop and phone equally. Every screen is designed for
both; neither is the secondary case.

## Product Purpose

Show the user which clauses could hurt them, why, and what to send back, before
they sign. This version exists to prove the analysis can be trusted. Nothing
else is a goal yet.

Six capabilities, and only these: a plain-English summary; flags ranked by
severity, each beside its source sentence; a counter-offer for every flag; a
question box that answers only from the document; an editable list of the
user's red lines; a library of past documents.

Success is a user who checks a flag against their own copy of the document,
finds it correct, and acts on it.

## Positioning

Every flag sits beside its source sentence, quoted word for word from the
document and checked against the stored text before it is shown. A flag whose
sentence cannot be found is dropped, and the user is told how many were
dropped. Free chatbots have been caught rewriting contract wording without
saying so. Redline cannot do that unnoticed, because the user can always see
and search the original sentence.

## Operating Context

- The user arrives holding a document, usually a PDF or Word file sent by the
  other side, sometimes text in an email body.
- They are deciding whether to sign, and what to push back on, often against a
  deadline.
- They compare Redline's reading against their own copy of the document.
- The counter-offer leaves Redline: it is copied into an email to the other
  side.

## Capabilities and Constraints

- Vocabulary is defined in `CONTEXT.md` and is binding in product copy: flag,
  source sentence, must-change, worth-raising, counter-offer, red line,
  library, leverage, clean result.
- Severity has exactly two levels, must-change and worth-raising, ranked by how
  hard a clause is to get out of once signed (ADR 0003).
- A clean document returns a clean result: a statement that it is clean plus
  the list of what was checked. Never an empty screen (ADR 0004).
- Leverage (whether the user can walk away) is asked once and stored with the
  red lines. It sets the tone of every counter-offer (ADR 0005).
- Scanned documents are refused, not attempted. There is no OCR.
- Out of scope: payments, billing, sharing documents between users, helping
  people who have already signed, flagging what a document is missing.
- Undecided: price. No pricing exists and none may be shown.

## Brand Commitments

- Name: Redline. "Red line" as two words is the user's own rule; one word is
  the product. Never use "redline" for a counter-offer.
- Voice: plain English, readable by a smart person outside law on first read.
  No unexplained legal terms.
- What the document says (a text claim) is stated plainly, without hedging.
  What it might do to the user (an outcome claim) is always marked uncertain
  (ADR 0004).
- Redline reads documents. It never presents itself as a lawyer or as legal
  advice. Asked whether a clause is legal or enforceable, it says the document
  alone cannot answer that.

## Evidence on Hand

- User research with sourced, verbatim quotes from real people:
  `research/summary.md` and the agent files beside it.
- No customers, testimonials, reviews, accuracy figures or press exist. Do not
  invent any. The quality targets in `PRD.md` section 4 are goals, not
  results.
- No logo or other brand assets exist.

## Product Principles

1. Let the user check us, not trust us. Every claim that can be checked shows
   what it can be checked against.
2. Withhold rather than guess. A flag, answer or quote that cannot be verified
   is not shown, and the user is told something was withheld.
3. Say plainly what is certain and mark what is not. Never blur the two.
4. Give the user something to do. A flag without a counter-offer only explains
   a loss.
5. Silence is never a result. A clean document shows its checklist; a failed
   analysis says it failed.

## Accessibility & Inclusion

WCAG 2.2 AA.
