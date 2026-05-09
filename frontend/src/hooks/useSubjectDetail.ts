'use client';

import { useEffect, useState } from 'react';
import { getSubjectElements } from '@/lib/api';
import type { Subject, TreeNode } from '@/types';

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

    getSubjectElements(id)
      .then((data) =>
        setState({
          fetchedId: id,
          subject: data.subject,
          elements: data.elements,
          error: null,
        }),
      )
      .catch((error: unknown) =>
        setState({
          fetchedId: id,
          subject: null,
          elements: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
  }, [id]);

  return { ...state, loading };
}
