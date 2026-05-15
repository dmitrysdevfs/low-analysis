"use client";

import { useEffect, useState } from "react";
import { getLawTree } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { Law, TreeNode } from "@/types";

interface State {
  fetchedId: string | null;
  law: Law | null;
  tree: TreeNode[];
  error: string | null;
}

export function useLawTree(id?: string) {
  const [state, setState] = useState<State>({
    fetchedId: null,
    law: null,
    tree: [],
    error: null,
  });

  const loading = id !== undefined && state.fetchedId !== id;

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    getLawTree(id, { signal: controller.signal })
      .then((response) =>
        setState({
          fetchedId: id,
          law: response.law,
          tree: response.elements,
          error: null,
        }),
      )
      .catch((error: unknown) => {
        const msg = parseApiError(error);
        if (msg === "__ABORT__") return;
        setState({
          fetchedId: id,
          law: null,
          tree: [],
          error: msg,
        });
      });

    return () => controller.abort();
  }, [id]);

  return { ...state, loading };
}
