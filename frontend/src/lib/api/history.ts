"use client";

import { getJson } from "@/lib/api/_client";

// ─── Supervisor ───────────────────────────────────────────────────────────────

export type SupervisorEventType =
  | "join"
  | "leave"
  | "approve"
  | "reject"
  | "create_group"
  | "archive_group";

export type SupervisorEventFilter = "all" | SupervisorEventType;

export interface SupervisorHistoryItem {
  id: string;
  date: string;
  type: SupervisorEventType;
  participant: string;
  group: string;
  details: string;
}

export interface SupervisorHistoryResponse {
  items: SupervisorHistoryItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface SupervisorHistoryParams {
  from?: string;
  to?: string;
  type?: SupervisorEventFilter;
  page?: number;
  limit?: number;
}

export const getSupervisorHistory = (
  params: SupervisorHistoryParams = {},
): Promise<SupervisorHistoryResponse> => {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.type && params.type !== "all") q.set("type", params.type);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  return getJson<SupervisorHistoryResponse>(
    `/supervisor/history?${q.toString()}`,
  );
};

// ─── Legislator ───────────────────────────────────────────────────────────────

export type LegislatorHistoryType =
  | "fork_created"
  | "fork_submitted"
  | "proposal_created"
  | "proposal_approved"
  | "proposal_rejected"
  | "amendment_created"
  | "group_joined";

export type LegislatorHistoryFilter = "all" | LegislatorHistoryType;

export interface LegislatorHistoryItem {
  id: string;
  type: LegislatorHistoryType;
  date: string;
  description: string;
  lawId: string;
  lawLabel: string;
  status?: "draft" | "submitted" | "approved" | "rejected";
}

export interface LegislatorHistoryResponse {
  items: LegislatorHistoryItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  kpi: { forks: number; proposals: number; amendments: number };
}

export const getLegislatorHistory = (
  type: LegislatorHistoryFilter = "all",
  page = 1,
): Promise<LegislatorHistoryResponse> => {
  const q = new URLSearchParams({ page: String(page) });
  if (type !== "all") q.set("type", type);
  return getJson<LegislatorHistoryResponse>(`/me/history?${q.toString()}`);
};
