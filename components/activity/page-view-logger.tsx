"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logPageViewAction } from "@/services/audit";

/** Logs authenticated SPA navigations as page_view audit events (debounced per path). */
export function PageViewLogger() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/login")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    void logPageViewAction(pathname);
  }, [pathname]);

  return null;
}
