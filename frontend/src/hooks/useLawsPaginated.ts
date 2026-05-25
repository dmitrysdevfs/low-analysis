"use client";

import { useEffect, useState } from "react";
import { getLawsPaginated } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law, Pagination } from "@/types";
import type { LawsQuery } from "@/lib/api/laws";

const cache = new Map<
  string,
  { data: Law[]; pagination: Pagination; ts: number }
>();
const CACHE_TTL = 60_000;

interface State {
  laws: Law[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

export function useLawsPaginated(query: LawsQuery = {}) {
  const cacheKey = JSON.stringify(query);
  const [state, setState] = useState<State>({
    laws: [],
    pagination: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const hasQuery = Boolean(query.q?.trim());

    const timer = setTimeout(
      () => {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setState({
            laws: cached.data,
            pagination: cached.pagination,
            loading: false,
            error: null,
          });
          return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        getLawsPaginated(query, { signal: controller.signal })
          .then((res) => {
            if (cache.size >= 20) cache.delete(cache.keys().next().value!);
            cache.set(cacheKey, {
              data: res.data,
              pagination: res.pagination,
              ts: Date.now(),
            });
            setState({
              laws: res.data,
              pagination: res.pagination,
              loading: false,
              error: null,
            });
          })
          .catch((err: unknown) => {
            const msg = parseApiError(err);
            if (msg === "__ABORT__") return;
            setState({
              laws: [],
              pagination: null,
              loading: false,
              error: msg,
            });
          });
      },
      hasQuery ? 250 : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return state;
}
