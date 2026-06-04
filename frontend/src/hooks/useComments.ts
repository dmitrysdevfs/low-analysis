import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as legislatorApi from "@/lib/api/legislator";

export function useComments(target_type: string, target_id: string) {
  return useQuery({
    queryKey: ["comments", target_type, target_id],
    queryFn: () => legislatorApi.getComments(target_type, target_id),
    enabled: !!target_id,
    staleTime: 30_000,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legislatorApi.addComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.target_type, variables.target_id],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legislatorApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}
