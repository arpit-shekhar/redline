"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { problemFor, readCredentials, safeNext } from "@/lib/account/sign-in.ts";
import { signInClient } from "@/lib/storage/session.ts";

// Signing up, in and out, with an email address and a password, through
// Supabase Auth (the sign-in service). The session lives in cookies that
// @supabase/ssr writes here; proxy.ts renews them as they expire.

// What the sign-in form shows after a try.
export type SignInState =
  | { status: "idle" }
  // The form or the sign-in service said no. The email stays in the box.
  | { status: "refused"; problem: string; email: string }
  // A new account is waiting for its owner to open the link in their email.
  | { status: "check-email"; email: string };

const NOT_SET_UP = "Sign-in is not set up on this copy of Redline.";

function logFailure(step: string, error: unknown) {
  // The error's name and message only. They never hold the password.
  console.error(
    `[redline] Could not ${step}:`,
    error instanceof Error ? `${error.name}: ${error.message}` : error,
  );
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const credentials = readCredentials(formData, "sign-in");
  if (!credentials.ok) {
    return { status: "refused", problem: credentials.problem, email: credentials.email };
  }
  const { email, password } = credentials;

  const client = await signInClient();
  if (!client) return { status: "refused", problem: NOT_SET_UP, email };

  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        status: "refused",
        problem: problemFor(
          { code: error.code, unreachable: isAuthRetryableFetchError(error) },
          "sign-in",
        ),
        email,
      };
    }
  } catch (error) {
    logFailure("sign in", error);
    return { status: "refused", problem: problemFor({ unreachable: true }, "sign-in"), email };
  }
  // Outside the try: redirect works by throwing, and that must not be caught.
  redirect(safeNext(formData.get("next")));
}

export async function signUpAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const credentials = readCredentials(formData, "sign-up");
  if (!credentials.ok) {
    return { status: "refused", problem: credentials.problem, email: credentials.email };
  }
  const { email, password } = credentials;

  const client = await signInClient();
  if (!client) return { status: "refused", problem: NOT_SET_UP, email };

  let signedIn: boolean;
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      // Where the link in the confirmation email leads. The owner adds this
      // address to the allowed list in Supabase.
      options: { emailRedirectTo: `${await siteAddress()}/sign-in/confirm` },
    });
    if (error) {
      return {
        status: "refused",
        problem: problemFor(
          { code: error.code, unreachable: isAuthRetryableFetchError(error) },
          "sign-up",
        ),
        email,
      };
    }
    // When email confirmation is on, Supabase answers a sign-up for an email
    // that already has an account with a user that has no sign-in methods,
    // and sends no email.
    if (!data.session && data.user?.identities?.length === 0) {
      return {
        status: "refused",
        problem: problemFor({ code: "user_already_exists" }, "sign-up"),
        email,
      };
    }
    signedIn = data.session !== null;
  } catch (error) {
    logFailure("make an account", error);
    return { status: "refused", problem: problemFor({ unreachable: true }, "sign-up"), email };
  }
  // With email confirmation switched off in Supabase, the new account is
  // signed in at once. Otherwise the reader has to open the emailed link.
  if (signedIn) redirect(safeNext(formData.get("next")));
  return { status: "check-email", email };
}

export async function signOutAction() {
  const client = await signInClient();
  if (client) {
    let failed = false;
    try {
      // "local" signs out this browser only, not the reader's other devices.
      const { error } = await client.auth.signOut({ scope: "local" });
      failed = error !== null;
      if (error) logFailure("sign out", error);
    } catch (error) {
      failed = true;
      logFailure("sign out", error);
    }
    // If the sign-in service could not be told, the session cookies are
    // still removed, so this browser is signed out either way.
    if (failed) {
      const cookieStore = await cookies();
      for (const { name } of cookieStore.getAll()) {
        if (name.startsWith("sb-")) cookieStore.delete(name);
      }
    }
  }
  redirect("/sign-in?signed-out");
}

// This site's own address, such as https://redline.example, taken from the
// request the form sent.
async function siteAddress(): Promise<string> {
  const sent = await headers();
  const origin = sent.get("origin");
  if (origin) return origin;
  const host = sent.get("x-forwarded-host") ?? sent.get("host") ?? "localhost:3000";
  const protocol = sent.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
