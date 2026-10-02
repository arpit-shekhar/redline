import { EDGE_TAB_POSITION } from "../landing/edge-tab.tsx";
import { paragraphsOf } from "./flagged-document.tsx";

// The analysed document drawn as the sheet when nothing was flagged: one grey
// tab on its right edge reading "Nothing flagged", and the list of clause
// types that were checked for and not found (ADR 0004). A clean result is
// never a blank sheet.
export function CleanDocument({
  text,
  statement,
  checkedFor,
}: {
  text: string;
  statement: string;
  checkedFor: string[];
}) {
  return (
    <section
      aria-labelledby="clean-title"
      className="mx-auto mt-8 grid w-full max-w-[84rem] grid-cols-1 sm:mt-12 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_23rem]"
    >
      <article className="sheet-edge relative bg-sheet pb-8 pl-5 pr-14 pt-6 sm:pb-10 sm:pl-12 sm:pr-20 sm:pt-9 lg:pl-16 lg:pr-24">
        {/* On phones the tab is a short stub with no room for words, so the
            sheet says it in the line below the heading instead. */}
        <span
          style={{ ["--rank" as string]: 1 }}
          className={`${EDGE_TAB_POSITION} tab-enter top-5 sm:top-8`}
        >
          <span className="tab tab-grey tab-type flex h-9 min-w-10 items-center pl-5 pr-3 text-[0.8125rem] lg:h-10 lg:w-[12.5rem]">
            <span className="hidden lg:inline">Nothing flagged</span>
          </span>
        </span>

        <header className="flex max-w-[62ch] flex-col gap-2">
          <h2 id="clean-title" className="tab-type text-xl text-ink sm:text-2xl">
            Clauses that could hurt you
          </h2>
          <p className="text-base leading-relaxed text-ink">
            <span className="lg:hidden">Nothing flagged. </span>
            {statement}
          </p>
        </header>

        <div className="mt-6 max-w-[62ch] border-t border-rule pt-5">
          <h3 className="tab-type text-sm text-ink-soft">Checked for and not found</h3>
          <ul className="mt-3 flex flex-col gap-1.5 text-base leading-snug text-ink">
            {checkedFor.map((clauseType) => (
              <li key={clauseType} className="flex gap-3">
                <span aria-hidden="true" className="text-ink-soft">
                  ✓
                </span>
                {clauseType}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Redline only looks for these kinds of clause. It did not check the
            document for anything else.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-rule pt-5 font-serif text-[1.0625rem] leading-[1.7] text-ink">
          {paragraphsOf(text).map(([start, end]) => (
            <p key={start} className="max-w-[62ch] whitespace-pre-wrap break-words">
              {text.slice(start, end)}
            </p>
          ))}
        </div>
      </article>
    </section>
  );
}
