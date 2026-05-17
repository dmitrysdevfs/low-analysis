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

let subjectsCacheEntry: { data: Subject[]; ts: number } | null = null;
const SUBJECTS_CACHE_TTL = 60_000;

export function useSubjects() {
  const [state, setState] = useState<State>({
    fetched: false,
    subjects: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    if (subjectsCacheEntry && Date.now() - subjectsCacheEntry.ts < SUBJECTS_CACHE_TTL) {
      setState({ fetched: true, subjects: subjectsCacheEntry.data, error: null });
      return;
    }

    getSubjects({ signal: controller.signal })
      .then((subjects) => {
        subjectsCacheEntry = { data: subjects, ts: Date.now() };
        setState({ fetched: true, subjects, error: null });
      })
      .catch((error: unknown) => {
        const msg = parseApiError(error);
        if (msg === "__ABORT__") return;
        setState({ fetched: true, subjects: [], error: msg });
      });

    return () => controller.abort();
  }, []);

  return { ...state, loading: !state.fetched };
}

export function __resetSubjectsCacheForTests() {
  subjectsCacheEntry = null;
}
