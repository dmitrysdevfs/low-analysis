"use client";

import { useState, useCallback, useEffect } from "react";
import { getMessages, markRead } from "../api/groupChatApi";
import type { ChatMessage } from "../types";

export function useGroupChatMessages(groupId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial messages when groupId changes
  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setHasMore(false);
      return;
    }
    setIsLoading(true);
    setMessages([]);
    getMessages(groupId)
      .then(({ messages: msgs, hasMore: more }) => {
        setMessages(msgs);
        setHasMore(more);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    markRead(groupId).catch(() => {});
  }, [groupId]);

  // Append a single new message (called from WS handler)
  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // Replace optimistic if matching
      if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Replace optimistic message with real one
  const confirmOptimistic = useCallback(
    (optimisticId: string, realMsg: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === optimisticId ? realMsg : m)),
      );
    },
    [],
  );

  // Add optimistic message before WS response
  const addOptimistic = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Load older messages (scroll up)
  const loadMore = useCallback(async () => {
    if (!groupId || !hasMore || isLoading) return;
    const oldest = messages[0]?.createdAt;
    if (!oldest) return;
    setIsLoading(true);
    try {
      const { messages: older, hasMore: more } = await getMessages(
        groupId,
        oldest,
      );
      setMessages((prev) => [...older, ...prev]);
      setHasMore(more);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [groupId, hasMore, isLoading, messages]);

  return {
    messages,
    hasMore,
    isLoading,
    appendMessage,
    confirmOptimistic,
    addOptimistic,
    loadMore,
  };
}
