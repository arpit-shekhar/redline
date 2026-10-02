import type { ModelClient, ModelRequest } from "../../lib/analysis/model.ts";
import {
  ANSWER_SHAPE,
  FLAGS_SHAPE_NAME,
  SUMMARY_SHAPE,
} from "../../lib/analysis/reply-shapes.ts";
import type { FixtureQuestion, PlantedClause, Sidecar } from "./fixtures.ts";

// A stand-in for the model, for tests. It never calls the network. It builds
// each reply from a fixture's answer key, choosing what to build by the name
// of the reply shape the request asks for.
//
// To support a new kind of request (counter-offers), add a builder
// to DEFAULT_BUILDERS under that shape's name.

export type PayloadBuilder = (sidecar: Sidecar, request: ModelRequest) => unknown;

const DEFAULT_BUILDERS: Record<string, PayloadBuilder> = {
  [SUMMARY_SHAPE.name]: (sidecar) => ({ summary: summaryFrom(sidecar) }),
  [FLAGS_SHAPE_NAME]: (sidecar) => ({ flags: flagsFrom(sidecar) }),
  [ANSWER_SHAPE.name]: (sidecar, request) => answerFrom(questionAsked(sidecar, request)),
};

export type StubModel = ModelClient & {
  // Every request the stub received, in order.
  requests: ModelRequest[];
};

export function stubModel(
  sidecar: Sidecar,
  options: {
    // Replace or add builders, for example to send a payload with a field
    // missing.
    builders?: Record<string, PayloadBuilder>;
    // Send this exact text instead of any built payload, for example text
    // that is not JSON at all.
    rawReply?: string;
    // The same, for one reply shape only, keyed by the shape's name.
    rawReplies?: Record<string, string>;
  } = {},
): StubModel {
  const builders = { ...DEFAULT_BUILDERS, ...options.builders };
  const requests: ModelRequest[] = [];

  return {
    requests,
    async complete(request) {
      requests.push(request);
      if (options.rawReply !== undefined) return options.rawReply;
      const raw = options.rawReplies?.[request.shape.name];
      if (raw !== undefined) return raw;

      const build = builders[request.shape.name];
      if (!build) {
        throw new Error(
          `The stub model has no payload for the "${request.shape.name}" reply shape.`,
        );
      }
      return JSON.stringify(build(sidecar, request));
    },
  };
}

// The answer key holds no summary, so the stub writes one from the plain
// statements of what each planted clause says.
export function summaryFrom(sidecar: Sidecar): string {
  if (sidecar.planted.length === 0) {
    return `This ${sidecar.documentType.replace(/-/g, " ")} sets out the work, the payment and how the agreement ends.`;
  }
  return sidecar.planted.map((clause) => clause.textClaim).join("\n\n");
}

// One flag as the model sends it, before the check: no source location,
// because the analysis core works that out from the document.
export type FlagPayload = {
  clauseType: string;
  severity: string;
  sourceSentence: string;
  textClaim: string;
  outcomeClaim: string;
  escapabilityReasoning: string;
};

// A flag payload for one planted clause, quoting its sentence exactly as the
// answer key records it.
export function flagFrom(clause: PlantedClause): FlagPayload {
  return {
    clauseType: clause.clauseType,
    severity: clause.expectedSeverity,
    sourceSentence: clause.sourceSentence,
    textClaim: clause.textClaim,
    outcomeClaim: clause.outcomeClaim,
    escapabilityReasoning: clause.escapabilityReasoning,
  };
}

// The flags a careful model would send: one for every planted clause.
export function flagsFrom(sidecar: Sidecar): FlagPayload[] {
  return sidecar.planted.map(flagFrom);
}

// One answer as the model sends it, before the check.
export type AnswerPayload = {
  outcome: "answered" | "not-addressed" | "legality";
  answer: string;
  passage: string;
};

// Which of the answer key's questions a request asks. The stub only answers
// questions the answer key knows, so a test cannot pass on a made-up reply.
export function questionAsked(sidecar: Sidecar, request: ModelRequest): FixtureQuestion {
  const found = sidecar.questions.find((q) => request.prompt.includes(q.question));
  if (!found) {
    throw new Error("The stub model was asked a question that is not in the answer key.");
  }
  return found;
}

// The answer a careful model would send: the answer key's answer and passage
// for an answered question, and an empty refusal otherwise.
export function answerFrom(question: FixtureQuestion): AnswerPayload {
  if (question.expect === "answered") {
    return {
      outcome: "answered",
      answer: question.answer,
      passage: question.expectedPassage,
    };
  }
  return { outcome: question.expect, answer: "", passage: "" };
}
