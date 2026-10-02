"use server";

import { analyse } from "@/lib/analysis/analyse.ts";
import { isTooLong, tooLongMessage } from "@/lib/analysis/limits.ts";
import { hasSomethingToCheck, redLinesToCheck } from "@/lib/analysis/red-lines.ts";
import {
  isDocumentType,
  type AnalysisResult,
  type DocumentType,
} from "@/lib/analysis/types.ts";
import { readerRedLines, type ReaderRedLines } from "@/lib/storage/reader-red-lines.ts";
import { openLibrary, type Library } from "@/lib/storage/session.ts";

// What happened to the library copy of a finished analysis.
export type LibraryNote =
  // Saved to the signed-in reader's library under this id.
  | { status: "saved"; id: string }
  // Nobody is signed in, or this copy of Redline has no sign-in. Nothing
  // was kept.
  | { status: "not-signed-in" }
  // The reader may be signed in, but saving failed. Nothing was kept.
  | { status: "failed" };

export type AnalyseState =
  | { status: "idle" }
  // The form was not filled in, or the document is over the length limit.
  // Nothing was sent to the model.
  | { status: "invalid"; message: string }
  | {
      status: "done";
      // The exact text that was analysed. Each flag's source location points
      // into it, so the page draws the document from this, not from the box.
      text: string;
      result: AnalysisResult;
      library: LibraryNote;
      // Whose red lines the analysis looked for. "unreachable" means the
      // reader's own could not be read, so the eight defaults were used.
      redLines: ReaderRedLines["source"];
    }
  | {
      // The analysis failed and nothing from it is shown. The text and type
      // are kept so the reader can retry without pasting again.
      status: "failed";
      text: string;
      documentType: DocumentType;
    };

export async function analyseDocument(
  _previous: AnalyseState,
  formData: FormData,
): Promise<AnalyseState> {
  const documentType = formData.get("documentType");
  const text = String(formData.get("text") ?? "").trim();

  if (!isDocumentType(documentType)) {
    return { status: "invalid", message: "Choose what kind of document this is." };
  }
  if (text === "") {
    return { status: "invalid", message: "Paste the document's text or choose a file first." };
  }
  // The page checks this before sending, but the server does not rely on it.
  if (isTooLong(text)) {
    return { status: "invalid", message: tooLongMessage(text) };
  }

  // The signed-in reader's red lines and leverage drive the analysis.
  // Anyone else gets the eight defaults, with leverage unanswered.
  const library = await openLibrary();
  const redLines = await readerRedLines(library);
  if (!hasSomethingToCheck(redLines.settings)) {
    return {
      status: "invalid",
      message:
        "All your red lines are switched off, so Redline has nothing to look for. Switch at least one back on in Red lines.",
    };
  }

  try {
    const result = await analyse({
      text,
      documentType,
      redLines: redLinesToCheck(redLines.settings),
      leverage: redLines.settings.leverage,
    });
    // Analyse has already written why it failed to the server log.
    if (result.outcome === "failed") return { status: "failed", text, documentType };
    const kept = await keepInLibrary(library, { documentType, text, analysis: result });
    return { status: "done", text, result, library: kept, redLines: redLines.source };
  } catch (error) {
    // Analyse reports its own failures as an outcome, so this is a mistake in
    // the call itself. The details stay in the server log. Never log the
    // document text.
    console.error("[redline] Analysis could not start:", error);
    return { status: "failed", text, documentType };
  }
}

// Saves a finished analysis to the reader's library when someone is signed
// in. A failure to save never hides the analysis: the reader still sees it,
// with a line saying it was not kept.
async function keepInLibrary(
  library: Library,
  document: {
    documentType: DocumentType;
    text: string;
    analysis: AnalysisResult;
  },
): Promise<LibraryNote> {
  try {
    if (library.status === "no-storage" || library.status === "signed-out") {
      return { status: "not-signed-in" };
    }
    if (library.status === "unreachable") return { status: "failed" };
    const id = await library.documents.save(library.userId, {
      ...document,
      analysedAt: new Date(),
    });
    return { status: "saved", id };
  } catch (error) {
    // The storage error names the step that failed, never document text.
    console.error(
      "[redline] Could not save to the library:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return { status: "failed" };
  }
}
