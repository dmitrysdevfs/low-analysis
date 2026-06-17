"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGuestLimits } from "@/components/guest/GuestLimitsProvider";
import { getLaws } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law } from "@/types";
import type { SearchParams } from "@/types/search.types";

export type { SearchParams };

export const GUEST_VISIBLE_RESULTS_LIMIT = 12;

function toSortQuery(sort: SearchParams["sort"]): {
  sortBy?: "date" | "title";
  sortOrder?: "asc" | "desc";
} {
  if (sort === "title") return { sortBy: "title", sortOrder: "asc" };
  if (sort === "date") return { sortBy: "date", sortOrder: "desc" };
  return {};
}

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

      const hasCriteria =
        normalizedParams.q.trim() ||
        normalizedParams.number.trim() ||
        normalizedParams.docType ||
        normalizedParams.dateFrom ||
        normalizedParams.dateTo ||
        normalizedParams.status;

      if (!hasCriteria) {
        setState({ results: [], loading: false, error: null, searched: false });
        return;
      }

      const applyResults = (laws: Law[]) =>
        isGuest ? laws.slice(0, GUEST_VISIBLE_RESULTS_LIMIT) : laws;

      const queryOptions = {
        wordField: normalizedParams.wordField,
        status: normalizedParams.status || undefined,
        documentType: normalizedParams.docType || undefined,
        dateFrom: normalizedParams.dateFrom || undefined,
        dateTo: normalizedParams.dateTo || undefined,
        number: normalizedParams.number.trim() || undefined,
        numberType: normalizedParams.numberType,
        ...toSortQuery(normalizedParams.sort),
      };
      const cacheKey = JSON.stringify({
        q: normalizedParams.q.trim(),
        ...queryOptions,
        _g: isGuest,
      });
      const cached = rawCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < RAW_CACHE_TTL) {
        setState({
          results: applyResults(cached.data),
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

      getLaws(normalizedParams.q, { signal }, queryOptions)
        .then((laws) => {
          rawCache.set(cacheKey, { data: laws, ts: Date.now() });
          setState({
            results: applyResults(laws),
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
