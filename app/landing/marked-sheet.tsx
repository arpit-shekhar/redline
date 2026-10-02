"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  SAMPLE_CLAUSES,
  SAMPLE_FLAGS,
  SAMPLE_TITLE,
  type SampleClause,
  type SampleFlag,
} from "@/lib/landing/sample.ts";
import { EDGE_TAB_POSITION, EdgeTabFace } from "./edge-tab.tsx";
import { FILM_CLASS, SEVERITY_LABEL } from "./severity.ts";

// Where each tab sits, measured from the rendered text: `tab` within its
// clause row, `note` within the sheet, for the margin note to line up with.
type Positions = Record<number, { tab: number; note: number }>;

// The first page of the landing: a printed sheet holding the introduction and
// the sample agreement, with a sign-here tab stuck beside each flagged
// sentence. The margin to the right shows the open flag's note, level with
// the tab that opened it.
export function MarkedSheet({ intro }: { intro: ReactNode }) {
  const [active, setActive] = useState(1);
  const [positions, setPositions] = useState<Positions>({});
  const sheetRef = useRef<HTMLElement>(null);
  const sentenceRefs = useRef(new Map<number, HTMLElement>());
  const rowRefs = useRef(new Map<number, HTMLElement>());

  const measure = useCallback(() => {
    const next: Positions = {};
    for (const flag of SAMPLE_FLAGS) {
      const sentence = sentenceRefs.current.get(flag.rank);
      const row = rowRefs.current.get(flag.rank);
      if (!sentence || !row) continue;
      const lineHeight = parseFloat(getComputedStyle(sentence).lineHeight) || 0;
      const tab =
        sentence.getBoundingClientRect().top -
        row.getBoundingClientRect().top +
        lineHeight / 2;
      next[flag.rank] = { tab, note: row.offsetTop + tab };
    }
    setPositions(next);
  }, []);

  // The observer reports once as soon as it starts, which takes the first
  // measurement; fonts loading late can move every line, so measure again.
  useLayoutEffect(() => {
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    if (sheetRef.current) observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const activeFlag = SAMPLE_FLAGS.find((f) => f.rank === active) ?? SAMPLE_FLAGS[0];
  const noteTop = positions[activeFlag.rank]?.note;

  return (
    <div className="mx-auto grid w-full max-w-[84rem] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <article
        ref={sheetRef}
        className="sheet-edge relative bg-sheet pb-8 pl-5 pr-14 pt-6 sm:pb-10 sm:pl-12 sm:pr-20 sm:pt-9 lg:pl-16 lg:pr-24"
      >
        {intro}

        <section aria-labelledby="sample-title" className="mt-8 border-t border-rule pt-5 sm:mt-12 sm:pt-6">
          <p className="text-sm text-ink-soft">
            Sample agreement. Tap a tab to see its sentence.
          </p>
          <h2 id="sample-title" className="tab-type mt-3 text-xl text-ink sm:text-2xl">
            {SAMPLE_TITLE}
          </h2>

          <ol className="mt-4 flex flex-col gap-5 font-serif text-[1.0625rem] leading-[1.7] text-ink">
            {SAMPLE_CLAUSES.map((clause) => {
              const flag = SAMPLE_FLAGS.find((f) => f.clause === clause.number);
              return (
                <li
                  key={clause.number}
                  ref={(node) => {
                    if (flag && node) rowRefs.current.set(flag.rank, node);
                  }}
                  className="relative"
                >
                  <ClauseText
                    clause={clause}
                    flag={flag}
                    active={flag?.rank === active}
                    onSelect={setActive}
                    sentenceRef={(node) => {
                      if (flag && node) sentenceRefs.current.set(flag.rank, node);
                    }}
                  />
                  {flag && (
                    <>
                      <TabButton
                        flag={flag}
                        active={flag.rank === active}
                        top={positions[flag.rank]?.tab}
                        onSelect={setActive}
                      />
                      {flag.rank === active && (
                        <div className="mt-4 lg:hidden">
                          <FlagNote flag={flag} />
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <footer className="mt-10 border-t border-rule pt-3 text-xs text-ink-soft">
          Sample agreement, written for this page. It names no real business.
        </footer>
      </article>

      <aside aria-label="The open flag" className="relative hidden pl-[6.75rem] lg:block">
        <div
          aria-live="polite"
          className="note-follow absolute left-[6.75rem] right-0 top-0"
          style={{
            transform: `translateY(${noteTop === undefined ? 0 : Math.max(0, noteTop - 22)}px)`,
            visibility: noteTop === undefined ? "hidden" : "visible",
          }}
        >
          <FlagNote flag={activeFlag} />
        </div>
      </aside>
    </div>
  );
}

function ClauseText({
  clause,
  flag,
  active,
  onSelect,
  sentenceRef,
}: {
  clause: SampleClause;
  flag: SampleFlag | undefined;
  active: boolean;
  onSelect: (rank: number) => void;
  sentenceRef: (node: HTMLElement | null) => void;
}) {
  const heading = (
    <span className="tab-type mr-2 text-[0.8125rem] text-ink-soft">
      {clause.number}. {clause.heading}
    </span>
  );
  if (!flag) {
    return (
      <p className="max-w-[62ch]">
        {heading}
        {clause.text}
      </p>
    );
  }
  const start = clause.text.indexOf(flag.sentence);
  const before = clause.text.slice(0, start);
  const after = clause.text.slice(start + flag.sentence.length);
  return (
    <p className="max-w-[62ch]">
      {heading}
      {before}
      <mark
        ref={sentenceRef}
        data-active={active}
        onClick={() => onSelect(flag.rank)}
        className={`${FILM_CLASS[flag.severity]} cursor-pointer rounded-[2px] px-0.5 text-ink`}
      >
        {flag.sentence}
      </mark>
      {after}
    </p>
  );
}

function TabButton({
  flag,
  active,
  top,
  onSelect,
}: {
  flag: SampleFlag;
  active: boolean;
  top: number | undefined;
  onSelect: (rank: number) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Flag ${flag.rank}, ${SEVERITY_LABEL[flag.severity].toLowerCase()}: ${flag.clauseType}`}
      onClick={() => onSelect(flag.rank)}
      onMouseEnter={() => onSelect(flag.rank)}
      onFocus={() => onSelect(flag.rank)}
      style={{ top: top ?? 14, ["--rank" as string]: flag.rank }}
      className={`${EDGE_TAB_POSITION} tab-enter z-10 -translate-y-1/2 rounded-sm`}
    >
      <EdgeTabFace
        severity={flag.severity}
        rank={flag.rank}
        className={`transition-transform duration-200 ease-out ${
          active ? "-translate-x-1.5" : "hover:-translate-x-1"
        }`}
      />
    </button>
  );
}

// The note a tab opens: a second slip of paper beside the tab.
function FlagNote({ flag }: { flag: SampleFlag }) {
  return (
    <div className="flex flex-col gap-4 bg-sheet px-5 pb-5 pt-4 font-sans text-base shadow-[var(--sheet-shadow)]">
      <p className="leading-snug text-ink">
        <span className="tab-type text-sm">
          {flag.rank}. {SEVERITY_LABEL[flag.severity]}:
        </span>{" "}
        <span className="font-semibold">{flag.clauseType}</span>
      </p>
      <div>
        <p className="tab-type text-xs text-ink-soft">What it says</p>
        <p className="mt-1 leading-relaxed text-ink">{flag.says}</p>
      </div>
      <div>
        <p className="tab-type text-xs text-ink-soft">What it might do</p>
        <p className="mt-1 leading-relaxed text-ink">{flag.mightDo}</p>
      </div>
      <figure className="border-t border-rule pt-4">
        <blockquote className="font-serif leading-relaxed text-ink">
          &quot;{flag.sentence}&quot;
        </blockquote>
        <figcaption className="tab-type mt-2 text-xs text-ink-soft">
          Clause {flag.clause}, word for word
        </figcaption>
      </figure>
    </div>
  );
}
