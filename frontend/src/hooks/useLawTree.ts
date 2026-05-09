"use client";

import { useEffect, useState } from "react";
import { getLawTree } from "@/lib/api";
import type { TreeNode } from "@/types";

interface State {
  fetchedId: string | null;
  tree: TreeNode[];
  error: string | null;
}

export function useLawTree(id?: string) {
  const [state, setState] = useState<State>({
    fetchedId: null,
    tree: [],
    error: null,
  });

  const loading = id !== undefined && state.fetchedId !== id;

  useEffect(() => {
    if (!id) return;

    getLawTree(id)
      .then((tree) => setState({ fetchedId: id, tree, error: null }))
      .catch((error: unknown) =>
        setState({
          fetchedId: id,
          tree: [],
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
  }, [id]);

  return { ...state, loading };
}
