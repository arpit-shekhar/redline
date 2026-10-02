import { AppShell } from "./app-shell.tsx";

// The app's pages (the library and the red lines) sit on the desk
// beside the spine. The paste page uses the same shell from app/try.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
