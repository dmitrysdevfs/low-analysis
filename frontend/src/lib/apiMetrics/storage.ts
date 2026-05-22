import type { ApiMetricEntry, ApiMetricsState } from "./types";

export const METRICS_KEY = "low-analysis.api-metrics";
const MAX_ENTRIES = 500;

function isBrowser() {
  return typeof window !== "undefined";
}

export function readMetrics(): ApiMetricsState {
  if (!isBrowser()) return { entries: [], startedAt: Date.now() };
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return { entries: [], startedAt: Date.now() };
    return JSON.parse(raw) as ApiMetricsState;
  } catch {
    return { entries: [], startedAt: Date.now() };
  }
}

export function appendEntry(entry: ApiMetricEntry) {
  if (!isBrowser()) return;
  try {
    const state = readMetrics();
    const entries = [...state.entries, entry].slice(-MAX_ENTRIES);
    localStorage.setItem(
      METRICS_KEY,
      JSON.stringify({ ...state, entries }),
    );
  } catch {
    // quota exceeded — skip silently
  }
}

export function clearMetrics() {
  if (!isBrowser()) return;
  localStorage.setItem(
    METRICS_KEY,
    JSON.stringify({ entries: [], startedAt: Date.now() }),
  );
}
