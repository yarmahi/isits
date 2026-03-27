import { AppNav } from "@/components/app-nav";

/** Authenticated shell: top navigation and main content area. */
export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        {children}
      </main>
    </>
  );
}
