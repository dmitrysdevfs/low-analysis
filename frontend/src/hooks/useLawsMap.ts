"use client";

import { useMemo } from "react";
import { useLaws } from "./useLaws";
import type { Law } from "@/types";

export function useLawsMap(
  q = "",
  refreshKey = 0,
): {
  lawsMap: Map<string, Law>;
  laws: Law[];
  loading: boolean;
  error: string | null;
} {
  const { laws, loading, error } = useLaws(q, refreshKey);
  const lawsMap = useMemo(() => new Map(laws.map((l) => [l._id, l])), [laws]);
  return { lawsMap, laws, loading, error };
}
