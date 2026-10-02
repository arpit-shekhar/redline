import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createOpenRouterComplete,
  MODEL,
  ModelCallError,
  ModelUnavailableError,
} from "./model.ts";

type Call = { url: string; body?: { model?: string } };

// A stand-in for OpenRouter that lists the given models and records each call.
function fakeOpenRouter(listedModels: string[]) {
  const calls: Call[] = [];
  const fetch = (async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (url.endsWith("/models")) {
      return Response.json({ data: listedModels.map((id) => ({ id })) });
    }
    return Response.json({ choices: [{ message: { content: "reply" } }] });
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

const request = { system: "system", prompt: "prompt" };

test("calls the pinned model, checking the live list only once", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const complete = createOpenRouterComplete({ apiKey: "test-key", ...openRouter });

  assert.equal(await complete(request), "reply");
  await complete(request);

  const listChecks = openRouter.calls.filter((c) => c.url.endsWith("/models"));
  const modelCalls = openRouter.calls.filter((c) => c.url.endsWith("/chat/completions"));
  assert.equal(listChecks.length, 1);
  assert.equal(modelCalls.length, 2);
  assert.ok(modelCalls.every((c) => c.body?.model === MODEL));
});

test("stops with a clear error when the pinned model is not listed", async () => {
  const openRouter = fakeOpenRouter(["some/other-model"]);
  const complete = createOpenRouterComplete({ apiKey: "test-key", ...openRouter });

  await assert.rejects(complete(request), (error: Error) => {
    assert.ok(error instanceof ModelUnavailableError);
    assert.ok(error.message.includes(MODEL));
    return true;
  });
  assert.ok(
    openRouter.calls.every((c) => !c.url.endsWith("/chat/completions")),
    "no other model is called in its place",
  );
});

test("refuses to call OpenRouter without a key", async () => {
  const openRouter = fakeOpenRouter([MODEL]);
  const complete = createOpenRouterComplete({ apiKey: undefined, ...openRouter });

  await assert.rejects(complete(request), ModelCallError);
  assert.equal(openRouter.calls.length, 0);
});
