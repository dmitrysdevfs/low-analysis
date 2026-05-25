"use client";

import { useEffect, useState } from "react";
import { getLawHeatmap } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { TreeNode } from "@/types";

interface State {
  heatmap: TreeNode[];
  loading: boolean;
  error: string | null;
}

export function useLawHeatmap(id: string | null | undefined) {
  const [state, setState] = useState<State>({
    heatmap: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState({ heatmap: [], loading: true, error: null });

    getLawHeatmap(id, { signal: controller.signal })
      .then((data) => setState({ heatmap: data, loading: false, error: null }))
      .catch((err: unknown) => {
        const msg = parseApiError(err);
        if (msg === "__ABORT__") return;
        setState({ heatmap: [], loading: false, error: msg });
      });

    return () => controller.abort();
  }, [id]);

  return state;
}
