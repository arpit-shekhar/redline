import Link from "next/link";
import { DEFAULT_RED_LINES } from "@/lib/analysis/red-lines.ts";
import { SAMPLE_FLAGS } from "@/lib/landing/sample.ts";
import { EDGE_TAB_POSITION, EdgeTabFace, SheetPage } from "./landing/edge-tab.tsx";
import { MarkedSheet } from "./landing/marked-sheet.tsx";
import { FILM_CLASS, SEVERITY_LABEL } from "./landing/severity.ts";
import { TryTab } from "./landing/tab-link.tsx";

// What each default clause type does to the reader, in one line.
const WHAT_IT_DOES: Record<string, string> = {
  "Automatic renewal": "Signs you up again unless you cancel in time.",
  "Personal guarantees": "Makes you repay a business debt from your own savings or home.",
  "Forced arbitration and class-action waivers":
    "Gives up your right to take a dispute to court or join a group case.",
  "Weak freelance payment terms":
    "Lets payment slip, or hands over your work before you are paid.",
  "Non-competes": "Limits who you can work for after the deal ends.",
  "Security deposit withholding": "Lets the other side keep your deposit.",
  "Late fees and penalties": "Charges you for paying or delivering late.",
  "Indemnity and liability caps": "Decides who pays when something goes wrong.",
};

const WONT_DO = [
  "Tell you whether to sign. That stays your decision.",
  "Give legal advice, or say whether a clause would hold up under the law where you live.",
  "Read scans or photos of a document. It needs the document's text.",
  "Read other kinds of document. It handles contracts, leases, freelance agreements and terms of service.",
];

const headingClass =
  "tab-type text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] leading-none text-ink text-balance";
const bodyClass = "max-w-[62ch] text-lg leading-relaxed text-ink";

export default function Landing() {
  const example = SAMPLE_FLAGS.find((f) => f.rank === 2) ?? SAMPLE_FLAGS[0];

  return (
    <main className="flex flex-col gap-8 px-3 pb-16 pt-3 sm:gap-12 sm:px-6 sm:pt-6 lg:gap-16 lg:px-8">
      <MarkedSheet
        intro={
          <>
            <header className="flex items-baseline justify-between gap-4 border-b border-rule pb-3 sm:pb-4">
              <p className="tab-type text-lg tracking-[0.08em] text-ink">Redline</p>
              <Link href="/try" className="text-sm font-medium text-pen underline">
                Try it on a document
              </Link>
            </header>

            <div className="mt-7 flex flex-col gap-4 sm:mt-10 sm:gap-5">
              <h1 className="tab-type text-[clamp(2rem,1.4rem+2.8vw,3.5rem)] leading-[0.95] text-balance text-ink">
                Read what you&apos;re about to accept
              </h1>
              <p className="max-w-[62ch] text-lg leading-relaxed text-ink">
                Redline flags risky clauses and quotes the sentence behind each
                one.
              </p>
              <div className="flex flex-col items-start gap-3 pt-1">
                <TryTab />
                <p className="text-sm leading-relaxed text-ink-soft">
                  Contracts, leases, freelance agreements and terms of service,
                  as pasted text. Not legal advice.
                  <br />
                  Today it gives a plain-English summary. Flags come next.
                </p>
              </div>
            </div>
          </>
        }
      />

      <SheetPage labelledBy="check-title">
        <div className="flex flex-col gap-5">
          <h2 id="check-title" className={headingClass}>
            Check any flag against your own copy
          </h2>
          <p className={bodyClass}>
            Flags are the next part of Redline to ship. Each one will quote its
            sentence exactly as your document has it, typos included, so you
            can search your copy and find it.
          </p>
          <p className={bodyClass}>
            Before showing you anything, Redline will look for every quoted
            sentence in the text you gave it. If a sentence is not there word
            for word, its flag will be dropped, and the result will say how
            many were dropped.
          </p>
        </div>

        <figure className="relative mt-10 sm:mt-14">
          <blockquote className="max-w-[34ch] font-serif text-[clamp(1.35rem,1.1rem+1vw,1.9rem)] leading-[1.5] text-ink">
            <mark className={`${FILM_CLASS[example.severity]} rounded-[2px] px-0.5 text-ink`} data-active="true">
              {example.sentence}
            </mark>
          </blockquote>
          <span aria-hidden="true" className={`${EDGE_TAB_POSITION} top-2`}>
            <EdgeTabFace severity={example.severity} rank={example.rank} />
          </span>
          <figcaption className="tab-type mt-4 text-xs text-ink-soft">
            {SEVERITY_LABEL[example.severity]}. Sample agreement, clause{" "}
            {example.clause}, word for word.
          </figcaption>
        </figure>
      </SheetPage>

      <SheetPage labelledBy="looks-for-title">
        <div className="flex flex-col gap-5">
          <h2 id="looks-for-title" className={headingClass}>
            What it looks for
          </h2>
          <p className={bodyClass}>
            Eight kinds of clause, each starting at one of two levels. A
            must-change clause is hard or costly to get out of once you have
            signed. A worth-raising clause is one to ask the other side about.
          </p>
        </div>

        <ul className="mt-8 flex flex-col border-t border-rule">
          {DEFAULT_RED_LINES.map((line) => (
            <li key={line.clauseType} className="relative border-b border-rule py-4">
              <p className="max-w-[56ch] pr-2">
                <span className="font-semibold text-ink">{line.clauseType}</span>
                <span className="tab-type ml-2 text-xs text-ink-soft">
                  {SEVERITY_LABEL[line.severity]}
                </span>
              </p>
              <p className="mt-1 max-w-[56ch] text-ink-soft">{WHAT_IT_DOES[line.clauseType]}</p>
              <span aria-hidden="true" className={`${EDGE_TAB_POSITION} top-4`}>
                <EdgeTabFace severity={line.severity} />
              </span>
            </li>
          ))}
        </ul>

        <p className={`${bodyClass} mt-8`}>
          Once flags ship, you will be able to switch any of these off, move
          one to the other level, or add a rule of your own. When none of them
          turn up, Redline will say the document is clean and list all eight
          it checked.
        </p>
      </SheetPage>

      <SheetPage labelledBy="wont-title">
        <h2 id="wont-title" className={headingClass}>
          What it won&apos;t do
        </h2>
        <ul className="mt-8 flex flex-col border-t border-rule">
          {WONT_DO.map((line) => (
            <li key={line} className="max-w-[62ch] border-b border-rule py-4 text-lg leading-relaxed text-ink">
              {line}
            </li>
          ))}
        </ul>
      </SheetPage>

      <SheetPage labelledBy="sign-title">
        <h2 id="sign-title" className={`${headingClass} max-w-[20ch]`}>
          Have a document waiting for your signature?
        </h2>
        <div className="mt-12 flex max-w-[40rem] flex-col gap-3">
          <div className="flex items-center">
            <TryTab />
            <div className="ml-2 flex-1 self-end border-b border-ink" aria-hidden="true" />
          </div>
          <p className="text-sm text-ink-soft">
            Read it here first. Redline reads documents. It does not give legal
            advice.
          </p>
        </div>
      </SheetPage>
    </main>
  );
}
