import Link from "next/link";
import { AnalyseForm } from "./analyse-form.tsx";

export default function Try() {
  return (
    <main className="px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[56rem] bg-sheet px-5 py-8 shadow-[var(--sheet-shadow)] sm:px-12 sm:py-12">
        <header className="flex items-baseline justify-between gap-4 border-b border-rule pb-4">
          <Link href="/" className="tab-type text-lg tracking-[0.08em] text-ink no-underline">
            Redline
          </Link>
          <p className="text-sm text-ink-soft">It is not legal advice.</p>
        </header>
        <div className="mb-10 mt-10 flex flex-col gap-3">
          <h1 className="tab-type text-[clamp(1.9rem,1.5rem+1.6vw,2.75rem)] leading-none text-ink">
            Paste the document
          </h1>
          <p className="max-w-[60ch] text-lg leading-relaxed text-ink">
            A contract, lease, freelance agreement or terms of service you have
            not signed yet. Redline tells you in plain English what it does.
            Flagged clauses and their sentences come next.
          </p>
        </div>
        <AnalyseForm />
      </div>
    </main>
  );
}
