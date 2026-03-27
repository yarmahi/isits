import { AppShell } from "@/components/app-shell";

/** Authenticated shell: top navigation and centered main content. */
export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
