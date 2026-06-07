"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSupportApi } from "../api/supportApi";
import type { SupportConversationStatus } from "../types";

export function useAdminSupport({
  query,
  status,
  selectedConversationId,
}: {
  query: string;
  status:
    | "all"
    | "open"
    | "waiting_support"
    | "waiting_user"
    | "closed"
    | "unread";
  selectedConversationId: string | null;
}) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["admin-support", "status"],
    queryFn: adminSupportApi.getStatus,
    refetchInterval: 5000,
  });

  const conversationsQuery = useQuery({
    queryKey: ["admin-support", "conversations", query, status],
    queryFn: () => adminSupportApi.listConversations({ query, status }),
    refetchInterval: 4000,
  });

  const conversationQuery = useQuery({
    queryKey: ["admin-support", "conversation", selectedConversationId],
    queryFn: () =>
      adminSupportApi.getConversation(selectedConversationId as string),
    enabled: Boolean(selectedConversationId),
    refetchInterval: selectedConversationId ? 4000 : false,
  });

  const invalidateSupport = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-support", "status"] });
    queryClient.invalidateQueries({
      queryKey: ["admin-support", "conversations"],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin-support", "conversation"],
    });
    queryClient.invalidateQueries({ queryKey: ["support-chat", "current"] });
  };

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      adminSupportApi.sendMessage(id, text),
    onSuccess: invalidateSupport,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminSupportApi.markRead(id),
    onSuccess: invalidateSupport,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
    }: {
      id: string;
      status: SupportConversationStatus;
    }) => adminSupportApi.updateStatus(id, nextStatus),
    onSuccess: invalidateSupport,
  });

  return {
    statusQuery,
    conversationsQuery,
    conversationQuery,
    sendMutation,
    markReadMutation,
    updateStatusMutation,
  };
}
