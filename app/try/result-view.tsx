"use client";

import type { AnalysisResult } from "@/lib/analysis/types.ts";
import { CleanDocument } from "./clean-document.tsx";
import { FlaggedDocument } from "./flagged-document.tsx";
import { StandaloneQuestionBox } from "./question-box.tsx";

// The result of one analysis, in two parts, so the paste page and a document
// opened from the library draw it the same way.

// The part on the first sheet: the summary, and for a withheld result the
// line saying how many flags were held back, with the question box under it.
export function ResultSummary({ text, result }: { text: string; result: AnalysisResult }) {
  return (
    <>
      <h2 className="tab-type mb-4 text-xl text-ink">What this document does</h2>
      <div className="flex max-w-[65ch] flex-col gap-4 text-lg leading-relaxed text-ink">
        {result.summary.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {result.outcome === "withheld" && (
        <>
          <p className="mt-8 max-w-[65ch] border-t border-rule pt-4 text-base leading-relaxed text-ink">
            Redline held back {result.withheld} {result.withheld === 1 ? "flag" : "flags"}{" "}
            because it could not check {result.withheld === 1 ? "it" : "them"} against
            your document, so it cannot call this document clean.
          </p>
          <div className="mt-8 max-w-[65ch] border-t border-rule pt-6">
            <StandaloneQuestionBox text={text} />
          </div>
        </>
      )}
    </>
  );
}

// The document itself as the next sheet: with its tabs when something was
// flagged, or with its checklist when nothing was. A withheld result has no
// sheet here.
export function ResultDocument({ text, result }: { text: string; result: AnalysisResult }) {
  if (result.outcome === "flagged") {
    return (
      <FlaggedDocument
        text={text}
        flags={result.flags}
        dropped={result.dropped}
        tone={result.counterOfferTone}
        leverage={result.leverage}
      />
    );
  }
  if (result.outcome === "clean") {
    return (
      <CleanDocument text={text} statement={result.statement} checkedFor={result.checkedFor} />
    );
  }
  return null;
}
