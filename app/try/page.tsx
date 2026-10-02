import Link from "next/link";
import { openLibrary } from "@/lib/storage/session.ts";
import { AnalyseForm } from "./analyse-form.tsx";

// How many seconds the host lets the analysis run on the server before
// stopping it. It must stay above MODEL_TIMEOUT_MS in lib/analysis/model.ts,
// so Redline's own time limit is reached first and the reader is told the
// analysis failed. Next.js needs a plain number here, not an imported one.
export const maxDuration = 120;

export default async function Try() {
  // Whether a finished analysis will be saved, so the page can say so.
  const library = await openLibrary();

  return (
    <AnalyseForm
      savesToLibrary={library.status === "ready"}
      intro={
        <>
          <header className="flex items-baseline justify-between gap-4 border-b border-rule pb-4">
            <Link href="/" className="tab-type text-lg tracking-[0.08em] text-ink no-underline">
              Redline
            </Link>
            <p className="text-sm text-ink-soft">It is not legal advice.</p>
          </header>
          <div className="mb-10 mt-10 flex flex-col gap-3">
            <h1 className="tab-type text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
              Paste or drop in the document
            </h1>
            <p className="max-w-[60ch] text-lg leading-relaxed text-ink">
              A contract, lease, freelance agreement or terms of service you have
              not signed yet. Redline tells you in plain English what it does.
              Then it marks each clause that could hurt you, on the sentence it
              came from.
            </p>
          </div>
        </>
      }
    />
  );
}
