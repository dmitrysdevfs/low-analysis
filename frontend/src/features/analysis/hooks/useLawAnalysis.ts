"use client";

import { useMemo } from "react";
import { useLawStats } from "@/hooks/useLawStats";
import { useLawTree } from "@/hooks/useLawTree";
import { useSubjectsMap } from "@/hooks/useSubjectsMap";
import { deriveLawAnalysis } from "../lib/deriveLawAnalysis";
import type { FactorBand } from "../types";
import type { RiskLevel } from "@/lib/tree";

interface Filters {
  query?: string;
  risk?: "all" | RiskLevel;
  factorBand?: "all" | FactorBand;
  article?: "all" | string;
  subjectsThreshold?: number;
}

export function useLawAnalysis(lawId?: string, filters?: Filters) {
  const { law, tree, loading: treeLoading, error: treeError } = useLawTree(lawId);
  const { stats, loading: statsLoading, error: statsError } = useLawStats(lawId);
  const {
    subjectsMap,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjectsMap();

  const dataset = useMemo(() => {
    if (!law) return null;
    return deriveLawAnalysis(law, tree, stats, subjectsMap, filters);
  }, [filters, law, stats, subjectsMap, tree]);

  return {
    law,
    tree,
    stats,
    subjectsMap,
    dataset,
    loading: treeLoading || statsLoading || subjectsLoading,
    error: treeError ?? statsError ?? subjectsError,
  };
}
