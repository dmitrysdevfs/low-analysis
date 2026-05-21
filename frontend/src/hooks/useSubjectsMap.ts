"use client";

import { useMemo } from "react";
import { useSubjects } from "./useSubjects";
import type { Subject } from "@/types";

export function useSubjectsMap(): {
  subjectsMap: Map<string, Subject>;
  loading: boolean;
  error: string | null;
} {
  const { subjects, loading, error } = useSubjects();
  const subjectsMap = useMemo(
    () => new Map<string, Subject>(subjects.map((s) => [s._id, s])),
    [subjects],
  );
  return { subjectsMap, loading, error };
}
