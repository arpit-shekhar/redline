# Redline

A web app. Someone uploads a contract, lease, freelance agreement or terms of
service and gets back an analysis they can trust. This version exists to prove
the analysis is trustworthy. Nothing else is a goal yet.

## Build these, then stop

1. A plain-English summary of the document.
2. Clauses that could hurt the user, ranked by severity, each showing the exact
   sentence it came from.
3. A drafted counter-offer for every flagged clause.
4. A question box that answers only from the uploaded document.
5. An editable list of the user's own red lines, which drives the analysis.
6. A saved library of their past documents.

Excluded on purpose: payments, billing, OCR (reading scanned images as text)
and sharing documents between users. None make the analysis more trustworthy,
and OCR undermines it: a citation is worthless when its text was misread. If
something not on the list looks like the obvious next step, ask me first.

## Settled: do not reinterpret

- Next.js, Supabase for sign-in and database, deployed on Vercel.
- The uploaded file is parsed in the browser. Only its extracted text is stored.
- Every risk flag cites the exact sentence it came from. A flag whose source
  sentence cannot be shown is a bug, not a limitation to work around.
- OpenRouter, model `anthropic/claude-sonnet-5`, pinned in one module. Check the
  name against OpenRouter's live list on first call. Never switch without asking.
- The decision records in `docs/adr/` are binding, including 0002 although it
  says `proposed`. Where the PRD or spec disagrees with one, the record wins.

## Standing rules

- Keep credentials in `.env.local`, which is gitignored. Never commit a secret:
  a key is public the moment it is pushed and has to be rotated.
- You cannot read `.env.local`. To check a key is set, run code that reports
  present or missing. Never print a key's value.
- This repo is public. Never commit text from a real person's contract; write
  test documents yourself. Never `git add -f` anything under `.scratch/`.
- State only what the document says. Where the text does not support a claim,
  the product does not make it.
- Ask me before adding a dependency. Already approved: what `create-next-app`,
  the Supabase client and an OpenRouter call normally install.
- All copy a user reads in this product, meaning the landing page, UI labels,
  error messages and empty states, has to be run through the humanizer skill
  before it is committed. Copy that reads as though a model wrote it is a
  defect, not a matter of taste.

## When I am not watching

- Blocked on a decision? Append the question to `DECISIONS.md` (create it if
  missing; quote no contract text), move to unblocked work, and keep going.
  Never guess on anything under "Settled" or "Standing rules".
- Supabase is hosted. I put its URL and keys in `.env.local`. Until they are
  there, treat the database as unreachable and build around it.

## Read these when they matter

- `research/summary.md`: user research. Read it before deciding what the
  product should do. A "Round 2 update" block overrides the text above it.
- `PRD.md`, the brief, before building. `docs/specs/v1.md`, the spec, before
  starting a feature. `CONTEXT.md`, the vocabulary: use its terms.
- `docs/agents/`: where issues live and how they are labelled.
