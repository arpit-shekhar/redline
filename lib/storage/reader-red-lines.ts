import { DEFAULT_SETTINGS, type RedLineSettings } from "../analysis/red-lines.ts";
import type { Library } from "./session.ts";

// The red lines and leverage that apply to the person asking, and where they
// came from. The analysis and the red lines page both start here.
export type ReaderRedLines =
  // Nobody is signed in, or this copy of Redline has no sign-in. The eight
  // defaults apply and leverage is unanswered.
  | { source: "no-account"; settings: RedLineSettings }
  // The signed-in reader's own settings. If they have never saved any, these
  // are the defaults, which is where their list starts.
  | { source: "yours"; settings: RedLineSettings }
  // The reader may be signed in, but their red lines could not be read. The
  // defaults are used, and the reader is told so.
  | { source: "unreachable"; settings: RedLineSettings };

export async function readerRedLines(library: Library): Promise<ReaderRedLines> {
  if (library.status === "no-storage" || library.status === "signed-out") {
    return { source: "no-account", settings: DEFAULT_SETTINGS };
  }
  if (library.status === "unreachable") {
    return { source: "unreachable", settings: DEFAULT_SETTINGS };
  }
  try {
    const saved = await library.redLines.get(library.userId);
    return { source: "yours", settings: saved ?? DEFAULT_SETTINGS };
  } catch (error) {
    // The storage error names the step that failed and nothing the reader
    // wrote.
    console.error(
      "[redline] Could not read the red lines:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return { source: "unreachable", settings: DEFAULT_SETTINGS };
  }
}
