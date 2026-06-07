"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/api/activity";
import { readStoredToken } from "@/lib/auth/authClient";

const DEBOUNCE_MS = 30_000;

export function UserActivityTracker() {
  const pathname = usePathname();
  const lastRef = useRef<{ path: string; time: number }>({ path: "", time: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!readStoredToken()) return;
    if (pathname.startsWith("/admin")) return;

    const now = Date.now();
    if (
      lastRef.current.path === pathname &&
      now - lastRef.current.time < DEBOUNCE_MS
    )
      return;

    lastRef.current = { path: pathname, time: now };
    trackPageView(pathname).catch(() => {});
  }, [pathname]);

  return null;
}
