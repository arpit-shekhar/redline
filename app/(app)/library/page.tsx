import Link from "next/link";
import { EDGE_TAB_POSITION, EdgeTabFace } from "@/app/landing/edge-tab.tsx";
import { openLibrary } from "@/lib/storage/session.ts";
import type { LibraryEntry } from "@/lib/storage/types.ts";
import { Letterhead, LibraryClosed, LibrarySheet, ReadDate, typeLabel } from "./parts.tsx";

export const metadata = { title: "Your library · Redline" };

// The library: one sheet per document the reader has checked, newest first.
// Each carries its red and yellow tab counts on its edge.
export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const { deleted } = await searchParams;
  const library = await openLibrary();
  if (library.status !== "ready") return <LibraryClosed status={library.status} />;

  let entries: LibraryEntry[];
  try {
    entries = await library.documents.list(library.userId);
  } catch (error) {
    console.error(
      "[redline] Could not list the library:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return <LibraryClosed status="unreachable" />;
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <LibrarySheet className="py-8 sm:py-12">
        <Letterhead right="It is not legal advice." />
        <h1 className="tab-type mt-10 text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
          Your library
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink">
          {entries.length === 0
            ? "Nothing here yet. When you check a document while signed in, Redline keeps it here with its analysis."
            : "The documents you have checked, newest first. Each one keeps the analysis from the day Redline read it."}
        </p>
        {deleted !== undefined && (
          <p role="status" className="mt-6 max-w-[60ch] border-t border-rule pt-4 text-base text-ink">
            The document is deleted. Its text and its analysis are no longer in your library.
          </p>
        )}
        {entries.length === 0 && (
          <p className="mt-6">
            <Link href="/try" className="font-medium text-pen underline">
              Check a document
            </Link>
          </p>
        )}
      </LibrarySheet>

      {entries.length > 0 && (
        <ol aria-label="Your documents" className="flex flex-col gap-4 sm:gap-5">
          {entries.map((entry) => (
            <li key={entry.id}>
              <EntrySheet entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function EntrySheet({ entry }: { entry: LibraryEntry }) {
  const both = entry.mustChange > 0 && entry.worthRaising > 0;
  return (
    <LibrarySheet className={`py-5 sm:py-6 ${both ? "min-h-[7.5rem]" : ""}`}>
      <h2 className="tab-type text-base">
        {/* The link covers the whole sheet, so the sheet opens from anywhere. */}
        <Link
          href={`/library/${entry.id}`}
          className="text-pen underline after:absolute after:inset-0 after:content-['']"
        >
          {typeLabel(entry.documentType)}
        </Link>
      </h2>
      {entry.opening && (
        <p className="mt-2 max-w-[62ch] truncate font-serif text-[1.0625rem] text-ink">
          {entry.opening}
        </p>
      )}
      <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
        Read on <ReadDate date={entry.analysedAt} />. {countsLine(entry)}
      </p>

      {entry.mustChange > 0 && (
        <span aria-hidden="true" className={`${EDGE_TAB_POSITION} top-4 sm:top-5`}>
          <EdgeTabFace severity="must-change" rank={entry.mustChange} />
        </span>
      )}
      {entry.worthRaising > 0 && (
        <span
          aria-hidden="true"
          className={`${EDGE_TAB_POSITION} ${both ? "top-[3.75rem] sm:top-16" : "top-4 sm:top-5"}`}
        >
          <EdgeTabFace severity="worth-raising" rank={entry.worthRaising} />
        </span>
      )}
      {entry.outcome === "clean" && (
        <span aria-hidden="true" className={`${EDGE_TAB_POSITION} top-4 sm:top-5`}>
          <span className="tab tab-grey tab-type flex h-9 min-w-10 items-center pl-5 pr-3 text-[0.8125rem] lg:h-10 lg:w-[12.5rem]">
            <span className="hidden lg:inline">Nothing flagged</span>
          </span>
        </span>
      )}
    </LibrarySheet>
  );
}

// The tab counts in words, for screen readers and for phones, where the tabs
// show only a number.
function countsLine(entry: LibraryEntry): string {
  if (entry.outcome === "clean") return "Nothing flagged.";
  if (entry.outcome === "withheld") {
    return "Redline held back its flags because it could not check them against the text.";
  }
  const parts = [];
  if (entry.mustChange > 0) parts.push(`${entry.mustChange} must change`);
  if (entry.worthRaising > 0) parts.push(`${entry.worthRaising} worth raising`);
  return `${parts.join(", ")}.`;
}
