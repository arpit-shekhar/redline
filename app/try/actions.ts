"use server";

import { analyse } from "@/lib/analysis/analyse.ts";
import { DEFAULT_LEVERAGE, DEFAULT_RED_LINES } from "@/lib/analysis/red-lines.ts";
import { isDocumentType, type Flag } from "@/lib/analysis/types.ts";

export type AnalyseState =
  | { status: "idle" }
  | {
      status: "done";
      // The exact text that was analysed. Each flag's source location points
      // into it, so the page draws the document from this, not from the box.
      text: string;
      summary: string;
      flags: Flag[];
      dropped: number;
    }
  | { status: "error"; message: string };

export async function analyseDocument(
  _previous: AnalyseState,
  formData: FormData,
): Promise<AnalyseState> {
  const documentType = formData.get("documentType");
  const text = String(formData.get("text") ?? "").trim();

  if (!isDocumentType(documentType)) {
    return { status: "error", message: "Choose what kind of document this is." };
  }
  if (text === "") {
    return { status: "error", message: "Paste the document's text first." };
  }

  try {
    const analysis = await analyse({
      text,
      documentType,
      redLines: DEFAULT_RED_LINES,
      leverage: DEFAULT_LEVERAGE,
    });
    return { status: "done", text, ...analysis };
  } catch (error) {
    // The details stay in the server log. Never log the document text.
    console.error("[redline] Analysis failed:", error);
    return {
      status: "error",
      message:
        "The analysis failed, so nothing is shown. Your document was not saved. Try again in a moment.",
    };
  }
}
