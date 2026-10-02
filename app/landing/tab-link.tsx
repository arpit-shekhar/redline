import Link from "next/link";

// The page's one action, drawn as a red sign-here tab pointing forward. The
// link carries the focus ring because the tab's clip-path would cut it off.
export function TryTab({ size = "large" }: { size?: "large" | "small" }) {
  const scale =
    size === "large" ? "py-4 pl-6 pr-11 text-lg" : "py-2.5 pl-4 pr-8 text-sm";
  return (
    <Link href="/try" className="group inline-block rounded-sm">
      <span
        className={`tab tab-red tab-forward tab-type block transition-transform duration-200 ease-out group-hover:translate-x-1 ${scale}`}
      >
        Try it on a document
      </span>
    </Link>
  );
}
