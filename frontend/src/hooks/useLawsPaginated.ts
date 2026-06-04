"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLawsPaginated } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { LawsQuery } from "@/lib/api/laws";

export function useLawsPaginated(query: LawsQuery = {}) {
  const serialized = JSON.stringify(query);
  const [debouncedKey, setDebouncedKey] = useState(serialized);

  useEffect(() => {
    const hasSearch = Boolean(query.q?.trim());
    const timer = setTimeout(
      () => setDebouncedKey(serialized),
      hasSearch ? 250 : 0,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const debouncedQuery: LawsQuery = JSON.parse(debouncedKey);

  const { data, isLoading, error } = useQuery({
    queryKey: ["laws-paginated", debouncedKey],
    queryFn: ({ signal }) => getLawsPaginated(debouncedQuery, { signal }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  return {
    laws: data?.data ?? [],
    pagination: data?.pagination ?? null,
    loading: isLoading,
    error: error ? parseApiError(error) : null,
  };
}
