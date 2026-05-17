"use client";

import { useEffect, useState } from "react";
import { getLaws } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law } from "@/types";

// Module-level cache: key = query string, value = { data, timestamp }
const lawsCache = new Map<string, { data: Law[]; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

interface State {
  fetchedQ: string | null;
  laws: Law[];
  error: string | null;
}

export function useLaws(q = "", refreshKey = 0) {
  const [state, setState] = useState<State>({
    fetchedQ: null,
    laws: [],
    error: null,
  });

  const loading = state.fetchedQ !== q;

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(
      () => {
        const cacheKey =
          refreshKey > 0 ? `${q || "__all__"}:r${refreshKey}` : q || "__all__";
        const cached = lawsCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setState({ fetchedQ: q, laws: cached.data, error: null });
          return;
        }

        getLaws(q, { signal: controller.signal })
          .then((laws) => {
            lawsCache.set(cacheKey, { data: laws, ts: Date.now() });
            setState({ fetchedQ: q, laws, error: null });
          })
          .catch((error: unknown) => {
            const msg = parseApiError(error);
            if (msg === "__ABORT__") return;
            setState({ fetchedQ: q, laws: [], error: msg });
          });
      },
      q ? 250 : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, refreshKey]);

  return { ...state, loading };
}

export function __resetLawsCacheForTests() {
  lawsCache.clear();
}
