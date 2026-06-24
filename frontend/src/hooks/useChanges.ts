"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyChanges, getSupervisorChanges } from "@/lib/api/changes";

export function useMyChanges() {
  return useQuery({
    queryKey: ["changes", "my"] as const,
    queryFn: getMyChanges,
    staleTime: 30_000,
    retry: false,
  });
}

export function useSupervisorChanges() {
  return useQuery({
    queryKey: ["changes", "supervisor"] as const,
    queryFn: getSupervisorChanges,
    staleTime: 30_000,
    retry: false,
  });
}
