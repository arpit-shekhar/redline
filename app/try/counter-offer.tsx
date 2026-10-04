"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { TONE_LABEL, toneLine, type ToneLineView } from "@/lib/analysis/tone-line.ts";
import type { CounterOfferTone, Leverage } from "@/lib/analysis/types.ts";

// The counter-offer part of a flag's note: Redline's drafted wording in a box
// the reader can edit, and one button that copies whatever the box holds now.
// Edits live only on this page. The parent keeps them, so they survive
// switching between flags.

// How long "Copied" shows before the button goes back to "Copy".
const CONFIRM_MS = 2500;

type CopyState = "idle" | "copied" | "blocked";

export function CounterOfferDraft({
  drafted,
  text,
  onChange,
  tone,
}: {
  // Redline's wording, as the analysis returned it.
  drafted: string;
  // What the box holds now: the drafted wording or the reader's edit of it.
  text: string;
  onChange: (text: string) => void;
  tone: CounterOfferTone | undefined;
}) {
  const id = useId();
  const box = useRef<HTMLTextAreaElement>(null);
  const [copy, setCopy] = useState<CopyState>("idle");

  useEffect(() => {
    if (copy !== "copied") return;
    const timer = setTimeout(() => setCopy("idle"), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [copy]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopy("copied");
    } catch {
      // Some browsers block the clipboard. Select the text so the reader can
      // copy it themselves.
      box.current?.focus();
      box.current?.select();
      setCopy("blocked");
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-rule pt-4">
      <label htmlFor={`${id}-text`} className="tab-type text-xs text-ink-soft">
        Counter-offer{tone ? `, ${TONE_LABEL[tone]}` : ""}
      </label>
      <p id={`${id}-note`} className="text-sm leading-snug text-ink-soft">
        Change it as you like, then copy it into your reply to the other side.
      </p>
      <textarea
        ref={box}
        id={`${id}-text`}
        rows={7}
        value={text}
        onChange={(event) => {
          onChange(event.target.value);
          setCopy("idle");
        }}
        aria-describedby={`${id}-note ${id}-status`}
        className="field-sizing-content min-h-32 w-full rounded-sm border border-ink-soft bg-sheet px-3 py-2.5 text-base leading-relaxed text-ink"
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={copyText}
          disabled={text.trim() === ""}
          className="group rounded-sm disabled:cursor-not-allowed"
        >
          <span className="tab tab-red tab-forward tab-type block py-2.5 pl-4 pr-9 text-sm transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
            {copy === "copied" ? "Copied" : "Copy"}
          </span>
        </button>
        {text !== drafted && (
          <button
            type="button"
            onClick={() => {
              onChange(drafted);
              setCopy("idle");
            }}
            className="text-sm font-medium text-pen underline"
          >
            Undo my changes
          </button>
        )}
      </div>
      <p id={`${id}-status`} aria-live="polite" className="text-sm leading-snug text-ink-soft">
        {copy === "copied" && "Copied. Paste it into your email or message."}
        {copy === "blocked" &&
          "Your browser would not let Redline copy it. The text is selected, so copy it the way you usually do."}
      </p>
    </div>
  );
}

// One line under the flag count saying how the counter-offers were worded
// and why. Its wording comes from toneLine.
export function ToneLine({
  tone,
  leverage,
  view,
}: {
  tone: CounterOfferTone;
  leverage: Leverage | null;
  view: ToneLineView;
}) {
  const { text, link } = toneLine({ tone, leverage, view });
  return (
    <p className="text-base leading-relaxed text-ink">
      {text}
      {link && (
        <>
          {" "}
          <Link href={link.href} className="font-medium text-pen underline">
            {link.label}
          </Link>
          .
        </>
      )}
    </p>
  );
}
