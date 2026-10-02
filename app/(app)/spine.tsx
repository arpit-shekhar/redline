"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/try", label: "New document" },
  { href: "/library", label: "Library" },
  { href: "/red-lines", label: "Red lines" },
] as const;

// The spine: the app's navigation, printed on the desk beside the sheets
// rather than on a sheet of its own. Links are in the reader's blue; the
// page the reader is on is in plain ink.
export function Spine() {
  const path = usePathname();
  const isHere = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <nav aria-label="Redline" className="mb-3 sm:mb-5 lg:mb-0">
      <ul className="tab-type flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[0.8125rem] lg:sticky lg:top-6 lg:flex-col lg:gap-4 lg:pt-3">
        {LINKS.map(({ href, label }) =>
          isHere(href) ? (
            <li key={href}>
              <Link
                href={href}
                aria-current="page"
                className="text-ink no-underline lg:border-l-2 lg:border-ink lg:pl-2"
              >
                {label}
              </Link>
            </li>
          ) : (
            <li key={href}>
              <Link href={href} className="text-pen underline lg:ml-2.5">
                {label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
