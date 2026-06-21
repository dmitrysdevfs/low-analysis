"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAccessRequest,
  getAllAccessRequests,
  submitAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
  setUserRole,
  revokeMyRole,
} from "@/lib/api/legislatorAccess";
import type { LegislatorAccessRequest } from "@/types/law-change.types";

export function useMyAccessRequest() {
  return useQuery<LegislatorAccessRequest | null>({
    queryKey: ["legislatorAccess", "my"],
    queryFn: () => getMyAccessRequest(),
  });
}

export function useAllAccessRequests(status?: string) {
  return useQuery<LegislatorAccessRequest[]>({
    queryKey: ["legislatorAccess", "all", status],
    queryFn: () => getAllAccessRequests(status),
  });
}

export function useSubmitAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      organization: string;
      reason: string;
      requestedRole: "legislator" | "supervisor";
    }) => submitAccessRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legislatorAccess", "my"] });
      queryClient.invalidateQueries({ queryKey: ["legislatorAccess", "all"] });
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revokeMyRole(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legislatorAccess", "my"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      approveAccessRequest(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legislatorAccess", "all"] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      rejectAccessRequest(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legislatorAccess", "all"] });
    },
  });
}

export function useSetUserRole() {
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      setUserRole(userId, role),
  });
}
