"use client";

import { readStoredSession, readStoredToken } from "@/lib/auth/authClient";

type ActivityEventType = "page_view" | "search" | "law_view";

interface ActivityPayload {
  type: ActivityEventType;
  path?: string;
  query?: string;
  lawId?: string;
  meta?: Record<string, unknown>;
}

async function sendActivity(payload: ActivityPayload): Promise<void> {
  // Guard: skip if user is not logged in (no session = guest)
  const session = readStoredSession();
  if (!session) return;

  const token = readStoredToken(); // null for cookie-based sessions
  await fetch("/api/activity", {
    method: "POST",
    credentials: "include", // sends httpOnly cookie if present
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
