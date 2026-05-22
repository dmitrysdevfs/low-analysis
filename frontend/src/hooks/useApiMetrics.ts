"use client";

import { useCallback, useEffect, useState } from "react";
import { readMetrics, clearMetrics } from "@/lib/apiMetrics/storage";
import type { ApiMetricEntry, ApiMetricsState, CostHint } from "@/lib/apiMetrics/types";

export type MetricsSource = "live" | "backend";

export interface AggregatedEndpoint {
  key: string;
  method: string;
  normalizedPath: string;
  count: number;
  costHint: CostHint;
  pages: string[];
  lastSeenMs: number;
}

export interface ApiMetricsResult {
  source: MetricsSource;
  setSource: (s: MetricsSource) => void;
  entries: ApiMetricEntry[];
  aggregated: AggregatedEndpoint[];
  duplicates: AggregatedEndpoint[];
  totalRequests: number;
  startedAt: number;
  lastUpdatedAt: number;
  clear: () => void;
  backendError?: string;
}

function aggregate(entries: ApiMetricEntry[]): AggregatedEndpoint[] {
  const map = new Map<string, AggregatedEndpoint>();
  for (const entry of entries) {
    const existing = map.get(entry.key);
    if (existing) {
      existing.count++;
      if (!existing.pages.includes(entry.page)) existing.pages.push(entry.page);
      existing.lastSeenMs = Math.max(existing.lastSeenMs, entry.atMs);
    } else {
      const spaceIdx = entry.key.indexOf(" ");
      map.set(entry.key, {
        key: entry.key,
        method: entry.method,
        normalizedPath: entry.key.slice(spaceIdx + 1),
        count: 1,
        costHint: entry.costHint,
        pages: [entry.page],
        lastSeenMs: entry.atMs,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function useApiMetrics(): ApiMetricsResult {
  const [source, setSource] = useState<MetricsSource>("live");
  const [state, setState] = useState<ApiMetricsState>(() => ({
    entries: [],
    startedAt: Date.now(),
  }));
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
  const [backendError, setBackendError] = useState<string | undefined>();

  // Live mode: poll localStorage every 2s
  useEffect(() => {
    if (source !== "live") return;
    const sync = () => {
      setState(readMetrics());
      setLastUpdatedAt(Date.now());
    };
    sync();
    const id = setInterval(sync, 2000);
    return () => clearInterval(id);
  }, [source]);

  // Backend mode: fetch /api/admin/metrics — endpoint not yet implemented, do not remove
  useEffect(() => {
    if (source !== "backend") return;
    setBackendError(undefined);

    fetch("/api/admin/metrics")
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = (await res.json()) as ApiMetricsState;
        setState(data);
        setLastUpdatedAt(Date.now());
      })
      .catch((err: unknown) => {
        setBackendError(
          err instanceof Error
            ? err.message
            : "Помилка підключення до бекенду",
        );
      });
  }, [source]);

  const clear = useCallback(() => {
    clearMetrics();
    setState({ entries: [], startedAt: Date.now() });
  }, []);

  const aggregated = aggregate(state.entries);
  const duplicates = aggregated.filter((e) => e.count > 1);

  return {
    source,
    setSource,
    entries: state.entries,
    aggregated,
    duplicates,
    totalRequests: state.entries.length,
    startedAt: state.startedAt,
    lastUpdatedAt,
    clear,
    backendError,
  };
}
