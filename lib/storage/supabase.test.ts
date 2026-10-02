import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  documentStoreContract,
  redLineStoreContract,
} from "../../tests/support/storage-contract.ts";
import { chooseStorage, SUPABASE_SETTINGS } from "./choose.ts";
import { createSupabaseStorage } from "./supabase.ts";

// The storage contract, run against the real Supabase database. It needs the
// migrations in supabase/migrations/ applied, and a test account to sign in
// with, because the database only lets a signed-in person touch their own
// rows. Until all four settings are present, the run is reported as skipped.

// Settings may sit in .env.local. Their values are never printed.
try {
  process.loadEnvFile(new URL("../../.env.local", import.meta.url));
} catch {
  // No .env.local. The settings may already be in the environment.
}

const TEST_ACCOUNT = ["SUPABASE_TEST_EMAIL", "SUPABASE_TEST_PASSWORD"] as const;
const missing = [...SUPABASE_SETTINGS, ...TEST_ACCOUNT].filter(
  (name) => !process.env[name]?.trim(),
);

const skip = missing.length > 0 ? `missing settings: ${missing.join(", ")}` : undefined;

// Signs the test account in and returns its storage.
async function signIn() {
  const choice = chooseStorage();
  if (choice.kind !== "supabase") throw new Error("Supabase settings are missing.");
  const client = createClient(choice.url, choice.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env.SUPABASE_TEST_EMAIL!,
    password: process.env.SUPABASE_TEST_PASSWORD!,
  });
  if (error || !data.user) {
    throw new Error(`Could not sign in the test account: ${error?.message ?? "no user"}`);
  }
  return {
    storage: createSupabaseStorage(client),
    userId: data.user.id,
    // A made-up id: nobody signed in as it, so it must find nothing.
    otherUserId: randomUUID(),
    close: async () => {
      await client.auth.signOut();
    },
  };
}

documentStoreContract(
  "Supabase storage",
  async () => {
    const { storage, ...rest } = await signIn();
    return { store: storage.documents, ...rest };
  },
  skip,
);

redLineStoreContract(
  "Supabase storage: red lines and leverage",
  async () => {
    const { storage, ...rest } = await signIn();
    return { store: storage.redLines, ...rest };
  },
  skip,
);
