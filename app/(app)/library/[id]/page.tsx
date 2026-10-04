import Link from "next/link";
import { ResultDocument, ResultSummary } from "@/app/try/result-view.tsx";
import { readerRedLines } from "@/lib/storage/reader-red-lines.ts";
import { openLibrary } from "@/lib/storage/session.ts";
import type { SavedDocument } from "@/lib/storage/types.ts";
import { deleteSavedDocument } from "../actions.ts";
import { Letterhead, LibraryClosed, LibrarySheet, ReadDate, typeLabel } from "../parts.tsx";

export const metadata = { title: "From your library · Redline" };

// One document from the library, shown with the analysis saved on the day it
// was read. Nothing is sent to the model again. Deleting it takes a second,
// plain step on this page.
export default async function SavedDocumentPage({ params, searchParams }: PageProps<"/library/[id]">) {
  const { id } = await params;
  const { delete: deleteStep } = await searchParams;
  const library = await openLibrary();
  if (library.status !== "ready") return <LibraryClosed status={library.status} />;

  let document: SavedDocument | null;
  try {
    document = await library.documents.get(library.userId, id);
  } catch (error) {
    console.error(
      "[redline] Could not open a library document:",
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    return <LibraryClosed status="unreachable" />;
  }

  if (!document) {
    return (
      <LibrarySheet className="py-8 sm:py-12">
        <Letterhead right={<BackLink />} />
        <p className="mt-10 max-w-[60ch] text-lg leading-relaxed text-ink">
          This document is not in your library. It may have been deleted.
        </p>
      </LibrarySheet>
    );
  }

  // The reader's leverage answer today, so a saved copy can say whether its
  // counter-offers still follow it.
  const found = await readerRedLines(library);
  const currentLeverage = found.source === "yours" ? found.settings.leverage : "unknown";

  const here = `/library/${document.id}`;
  return (
    <>
      <div className="mx-auto w-full max-w-[56rem] bg-sheet px-5 py-8 shadow-[var(--sheet-shadow)] sm:px-12 sm:py-12">
        <Letterhead right={<BackLink />} />
        <div className="mb-10 mt-10 flex flex-col gap-3">
          <h1 className="tab-type text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
            {typeLabel(document.documentType)}
          </h1>
          <p className="max-w-[60ch] text-lg leading-relaxed text-ink">
            Read on <ReadDate date={document.analysedAt} />. This is the analysis from
            that day. Redline has not read the document again.
          </p>
        </div>

        <ResultSummary text={document.text} result={document.analysis} />

        <section aria-label="Delete this document" className="mt-12 max-w-[60ch] border-t border-rule pt-5">
          {deleteStep === "failed" && (
            <p role="alert" className="mb-4 border border-ink-soft bg-sheet p-4 text-ink">
              Redline could not delete it just now. Try again in a minute.
            </p>
          )}
          {deleteStep === "confirm" ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-base leading-relaxed text-ink">
                Delete this document? Its text and its analysis leave your library, and you
                cannot get them back.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <form action={deleteSavedDocument}>
                  <input type="hidden" name="id" value={document.id} />
                  <button type="submit" className="group rounded-sm">
                    <span className="tab tab-red tab-forward tab-type block py-2.5 pl-4 pr-9 text-sm transition-transform duration-200 ease-out group-hover:translate-x-1">
                      Delete it
                    </span>
                  </button>
                </form>
                <Link href={here} scroll={false} className="text-sm font-medium text-pen underline">
                  Keep it
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href={`${here}?delete=confirm`}
              scroll={false}
              className="text-sm font-medium text-pen underline"
            >
              Delete this document
            </Link>
          )}
        </section>
      </div>

      <ResultDocument
        text={document.text}
        result={document.analysis}
        toneView={{ kind: "saved", currentLeverage }}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link href="/library" className="font-medium text-pen underline">
      Your library
    </Link>
  );
}
