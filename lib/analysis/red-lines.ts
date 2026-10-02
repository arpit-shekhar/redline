import type { Leverage, RedLine, Severity } from "./types.ts";

// The defaults every reader's list starts from (PRD.md section 5). A reader
// who has signed in can switch each one off or change its severity. Everyone
// else gets these exactly.
export const DEFAULT_RED_LINES: RedLine[] = [
  { clauseType: "Automatic renewal", severity: "must-change", enabled: true },
  { clauseType: "Personal guarantees", severity: "must-change", enabled: true },
  {
    clauseType: "Forced arbitration and class-action waivers",
    severity: "must-change",
    enabled: true,
  },
  {
    clauseType: "Weak freelance payment terms",
    severity: "must-change",
    enabled: true,
  },
  { clauseType: "Non-competes", severity: "must-change", enabled: true },
  {
    clauseType: "Security deposit withholding",
    severity: "must-change",
    enabled: true,
  },
  {
    clauseType: "Late fees and penalties",
    severity: "worth-raising",
    enabled: true,
  },
  {
    clauseType: "Indemnity and liability caps",
    severity: "worth-raising",
    enabled: true,
  },
];

// Until the reader answers the leverage question, their leverage is not
// known, and counter-offers are worded as requests (see toneFor in
// types.ts).
export const DEFAULT_LEVERAGE: Leverage | null = null;

// ---------------------------------------------------------------------------
// One reader's red lines

// A red line the reader wrote in their own words, with the severity they
// picked for it. The id lets the page remove one line without touching the
// others.
export type OwnRedLine = { id: string; words: string; severity: Severity };

// Everything the reader has set: the eight defaults with their changes, the
// red lines in their own words, and their leverage (ADR 0005 keeps leverage
// here because it is a standing fact about the reader).
export type RedLineSettings = {
  // Always the eight defaults, in the order of DEFAULT_RED_LINES.
  defaults: RedLine[];
  own: OwnRedLine[];
  // null until the reader answers.
  leverage: Leverage | null;
};

export const DEFAULT_SETTINGS: RedLineSettings = {
  defaults: DEFAULT_RED_LINES,
  own: [],
  leverage: DEFAULT_LEVERAGE,
};

// A reader can keep this many red lines in their own words. Each one is
// another kind of clause the model looks for in every document.
export const MAX_OWN_RED_LINES = 20;

// The longest red line a reader can write, in characters. A red line is a
// sentence, not a paragraph.
export const MAX_OWN_WORDS = 200;

// The list Analyse is given: the eight defaults as the reader set them, then
// the reader's own red lines, each switched on.
export function redLinesToCheck(settings: RedLineSettings): RedLine[] {
  return [
    ...settings.defaults,
    ...settings.own.map((line) => ({
      clauseType: line.words,
      severity: line.severity,
      enabled: true,
      ownWords: true,
    })),
  ];
}

// True when at least one red line is switched on. With none, there is
// nothing to look for and Analyse refuses to run.
export function hasSomethingToCheck(settings: RedLineSettings): boolean {
  return redLinesToCheck(settings).some((line) => line.enabled);
}

export function isDefaultClauseType(clauseType: string): boolean {
  return DEFAULT_RED_LINES.some((line) => line.clauseType === clauseType);
}

// ---------------------------------------------------------------------------
// Changes the red lines page makes. Each returns new settings, or a problem
// to show the reader, and never changes the settings it was given.

export type Change = { ok: true; settings: RedLineSettings } | { ok: false; problem: string };

export function switchDefault(
  settings: RedLineSettings,
  clauseType: string,
  enabled: boolean,
): Change {
  return changeDefault(settings, clauseType, (line) => ({ ...line, enabled }));
}

export function setDefaultSeverity(
  settings: RedLineSettings,
  clauseType: string,
  severity: Severity,
): Change {
  return changeDefault(settings, clauseType, (line) => ({ ...line, severity }));
}

function changeDefault(
  settings: RedLineSettings,
  clauseType: string,
  change: (line: RedLine) => RedLine,
): Change {
  if (!isDefaultClauseType(clauseType)) {
    return { ok: false, problem: "Redline does not know that kind of clause." };
  }
  return {
    ok: true,
    settings: {
      ...settings,
      defaults: settings.defaults.map((line) =>
        line.clauseType === clauseType ? change(line) : line,
      ),
    },
  };
}

// Spaces, tabs and line breaks become single spaces, and the ends are
// trimmed, so the words sent to the model are the words the reader sees.
export function tidyWords(words: string): string {
  return words.replace(/\s+/g, " ").trim();
}

export function addOwnRedLine(
  settings: RedLineSettings,
  rawWords: string,
  severity: Severity,
  id: string = crypto.randomUUID(),
): Change {
  const words = tidyWords(rawWords);
  if (words === "") {
    return { ok: false, problem: "Write the red line first." };
  }
  if (words.length > MAX_OWN_WORDS) {
    return {
      ok: false,
      problem: `Keep it to ${MAX_OWN_WORDS} characters. This one has ${words.length}.`,
    };
  }
  if (settings.own.length >= MAX_OWN_RED_LINES) {
    return {
      ok: false,
      problem: `You have ${MAX_OWN_RED_LINES} red lines of your own, which is the most Redline keeps. Remove one to add another.`,
    };
  }
  const same = (other: string) => other.toLowerCase() === words.toLowerCase();
  if (settings.defaults.some((line) => same(line.clauseType))) {
    return { ok: false, problem: "That is already one of the eight in the list above." };
  }
  if (settings.own.some((line) => same(line.words))) {
    return { ok: false, problem: "You already have that red line." };
  }
  return {
    ok: true,
    settings: { ...settings, own: [...settings.own, { id, words, severity }] },
  };
}

export function removeOwnRedLine(settings: RedLineSettings, id: string): Change {
  return {
    ok: true,
    settings: { ...settings, own: settings.own.filter((line) => line.id !== id) },
  };
}

export function setLeverage(settings: RedLineSettings, leverage: Leverage): Change {
  return { ok: true, settings: { ...settings, leverage } };
}
