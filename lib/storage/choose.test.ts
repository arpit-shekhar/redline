import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseStorage, describeStorage } from "./choose.ts";

const URL_SETTING = "https://example.supabase.co";
const KEY_SETTING = "anon-key-for-tests";

test("chooses Supabase when both settings are present", () => {
  const choice = chooseStorage({
    NEXT_PUBLIC_SUPABASE_URL: URL_SETTING,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: KEY_SETTING,
  });

  assert.deepEqual(choice, { kind: "supabase", url: URL_SETTING, anonKey: KEY_SETTING });
});

test("chooses no storage, naming what is missing, when either setting is absent", () => {
  assert.deepEqual(chooseStorage({}), {
    kind: "none",
    missing: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  });
  assert.deepEqual(chooseStorage({ NEXT_PUBLIC_SUPABASE_URL: URL_SETTING }), {
    kind: "none",
    missing: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  });
  // A setting that is only spaces counts as missing.
  assert.deepEqual(
    chooseStorage({ NEXT_PUBLIC_SUPABASE_URL: "  ", NEXT_PUBLIC_SUPABASE_ANON_KEY: KEY_SETTING }),
    { kind: "none", missing: ["NEXT_PUBLIC_SUPABASE_URL"] },
  );
});

test("the startup line names the storage and never prints a setting's value", () => {
  const on = describeStorage(
    chooseStorage({
      NEXT_PUBLIC_SUPABASE_URL: URL_SETTING,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: KEY_SETTING,
    }),
  );
  assert.match(on, /Supabase/);
  assert.ok(!on.includes(URL_SETTING) && !on.includes(KEY_SETTING));

  const off = describeStorage(chooseStorage({ NEXT_PUBLIC_SUPABASE_URL: URL_SETTING }));
  assert.match(off, /none/);
  assert.match(off, /NEXT_PUBLIC_SUPABASE_ANON_KEY is missing/);
  assert.ok(!off.includes(URL_SETTING));
});
