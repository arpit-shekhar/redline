"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH, type NextPage } from "@/lib/account/sign-in.ts";
import { signInAction, signUpAction, type SignInState } from "./actions.ts";

const initialState: SignInState = { status: "idle" };

const FIELD =
  "w-full max-w-sm rounded-sm border border-ink-soft bg-sheet px-3 py-2.5 text-base text-ink";

// The email and password form, for signing in or for making an account. A
// refusal is printed under the fields, and the email stays in its box.
export function SignInForm({ mode, next }: { mode: "sign-in" | "sign-up"; next: NextPage }) {
  const [state, submit, pending] = useActionState(
    mode === "sign-up" ? signUpAction : signInAction,
    initialState,
  );
  const refused = state.status === "refused" ? state : null;
  const nextQuery = next === "/library" ? "" : `&next=${encodeURIComponent(next)}`;

  if (state.status === "check-email") {
    return (
      <div role="status" className="mt-8 max-w-[60ch] border-t border-rule pt-6 text-lg leading-relaxed text-ink">
        <p>
          Redline sent a link to <span className="font-semibold">{state.email}</span>. Open it
          in this browser to finish making your account.
        </p>
        <p className="mt-4 text-base text-ink-soft">
          If the email has not come in a few minutes, look in your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="mt-8 flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="tab-type text-sm text-ink">
          Email address
        </label>
        <input
          // A new key after each try puts the reader's email back in the box.
          key={refused ? `email-${refused.email}` : "email"}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={refused?.email ?? ""}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="tab-type text-sm text-ink">
          Password
        </label>
        {mode === "sign-up" && (
          <p id="password-hint" className="text-sm text-ink-soft">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        )}
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          required
          minLength={mode === "sign-up" ? MIN_PASSWORD_LENGTH : undefined}
          aria-describedby={mode === "sign-up" ? "password-hint" : undefined}
          className={FIELD}
        />
      </div>

      <div aria-live="polite">
        {refused && (
          <p role="alert" className="max-w-[60ch] border border-ink-soft bg-sheet p-4 text-ink">
            {refused.problem}
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className="group self-start rounded-sm disabled:cursor-wait">
        <span className="tab tab-red tab-forward tab-type block py-3 pl-5 pr-10 text-base transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
          {mode === "sign-up"
            ? pending
              ? "Making your account…"
              : "Make my account"
            : pending
              ? "Signing in…"
              : "Sign in"}
        </span>
      </button>

      <p className="border-t border-rule pt-5 text-base text-ink">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link href={next === "/library" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`} className="font-medium text-pen underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Redline?{" "}
            <Link href={`/sign-in?new${nextQuery}`} className="font-medium text-pen underline">
              Make an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
