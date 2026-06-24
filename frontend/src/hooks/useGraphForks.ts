"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyGraphForks, deleteGraphFork } from "@/lib/api/graphForks";

export function useMyGraphForks() {
  return useQuery({
    queryKey: ["graph-forks", "my"] as const,
    queryFn: getMyGraphForks,
    retry: false,
  });
}

export function useDeleteGraphFork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGraphFork,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["graph-forks"] });
    },
  });
}
