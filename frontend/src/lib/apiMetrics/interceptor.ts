"use client";

import { appendEntry } from "./storage";
import type { CostHint } from "./types";

let installed = false;

function normalizePath(rawUrl: string): string {
  try {
    const path = new URL(rawUrl, window.location.origin).pathname;
    return path
      .replace(/\/[a-f0-9]{24}/gi, "/:id")
      .replace(/\/\d+/g, "/:num");
  } catch {
    return rawUrl;
  }
}

function getCostHint(normalized: string): CostHint {
  if (normalized.includes("/tree")) return "heavy";
  if (normalized.includes("/stats") || normalized.includes("/articles"))
    return "medium";
  return "light";
}

export function installFetchInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = window.fetch;

  window.fetch = function (input, init) {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (rawUrl.includes("/api/")) {
      const method = (
        init?.method ??
        (input instanceof Request ? input.method : "GET")
      ).toUpperCase();

      const normalized = normalizePath(rawUrl);

      appendEntry({
        method,
        rawUrl,
        key: `${method} ${normalized}`,
        costHint: getCostHint(normalized),
        atMs: Date.now(),
        page: window.location.pathname,
      });
    }

    return original.call(this, input, init);
  };
}
