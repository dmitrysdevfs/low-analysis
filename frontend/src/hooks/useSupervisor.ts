"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSupervisorDashboard,
  getSupervisorGroupDetail,
  getSupervisorGroups,
  createSupervisorGroup,
  updateSupervisorGroup,
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
