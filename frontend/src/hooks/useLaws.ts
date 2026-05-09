'use client';

import { useEffect, useState } from 'react';
import { getLaws } from '@/lib/api';
import type { Law } from '@/types';

interface State {
  fetchedQ: string | null;
  laws: Law[];
  error: string | null;
}

export function useLaws(q = '') {
  const [state, setState] = useState<State>({
    fetchedQ: null,
    laws: [],
    error: null,
  });

  const loading = state.fetchedQ !== q;

  useEffect(() => {
    const timer = setTimeout(() => {
      getLaws(q)
        .then((laws) => setState({ fetchedQ: q, laws, error: null }))
        .catch((error: unknown) =>
          setState({
            fetchedQ: q,
            laws: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
    }, q ? 250 : 0);

    return () => clearTimeout(timer);
  }, [q]);

  return { ...state, loading };
}
