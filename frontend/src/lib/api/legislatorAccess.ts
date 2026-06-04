"use client";

import { getJson } from "./laws";
import { requestJson } from "./_client";
import type { LegislatorAccessRequest } from "@/types/law-change.types";

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
  getJson<LegislatorAccessRequest | null>("/law-change/legislator-requests/my");

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
