"use client";

import { useEffect, useState } from "react";
import { getSubjects } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Subject } from "@/types";

export function useSubjectsMap(): {
  subjectsMap: Map<string, Subject>;
  loading: boolean;
  error: string | null;
} {
  const [subjectsMap, setSubjectsMap] = useState<Map<string, Subject>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getSubjects({ signal: controller.signal })
      .then((subjects) => {
        const map = new Map<string, Subject>(subjects.map((s) => [s._id, s]));
        setSubjectsMap(map);
        setError(null);
      })
      .catch((err: unknown) => {
        const msg = parseApiError(err);
        if (msg === "__ABORT__") return;
        setError(msg);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { subjectsMap, loading, error };
}
