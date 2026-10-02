import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { chooseStorage } from "./choose.ts";
import { createSupabaseStorage } from "./supabase.ts";
import type { DocumentStore, RedLineStore } from "./types.ts";

// Who is signed in for this request, read from the session cookie. Pages,
// the app shell and server actions all ask here, and the user id always
// comes from this session, never from anything the browser sends in a form.

// The signed-in person's library and red lines for this request, for pages
// and server actions. Pages see only the outcome below and the storage
// interfaces, never which storage is behind them.
export type Library =
  // Supabase is not set up on this copy of Redline.
  | { status: "no-storage" }
  // Storage is set up, but nobody is signed in.
  | { status: "signed-out" }
  // Redline could not reach the sign-in service to check who is asking.
  | { status: "unreachable" }
  | { status: "ready"; userId: string; documents: DocumentStore; redLines: RedLineStore };

// Who is signed in, for the spine and the sign-in page. It carries no
// storage, so it can be handed to a component that runs in the browser.
export type Account =
  | { status: "no-storage" }
  | { status: "signed-out" }
  | { status: "unreachable" }
  | { status: "signed-in"; email: string };

type Session =
  | { status: "no-storage" }
  | { status: "signed-out" }
  | { status: "unreachable" }
  | { status: "signed-in"; client: SupabaseClient; userId: string; email: string };

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// A Supabase client that reads and writes the session cookies of this
// request, or null when Supabase is not set up. A new client for every
// request, so one person's session is never used for another. Server actions
// use it to sign in and out, because they are allowed to write cookies.
export async function signInClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();
  const choice = chooseStorage();
  if (choice.kind === "none") return null;
  return clientFor(choice.url, choice.anonKey, cookieStore);
}

function clientFor(url: string, anonKey: string, cookieStore: CookieStore): SupabaseClient {
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(toSet) {
        // Server actions and route handlers can write cookies; pages cannot.
        // When a page cannot, the session was already renewed by proxy.ts
        // before the page ran.
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
}

// Asked once per request, however many parts of the page want to know: the
// app shell, the page and the sign-in check share one answer.
const readSession = cache(async (): Promise<Session> => {
  // Read first, and outside the try below. Reading cookies marks the page as
  // one that depends on the request, so the storage is chosen when the page
  // is served, not once when the app is built. During a build, Next.js stops
  // here to do that marking, and that signal must not be caught.
  const cookieStore = await cookies();
  const choice = chooseStorage();
  if (choice.kind === "none") return { status: "no-storage" };
  try {
    const client = clientFor(choice.url, choice.anonKey, cookieStore);
    // getUser asks the sign-in service, so a forged or revoked session
    // cookie is not trusted.
    const { data, error } = await client.auth.getUser();
    if (data.user) {
      return {
        status: "signed-in",
        client,
        userId: data.user.id,
        email: data.user.email ?? "",
      };
    }
    if (error && isAuthRetryableFetchError(error)) return { status: "unreachable" };
    return { status: "signed-out" };
  } catch (error) {
    // For example, a Supabase address that is not a web address. Only the
    // error's name and message are logged.
    console.error(
      "[redline] Could not check who is signed in:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return { status: "unreachable" };
  }
});

export async function openLibrary(): Promise<Library> {
  const session = await readSession();
  if (session.status !== "signed-in") return session;
  const storage = createSupabaseStorage(session.client);
  return {
    status: "ready",
    userId: session.userId,
    documents: storage.documents,
    redLines: storage.redLines,
  };
}

export async function currentAccount(): Promise<Account> {
  const session = await readSession();
  if (session.status !== "signed-in") return session;
  return { status: "signed-in", email: session.email };
}
