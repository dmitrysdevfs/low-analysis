"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/radiantProposals";
import type { RadiantProposal } from "@/lib/api/radiantProposals";

type Response =
  | RadiantProposal[]
  | {
      proposals: RadiantProposal[];
      total: number;
      page: number;
      pages: number;
    };

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

export function useRadiantProposals(
  params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["radiant-proposals", params],
    queryFn: () => api.getRadiantProposals(params),
    staleTime: 30_000,
    select: extract,
  });
}

export function useRadiantVoteStats(proposalId: string | null) {
  return useQuery({
    queryKey: ["radiant-vote-stats", proposalId],
    queryFn: () => api.getRadiantVoteStats(proposalId!),
    enabled: !!proposalId,
    staleTime: 10_000,
  });
}

export function useCastRadiantVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: "for" | "against" }) =>
      api.castRadiantVote(id, vote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radiant-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["radiant-vote-stats"] });
    },
  });
}

export function useRemoveRadiantVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeRadiantVote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radiant-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["radiant-vote-stats"] });
    },
  });
}

export function useCreateRadiantProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createRadiantProposal,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["radiant-proposals"] }),
  });
}
