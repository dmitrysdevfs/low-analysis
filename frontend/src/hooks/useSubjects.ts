"use client";

import { useEffect, useState } from "react";
import { getSubjects } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Subject } from "@/types";

interface State {
  fetched: boolean;
  subjects: Subject[];
  error: string | null;
}

export function useSubjects() {
  const [state, setState] = useState<State>({
    fetched: false,
    subjects: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    getSubjects({ signal: controller.signal })
      .then((subjects) => setState({ fetched: true, subjects, error: null }))
      .catch((error: unknown) => {
        const msg = parseApiError(error);
        if (msg === "__ABORT__") return;
        setState({ fetched: true, subjects: [], error: msg });
      });

    return () => controller.abort();
  }, []);

  return { ...state, loading: !state.fetched };
}
