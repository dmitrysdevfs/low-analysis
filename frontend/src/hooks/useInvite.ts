"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInviteInfo,
  joinByInvite,
  registerAndJoin,
} from "@/lib/api/invites";

export function useInviteInfo(token: string | null) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInviteInfo(token!),
    enabled: !!token,
    retry: false,
  });
}

export function useJoinByInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => joinByInvite(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["supervisor"] });
    },
  });
}

export function useRegisterAndJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      token,
      data,
    }: {
      token: string;
      data: { email: string; password: string; fullName: string };
    }) => registerAndJoin(token, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
