"use client";

import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPublicGroups,
  getMyGroups,
  getGroupById,
  getGroupRequests,
  getGroupActivity,
  createGroup,
  archiveGroup,
  reviewRequest,
  removeMember,
  submitRequest,
  cancelRequest,
  getMyRequests,
} from "@/lib/api/groups";

const KEYS = {
  public: ["groups", "public"] as const,
  my: ["groups", "my"] as const,
  byId: (id: string) => ["groups", id] as const,
  requests: (groupId: string) => ["groups", groupId, "requests"] as const,
  activity: (groupId: string) => ["groups", groupId, "activity"] as const,
};

export function usePublicGroups() {
  return useQuery({
    queryKey: KEYS.public,
    queryFn: getPublicGroups,
    retry: false,
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: KEYS.my,
    queryFn: getMyGroups,
    retry: false,
  });
}

export function useGroupById(id: string) {
  return useQuery({
    queryKey: KEYS.byId(id),
    queryFn: () => getGroupById(id),
    enabled: !!id,
    retry: false,
  });
}

export function useGroupRequests(groupId: string) {
  return useQuery({
    queryKey: KEYS.requests(groupId),
    queryFn: () => getGroupRequests(groupId),
    enabled: !!groupId,
    retry: false,
  });
}

export function useGroupActivity(groupId: string) {
  return useQuery({
    queryKey: KEYS.activity(groupId),
    queryFn: () => getGroupActivity(groupId),
    enabled: !!groupId,
    retry: false,
  });
}

export function useMyGroupRequests() {
  return useQuery({
    queryKey: ["groups", "my-requests"] as const,
    queryFn: getMyRequests,
    retry: false,
  });
}

export function useSupervisorPendingCount(groupIds: string[]) {
  const results = useQueries({
    queries: groupIds.map((id) => ({
      queryKey: KEYS.requests(id),
      queryFn: () => getGroupRequests(id),
      enabled: !!id,
      retry: false,
    })),
  });
  const perGroup: Record<string, number> = {};
  let total = 0;
  groupIds.forEach((id, i) => {
    const count = (results[i]?.data ?? []).filter(
      (req) => req.status === "pending",
    ).length;
    perGroup[id] = count;
    total += count;
  });
  return { total, perGroup };
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["supervisor"] });
    },
  });
}

export function useArchiveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: archiveGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["supervisor"] });
    },
  });
}

export function useReviewRequest(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reqId,
      action,
    }: {
      reqId: string;
      action: "approve" | "reject";
    }) => reviewRequest(groupId, reqId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId, "requests"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
      qc.invalidateQueries({ queryKey: ["supervisor", "group", groupId] });
      qc.invalidateQueries({ queryKey: ["supervisor", "groups"] });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMember(groupId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

export function useSubmitRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, message }: { groupId: string; message?: string }) =>
      submitRequest(groupId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, reqId }: { groupId: string; reqId: string }) =>
      cancelRequest(groupId, reqId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
