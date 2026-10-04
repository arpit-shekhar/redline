"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { ToneLineView } from "@/lib/analysis/tone-line.ts";
import type {
  CounterOfferTone,
  Flag,
  Leverage,
  Severity,
  SourceLocation,
} from "@/lib/analysis/types.ts";
import { EDGE_TAB_POSITION, EdgeTabFace } from "../landing/edge-tab.tsx";
import { FILM_CLASS, SEVERITY_LABEL } from "../landing/severity.ts";
import { CounterOfferDraft, ToneLine } from "./counter-offer.tsx";
import { PassageFilm, QuestionBox, scrollToPassage, useQuestions } from "./question-box.tsx";

// The analysed document drawn as the sheet, with a red or yellow tab on its
// right edge beside each flagged sentence, in rank order. Choosing a tab tints
// its sentence and opens its note: in the working column to the right on wide
// screens, and just below the sentence's paragraph on phones. The question box
// sits under the note in both places. The note ends with the flag's
// counter-offer, which the reader can edit and copy.

type RankedFlag = Flag & { rank: number };

// Where each tab sits: `tab` within the document text, `note` within the
// sheet, for the working column's note to line up with.
type Positions = Record<number, { tab: number; note: number }>;

// Tabs are 40px tall at most. Tabs closer than this are pushed apart so none
// hides another.
const TAB_SPACING = 44;

