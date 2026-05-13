'use client';

import { useEffect } from 'react';

export function BackendWarmup() {
  useEffect(() => {
    fetch('/api/laws', { method: 'GET', cache: 'no-store' }).catch(() => {});
  }, []);

  return null;
}
