"use client";

import { getJson } from "@/lib/api/_client";

export type Period = "month" | "3m" | "6m" | "year";
export type LegislatorPeriod = "month" | "3m" | "6m";

export interface SupervisorAnalytics {
  kpi: {
    activeLegislators: number;
    approvalsThisPeriod: number;
    groups: { total: number; active: number };
    totalForks: number;
    totalProposals: number;
    approvalRate: number;
    activeCount: number;
  };
  weeklyActivity: {
    week: string;
    forks: number;
    proposals: number;
    amendments: number;
  }[];
  topLegislators: {
    name: string;
    forks: number;
    proposals: number;
    approved: number;
  }[];
  lawCoverage: { law: string; forks: number; proposals: number }[];
}

export interface LegislatorAnalytics {
  stats: {
    forks: number;
    proposals: number;
    amendments: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  approvalRate: number;
  total: number;
  mostActive: { label: string; count: number };
  weeklyActivity: { week: string; actions: number }[];
  comparison: { myScore: number; groupAvg: number; platformAvg: number };
  portfolio: { approved: number; rejected: number; pending: number };
}

export const getSupervisorAnalytics = (
  period: Period,
): Promise<SupervisorAnalytics> =>
  getJson<SupervisorAnalytics>(`/supervisor/analytics?period=${period}`);

export const getLegislatorAnalytics = (
  period: LegislatorPeriod,
): Promise<LegislatorAnalytics> =>
  getJson<LegislatorAnalytics>(`/me/analytics?period=${period}`);
