# Build report: Redline v1, unattended run of 2 October 2026

All ten buildable tickets were built and committed on the branch `build/v1`.
Nine are done. Ticket 09 is blocked until a Supabase project exists. Nothing
has run against the real model, because `OPENROUTER_MODEL` is not set
anywhere.

## Where things stand

| Check | Result |
|---|---|
| `npm run build` | Passes. |
| `npm test` | 174 tests: 154 pass, 0 fail, 20 skipped. All 20 skipped tests need Supabase. |
| `npm run typecheck` | Passes. |
| `npm run smoke` | Built. Stops with "Missing: OPENROUTER_API_KEY, OPENROUTER_MODEL." (see below) |
| Live smoke run | Not run. See "What I could not verify". |

## First commands when you sit down

Run these in `redline/`:

1. Move your env file into the repo folder. Next.js only reads it from
   there:
   `mv ../.env.local .env.local`
2. Add the model name to `.env.local`. It holds `OPENROUTER_API_KEY` but
   not `OPENROUTER_MODEL`. Copy any other names you need from
   `.env.example`.
3. Delete the stray preview page, which I could not delete:
   `rm -r app/zz-preview`
4. Check the setup, then run the fixture contract through the real model:
   `npm test && npm run smoke`
5. Try both leverage tones:
   `npm run smoke -- adhesion-contract can-walk-away` and
   `npm run smoke -- adhesion-contract cannot-walk-away`
6. Count the eval calls, then run the evals:
   `npm run evals -- --plan`, then `npm run evals`
7. When the Supabase project exists, run the three files in
   `supabase/migrations/` in order in its SQL editor. Then run
   `supabase/tests/rls_check.sql`. Make two test accounts by hand, and set
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_TEST_EMAIL`, `SUPABASE_TEST_PASSWORD`,
   `SUPABASE_TEST_EMAIL_2` and `SUPABASE_TEST_PASSWORD_2`. Run `npm test`
   again; the 20 skipped tests should then run. Add
   `<your site>/sign-in/confirm` to Supabase's allowed redirect addresses.
8. Look at the result screens in a browser (`npm run dev`, then `/try`).
   See the screen notes below.

## Tickets

| Ticket | Status | Notes |
|---|---|---|
| Fixtures | done | `tests/fixtures/`: a contract with six planted clauses and an answer key, plus a clean document. All six sentences were checked word for word against the contract. |
| 01 Paste a document, get a summary | done, live check open | The model now comes from `OPENROUTER_MODEL`. The one open criterion is a live summary. |
| 02 Flags beside their source sentences | done | |
| 03 Clean result and honest failure | done | |
| 04 Upload PDF and Word | done | Drag-and-drop and the PDF reader were not tried in a real browser. |
| 08 Question box | done | |
| 05 Library | done | Changed on your instruction; see decision 25. |
| 06 Red lines and leverage | done | |
| 07 Counter-offers | done, tone unseen | Whether live wording sounds firm or polite needs a live run. |
| 09 Supabase storage and sign-in | **blocked** | Fully built. Two criteria need a real project: the storage suite against Supabase, and the two-user isolation test. Both are wired and skipped. No real sign-in has happened. |
| 10 Quality evals | done | Built as `npm run evals`. Never run live. |
| 11 Real review set | not started | `ready-for-human`: it needs real contracts and expert judgement. |

No ticket was sent back to its builder. Each one passed typecheck and the
full test suite the first time I checked it. Ticket statuses and comments
are updated in `.scratch/v1/issues/`, which is gitignored, so those updates
are on your disk only.

## What I could not verify

- **Anything from the live model.** The key is in `../.env.local`, outside
  the repo. `OPENROUTER_MODEL` is set nowhere. I did not pick a model
  myself: `CLAUDE.md` says never to switch without asking, and `CLAUDE.md`,
  the spec and your answer name three different things. So these are all
  unverified:
  - what the summary says;
  - how many flags survive the source sentence check;
  - whether Fireworks accepts a strict JSON-shape reply for your chosen
    model;
  - how the counter-offers sound;
  - every eval number.
- **Anything from Supabase.** This covers the migrations, real sign-up and
  sign-in, saving to the library, the storage suite against Supabase, the
  two-user isolation test, and session renewal in `proxy.ts`.
- **Result screens by eye.** The browser extension was not connected, so no
  builder saw a screen. At the end I took headless Edge screenshots of
  `/try`, `/library`, `/red-lines` and `/sign-in` at 1280px and at a true
  390px. All four fit and match the sheet-on-a-desk look. The flagged,
  clean, withheld and failed result screens only appear after a live
  analysis, so nobody has seen them. They were checked in server-rendered
  HTML only.
- **The humanizer skill was applied by hand by each builder**, from its file
  on disk. It was never run as a skill.

## Decisions made without you

1. **Work happens on a branch called `build/v1`, not `main`.** Vercel deploys
   the live site from `main`. You said the review happens next week, so
   nothing reaches the live address before you have looked at it.
2. **The model is read from `OPENROUTER_MODEL` and no model id appears in
   code.** This follows your answer. It overrides `CLAUDE.md` (which names
   `anthropic/claude-sonnet-5`) and tickets 01 and the spec (which name
   `anthropic/claude-opus-5`). Those two sources also disagree with each
   other.
3. **The humanizer skill is not installed as a skill in this session.** Its
   instructions are on disk at
   `~/.claude/plugins/marketplaces/humanizer/SKILL.md`. Every build agent was
   told to read that file and apply it by hand to every string a reader sees.
4. **Your `.env.local` sits one folder above the repo**, in `job-search-ai/`.
   Next.js only reads `.env.local` from the repo folder (`redline/`), so the
   app does not see it. A presence check found `OPENROUTER_API_KEY` set and
   `OPENROUTER_MODEL`, `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing. I did not move or copy the file,
   because I am not allowed to read it.
