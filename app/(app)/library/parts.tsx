import Link from "next/link";
import type { ReactNode } from "react";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/analysis/types.ts";
import type { Library } from "@/lib/storage/session.ts";

// Pieces shared by the library list and a document opened from it.

export function typeLabel(type: DocumentType): string {
  return DOCUMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// "2 October 2026", in a <time> element that carries the exact moment.
export function ReadDate({ date }: { date: Date }) {
  return <time dateTime={date.toISOString()}>{DATE.format(date)}</time>;
}

// A sheet in the library's grid: the same width and right margin as a
// document's sheet, so tabs on its edge stick out onto the desk the same way.
export function LibrarySheet({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[84rem] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div
        className={`sheet-edge relative bg-sheet pl-5 pr-14 sm:pl-12 sm:pr-20 lg:pl-16 lg:pr-24 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// The top of a library sheet: the wordmark, linking home, and one plain line
// or link at the right.
export function Letterhead({ right }: { right: ReactNode }) {
  return (
    <header className="flex items-baseline justify-between gap-4 border-b border-rule pb-4">
      <Link href="/" className="tab-type text-lg tracking-[0.08em] text-ink no-underline">
        Redline
      </Link>
      <div className="text-sm text-ink-soft">{right}</div>
    </header>
  );
}

const linkClass = "font-medium text-pen underline";

// What the library says when it cannot be shown: there is no sign-in on
// this copy of Redline, nobody is signed in, or the library could not be
// reached.
export function LibraryClosed({ status }: { status: Exclude<Library["status"], "ready"> }) {
  return (
    <LibrarySheet className="py-8 sm:py-12">
      <Letterhead right="It is not legal advice." />
      <h1 className="tab-type mt-10 text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
        Your library
      </h1>
      <div className="mt-6 flex max-w-[60ch] flex-col gap-4 text-lg leading-relaxed text-ink">
        {status === "no-storage" && (
          <>
            <p>
              The library needs an account, and sign-in is not set up on this copy of
              Redline yet.
            </p>
            <p>
              You can still check a document without one.{" "}
              <Link href="/try" className={linkClass}>
                Check a document
              </Link>
            </p>
          </>
        )}
        {status === "signed-out" && (
          <>
            <p>
              Sign in to see your library. While you are signed in, Redline keeps each
              document you check, with its analysis.
            </p>
            <p>
              <Link href="/sign-in" className={linkClass}>
                Sign in
              </Link>
            </p>
          </>
        )}
        {status === "unreachable" && (
          <p role="alert">
            Redline could not reach your library just now. Try again in a minute.
          </p>
        )}
      </div>
    </LibrarySheet>
  );
}
