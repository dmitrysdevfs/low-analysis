"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSupervisorAnalytics,
  getLegislatorAnalytics,
} from "@/lib/api/analytics";
import type { Period, LegislatorPeriod } from "@/lib/api/analytics";

export function useSupervisorAnalytics(period: Period) {
  return useQuery({
    queryKey: ["supervisor", "analytics", period],
    queryFn: () => getSupervisorAnalytics(period),
    retry: false,
  });
}

export function useLegislatorAnalytics(period: LegislatorPeriod) {
  return useQuery({
    queryKey: ["legislator", "analytics", period],
    queryFn: () => getLegislatorAnalytics(period),
    retry: false,
  });
}
