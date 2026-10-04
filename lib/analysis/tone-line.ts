import type { CounterOfferTone, Leverage } from "./types.ts";

// The line under the flag count saying how the counter-offers were worded
// and why, with a link where following it can change something. Kept apart
// from the page so a test can read it.

export type ToneLineView =
  // A result the reader has just asked for. `account` says whether they were
  // signed in, signed out, or using a copy of Redline with no sign-in.
  | { kind: "new"; account: "signed-in" | "signed-out" | "none" }
  // A copy opened from the library. `currentLeverage` is the reader's answer
  // today, or "unknown" when their red lines could not be read.
  | { kind: "saved"; currentLeverage: Leverage | null | "unknown" };

export type ToneLineParts = {
  text: string;
  link: { href: string; label: string } | null;
};

export const TONE_LABEL: Record<CounterOfferTone, string> = {
  firm: "worded firmly",
  request: "worded as a request",
};

export function toneLine(input: {
  tone: CounterOfferTone;
  leverage: Leverage | null;
  view: ToneLineView;
}): ToneLineParts {
  const { tone, leverage, view } = input;
  if (view.kind === "saved") return savedLine(tone, leverage, view.currentLeverage);
  const because =
    leverage === "can-walk-away"
      ? "you said you could walk away from deals like this"
      : leverage === "cannot-walk-away"
        ? "you said you could not walk away from deals like this"
        : "Redline does not know whether you could walk away";
  const text = `Each counter-offer is ${TONE_LABEL[tone]}, because ${because}.`;
  // Signed out, Red lines does not show the leverage question, so the link
  // goes to sign-in instead. With no sign-in there is nowhere to answer it.
  if (view.account === "none") return { text, link: null };
  if (view.account === "signed-out") {
    return { text, link: { href: "/sign-in", label: "Sign in to answer that" } };
  }
  return {
    text,
    link: {
      href: "/red-lines",
      label: leverage === null ? "Answer that in Red lines" : "Change your answer in Red lines",
    },
  };
}

// A library copy keeps the counter-offers it was saved with (BUILD-REPORT
// decision 40). It says which answer they followed, and, when the reader
// has answered differently since, that only a new check follows the new
// answer.
function savedLine(
  tone: CounterOfferTone,
  leverage: Leverage | null,
  current: Leverage | null | "unknown",
): ToneLineParts {
  const had =
    leverage === "can-walk-away"
      ? "you had said you could walk away from deals like this"
      : leverage === "cannot-walk-away"
        ? "you had said you could not walk away from deals like this"
        : "you had not said whether you could walk away";
  const then = `When Redline read this, ${had}, so each counter-offer is ${TONE_LABEL[tone]}.`;
  if (current === "unknown" || current === null || current === leverage) {
    return { text: then, link: null };
  }
  const now = current === "can-walk-away" ? "can" : "cannot";
  return {
    text: `${then} Your answer is now that you ${now} walk away. Redline has not redrafted these counter-offers.`,
    link: { href: "/try", label: "Check the document again" },
  };
}
