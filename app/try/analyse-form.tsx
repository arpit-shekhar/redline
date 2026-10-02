"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { DOCUMENT_TYPES } from "@/lib/analysis/types.ts";
import { analyseDocument, type AnalyseState } from "./actions.ts";
import { FlaggedDocument } from "./flagged-document.tsx";

const initialState: AnalyseState = { status: "idle" };

// The paste sheet (its heading passed in as `intro`), the summary on it once
// the document is read, and then the document itself as a second sheet
// carrying its flags.
export function AnalyseForm({ intro }: { intro: ReactNode }) {
  const [state, submit, pending] = useActionState(analyseDocument, initialState);

  return (
    <>
      <div className="mx-auto w-full max-w-[56rem] bg-sheet px-5 py-8 shadow-[var(--sheet-shadow)] sm:px-12 sm:py-12">
        {intro}
        <form
          className="flex flex-col gap-6"
          // Submitting through a transition keeps the pasted text in the box.
          // A plain form action would clear it once the analysis returns.
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            startTransition(() => submit(data));
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="documentType" className="tab-type text-sm text-ink">
              What kind of document is this?
            </label>
            <select
              id="documentType"
              name="documentType"
              required
              defaultValue=""
              className="w-full max-w-xs rounded-sm border border-ink-soft bg-sheet px-3 py-2.5 text-ink"
            >
              <option value="" disabled>
                Choose one
              </option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="text" className="tab-type text-sm text-ink">
              The document&apos;s text
            </label>
            <p id="text-note" className="text-sm text-ink-soft">
              The text is sent to an AI model to be read. Redline does not save it.
            </p>
            <textarea
              id="text"
              name="text"
              required
              rows={14}
              aria-describedby="text-note"
              className="w-full rounded-sm border border-ink-soft bg-sheet p-4 font-serif text-base leading-relaxed text-ink"
            />
          </div>

          <button type="submit" disabled={pending} className="group self-start rounded-sm disabled:cursor-wait">
            <span className="tab tab-red tab-forward tab-type block py-3 pl-5 pr-10 text-base transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
              {pending ? "Reading the document…" : "Check it"}
            </span>
          </button>
        </form>

        <section aria-live="polite" aria-busy={pending} className="mt-12">
          {state.status === "error" && (
            <p role="alert" className="border border-tab-red bg-sheet p-4 text-ink">
              {state.message}
            </p>
          )}
          {state.status === "done" && (
            <>
              <h2 className="tab-type mb-4 text-xl text-ink">What this document does</h2>
              <div className="flex max-w-[65ch] flex-col gap-4 text-lg leading-relaxed text-ink">
                {state.summary.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {state.status === "done" && (state.flags.length > 0 || state.dropped > 0) && (
        <FlaggedDocument text={state.text} flags={state.flags} dropped={state.dropped} />
      )}
    </>
  );
}
