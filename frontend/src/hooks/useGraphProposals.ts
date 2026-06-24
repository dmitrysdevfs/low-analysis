"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/graphProposals";
import type { GraphProposal } from "@/lib/api/graphProposals";

type Response =
  | GraphProposal[]
  | { proposals: GraphProposal[]; total: number; page: number; pages: number };

function extract(data: Response | undefined) {
  if (!data) return { proposals: [], total: 0, page: 1, pages: 1 };
  if (Array.isArray(data))
    return { proposals: data, total: data.length, page: 1, pages: 1 };
  return {
    proposals: data.proposals,
    total: data.total,
    page: data.page,
    pages: data.pages,
  };
}

export function useGraphProposals(
  params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["graph-proposals", params],
    queryFn: () => api.getGraphProposals(params),
    staleTime: 30_000,
    select: extract,
  });
}

export function useGraphVoteStats(proposalId: string | null) {
  return useQuery({
    queryKey: ["graph-vote-stats", proposalId],
    queryFn: () => api.getGraphVoteStats(proposalId!),
    enabled: !!proposalId,
    staleTime: 10_000,
  });
}

export function useCastGraphVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: "for" | "against" }) =>
      api.castGraphVote(id, vote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["graph-vote-stats"] });
    },
  });
}

export function useRemoveGraphVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeGraphVote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["graph-vote-stats"] });
    },
  });
}

export function useCreateGraphProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGraphProposal,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["graph-proposals"] }),
  });
}
