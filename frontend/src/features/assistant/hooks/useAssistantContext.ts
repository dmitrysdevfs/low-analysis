"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { AssistantChatContext } from "../types";

/**
 * Derives the assistant context (mode + law/article IDs) from the current pathname.
 */
export function useAssistantContext(): AssistantChatContext {
  const pathname = usePathname();

  return useMemo((): AssistantChatContext => {
    // /laws/:id/articles/:num
    const articleMatch = pathname.match(/^\/laws\/([^/]+)\/articles\/([^/]+)/);
    if (articleMatch) {
      return {
        mode: "article",
        contextLawId: articleMatch[1],
        contextArticleNum: articleMatch[2],
      };
    }

    // /laws/:id
    const lawMatch = pathname.match(/^\/laws\/([^/]+)/);
    if (lawMatch) {
      return {
        mode: "law",
        contextLawId: lawMatch[1],
      };
    }

    return { mode: "general" };
  }, [pathname]);
}