5. **Ticket 11 (the real review set) was skipped.** It is marked
   `ready-for-human`: it needs other people's real contracts and expert
   judgement.
6. **The arbitration clause type is called "Forced arbitration and
   class-action waivers"** in the test documents. That is the name already in
   `lib/analysis/red-lines.ts`. PRD.md writes it with a slash.
7. **`tests/fixtures/.gitattributes` turns off line-ending conversion** for
   the test documents. Git on this machine converts line endings, and one
   planted sentence spans a line break. A converted break would make the
   exact-match tests fail for a reason unrelated to the code.
8. **Analyse sends two model requests at once**, one for the summary and one
   for the flags. Each reply shape stays small. The cost is that the document
   is sent twice.
9. **Uncertainty is checked by words.** An outcome claim must contain one of
   may, might, could, possibly, perhaps, probably, likely, unlikely or maybe.
   A text claim may not use the purely doubtful ones. "May" and "could" are
   allowed in a text claim, because contracts use them to grant permission.
10. **A flag that breaks any rule is held back, not the whole analysis.** The
    rules: its sentence is not in the document, its text claim hedges, its
    outcome claim does not, a field is missing, or its clause type was not
    asked for. All of these count toward the one "held back" number the
    reader sees.
11. **A clause type's severity is a ceiling.** The model may move a
    must-change flag down to worth-raising, but never raise one. This keeps
    must-change for near-certain cases (ADR 0003) and sends generous
    flagging to worth-raising (ADR 0004). (Ticket 02 first let the model
    raise flags; ticket 06 replaced that.)
12. **Deleting files is blocked by this session's permissions.** A builder
    left a temporary page at `app/zz-preview/`. Neither of us could delete it.
    It is listed in `.git/info/exclude`, so it is never committed, but it
    appears in local builds. Delete it by hand.
13. **With every red line switched off, Analyse refuses before calling the
    model.** A clean result with an empty checklist would claim a check that
    never happened.
14. **The model call gives up after 90 seconds** (`MODEL_TIMEOUT_MS` in
    `lib/analysis/model.ts`). The `/try` page allows 120 seconds so the
    limit fires first and the reader sees the failed notice with a retry.
15. **The "held back" line does not say the sentence could not be found.**
    Some flags are held back for other rules, such as a hedged text claim.
    It says Redline could not check them against the document.
16. **Documents are capped at 100,000 characters** (about 40 pages), in
    `MAX_DOCUMENT_CHARACTERS` in `lib/analysis/limits.ts`. The page checks
    first and the server checks again.
17. **A file counts as a scan below 100 characters of text per page**
    (`MIN_TEXT_PER_PAGE` in `lib/extraction/extract.ts`). A Word file counts
    as one page.
18. **Word files keep their line breaks.** Mammoth's plain-text output glues
    words together across a line break inside a paragraph, which would break
    the exact-match check. The text is taken from mammoth's own reading of
    the document instead.
19. **An uploaded file's text is shown in the text box before "Check it"**,
    so the reader sees exactly what Redline read.
