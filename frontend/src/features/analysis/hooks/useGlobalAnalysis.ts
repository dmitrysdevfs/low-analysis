"use client";

import { useMemo } from "react";
import { useLaws } from "@/hooks/useLaws";
import { useSubjects } from "@/hooks/useSubjects";
import { deriveGlobalAnalysis } from "../lib/deriveGlobalAnalysis";

export function useGlobalAnalysis() {
  const { laws, loading: lawsLoading, error: lawsError } = useLaws();
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects();

  const dataset = useMemo(
    () => deriveGlobalAnalysis(laws, subjects),
    [laws, subjects],
  );

  return {
    dataset,
    laws,
    subjects,
    loading: lawsLoading || subjectsLoading,
    error: lawsError ?? subjectsError,
  };
}
