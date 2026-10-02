"use server";

import { answer } from "@/lib/analysis/answer.ts";
import { isTooLong, MAX_QUESTION_CHARACTERS } from "@/lib/analysis/limits.ts";
import type { AnswerResult } from "@/lib/analysis/types.ts";

export type AskState =
  // The question was empty or too long. Nothing was sent to the model.
  | { status: "invalid"; message: string }
  | { status: "done"; result: AnswerResult }
  // Getting an answer failed. The reason stays in the server log.
  | { status: "failed" };

// Asks one question about a document that has been analysed on this page.
// Nothing is stored on the server, so the page sends the analysed text back
// with each question. Every passage in an answer is checked against that
// text before it is returned.
export async function askQuestion(text: string, question: string): Promise<AskState> {
  const asked = String(question ?? "").trim();
  const documentText = String(text ?? "");

  if (asked === "") {
    return { status: "invalid", message: "Type a question first." };
  }
  if (asked.length > MAX_QUESTION_CHARACTERS) {
    return {
      status: "invalid",
      message: `Keep the question under ${MAX_QUESTION_CHARACTERS} characters.`,
    };
  }
  // The page only sends text it has already analysed, so these are not
  // expected. The server checks anyway rather than trusting the page.
  if (documentText.trim() === "" || isTooLong(documentText)) {
    return { status: "failed" };
  }

  try {
    const result = await answer(documentText, asked);
    // Answer has already written why it failed to the server log.
    if (result.outcome === "failed") return { status: "failed" };
    return { status: "done", result };
  } catch (error) {
    // Never log the document text or the question.
    console.error(
      "[redline] Answer could not start:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return { status: "failed" };
  }
}
