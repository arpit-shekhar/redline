"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { isTooLong, tooLongMessage } from "@/lib/analysis/limits.ts";
import { DOCUMENT_TYPES } from "@/lib/analysis/types.ts";
import type { Extraction } from "@/lib/extraction/extract.ts";
import Link from "next/link";
import { analyseDocument, type AnalyseState, type LibraryNote } from "./actions.ts";
import { ResultDocument, ResultSummary } from "./result-view.tsx";

const initialState: AnalyseState = { status: "idle" };

// A line printed under the box about the file just read: either that its
// text is in the box, or why it was refused. A refused file sends nothing.
type FileNotice = { refused: boolean; message: string };

const ACCEPTED_FILES =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SCAN_MESSAGE =
  "This file has no text Redline can read. It looks like a scan, meaning pictures of the pages. " +
  "Redline does not read scans, because guessing at the letters could make it quote your document wrongly. " +
  "Nothing was checked.";

function noticeFor(extraction: Extraction, fileName: string): FileNotice {
  switch (extraction.status) {
    case "read":
      return isTooLong(extraction.text)
        ? { refused: true, message: tooLongMessage(extraction.text) }
        : {
            refused: false,
            message: `The text from ${fileName} is in the box above. The file was not kept.`,
          };
    case "scan":
      return { refused: true, message: SCAN_MESSAGE };
    case "not-supported":
      return {
        refused: true,
        message:
          "Redline reads PDF and Word (.docx) files. Save this file as one of those, or paste its text into the box.",
      };
    case "unreadable":
      return {
        refused: true,
        message:
          "Redline could not open this file. It may be damaged or locked with a password. Try another copy, or paste its text into the box.",
      };
  }
}

