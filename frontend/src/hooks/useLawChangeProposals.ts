"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import * as api from "@/lib/api/lawChange";
import type { LawChangeProposal } from "@/types/law-change.types";

type ProposalsResult =
  | LawChangeProposal[]
  | {
      proposals: LawChangeProposal[];
      total: number;
      page: number;
      pages: number;
    };

function extractProposals(
  data: ProposalsResult | undefined,
): LawChangeProposal[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.proposals;
}

function extractTotal(data: ProposalsResult | undefined): number {
  if (!data) return 0;
  return Array.isArray(data) ? data.length : data.total;
}

export function useActiveProposalsCount() {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: ["proposals-active-count"],
    queryFn: () => api.getAllProposals({ status: "active", limit: 100 }),
    enabled: isAuthenticated,
    staleTime: 2 * 60_000,
  });
  return extractTotal(data);
}

export function useProposals(
  params: { status?: string; page?: number; limit?: number } = {},
) {
  return useQuery({
    queryKey: ["proposals", params],
    queryFn: () => api.getAllProposals(params),
    staleTime: 30_000,
    select: (data) => ({
      proposals: extractProposals(data),
      total: extractTotal(data),
      page: Array.isArray(data) ? 1 : (data?.page ?? 1),
      pages: Array.isArray(data) ? 1 : (data?.pages ?? 1),
    }),
  });
}

export function useProposalVoteStats(proposalId: string | null) {
  return useQuery({
    queryKey: ["proposal-vote-stats", proposalId],
    queryFn: () => api.getVoteStats(proposalId!),
    enabled: !!proposalId,
    staleTime: 10_000,
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      proposalId,
      vote,
    }: {
      proposalId: string;
      vote: "for" | "against";
    }) => api.castVote(proposalId, { vote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposal-vote-stats"] });
      queryClient.invalidateQueries({ queryKey: ["proposals-active-count"] });
    },
  });
}

export function useRemoveVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => api.removeVote(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposal-vote-stats"] });
      queryClient.invalidateQueries({ queryKey: ["proposals-active-count"] });
    },
  });
}
