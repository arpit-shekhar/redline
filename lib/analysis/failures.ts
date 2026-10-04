import { ModelCallError, ModelConfigError, ModelUnavailableError } from "./model.ts";

// What went wrong when the model could not give a usable reply, which of
// those failures are worth one more try, and the sentence the reader sees
// for each. Analyse and Answer share this.

// The model did not reply in time.
export class AnalysisTimedOutError extends Error {
  name = "AnalysisTimedOutError";
}

// The model replied, but not in a shape Redline can use. Analyse and Answer
// each have their own kind of this.
export class UnreadableReplyError extends Error {
  name = "UnreadableReplyError";
}

export type FailureKind =
  | "busy"
  | "timed-out"
  | "unreadable"
  | "unavailable"
  | "not-set-up"
  | "unexpected";

// One sentence for each kind, written by Redline. Model text never appears
// here, and neither does document text.
export const FAILURE_SENTENCE: Record<FailureKind, string> = {
  busy: "Redline's AI service was too busy to take it just now.",
  "timed-out": "Redline's AI service took too long to reply.",
  unreadable: "Redline's AI service sent back a reply Redline could not read.",
  unavailable: "Redline could not get a reply from its AI service.",
  "not-set-up": "Redline is not set up correctly, so it could not send the document to be read.",
  unexpected: "Something went wrong inside Redline.",
};

export function failureKind(error: unknown): FailureKind {
  if (error instanceof AnalysisTimedOutError) return "timed-out";
  if (error instanceof ModelConfigError || error instanceof ModelUnavailableError) {
    return "not-set-up";
  }
  if (error instanceof UnreadableReplyError) return "unreadable";
  if (error instanceof ModelCallError) return error.status === 429 ? "busy" : "unavailable";
  return "unexpected";
}

// A failure the same request could get past a moment later: an unreadable
// reply, no connection or no reply text, too many requests (HTTP 429), or a
// fault at the service (HTTP 5xx). A timeout has used up the time, and a
// setup problem or any other refusal would only happen again.
export function isTemporary(error: unknown): boolean {
  if (error instanceof UnreadableReplyError) return true;
  if (!(error instanceof ModelCallError)) return false;
  return error.status === undefined || error.status === 429 || error.status >= 500;
}

// Runs `attempt`, and after a temporary failure runs it once more. Each try
// gets its own signal, so a request still running from the first try is
// cancelled before the second starts. Both tries share the caller's signal,
// so the second never runs past the caller's time limit.
export async function retryOnce<T>(
  signal: AbortSignal,
  attempt: (signal: AbortSignal) => Promise<T>,
  log: (message: string) => void,
): Promise<T> {
  try {
    return await withOwnSignal(signal, attempt);
  } catch (error) {
    if (signal.aborted || !isTemporary(error)) throw error;
    log(`Trying once more after a temporary failure. ${describeError(error)}`);
    return withOwnSignal(signal, attempt);
  }
}

async function withOwnSignal<T>(
  outer: AbortSignal,
  attempt: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const stop = () => controller.abort(outer.reason);
  outer.addEventListener("abort", stop, { once: true });
  try {
    return await attempt(controller.signal);
  } finally {
    controller.abort();
    outer.removeEventListener("abort", stop);
  }
}

// For the server log: the error's name and message, never document text.
export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error.";
}
