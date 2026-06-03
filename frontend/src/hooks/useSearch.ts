"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGuestLimits } from "@/components/guest/GuestLimitsProvider";
import { getLaws } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law } from "@/types";
import type { SearchParams } from "@/types/search.types";
import { applySearchFilters, sortLaws } from "@/lib/search/filters";

export type { SearchParams };

export const GUEST_VISIBLE_RESULTS_LIMIT = 12;

const DEFAULT_PARAMS: SearchParams = {
  q: "",
  wordField: "title",
  docType: "",
  dateFrom: "",
  dateTo: "",
  numberType: "starts",
  number: "",
  status: "",
  sort: "date",
};

interface State {
  results: Law[];
  loading: boolean;
  error: string | null;
  searched: boolean;
}

type SearchInput = Partial<SearchParams> & { type?: string };

// Raw results cached by query string — filters applied client-side without refetch
const rawCache = new Map<string, { data: Law[]; ts: number }>();
const RAW_CACHE_TTL = 60_000;

export function useSearch() {
  const { consumeSearch, isGuest } = useGuestLimits();
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const [state, setState] = useState<State>({
    results: [],
    loading: false,
    error: null,
    searched: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    (nextParams: SearchInput) => {
      const normalizedParams: SearchParams = {
        ...DEFAULT_PARAMS,
        ...nextParams,
        docType:
          nextParams.docType ?? nextParams.type ?? DEFAULT_PARAMS.docType,
      };

      setParams(normalizedParams);

      if (!normalizedParams.q.trim() && !normalizedParams.number.trim()) {
        setState({ results: [], loading: false, error: null, searched: false });
        return;
      }

      const applyFilters = (raw: Law[]) => {
        const filtered = applySearchFilters(raw, normalizedParams);
        const sorted = sortLaws(filtered, normalizedParams.sort);
        return isGuest ? sorted.slice(0, GUEST_VISIBLE_RESULTS_LIMIT) : sorted;
      };

      // If we already have raw results for this query — skip network + quota
      const cacheKey = `${normalizedParams.q}::${normalizedParams.wordField}`;
      const cached = rawCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < RAW_CACHE_TTL) {
        setState({
          results: applyFilters(cached.data),
          loading: false,
          error: null,
          searched: true,
        });
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      const guestAttempt = consumeSearch();

      if (!guestAttempt.allowed) {
        setState({
          results: [],
          loading: false,
          error: guestAttempt.message ?? "Guest search limit reached.",
          searched: true,
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      getLaws(
        normalizedParams.q,
        { signal },
        { wordField: normalizedParams.wordField },
      )
        .then((laws) => {
          rawCache.set(cacheKey, { data: laws, ts: Date.now() });
          setState({
            results: applyFilters(laws),
            loading: false,
            error: null,
            searched: true,
          });
        })
        .catch((err: unknown) => {
          const msg = parseApiError(err);
          if (msg === "__ABORT__") return;
          setState({
            results: [],
            loading: false,
            error: msg,
            searched: true,
          });
        });
    },
    [consumeSearch, isGuest],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setParams(DEFAULT_PARAMS);
    setState({ results: [], loading: false, error: null, searched: false });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { ...state, params, search, reset };
}
