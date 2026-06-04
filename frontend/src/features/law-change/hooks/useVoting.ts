"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVoteStats, castVote, removeVote } from "@/lib/api/lawChange";
import type { VoteStats, VotePayload } from "@/types/law-change.types";

export function useVoteStats(proposalId: string) {
  return useQuery<VoteStats>({
    queryKey: ["voteStats", proposalId],
    queryFn: () => getVoteStats(proposalId),
    enabled: !!proposalId,
  });
}

export function useCastVote(proposalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VotePayload) => castVote(proposalId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["voteStats", proposalId] });
      const previous = queryClient.getQueryData<VoteStats>([
        "voteStats",
        proposalId,
      ]);
      if (previous) {
        const isFor = data.vote === "for";
        queryClient.setQueryData<VoteStats>(["voteStats", proposalId], {
          ...previous,
          votes_for_count: isFor
            ? previous.votes_for_count + 1
            : previous.votes_for_count,
          votes_against_count: !isFor
            ? previous.votes_against_count + 1
            : previous.votes_against_count,
          my_vote: data.vote,
        });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["voteStats", proposalId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["voteStats", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useRemoveVote(proposalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeVote(proposalId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["voteStats", proposalId] });
      const previous = queryClient.getQueryData<VoteStats>([
        "voteStats",
        proposalId,
      ]);
      if (previous && previous.my_vote) {
        const wasFor = previous.my_vote === "for";
        queryClient.setQueryData<VoteStats>(["voteStats", proposalId], {
          ...previous,
          votes_for_count: wasFor
            ? previous.votes_for_count - 1
            : previous.votes_for_count,
          votes_against_count: !wasFor
            ? previous.votes_against_count - 1
            : previous.votes_against_count,
          my_vote: null,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["voteStats", proposalId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["voteStats", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}
