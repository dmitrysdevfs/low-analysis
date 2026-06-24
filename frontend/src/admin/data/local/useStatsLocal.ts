"use client";

import { useEffect, useRef, useState } from "react";
import { getLawTree } from "@/lib/api";
import { computeStatsFromTree } from "@/lib/tree";
import type { Law } from "@/types";
import type { LawStats } from "@/types";
import { ADMIN_STATS_CONCURRENCY } from "../../config/adminConfig";

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

export function useStatsLocal(laws: Law[]) {
  const [statsMap, setStatsMap] = useState<Map<string, LawStats>>(new Map());
  const [loading, setLoading] = useState(false);
  const lawsKey = laws.map((l) => l._id).join(",");
  const prevKey = useRef("");

  useEffect(() => {
    if (!laws.length || lawsKey === prevKey.current) return;
    prevKey.current = lawsKey;
    let cancelled = false;
    setLoading(true);

    const tasks = laws.map(
      (law) => () =>
        getLawTree(law._id).then((r) => {
          const s = computeStatsFromTree(r.elements);
          if (!s) throw new Error("no risk data in tree");
          return { id: law._id, s };
        }),
    );

    throttledAllSettled(tasks, ADMIN_STATS_CONCURRENCY).then((results) => {
      if (cancelled) return;
      const map = new Map<string, LawStats>();
      results.forEach((r) => {
        if (r.status === "fulfilled") map.set(r.value.id, r.value.s);
      });
      setStatsMap(map);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [lawsKey, laws]);

  return {
    statsMap,
    loading,
    fetchError: null as string | null,
    retry: () => {},
  };
}
