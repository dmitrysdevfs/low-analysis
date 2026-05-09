'use client';

import { useEffect, useState } from 'react';
import { getArticle } from '@/lib/api';
import type { TreeNode } from '@/types';

interface State {
  fetchedKey: string | null;
  article: TreeNode | null;
  children: TreeNode[];
  error: string | null;
}

export function useArticle(lawId?: string, num?: string) {
  const [state, setState] = useState<State>({
    fetchedKey: null,
    article: null,
    children: [],
    error: null,
  });

  const currentKey = lawId && num ? `${lawId}:${num}` : null;
  const loading = currentKey !== null && state.fetchedKey !== currentKey;

  useEffect(() => {
    if (!lawId || !num) return;

    const key = `${lawId}:${num}`;

    getArticle(lawId, num)
      .then((data) =>
        setState({
          fetchedKey: key,
          article: data.article,
          children: data.children,
          error: null,
        }),
      )
      .catch((error: unknown) =>
        setState({
          fetchedKey: key,
          article: null,
          children: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
  }, [lawId, num]);

  return { ...state, loading };
}
