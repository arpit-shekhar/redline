import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_SETTINGS,
  setLeverage,
  switchDefault,
  type RedLineSettings,
} from "../analysis/red-lines.ts";
import { createMemoryStorage } from "./memory.ts";
import { readerRedLines } from "./reader-red-lines.ts";
import type { Library } from "./session.ts";
import { StorageError, type RedLineStore } from "./types.ts";

// Which red lines and leverage apply to the person asking: the eight
// defaults with leverage unanswered for anyone without an account, and the
// signed-in reader's own otherwise.

function readyLibrary(redLines: RedLineStore, userId = randomUUID()): Library {
  const storage = createMemoryStorage();
  return { status: "ready", userId, documents: storage.documents, redLines };
}

function edited(): RedLineSettings {
  const off = switchDefault(DEFAULT_SETTINGS, "Non-competes", false);
  assert.ok(off.ok);
  const answered = setLeverage(off.settings, "can-walk-away");
  assert.ok(answered.ok);
  return answered.settings;
}

test("without an account, the eight defaults apply and leverage is unanswered", async () => {
  for (const status of ["no-storage", "signed-out"] as const) {
    const found = await readerRedLines({ status });
    assert.equal(found.source, "no-account");
    assert.deepEqual(found.settings, DEFAULT_SETTINGS);
    assert.equal(found.settings.leverage, null);
    assert.equal(found.settings.defaults.length, 8);
  }
});

test("a signed-in reader who has saved nothing starts from the defaults", async () => {
  const found = await readerRedLines(readyLibrary(createMemoryStorage().redLines));
  assert.equal(found.source, "yours");
  assert.deepEqual(found.settings, DEFAULT_SETTINGS);
});

test("a signed-in reader gets the red lines and leverage they saved", async () => {
  const store = createMemoryStorage().redLines;
  const userId = randomUUID();
  await store.save(userId, edited());

  const found = await readerRedLines(readyLibrary(store, userId));
  assert.equal(found.source, "yours");
  assert.deepEqual(found.settings, edited());
});

test("when the red lines cannot be read, the defaults are used and that is said", async () => {
  const broken: RedLineStore = {
    get: async () => {
      throw new StorageError("Could not read the red lines: connection refused");
    },
    save: async () => {},
  };
  const original = console.error;
  console.error = () => {};
  try {
    const found = await readerRedLines(readyLibrary(broken));
    assert.equal(found.source, "unreachable");
    assert.deepEqual(found.settings, DEFAULT_SETTINGS);
  } finally {
    console.error = original;
  }

  const unreachable = await readerRedLines({ status: "unreachable" });
  assert.equal(unreachable.source, "unreachable");
});
