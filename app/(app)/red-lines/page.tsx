import Link from "next/link";
import type { ReactNode } from "react";
import { WHAT_IT_DOES } from "@/app/landing/clause-types.ts";
import { EDGE_TAB_POSITION, EdgeTabFace } from "@/app/landing/edge-tab.tsx";
import { SEVERITY_LABEL } from "@/app/landing/severity.ts";
import {
  hasSomethingToCheck,
  MAX_OWN_RED_LINES,
  type OwnRedLine,
} from "@/lib/analysis/red-lines.ts";
import type { Leverage, RedLine, Severity } from "@/lib/analysis/types.ts";
import { readerRedLines, type ReaderRedLines } from "@/lib/storage/reader-red-lines.ts";
import { openLibrary, type Library } from "@/lib/storage/session.ts";
import { Letterhead, LibrarySheet } from "../library/parts.tsx";
import {
  removeOwnAction,
  setLeverageAction,
  setSeverityAction,
  switchDefaultAction,
} from "./actions.ts";
import { AddRedLineForm } from "./add-form.tsx";

export const metadata = { title: "Your red lines · Redline" };

// The reader's red lines: the eight kinds of clause Redline starts with, as
// an index of tabs that can be switched off or moved to the other colour;
// the red lines they wrote themselves; and the leverage question. Every
// change is saved at once and applies to the next document they check.
// Without an account the eight are shown as they are, and cannot be changed.
export default async function RedLinesPage({ searchParams }: PageProps<"/red-lines">) {
  const params = await searchParams;
  const library = await openLibrary();
  const found = await readerRedLines(library);
  const editable = found.source === "yours";
  const { settings } = found;
  const leverageFirst = editable && settings.leverage === null;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <LibrarySheet className="py-8 sm:py-12">
        <Letterhead right="It is not legal advice." />
        <h1 className="tab-type mt-10 text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
          Your red lines
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink">
          Redline looks for these kinds of clause in every document you check. A red tab
          marks a clause to get changed before you sign. A yellow one marks a clause worth
          raising with the other side.
        </p>
        <Standing
          status={library.status}
          found={found}
          notSaved={params["not-saved"] !== undefined}
        />
      </LibrarySheet>

      {leverageFirst && <LeverageSheet leverage={settings.leverage} />}

      <LibrarySheet className="py-8 sm:py-10">
        <h2 className="tab-type text-xl text-ink sm:text-2xl">The eight Redline starts with</h2>
        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink">
          {editable
            ? "Switch off any you do not care about, or move one to the other colour. A red one can still come back yellow when a clause is easier to get out of than usual."
            : "A red one can come back yellow when a clause is easier to get out of than usual."}
        </p>
        <ul aria-label="The eight kinds of clause" className="mt-6 flex flex-col border-t border-rule">
          {settings.defaults.map((line) => (
            <DefaultRow key={line.clauseType} line={line} editable={editable} />
          ))}
        </ul>
      </LibrarySheet>

      {editable && <OwnSheet own={settings.own} />}
      {editable && !leverageFirst && <LeverageSheet leverage={settings.leverage} />}
    </div>
  );
}

// The line under the heading about who these red lines belong to and
// whether they can be changed.
function Standing({
  status,
  found,
  notSaved,
}: {
  status: Library["status"];
  found: ReaderRedLines;
  notSaved: boolean;
}) {
  const line = "mt-6 max-w-[60ch] border-t border-rule pt-4 text-base leading-relaxed text-ink";
  if (found.source === "unreachable") {
    return (
      <p role="alert" className={line}>
        Redline could not reach your red lines just now, so this shows the eight it starts
        with. Try again in a minute.
      </p>
    );
  }
  if (status === "no-storage") {
    return (
      <p className={line}>
        You need an account to change these, and sign-in is not set up on this copy of
        Redline yet. Until then, Redline looks for these eight.
      </p>
    );
  }
  if (found.source === "no-account") {
    return (
      <p className={line}>
        You need an account to change these.{" "}
        <Link href="/sign-in" className="font-medium text-pen underline">
          Sign in
        </Link>{" "}
        and your changes apply to every document you check after that. Until then, Redline
        looks for these eight.
      </p>
    );
  }
  return (
    <>
      {notSaved && (
        <p role="alert" className="mt-6 max-w-[60ch] border border-ink-soft bg-sheet p-4 text-ink">
          Redline could not save that change just now. Try again in a minute.
        </p>
      )}
      {!hasSomethingToCheck(found.settings) && (
        <p role="alert" className={line}>
          Every red line is switched off, so Redline has nothing to look for. Switch one back
          on before you check a document.
        </p>
      )}
    </>
  );
}

// A small form that is one blue link-like button: the reader's own action.
function ActionButton({
  action,
  fields,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className="text-sm font-medium text-pen underline">
        {children}
      </button>
    </form>
  );
}

const OTHER: Record<Severity, Severity> = {
  "must-change": "worth-raising",
  "worth-raising": "must-change",
};

const ROW = "relative border-b border-rule py-4";

