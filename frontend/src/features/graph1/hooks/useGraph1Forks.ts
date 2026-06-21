"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyForks,
  createGraphFork,
  updateGraphFork,
  deleteGraphFork,
} from "@/lib/api/graph1";
import type { GraphFork } from "../types/graph1.types";

const FORKS_KEY = ["graph1", "forks", "my"] as const;

export function useGraph1Forks() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: FORKS_KEY,
    queryFn: fetchMyForks,
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createGraphFork,
    onSuccess: () => qc.invalidateQueries({ queryKey: FORKS_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<
        Omit<GraphFork, "_id" | "userId" | "createdAt" | "updatedAt">
      >;
    }) => updateGraphFork(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORKS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGraphFork,
    onSuccess: () => qc.invalidateQueries({ queryKey: FORKS_KEY }),
  });

  return {
    forks: query.data ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
