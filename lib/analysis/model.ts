// The model client. The analysis core asks it for one reply at a time and
// never learns which model answered. Which model to use comes only from the
// OPENROUTER_MODEL environment variable, so no model is named in this code.

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

// Every call goes to one provider, with no fallback to another provider and
// no provider that would silently ignore a request setting such as the JSON
// shape below. The owner chose these settings.
const PROVIDER = {
  order: ["fireworks"],
  allow_fallbacks: false,
  require_parameters: true,
};

const REASONING = { effort: "low" };

// Temperature sets how random the model's choices are. Left unset, this model
// runs at 1, and the same document came back must change in one run and
// worth raising in the next. At 0 it gives its most likely answer each time,
// which makes runs agree more often but not always. Fireworks accepts this
// setting. It does not accept `seed`, so none is sent: with
// require_parameters on, that would make every call fail.
const TEMPERATURE = 0;

// How long one analysis may wait for the model, in milliseconds. After this
// the analysis stops, cancels any request still running, and reports that it
// failed. A long document can take the model a minute to read, so this
// leaves room for that and little more.
export const MODEL_TIMEOUT_MS = 90_000;

// A JSON Schema (a description of the exact JSON shape a reply must have) with
// a name. The model is asked to reply in this shape.
export type ReplyShape = {
  name: string;
  schema: Record<string, unknown>;
};

export type ModelRequest = {
  system: string;
  prompt: string;
  shape: ReplyShape;
  // Fires when the caller stops waiting, so the request can be cancelled.
  signal?: AbortSignal;
};

// What the analysis core depends on. `complete` sends one request and returns
// the model's reply as raw text. The caller parses and checks that text, so a
// reply that does not fit the shape is caught in one place.
export type ModelClient = {
  complete(request: ModelRequest): Promise<string>;
};

// A setting the model call needs is not set. The message names the variable
// and never includes any value.
export class ModelConfigError extends Error {
  name = "ModelConfigError";
}

// The model named in OPENROUTER_MODEL is not on OpenRouter's live list.
export class ModelUnavailableError extends Error {
  name = "ModelUnavailableError";
}

// OpenRouter could not be reached, refused the request, or sent no reply.
export class ModelCallError extends Error {
  name = "ModelCallError";
  // The HTTP status OpenRouter answered with. Missing when it could not be
  // reached or sent no reply text.
  readonly status?: number;

  constructor(message: string, options: { cause?: unknown; status?: number } = {}) {
    super(message, { cause: options.cause });
    this.status = options.status;
  }
}

export type ModelEnv = {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
};

export function createOpenRouterClient(
  options: {
    // Read on every call, so a value set after start-up is picked up.
    env?: ModelEnv;
    fetch?: typeof fetch;
  } = {},
): ModelClient {
  const env: Record<string, string | undefined> = options.env ?? process.env;
  const fetchFn = options.fetch ?? fetch;

  // Each model name is checked against the live list once. A failed check is
  // forgotten, so a network blip is retried on the next call.
  const checks = new Map<string, Promise<void>>();
  const checkOnce = (model: string, signal?: AbortSignal) => {
    let check = checks.get(model);
    if (!check) {
      check = checkModelIsListed(fetchFn, model, signal).catch((error) => {
        checks.delete(model);
        throw error;
      });
      checks.set(model, check);
    }
    return check;
  };

  return {
    async complete(request) {
      const apiKey = readSetting(env, "OPENROUTER_API_KEY");
      const model = readSetting(env, "OPENROUTER_MODEL");

      await checkOnce(model, request.signal);

      let response: Response;
      try {
        response = await fetchFn(`${OPENROUTER_URL}/chat/completions`, {
          method: "POST",
          signal: request.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: request.system },
              { role: "user", content: request.prompt },
            ],
            provider: PROVIDER,
            reasoning: REASONING,
            temperature: TEMPERATURE,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: request.shape.name,
                strict: true,
                schema: request.shape.schema,
              },
            },
          }),
        });
      } catch (error) {
        throw new ModelCallError("Could not reach OpenRouter.", { cause: error });
      }

      if (!response.ok) {
        throw new ModelCallError(
          `OpenRouter returned HTTP ${response.status}.${await errorDetail(response)}`,
          { status: response.status },
        );
      }

      const body = await response.json().catch(() => undefined);
      const text = body?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || text.trim() === "") {
        throw new ModelCallError("OpenRouter returned no reply text.");
      }
      return text;
    },
  };
}

function readSetting(
  env: Record<string, string | undefined>,
  name: keyof ModelEnv,
): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new ModelConfigError(`${name} is missing. Add it to .env.local.`);
  }
  return value;
}

async function checkModelIsListed(
  fetchFn: typeof fetch,
  model: string,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetchFn(`${OPENROUTER_URL}/models`, { signal });
  } catch (error) {
    throw new ModelCallError("Could not reach OpenRouter's model list.", {
      cause: error,
    });
  }
  if (!response.ok) {
    throw new ModelCallError(
      `Could not read OpenRouter's model list: HTTP ${response.status}.`,
      { status: response.status },
    );
  }
  const body = await response.json().catch(() => undefined);
  const ids: unknown[] = Array.isArray(body?.data)
    ? body.data.map((entry: { id?: unknown }) => entry?.id)
    : [];
  if (!ids.includes(model)) {
    throw new ModelUnavailableError(
      `"${model}", the model set in OPENROUTER_MODEL, is not on OpenRouter's ` +
        "live model list. Redline does not switch to another model on its own. " +
        "The owner has to choose one.",
    );
  }
}

// OpenRouter explains a refused request in `error.message`. It never holds
// the key, so it is safe to pass on to the server log.
async function errorDetail(response: Response): Promise<string> {
  const body = await response.json().catch(() => undefined);
  const message = body?.error?.message;
  return typeof message === "string" ? ` ${message.slice(0, 300)}` : "";
}

let shared: ModelClient | undefined;

// The client the app uses unless a caller passes its own: the real OpenRouter
// client, reading its settings from the environment.
export const openRouterClient: ModelClient = {
  complete(request) {
    shared ??= createOpenRouterClient();
    return shared.complete(request);
  },
};
