import type { ModelClient, ModelRequest } from "../../lib/analysis/model.ts";
import { SUMMARY_SHAPE } from "../../lib/analysis/reply-shapes.ts";
import type { Sidecar } from "./fixtures.ts";

// A stand-in for the model, for tests. It never calls the network. It builds
// each reply from a fixture's answer key, choosing what to build by the name
// of the reply shape the request asks for.
//
// To support a new kind of request (flags, answers), add a builder to
// DEFAULT_BUILDERS under that shape's name.

export type PayloadBuilder = (sidecar: Sidecar, request: ModelRequest) => unknown;

const DEFAULT_BUILDERS: Record<string, PayloadBuilder> = {
  [SUMMARY_SHAPE.name]: (sidecar) => ({ summary: summaryFrom(sidecar) }),
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
  } = {},
): StubModel {
  const builders = { ...DEFAULT_BUILDERS, ...options.builders };
  const requests: ModelRequest[] = [];

  return {
    requests,
    async complete(request) {
      requests.push(request);
      if (options.rawReply !== undefined) return options.rawReply;

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