20. **Refusal notices use grey borders, not red.** DESIGN.md keeps red for
    flags. The existing "invalid" notice changed from red to grey too.
21. **Legality questions are caught twice.** A narrow word check ("is it
    legal", "enforceable", "illegal") refuses obvious cases before any model
    call. The model also labels each question. The word list is narrow on
    purpose, so "Who pays the legal fees?" still gets an answer.
22. **Every refusal in the question box is a fixed sentence Redline wrote.**
    Model text never appears in a refusal, so a "not addressed" reply cannot
    smuggle in an answer.
23. **Answer passages are tinted grey**, because red and yellow mean
    severity and an answer has none.
24. **Questions are capped at 500 characters.**
25. **The in-memory store is used only by tests and the smoke script, not
    as a fallback in the product.** Ticket 05 asked for a fallback with one
    built-in user. You said not to mock sign-in in the product. Without the
    Supabase variables, the library and red lines pages say an account is
    needed and sign-in is not set up yet. Analysis works for everyone and
    uses the eight default red lines.
26. **`@supabase/ssr` was added along with `@supabase/supabase-js`.** It is
    Supabase's own package for keeping a signed-in session in Next.js
    cookies. I counted it as part of "the Supabase client" you approved.
27. **`/try` stayed at its address with its own layout** instead of moving
    into the `app/(app)/` folder with the other app pages. Moving it means
    deleting files, which is blocked.
28. **The documents table has an `opening` column** holding the document's
    first line, so the library can tell two documents of the same type
    apart.
29. **The Supabase test run needs two more variables:**
    `SUPABASE_TEST_EMAIL` and `SUPABASE_TEST_PASSWORD`, for a test account.
    The database only lets a signed-in user touch their own rows, so the
    tests have to sign in.
30. **Deleting from the library uses a confirm step on the page**
    (`?delete=confirm`), with no pop-up. It works without JavaScript.
31. **Library dates are shown in UTC (universal time, not your local time).** A document read near midnight can
    show the neighbouring day.
32. **A flag for a switched-off clause type is dropped without counting.**
    It is logged but not counted as held back. Counting it would turn a
    clean document into a "withheld" one.
33. **If the reader's saved red lines can't be read, the analysis uses the
    eight defaults** and says so on screen.
34. **Each reader may add up to 20 red lines of their own, 200 characters
    each.** Repeats are refused. Their wording never goes into the server
    log.
35. **Counter-offers come in the same model request as the flags**, so a
    counter-offer cannot drift from the clause it answers and there is no
    extra wait.
36. **A flag without a counter-offer is held back and counted**, like any
    other broken flag, instead of failing the whole analysis.
37. **When leverage is unanswered, counter-offers are worded as requests.**
    ADR 0005 warns that firm wording can cost someone without leverage the
    deal. A polite request costs someone with leverage very little.
38. **No test checks whether a counter-offer sounds firm or polite.** That is
    a question of style, and a test for it would only check prompt wording.
    The tests check that the leverage answer reaches the model request.
39. **The two-user test signs in to two accounts you make by hand.** It never
    signs up, because sign-up sends confirmation emails. It needs
    `SUPABASE_TEST_EMAIL_2` and `SUPABASE_TEST_PASSWORD_2` as well as the
    first pair.
40. **A new migration adds the missing "update" rule on `documents`** instead
    of editing the first file. No one is granted the right to change a saved
    document, so saved documents stay as they were analysed.
41. **New accounts need a password of at least 8 characters.** Sign-in does
    not check length, so no older account gets locked out.
42. **Signing out ends the session in this browser only.** If Supabase
    cannot be reached, the session cookies are deleted anyway.
43. **The eval run checks each quote on its own**, even when the flag is
    held back for another reason too. Otherwise the order of the checks
    would hide some invented quotes from the drop rate.
44. **Failed analyses are left out of the eval numbers** and printed
    separately. A failed call says nothing about the model's judgement.
45. **The eval run asks only the refusal questions.** No check measures
    answered questions, so asking them would cost calls for nothing.
46. **A `.txt` file without an answer key stops the eval run** rather than
    being skipped, so the numbers never quietly cover less than the set.
47. **Decisions went into this report, not `DECISIONS.md`.** You asked for
    this report. `CLAUDE.md` names `DECISIONS.md` for questions; none of
    the questions above needed you before work could go on.
48. **The branch is pushed to GitHub; `main` is untouched.** To ship it,
    merge `build/v1` into `main`, which redeploys the live site.
