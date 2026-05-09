"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = (path: string) => `__scroll__${path}`;

export function ScrollRestore() {
  const pathname = usePathname();

  useEffect(() => {
    const key = KEY(pathname);

    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;

    const isReload = nav?.type === "reload";

    if (isReload) {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const y = parseInt(saved, 10);
        requestAnimationFrame(() => {
          setTimeout(() => window.scrollTo({ top: y, behavior: "instant" }), 80);
        });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
      sessionStorage.removeItem(key);
    }

    const onScroll = () => {
      sessionStorage.setItem(key, String(Math.round(window.scrollY)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}