// The paste sheet (its heading passed in as `intro`), the summary on it once
// the document is read, and then the document itself as a second sheet:
// carrying its flags, or its checklist when nothing was flagged. A failed
// analysis shows a notice and a retry, and nothing else.
//
// The box takes pasted text, a dropped file, or a file chosen with the
// button. A file is read here in the browser and its text put in the box.
// The file itself is never sent: the form sends only the document type and
// the text, the same way for pasted and uploaded documents.
//
// `savesToLibrary` says whether a finished analysis will be kept in the
// reader's library, so the note under the box says truthfully what happens
// to the text.
export function AnalyseForm({
  intro,
  savesToLibrary,
}: {
  intro: ReactNode;
  savesToLibrary: boolean;
}) {
  const [state, submit, pending] = useActionState(analyseDocument, initialState);
  const [text, setText] = useState("");
  const [fileNotice, setFileNotice] = useState<FileNotice | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const busy = pending || readingFile;

  const readFile = async (file: File) => {
    setReadingFile(true);
    setFileNotice(null);
    let notice: FileNotice;
    try {
      // Loaded on first use: the PDF and Word readers are large, and most
      // readers paste.
      const { readFileInBrowser } = await import("@/lib/extraction/read-in-browser.ts");
      const extraction = await readFileInBrowser(file);
      notice = noticeFor(extraction, file.name);
      if (extraction.status === "read" && !notice.refused) setText(extraction.text);
    } catch {
      notice = noticeFor({ status: "unreadable" }, file.name);
    }
    setFileNotice(notice);
    setReadingFile(false);
  };

  const carriesFile = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  const send = (documentType: string, documentText: string) => {
    const data = new FormData();
    data.set("documentType", documentType);
    data.set("text", documentText);
    startTransition(() => submit(data));
  };

  // Runs the analysis again on the text that failed, so the reader does not
  // have to paste it again, even if they have since changed the box.
  const retry = () => {
    if (state.status !== "failed") return;
    send(state.documentType, state.text);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[56rem] bg-sheet px-5 py-8 shadow-[var(--sheet-shadow)] sm:px-12 sm:py-12">
        {intro}
        <form
          className="flex flex-col gap-6"
          // Submitting through a transition keeps the text in the box. A plain
          // form action would clear it once the analysis returns.
          onSubmit={(event) => {
            event.preventDefault();
            const documentText = text.trim();
            // The server checks the limit too. Checking here first means a
            // long document is refused without being sent.
            if (isTooLong(documentText)) {
              setFileNotice({ refused: true, message: tooLongMessage(documentText) });
              return;
            }
            setFileNotice(null);
            const documentType = new FormData(event.currentTarget).get("documentType");
            send(String(documentType ?? ""), documentText);
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="documentType" className="tab-type text-sm text-ink">
              What kind of document is this?
            </label>
            <select
              id="documentType"
              name="documentType"
              required
              defaultValue=""
              className="w-full max-w-xs rounded-sm border border-ink-soft bg-sheet px-3 py-2.5 text-ink"
            >
              <option value="" disabled>
                Choose one
              </option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="text" className="tab-type text-sm text-ink">
              The document&apos;s text
            </label>
            <p id="text-note" className="max-w-[65ch] text-sm text-ink-soft">
              Paste the text, or drop a PDF or Word file onto the box. Your browser reads
              the file, and it is never uploaded. Redline takes only the text from it and
              discards the file. The text is sent to an AI model to be read.{" "}
              {savesToLibrary
                ? "You are signed in, so Redline saves the text and its analysis to your library. You can delete them there."
                : "Redline does not save it."}
            </p>
            <div
              className="relative"
              onDragOver={(event) => {
                if (!carriesFile(event)) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                setDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragging(false);
                }
              }}
              onDrop={(event) => {
                if (!carriesFile(event)) return;
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file && !busy) void readFile(file);
              }}
            >
              <textarea
                id="text"
                required
                rows={14}
                value={text}
                onChange={(event) => setText(event.target.value)}
                aria-describedby="text-note file-notice"
                className={`w-full rounded-sm border bg-sheet p-4 font-serif text-base leading-relaxed text-ink ${
                  dragging ? "border-dashed border-pen" : "border-ink-soft"
                }`}
              />
              {(dragging || readingFile) && (
                <p
                  aria-hidden="true"
                  className="tab-type pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-sheet/90 text-sm text-ink"
                >
                  {readingFile ? "Reading the file…" : "Drop the file to read it"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => picker.current?.click()}
                disabled={busy}
                className="text-sm font-medium text-pen underline disabled:cursor-wait disabled:opacity-70"
              >
                Choose a file
              </button>
              <span className="text-sm text-ink-soft">PDF or Word (.docx)</span>
              {/* No name, so this input is never part of any form data. The
                  file is read in the browser and then let go. */}
              <input
                ref={picker}
                type="file"
                accept={ACCEPTED_FILES}
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void readFile(file);
                }}
              />
            </div>
            <div id="file-notice" aria-live="polite">
              {readingFile && <p className="text-sm text-ink-soft">Reading the file…</p>}
              {fileNotice && (
                <p
                  role={fileNotice.refused ? "alert" : undefined}
                  className={
                    fileNotice.refused
                      ? "max-w-[65ch] border border-ink-soft bg-sheet p-4 text-ink"
                      : "max-w-[65ch] text-sm text-ink"
                  }
                >
                  {fileNotice.message}
                </p>
              )}
            </div>
          </div>

          <button type="submit" disabled={busy} className="group self-start rounded-sm disabled:cursor-wait">
            <span className="tab tab-red tab-forward tab-type block py-3 pl-5 pr-10 text-base transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
              {pending ? "Reading the document…" : "Check it"}
            </span>
          </button>
        </form>

        <section aria-live="polite" aria-busy={pending} className="mt-12">
          {state.status === "invalid" && (
            <p role="alert" className="border border-ink-soft bg-sheet p-4 text-ink">
              {state.message}
            </p>
          )}
          {state.status === "failed" && (
            <div role="alert" className="flex flex-col items-start gap-4 border border-ink-soft bg-sheet p-4">
              <p className="max-w-[60ch] text-ink">
                The analysis failed, so Redline shows none of it. You do not need to
                paste the document again.
              </p>
              <button
                type="button"
                onClick={retry}
                disabled={pending}
                className="group rounded-sm disabled:cursor-wait"
              >
                <span className="tab tab-red tab-forward tab-type block py-2.5 pl-4 pr-9 text-sm transition-transform duration-200 ease-out group-enabled:group-hover:translate-x-1 group-disabled:opacity-70">
                  {pending ? "Trying again…" : "Try again"}
                </span>
              </button>
            </div>
          )}
          {state.status === "done" && (
            <>
              <LibraryLine note={state.library} />
              {state.redLines === "unreachable" && (
                <p className="mb-8 max-w-[65ch] border-b border-rule pb-4 text-sm leading-relaxed text-ink-soft">
                  Redline could not load your red lines just now, so it looked for the
                  eight it starts with.
                </p>
              )}
              <ResultSummary text={state.text} result={state.result} />
            </>
          )}
        </section>
      </div>

      {state.status === "done" && <ResultDocument text={state.text} result={state.result} />}
    </>
  );
}

// One plain line saying whether the analysis was kept in the library.
function LibraryLine({ note }: { note: LibraryNote }) {
  const line = "mb-8 max-w-[65ch] border-b border-rule pb-4 text-sm leading-relaxed text-ink-soft";
  if (note.status === "saved") {
    return (
      <p className={line}>
        Saved to your library.{" "}
        <Link href={`/library/${note.id}`} className="font-medium text-pen underline">
          Open it there
        </Link>
      </p>
    );
  }
  if (note.status === "failed") {
    return (
      <p className={line}>
        Redline could not save this to your library. It is only on this page.
      </p>
    );
  }
  return (
    <p className={line}>
      Nothing here was saved. If you sign in, Redline keeps the documents you check in{" "}
      <Link href="/library" className="font-medium text-pen underline">
        your library
      </Link>
      .
    </p>
  );
}
