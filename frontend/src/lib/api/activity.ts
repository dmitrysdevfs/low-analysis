"use client";

import { readStoredToken } from "@/lib/auth/authClient";

type ActivityEventType = "page_view" | "search" | "law_view";

interface ActivityPayload {
  type: ActivityEventType;
  path?: string;
  query?: string;
  lawId?: string;
  meta?: Record<string, unknown>;
}

async function sendActivity(payload: ActivityPayload): Promise<void> {
  const token = readStoredToken();
  if (!token) return;
  await fetch("/api/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export const trackPageView = (path: string): Promise<void> =>
  sendActivity({ type: "page_view", path });

export const trackSearch = (query: string): Promise<void> =>
  sendActivity({ type: "search", query });

export const trackLawView = (lawId: string): Promise<void> =>
  sendActivity({ type: "law_view", lawId });
