"use client";

import { useActionState } from "react";
import { MAX_OWN_WORDS } from "@/lib/analysis/red-lines.ts";
import { SEVERITY_LABEL } from "@/app/landing/severity.ts";
import { addOwnAction, type AddState } from "./actions.ts";

const initialState: AddState = { status: "idle" };

// The form for a red line in the reader's own words, and the severity its
// flags start from. If Redline refuses it, the words stay in the box and the
// reason is printed under it.
export function AddRedLineForm() {
  const [state, submit, pending] = useActionState(addOwnAction, initialState);
  const refused = state.status === "refused" ? state : null;

  return (
    <form action={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="words" className="tab-type text-sm text-ink">
          Add a red line in your own words
        </label>
        <p id="words-hint" className="max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          One sentence about a clause you will not accept. For example: I must be paid
          within 30 days of sending an invoice.
        </p>
        <textarea
          // A new key after each try puts the right words back in the box:
          // the reader's own after a refusal, an empty box after a save.
          key={state.status === "idle" ? 0 : state.attempt}
          id="words"
          name="words"
          rows={2}
          required
          maxLength={MAX_OWN_WORDS}
          defaultValue={refused?.words ?? ""}
          aria-describedby={refused ? "words-hint words-problem" : "words-hint"}
          className="w-full max-w-[60ch] rounded-sm border border-ink-soft bg-sheet px-3 py-2.5 text-base leading-relaxed text-ink"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="tab-type mb-2 text-sm text-ink">How serious is it?</legend>
        <label className="flex items-baseline gap-3 text-base text-ink">
          <input type="radio" name="severity" value="must-change" required className="accent-pen" />
          <span>
            <span className="font-semibold">{SEVERITY_LABEL["must-change"]}.</span> I will not
            sign until it is changed.
          </span>
        </label>
        <label className="flex items-baseline gap-3 text-base text-ink">
          <input type="radio" name="severity" value="worth-raising" className="accent-pen" />
          <span>
            <span className="font-semibold">{SEVERITY_LABEL["worth-raising"]}.</span> I want to
            ask the other side about it.
          </span>
        </label>
      </fieldset>

      <div aria-live="polite">
        {refused && (
          <p
            id="words-problem"
            role="alert"
            className="max-w-[60ch] border border-ink-soft bg-sheet p-4 text-ink"
          >
            {refused.problem}
          </p>
        )}
        {state.status === "added" && (
          <p className="text-sm text-ink-soft">Added. Redline will look for it in the next document you check.</p>
        )}
      </div>

      <button type="submit" disabled={pending} className="group self-start rounded-sm disabled:cursor-wait">
        <span className="tab tab-red tab-forward tab-type block py-2.5 pl-4 pr-9 text-sm transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
          {pending ? "Saving…" : "Add it"}
        </span>
      </button>
    </form>
  );
}
