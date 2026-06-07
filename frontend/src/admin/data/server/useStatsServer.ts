"use client";
// ═══════════════════════════════════════════════════════════════════════
//  СЕРВЕРНА РЕАЛІЗАЦІЯ — НЕ ВИДАЛЯТИ
//  Активується: змінити LOCAL_MODE = false в adminConfig.ts
//
//  Використовує: GET /api/laws/:id/stats (endpoint існує та працює)
//  Відповідь: LawStats per law, агрегується у Map<string, LawStats>
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { getLawStats } from "@/lib/api/laws";
import type { LawStats } from "@/types";
import { ADMIN_STATS_CONCURRENCY, STALE_STATS } from "../../config/adminConfig";

void STALE_STATS; // reserved for future cache layer

async function throttledAllSettled<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]() };
      } catch (e) {
        results[i] = { status: "rejected", reason: e };
      }
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    worker,
  );
  await Promise.all(workers);
  return results;
}

export function useStatsServer(lawIds: string[]) {
  const [statsMap, setStatsMap] = useState<Map<string, LawStats>>(new Map());
  const [loading, setLoading] = useState(false);
  const key = lawIds.join(",");
  const prevKey = useRef("");

  useEffect(() => {
    if (!lawIds.length || key === prevKey.current) return;
    prevKey.current = key;
    let cancelled = false;
    setLoading(true);

    const tasks = lawIds.map(
      (id) => () =>
        getLawStats(id).then((stats) => ({ id, stats })),
    );

    throttledAllSettled(tasks, ADMIN_STATS_CONCURRENCY).then((results) => {
      if (cancelled) return;
      const map = new Map<string, LawStats>();
      results.forEach((r) => {
        if (r.status === "fulfilled") map.set(r.value.id, r.value.stats);
      });
      setStatsMap(map);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [key, lawIds]);

  return { statsMap, loading };
}
