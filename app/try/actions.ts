"use server";

import { analyse } from "@/lib/analysis/analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "@/lib/analysis/red-lines.ts";
import {
  isDocumentType,
  type AnalysisResult,
  type DocumentType,
} from "@/lib/analysis/types.ts";

export type AnalyseState =
  | { status: "idle" }
  // The form was not filled in. Nothing was sent to the model.
  | { status: "invalid"; message: string }
  | {
      status: "done";
      // The exact text that was analysed. Each flag's source location points
      // into it, so the page draws the document from this, not from the box.
      text: string;
      result: AnalysisResult;
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
    return { status: "invalid", message: "Paste the document's text first." };
  }

  try {
    const result = await analyse({
      text,
      documentType,
      redLines: DEFAULT_RED_LINES,
      leverage: DEFAULT_LEVERAGE,
    });
    // Analyse has already written why it failed to the server log.
    if (result.outcome === "failed") return { status: "failed", text, documentType };
    return { status: "done", text, result };
  } catch (error) {
    // Analyse reports its own failures as an outcome, so this is a mistake in
    // the call itself. The details stay in the server log. Never log the
    // document text.
    console.error("[redline] Analysis could not start:", error);
    return { status: "failed", text, documentType };
  }
}
