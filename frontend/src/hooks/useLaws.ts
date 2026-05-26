"use client";

import { useQuery } from "@tanstack/react-query";
import { getLaws } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law } from "@/types";

export function useLaws(q = "", refreshKey = 0) {
  const { data, isLoading, error } = useQuery<Law[], Error>({
    queryKey: ["laws", q, refreshKey],
    queryFn: ({ signal }) => getLaws(q, { signal }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  return {
    laws: data ?? [],
    loading: isLoading,
    error: error ? parseApiError(error) : null,
  };
}

// Kept for test compatibility — no-op since TanStack Query manages its own cache
export function __resetLawsCacheForTests() {}
