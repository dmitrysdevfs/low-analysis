"use client";

import { useQuery } from "@tanstack/react-query";
import { getRoadmap } from "@/lib/api";
import { ROADMAP_DEFAULTS } from "../constants/roadmapDefaults";
import type { RoadmapContent } from "../types";

export const ROADMAP_QUERY_KEY = ["roadmap"];

export function useRoadmapContent(): {
  content: RoadmapContent;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
} {
  const query = useQuery({
    queryKey: ROADMAP_QUERY_KEY,
    queryFn: getRoadmap,
    staleTime: 60_000,
  });

  return {
    content: query.data ?? ROADMAP_DEFAULTS,
    updatedAt: query.data?.updatedAt ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
