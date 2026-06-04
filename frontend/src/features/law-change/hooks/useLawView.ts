"use client";

import { useQuery } from "@tanstack/react-query";
import { getLawView } from "@/lib/api/lawChange";
import type { LawViewResponse } from "@/types/law-change.types";

export function useLawView(lawId: string) {
  const query = useQuery<LawViewResponse>({
    queryKey: ["lawView", lawId],
    queryFn: () => getLawView(lawId),
    enabled: !!lawId,
  });

  return {
    lawView: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
