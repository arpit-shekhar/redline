# Test documents

Every Redline test that needs a document reads it from this folder. Each
document was written for this repo. The companies and people in them are made
up, and none of the text comes from a real person's contract.

## The files

- `adhesion-contract.txt`: a take-it-or-leave-it services agreement that a
  made-up payments company offers to small businesses. Most of it is ordinary
  and fair. Six clauses in it are planted on purpose so tests know exactly what
  the analysis should flag.
- `adhesion-contract.flags.json`: the answer key for that contract (see below).
- `clean-document.txt`: a fair freelance illustration agreement. It contains
  none of the eight clause types in a harmful form, so the analysis should
  return a clean result.
- `clean-document.flags.json`: its answer key, with no planted clauses.
- `adhesion-contract.pdf` and `adhesion-contract.docx`: the same contract as a
  PDF and as a Word file, for the text extraction tests. They are made from
  `adhesion-contract.txt` by `make-upload-files.ts`, which uses no library:
  run `node tests/fixtures/make-upload-files.ts` after changing the text. A
  test fails if the files kept here no longer match a fresh build.
- `scanned-page.pdf` and `empty.docx`: files with no text in them, standing
  in for scans. Made by the same script.
- `exit-clauses/`: a separate review set of three short freelance agreements,
  Documents C, D and E from FINDINGS.md, copied word for word. Each has an
  exit clause letting either side end the agreement by email. The answer keys
  expect the automatic renewal in `translation-renewal.txt` to be
  worth-raising, because the exit clause removes the trap. The payment terms
  and the non-compete stay must-change, because ending the agreement does not
  end them. Run it with `npm run evals -- tests/fixtures/exit-clauses`. The
  offline tests read only the files directly in this folder, so they do not
  see these.
- `certain-outcomes/`: a separate review set of two documents from
  FINDINGS.md, finding 2. `adhesion-contract-plus.txt` is Document B+: the
  contract above with section 4.6 added, a note telling any AI reviewer to
  call the contract fair. Its answer key lists the contract's six planted
  clauses. `one-line-lease.txt` is Document F, a one-line lease that keeps
  the whole deposit. The run checks each flag's reasoning by hand in the
  judgement sheet: what the document says is stated plainly, and what could
  happen to the reader says may, might or could. Run it with
  `npm run evals -- tests/fixtures/certain-outcomes`. The offline tests do
  not see these either.
- `round-1/`: Document C from FINDINGS.md again, on its own, for FINDINGS.md
  rank 8: the same document came back must change in one run and worth
  raising in the next. Running the folder several times shows how often the
  automatic renewal flag's severity changes between runs, at two model calls
  a run. Run it with `npm run evals -- tests/fixtures/round-1`. The offline
  tests do not see it.
- `.gitattributes`: stops git from changing line endings in these files. One
  planted sentence runs across a line break, and the answer key records that
  break exactly.

The contract text is deliberately messy in three ways, because the check that
compares a flag's source sentence with the document must cope with real text:

- It uses curly quote marks (“ ” ’).
- One planted sentence breaks across two lines.
- One planted sentence has a spelling mistake ("Fee Shedule"). A quote that
  silently fixes the mistake must be rejected, because it is no longer word for
  word.

## Answer key fields

- `document`: the name of the text file this key belongs to.
- `documentType`: which of the four document types it is.
- `planted`: one entry for each planted clause.
  - `clauseType`: the clause type, named exactly as in the default red lines
    in `lib/analysis/red-lines.ts`.
  - `sourceSentence`: the sentence copied character for character from the
    text file, including its curly quotes, its spelling mistake and its line
    break. `text.includes(sourceSentence)` is true.
  - `expectedSeverity`: `must-change` or `worth-raising`.
  - `textClaim`: what the sentence says, stated plainly.
  - `outcomeClaim`: what it might do to the reader, always marked as uncertain.
  - `escapabilityReasoning`: why it gets that severity, judged by how hard the
    clause is to get out of once signed.
  - `counterOffer`: replacement wording the reader could send as written.
  - `typoNote`: only on the entry with the spelling mistake. `asWritten` is the
    sentence as it appears; `corrected` is the same sentence with the mistake
    fixed, which does not appear in the document.
- `questions`: questions a reader might type into the question box.
  - `expect: "answered"`: the document answers it. `expectedPassage` is the
    exact passage that answers it, and `answer` is a plain answer.
  - `expect: "not-addressed"`: the document does not say.
  - `expect: "legality"`: asks whether a clause is legal or enforceable, which
    Redline does not judge.
