"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLaws } from "@/lib/api";
import type { Law } from "@/types";

export interface SearchParams {
  q: string;
  wordField: "title" | "text" | "code";
  docType: string;
  dateFrom: string;
  dateTo: string;
  numberType: "starts" | "contains" | "exact";
  number: string;
  status: string;
  sort: "date" | "title" | "relevance";
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

export function useSearch() {
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const [state, setState] = useState<State>({
    results: [],
    loading: false,
    error: null,
    searched: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback((nextParams: SearchInput) => {
    const normalizedParams: SearchParams = {
      ...DEFAULT_PARAMS,
      ...nextParams,
      docType: nextParams.docType ?? nextParams.type ?? DEFAULT_PARAMS.docType,
    };

    setParams(normalizedParams);

    if (!normalizedParams.q.trim() && !normalizedParams.number.trim()) {
      setState({ results: [], loading: false, error: null, searched: false });
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    getLaws(normalizedParams.q)
      .then((laws) => {
        let filtered = [...laws];

        if (normalizedParams.docType) {
          filtered = filtered.filter((law) =>
            (law.preamble ?? "")
              .toUpperCase()
              .includes(normalizedParams.docType.toUpperCase()),
          );
        }

        if (normalizedParams.number.trim()) {
          const num = normalizedParams.number.trim().toLowerCase();
          if (normalizedParams.numberType === "starts") {
            filtered = filtered.filter((law) =>
              law.code.toLowerCase().startsWith(num),
            );
          } else if (normalizedParams.numberType === "contains") {
            filtered = filtered.filter((law) =>
              law.code.toLowerCase().includes(num),
            );
          } else {
            filtered = filtered.filter((law) => law.code.toLowerCase() === num);
          }
        }

        if (normalizedParams.dateFrom) {
          const from = new Date(normalizedParams.dateFrom).getTime();
          filtered = filtered.filter(
            (law) => new Date(law.createdAt).getTime() >= from,
          );
        }

        if (normalizedParams.dateTo) {
          const to = new Date(normalizedParams.dateTo).getTime();
          filtered = filtered.filter(
            (law) => new Date(law.createdAt).getTime() <= to,
          );
        }

        if (normalizedParams.status) {
          filtered = filtered.filter((law) =>
            (law.status ?? "")
              .toLowerCase()
              .includes(normalizedParams.status.toLowerCase()),
          );
        }

        if (normalizedParams.sort === "title") {
          filtered.sort((a, b) => a.title.localeCompare(b.title, "uk"));
        } else if (normalizedParams.sort === "date") {
          filtered.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        }

        setState({
          results: filtered,
          loading: false,
          error: null,
          searched: true,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({
          results: [],
          loading: false,
          error: err instanceof Error ? err.message : "Помилка пошуку",
          searched: true,
        });
      });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setParams(DEFAULT_PARAMS);
    setState({ results: [], loading: false, error: null, searched: false });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { ...state, params, search, reset };
}
