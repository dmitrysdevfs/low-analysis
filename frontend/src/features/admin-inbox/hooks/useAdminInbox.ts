"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminInboxApi } from "../api/adminInboxApi";

type UseAdminInboxOptions = {
  query: string;
  unreadOnly: boolean;
  selectedThreadId: string | null;
};

export function useAdminInbox({
  query,
  unreadOnly,
  selectedThreadId,
}: UseAdminInboxOptions) {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["admin-inbox", "status"],
    queryFn: adminInboxApi.getStatus,
  });

  const threadsQuery = useQuery({
    queryKey: ["admin-inbox", "threads", query, unreadOnly],
    queryFn: () => adminInboxApi.listThreads({ query, unread: unreadOnly }),
  });

  const threadQuery = useQuery({
    queryKey: ["admin-inbox", "thread", selectedThreadId],
    queryFn: () => adminInboxApi.getThread(selectedThreadId as string),
    enabled: Boolean(selectedThreadId),
  });

  const invalidateInbox = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-inbox", "status"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-inbox", "threads"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-inbox", "thread"] }),
    ]);
  };

  const connectMutation = useMutation({
    mutationFn: (returnTo: string) => adminInboxApi.startConnect(returnTo),
  });

  const disconnectMutation = useMutation({
    mutationFn: adminInboxApi.disconnect,
    onSuccess: invalidateInbox,
  });

  const syncMutation = useMutation({
    mutationFn: adminInboxApi.sync,
    onSuccess: invalidateInbox,
  });

  const markReadMutation = useMutation({
    mutationFn: (threadId: string) => adminInboxApi.markRead(threadId),
    onSuccess: invalidateInbox,
  });

  const replyMutation = useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      adminInboxApi.reply(threadId, body),
    onSuccess: invalidateInbox,
  });

  const composeMutation = useMutation({
    mutationFn: (payload: { to: string; subject: string; body: string }) =>
      adminInboxApi.compose(payload),
    onSuccess: invalidateInbox,
  });

  return useMemo(
    () => ({
      statusQuery,
      threadsQuery,
      threadQuery,
      connectMutation,
      disconnectMutation,
      syncMutation,
      markReadMutation,
      replyMutation,
      composeMutation,
    }),
    [
      statusQuery,
      threadsQuery,
      threadQuery,
      connectMutation,
      disconnectMutation,
      syncMutation,
      markReadMutation,
      replyMutation,
      composeMutation,
    ],
  );
}
