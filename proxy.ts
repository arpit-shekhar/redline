import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { chooseStorage } from "./lib/storage/choose.ts";

// Runs before each page. When Supabase is set up and the visitor has a
// sign-in cookie, it renews the session if it has expired and writes the new
// cookie onto the response. Pages can read cookies but not write them, so
// without this step a session would stop working after its first expiry.
// With no Supabase settings, or no sign-in cookie, it does nothing.
export async function proxy(request: NextRequest) {
  const choice = chooseStorage();
  if (choice.kind === "none") return NextResponse.next();
  // Supabase names its session cookies "sb-<project>-auth-token".
  const hasSession = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
  if (!hasSession) return NextResponse.next();

  let response = NextResponse.next({ request });
  const client = createServerClient(choice.url, choice.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        // The renewed cookie goes on the request, so the page about to run
        // sees it, and on the response, so the browser keeps it.
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
        // Headers that stop a shared cache from serving this session cookie
        // to someone else.
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  await client.auth.getClaims();
  return response;
}

export const config = {
  // Every page, but not Next.js's own files, images or the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
