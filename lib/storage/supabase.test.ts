import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  documentStoreContract,
  redLineStoreContract,
} from "../../tests/support/storage-contract.ts";
import {
  twoUserIsolation,
  type SignedInPerson,
} from "../../tests/support/two-user-isolation.ts";
import { chooseStorage, SUPABASE_SETTINGS } from "./choose.ts";
import { createSupabaseStorage } from "./supabase.ts";

// The storage contract and the two-person check, run against the real
// Supabase database. They need the migrations in supabase/migrations/
// applied, and test accounts to sign in with, because the database only lets
// a signed-in person touch their own rows. Until the settings are present,
// each run is reported as skipped.
//
// The test accounts are made by hand in Supabase (Authentication, Users, Add
// user, with the email already confirmed). The tests sign in; they never
// sign up, so they send no email.
//
// Everything is in this one file on purpose: the tests in one file run one
// after another, and both runs use the first test account's red lines.

// Settings may sit in .env.local. Their values are never printed.
try {
  process.loadEnvFile(new URL("../../.env.local", import.meta.url));
} catch {
  // No .env.local. The settings may already be in the environment.
}

const FIRST_ACCOUNT = ["SUPABASE_TEST_EMAIL", "SUPABASE_TEST_PASSWORD"] as const;
const SECOND_ACCOUNT = ["SUPABASE_TEST_EMAIL_2", "SUPABASE_TEST_PASSWORD_2"] as const;

function skipUnless(names: readonly string[]): string | undefined {
  const missing = names.filter((name) => !process.env[name]?.trim());
  return missing.length > 0 ? `missing settings: ${missing.join(", ")}` : undefined;
}

// Signs one test account in and returns its storage.
async function signIn(
  [emailSetting, passwordSetting]: readonly [string, string],
): Promise<SignedInPerson> {
  const choice = chooseStorage();
  if (choice.kind !== "supabase") throw new Error("Supabase settings are missing.");
  const client = createClient(choice.url, choice.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env[emailSetting]!,
    password: process.env[passwordSetting]!,
  });
  if (error || !data.user) {
    throw new Error(
      `Could not sign in the test account in ${emailSetting}: ${error?.message ?? "no user"}`,
    );
  }
  return {
    client,
    storage: createSupabaseStorage(client),
    userId: data.user.id,
    close: async () => {
      await client.auth.signOut({ scope: "local" });
    },
  };
}

const contractSkip = skipUnless([...SUPABASE_SETTINGS, ...FIRST_ACCOUNT]);

documentStoreContract(
  "Supabase storage",
  async () => {
    const { storage, userId, close } = await signIn(FIRST_ACCOUNT);
    // A made-up id: nobody signed in as it, so it must find nothing.
    return { store: storage.documents, userId, otherUserId: randomUUID(), close };
  },
  contractSkip,
);

redLineStoreContract(
  "Supabase storage: red lines and leverage",
  async () => {
    const { storage, userId, close } = await signIn(FIRST_ACCOUNT);
    return { store: storage.redLines, userId, otherUserId: randomUUID(), close };
  },
  contractSkip,
);

twoUserIsolation(
  "Supabase: one person cannot read, change or delete another's documents, red lines or leverage",
  () => signIn(FIRST_ACCOUNT),
  () => signIn(SECOND_ACCOUNT),
  skipUnless([...SUPABASE_SETTINGS, ...FIRST_ACCOUNT, ...SECOND_ACCOUNT]),
);
