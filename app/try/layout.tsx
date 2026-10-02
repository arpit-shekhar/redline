import { AppShell } from "../(app)/app-shell.tsx";

// The paste page sits in the same shell as the rest of the app. It stays at
// app/try, rather than moving into app/(app), so its address is unchanged.
export default function TryLayout({ children }: LayoutProps<"/try">) {
  return <AppShell>{children}</AppShell>;
}
