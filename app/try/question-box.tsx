"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { MAX_QUESTION_CHARACTERS } from "@/lib/analysis/limits.ts";
import type { AnswerResult, SourceLocation } from "@/lib/analysis/types.ts";
import { askQuestion, type AskState } from "./ask.ts";

// The question box: the reader asks the analysed document a question in
// their own words. An answer quotes the passage it came from, and choosing
// that passage tints it on the sheet the way a tab tints its sentence. A
// refusal is one plain line.
//
// The questions live in useQuestions, held by the document sheet, so the box
// can be drawn in two places (the working column on wide screens, under the
// open note on phones) and both show the same questions.

type Asked = {
  id: number;
  question: string;
  // Undefined while the answer is on its way.
  result?: AnswerResult;
};

export type Questions = {
  text: string;
  asked: Asked[];
  draft: string;
  setDraft: (draft: string) => void;
  pending: boolean;
  notice: string | null;
  ask: () => void;
  // The answer whose passage is tinted on the sheet, if any.
  shownId: number | null;
  shownPassage: SourceLocation | null;
  showPassage: (id: number) => void;
  // Goes up by one each time the reader asks to see a passage, so the sheet
  // knows when to scroll to it. A new answer is tinted without scrolling.
  scrollRequest: number;
};

const FAILED_NOTICE =
  "Redline could not get an answer this time. Your question is still in the box, so you can ask again.";

export function useQuestions(text: string): Questions {
  const [asked, setAsked] = useState<Asked[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [shownId, setShownId] = useState<number | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const nextId = useRef(1);

  // A new document starts with no questions. Answers to the old one that
  // arrive late find no entry to fill in, so they are dropped.
  const [askedOf, setAskedOf] = useState(text);
  if (askedOf !== text) {
    setAskedOf(text);
    setAsked([]);
    setDraft("");
    setNotice(null);
    setShownId(null);
  }

  const ask = async () => {
    const question = draft.trim();
    if (question === "" || pending) return;
    const id = nextId.current++;
    setNotice(null);
    setPending(true);
    setAsked((list) => [{ id, question }, ...list]);

    let state: AskState;
    try {
      state = await askQuestion(text, question);
    } catch {
      state = { status: "failed" };
    }
    setPending(false);

    if (state.status !== "done") {
      // The question goes back to being only in the box.
      setAsked((list) => list.filter((entry) => entry.id !== id));
      setNotice(state.status === "invalid" ? state.message : FAILED_NOTICE);
      return;
    }
    const { result } = state;
    setAsked((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, result } : entry)),
    );
    setDraft((current) => (current.trim() === question ? "" : current));
    if (result.outcome === "answered") setShownId(id);
  };

  const shown = asked.find((entry) => entry.id === shownId)?.result;
  return {
    text,
    asked,
    draft,
    setDraft,
    pending,
    notice,
    ask: () => void ask(),
    shownId,
    shownPassage: shown?.outcome === "answered" ? shown.passageLocation : null,
    showPassage: (id) => {
      setShownId(id);
      setScrollRequest((n) => n + 1);
    },
    scrollRequest,
  };
}

export function QuestionBox({
  questions,
  canShowInDocument = true,
}: {
  questions: Questions;
  // False where the document is not drawn on the page, so there is no sheet
  // to tint.
  canShowInDocument?: boolean;
}) {
  const id = useId();
  const { asked, draft, setDraft, pending, notice, ask, shownId, showPassage } = questions;

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4 font-sans">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        <label id={`${id}-title`} htmlFor={`${id}-question`} className="tab-type text-sm text-ink">
          Ask about this document
        </label>
        <p id={`${id}-note`} className="text-sm leading-snug text-ink-soft">
          Redline answers only from this document and quotes the words each answer
          comes from.
        </p>
        <textarea
          id={`${id}-question`}
          rows={2}
          required
          maxLength={MAX_QUESTION_CHARACTERS}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter asks; Shift and Enter starts a new line.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              ask();
            }
          }}
          aria-describedby={`${id}-note ${id}-notice`}
          className="w-full rounded-sm border border-ink-soft bg-sheet px-3 py-2.5 text-base leading-snug text-ink"
        />
        <button type="submit" disabled={pending} className="group self-start rounded-sm disabled:cursor-wait">
          <span className="tab tab-red tab-forward tab-type block py-2.5 pl-4 pr-9 text-sm transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
            {pending ? "Looking in the document…" : "Ask"}
          </span>
        </button>
        <div id={`${id}-notice`} aria-live="polite">
          {notice && (
            <p role="alert" className="border border-ink-soft bg-sheet p-3 text-sm leading-snug text-ink">
              {notice}
            </p>
          )}
        </div>
      </form>

      {asked.length > 0 && (
        <ol aria-live="polite" className="flex flex-col">
          {asked.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 border-t border-rule py-4">
              <p className="text-sm leading-snug text-ink-soft">
                <span className="tab-type text-xs">You asked:</span> {entry.question}
              </p>
              <Reply
                entry={entry}
                shown={entry.id === shownId}
                onShow={canShowInDocument ? () => showPassage(entry.id) : undefined}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// The question box on its own, for a result whose document is not drawn on
// the page (every flag was held back). Answers still quote their passage.
export function StandaloneQuestionBox({ text }: { text: string }) {
  const questions = useQuestions(text);
  return <QuestionBox questions={questions} canShowInDocument={false} />;
}

function Reply({
  entry,
  shown,
  onShow,
}: {
  entry: Asked;
  shown: boolean;
  onShow?: () => void;
}) {
  const { result } = entry;
  if (!result) {
    return <p className="text-base leading-snug text-ink-soft">Looking in the document…</p>;
  }
  if (result.outcome !== "answered") {
    return <p className="text-base leading-snug text-ink">{result.statement}</p>;
  }
  return (
    <>
      <p className="text-base leading-relaxed text-ink">{result.answer}</p>
      <figure>
        <blockquote className="font-serif leading-relaxed text-ink">
          <span className="film-passage rounded-[2px] px-0.5" data-active={shown}>
            {result.passage}
          </span>
        </blockquote>
        <figcaption className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tab-type text-xs text-ink-soft">Word for word from your document</span>
          {onShow && (
            <button
              type="button"
              onClick={onShow}
              aria-pressed={shown}
              className="text-sm font-medium text-pen underline"
            >
              Show it in the document
            </button>
          )}
        </figcaption>
      </figure>
    </>
  );
}

// One paragraph's text with the shown passage tinted, for a sheet that has no
// flags. `[start, end)` is the paragraph's range in the document text.
export function withPassage(
  text: string,
  start: number,
  end: number,
  passage: SourceLocation | null,
): ReactNode[] {
  if (!passage || passage.end <= start || passage.start >= end) {
    return [text.slice(start, end)];
  }
  const from = Math.max(start, passage.start);
  const to = Math.min(end, passage.end);
  return [
    text.slice(start, from),
    <PassageFilm key={from} startsHere={from === passage.start}>
      {text.slice(from, to)}
    </PassageFilm>,
    text.slice(to, end),
  ];
}

// The tint on the sheet behind an answer's passage. The piece where the
// passage starts is marked, so the sheet can scroll to it.
export function PassageFilm({
  startsHere,
  children,
}: {
  startsHere: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className="film-passage rounded-[2px]"
      data-active="true"
      data-passage-start={startsHere ? "" : undefined}
    >
      {children}
    </span>
  );
}

// Scrolls the sheet to the shown passage's first line.
export function scrollToPassage(container: HTMLElement | null) {
  const start = container?.querySelector<HTMLElement>("[data-passage-start]");
  if (!start) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  start.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
}
