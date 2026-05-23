export type CostHint = "light" | "medium" | "heavy" | "critical";

export interface ApiMetricEntry {
  method: string;
  rawUrl: string;
  key: string;
  costHint: CostHint;
  atMs: number;
  page: string;
}

export interface ApiMetricsState {
  entries: ApiMetricEntry[];
  startedAt: number;
}
