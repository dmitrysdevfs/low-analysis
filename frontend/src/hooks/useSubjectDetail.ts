"use client";

import { useEffect, useState } from "react";
import { getSubjectElements } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Subject, TreeNode } from "@/types";

interface State {
  fetchedId: string | null;
  subject: Subject | null;
  elements: TreeNode[];
  error: string | null;
}

export function useSubjectDetail(id?: string) {
  const [state, setState] = useState<State>({
    fetchedId: null,
    subject: null,
    elements: [],
    error: null,
  });

  const loading = id !== undefined && state.fetchedId !== id;

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    getSubjectElements(id, { signal: controller.signal })
      .then((data) =>
        setState({
          fetchedId: id,
          subject: data.subject,
          elements: data.elements,
          error: null,
        }),
      )
      .catch((error: unknown) => {
        const msg = parseApiError(error);
        if (msg === "__ABORT__") return;
        setState({
          fetchedId: id,
          subject: null,
          elements: [],
          error: msg,
        });
      });

    return () => controller.abort();
  }, [id]);

  return { ...state, loading };
}
