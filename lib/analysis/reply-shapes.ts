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

// The flags reply. The clause types the model may use are the reader's
// switched-on red lines, so the list is built for each request. The shape's
// name stays the same whatever the list holds.
export const FLAGS_SHAPE_NAME = "flags";

export function flagsShape(clauseTypes: readonly string[]): ReplyShape {
  return {
    name: FLAGS_SHAPE_NAME,
    schema: {
      type: "object",
      properties: {
        flags: {
          type: "array",
          description:
            "One entry for each clause that could hurt the person asked to sign. An empty list if there are none.",
          items: {
            type: "object",
            properties: {
              clauseType: {
                type: "string",
                enum: [...clauseTypes],
                description: "Which of the listed clause types this is.",
              },
              severity: {
                type: "string",
                enum: ["must-change", "worth-raising"],
              },
              sourceSentence: {
                type: "string",
                description:
                  "The one sentence the flag comes from, copied character for character from the document, spelling mistakes included.",
              },
              textClaim: {
                type: "string",
                description: "What the sentence says, stated plainly with no hedging.",
              },
              outcomeClaim: {
                type: "string",
                description:
                  "What it might do to the person, using may, might or could.",
              },
              escapabilityReasoning: {
                type: "string",
                description:
                  "Why this severity, in terms of how hard the clause is to get out of once signed.",
              },
            },
            required: [
              "clauseType",
              "severity",
              "sourceSentence",
              "textClaim",
              "outcomeClaim",
              "escapabilityReasoning",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["flags"],
      additionalProperties: false,
    },
  };
}

// The reply to one question about the document. The model sorts the question
// into one of three kinds. Only "answered" fills in `answer` and `passage`;
// for the other two both are empty strings. Every field is required because
// the strict JSON mode asks for it; Answer ignores the text of a refusal.
export const ANSWER_SHAPE: ReplyShape = {
  name: "answer",
  schema: {
    type: "object",
    properties: {
      outcome: {
        type: "string",
        enum: ["answered", "not-addressed", "legality"],
        description:
          '"legality" if the question asks whether anything is legal, lawful, valid or enforceable, or would hold up in court. Otherwise "answered" if the document itself answers the question, and "not-addressed" if it does not.',
      },
      answer: {
        type: "string",
        description:
          'The answer in plain English, drawn only from the document. An empty string unless outcome is "answered".',
      },
      passage: {
        type: "string",
        description:
          'The sentence, or part of a sentence, the answer comes from, copied character for character from the document. An empty string unless outcome is "answered".',
      },
    },
    required: ["outcome", "answer", "passage"],
    additionalProperties: false,
  },
};
