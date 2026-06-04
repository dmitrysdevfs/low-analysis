import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as legislatorApi from "@/lib/api/legislator";

export function useVoteSummary(amendmentId: string) {
  return useQuery({
    queryKey: ["vote-summary", amendmentId],
    queryFn: () => legislatorApi.getVoteSummary(amendmentId),
    enabled: !!amendmentId,
    staleTime: 30_000,
  });
}

export function useMyVote(amendmentId: string) {
  return useQuery({
    queryKey: ["my-vote", amendmentId],
    queryFn: () => legislatorApi.getMyVote(amendmentId),
    enabled: !!amendmentId,
    staleTime: 30_000,
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legislatorApi.castVote,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["vote-summary", variables.amendment_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-vote", variables.amendment_id],
      });
      queryClient.invalidateQueries({ queryKey: ["proposal"] });
    },
  });
}
