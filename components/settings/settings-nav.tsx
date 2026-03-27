"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ListChecks, ListTree, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/settings/branches", label: "Branches", icon: Building2 },
  { href: "/settings/statuses", label: "Statuses", icon: ListChecks },
  {
    href: "/settings/delivery-methods",
    label: "Delivery methods",
    icon: Truck,
  },
  { href: "/settings/fields", label: "Record fields", icon: ListTree },
] as const;

/** Card-style rail for Chapter 2 settings; highlights active route. */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex w-full shrink-0 flex-col gap-0.5 rounded-xl border border-border/80 bg-card p-2 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        "md:max-w-[13.5rem]",
        "lg:sticky lg:top-20 lg:self-start",
      )}
      aria-label="Settings sections"
    >
      <p className="mb-1 px-2.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Configure
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0 opacity-85" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
