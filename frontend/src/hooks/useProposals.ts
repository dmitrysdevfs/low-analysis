import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as legislatorApi from "@/lib/api/legislator";
import type { Proposal } from "@/types/legislator";

export function useProposals(params: { lawId?: string; userId?: string } = {}) {
  return useQuery({
    queryKey: ["proposals", params],
    queryFn: () => legislatorApi.getProposals(params),
    staleTime: 30_000,
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: ["proposal", id],
    queryFn: () => legislatorApi.getProposalById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legislatorApi.createProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Proposal> }) =>
      legislatorApi.updateProposal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useSubmitProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => legislatorApi.submitProposal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => legislatorApi.deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}
