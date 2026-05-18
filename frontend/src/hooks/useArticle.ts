"use client";

import { useEffect, useState } from "react";
import { useGuestLimits } from "@/components/guest/GuestLimitsProvider";
import { getArticle } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import type { TreeNode } from "@/types";

interface State {
  fetchedKey: string | null;
  article: TreeNode | null;
  children: TreeNode[];
  error: string | null;
}

export function useArticle(lawId?: string, num?: string) {
  const { consumeView } = useGuestLimits();
  const [state, setState] = useState<State>({
    fetchedKey: null,
    article: null,
    children: [],
    error: null,
  });

  const currentKey = lawId && num ? `${lawId}:${num}` : null;
  const loading = currentKey !== null && state.fetchedKey !== currentKey;

  useEffect(() => {
    if (!lawId || !num) return;

    const key = `${lawId}:${num}`;
    const controller = new AbortController();
    const guestAttempt = consumeView(`article:${key}`);

    if (!guestAttempt.allowed) {
      setState({
        fetchedKey: key,
        article: null,
        children: [],
        error: guestAttempt.message ?? "Guest deep-view limit reached.",
      });
      return;
    }

    getArticle(lawId, num, { signal: controller.signal })
      .then((data) =>
        setState({
          fetchedKey: key,
          article: data.article,
          children: data.children,
          error: null,
        }),
      )
      .catch((error: unknown) => {
        const msg = parseApiError(error);
        if (msg === "__ABORT__") return;
        setState({
          fetchedKey: key,
          article: null,
          children: [],
          error: msg,
        });
      });

    return () => controller.abort();
  }, [consumeView, lawId, num]);

  return { ...state, loading };
}
