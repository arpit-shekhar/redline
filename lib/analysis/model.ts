// The only place the model is named. Do not change it without the owner's
// approval (CLAUDE.md, "Settled").
export const MODEL = "anthropic/claude-sonnet-5";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";

export type ModelRequest = { system: string; prompt: string };

// Sends one request to the model and returns its text reply.
export type Complete = (request: ModelRequest) => Promise<string>;

export class ModelUnavailableError extends Error {
  name = "ModelUnavailableError";
}

export class ModelCallError extends Error {
  name = "ModelCallError";
}

export function createOpenRouterComplete(options: {
  apiKey: string | undefined;
  fetch?: typeof fetch;
}): Complete {
  const fetchFn = options.fetch ?? fetch;
  let modelCheck: Promise<void> | undefined;

  return async (request) => {
    if (!options.apiKey) {
      throw new ModelCallError(
        "OPENROUTER_API_KEY is missing. Add it to .env.local.",
      );
    }

    // Checked once per process. A failed check is retried on the next call
    // rather than remembered, so a network blip does not stick.
    modelCheck ??= checkModelIsListed(fetchFn).catch((error) => {
      modelCheck = undefined;
      throw error;
    });
    await modelCheck;

    const response = await fetchFn(`${OPENROUTER_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.prompt },
        ],
      }),
    });
    if (!response.ok) {
      throw new ModelCallError(`OpenRouter returned HTTP ${response.status}.`);
    }

    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new ModelCallError("OpenRouter returned no text.");
    }
    return text;
  };
}

async function checkModelIsListed(fetchFn: typeof fetch): Promise<void> {
  const response = await fetchFn(`${OPENROUTER_URL}/models`);
  if (!response.ok) {
    throw new ModelCallError(
      `Could not read OpenRouter's model list: HTTP ${response.status}.`,
    );
  }
  const body = await response.json();
  const ids: unknown[] = Array.isArray(body?.data)
    ? body.data.map((model: { id?: unknown }) => model.id)
    : [];
  if (!ids.includes(MODEL)) {
    throw new ModelUnavailableError(
      `${MODEL} is not on OpenRouter's live model list. Redline will not ` +
        "switch to another model on its own; the owner has to choose one.",
    );
  }
}

let shared: Complete | undefined;

// The default client, reading the key from the environment on first use.
export const openRouterComplete: Complete = (request) => {
  shared ??= createOpenRouterComplete({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  return shared(request);
};
