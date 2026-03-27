"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  Settings,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PageViewLogger } from "@/components/activity/page-view-logger";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const mainNav: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/records", label: "Records", icon: ClipboardList },
];

const managerNav: NavItem[] = [
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

type Theme = "light" | "dark" | "system";

const THEME_OPTIONS: {
  value: Theme;
  icon: typeof Sun;
  label: string;
}[] = [
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "dark", icon: Moon, label: "Dark theme" },
  { value: "system", icon: Monitor, label: "Match system appearance" },
];

function useThemePreference() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("theme") as Theme | null;
    if (t === "light" || t === "dark" || t === "system") setTheme(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const apply = () => {
      if (theme === "system") {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", dark);
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    };
    apply();
    localStorage.setItem("theme", theme);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const fn = () => apply();
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    }
  }, [theme, mounted]);

  return { theme, setTheme, mounted };
}

function NavLinks({
  pathname,
  isManager,
  onNavigate,
  variant = "horizontal",
}: {
  pathname: string;
  isManager: boolean;
  onNavigate?: () => void;
  variant?: "horizontal" | "stacked";
}) {
  const link = (items: NavItem[]) =>
    items.map(({ href, label, icon: Icon }) => {
      const active =
        href === "/"
          ? pathname === "/"
          : pathname === href || pathname.startsWith(`${href}/`);
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            active
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
          {label}
        </Link>
      );
    });

  return (
    <nav
      className={cn(
        "flex",
        variant === "horizontal"
          ? "flex-wrap items-center gap-1 md:gap-2"
          : "flex-col gap-0.5",
      )}
    >
      {link(mainNav)}
      {isManager && link(managerNav)}
    </nav>
  );
}

/** Centered layout: top bar with left nav links, user menu (icon + theme + profile + sign out). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isManager = role === "manager";
  const displayName =
    (session?.user as { username?: string })?.username ?? session?.user?.name;
  const { theme, setTheme } = useThemePreference();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <a
        href="#main-content"
        className="sr-only left-4 top-4 z-[100] rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md outline-none ring-2 ring-ring focus:fixed focus:not-sr-only"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/90">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:gap-6 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6">
            <Link
              href="/"
              className="shrink-0 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AppLogo size="sm" />
            </Link>

            <nav className="hidden min-w-0 flex-1 md:block">
              <NavLinks
                pathname={pathname}
                isManager={isManager}
                variant="horizontal"
              />
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Open menu"
                    />
                  }
                >
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-72 p-0"
                  aria-label="Main navigation"
                >
                  <div className="flex h-14 items-center border-b px-4">
                    <AppLogo size="sm" />
                  </div>
                  <ScrollArea className="h-[calc(100vh-3.5rem)]">
                    <div className="p-2">
                      <NavLinks
                        pathname={pathname}
                        isManager={isManager}
                        variant="stacked"
                        onNavigate={() => setMobileOpen(false)}
                      />
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {!isPending && session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-full"
                      aria-label="Account menu"
                    />
                  }
                >
                  <UserRound className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {session.user.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {displayName}
                        {role ? ` · ${role === "manager" ? "Manager" : "Specialist"}` : ""}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Theme</DropdownMenuLabel>
                    <div
                      className="grid grid-cols-3 gap-1 px-1 pb-1"
                      role="group"
                      aria-label="Color theme"
                    >
                      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          aria-label={label}
                          aria-pressed={theme === value}
                          onClick={() => setTheme(value)}
                          className={cn(
                            "flex h-9 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                            theme === value &&
                              "bg-accent text-foreground shadow-sm",
                          )}
                        >
                          <Icon className="size-4" aria-hidden />
                        </button>
                      ))}
                    </div>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={async () => {
                      await authClient.signOut();
                      window.location.href = "/login";
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-4 py-6 outline-none md:px-6 md:py-8"
      >
        <PageViewLogger />
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
