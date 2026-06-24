"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSupervisorDashboard,
  getSupervisorGroupDetail,
  getSupervisorGroups,
  createSupervisorGroup,
  updateSupervisorGroup,
  getGroupProposals,
  getGroupAmendments,
  getGroupForks,
  reviewGroupFork,
  reviewProposal,
} from "@/lib/api/supervisor";

const KEYS = {
  dashboard: ["supervisor", "dashboard"] as const,
  groups: ["supervisor", "groups"] as const,
};

export function useSupervisorDashboard() {
  return useQuery({
    queryKey: KEYS.dashboard,
    queryFn: getSupervisorDashboard,
    retry: false,
  });
}

export function useSupervisorGroups() {
  return useQuery({
    queryKey: KEYS.groups,
    queryFn: getSupervisorGroups,
    retry: false,
  });
}

export function useSupervisorGroupDetail(groupId: string | null) {
  return useQuery({
    queryKey: ["supervisor", "group", groupId],
    queryFn: () => getSupervisorGroupDetail(groupId as string),
    enabled: Boolean(groupId),
    retry: false,
  });
}

export function useCreateSupervisorGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSupervisorGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.groups });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
      qc.invalidateQueries({ queryKey: ["supervisor", "group"] });
    },
  });
}

export function useUpdateSupervisorGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateSupervisorGroup>[1];
    }) => updateSupervisorGroup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.groups });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
      qc.invalidateQueries({ queryKey: ["supervisor", "group"] });
    },
  });
}

export function useSupervisorGroupProposals() {
  return useQuery({
    queryKey: ["supervisor", "group-proposals"] as const,
    queryFn: getGroupProposals,
    retry: false,
  });
}

export function useSupervisorGroupAmendments() {
  return useQuery({
    queryKey: ["supervisor", "group-amendments"] as const,
    queryFn: getGroupAmendments,
    retry: false,
  });
}

export function useSupervisorGroupForks() {
  return useQuery({
    queryKey: ["supervisor", "group-forks"] as const,
    queryFn: getGroupForks,
    retry: false,
  });
}

export function useReviewGroupFork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      forkId,
      action,
      reviewNote,
    }: {
      forkId: string;
      action: "approve" | "reject";
      reviewNote?: string;
    }) => reviewGroupFork(forkId, action, reviewNote),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["supervisor", "group-forks"] });
      qc.invalidateQueries({ queryKey: ["forks", "diff", variables.forkId] });
      qc.invalidateQueries({ queryKey: ["changes"] });
    },
  });
}

export function useReviewProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject";
    }) => reviewProposal(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["changes"] });
      qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}
