"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyRooms } from "../api/groupChatApi";
import type { ChatRoom } from "../types";

export const ROOMS_KEY = ["chat-rooms"] as const;

export function useGroupChatRooms() {
  return useQuery<ChatRoom[]>({
    queryKey: ROOMS_KEY,
    queryFn: getMyRooms,
    staleTime: 30_000,
    retry: false,
  });
}

export function useInvalidateRooms() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ROOMS_KEY });
}
