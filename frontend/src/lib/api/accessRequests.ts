"use client";

import { getJson, requestJson } from "./_client";

export interface AccessRequest {
  _id: string;
  userId:
    | string
    | { _id: string; fullName: string; email: string; role: string };
  status: "pending" | "approved" | "rejected";
  message: string;
  adminNote: string;
  reviewedAt: string | null;
  createdAt: string;
}

export async function getMyAccessRequest(): Promise<AccessRequest | null> {
  return getJson<AccessRequest | null>("/legislator-requests/me");
}

export async function submitAccessRequest(
  message?: string,
): Promise<AccessRequest> {
  return requestJson<AccessRequest>("/legislator-requests", "POST", {
    message: message ?? "",
  });
}

export async function getPendingAccessRequests(): Promise<AccessRequest[]> {
  return getJson<AccessRequest[]>("/legislator-requests");
}

export async function reviewAccessRequest(
  id: string,
  action: "approve" | "reject",
  adminNote?: string,
): Promise<AccessRequest> {
  return requestJson<AccessRequest>(`/legislator-requests/${id}`, "PATCH", {
    action,
    adminNote: adminNote ?? "",
  });
}
