// Decides which storage the product uses. This is the one place that
// decides. Supabase is used when both of its settings are present. Otherwise
// there is no storage, and the library and red lines are switched off. The
// in-memory storage is never chosen here: it has no sign-in, so it would
// need a made-up user.

export const SUPABASE_SETTINGS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type StorageChoice =
  | { kind: "supabase"; url: string; anonKey: string }
  | { kind: "none"; missing: string[] };

type Env = Record<string, string | undefined>;

export function chooseStorage(env: Env = process.env): StorageChoice {
  const missing = SUPABASE_SETTINGS.filter((name) => !env[name]?.trim());
  if (missing.length > 0) return { kind: "none", missing };
  return {
    kind: "supabase",
    url: env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  };
}

// One line for the server log at startup. It names settings, never their
// values.
export function describeStorage(choice: StorageChoice): string {
  if (choice.kind === "supabase") {
    return "Storage: Supabase. The library and red lines are on.";
  }
  return `Storage: none. The library and red lines are off, because ${choice.missing.join(" and ")} ${
    choice.missing.length === 1 ? "is" : "are"
  } missing.`;
}
