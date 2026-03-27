import Link from "next/link";

const links = [
  { href: "/records", label: "Records" },
  { href: "/activity", label: "Activity" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
] as const;

/** Top navigation bar for the main app shell (placeholders until auth hides manager links). */
export function AppNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-semibold tracking-tight text-foreground"
        >
          ISITS
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 sm:gap-3">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
