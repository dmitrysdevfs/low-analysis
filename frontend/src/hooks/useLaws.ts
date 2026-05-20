"use client";

import { useEffect, useState } from "react";
import { getLaws } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law } from "@/types";

// Module-level cache: key = query string, value = { data, timestamp }
const lawsCache = new Map<string, { data: Law[]; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

// In-flight dedup: multiple hook instances with the same key share one promise
const pendingMap = new Map<string, Promise<Law[]>>();

interface State {
  fetchedQ: string | null;
  fetchedRefreshKey: number | null;
  laws: Law[];
  error: string | null;
}

export function useLaws(q = "", refreshKey = 0) {
  const [state, setState] = useState<State>({
    fetchedQ: null,
    fetchedRefreshKey: null,
    laws: [],
    error: null,
  });

  const loading =
    state.fetchedQ !== q || state.fetchedRefreshKey !== refreshKey;

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(
      () => {
        const cacheKey =
          refreshKey > 0 ? `${q || "__all__"}:r${refreshKey}` : q || "__all__";
        const cached = lawsCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setState({
            fetchedQ: q,
            fetchedRefreshKey: refreshKey,
            laws: cached.data,
            error: null,
          });
          return;
        }

        const inFlight = pendingMap.get(cacheKey);
        const fetchPromise = inFlight ?? getLaws(q, { signal: controller.signal });
        if (!inFlight) pendingMap.set(cacheKey, fetchPromise);

        fetchPromise
          .then((laws) => {
            pendingMap.delete(cacheKey);
            if (lawsCache.size >= 20) {
              lawsCache.delete(lawsCache.keys().next().value!);
            }
            lawsCache.set(cacheKey, { data: laws, ts: Date.now() });
            setState({
              fetchedQ: q,
              fetchedRefreshKey: refreshKey,
              laws,
              error: null,
            });
          })
          .catch((error: unknown) => {
            pendingMap.delete(cacheKey);
            const msg = parseApiError(error);
            if (msg === "__ABORT__") return;
            setState({
              fetchedQ: q,
              fetchedRefreshKey: refreshKey,
              laws: [],
              error: msg,
            });
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
