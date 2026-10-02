import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { chooseStorage } from "./choose.ts";
import { createSupabaseStorage } from "./supabase.ts";
import type { DocumentStore } from "./types.ts";

// The signed-in person's library for this request, for pages and server
// actions. Pages see only the outcome below and the DocumentStore interface,
// never which storage is behind it.
export type Library =
  // Supabase is not set up on this copy of Redline.
  | { status: "no-storage" }
  // Storage is set up, but nobody is signed in.
  | { status: "signed-out" }
  // Redline could not reach the sign-in service to check who is asking.
  | { status: "unreachable" }
  | { status: "ready"; userId: string; documents: DocumentStore };

export async function openLibrary(): Promise<Library> {
  // Read first, and outside the try below. Reading cookies marks the page as
  // one that depends on the request, so the storage is chosen when the page
  // is served, not once when the app is built. During a build, Next.js stops
  // here to do that marking, and that signal must not be caught.
  const cookieStore = await cookies();
  const choice = chooseStorage();
  if (choice.kind === "none") return { status: "no-storage" };
  try {
    return await signedInLibrary(choice.url, choice.anonKey, cookieStore);
  } catch (error) {
    // For example, a Supabase address that is not a web address. Only the
    // error's name and message are logged.
    console.error(
      "[redline] Could not open the library:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return { status: "unreachable" };
  }
}

async function signedInLibrary(
  url: string,
  anonKey: string,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<Library> {
  // A new client for every request, so one person's session is never used
  // for another.
  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        // Server actions can write cookies; pages cannot. When a page cannot,
        // the session was already refreshed by proxy.ts before the page ran.
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // A page is rendering. Nothing to write here.
        }
      },
    },
  });

  // getUser asks the sign-in service, so a forged or revoked session cookie
  // is not trusted.
  const { data, error } = await client.auth.getUser();
  if (data.user) {
    return {
      status: "ready",
      userId: data.user.id,
      documents: createSupabaseStorage(client).documents,
    };
  }
  if (error && isAuthRetryableFetchError(error)) return { status: "unreachable" };
  return { status: "signed-out" };
}
