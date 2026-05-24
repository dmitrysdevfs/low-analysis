"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubjects } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Subject } from "@/types";

export function useSubjects() {
  const { data, isLoading, error } = useQuery<Subject[], Error>({
    queryKey: ["subjects"],
    queryFn: ({ signal }) => getSubjects({ signal }),
    staleTime: 60_000,
  });

  return {
    subjects: data ?? [],
    loading: isLoading,
    error: error ? parseApiError(error) : null,
  };
}

// Kept for test compatibility — no-op since TanStack Query manages its own cache
export function __resetSubjectsCacheForTests() {}
