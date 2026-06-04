"use client";

import { getJson } from "./laws";
import { fetchWithTimeout } from "@/lib/utils/fetchWithTimeout";
import { readStoredToken } from "@/lib/auth/authClient";
import type { LegislatorAccessRequest } from "@/types/law-change.types";

const API_BASE = "/api";

async function requestJson<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const token = readStoredToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body) headers.set("Content-Type", "application/json");
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// User: submit request for legislator role
export const submitAccessRequest = (data: {
  organization: string;
  reason: string;
}) =>
  requestJson<LegislatorAccessRequest>(
    "/law-change/legislator-requests",
    "POST",
    data,
  );

// User: get my request status
export const getMyAccessRequest = () =>
  getJson<LegislatorAccessRequest | null>(
    "/law-change/legislator-requests/my",
  );

// Admin: get all pending requests
export const getAllAccessRequests = (status?: string) => {
  const q = status ? `?status=${status}` : "";
  return getJson<LegislatorAccessRequest[]>(
    `/law-change/admin/legislator-requests${q}`,
  );
};

// Admin: approve request
export const approveAccessRequest = (id: string, note?: string) =>
  requestJson<LegislatorAccessRequest>(
    `/law-change/admin/legislator-requests/${id}/approve`,
    "POST",
    { note },
  );

// Admin: reject request
export const rejectAccessRequest = (id: string, note?: string) =>
  requestJson<LegislatorAccessRequest>(
    `/law-change/admin/legislator-requests/${id}/reject`,
    "POST",
    { note },
  );

// Admin: directly set user role
export const setUserRole = (userId: string, role: string) =>
  requestJson<{ success: boolean }>(
    `/law-change/admin/users/${userId}/role`,
    "PATCH",
    { role },
  );
