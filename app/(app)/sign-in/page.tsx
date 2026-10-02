import Link from "next/link";
import type { ReactNode } from "react";
import { safeNext } from "@/lib/account/sign-in.ts";
import { currentAccount } from "@/lib/storage/session.ts";
import { Letterhead } from "../library/parts.tsx";
import { signOutAction } from "./actions.ts";
import { SignInForm } from "./sign-in-form.tsx";

export const metadata = { title: "Sign in · Redline" };

const LINK = "font-medium text-pen underline";

// Signing in, or making an account, with an email address and a password.
// One plain sheet with no tabs, like the paste page. Without the Supabase
// settings it says sign-in is not set up, and the rest of Redline works as
// before.
export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const account = await currentAccount();
  const mode = params.new !== undefined ? "sign-up" : "sign-in";
  const next = safeNext(params.next);

  if (account.status === "no-storage") {
    return (
      <Sheet title="Sign in">
        <p>
          Sign-in is not set up on this copy of Redline, so it cannot keep your red lines or a
          library yet.
        </p>
        <p>
          You can still check a document without an account.{" "}
          <Link href="/try" className={LINK}>
            Check a document
          </Link>
        </p>
      </Sheet>
    );
  }

  if (account.status === "signed-in") {
    return (
      <Sheet title="Your account">
        <p>
          You are signed in as <span className="font-semibold">{account.email}</span>.
        </p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/library" className={LINK}>
            Your library
          </Link>
          <Link href="/red-lines" className={LINK}>
            Your red lines
          </Link>
        </p>
        <form action={signOutAction} className="border-t border-rule pt-5">
          <button type="submit" className="text-base font-medium text-pen underline">
            Sign out
          </button>
        </form>
      </Sheet>
    );
  }

  return (
    <Sheet title={mode === "sign-up" ? "Make an account" : "Sign in"}>
      {params["signed-out"] !== undefined && <p role="status">You are signed out.</p>}
      {params.link !== undefined && (
        <p role="alert">
          That link did not work. It may have run out or been used already. Try signing in. If
          your account was never finished, make it again to get a new link.
        </p>
      )}
      {account.status === "unreachable" && (
        <p role="alert">
          Redline could not reach the sign-in service just now. If signing in fails, try again
          in a minute.
        </p>
      )}
      <p>
        {mode === "sign-up"
          ? "With an account, Redline keeps your red lines and every document you check, with its analysis. Nobody else can see them."
          : "Sign in to use your red lines and your library. You can check a document without an account."}
      </p>
      <SignInForm mode={mode} next={next} />
    </Sheet>
  );
}

// One narrow sheet, centred on the desk, with the letterhead and a heading.
function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[56rem] bg-sheet px-5 py-8 shadow-[var(--sheet-shadow)] sm:px-12 sm:py-12">
      <Letterhead right="It is not legal advice." />
      <h1 className="tab-type mt-10 text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
        {title}
      </h1>
      <div className="mt-6 flex max-w-[60ch] flex-col gap-4 text-lg leading-relaxed text-ink">
        {children}
      </div>
    </div>
  );
}
