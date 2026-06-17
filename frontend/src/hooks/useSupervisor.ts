"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSupervisorDashboard,
  getSupervisorGroups,
  createSupervisorGroup,
  updateSupervisorGroup,
  type SupervisorGroup,
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

export function useCreateSupervisorGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSupervisorGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.groups });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}

export function useUpdateSupervisorGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSupervisorGroup>[1] }) =>
      updateSupervisorGroup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.groups });
      qc.invalidateQueries({ queryKey: KEYS.dashboard });
    },
  });
}
