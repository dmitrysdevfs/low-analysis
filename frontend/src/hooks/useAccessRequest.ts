"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAccessRequest,
  submitAccessRequest,
  getPendingAccessRequests,
  reviewAccessRequest,
} from "@/lib/api/accessRequests";

export function useMyAccessRequest() {
  return useQuery({
    queryKey: ["access-request", "me"],
    queryFn: getMyAccessRequest,
    retry: false,
  });
}

export function useSubmitAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) => submitAccessRequest(message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-request"] }),
  });
}

export function usePendingAccessRequests() {
  return useQuery({
    queryKey: ["access-request", "pending"],
    queryFn: getPendingAccessRequests,
    retry: false,
  });
}

export function useReviewAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      adminNote,
    }: {
      id: string;
      action: "approve" | "reject";
      adminNote?: string;
    }) => reviewAccessRequest(id, action, adminNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-request"] }),
  });
}
