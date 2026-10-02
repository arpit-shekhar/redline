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
