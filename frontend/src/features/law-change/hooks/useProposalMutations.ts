"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProposal,
  updateProposal,
  submitProposal,
  withdrawProposal,
} from "@/lib/api/lawChange";
import type { CreateProposalPayload, SubmitProposalPayload } from "@/types/law-change.types";

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProposalPayload) => createProposal(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposals", "law", result.law_id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "my"] });
      queryClient.invalidateQueries({ queryKey: ["lawView", result.law_id] });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProposalPayload> }) =>
      updateProposal(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", result._id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "law", result.law_id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "my"] });
    },
  });
}

export function useSubmitProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitProposalPayload }) =>
      submitProposal(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", result._id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "law", result.law_id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "my"] });
      queryClient.invalidateQueries({ queryKey: ["lawView", result.law_id] });
    },
  });
}

export function useWithdrawProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawProposal(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", result._id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "law", result.law_id] });
      queryClient.invalidateQueries({ queryKey: ["proposals", "my"] });
      queryClient.invalidateQueries({ queryKey: ["lawView", result.law_id] });
    },
  });
}
