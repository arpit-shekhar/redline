import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createOpenRouterClient,
  ModelCallError,
  ModelConfigError,
  ModelUnavailableError,
  type ModelRequest,
} from "./model.ts";

// The OpenRouter client is tested with a fake `fetch` (the function that makes
// web requests), so no network call is made. The model names below are made
// up for the test.

const KEY = "test-key-not-real";
const MODEL = "test-lab/test-model";
const env = { OPENROUTER_API_KEY: KEY, OPENROUTER_MODEL: MODEL };

type Call = {
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  signal?: AbortSignal | null;
};

// A stand-in for OpenRouter that lists the given models and records each call.
function fakeOpenRouter(
  listedModels: string[],
  reply: () => Response = () =>
    Response.json({ choices: [{ message: { content: '{"summary":"ok"}' } }] }),
) {
  const calls: Call[] = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      headers: init?.headers as Record<string, string> | undefined,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      signal: init?.signal,
    });
    if (url.endsWith("/models")) {
      return Response.json({ data: listedModels.map((id) => ({ id })) });
    }
    return reply();
  }) as typeof globalThis.fetch;
  const chatCalls = () => calls.filter((c) => c.url.endsWith("/chat/completions"));
  const listCalls = () => calls.filter((c) => c.url.endsWith("/models"));
  return { fetch, calls, chatCalls, listCalls };
}

const request: ModelRequest = {
  system: "system text",
  prompt: "prompt text",
  shape: {
    name: "summary",
    schema: {
      type: "object",
      properties: { summary: { type: "string" } },
      required: ["summary"],
      additionalProperties: false,
    },
  },
};

test("builds the request from the environment and the owner's settings", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });

  assert.equal(await client.complete(request), '{"summary":"ok"}');

  const [call] = openRouter.chatCalls();
  assert.equal(call.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(call.headers?.Authorization, `Bearer ${KEY}`);
  assert.equal(call.body?.model, MODEL);
  assert.deepEqual(call.body?.provider, {
    order: ["fireworks"],
    allow_fallbacks: false,
    require_parameters: true,
  });
  assert.deepEqual(call.body?.reasoning, { effort: "low" });
  assert.deepEqual(call.body?.response_format, {
    type: "json_schema",
    json_schema: { name: "summary", strict: true, schema: request.shape.schema },
  });
  assert.deepEqual(call.body?.messages, [
    { role: "system", content: "system text" },
    { role: "user", content: "prompt text" },
  ]);
});

// The same document got must change in one run and worth raising in the next
// (FINDINGS.md rank 8). Without a temperature the model runs at its default
// of 1, fully random sampling. Temperature 0 asks for its most likely answer
// each time. No seed: Fireworks does not accept one, and with
// require_parameters on, sending it would make every call fail.
test("asks for the least random answer, and sends no seed", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });
  await client.complete(request);

  const [call] = openRouter.chatCalls();
  assert.equal(call.body?.temperature, 0);
  assert.equal(call.body?.seed, undefined);
});

test("uses whatever model the environment names", async () => {
  const other = "another-lab/another-model";
  const openRouter = fakeOpenRouter([other]);
  const client = createOpenRouterClient({
    env: { ...env, OPENROUTER_MODEL: other },
    fetch: openRouter.fetch,
  });

  await client.complete(request);
  assert.equal(openRouter.chatCalls()[0].body?.model, other);
});

test("checks the model against the live list on the first call only", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });

  await client.complete(request);
  await client.complete(request);

  assert.equal(openRouter.listCalls().length, 1);
  assert.equal(openRouter.chatCalls().length, 2);
  assert.ok(openRouter.calls[0].url.endsWith("/models"), "the list is checked first");
});

test("stops with a clear error when the model is not listed, and calls no other model", async () => {
  const openRouter = fakeOpenRouter(["some-lab/other-model"]);
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });

  await assert.rejects(client.complete(request), (error: Error) => {
    assert.ok(error instanceof ModelUnavailableError);
    assert.ok(error.message.includes(MODEL));
    assert.ok(error.message.includes("OPENROUTER_MODEL"));
    return true;
  });
  assert.equal(openRouter.chatCalls().length, 0);
});

test("a missing key gives an error naming OPENROUTER_API_KEY, before any network call", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const client = createOpenRouterClient({
    env: { OPENROUTER_MODEL: MODEL },
    fetch: openRouter.fetch,
  });

  await assert.rejects(client.complete(request), (error: Error) => {
    assert.ok(error instanceof ModelConfigError);
    assert.match(error.message, /OPENROUTER_API_KEY is missing/);
    return true;
  });
  assert.equal(openRouter.calls.length, 0);
});

test("a missing model gives an error naming OPENROUTER_MODEL and never shows the key", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const client = createOpenRouterClient({
    env: { OPENROUTER_API_KEY: KEY, OPENROUTER_MODEL: "  " },
    fetch: openRouter.fetch,
  });

  await assert.rejects(client.complete(request), (error: Error) => {
    assert.ok(error instanceof ModelConfigError);
    assert.match(error.message, /OPENROUTER_MODEL is missing/);
    assert.ok(!error.message.includes(KEY));
    return true;
  });
  assert.equal(openRouter.calls.length, 0);
});

test("a refused request is an error, not a reply", async () => {
  const openRouter = fakeOpenRouter([MODEL], () =>
    Response.json({ error: { message: "No endpoints found" } }, { status: 404 }),
  );
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });

  await assert.rejects(client.complete(request), (error: Error) => {
    assert.ok(error instanceof ModelCallError);
    assert.match(error.message, /HTTP 404/);
    return true;
  });
});

test("a reply with no text is an error", async () => {
  const openRouter = fakeOpenRouter([MODEL], () =>
    Response.json({ choices: [{ message: { content: null } }] }),
  );
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });

  await assert.rejects(client.complete(request), ModelCallError);
});

test("passes the caller's signal on, so a request that takes too long can be cancelled", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const client = createOpenRouterClient({ env, fetch: openRouter.fetch });
  const controller = new AbortController();

  await client.complete({ ...request, signal: controller.signal });

  assert.equal(openRouter.chatCalls()[0].signal, controller.signal);
  assert.equal(openRouter.listCalls()[0].signal, controller.signal);
});
