"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminRoadmap, updateAdminRoadmap } from "@/lib/api";
import { ROADMAP_DEFAULTS } from "../constants/roadmapDefaults";
import type { RoadmapApiResponse, RoadmapContent } from "../types";

const ADMIN_ROADMAP_QUERY_KEY = ["admin-roadmap"];

export function useAdminRoadmap() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ADMIN_ROADMAP_QUERY_KEY,
    queryFn: getAdminRoadmap,
    staleTime: 30_000,
  });

  const syncData = (data: RoadmapApiResponse) => {
    queryClient.setQueryData(ADMIN_ROADMAP_QUERY_KEY, data);
    return data;
  };

  const updateMutation = useMutation({
    mutationFn: (content: RoadmapContent) => updateAdminRoadmap(content),
    onSuccess: syncData,
  });

  return {
    content: query.data ?? ROADMAP_DEFAULTS,
    updatedAt: query.data?.updatedAt ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    saving: updateMutation.isPending,
    saveError:
      updateMutation.error instanceof Error
        ? updateMutation.error.message
        : null,
    save: updateMutation.mutateAsync,
    refetch: query.refetch,
  };
}
