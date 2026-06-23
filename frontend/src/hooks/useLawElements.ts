"use client";

import { useQuery } from "@tanstack/react-query";
import { getLawArticles, getArticle } from "@/lib/api/laws";

export function useLawArticles(lawId: string | null) {
  return useQuery({
    queryKey: ["law-articles", lawId],
    queryFn: () => getLawArticles(lawId!),
    enabled: !!lawId,
    staleTime: 5 * 60_000,
  });
}

export function useLawArticleDetail(
  lawId: string | null,
  articleNum: string | null,
) {
  return useQuery({
    queryKey: ["law-article-detail", lawId, articleNum],
    queryFn: () => getArticle(lawId!, articleNum!),
    enabled: !!lawId && !!articleNum,
    staleTime: 5 * 60_000,
  });
}
