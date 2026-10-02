"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Account } from "@/lib/storage/session.ts";
import { signOutAction } from "./sign-in/actions.ts";

const LINKS = [
  { href: "/try", label: "New document" },
  { href: "/library", label: "Library" },
  { href: "/red-lines", label: "Red lines" },
] as const;

// The spine: the app's navigation, printed on the desk beside the sheets
// rather than on a sheet of its own. Links are in the reader's blue; the
// page the reader is on is in plain ink. Below the links, the reader can
// sign in or out. When this copy of Redline has no sign-in, that part is
// left out.
export function Spine({ account }: { account: Account }) {
  const path = usePathname();
  const isHere = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <nav aria-label="Redline" className="mb-3 sm:mb-5 lg:mb-0">
      <div className="tab-type flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 text-[0.8125rem] lg:sticky lg:top-6 lg:block lg:pt-3">
        <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2 lg:flex-col lg:gap-4">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <SpineLink href={href} here={isHere(href)}>
                {label}
              </SpineLink>
            </li>
          ))}
        </ul>

        {account.status === "signed-out" && (
          <div className="lg:mt-8">
            <SpineLink href="/sign-in" here={isHere("/sign-in")}>
              Sign in
            </SpineLink>
          </div>
        )}
        {account.status === "signed-in" && (
          <div className="flex items-baseline gap-x-5 lg:mt-8 lg:flex-col lg:gap-2">
            <p
              title={account.email}
              className="hidden max-w-full truncate text-xs font-normal normal-case tracking-normal [font-stretch:100%] text-ink-soft lg:block lg:self-stretch lg:pl-2.5"
            >
              {account.email}
            </p>
            <form action={signOutAction}>
              <button type="submit" className="tab-type text-pen underline lg:ml-2.5">
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}

function SpineLink({
  href,
  here,
  children,
}: {
  href: string;
  here: boolean;
  children: string;
}) {
  return here ? (
    <Link
      href={href}
      aria-current="page"
      className="text-ink no-underline lg:border-l-2 lg:border-ink lg:pl-2"
    >
      {children}
    </Link>
  ) : (
    <Link href={href} className="text-pen underline lg:ml-2.5">
      {children}
    </Link>
  );
}
