"use client";

import { getJson } from "./_client";

export interface ChangeEntry {
  _id: string;
  type: "fork" | "proposal" | "amendment";
  title: string;
  lawTitle: string;
  lawCode: string;
  status: "draft" | "review" | "approved" | "rejected" | null;
  authorName?: string;
  createdAt: string;
}

export async function getMyChanges(): Promise<ChangeEntry[]> {
  return getJson<ChangeEntry[]>("/me/changes");
}

export async function getSupervisorChanges(): Promise<ChangeEntry[]> {
  return getJson<ChangeEntry[]>("/supervisor/changes");
}
