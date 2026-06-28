"use client";

import { getJson, requestJson } from "./_client";

export interface GroupMember {
  userId: { _id: string; fullName: string; email: string } | string;
  joinedAt: string;
  status: "active" | "suspended";
}

export interface Group {
  _id: string;
  name: string;
  course: string;
  supervisorId: { _id: string; fullName: string; email: string } | string;
  members: GroupMember[];
  trackedLaws: Array<{ _id: string; title: string; code: string } | string>;
  maxMembers: number;
  status: "active" | "closed" | "archived";
  visibility: "public" | "invite_only";
  createdAt: string;
  updatedAt: string;
}

export interface GroupRequest {
  _id: string;
  groupId: string;
  userId: { _id: string; fullName: string; email: string } | string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  message?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface GroupActivity {
  recentForks: unknown[];
  recentProposals: unknown[];
  members: unknown[];
}

export const getPublicGroups = () =>
  getJson<{ groups: Group[]; total: number; page: number; limit: number }>(
    "/groups",
  ).then((r) => r.groups);
export const getMyGroups = () => getJson<Group[]>("/groups/my");
export const getGroupById = (id: string) => getJson<Group>(`/groups/${id}`);
export const createGroup = (data: {
  name: string;
  course?: string;
  maxMembers?: number;
  visibility?: string;
  trackedLaws?: string[];
}) => requestJson<Group>("/groups", "POST", data);
export const updateGroup = (id: string, data: Partial<Group>) =>
  requestJson<Group>(`/groups/${id}`, "PATCH", data);
export const archiveGroup = (id: string) =>
  requestJson<void>(`/groups/${id}`, "DELETE");
export const getGroupRequests = (groupId: string) =>
  getJson<GroupRequest[]>(`/groups/${groupId}/requests`);
export const reviewRequest = (
  groupId: string,
  reqId: string,
  action: "approve" | "reject",
) =>
  requestJson<GroupRequest>(`/groups/${groupId}/requests/${reqId}`, "PATCH", {
    action,
  });
export const removeMember = (groupId: string, memberId: string) =>
  requestJson<void>(`/groups/${groupId}/members/${memberId}`, "DELETE");
export const getGroupActivity = (groupId: string) =>
  getJson<GroupActivity>(`/groups/${groupId}/activity`);
export const submitRequest = (groupId: string, message?: string) =>
  requestJson<GroupRequest>(`/groups/${groupId}/requests`, "POST", { message });
export const cancelRequest = (groupId: string, reqId: string) =>
  requestJson<void>(`/groups/${groupId}/requests/${reqId}`, "DELETE");
export const getMyRequests = () =>
  getJson<GroupRequest[]>("/groups/my-requests");

export const createInvite = (groupId: string) =>
  requestJson<{ inviteUrl: string; token: string; expiresAt: string }>(
    `/groups/${groupId}/invite`,
    "POST",
    {},
  );
