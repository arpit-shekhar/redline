"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  addOwnRedLine,
  DEFAULT_SETTINGS,
  removeOwnRedLine,
  setDefaultSeverity,
  setLeverage,
  switchDefault,
  type Change,
  type RedLineSettings,
} from "@/lib/analysis/red-lines.ts";
import { isLeverage, isSeverity } from "@/lib/analysis/types.ts";
import { openLibrary } from "@/lib/storage/session.ts";

// Every change on the red lines page is saved here, for the signed-in reader
// only. Each one reads the reader's current red lines, makes one change and
// saves the whole set back.

type Saved =
  | { status: "saved" }
  // Nobody is signed in, or this copy of Redline has no sign-in.
  | { status: "no-account" }
  // The red lines could not be read or saved.
  | { status: "failed" }
  // The change itself was refused, with a reason for the reader.
  | { status: "refused"; problem: string };

async function save(change: (settings: RedLineSettings) => Change): Promise<Saved> {
  const library = await openLibrary();
  if (library.status === "no-storage" || library.status === "signed-out") {
    return { status: "no-account" };
  }
  if (library.status === "unreachable") return { status: "failed" };
  try {
    const current = (await library.redLines.get(library.userId)) ?? DEFAULT_SETTINGS;
    const changed = change(current);
    if (!changed.ok) return { status: "refused", problem: changed.problem };
    await library.redLines.save(library.userId, changed.settings);
    return { status: "saved" };
  } catch (error) {
    // The storage error names the step that failed, never what the reader
    // wrote.
    console.error(
      "[redline] Could not save the red lines:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return { status: "failed" };
  }
}

// After a change from one of the page's small forms: show the page again
// with the change in place, or with a line saying it was not saved.
function finish(saved: Saved) {
  if (saved.status === "failed") redirect("/red-lines?not-saved");
  if (saved.status === "saved") refresh();
  // Without an account, or with a change Redline does not know, the page
  // already shows why nothing changed.
}

export async function switchDefaultAction(formData: FormData) {
  const clauseType = String(formData.get("clauseType") ?? "");
  const enabled = formData.get("enabled") === "on";
  finish(await save((settings) => switchDefault(settings, clauseType, enabled)));
}

export async function setSeverityAction(formData: FormData) {
  const clauseType = String(formData.get("clauseType") ?? "");
  const severity = formData.get("severity");
  if (!isSeverity(severity)) return;
  finish(await save((settings) => setDefaultSeverity(settings, clauseType, severity)));
}

export async function removeOwnAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  finish(await save((settings) => removeOwnRedLine(settings, id)));
}

export async function setLeverageAction(formData: FormData) {
  const leverage = formData.get("leverage");
  if (!isLeverage(leverage)) return;
  finish(await save((settings) => setLeverage(settings, leverage)));
}

// What the form for adding a red line shows after a try. A refused red line
// keeps the reader's words in the box so they can fix them.
export type AddState =
  | { status: "idle" }
  | { status: "added"; attempt: number }
  | { status: "refused"; problem: string; words: string; attempt: number };

export async function addOwnAction(previous: AddState, formData: FormData): Promise<AddState> {
  const words = String(formData.get("words") ?? "");
  const severity = formData.get("severity");
  const attempt = (previous.status === "idle" ? 0 : previous.attempt) + 1;
  if (!isSeverity(severity)) {
    return {
      status: "refused",
      problem: "Choose how serious it is: must change or worth raising.",
      words,
      attempt,
    };
  }
  const saved = await save((settings) => addOwnRedLine(settings, words, severity));
  if (saved.status === "refused") {
    return { status: "refused", problem: saved.problem, words, attempt };
  }
  if (saved.status === "no-account") {
    return { status: "refused", problem: "Sign in to add a red line.", words, attempt };
  }
  if (saved.status === "failed") {
    return {
      status: "refused",
      problem: "Redline could not save that just now. Try again in a minute.",
      words,
      attempt,
    };
  }
  refresh();
  return { status: "added", attempt };
}
