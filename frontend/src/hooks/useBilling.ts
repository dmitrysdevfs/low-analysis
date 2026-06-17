"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBillingPlans, getMyBilling, demoPurchase } from "@/lib/api/billing";

export function useMyBilling() {
  return useQuery({
    queryKey: ["billing", "me"],
    queryFn: getMyBilling,
    retry: false,
    staleTime: 30_000,
  });
}

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getBillingPlans,
    staleTime: 300_000,
  });
}

export function useDemoPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, method }: { planId: string; method?: string }) =>
      demoPurchase(planId, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}
