"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getProposalsForLaw,
  getProposalsForElement,
  getMyProposals,
} from "@/lib/api/lawChange";
import { getJson } from "@/lib/api/laws";
import type { LawChangeProposal } from "@/types/law-change.types";

export function useProposalsForLaw(lawId: string) {
  return useQuery<LawChangeProposal[]>({
    queryKey: ["proposals", "law", lawId],
    queryFn: () => getProposalsForLaw(lawId),
    enabled: !!lawId,
  });
}

export function useProposalsForElement(elementId: string) {
  return useQuery<LawChangeProposal[]>({
    queryKey: ["proposals", "element", elementId],
    queryFn: () => getProposalsForElement(elementId),
    enabled: !!elementId,
  });
}

export function useMyProposals() {
  return useQuery<LawChangeProposal[]>({
    queryKey: ["proposals", "my"],
    queryFn: () => getMyProposals(),
  });
}

export function useProposal(id: string) {
  return useQuery<LawChangeProposal>({
    queryKey: ["proposal", id],
    queryFn: () => getJson<LawChangeProposal>(`/law-change/proposals/${id}`),
    enabled: !!id,
  });
}
