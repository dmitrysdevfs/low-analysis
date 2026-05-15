"use client";

import { useEffect, useState } from "react";
import { getLaws } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law } from "@/types";

interface State {
  fetchedQ: string | null;
  laws: Law[];
  error: string | null;
}

export function useLaws(q = "", refreshKey = 0) {
  const [state, setState] = useState<State>({
    fetchedQ: null,
    laws: [],
    error: null,
  });

  const loading = state.fetchedQ !== q;

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(
      () => {
        getLaws(q, { signal: controller.signal })
          .then((laws) => setState({ fetchedQ: q, laws, error: null }))
          .catch((error: unknown) => {
            const msg = parseApiError(error);
            if (msg === "__ABORT__") return;
            setState({ fetchedQ: q, laws: [], error: msg });
          });
      },
      q ? 250 : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, refreshKey]);

  return { ...state, loading };
}
