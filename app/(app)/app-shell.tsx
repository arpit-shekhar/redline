import type { ReactNode } from "react";
import { currentAccount } from "@/lib/storage/session.ts";
import { Spine } from "./spine.tsx";

// The working app: the desk, with a narrow spine of navigation on its left
// and the sheets to its right. On phones the spine is one row above the
// sheets, so the sheet keeps the full width.
//
// Used by app/(app)/layout.tsx and by app/try/layout.tsx. The paste page
// stays at app/try so its address does not change.
export async function AppShell({ children }: { children: ReactNode }) {
  // Who is signed in, so the spine can offer to sign in or out. The page
  // below asks the same question and shares this one answer.
  const account = await currentAccount();
  return (
    <div className="px-3 pb-12 pt-3 sm:px-6 sm:pt-6 lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:gap-6 lg:px-8">
      <Spine account={account} />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
