import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { signInClient } from "@/lib/storage/session.ts";

// Where the link in a new account's confirmation email leads. Supabase sends
// the reader here with a one-time code; trading it in signs the reader in and
// writes the session cookies. The code only works in the browser the account
// was made in, because that browser holds the other half of it in a cookie.
//
// Supabase's email can also be set up to send a token instead of a code
// (token_hash and type in the link). Both are handled.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  const client = await signInClient();
  let confirmed = false;
  if (client) {
    try {
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        confirmed = error === null;
      } else if (tokenHash && (type === "signup" || type === "email")) {
        const { error } = await client.auth.verifyOtp({ type, token_hash: tokenHash });
        confirmed = error === null;
      }
    } catch (error) {
      console.error(
        "[redline] Could not confirm an account:",
        error instanceof Error ? `${error.name}: ${error.message}` : error,
      );
    }
  }
  // Outside the try: redirect works by throwing, and that must not be caught.
  redirect(confirmed ? "/red-lines" : "/sign-in?link=failed");
}
