"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportApi } from "../api/supportApi";
import type { SupportSendPayload } from "../types";

export function useSupportChat({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ["support-chat", "config"],
    queryFn: supportApi.getConfig,
    enabled,
    staleTime: 60_000,
  });

  const conversationQuery = useQuery({
    queryKey: ["support-chat", "current"],
    queryFn: supportApi.getCurrentConversation,
    enabled: enabled && configQuery.data?.enabled !== false,
    refetchInterval: enabled ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: SupportSendPayload) => supportApi.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-chat", "current"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => supportApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-chat", "current"] });
    },
  });

  return {
    configQuery,
    conversationQuery,
    sendMutation,
    markReadMutation,
  };
}
