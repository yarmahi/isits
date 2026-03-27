"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const baseLinks = [
  { href: "/records", label: "Records" },
  { href: "/profile", label: "Profile" },
] as const;

const managerLinks = [
  { href: "/activity", label: "Activity" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
] as const;

/** Top navigation with role-aware links and sign out. */
export function AppNav() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isManager = role === "manager";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="mr-2 shrink-0 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AppLogo size="sm" />
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-0.5 sm:gap-1">
          {baseLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {label}
            </Link>
          ))}
          {isManager &&
            managerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(`${href}/`)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {label}
              </Link>
            ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {!isPending && session?.user && (
            <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground sm:inline">
              {(session.user as { username?: string }).username ?? session.user.name}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
