import type { ReactNode } from "react";
import type { Severity } from "@/lib/analysis/types.ts";
import { SEVERITY_LABEL, TAB_CLASS } from "./severity.ts";

// Where a tab sits on a full-width row inside a sheet: its pointed end on the
// sheet, the rest sticking out past the right edge onto the desk.
export const EDGE_TAB_POSITION =
  "absolute -right-[4rem] sm:-right-[5.75rem] lg:-right-[11.5rem]";

// The film and label of one tab. On narrow screens only the rank shows; the
// severity word must then appear in the row's own text.
export function EdgeTabFace({
  severity,
  rank,
  className = "",
}: {
  severity: Severity;
  rank?: number;
  className?: string;
}) {
  return (
    <span
      className={`tab ${TAB_CLASS[severity]} tab-type flex h-9 min-w-10 items-center gap-2 pl-5 pr-3 text-[0.8125rem] lg:h-10 lg:w-[12.5rem] ${className}`}
    >
      {rank !== undefined && <span className="text-base tabular-nums">{rank}</span>}
      <span className="hidden lg:inline">{SEVERITY_LABEL[severity]}</span>
    </span>
  );
}

// A further page of the landing: the same sheet width and right margin as the
// first page, so tabs on it stick out the same way.
export function SheetPage({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="mx-auto grid w-full max-w-[84rem] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem]"
    >
      <div className="sheet-edge relative bg-sheet py-10 pl-5 pr-14 sm:py-14 sm:pl-12 sm:pr-20 lg:py-16 lg:pl-16 lg:pr-24">
        {children}
      </div>
    </section>
  );
}