export function FlaggedDocument({
  text,
  flags,
  dropped,
  tone,
  leverage,
  toneView,
}: {
  text: string;
  flags: Flag[];
  dropped: number;
  // How the counter-offers were worded, and the leverage answer behind it.
  // Missing only on a library copy saved before counter-offers existed.
  tone?: CounterOfferTone;
  leverage?: Leverage | null;
  toneView: ToneLineView;
}) {
  const ranked: RankedFlag[] = flags.map((flag, index) => ({ ...flag, rank: index + 1 }));
  const [active, setActive] = useState(1);
  // The reader's edits to each counter-offer, by rank. A flag with no entry
  // shows Redline's wording. The note is drawn twice (phone and wide
  // screen), so the edits are kept here for both to share.
  const [edits, setEdits] = useState<Record<number, string>>({});
  // A new analysis starts from Redline's wording again.
  const [editsFor, setEditsFor] = useState(flags);
  if (editsFor !== flags) {
    setEditsFor(flags);
    setEdits({});
  }
  const counterOffer = (flag: RankedFlag) => ({
    tone,
    draft: edits[flag.rank] ?? flag.counterOffer,
    onDraftChange: (next: string) => setEdits((all) => ({ ...all, [flag.rank]: next })),
  });
  const [positions, setPositions] = useState<Positions>({});
  const sheetRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const questions = useQuestions(text);
  const { scrollRequest } = questions;

  useEffect(() => {
    if (scrollRequest > 0) scrollToPassage(bodyRef.current);
  }, [scrollRequest]);

  const measure = useCallback(() => {
    const sheet = sheetRef.current;
    const body = bodyRef.current;
    if (!sheet || !body) return;
    const bodyTop = body.getBoundingClientRect().top;
    const sheetTop = sheet.getBoundingClientRect().top;

    // Each flag's tab lines up with the middle of the first line of its
    // sentence. The tinted piece where a sentence starts lists its flags'
    // ranks in `data-starts`.
    const found: { rank: number; tab: number }[] = [];
    for (const mark of body.querySelectorAll<HTMLElement>("mark[data-starts]")) {
      const lineHeight = parseFloat(getComputedStyle(mark).lineHeight) || 0;
      const tab = mark.getBoundingClientRect().top - bodyTop + lineHeight / 2;
      for (const rank of mark.dataset.starts!.split(" ")) {
        found.push({ rank: Number(rank), tab });
      }
    }
    found.sort((a, b) => a.tab - b.tab || a.rank - b.rank);

    const next: Positions = {};
    let previous = -Infinity;
    for (const { rank, tab } of found) {
      const top = Math.max(tab, previous + TAB_SPACING);
      previous = top;
      next[rank] = { tab: top, note: top + bodyTop - sheetTop };
    }
    setPositions(next);
  }, []);

  // The observer reports once as soon as it starts, which takes the first
  // measurement. Fonts loading late, or the phone note opening, move lines,
  // so it measures again whenever the sheet changes size.
  useLayoutEffect(() => {
    document.fonts?.ready.then(measure);
    const observer = new ResizeObserver(measure);
    if (sheetRef.current) observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [measure]);

  // A new analysis can arrive without the sheet changing size.
  useLayoutEffect(measure, [measure, text, flags]);

  const activeFlag = ranked.find((f) => f.rank === active) ?? ranked[0];
  const noteTop = activeFlag ? positions[activeFlag.rank]?.note : undefined;
  const mustChange = flags.filter((f) => f.severity === "must-change").length;

  return (
    <section
      aria-labelledby="flags-title"
      className="mx-auto mt-8 grid w-full max-w-[84rem] grid-cols-1 sm:mt-12 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_23rem]"
    >
      <article
        ref={sheetRef}
        className="sheet-edge relative bg-sheet pb-8 pl-5 pr-14 pt-6 sm:pb-10 sm:pl-12 sm:pr-20 sm:pt-9 lg:pl-16 lg:pr-24"
      >
        <header className="flex max-w-[62ch] flex-col gap-2">
          <h2 id="flags-title" className="tab-type text-xl text-ink sm:text-2xl">
            Clauses that could hurt you
          </h2>
          {flags.length > 0 && (
            <p className="text-base leading-relaxed text-ink">
              {flags.length} {flags.length === 1 ? "flag" : "flags"}: {mustChange} must
              change, {flags.length - mustChange} worth raising. Choose a tab to read
              why.
            </p>
          )}
          {flags.length > 0 && tone && (
            <ToneLine tone={tone} leverage={leverage ?? null} view={toneView} />
          )}
          {dropped > 0 && (
            <p className="text-base leading-relaxed text-ink">
              Redline held back {dropped} {dropped === 1 ? "flag" : "flags"} it could
              not check against your document.
            </p>
          )}
        </header>

        {ranked.length > 0 && (
          <div
            ref={bodyRef}
            className="relative mt-6 flex flex-col gap-5 border-t border-rule pt-5 font-serif text-[1.0625rem] leading-[1.7] text-ink"
          >
            {paragraphsOf(text).map(([start, end]) => {
              const opensHere =
                activeFlag &&
                activeFlag.sourceLocation.start >= start &&
                activeFlag.sourceLocation.start < end;
              return (
                <div key={start}>
                  <p className="max-w-[62ch] whitespace-pre-wrap break-words">
                    {markedText(
                      text,
                      start,
                      end,
                      ranked,
                      activeFlag?.rank,
                      setActive,
                      questions.shownPassage,
                    )}
                  </p>
                  {opensHere && (
                    <div className="mt-4 flex flex-col gap-4 lg:hidden">
                      <FlagNote flag={activeFlag} text={text} {...counterOffer(activeFlag)} />
                      <div className="bg-sheet px-5 pb-5 pt-4 shadow-[var(--sheet-shadow)]">
                        <QuestionBox questions={questions} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {ranked.map((flag) => (
              <TabButton
                key={flag.rank}
                flag={flag}
                active={flag.rank === activeFlag?.rank}
                top={positions[flag.rank]?.tab}
                onSelect={setActive}
              />
            ))}
          </div>
        )}
      </article>

      {activeFlag && (
        <aside
          aria-label="The open flag and your questions"
          className="relative hidden pl-[6.75rem] lg:block"
        >
          <div
            className="note-follow absolute left-[6.75rem] right-0 top-0 pb-8"
            style={{
              transform: `translateY(${noteTop === undefined ? 0 : Math.max(0, noteTop - 22)}px)`,
              visibility: noteTop === undefined ? "hidden" : "visible",
            }}
          >
            <div aria-live="polite">
              <FlagNote flag={activeFlag} text={text} {...counterOffer(activeFlag)} />
            </div>
            <div className="mt-6 bg-sheet px-5 pb-5 pt-4 shadow-[var(--sheet-shadow)]">
              <QuestionBox questions={questions} />
            </div>
          </div>
        </aside>
      )}
    </section>
  );
}

// Paragraphs are separated by a blank line. Each is a [start, end) range of
// the text, so positions inside it still match the flags' source locations.
export function paragraphsOf(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const breaks = /\n[^\S\n]*\n\s*/g;
  let start = 0;
  for (const match of text.matchAll(breaks)) {
    if (match.index > start) ranges.push([start, match.index]);
    start = match.index + match[0].length;
  }
  if (start < text.length) ranges.push([start, text.length]);
  return ranges;
}

// One paragraph's text, with every flagged stretch tinted. Where two flags
// share text, the chosen one's colour shows, and tapping the text again moves
// on to the next flag there. The passage of the answer chosen in the question
// box, if any, is tinted grey.
function markedText(
  text: string,
  start: number,
  end: number,
  flags: RankedFlag[],
  active: number | undefined,
  onSelect: (rank: number) => void,
  passage: SourceLocation | null,
): ReactNode[] {
  const cuts = new Set([start, end]);
  const bounds = flags.map((f) => f.sourceLocation);
  if (passage) bounds.push(passage);
  for (const at of bounds) {
    if (at.start > start && at.start < end) cuts.add(at.start);
    if (at.end > start && at.end < end) cuts.add(at.end);
  }
  const points = [...cuts].sort((a, b) => a - b);

  const pieces: ReactNode[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [from, to] = [points[i], points[i + 1]];
    const piece = flaggedPiece(text, from, to, flags, active, onSelect);
    const inPassage = passage && passage.start < to && passage.end > from;
    pieces.push(
      inPassage ? (
        <PassageFilm key={`passage-${from}`} startsHere={from === passage.start}>
          {piece}
        </PassageFilm>
      ) : (
        piece
      ),
    );
  }
  return pieces;
}

// One stretch of text between two cut points: plain, or tinted by the flags
// that cover it.
function flaggedPiece(
  text: string,
  from: number,
  to: number,
  flags: RankedFlag[],
  active: number | undefined,
  onSelect: (rank: number) => void,
): ReactNode {
  const piece = text.slice(from, to);
  const covering = flags.filter(
    (f) => f.sourceLocation.start < to && f.sourceLocation.end > from,
  );
  if (covering.length === 0) return piece;
  const chosenHere = covering.findIndex((f) => f.rank === active);
  const shown = chosenHere === -1 ? covering[0] : covering[chosenHere];
  const next = covering[(chosenHere + 1) % covering.length];
  const startsHere = covering.filter((f) => f.sourceLocation.start === from);
  return (
    <mark
      key={from}
      data-starts={startsHere.length > 0 ? startsHere.map((f) => f.rank).join(" ") : undefined}
      data-active={chosenHere !== -1}
      onClick={() => onSelect(next.rank)}
      className={`${FILM_CLASS[shown.severity]} cursor-pointer rounded-[2px] px-0.5 text-ink`}
    >
      {piece}
    </mark>
  );
}

function TabButton({
  flag,
  active,
  top,
  onSelect,
}: {
  flag: RankedFlag;
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
      onFocus={() => onSelect(flag.rank)}
      style={{
        top: top ?? 14,
        visibility: top === undefined ? "hidden" : "visible",
        // Long lists would take too long to stick on one by one.
        ["--rank" as string]: Math.min(flag.rank, 8),
      }}
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

const REASON_LABEL: Record<Severity, string> = {
  "must-change": "Why you should change it",
  "worth-raising": "Why it is worth raising",
};

// About this many characters of the document are shown on each side of the
// sentence in the note, cut at a space.
const CONTEXT = 160;

// The note a tab opens: a second slip of paper holding what the clause says,
// what it might do, why it has its severity, the sentence in its place in
// the document, and the counter-offer.
function FlagNote({
  flag,
  text,
  tone,
  draft,
  onDraftChange,
}: {
  flag: RankedFlag;
  text: string;
  tone: CounterOfferTone | undefined;
  // The counter-offer as the reader has it now.
  draft: string;
  onDraftChange: (draft: string) => void;
}) {
  const { start, end } = flag.sourceLocation;
  const before = contextBefore(text, start);
  const after = contextAfter(text, end);
  return (
    <div className="flex flex-col gap-4 bg-sheet px-5 pb-5 pt-4 font-sans text-base shadow-[var(--sheet-shadow)]">
      <p className="leading-snug text-ink">
        <span className="tab-type text-sm">
          {flag.rank}. {SEVERITY_LABEL[flag.severity]}:
        </span>{" "}
        <span className="font-semibold">{flag.clauseType}</span>
      </p>
      {flag.alsoCrosses && flag.alsoCrosses.length > 0 && (
        <p className="-mt-2 text-sm leading-snug text-ink-soft">
          This sentence also crosses: {flag.alsoCrosses.join("; ")}
        </p>
      )}
      <div>
        <p className="tab-type text-xs text-ink-soft">What it says</p>
        <p className="mt-1 leading-relaxed text-ink">{flag.textClaim}</p>
      </div>
      <div>
        <p className="tab-type text-xs text-ink-soft">What it might do</p>
        <p className="mt-1 leading-relaxed text-ink">{flag.outcomeClaim}</p>
      </div>
      <div>
        <p className="tab-type text-xs text-ink-soft">{REASON_LABEL[flag.severity]}</p>
        <p className="mt-1 leading-relaxed text-ink">{flag.escapabilityReasoning}</p>
      </div>
      <figure className="border-t border-rule pt-4">
        <blockquote className="font-serif leading-relaxed text-ink">
          {before}
          <mark className={`${FILM_CLASS[flag.severity]} rounded-[2px] px-0.5 text-ink`} data-active="true">
            {flag.sourceSentence}
          </mark>
          {after}
        </blockquote>
        <figcaption className="tab-type mt-2 text-xs text-ink-soft">
          Word for word from your document
        </figcaption>
      </figure>
      {flag.counterOffer && (
        <CounterOfferDraft
          drafted={flag.counterOffer}
          text={draft}
          onChange={onDraftChange}
          tone={tone}
        />
      )}
    </div>
  );
}

function contextBefore(text: string, start: number): string {
  if (start <= CONTEXT) return text.slice(0, start);
  const piece = text.slice(start - CONTEXT, start);
  const space = piece.search(/\s/);
  return `…${space === -1 ? piece : piece.slice(space)}`;
}

function contextAfter(text: string, end: number): string {
  if (text.length - end <= CONTEXT) return text.slice(end);
  const piece = text.slice(end, end + CONTEXT);
  const space = Math.max(piece.lastIndexOf(" "), piece.lastIndexOf("\n"));
  return `${space <= 0 ? piece : piece.slice(0, space)}…`;
}
