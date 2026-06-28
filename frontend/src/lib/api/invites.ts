"use client";

import { getJson, requestJson } from "./_client";

export interface InviteInfo {
  groupId: string;
  groupName: string;
  groupCourse: string;
}

export interface CreateInviteResponse {
  inviteUrl: string;
  token: string;
  expiresAt: string;
}

export interface JoinResponse {
  groupId: string;
  groupName: string;
  alreadyMember: boolean;
}

export interface RegisterAndJoinResponse {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  groupId: string;
  groupName: string;
}

export const getInviteInfo = (token: string) =>
  getJson<InviteInfo>(`/invites/${token}`);

export const joinByInvite = (token: string) =>
  requestJson<JoinResponse>(`/invites/${token}/join`, "POST", {});

export const registerAndJoin = (
  token: string,
  data: { email: string; password: string; fullName: string },
) =>
  requestJson<RegisterAndJoinResponse>(
    `/invites/${token}/register`,
    "POST",
    data,
  );
