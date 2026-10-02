// The rules for the sign-in page that do not need the sign-in service: what
// counts as a usable email and password, what each refusal from Supabase
// Auth (the sign-in service) means in plain words, and where the reader may
// be sent once they are in. The server actions in app/(app)/sign-in/ use
// these, and so do the tests.

// The shortest password Redline accepts for a new account. Existing accounts
// are not checked against it, so a later change cannot lock anyone out.
export const MIN_PASSWORD_LENGTH = 8;

// What a sign-in or sign-up form sent, once checked.
export type Credentials =
  | { ok: true; email: string; password: string }
  | { ok: false; problem: string; email: string };

// A loose check: one @, something on each side, a dot after it, no spaces.
// The sign-in service does the real check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readCredentials(
  formData: FormData,
  purpose: "sign-in" | "sign-up",
): Credentials {
  const email = String(formData.get("email") ?? "").trim();
  // A password is used exactly as typed, spaces included.
  const password = String(formData.get("password") ?? "");

  if (email === "") return { ok: false, problem: "Enter your email address.", email };
  if (!EMAIL.test(email)) {
    return { ok: false, problem: "That email address does not look right. Check it and try again.", email };
  }
  if (password === "") return { ok: false, problem: "Enter your password.", email };
  if (purpose === "sign-up" && password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      problem: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
      email,
    };
  }
  return { ok: true, email, password };
}

// The parts of a Supabase Auth error that matter here. Supabase gives each
// refusal a short code, such as "invalid_credentials".
export type AuthFailure = {
  code?: string;
  // True when the sign-in service could not be reached at all.
  unreachable?: boolean;
};

// The line the reader sees when the sign-in service says no. It never repeats
// the service's own message, which is written for developers.
export function problemFor(failure: AuthFailure, purpose: "sign-in" | "sign-up"): string {
  if (failure.unreachable) {
    return "Redline could not reach the sign-in service just now. Try again in a minute.";
  }
  switch (failure.code) {
    case "invalid_credentials":
      return "That email and password do not match an account. Check them and try again.";
    case "email_not_confirmed":
      return "This account is waiting for you to confirm your email address. Open the link in the email Redline sent you, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "There is already an account for that email address. Sign in instead.";
    case "weak_password":
      return "The sign-in service turned that password down as too easy to guess. Choose a longer one.";
    case "email_address_invalid":
      return "That email address does not look right. Check it and try again.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "New accounts are switched off on this copy of Redline.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "There have been too many tries in a short time. Wait a few minutes and try again.";
    default:
      return purpose === "sign-up"
        ? "Redline could not make your account just now. Try again in a minute."
        : "Redline could not sign you in just now. Try again in a minute.";
  }
}

// Pages a reader may be sent to after signing in. Anything else, including a
// full web address someone slipped into the link, goes to the library.
const NEXT_PAGES = ["/library", "/red-lines", "/try"] as const;
export type NextPage = (typeof NEXT_PAGES)[number];

export function safeNext(value: unknown): NextPage {
  return NEXT_PAGES.find((page) => page === value) ?? "/library";
}
