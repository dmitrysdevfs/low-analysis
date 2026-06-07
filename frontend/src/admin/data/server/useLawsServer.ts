"use client";
// ═══════════════════════════════════════════════════════════════════════
//  СЕРВЕРНА РЕАЛІЗАЦІЯ — НЕ ВИДАЛЯТИ
//  Активується: змінити LOCAL_MODE = false в adminConfig.ts
//
//  Потребує бекенд:
//    GET /api/laws?q=&limit=100
//    Відповідь: Law[] або { data: Law[] }
// ═══════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { getLaws } from "@/lib/api/laws";
import { STALE_LAWS } from "../../config/adminConfig";

export function useLawsServer(opts?: { q?: string }) {
  const query = useQuery({
    queryKey: ["admin", "laws", opts?.q ?? ""],
    queryFn: () => getLaws(opts?.q ?? ""),
    staleTime: STALE_LAWS,
  });

  return {
    laws: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
  };
}
