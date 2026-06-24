"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupervisorHistory, getLegislatorHistory } from "@/lib/api/history";
import type {
  SupervisorHistoryParams,
  LegislatorHistoryFilter,
} from "@/lib/api/history";

export function useSupervisorHistory(params: SupervisorHistoryParams) {
  return useQuery({
    queryKey: ["supervisor", "history", params],
    queryFn: () => getSupervisorHistory(params),
    retry: false,
  });
}

export function useLegislatorHistory(type: LegislatorHistoryFilter, page = 1) {
  return useQuery({
    queryKey: ["legislator", "history", type, page],
    queryFn: () => getLegislatorHistory(type, page),
    retry: false,
  });
}
