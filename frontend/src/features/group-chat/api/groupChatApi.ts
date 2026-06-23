"use client";

import { getJson, requestJson } from "@/lib/api/_client";
import type { ChatRoom, ChatMessage } from "../types";

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}

export async function getMyRooms(): Promise<ChatRoom[]> {
  return getJson<ChatRoom[]>("/group-chats/my-rooms");
}

export async function getMessages(
  groupId: string,
  before?: string,
  limit = 50,
): Promise<MessagesResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  return getJson<MessagesResponse>(
    `/group-chats/${groupId}/messages?${params}`,
  );
}

export async function markRead(groupId: string): Promise<void> {
  await requestJson<void>(`/group-chats/${groupId}/read`, "POST");
}
