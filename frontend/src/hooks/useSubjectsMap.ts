"use client";

import { useEffect, useState } from "react";
import { getSubjects } from "@/lib/api";
import type { Subject } from "@/types";

export function useSubjectsMap(): {
  subjectsMap: Map<string, Subject>;
  loading: boolean;
} {
  const [subjectsMap, setSubjectsMap] = useState<Map<string, Subject>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubjects()
      .then((subjects) => {
        const map = new Map<string, Subject>(subjects.map((s) => [s._id, s]));
        setSubjectsMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { subjectsMap, loading };
}
