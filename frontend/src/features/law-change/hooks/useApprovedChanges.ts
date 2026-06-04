"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApprovedChanges,
  getChangeFeed,
  rollbackChange,
  archiveChange,
} from "@/lib/api/lawChange";
import type { ApprovedChange } from "@/types/law-change.types";

export function useApprovedChanges(lawId: string) {
  return useQuery<ApprovedChange[]>({
    queryKey: ["approvedChanges", lawId],
    queryFn: () => getApprovedChanges(lawId),
    enabled: !!lawId,
  });
}

export function useChangeFeed(page?: number, limit?: number) {
  return useQuery<ApprovedChange[]>({
    queryKey: ["changeFeed", { page, limit }],
    queryFn: () => getChangeFeed({ page, limit }),
  });
}

export function useRollbackChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changeId: string) => rollbackChange(changeId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["approvedChanges", result.law_id],
      });
      queryClient.invalidateQueries({ queryKey: ["changeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["lawView", result.law_id] });
    },
  });
}

export function useArchiveChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changeId: string) => archiveChange(changeId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["approvedChanges", result.law_id],
      });
      queryClient.invalidateQueries({ queryKey: ["changeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["lawView", result.law_id] });
    },
  });
}
