'use client';

import { useEffect, useState } from 'react';
import { getLawTree } from '@/lib/api';
import type { Law, TreeNode } from '@/types';

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

    getLawTree(id)
      .then(response =>
        setState({
          fetchedId: id,
          law: response.law,
          tree: response.elements,
          error: null,
        })
      )
      .catch((error: unknown) =>
        setState({
          fetchedId: id,
          law: null,
          tree: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
  }, [id]);

  return { ...state, loading };
}
