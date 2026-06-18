"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStatsBulk } from "@/lib/api/laws";
import type { LawStats } from "@/types";

export function useStatsServer(lawIds: string[]) {
  const [statsMap, setStatsMap] = useState<Map<string, LawStats>>(new Map());
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const idsKey = lawIds.join(",");
  // Only updated on successful fetch — failed batch doesn't lock out retry
  const prevSuccessKey = useRef("");

  const runFetch = useCallback(async (ids: string[], key: string) => {
    if (!ids.length) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    try {
      const result = await getStatsBulk(ids);
      if (cancelled) return;

      const map = new Map<string, LawStats>(
        Object.entries(result) as [string, LawStats][],
      );
      setStatsMap(map);
      prevSuccessKey.current = key; // Mark done only on success
    } catch (e) {
      if (cancelled) return;
      setFetchError(
        e instanceof Error ? e.message : "Помилка завантаження статистики",
      );
      // prevSuccessKey stays old → same key can retry via retry()
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lawIds.length || idsKey === prevSuccessKey.current) return;
    let cleanup: (() => void) | undefined;
    void runFetch(lawIds, idsKey).then((fn) => {
      cleanup = fn;
    });
    return () => cleanup?.();
  }, [idsKey, lawIds, runFetch]);

  const retry = useCallback(() => {
    prevSuccessKey.current = "";
    void runFetch(lawIds, idsKey);
  }, [idsKey, lawIds, runFetch]);

  return { statsMap, loading, fetchError, retry };
}
