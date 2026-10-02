import type { ReplyShape } from "./model.ts";

// The JSON shapes the model is asked to reply in, one per kind of request.
// A test stub picks its reply by the shape's name, so each name is unique.

export const SUMMARY_SHAPE: ReplyShape = {
  name: "summary",
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "What the document does to the person asked to sign it, in plain English. Short paragraphs separated by blank lines.",
      },
    },
    required: ["summary"],
    additionalProperties: false,
  },
};
