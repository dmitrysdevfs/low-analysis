"use client";

import { useEffect, useState } from "react";
import { getLawStats } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { LawStats } from "@/types";

interface State {
  fetchedId: string | null;
  stats: LawStats | null;
  error: string | null;
}

export function useLawStats(id?: string) {
  const [state, setState] = useState<State>({
    fetchedId: null,
    stats: null,
    error: null,
  });

  const loading = id !== undefined && state.fetchedId !== id;

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    getLawStats(id, { signal: controller.signal })
      .then((stats) => setState({ fetchedId: id, stats, error: null }))
      .catch((err: unknown) => {
        const msg = parseApiError(err);
        if (msg === "__ABORT__") return;
        setState({ fetchedId: id, stats: null, error: msg });
      });

    return () => controller.abort();
  }, [id]);

  return { ...state, loading };
}
