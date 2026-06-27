import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as legislatorApi from "@/lib/api/legislator";
import type { Amendment } from "@/types/legislator";

export function useAmendments(
  params: {
    lawId?: string;
    proposalId?: string;
    userId?: string;
  } = {},
) {
  return useQuery({
    queryKey: ["amendments", params],
    queryFn: () => legislatorApi.getAmendments(params),
    staleTime: 30_000,
  });
}

export function useCreateAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legislatorApi.createAmendment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["amendments"] });
      queryClient.invalidateQueries({
        queryKey: ["supervisor", "group-amendments"],
      });
      if (variables.proposal_id) {
        queryClient.invalidateQueries({
          queryKey: ["proposal", variables.proposal_id],
        });
      }
    },
  });
}

export function useUpdateAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Amendment> }) =>
      legislatorApi.updateAmendment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments"] });
    },
  });
}

export function useDeleteAmendment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legislatorApi.deleteAmendment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments"] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}
