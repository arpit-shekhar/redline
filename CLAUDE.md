# Redline

A web app. Someone uploads a contract, lease, freelance agreement, or terms of
service and gets back an analysis they can trust. This version exists to prove
the analysis is trustworthy. Nothing else is a goal yet.

## Build these, then stop

1. Plain-English summary of the document.
2. Clauses that could hurt the user, ranked by severity, each showing the exact
   sentence it came from.
3. A drafted counter-offer for every flagged clause.
4. A question box that answers only from the uploaded document.
5. An editable list of the user's own red lines, which drives the analysis.
6. A saved library of their past documents.

Excluded on purpose: payments, billing, OCR (reading scanned images as text),
and sharing a document between users. None of them make the analysis more
trustworthy, and OCR actively undermines it — a citation is worthless when the
text it points at was misread. If something looks like the obvious next step
and is not on the list above, ask me before building it.

## Settled — do not reinterpret these

- Next.js, Supabase for sign-in and database, deployed on Vercel.
- The uploaded file is parsed in the browser. Only the extracted text is stored,
  never the file itself.
- Every risk flag cites the exact sentence it came from. A flag whose source
  sentence cannot be shown is a bug, not a limitation to work around.
- The product calls its model through OpenRouter. Use `anthropic/claude-opus-5`,
  pinned in one module so there is a single place to change it. Confirm that
  exact name against OpenRouter's live model list the first time you call it.
  Do not switch models without asking me.

## Standing rules

- Keep credentials in `.env.local`, which is gitignored. Never commit a secret:
  a key is public the moment it is pushed and has to be rotated.
- State only what the document says. Where the text does not support a claim,
  the product does not make it.
- Ask me before adding a dependency. Exception: whatever `create-next-app`, the
  Supabase client, and an OpenRouter call normally install is already approved.

## When I am not watching

- Blocked on a decision? Append the question to `DECISIONS.md`, move to work
  that is not blocked, and keep building. Never guess on anything in the two
  sections above — those are settled, and a wrong guess there wastes the run.
- Supabase is a hosted project. I supply its URL and keys in `.env.local`.
  Until they are there, treat the database as unreachable and build around it.

## Read these when they matter

- `research/summary.md` — the user research. Read it before deciding what the
  product should do.
- `PRD.md`, once it exists — the brief. Read it before building.

## Agent skills

Issue tracking, triage labels, and background reading: `docs/agents/`.
