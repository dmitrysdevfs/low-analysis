"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyForks,
  createFork,
  submitFork,
  getForkDiff,
  getLawForks,
  addChange,
  type LawChange,
} from "@/lib/api/forks";

const KEYS = {
  myForks: ["forks", "me"] as const,
  lawForks: (lawId: string) => ["forks", "law", lawId] as const,
  diff: (id: string) => ["forks", "diff", id] as const,
};

export function useMyForks() {
  return useQuery({
    queryKey: KEYS.myForks,
    queryFn: getMyForks,
    retry: false,
  });
}

export function useLawForks(lawId: string) {
  return useQuery({
    queryKey: KEYS.lawForks(lawId),
    queryFn: () => getLawForks(lawId),
    enabled: !!lawId,
    retry: false,
  });
}

export function useForkDiff(forkId: string) {
  return useQuery({
    queryKey: KEYS.diff(forkId),
    queryFn: () => getForkDiff(forkId),
    enabled: !!forkId,
    retry: false,
  });
}

export function useCreateFork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFork,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forks"] });
    },
  });
}

export function useSubmitFork() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitFork,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forks"] });
    },
  });
}

export function useAddChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ forkId, change }: { forkId: string; change: Omit<LawChange, "_id" | "forkId"> }) =>
      addChange(forkId, change),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forks"] }); },
  });
}
