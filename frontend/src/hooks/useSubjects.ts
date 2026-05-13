'use client';

import { useEffect, useState } from 'react';
import { getSubjects } from '@/lib/api';
import type { Subject } from '@/types';

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
    getSubjects()
      .then(subjects => setState({ fetched: true, subjects, error: null }))
      .catch((error: unknown) =>
        setState({
          fetched: true,
          subjects: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
  }, []);

  return { ...state, loading: !state.fetched };
}