// One of the eight, with its tab on the sheet's edge while it is switched on.
// A switched-off row has no tab, because Redline does not look for it.
function DefaultRow({ line, editable }: { line: RedLine; editable: boolean }) {
  const { clauseType, severity, enabled } = line;
  return (
    <li className={`${ROW} ${editable ? "min-h-[7rem]" : ""}`}>
      <p className="max-w-[56ch] pr-2">
        <span className={`font-semibold ${enabled ? "text-ink" : "text-ink-soft"}`}>
          {clauseType}
        </span>
        <span className="tab-type ml-2 text-xs text-ink-soft">
          {enabled ? SEVERITY_LABEL[severity] : "Switched off"}
        </span>
      </p>
      <p className="mt-1 max-w-[56ch] text-ink-soft">{WHAT_IT_DOES[clauseType]}</p>
      {editable && (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <ActionButton
            action={switchDefaultAction}
            fields={{ clauseType, enabled: enabled ? "off" : "on" }}
          >
            {enabled ? "Switch off" : "Switch back on"}
          </ActionButton>
          {enabled && (
            <ActionButton
              action={setSeverityAction}
              fields={{ clauseType, severity: OTHER[severity] }}
            >
              Move to {SEVERITY_LABEL[OTHER[severity]].toLowerCase()}
            </ActionButton>
          )}
        </div>
      )}
      {enabled && (
        <span aria-hidden="true" className={`${EDGE_TAB_POSITION} top-4`}>
          <EdgeTabFace severity={severity} />
        </span>
      )}
    </li>
  );
}

function OwnSheet({ own }: { own: OwnRedLine[] }) {
  return (
    <LibrarySheet className="py-8 sm:py-10">
      <h2 className="tab-type text-xl text-ink sm:text-2xl">Your own red lines</h2>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink">
        {own.length === 0
          ? "None yet. Add a clause you will not accept, in your own words, and Redline looks for it too. Each flag it finds is named with your words."
          : "Redline looks for these too, and names each flag it finds with your words."}
      </p>
      {own.length > 0 && (
        <ul aria-label="Your own red lines" className="mt-6 flex flex-col border-t border-rule">
          {own.map((line) => (
            <li key={line.id} className={`${ROW} min-h-[5.5rem]`}>
              <p className="max-w-[56ch] pr-2">
                <span className="font-semibold text-ink">{line.words}</span>
                <span className="tab-type ml-2 text-xs text-ink-soft">
                  {SEVERITY_LABEL[line.severity]}
                </span>
              </p>
              <div className="mt-2">
                <ActionButton action={removeOwnAction} fields={{ id: line.id }}>
                  Remove
                </ActionButton>
              </div>
              <span aria-hidden="true" className={`${EDGE_TAB_POSITION} top-4`}>
                <EdgeTabFace severity={line.severity} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        {own.length < MAX_OWN_RED_LINES ? (
          <AddRedLineForm />
        ) : (
          <p className="max-w-[60ch] text-base leading-relaxed text-ink">
            You have {MAX_OWN_RED_LINES} red lines of your own, which is the most Redline
            keeps. Remove one to add another.
          </p>
        )}
      </div>
    </LibrarySheet>
  );
}

const ANSWERS: { value: Leverage; label: string; said: string }[] = [
  {
    value: "can-walk-away",
    label: "Yes. If they will not change the terms, I can walk away.",
    said: "you can walk away",
  },
  {
    value: "cannot-walk-away",
    label: "No. I need this kind of deal to go ahead.",
    said: "you cannot walk away",
  },
];

// The leverage question. Asked once, kept with the red lines, and changed
// here whenever the reader wants.
function LeverageSheet({ leverage }: { leverage: Leverage | null }) {
  const current = ANSWERS.find((answer) => answer.value === leverage);
  return (
    <LibrarySheet className="py-8 sm:py-10">
      <h2 className="tab-type text-xl text-ink sm:text-2xl">Could you walk away?</h2>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink">
        If the other side will not change the terms, could you walk away from deals like the
        ones you check here? Redline asks once and keeps your answer for every document.
      </p>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink">
        For each flag, Redline drafts a counter-offer: new wording you can send to the other
        side. Your answer sets how it is worded. If you can walk away, it is firm, a condition
        of signing. If you cannot, it is a polite request, so asking does not put the deal at
        risk. Until you answer, Redline words them as requests.
      </p>
      <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink-soft">
        {current
          ? `Your answer: ${current.said}. You can change it here at any time.`
          : "You have not answered yet."}
      </p>
      <form action={setLeverageAction} className="mt-6 flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Could you walk away?</legend>
          {ANSWERS.map((answer) => (
            <label key={answer.value} className="flex items-baseline gap-3 text-base text-ink">
              <input
                type="radio"
                name="leverage"
                value={answer.value}
                required
                defaultChecked={answer.value === leverage}
                className="accent-pen"
              />
              {answer.label}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="group self-start rounded-sm">
          <span className="tab tab-red tab-forward tab-type block py-2.5 pl-4 pr-9 text-sm transition-transform duration-200 ease-out group-hover:translate-x-1">
            Save my answer
          </span>
        </button>
      </form>
    </LibrarySheet>
  );
}

